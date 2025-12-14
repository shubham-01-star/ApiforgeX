
import { generateText } from '../src/ai.js';
import 'dotenv/config';

async function testConnection() {
    console.log("📡 Testing Gemini API Connection...");
    try {
        // Force 'text' mode which uses the default model logic in ai.ts
        const response = await generateText("Hello, imply say 'Yes Working'.", 'text');
        console.log("🤖 AI Response:", response);
        if (response.includes("Working")) {
            console.log("✅ Connection Successful!");
        } else {
            console.warn("⚠️  Response received but unexpected content.");
        }
    } catch (e) {
        console.error("❌ AI Connection Failed:", e);
    }
}

testConnection();
