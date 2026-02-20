'use strict';

const MAX_TEXT_LENGTH = 50000;
const MAX_MESSAGES = 24;
const ALLOWED_ROLES = new Set(['user', 'assistant']);
const MODEL_PATTERN = /^[A-Za-z0-9._:-]{1,120}$/;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function setSecurityHeaders(res) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
}

function validateMessagesPayload(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return { ok: false, message: 'Request body must be a JSON object.' };
    }

    const { model, messages } = body;

    if (typeof model !== 'string' || !MODEL_PATTERN.test(model)) {
        return { ok: false, message: 'Invalid model value.' };
    }

    if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
        return { ok: false, message: `messages[] is required and must have 1-${MAX_MESSAGES} items.` };
    }

    for (const message of messages) {
        if (!message || typeof message !== 'object') {
            return { ok: false, message: 'Each message must be an object.' };
        }

        if (!ALLOWED_ROLES.has(message.role)) {
            return { ok: false, message: 'Each message role must be user or assistant.' };
        }

        if (typeof message.content === 'string') {
            if (message.content.length === 0 || message.content.length > MAX_TEXT_LENGTH) {
                return { ok: false, message: 'Message text must be between 1 and 50000 characters.' };
            }
            continue;
        }

        if (!Array.isArray(message.content) || message.content.length === 0) {
            return { ok: false, message: 'Message content must be a non-empty string or array.' };
        }

        for (const block of message.content) {
            if (!block || typeof block !== 'object' || typeof block.type !== 'string') {
                return { ok: false, message: 'Each content block must be an object with a type.' };
            }

            if (block.type === 'text') {
                if (typeof block.text !== 'string' || block.text.length === 0 || block.text.length > MAX_TEXT_LENGTH) {
                    return { ok: false, message: 'Text blocks must include 1-50000 characters of text.' };
                }
                continue;
            }

            if (block.type === 'image') {
                const source = block.source || {};
                if (
                    source.type !== 'base64' ||
                    !ALLOWED_IMAGE_TYPES.has(source.media_type) ||
                    typeof source.data !== 'string' ||
                    source.data.length === 0
                ) {
                    return { ok: false, message: 'Image blocks must include valid base64 image data.' };
                }
                continue;
            }

            return { ok: false, message: 'Unsupported content block type.' };
        }
    }

    return { ok: true };
}

module.exports = {
    setSecurityHeaders,
    validateMessagesPayload,
};
