
import 'dotenv/config';

async function testOllama() {
    console.log("🦙 Testing Ollama Connection...");

    // Check Config
    const host = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
    console.log(`📡 Target Host: ${host}`);

    try {
        // 1. Check Version (Ping)
        console.log("1️⃣  Checking Service Status...");
        const vRes = await fetch(`${host}/api/version`);
        if (!vRes.ok) throw new Error(`Status Check Failed: ${vRes.status}`);
        const vData = await vRes.json();
        console.log(`✅ Ollama is Online! Version: ${(vData as any).version}`);

        // 2. List Models
        console.log("2️⃣  Checking Available Models...");
        const mRes = await fetch(`${host}/api/tags`);
        if (!mRes.ok) throw new Error(`Model List Failed: ${mRes.status}`);
        const mData = await mRes.json();
        const models = (mData as any).models.map((m: any) => m.name);
        console.log("📚 Installed Models:", models);

        // 3. Test Generation
        const testModel = models.find((m: string) => m.includes('llama')) || models[0];
        if (testModel) {
            console.log(`3️⃣  Testing Generation with '${testModel}'...`);
            const gRes = await fetch(`${host}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: testModel,
                    prompt: "Say 'Hello' in one word.",
                    stream: false
                })
            });
            const gData = await gRes.json();
            console.log(`🤖 Response: ${(gData as any).response}`);
            console.log("🏆 Ollama is Fully Functional!");
        } else {
            console.warn("⚠️  No models found! Please run 'ollama pull llama3.2'");
        }

    } catch (e: any) {
        console.error("❌ Ollama Connection Failed:", e.message);
        console.error("💡 Hint: Is 'ollama serve' running in a terminal?");
    }
}

testOllama();
