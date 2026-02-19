/* =========================================
   rePROMPT — VASEY/AI
   Backend proxy server for Anthropic API
   ========================================= */

'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');

loadLocalEnv();

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_TOKENS_LIMIT = 8192;

function loadLocalEnv() {
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) return;

    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const delimiter = trimmed.indexOf('=');
        if (delimiter === -1) continue;

        const key = trimmed.slice(0, delimiter).trim();
        let value = trimmed.slice(delimiter + 1).trim();

        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }

        if (!(key in process.env)) {
            process.env[key] = value;
        }
    }
}

// ── Middleware ────────────────────────────
app.disable('x-powered-by');
app.use(express.json({ limit: '20mb' }));
app.use((_, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
});
app.use(express.static(path.join(__dirname, 'public')));

// ── Health check ─────────────────────────
app.get('/api/health', (_req, res) => {
    const hasKey = !!process.env.ANTHROPIC_API_KEY;
    res.json({ status: 'ok', configured: hasKey });
});

// ── Proxy: Anthropic Messages API ────────
app.post('/api/messages', async (req, res) => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        return res.status(500).json({
            error: { message: 'Server is not configured. Set the ANTHROPIC_API_KEY environment variable.' },
        });
    }

    const { model, max_tokens, system, messages } = req.body;

    if (!model || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
            error: { message: 'Missing required fields: model, messages[]' },
        });
    }

    const safeMaxTokens = Number.isInteger(max_tokens) && max_tokens > 0 && max_tokens <= MAX_TOKENS_LIMIT
        ? max_tokens
        : 1400;

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({ model, max_tokens: safeMaxTokens, system, messages }),
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (_err) {
        res.status(502).json({
            error: { message: 'Failed to reach Anthropic API. Check your network and API key.' },
        });
    }
});

// ── Fallback: serve index.html for SPA ───
app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start ────────────────────────────────
app.listen(PORT, () => {
    const keyStatus = process.env.ANTHROPIC_API_KEY ? 'configured' : 'MISSING — set ANTHROPIC_API_KEY';
    console.log(`rePROMPT server running on http://localhost:${PORT}`);
    console.log(`API key: ${keyStatus}`);
});
