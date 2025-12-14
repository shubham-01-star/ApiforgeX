import 'dotenv/config';
import { fetchOpenPRs, closePR, deleteBranch } from '../github.js';

const owner = process.env.GITHUB_USER;
const repo = process.env.GITHUB_REPO;
const token = process.env.GITHUB_TOKEN;

if (!owner || !repo || !token) {
    console.error('Missing GitHub Credentials in .env');
    process.exit(1);
}

const resetRepo = async () => {
    console.log(`🧹 Starting Cleanup for ${owner}/${repo}...`);

    // 1. Close all Open PRs
    const prs = await fetchOpenPRs(owner, repo, token);
    console.log(`Found ${prs.length} open PRs.`);

    for (const pr of prs) {
        await closePR(owner, repo, pr.number, token);

        // Try to delete the branch as well
        if (pr.head.ref && pr.head.ref !== 'main' && pr.head.ref !== 'master') {
            await deleteBranch(owner, repo, pr.head.ref, token);
        }
    }

    console.log('✅ Remote Repo Reset Complete.');
};

resetRepo();
