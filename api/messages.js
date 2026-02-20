/* =========================================
   rePROMPT — VASEY/AI
   Vercel serverless: POST /api/messages
   Proxies requests through an AI Gateway or
   directly to the Anthropic Messages API.
   ========================================= */

'use strict';

const { resolveEndpoint } = require('./_resolve');

const MAX_TOKENS_LIMIT = 8192;

module.exports = async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: { message: 'Method not allowed' } });
    }

    const { url, apiKey, mode, authMode } = resolveEndpoint();

    if (mode === 'unconfigured') {
        return res.status(500).json({
            error: { message: 'Server is not configured. Set AI_GATEWAY_URL (plus gateway key) or ANTHROPIC_API_KEY.' },
        });
    }

    const { model, max_tokens, system, messages } = req.body || {};

    if (!model || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
            error: { message: 'Missing required fields: model, messages[]' },
        });
    }

    const safeMaxTokens =
        Number.isInteger(max_tokens) && max_tokens > 0 && max_tokens <= MAX_TOKENS_LIMIT
            ? max_tokens
            : 1400;

    try {
        const headers = {
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
        };

        if (apiKey) {
            if (mode === 'gateway' && authMode === 'bearer') {
                headers.Authorization = `Bearer ${apiKey}`;
            } else {
                headers['x-api-key'] = apiKey;
            }
        }

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({ model, max_tokens: safeMaxTokens, system, messages }),
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (_err) {
        res.status(502).json({
            error: { message: 'Failed to reach AI endpoint. Check your gateway URL or API key configuration.' },
        });
    }
};
