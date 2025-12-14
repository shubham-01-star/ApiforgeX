import { GithubComment } from './types.js';

const GITHUB_API_BASE = 'https://api.github.com';

export const fetchPrComments = async (
    owner: string,
    repo: string,
    prNumber: number,
    token: string
): Promise<GithubComment[]> => {
    if (!token || token.includes('mock-token')) {
        console.warn('⚠️ Mock Token detected. Returning empty comments.');
        return [];
    }

    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${prNumber}/comments`;

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'ApiforgeX-Agent'
            }
        });

        if (!response.ok) {
            throw new Error(`GitHub API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        // Map to simplified type
        return data.map((comment: any) => ({
            id: comment.id,
            body: comment.body,
            path: comment.path,
            line: comment.line,
            user: comment.user.login,
            created_at: comment.created_at
        }));

    } catch (error) {
        console.error('❌ Failed to fetch PR comments:', error);
        return [];
    }
};

export const fetchOpenPRs = async (owner: string, repo: string, token: string) => {
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls?state=open`;
    const response = await fetch(url, {
        headers: { 'Authorization': `token ${token}`, 'User-Agent': 'ApiforgeX-Agent' }
    });
    if (!response.ok) {
        console.error(`❌ fetchOpenPRs failed: ${response.status} ${response.statusText}`);
        return [];
    }
    return await response.json();
};

export const fetchPRReviews = async (owner: string, repo: string, prNumber: number, token: string) => {
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${prNumber}/reviews`;
    const response = await fetch(url, {
        headers: { 'Authorization': `token ${token}`, 'User-Agent': 'ApiforgeX-Agent' }
    });
    if (!response.ok) {
        console.error(`❌ fetchPRReviews failed: ${response.status} ${response.statusText}`);
        return [];
    }
    return await response.json();
};

export const fetchPRCommits = async (owner: string, repo: string, prNumber: number, token: string) => {
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${prNumber}/commits`;
    const response = await fetch(url, {
        headers: { 'Authorization': `token ${token}`, 'User-Agent': 'ApiforgeX-Agent' }
    });
    if (!response.ok) return [];
    return await response.json();
};

export const fetchIssueComments = async (owner: string, repo: string, number: number, token: string) => {
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/issues/${number}/comments`;
    const response = await fetch(url, {
        headers: { 'Authorization': `token ${token}`, 'User-Agent': 'ApiforgeX-Agent' }
    });
    if (!response.ok) {
        console.error(`❌ fetchIssueComments failed: ${response.status} ${response.statusText}`);
        return [];
    }
    return await response.json();
};

export const addReaction = async (owner: string, repo: string, commentId: number, content: string, token: string) => {
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/issues/comments/${commentId}/reactions`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.squirrel-girl-preview+json',
            'User-Agent': 'ApiforgeX-Agent'
        },
        body: JSON.stringify({ content })
    });
    if (!response.ok) {
        console.error(`❌ addReaction failed: ${response.status} ${response.statusText}`);
    }
    return response.ok;
};

export const fetchCheckRuns = async (owner: string, repo: string, ref: string, token: string) => {
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits/${ref}/check-runs`;
    const response = await fetch(url, {
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.antiope-preview+json',
            'User-Agent': 'ApiforgeX-Agent'
        }
    });
    if (!response.ok) {
        console.error(`❌ fetchCheckRuns failed: ${response.status} ${response.statusText}`);
        return null;
    }
    return await response.json();
};

export const fetchJobLogs = async (owner: string, repo: string, jobId: number, token: string) => {
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/actions/jobs/${jobId}/logs`;
    const response = await fetch(url, {
        headers: {
            'Authorization': `token ${token}`,
            'User-Agent': 'ApiforgeX-Agent'
        }
    });
    if (!response.ok) return null;
    return await response.text();
};

export const createComment = async (owner: string, repo: string, issueNumber: number, body: string, token: string) => {
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/issues/${issueNumber}/comments`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'ApiforgeX-Agent'
        },
        body: JSON.stringify({ body })
    });
    if (!response.ok) {
        console.error(`❌ createComment failed: ${response.status} ${response.statusText}`);
        return null;
    }
    return await response.json();
};

export const mergePR = async (owner: string, repo: string, prNumber: number, token: string) => {
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${prNumber}/merge`;

    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'ApiforgeX-Agent'
            },
            body: JSON.stringify({
                commit_title: `Merge pull request #${prNumber} from ApiforgeX-Agent`,
                merge_method: 'squash' // preferred for clean history
            })
        });

        if (!response.ok) {
            const err = await response.text();
            console.error(`❌ Merge failed: ${err}`);
            return false;
        }

        console.log(`✅ PR #${prNumber} Merged Successfully!`);
        return true;
    } catch (e) {
        console.error(`❌ Merge Exception:`, e);
        return false;
    }
};

export const closePR = async (owner: string, repo: string, prNumber: number, token: string) => {
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${prNumber}`;
    try {
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'ApiforgeX-Agent'
            },
            body: JSON.stringify({ state: 'closed' })
        });
        if (!response.ok) {
            console.error(`❌ Failed to close PR #${prNumber}: ${response.status} ${response.statusText}`);
            return false;
        }
        console.log(`✅ Closed PR #${prNumber}`);
        return true;
    } catch (e) {
        console.error(`❌ Exception closing PR #${prNumber}:`, e);
        return false;
    }
};

export const deleteBranch = async (owner: string, repo: string, branch: string, token: string) => {
    const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/refs/heads/${branch}`;
    try {
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `token ${token}`,
                'User-Agent': 'ApiforgeX-Agent'
            }
        });
        if (response.status === 204) {
            console.log(`✅ Deleted branch ${branch}`);
            return true;
        }
        console.error(`⚠️ Failed to delete branch ${branch}: ${response.status}`);
        return false;
    } catch (e) {
        return false;
    }
};

