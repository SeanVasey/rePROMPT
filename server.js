/* =========================================
   rePROMPT — VASEY/AI
   Backend proxy server for Anthropic API
   Supports AI Gateway or direct API key.
   ========================================= */

'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');
const { resolveEndpoint } = require('./api/_resolve');

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
    const { mode } = resolveEndpoint();
    res.json({ status: 'ok', configured: mode !== 'unconfigured' });
});

// ── Proxy: Anthropic Messages API ────────
app.post('/api/messages', async (req, res) => {
    const { url, apiKey, mode, authMode } = resolveEndpoint();

    if (mode === 'unconfigured') {
        return res.status(500).json({
            error: { message: 'Server is not configured. Set AI_GATEWAY_URL (plus gateway key) or ANTHROPIC_API_KEY.' },
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
});

// ── Fallback: serve index.html for SPA ───
app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start ────────────────────────────────
app.listen(PORT, () => {
    const { mode } = resolveEndpoint();
    const modeLabel = {
        gateway: `AI Gateway (${process.env.AI_GATEWAY_URL})`,
        direct: 'Direct Anthropic API',
        unconfigured: 'UNCONFIGURED — set AI_GATEWAY_URL or ANTHROPIC_API_KEY',
    };
    console.log(`rePROMPT server running on http://localhost:${PORT}`);
    console.log(`Mode: ${modeLabel[mode]}`);
});
