import { execSync } from 'child_process';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

export interface ValidationResult {
    success: boolean;
    errors: string[];
}

export const verifyProject = async (projectDir: string): Promise<ValidationResult> => {
    const errors: string[] = [];
    console.log(chalk.blue(`\n🔍 Starting Project Verification in ${projectDir}...`));

    const originalCwd = process.cwd();

    try {
        process.chdir(projectDir);

        // 1. Prisma Schema Validation
        if (fs.existsSync(path.join(projectDir, 'prisma', 'schema.prisma'))) {
            try {
                console.log(chalk.gray('  > Validating Prisma Schema...'));
                execSync('npx --yes prisma validate', { stdio: 'pipe' });
                console.log(chalk.green('  ✅ Prisma Schema Valid'));
            } catch (error: any) {
                const msg = `❌ Prisma Validation Failed: ${error.message}`;
                // console.error(chalk.red(msg)); 
                // Dont print huge stack trace here, just the fact it failed.
                errors.push(`Prisma Validation Failed. Check schema.prisma.`);
            }
        }

        // 2. Type Checking
        if (fs.existsSync(path.join(projectDir, 'tsconfig.json'))) {
            try {
                console.log(chalk.gray('  > Checking Types (tsc)...'));
                execSync('npx --yes tsc --noEmit', { stdio: 'pipe' });
                console.log(chalk.green('  ✅ Type Check Passed'));
            } catch (error: any) {
                // Determine if it is a real error or just tsc emitting output on stderr
                // tsc returns non-zero exit code on errors
                const output = error.stdout?.toString() || error.stderr?.toString() || error.message;
                errors.push(`Type Check Failed:\n${output}`);
            }
        }

        // 3. Linting
        const packageJsonPath = path.join(projectDir, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
            if (packageJson.scripts && packageJson.scripts.lint) {
                try {
                    console.log(chalk.gray('  > Running Linter...'));
                    execSync('npm run lint', { stdio: 'pipe' });
                    console.log(chalk.green('  ✅ Linting Passed'));
                } catch (error: any) {
                    errors.push(`Linting Failed.`);
                }
            }
        }

        // 4. Tests
        if (fs.existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
            // Check if test script exists and isn't the default "echo error"
            if (packageJson.scripts && packageJson.scripts.test && !packageJson.scripts.test.includes('no test specified')) {
                try {
                    console.log(chalk.gray('  > Running Tests...'));
                    execSync('npm test', { stdio: 'inherit' }); // Inherit so we see test output
                    console.log(chalk.green('  ✅ Tests Passed'));
                } catch (error: any) {
                    errors.push(`Tests Failed.`);
                }
            }
        }

    } catch (err) {
        console.error('Verification System Error:', err);
        errors.push(`System Error during verification: ${err}`);
    } finally {
        process.chdir(originalCwd);
    }

    if (errors.length > 0) {
        console.log(chalk.red(`\n❌ Project Verification FAILED with ${errors.length} errors.`));
        errors.forEach(e => console.log(chalk.red(`  - ${e}`)));
        return { success: false, errors };
    }

    console.log(chalk.green('\n✅ Project Verification SUCCESSFUL. Ready to push.'));
    return { success: true, errors: [] };
};
