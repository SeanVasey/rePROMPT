/* =========================================
   rePROMPT — VASEY/AI
   Backend proxy server for Anthropic API
   ========================================= */

'use strict';

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────
app.use(express.json({ limit: '20mb' }));
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

    if (!model || !messages) {
        return res.status(400).json({
            error: { message: 'Missing required fields: model, messages' },
        });
    }

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({ model, max_tokens, system, messages }),
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (err) {
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
