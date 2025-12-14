#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { generateSchema } from '../src/ai.js';
import { generateProject } from '../src/generator.js';
import { verifyProject } from '../src/verifier.js';
import { attemptAutoFix } from '../src/fixer.js';
import os from 'os';
import fs from 'fs';

const program = new Command();

program
  .name('apiforgex')
  .description('Agentic CLI for scaffolding production-ready backends')
  .version('1.0.0');

program
  .command('generate')
  .description('Generate a new backend API from a text prompt')
  .option('-p, --prompt <text>', 'Natural language description of the API')
  .option('-n, --name <name>', 'Project name')
  .option('-d, --db <type>', 'Database type (postgresql, mysql, mongodb)')
  .action(async (options) => {
    console.log(chalk.bold.magenta(`
      db    88""Yb 88 888888  dP"Yb  88""Yb  dP"Yb  888888 Yb  dP 
     dPYb   88__dP 88 88__   dP   Yb 88__dP dP   Yb   88    YbdP  
    dP__Yb  88"""  88 88""   Yb   dP 88"Yb  Yb   dP   88    dPYb  
   dP""""Yb 88     88 88      YbodP  88  Yb  YbodP    88   dP  Yb 
    `));
    console.log(chalk.bold.blue('\n🚀 ApiforgeX: The Autonomous Backend Engineer\n'));

    // 1. Interactive Inputs (if flags are missing)
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'What is the name of your project?',
        default: 'my-agentic-api',
        when: !options.name,
      },
      {
        type: 'list',
        name: 'databaseType',
        message: 'Which database do you want to use?',
        choices: ['postgresql', 'mysql', 'mongodb'],
        when: !options.db,
      },
      {
        type: 'input',
        name: 'prompt',
        message: 'Describe your API (e.g., "A blog with posts and comments"):',
        when: !options.prompt,
      },
    ]);

    // Merge flags and interactive answers
    const config = {
      projectName: options.name || answers.projectName,
      databaseType: options.db || answers.databaseType,
      prompt: options.prompt || answers.prompt,
    };

    // 2. AI Generation Phase
    const spinner = ora('✨ ApiforgeX is crafting your perfect schema...').start();

    try {
      // Call the AI (src/ai.ts)
      const schema = await generateSchema(config.prompt, config.databaseType);
      schema.projectName = config.projectName; // Ensure name matches user input

      spinner.succeed(chalk.green('Schema Designed Successfully! 🎨'));
      console.log(chalk.dim(JSON.stringify(schema, null, 2)));

      // 3. Code Generation Phase
      spinner.start('🚀 Architecting your Enterprise Logic...');

      // Use current directory for Kestra compatibility (and standard scaffolder behavior)
      const projectsDir = process.cwd();
      // if (!fs.existsSync(projectsDir)) fs.mkdirSync(projectsDir, { recursive: true }); // cwd always exists
      const outputDir = path.join(projectsDir, config.projectName);

      // Call the Generator (src/generator.ts)
      await generateProject(schema, outputDir);

      spinner.succeed(chalk.green('Codebase Generated! 🏗️'));

      // --- INSTALL DEPENDENCIES ---
      // --- INSTALL DEPENDENCIES ---
      spinner.start('📦 Installing Dependencies (this may take a moment)...');
      try {
        const { execSync } = await import('child_process');
        // Use shell: true and ignore IO to prevent crashes
        execSync('npm install', { cwd: outputDir, stdio: 'ignore', timeout: 60000 });
        spinner.succeed(chalk.green('Dependencies Installed!'));
      } catch (e) {
        // FAIL SOFTLY: Don't stop the demo because of network issues
        spinner.warn(chalk.yellow('Dependency installation failed (Network/Proxy?). proceeding with Code Logic...'));
      }

      // --- VERIFICATION & SELF-HEALING LOOP DISABLED ---
      console.log(chalk.yellow('\n⚠️  Verification & Self-Healing Disabled by User Request.'));


      // --- GIT AUTOMATION INSERTED ---
      try {
        const { execSync } = await import('child_process');
        const fs = await import('fs');
        const os = await import('os');
        const dotenv = await import('dotenv');

        let globalConfig: any = {};
        try {
          const configPath = path.join(os.homedir(), '.apiforgexrc');
          if (fs.existsSync(configPath)) {
            globalConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          }
        } catch (e) { }

        const envPath = path.join(process.cwd(), '.env');
        if (fs.existsSync(envPath)) dotenv.config({ path: envPath });

        const GITHUB_TOKEN = process.env.GITHUB_TOKEN || globalConfig['github_token'];
        const GITHUB_USER = process.env.GITHUB_USER || globalConfig['github_user'];
        const GITHUB_REPO = process.env.GITHUB_REPO || globalConfig['github_repo'];

        if (GITHUB_TOKEN && GITHUB_USER && GITHUB_REPO) {
          spinner.start('🚀 Initializing Git & Pushing to GitHub...');

          // Git Init & Push
          execSync('git init', { cwd: outputDir, stdio: 'ignore' });
          execSync('git config user.email "bot@apiforgex.com"', { cwd: outputDir });
          execSync('git config user.name "ApiforgeX Bot"', { cwd: outputDir });

          // 1. Create Empty Main
          execSync('git commit --allow-empty -m "chore: Initial commit"', { cwd: outputDir });
          execSync('git branch -M main', { cwd: outputDir });

          const remoteUrl = `https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${GITHUB_REPO}.git`;
          try { execSync(`git remote add origin ${remoteUrl}`, { cwd: outputDir, stdio: 'ignore' }); }
          catch { execSync(`git remote set-url origin ${remoteUrl}`, { cwd: outputDir, stdio: 'ignore' }); }

          execSync('git push -u origin main --force', { cwd: outputDir, stdio: 'ignore' });

          // 2. Create Feature with Code
          const branchName = `feat/ai-${Date.now()}`;
          execSync(`git checkout -b ${branchName}`, { cwd: outputDir, stdio: 'ignore' });
          execSync('git add .', { cwd: outputDir }); // Add files ONLY to feature
          execSync('git commit -m "feat: AI Generated Project"', { cwd: outputDir });
          execSync(`git push origin ${branchName}`, { cwd: outputDir, stdio: 'ignore' });

          spinner.succeed(chalk.green('Code Pushed to GitHub!'));

          spinner.start('🐰 Creating Pull Request...');
          const prResponse = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/pulls`, {
            method: 'POST',
            headers: {
              'Authorization': `token ${GITHUB_TOKEN}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              title: `feat: AI Generation [${config.projectName}] 🚀`,
              body: `🤖 Generated by ApiforgeX CLI.\n\n**Reviewer:** @coderabbitai please review.`,
              head: branchName,
              base: 'main'
            })
          });

          if (prResponse.ok) {
            const prData = await prResponse.json() as any;
            spinner.succeed(chalk.green('Pull Request Created!'));
            console.log(chalk.blue(`🔗 Link: ${prData.html_url}`));
          } else {
            const errText = await prResponse.text();
            spinner.warn(chalk.yellow(`Failed to create PR: ${errText}`));
          }
        } else {
          console.log(chalk.yellow('⚠️  Skipping GitHub Push: Credentials not found in .env or ~/.apiforgexrc'));
          console.log(chalk.dim(`Found: User=${!!GITHUB_USER}, Repo=${!!GITHUB_REPO}, Token=${!!GITHUB_TOKEN ? '***' : 'Missing'}`));
        }
      } catch (e) {
        console.error(chalk.red('❌ Git Automation Failed:'));
        console.error(e);
      }
      // --- END GIT AUTOMATION ---

      // 4. Final Success Message
      console.log(chalk.bold.yellow('\n🎉 Your ApiforgeX Backend is Ready to Rock! 🎸'));
      console.log(`\nHere is how to get started:\n`);
      console.log(chalk.cyan(`  cd ${config.projectName}`));
      console.log(chalk.cyan(`  npm install`));
      console.log(chalk.cyan(`  npx prisma generate`));
      console.log(chalk.cyan(`  npm run  npx prisma db push`));
      console.log(chalk.cyan(`  npm run dev`));
      console.log(chalk.gray('\n(Don\'t forget to set your DATABASE_URL in .env!)\n'));

    } catch (error) {
      spinner.fail(chalk.red('Generation Failed'));
      console.error(error);
    }
  });

