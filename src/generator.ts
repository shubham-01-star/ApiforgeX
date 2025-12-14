import fs from 'fs/promises';
import path from 'path';
import handlebars from 'handlebars';
import { fileURLToPath } from 'url';
import { AppSchema } from './types.js';

import { generateFileContent } from './ai.js';

// Fix for __dirname in ESM modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Register Handlebars Helper for Logic
handlebars.registerHelper('eq', function (a, b) {
  return a === b;
});

// Template directory logic
export async function generateProject(schema: AppSchema, outputDir: string) {
  // FIX for dist/ vs src/ execution
  let templateDir = path.join(__dirname, 'templates');

  // If templates not found in current dir, check if we are in 'dist' and need to go back to src
  try {
    await fs.access(templateDir);
  } catch {
    // Try resolving relative to project root
    // If we are in /dist/src, we want /src/templates
    const fallbackDir = path.resolve(__dirname, '../../src/templates');
    try {
      await fs.access(fallbackDir);
      templateDir = fallbackDir;
    } catch {
      console.warn(`⚠️ Warning: Templates not found in ${templateDir} or ${fallbackDir}`);
    }
  }

  // 1. Create Project Directories (Enterprise MVC Structure)
  console.log(`\n📂 Creating Enterprise MVC structure in: ${outputDir}`);
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(path.join(outputDir, 'src'), { recursive: true });
  await fs.mkdir(path.join(outputDir, 'src/config'), { recursive: true });
  await fs.mkdir(path.join(outputDir, 'src/controllers'), { recursive: true });
  await fs.mkdir(path.join(outputDir, 'src/services'), { recursive: true });
  await fs.mkdir(path.join(outputDir, 'src/routes'), { recursive: true });
  await fs.mkdir(path.join(outputDir, 'src/middleware'), { recursive: true });
  await fs.mkdir(path.join(outputDir, 'src/utils'), { recursive: true });
  await fs.mkdir(path.join(outputDir, 'prisma'), { recursive: true });

  // 2. Helper to generate a file from a template
  const generateFile = async (templateName: string, outputFile: string, data: any) => {
    try {
      const templatePath = path.join(templateDir, templateName);

      // Check if template exists
      try {
        await fs.access(templatePath);
      } catch {
        console.warn(`   ⚠️  Template ${templateName} not found. Skipping.`);
        return;
      }

      const templateContent = await fs.readFile(templatePath, 'utf-8');
      const compiledTemplate = handlebars.compile(templateContent);
      const result = compiledTemplate(data);
      await fs.writeFile(path.join(outputDir, outputFile), result);
      console.log(`   ✅ Created ${outputFile}`);
    } catch (error) {
      console.error(`   ❌ Error generating ${outputFile}:`, error);
    }
  };

  // 3. Prepare Data
  const enrichedSchema = {
    ...schema,
    entities: schema.entities.map(e => ({
      ...e,
      lowerName: e.name.toLowerCase()
    }))
  };

  // 4. Generate Core Config & Infrastructure Files
  await fs.mkdir(path.join(outputDir, '.github/workflows'), { recursive: true });
  await generateFile('ci.yml.hbs', '.github/workflows/ci.yml', enrichedSchema);
  await generateFile('gitignore.hbs', '.gitignore', enrichedSchema);
  // await generateFile('gitignore.hbs', '.gitignore', enrichedSchema);
  await generateFile('coderabbit.yaml.hbs', '.coderabbit.yaml', enrichedSchema);
  await generateFile('eslintrc.hbs', '.eslintrc.json', enrichedSchema);
  await generateFile('package.json.hbs', 'package.json', enrichedSchema);
  await generateFile('tsconfig.json.hbs', 'tsconfig.json', enrichedSchema);
  await generateFile('prisma.hbs', 'prisma/schema.prisma', enrichedSchema);
  await generateFile('server.hbs', 'src/index.ts', enrichedSchema);

  // 5. Generate Environment & DB Config
  await generateFile('env.hbs', '.env', enrichedSchema);
  await generateFile('env.hbs', '.env.example', enrichedSchema);
  await generateFile('db.config.hbs', 'src/config/db.config.ts', enrichedSchema);

  // 6. Generate MVC Base Files
  await generateFile('middleware.hbs', 'src/middleware/error.middleware.ts', enrichedSchema);
  await generateFile('util.hbs', 'src/utils/response.util.ts', enrichedSchema);

  // 7. Generate Deployment Config Files
  await generateFile('vercel.hbs', 'vercel.json', enrichedSchema);

  // 7. Generate Modules (Controller, Service, Routes for each Entity)
  for (const entity of enrichedSchema.entities) {
    // Controller
    await generateFile(
      'controller.hbs',
      `src/controllers/${entity.lowerName}.controller.ts`,
      entity
    );

    // Service
    await generateFile(
      'service.hbs',
      `src/services/${entity.lowerName}.service.ts`,
      entity
    );

    // Routes
    await generateFile(
      'route.hbs',
      `src/routes/${entity.lowerName}.routes.ts`,
      entity
    );
  }

  // 8. Generate Documentation (NEW)
  await generateFile('readme.hbs', 'README.md', enrichedSchema);

  // 9. Generate Dynamic Custom Files (NEW)
  if (schema.additionalFiles && schema.additionalFiles.length > 0) {
    console.log(`\n🧠 Generating ${schema.additionalFiles.length} custom files based on requirements...`);
    for (const file of schema.additionalFiles) {
      const filePath = path.join(outputDir, file.path);
      const dir = path.dirname(filePath);

      await fs.mkdir(dir, { recursive: true });

      console.log(`   ⏳ Generating content for: ${file.path}`);
      const content = await generateFileContent(file.path, file.description, schema);
      await fs.writeFile(filePath, content);
      console.log(`   ✅ Created ${file.path}`);
    }
  }

  console.log(`\n🎉 Enterprise Project ${schema.projectName} created successfully!`);
}