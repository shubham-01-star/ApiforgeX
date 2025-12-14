import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    ListToolsRequestSchema,
    CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import path from "path";
import 'dotenv/config'; // Load env vars

// Initialize MCP Server
const server = new Server(
    {
        name: "apiforgex-mcp",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// Define Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "generate_project",
                description: "Generate a new Backend API project with ApiforgeX (Triggers Kestra Workflow)",
                inputSchema: {
                    type: "object",
                    properties: {
                        name: { type: "string", description: "Project Name" },
                        db: { type: "string", enum: ["postgresql", "mysql", "mongodb"], description: "Database Type" },
                        prompt: { type: "string", description: "Natural language requirements" },
                    },
                    required: ["name", "prompt"],
                },
            },
        ],
    };
});

// Handle Tool Calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "generate_project") {
        const { name, db, prompt } = request.params.arguments as any;

        try {
            console.error(`[MCP] 🚀 Triggering Kestra Workflow for: ${name}`);

            // Get Config from ENV
            const kestraUrl = process.env.KESTRA_URL || 'http://localhost:8080/api/v1';
            const triggerUrl = `${kestraUrl}/executions/trigger/dev.apiforgex/apiforgex-agent`;
            const kUser = process.env.KESTRA_USER;
            const kPass = process.env.KESTRA_PASSWORD;

            // GitHub Config to pass to Kestra
            const ghToken = process.env.GITHUB_TOKEN;
            const ghUser = process.env.GITHUB_USER;
            const ghRepo = process.env.GITHUB_REPO;

            // Execute curl via child_process
            const { exec } = await import('child_process');
            const { promisify } = await import('util');
            const execAsync = promisify(exec);

            let curlArgs = ['--max-time', '15', '-X', 'POST', triggerUrl];

            // Add Fields
            const fields = {
                projectName: name,
                database: db || 'postgresql',
                prompt: prompt,
                github_token: ghToken,
                github_user: ghUser,
                github_repo: ghRepo
            };

            for (const [key, value] of Object.entries(fields)) {
                if (value) {
                    // Escape double quotes and backslashes in value
                    const safeValue = String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "\\'");
                    curlArgs.push('-F', `${key}="${safeValue}"`);
                }
            }

            // Construct Final Command
            let curlCommand = `curl ${curlArgs.join(' ')}`;

            if (kUser && kPass) {
                console.error(`[MCP] 🔒 Using Basic Auth for Kestra User: ${kUser}`);
                // Prepend auth flag safely
                curlCommand = `curl -u "${kUser}:${kPass}" ${curlArgs.join(' ')}`;
            }

            console.error(`[MCP] Running Command...`);
            const { stdout } = await execAsync(curlCommand, { timeout: 15000 });

            // Parse Kestra Response
            let executionData;
            try {
                executionData = JSON.parse(stdout);
            } catch (e) {
                console.error(`Failed to parse Kestra response: ${stdout}`);
                throw new Error(`Invalid response from Kestra (Check URL/Auth): ${stdout.substring(0, 100)}...`);
            }

            return {
                content: [
                    {
                        type: "text",
                        text: `✅ Kestra Workflow Triggered! 🕸️\n\nExecution ID: ${executionData.id}\nStatus: ${executionData.state.current}\n\nView Progress: http://localhost:8080/ui/executions/dev.apiforgex/apiforgex-agent/${executionData.id}`,
                    },
                ],
            };
        } catch (error: any) {
            return {
                content: [{ type: "text", text: `Error Triggering Kestra: ${error.message}\nIf 401 Unauthorized, check .env KESTRA_USER/PASSWORD` }],
                isError: true,
            };
        }
    }

    throw new Error("Tool not found");
});

// Start Server
async function run() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Awesomeness! ApiforgeX MCP Agent is ready to serve Cline.");
}

run().catch((error) => {
    console.error("Fatal MCP error:", error);
    process.exit(1);
});
