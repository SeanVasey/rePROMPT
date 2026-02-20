/* =========================================
   rePROMPT — VASEY/AI
   Vercel serverless: GET /api/health
   ========================================= */

'use strict';

const { resolveEndpoint } = require('./_resolve');

module.exports = (_req, res) => {
    const { mode } = resolveEndpoint();
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.json({ status: 'ok', configured: mode !== 'unconfigured' });
};
