import fs from 'fs';
import path from 'path';

// Oumi Data Synthesis Helper
// This script converts ApiforgeX logs into Oumi-compatible SFT (Supervised Fine-Tuning) format.
// Goal: Prepare a dataset to train a better "Agent" model based on successful runs.

const LOG_DIR = path.join(process.cwd(), 'logs');
const OUTPUT_FILE = path.join(process.cwd(), 'oumi_training_data.jsonl');

interface OumiEntry {
    instruction: string;
    context: string;
    response: string;
}

const run = () => {
    console.log("🔍 Scanning execution logs for Oumi Data Synthesis...");

    // Mocking log collection for the demo submission
    // In a real run, this would parse Kestra execution logs
    const mockEntries: OumiEntry[] = [
        {
            instruction: "Generate a Library Management System",
            context: "Database: PostgreSQL, Auth: true",
            response: "Creating 'library-management-system' with 4 models: Book, Author, Member, Loan..."
        }
    ];

    const jsonlContent = mockEntries.map(e => JSON.stringify(e)).join('\n');

    fs.writeFileSync(OUTPUT_FILE, jsonlContent);
    console.log(`✅ Oumi Dataset Generated: ${OUTPUT_FILE}`);
    console.log("🚀 Ready for Fine-tuning with Oumi CLI.");
};

run();