// Handle 'init' command (Placeholder for future setup)
program
  .command('init')
  .description('Initialize ApiforgeX configuration')
  .action(async () => {
    try {
      const fs = await import('fs');
      const os = await import('os');
      const configPath = path.join(os.homedir(), '.apiforgexrc');

      console.log(chalk.blue('⚙️  Initializing Global Configuration...'));

      const answers = await inquirer.prompt([
        { type: 'input', name: 'github_user', message: 'GitHub Username:', default: process.env.GITHUB_USER },
        { type: 'password', name: 'github_token', message: 'GitHub Personal Access Token:' },
        { type: 'input', name: 'github_repo', message: 'Default Target Repository (e.g., demo-output):' },
        { type: 'input', name: 'slack_webhook', message: 'Slack Webhook (Optional):' },
      ]);

      fs.writeFileSync(configPath, JSON.stringify(answers, null, 2));
      console.log(chalk.green(`✅ Configuration saved to ${configPath}`));
      console.log(chalk.dim('You can now run "apiforgex generate" from any folder!'));

    } catch (e) {
      console.error(chalk.red('Failed to save config:'), e);
    }
  });

program
  .command('refine')
  .description('Refine code based on PR reviews')
  .option('--pr <number>', 'Pull Request Number')
  .option('--owner <string>', 'Repo Owner')
  .option('--repo <string>', 'Repo Name')
  .option('--token <string>', 'GitHub Token')
  .action((options) => {
    // Dynamic import for action to keep startup fast? No, static is fine here.
    // Need to import refineCode at top.
    import('../src/commands/refine.js').then(({ refineCode }) => {
      refineCode(options);
    });
  });

program.parse(process.argv);