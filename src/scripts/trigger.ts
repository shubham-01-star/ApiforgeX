// Native Node 18+ Globals used
import 'dotenv/config';


const KESTRA_BASE_URL = 'http://localhost:8080/api/v1';

export const triggerPipeline = async (projectName: string, prompt: string, dbType: string = 'postgresql') => {
    console.log(`🚀 Cline is triggering Kestra for project: ${projectName}...`);

    try {
        // 1. Check Health
        try {
            const health = await fetch(`${KESTRA_BASE_URL}/configs`);
            if (!health.ok) throw new Error("Kestra API not responding");
        } catch (e) {
            console.error("⏳ Kestra server is not ready yet. Please wait a few seconds and try again.");
            return;
        }

        // 2. Prepare Form Data
        // Kestra inputs are passed as multipart form data
        const formData = new FormData();
        formData.set('projectName', projectName);
        formData.set('prompt', prompt);
        formData.set('database', dbType);

        // Pass GitHub Credentials to Kestra
        formData.set('github_user', process.env.GITHUB_USER || '');
        formData.set('github_token', process.env.GITHUB_TOKEN || '');
        formData.set('github_repo', process.env.GITHUB_REPO || 'apiforgex-demo-output');

        // 3. Trigger Flow
        // Correct Flow ID: apiforgex-agent (defined in yaml)
        const flowId = 'apiforgex-agent';

        const username = process.env.KESTRA_USER || 'admin';
        const password = process.env.KESTRA_PASSWORD || 'admin';
        const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;

        const response = await fetch(`${KESTRA_BASE_URL}/executions/dev.apiforgex/${flowId}`, {
            method: 'POST',
            headers: {
                'Authorization': authHeader
            },
            body: formData as any
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`API Error: ${response.status} - ${text}`);
        }

        const data = await response.json() as any;

        if (data.id) {
            console.log(`✅ Kestra Workflow Started!`);
            console.log(`🆔 Execution ID: ${data.id}`);
            console.log(`🔗 Link: http://localhost:8080/ui/executions/dev.apiforgex/apiforgex-pipeline/${data.id}`);
        } else {
            console.error('⚠️ Kestra response did not contain an execution ID.');
        }

    } catch (error: any) {
        console.error(`❌ Failed to trigger Kestra: ${error.message}`);
    }
};

// CLI Support
if (process.argv[1] === import.meta.url || process.argv[1].endsWith('trigger.ts')) {
    const [, , name, prompt, db] = process.argv;
    if (!name || !prompt) {
        console.error('Usage: node --loader ts-node/esm src/scripts/trigger.ts <projectName> <prompt> [dbType]');
    } else {
        triggerPipeline(name, prompt, db);
    }
}
