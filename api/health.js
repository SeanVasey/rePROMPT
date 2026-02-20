/* =========================================
   rePROMPT — VASEY/AI
   Vercel serverless: GET /api/health
   ========================================= */

'use strict';

const { resolveEndpoint } = require('./_resolve');
const { setSecurityHeaders } = require('./_security');

module.exports = (_req, res) => {
    const { mode } = resolveEndpoint();
    setSecurityHeaders(res);
    res.json({ status: 'ok', configured: mode !== 'unconfigured' });
};
