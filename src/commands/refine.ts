import { fetchPrComments } from '../github.js';
import { refineCodeWithAI } from '../ai.js';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';

export const refineCode = async (options: any) => {
    console.log(chalk.blue('🔍 ApiforgeX Refinement Engine Started...'));

    const { pr, owner, repo, token } = options;

    if (!pr || !owner || !repo || !token) {
        console.error(chalk.red('❌ Missing required arguments: --pr, --owner, --repo, --token'));
        process.exit(1);
    }

    console.log(chalk.gray(`> Fetching reviews for PR #${pr} on ${owner}/${repo}...`));

    const comments = await fetchPrComments(owner, repo, parseInt(pr), token);

    // Filter for CodeRabbit or critical issues
    const relevantComments = comments.filter(c =>
        c.user === 'coderabbitai' || c.body.toLowerCase().includes('fix') || c.body.toLowerCase().includes('change')
    );

    if (relevantComments.length === 0) {
        console.log(chalk.green('✅ No automated feedback found requiring action. Good job!'));
        return;
    }

    console.log(chalk.yellow(`Found ${relevantComments.length} items to refine.`));

    for (const comment of relevantComments) {
        console.log(`\n----------------------------------------`);
        console.log(chalk.bold(`📄 File: ${comment.path} (Line ${comment.line})`));
        console.log(chalk.cyan(`💬 Comment: ${comment.body}`));

        // Read File
        const filePath = path.join(process.cwd(), comment.path);
        try {
            const fileContent = await fs.readFile(filePath, 'utf-8');

            console.log(chalk.magenta(`� Consulting AI Architect for a fix...`));
            const fixedCode = await refineCodeWithAI(fileContent, comment.body);

            if (fixedCode && fixedCode !== fileContent) {
                await fs.writeFile(filePath, fixedCode);
                console.log(chalk.green(`✅ Fix applied to ${comment.path}`));
            } else {
                console.log(chalk.yellow(`⚠️ AI returned no changes or failed.`));
            }

        } catch (err) {
            console.error(chalk.red(`❌ Failed to read/write file: ${filePath}`), err);
        }
    }

    console.log(chalk.green('\n✨ Refinement Cycle Complete!'));
};
