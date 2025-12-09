#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { generateSchema } from '../src/ai.js';
import { generateProject } from '../src/generator.js';

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
    const spinner = ora('🧠 Oumi/AI is designing your schema...').start();
    
    try {
      // Call the AI (src/ai.ts)
      const schema = await generateSchema(config.prompt, config.databaseType);
      schema.projectName = config.projectName; // Ensure name matches user input
      
      spinner.succeed(chalk.green('Schema Designed Successfully!'));
      console.log(chalk.dim(JSON.stringify(schema, null, 2)));

      // 3. Code Generation Phase
      spinner.start('🏗️  Scaffolding Enterprise MVC Architecture...');
      
      const outputDir = path.join(process.cwd(), config.projectName);
      
      // Call the Generator (src/generator.ts)
      await generateProject(schema, outputDir);
      
      spinner.succeed(chalk.green('Build Complete!'));

      // 4. Final Success Message
      console.log(chalk.bold.yellow('\n🎉 Your API is ready!'));
      console.log(`\nNext steps:\n`);
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
  .action(() => {
    console.log(chalk.green('Config initialized (Mock)'));
  });

program.parse(process.argv);