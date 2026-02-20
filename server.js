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
const { setSecurityHeaders, validateMessagesPayload } = require('./api/_security');

loadLocalEnv();

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_TOKENS_LIMIT = 8192;
const REQUEST_TIMEOUT_MS = 20000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 60;
const requestCounts = new Map();

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
    setSecurityHeaders(res);
    next();
});

app.use('/api', (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const bucket = requestCounts.get(key);

    if (!bucket || now - bucket.windowStart >= RATE_LIMIT_WINDOW_MS) {
        requestCounts.set(key, { windowStart: now, count: 1 });
        return next();
    }

    if (bucket.count >= RATE_LIMIT_MAX_REQUESTS) {
        return res.status(429).json({ error: { message: 'Too many requests. Please retry shortly.' } });
    }

    bucket.count += 1;
    return next();
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

    const validation = validateMessagesPayload(req.body);
    if (!validation.ok) {
        return res.status(400).json({ error: { message: validation.message } });
    }

    const { model, max_tokens, system, messages } = req.body;

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

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({ model, max_tokens: safeMaxTokens, system, messages }),
            signal: controller.signal,
        });
        clearTimeout(timeout);

        const data = await response.json().catch(() => ({ error: { message: 'Upstream returned a non-JSON response.' } }));

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (err) {
        if (err && err.name === 'AbortError') {
            return res.status(504).json({ error: { message: 'Upstream request timed out.' } });
        }

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
