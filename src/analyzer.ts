import { GithubComment } from './types.js';

const SCORER_SYSTEM_PROMPT = `
You are a strict Senior Staff Engineer and Tech Lead.
Your task is to EVALUATE the quality and importance of a Code Review Comment.
You must assign a SCORE from 0 to 100.

Scoring Criteria:
- CRITICAL (Score 80-100): Bugs, Security Vulnerabilities, Broken Logic, Type Safety issues. Action is MANDATORY.
- MAJOR (Score 60-79): Performance issues, Scalability, strict Best Practices, Code Structure. Directives to change logic (e.g., "Add validation", "Ensure X"). Action is HIGHLY RECOMMENDED.
- MINOR (Score 0-59): Variable naming, Documentation, Comments, Typos, Formatting, Personal preference. Action is OPTIONAL.

IMPORTANT: If the comment explicitly requests a functional change (e.g., "ensure", "validate", "fix"), rate it as MAJOR or CRITICAL. 
If the comment starts with "/fix", it is a USER COMMAND and should be scored HIGH (80+).

Input: The body of a code review comment.
Output: API-Strict JSON. No markdown.
Format:
{
  "score": number,
  "category": "critical" | "major" | "minor",
  "reason": "Short explanation of why"
}
`;

export interface ReviewScore {
    score: number;
    category: 'critical' | 'major' | 'minor';
    reason: string;
}

export async function scoreReview(commentBody: string): Promise<ReviewScore> {
    try {
        const host = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';

        // Quick check if Ollama is up (optional optimization, or just try/catch the main call)
        // We'll go straight to call.

        const response = await fetch(`${host}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "llama3.2",
                prompt: `${SCORER_SYSTEM_PROMPT}\n\nCOMMENT TO EVALUATE:\n"${commentBody}"\n\nJSON OUTPUT:`,
                stream: false,
                format: "json"
            })
        });

        if (!response.ok) throw new Error("Ollama API Error during scoring");

        const data = await response.json() as any;
        const result = JSON.parse(data.response);

        // Fallback validation
        if (typeof result.score !== 'number') result.score = 50;

        return result;

    } catch (error) {
        console.error("⚠️ Failed to score review. Defaulting to MAJOR (safe).", error);
        return { score: 70, category: 'major', reason: "Scoring system failed, assuming valid." };
    }
}
