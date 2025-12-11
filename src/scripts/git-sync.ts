import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';

/**
 * git-sync.ts
 * Automates the process of initializing a git repo and pushing to GitHub.
 * Usage: ts-node src/scripts/git-sync.ts <project-path> <github-user> <github-token>
 */

const projectPath = process.argv[2];
const githubUser = process.argv[3];
const githubToken = process.argv[4];

if (!projectPath || !githubUser || !githubToken) {
    console.error(chalk.red('Usage: ts-node src/scripts/git-sync.ts <project-path> <github-user> <github-token>'));
    process.exit(1);
}

const absProjectPath = path.resolve(projectPath);

if (!fs.existsSync(absProjectPath)) {
    console.error(chalk.red(`Project path not found: ${absProjectPath}`));
    process.exit(1);
}

const run = (command: string, cwd: string) => {
    try {
        console.log(chalk.gray(`> ${command}`));
        execSync(command, { stdio: 'inherit', cwd });
    } catch (error) {
        console.error(chalk.red(`Failed to execute: ${command}`));
        process.exit(1);
    }
};

console.log(chalk.blue(`\n🔄 Syncing ${projectPath} to GitHub...`));

// 1. Init Git
if (!fs.existsSync(path.join(absProjectPath, '.git'))) {
    run('git init', absProjectPath);
    run('git branch -M main', absProjectPath);
    // Configure Git User for the repo
    run('git config user.email "kestra@apiforgex.dev"', absProjectPath);
    run('git config user.name "Kestra Bot"', absProjectPath);
}

// 2. Commit Changes (Do this locally regardless of remote)
run('git add .', absProjectPath);
try {
    run('git commit -m "Initial generation by ApiforgeX"', absProjectPath);
} catch (e) {
    console.log(chalk.yellow('Nothing to commit or empty commit. Continuing...'));
}

// 3. Add Remote & Push
if (githubToken === 'mock-token') {
    console.log(chalk.yellow('⚠️  Test Mode: Skipping Remote Sync (Mock Token detected).'));
    console.log(chalk.green('\n✅ Git Initialized & Committed locally (No Push).'));
    process.exit(0);
}

// In a real scenario, we might want to check if remote exists first
try {
    // Remove existing origin if any (to be safe during retries)
    execSync('git remote remove origin', { cwd: absProjectPath, stdio: 'ignore' });
} catch (e) {
    // Ignore error if remote doesn't exist
}

// Construct secure remote URL (careful not to log the token in production logs if possible)
const remoteUrl = `https://${githubUser}:${githubToken}@github.com/${githubUser}/${path.basename(absProjectPath)}.git`;
run(`git remote add origin ${remoteUrl}`, absProjectPath);

run('git push -u origin main', absProjectPath);

console.log(chalk.green('\n✅ Successfully Synced to GitHub!'));
