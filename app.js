/* =========================================
   rePROMPT — VASEY/AI
   Prompt enhancement powered by Claude API
   ========================================= */

(function () {
    'use strict';

    // ── State ──────────────────────────────
    const state = {
        mode: 'enhance',
        images: [],        // { file, dataUrl, base64, mediaType }
        processing: false,
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
    const apiKeyInput    = $('#apiKeyInput');
    const modelSelect    = $('#modelSelect');
    const toggleKeyVis   = $('#toggleKeyVis');
    const saveSettingsBtn = $('#saveSettingsBtn');
    const uploadBtn      = $('#uploadBtn');
    const imageInput     = $('#imageInput');
    const imagePreviewContainer = $('#imagePreviewContainer');

    // ── Init ───────────────────────────────
    function init() {
        loadSettings();
        bindEvents();
        updateCharCount();
    }

    // ── Settings persistence ───────────────
    function loadSettings() {
        const key = localStorage.getItem('reprompt_api_key') || '';
        const model = localStorage.getItem('reprompt_model') || 'claude-sonnet-4-5-20250929';
        apiKeyInput.value = key;
        modelSelect.value = model;
    }

    function saveSettings() {
        localStorage.setItem('reprompt_api_key', apiKeyInput.value.trim());
        localStorage.setItem('reprompt_model', modelSelect.value);
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
        settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
        settingsClose.addEventListener('click', () => settingsModal.classList.add('hidden'));
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) settingsModal.classList.add('hidden');
        });
        toggleKeyVis.addEventListener('click', () => {
            apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
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

    // ── API call ───────────────────────────
    async function callClaude(prompt, context, images, mode) {
        const apiKey = localStorage.getItem('reprompt_api_key');
        if (!apiKey) {
            throw new Error('API_KEY_MISSING');
        }

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
            throw new Error(err?.error?.message || `API error ${response.status}`);
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

        if (!localStorage.getItem('reprompt_api_key')) {
            settingsModal.classList.remove('hidden');
            apiKeyInput.focus();
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
            if (err.message === 'API_KEY_MISSING') {
                settingsModal.classList.remove('hidden');
                apiKeyInput.focus();
            } else {
                outputContent.textContent = `Error: ${err.message}`;
                outputSection.classList.remove('hidden');
            }
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
