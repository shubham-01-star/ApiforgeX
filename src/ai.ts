import { AppSchema } from './types.js';

const SYSTEM_PROMPT = `
You are an expert Backend Architect.
Your task is to convert a natural language description into a strict JSON schema for a database.
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
  ]
}
`;

export async function generateSchema(prompt: string, dbType: string): Promise<AppSchema> {
  try {
    // Check if Ollama is running locally
    const isOllamaAvailable = await checkOllamaHealth();

    if (isOllamaAvailable) {
      console.log("   🧠 Consulting the AI Architect (Ollama)...");
      return await callOllama(prompt, dbType);
    } else {
      throw new Error("Ollama unavailable");
    }

  } catch (error) {
    console.warn("   ⚠️  AI Offline or Failed. Using Fallback Mock Schema.");
    return getMockSchema(prompt, dbType);
  }
}

async function checkOllamaHealth(): Promise<boolean> {
  try {
    const res = await fetch('http://127.0.0.1:11434/api/tags');
    return res.ok;
  } catch {
    return false;
  }
}

async function callOllama(prompt: string, dbType: string): Promise<AppSchema> {
  const response = await fetch('http://127.0.0.1:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: "llama3.2", // Ensure you have this model pulled: `ollama pull llama3.2`
      prompt: `${SYSTEM_PROMPT}\n\nUser Request: ${prompt}\nDatabase: ${dbType}\nJSON Output:`,
      stream: false,
      format: "json"
    })
  });

  if (!response.ok) throw new Error("Ollama API Error");

  const data = await response.json() as any;
  const schema = JSON.parse(data.response);
  
  // Force the user-selected DB type, just in case AI got creative
  schema.databaseType = dbType;
  return schema;
}

function getMockSchema(prompt: string, dbType: string): AppSchema {
  // Simple heuristic mock for testing without AI
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
      },
      {
        name: "Post",
        fields: [
          { name: "title", type: "String", required: true },
          { name: "content", type: "String", required: true },
          { name: "published", type: "Boolean", required: false }
        ]
      }
    ]
  };
}