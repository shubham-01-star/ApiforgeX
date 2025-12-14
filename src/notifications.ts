export async function sendSlackNotification(webhookUrl: string, message: any) {
    if (!webhookUrl || webhookUrl.includes('XXXX')) {
        console.log('🔔 [Mock Slack] ' + JSON.stringify(message));
        return;
    }

    try {
        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-type': 'application/json' },
            body: JSON.stringify(message)
        });
    } catch (error) {
        console.error('❌ Failed to send Slack notification', error);
    }
}

export function buildReviewNotification(prNumber: number, score: number, category: string, reason: string, action: string) {
    const color = score >= 80 ? '#ef4444' : (score >= 60 ? '#f59e0b' : '#3b82f6'); // Red, Amber, Blue

    return {
        attachments: [
            {
                color: color,
                pretext: `🧐 *Review Analyzed for PR #${prNumber}*`,
                fields: [
                    {
                        title: "AI Quality Score",
                        value: `${score}/100 (${category.toUpperCase()})`,
                        short: true
                    },
                    {
                        title: "Action",
                        value: action,
                        short: true
                    },
                    {
                        title: "Reasoning",
                        value: reason,
                        short: false
                    }
                ],
                footer: "ApiforgeX Intelligent Agent"
            }
        ]
    };
}
