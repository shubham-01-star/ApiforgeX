import { AppSchema } from './types.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_PROMPT = `
You are an expert Backend Architect.
Your task is to convert a natural language description into a strict JSON schema for a database AND suggest necessary project files.
Rules:
1. Return ONLY raw JSON. No markdown, no explanations.
2. Supported types: String, Int, Boolean, DateTime, Float.
3. Structure must match:
{
  "projectName": "string",
  "databaseType": "postgresql",
  "entities": [
    {
      "name": "string (PascalCase)",
      "fields": [
        { "name": "string (camelCase)", "type": "String", "required": true }
      ]
    }
  ],
  "additionalFiles": [
    { "path": "src/services/payment.service.ts", "description": "Handles Stripe integration logic based on user request" }
  ]
}
`;

const CONTENT_GEN_PROMPT = `
You are an expert Senior Software Engineer.
Your task is to Write the Code for a specific file based on its description and the project schema.
Rules:
1. Return ONLY the raw code. No markdown blocks.
2. Use modern TypeScript and Best Practices.
3. **Architecture**: Express.js + Prisma ORM (Not NestJS or TypeORM).
4. **Imports**: Use standard relative imports. Import \`prisma\` from \`../config/db.config\`.

CRITICAL EXPRESS/PRISMA RULES:
- **Services**: Export individual async functions (e.g., \`export const create = async ...\`), DO NOT use Classes.
- **Controllers**: Export individual async functions taking (req, res, next).
- **Prisma**: Use \`prisma.entityName.method()\` (camelCase).
- **No Decorators**: Do not use @decorators.
- **Syntax**: Ensure clean, modular code compatible with the generated MVC structure.
`;

// Helper to sanitize AI output (remove markdown fences)
function cleanAIOutput(text: string): string {
  let clean = text.trim();
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```[a-z]*\n/, '').replace(/```$/, ''); // Remove first code fence line and last fence
  }
  return clean.trim();
}

/**
 * Universal Generate Function: Tries Gemini, Falls back to Ollama
 */
export async function generateText(prompt: string, modelType: 'json' | 'text' = 'text'): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;

  if (geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      // Fallback to stable Pro model
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return cleanAIOutput(response.text());
    } catch (error) {
      console.warn("⚠️  Gemini Error, falling back to Ollama:", error);
    }
  }

  // Fallback Code (Ollama or Mock for Demo)
  try {
    return await generateWithOllama(prompt, modelType);
  } catch (e) {
    console.warn("⚠️  All AI Providers Failed. Using Emergency Mock for Demo.");
    if (modelType === 'json') {
      return JSON.stringify({
        projectName: "hospital-sys-demo",
        databaseType: "postgresql",
        entities: [
          { name: "Patient", fields: [{ name: "name", type: "String", required: true }] },
          { name: "Doctor", fields: [{ name: "specialization", type: "String", required: true }] }
        ],
        additionalFiles: []
      });
    }
    return "// AI Service Unavailable. Here is a mock implementation.\nexport class GeneratedService {}";
  }
}
async function generateWithOllama(prompt: string, format: 'json' | 'text'): Promise<string> {
  const host = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
  try {
    const response = await fetch(`${host}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "llama3.2",
        prompt: prompt,
        stream: false,
        format: format === 'json' ? 'json' : undefined
      })
    });

    if (!response.ok) throw new Error("Ollama API Error");
    const data = await response.json() as any;
    return cleanAIOutput(data.response);
  } catch (e) {
    throw new Error("All AI Providers Failed. Is Ollama running?");
  }
}

export async function generateFileContent(filePath: string, description: string, schema: AppSchema): Promise<string> {
  const prompt = `${CONTENT_GEN_PROMPT}\n\nPROJECT SCHEMA: ${JSON.stringify(schema)}\n\nFILE TO GENERATE: ${filePath}\nDESCRIPTION: ${description}\n\nCODE:`;
  try {
    return await generateText(prompt, 'text');
  } catch (error) {
    console.error(`❌ Failed to generate content for ${filePath}`, error);
    return `// Error generating content: ${error}`;
  }
}

const REFINE_SYSTEM_PROMPT = `
You are an expert Senior Software Engineer.
Your task is to FIX code based on a specific Code Review Comment or Suggestion.

CRITICAL INSTRUCTIONS:
1. You MUST explicitly address the issue described in the 'ISSUE' section.
2. If the issue suggests a specific change (e.g. "change color to blue", "add validation"), you MUST implement that EXACT change.
3. Return ONLY the fully corrected file content.
4. Do NOT add markdown blocks (like \`\`\`typescript), just raw code.
5. Maintain existing style and imports.
`;

export async function refineCodeWithAI(code: string, issue: string): Promise<string> {
  const prompt = `${REFINE_SYSTEM_PROMPT}\n\nISSUE: ${issue}\n\nBROKEN CODE:\n${code}\n\nFIXED CODE:`;
  try {
    return await generateText(prompt, 'text');
  } catch {
    return code;
  }
}

export async function generateSchema(prompt: string, dbType: string): Promise<AppSchema> {
  console.log(`   ✨ Consulting the ApiforgeX Architect (${process.env.GEMINI_API_KEY ? 'Gemini' : 'Llama'})...`);

  // For Gemini, we might need to be more explicit about JSON structure in prompt if 'json' mode isn't perfect, 
  // but 1.5 Flash is good at it.
  const fullPrompt = `${SYSTEM_PROMPT}\n\nUser Request: ${prompt}\nDatabase: ${dbType}\nJSON Output:`;

  try {
    const jsonStr = await generateText(fullPrompt, 'json');
    const schema = JSON.parse(jsonStr);
    schema.databaseType = dbType; // Enforcement
    return schema;
  } catch (error) {
    console.warn("   ⚠️  AI Generation Failed. Returning mock schema.");
    return getMockSchema(prompt, dbType);
  }
}

function getMockSchema(prompt: string, dbType: string): AppSchema {
  return {
    projectName: "generated-api",
    databaseType: dbType as any,
    entities: [
      {
        name: "User",
        fields: [
          { name: "email", type: "String", required: true },
          { name: "name", type: "String", required: false },
          { name: "role", type: "String", required: true }
        ]
      }
    ]
  };
}
