/* =========================================
   rePROMPT — VASEY/AI
   Prompt enhancement powered by Claude API
   (backend proxy — no API keys in browser)
   ========================================= */

(function () {
    'use strict';

    // ── State ──────────────────────────────
    const state = {
        mode: 'enhance',
        images: [],        // { file, dataUrl, base64, mediaType }
        processing: false,
        backendReady: false,
        directMode: false, // true when using client-side API key
    };

    // ── DOM refs ───────────────────────────
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const promptInput    = $('#promptInput');
    const charCount      = $('#charCount');
    const contextToggle  = $('#contextToggle');
    const contextContent = $('#contextContent');
    const contextInput   = $('#contextInput');
    const enhanceBtn     = $('#enhanceBtn');
    const btnText        = $('.enhance-btn-text');
    const btnLoading     = $('.enhance-btn-loading');
    const outputSection  = $('#outputSection');
    const outputContent  = $('#outputContent');
    const copyBtn        = $('#copyBtn');
    const rerunBtn       = $('#rerunBtn');
    const copyToast      = $('#copyToast');
    const settingsBtn    = $('#settingsBtn');
    const settingsModal  = $('#settingsModal');
    const settingsClose  = $('#settingsClose');
    const modelSelect    = $('#modelSelect');
    const saveSettingsBtn = $('#saveSettingsBtn');
    const backendStatus  = $('#backendStatus');
    const backendHint    = $('#backendHint');
    const apiKeyGroup    = $('#apiKeyGroup');
    const apiKeyInput    = $('#apiKeyInput');
    const uploadBtn      = $('#uploadBtn');
    const imageInput     = $('#imageInput');
    const imagePreviewContainer = $('#imagePreviewContainer');

    const apiBase = (window.__REPROMPT_CONFIG__ && window.__REPROMPT_CONFIG__.apiBaseUrl)
        ? window.__REPROMPT_CONFIG__.apiBaseUrl.replace(/\/$/, '')
        : '';

    function apiUrl(path) {
        return `${apiBase}${path}`;
    }

    // ── Init ───────────────────────────────
    function init() {
        loadSettings();
        bindEvents();
        updateCharCount();
        checkBackend();
    }

    // ── Backend health check ─────────────
    async function checkBackend() {
        try {
            const res = await fetch(apiUrl('/api/health'));
            const data = await res.json();
            state.backendReady = data.configured;
            state.directMode = false;
            if (backendStatus) {
                if (data.configured) {
                    backendStatus.textContent = 'Connected — API key configured on server';
                    backendStatus.className = 'backend-status backend-ok';
                    backendHint.textContent = 'The API key is stored securely on the server.';
                } else {
                    backendStatus.textContent = 'Server running but ANTHROPIC_API_KEY is not set';
                    backendStatus.className = 'backend-status backend-warn';
                }
            }
            if (apiKeyGroup) apiKeyGroup.style.display = data.configured ? 'none' : '';
        } catch {
            state.backendReady = false;
            enableDirectMode();
        }
    }

    // ── Direct-mode (no backend proxy) ────
    function enableDirectMode() {
        state.directMode = true;
        const savedKey = localStorage.getItem('reprompt_api_key') || '';
        state.backendReady = savedKey.length > 0;

        if (backendStatus) {
            if (savedKey) {
                backendStatus.textContent = 'Using your API key (direct browser mode)';
                backendStatus.className = 'backend-status backend-ok';
            } else {
                backendStatus.textContent = 'No backend server — enter your Anthropic API key below';
                backendStatus.className = 'backend-status backend-warn';
            }
            backendHint.textContent = 'No backend proxy detected. You can use the app by providing your own API key.';
        }
        if (apiKeyGroup) {
            apiKeyGroup.style.display = '';
            if (apiKeyInput) apiKeyInput.value = savedKey;
        }
    }

    // ── Settings persistence ───────────────
    function loadSettings() {
        const model = localStorage.getItem('reprompt_model') || 'claude-sonnet-4-5-20250929';
        modelSelect.value = model;
    }

    function saveSettings() {
        localStorage.setItem('reprompt_model', modelSelect.value);

        // Persist client-side API key when in direct mode
        if (state.directMode && apiKeyInput) {
            const key = apiKeyInput.value.trim();
            if (key) {
                localStorage.setItem('reprompt_api_key', key);
            } else {
                localStorage.removeItem('reprompt_api_key');
            }
            // Re-evaluate readiness
            state.backendReady = key.length > 0;
            enableDirectMode();
        }
    }

    // ── Event wiring ───────────────────────
    function bindEvents() {
        // Mode buttons
        $$('.mode-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                $$('.mode-btn').forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');
                state.mode = btn.dataset.mode;
                updateButtonLabel();
            });
        });

        // Char count
        promptInput.addEventListener('input', updateCharCount);

        // Context toggle
        contextToggle.addEventListener('click', () => {
            contextToggle.classList.toggle('open');
            contextContent.classList.toggle('hidden');
        });

        // Enhance
        enhanceBtn.addEventListener('click', handleEnhance);

        // Copy
        copyBtn.addEventListener('click', handleCopy);

        // Re-run
        rerunBtn.addEventListener('click', handleEnhance);

        // Settings
        settingsBtn.addEventListener('click', () => {
            checkBackend();
            settingsModal.classList.remove('hidden');
        });
        settingsClose.addEventListener('click', () => settingsModal.classList.add('hidden'));
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) settingsModal.classList.add('hidden');
        });
        saveSettingsBtn.addEventListener('click', () => {
            saveSettings();
            settingsModal.classList.add('hidden');
        });

        // Image upload
        uploadBtn.addEventListener('click', () => imageInput.click());
        imageInput.addEventListener('change', handleImageUpload);
    }

    // ── Helpers ─────────────────────────────
    function updateCharCount() {
        charCount.textContent = promptInput.value.length;
    }

    function updateButtonLabel() {
        const labels = {
            enhance: 'Enhance Prompt',
            rewrite: 'Rewrite Prompt',
            analyze: 'Analyze Prompt',
        };
        btnText.textContent = labels[state.mode] || 'Enhance Prompt';
    }

    function setProcessing(on) {
        state.processing = on;
        enhanceBtn.disabled = on;
        btnText.classList.toggle('hidden', on);
        btnLoading.classList.toggle('hidden', !on);
    }

    // ── Image handling ─────────────────────
    function handleImageUpload(e) {
        const files = Array.from(e.target.files);
        files.forEach((file) => {
            if (!file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const dataUrl = ev.target.result;
                const base64 = dataUrl.split(',')[1];
                const mediaType = file.type;
                state.images.push({ file, dataUrl, base64, mediaType });
                renderImagePreviews();
            };
            reader.readAsDataURL(file);
        });
        imageInput.value = '';
    }

    function renderImagePreviews() {
        imagePreviewContainer.innerHTML = '';
        state.images.forEach((img, idx) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'image-preview';

            const imgEl = document.createElement('img');
            imgEl.src = img.dataUrl;
            imgEl.alt = 'Attached image';

            const removeBtn = document.createElement('button');
            removeBtn.className = 'image-remove';
            removeBtn.textContent = '\u00d7';
            removeBtn.addEventListener('click', () => {
                state.images.splice(idx, 1);
                renderImagePreviews();
            });

            wrapper.appendChild(imgEl);
            wrapper.appendChild(removeBtn);
            imagePreviewContainer.appendChild(wrapper);
        });
    }

    // ── System prompts per mode ────────────
    function getSystemPrompt(mode) {
        const base = `You are rePROMPT, an advanced AI prompt engineer created by VASEY/AI. Your sole purpose is to take user-submitted prompts and dramatically improve them for better results with large language models.`;

        const modes = {
            enhance: `${base}

TASK: Enhance the provided prompt. Make it:
- More specific and detailed with clear instructions
- Better structured with logical organization
- More effective at eliciting high-quality responses from any LLM
- Include relevant context, constraints, and desired output format
- Preserve the original intent while amplifying clarity and precision

If images are provided, incorporate visual context into the enhanced prompt. Describe what you see in the images and weave relevant details into the prompt.

Return ONLY the enhanced prompt text. Do not add explanations, notes, or meta-commentary. The user should be able to copy your entire response and paste it directly as a prompt.`,

            rewrite: `${base}

TASK: Completely rewrite the provided prompt from scratch.
- Reimagine the prompt with professional prompt-engineering best practices
- Use structured formatting (numbered steps, clear sections) where appropriate
- Add role assignments, constraints, and output formatting guidance
- Make the prompt comprehensive enough to produce excellent results on the first try

If images are provided, analyze them and incorporate visual details into the rewritten prompt.

Return ONLY the rewritten prompt text. No explanations or commentary.`,

            analyze: `${base}

TASK: Analyze the provided prompt and give actionable feedback.
- Rate the current prompt quality (1-10)
- Identify weaknesses: vagueness, missing context, poor structure, ambiguity
- List specific improvements with examples
- Provide a final "improved version" at the end

If images are provided, consider whether the prompt adequately references or leverages the visual content.

Format your analysis clearly with sections and the improved prompt at the end.`,
        };

        return modes[mode] || modes.enhance;
    }

    // ── API call ─────────────────────────
    async function callClaude(prompt, context, images, mode) {
        const model = localStorage.getItem('reprompt_model') || 'claude-sonnet-4-5-20250929';
        const system = getSystemPrompt(mode);

        // Build content array
        const content = [];

        // Add images first
        images.forEach((img) => {
            content.push({
                type: 'image',
                source: {
                    type: 'base64',
                    media_type: img.mediaType,
                    data: img.base64,
                },
            });
        });

        // Build text portion
        let userText = prompt;
        if (context && context.trim()) {
            userText += `\n\nAdditional context: ${context.trim()}`;
        }
        content.push({ type: 'text', text: userText });

        const body = {
            model,
            max_tokens: 4096,
            system,
            messages: [{ role: 'user', content }],
        };

        // Direct browser mode — call Anthropic API without a backend proxy
        if (state.directMode) {
            return callAnthropicDirect(body);
        }

        // Backend proxy mode
        const response = await fetch(apiUrl('/api/messages'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err?.error?.message || `Server error ${response.status}`);
        }

        const data = await response.json();
        return data.content?.[0]?.text || '';
    }

    // ── Direct Anthropic API call (browser → api.anthropic.com) ──
    async function callAnthropicDirect(body) {
        const apiKey = localStorage.getItem('reprompt_api_key');
        if (!apiKey) {
            throw new Error('No API key configured. Open Settings and enter your Anthropic API key.');
        }

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err?.error?.message || `Anthropic API error ${response.status}`);
        }

        const data = await response.json();
        return data.content?.[0]?.text || '';
    }

    // ── Main handler ───────────────────────
    async function handleEnhance() {
        const prompt = promptInput.value.trim();
        if (!prompt && state.images.length === 0) {
            promptInput.focus();
            return;
        }

        if (!state.backendReady) {
            settingsModal.classList.remove('hidden');
            if (!state.directMode) checkBackend();
            return;
        }

        setProcessing(true);
        outputSection.classList.add('hidden');

        try {
            const context = contextInput.value;
            const result = await callClaude(prompt, context, state.images, state.mode);
            outputContent.textContent = result;
            outputSection.classList.remove('hidden');
            outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (err) {
            outputContent.textContent = `Error: ${err.message}`;
            outputSection.classList.remove('hidden');
        } finally {
            setProcessing(false);
        }
    }

    // ── Copy ───────────────────────────────
    async function handleCopy() {
        const text = outputContent.textContent;
        if (!text) return;

        try {
            await navigator.clipboard.writeText(text);
        } catch {
            // Fallback
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }

        copyToast.classList.remove('hidden');
        setTimeout(() => copyToast.classList.add('hidden'), 2000);
    }

    // ── PWA registration ───────────────────
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').catch(() => {});
        });
    }

    // ── Boot ───────────────────────────────
    document.addEventListener('DOMContentLoaded', init);
})();
