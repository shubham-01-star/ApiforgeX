import { generateText } from './ai.js';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { execSync } from 'child_process';

const FIXER_SYSTEM_PROMPT = `
You are an expert Senior Software Engineer specializing in debugging and fixing TypeScript/Node.js applications.
Your task is to ANALYZE the provided build errors and RETURN CORRECTED CODE for ALL affected files.

Rules:
1. You will be given a list of ERROR LOGS and the path to the PROJECT.
2. You must return a JSON response containing the fixes.
3. The response format must be strictly:
{
  "fixes": [
    {
      "filePath": "src/routes/user.routes.ts",
      "content": "const router = ... // fully corrected file content"
    }
  ]
}
4. RETURN ONLY JSON. No markdown, no explanations outside the JSON.
5. FIX ALL ERRORS reported in the logs. Do not skip any file.
6. If multiple files are broken, return fixes for ALL of them in the "fixes" array.
7. Provide the FULL content of the file in the "content" field.

CRITICAL INSTRUCTIONS FOR 100% SUCCESS:
- **Imports**: Double-check all import paths. If a file is in 'src/entities', do not import from 'src/models'. Use relative paths (e.g., '../entities/User').
- **Decorators**: In NestJS/TypeORM, NEVER put decorators inside functions or methods. They must be above classes or properties.
- **Circular Dependencies**: If you see "Circular definition", use forwardRef() or restructure the code.
- **Missing Modules**: If a module is missing, check if you need to create it or if the import path is just wrong.
- **Strictness**: Your fix MUST compile on the first try. Be conservative and standard.
`;

export async function attemptAutoFix(projectDir: string, errors: string[]): Promise<boolean> {
    console.log(chalk.magenta('\n🚑 ApiforgeX Healer: Analyzing fractures in the code...'));

    // 0. CHECK FOR MISSING DEPENDENCIES FIRST
    const missingModules = new Set<string>();
    const missingTypes = new Set<string>();
    const moduleRegex = /Cannot find module '([^']+)'/g;
    const typeRegex = /Could not find a declaration file for module '([^']+)'/g;

    for (const err of errors) {
        let match;
        while ((match = moduleRegex.exec(err)) !== null) {
            if (!match[1].startsWith('.')) missingModules.add(match[1]);
        }
        while ((match = typeRegex.exec(err)) !== null) {
            missingTypes.add(match[1]);
        }
    }

    if (missingModules.size > 0 || missingTypes.size > 0) {
        console.log(chalk.yellow(`   📦 Detected missing deps: ${[...missingModules, ...missingTypes].join(', ')}`));
        try {
            if (missingModules.size > 0) {
                const installCmd = `npm install ${Array.from(missingModules).join(' ')}`;
                console.log(chalk.yellow(`   running: ${installCmd}`));
                execSync(installCmd, { cwd: projectDir, stdio: 'ignore' });
            }
            if (missingTypes.size > 0) {
                // The error is usually "module 'bcrypt'", so we need "@types/bcrypt"
                const typesToInstall = Array.from(missingTypes).map(t => `@types/${t}`);
                const installCmd = `npm install -D ${typesToInstall.join(' ')}`;
                console.log(chalk.yellow(`   running: ${installCmd}`));
                execSync(installCmd, { cwd: projectDir, stdio: 'ignore' });
            }
            console.log(chalk.green('   ✅ Dependencies installed! Continuing...'));
        } catch (e) {
            console.error(chalk.red('   ❌ Failed to install dependencies.'));
        }
    }


    const prompt = `
${FIXER_SYSTEM_PROMPT}

CRITICAL RULES FOR CIRCULAR DEPENDENCIES (NestJS/TypeORM):
1. **Modules**: Use \`forwardRef(() => ModuleName)\` in \`imports: []\`.
2. **Services**: Use \`@Inject(forwardRef(() => OtherService)) private readonly other: OtherService\`.
3. **Entities**: Use \`@OneToOne(() => OtherEntity)\` (Lazy evaluation).
4. **Forbidden**: Do NOT use \`InjectForwards\` (It does not exist). Do NOT use \`InjectUsersRepository\` (unless you custom exported it).
5. **Exports**: Ensure ALL Services/Repositories are exported in their modules.

ERROR LOGS:
${errors.join('\n')}

I am working in directory: ${projectDir}

Please fix the files causing these errors. Return a JSON object with the list of fixed files.
`;

    try {
        // Use the shared generateText function (supports Gemini + Ollama)
        const jsonResponse = await generateText(prompt, 'json');

        let result: any;
        try {
            result = JSON.parse(jsonResponse);
        } catch (e) {
            console.error(chalk.red('   ❌ AI returned invalid JSON.'));
            return false;
        }

        if (!result.fixes || !Array.isArray(result.fixes) || result.fixes.length === 0) {
            console.log(chalk.yellow('   ⚠️  AI could not determine a fix.'));
            return false;
        }

        console.log(chalk.magenta(`   💉 Applying ${result.fixes.length} fixes...`));

        for (const fix of result.fixes) {
            const absolutePath = path.isAbsolute(fix.filePath)
                ? fix.filePath
                : path.join(projectDir, fix.filePath);

            // Ensure directory exists
            const dir = path.dirname(absolutePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            fs.writeFileSync(absolutePath, fix.content);
            console.log(chalk.gray(`      > patched ${path.relative(projectDir, absolutePath)}`));
        }

        return true;

    } catch (error) {
        console.error(chalk.red('   ❌ Auto-Fix Failed:'), error);
        return false;
    }
}
