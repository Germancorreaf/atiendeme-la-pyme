// functions/lib/anthropic.js
// Wrapper for Anthropic Claude API calls

import { ApiError, fetchWithTimeout } from './errors.js';

const ANTHROPIC_API_BASE = 'https://api.anthropic.com/v1';
const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929';
const DEFAULT_TIMEOUT = 30000;

export async function callClaude(messages, systemPrompt, context, options = {}) {
  const {
    model = DEFAULT_MODEL,
    maxTokens = 1024,
    timeout = DEFAULT_TIMEOUT
  } = options;

  if (!context.env.ANTHROPIC_API_KEY) {
    throw new ApiError('Missing ANTHROPIC_API_KEY environment variable', 500);
  }

  const payload = {
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages
  };

  try {
    const response = await fetchWithTimeout(
      `${ANTHROPIC_API_BASE}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': context.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(payload)
      },
      timeout
    );

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error?.message || 'Anthropic API error';
      const status = data.error?.type === 'rate_limit_error' ? 429 : response.status;
      
      throw new ApiError(errorMsg, status, {
        anthropicError: data.error
      });
    }

    const textBlock = data.content?.find((block) => block.type === 'text');
    
    if (!textBlock || !textBlock.text) {
      throw new ApiError('No text content in Anthropic response', 500, {
        responseContent: data.content
      });
    }

    return textBlock.text;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }

    throw new ApiError(
      `Anthropic API call failed: ${err.message}`,
      500,
      { originalError: err.message }
    );
  }
}

export const AVAILABLE_MODELS = {
  'sonnet-latest': 'claude-sonnet-4-5-20250929',
  'haiku-latest': 'claude-haiku-4-5-20251001',
  'opus-latest': 'claude-opus-4-6'
};

export function getModelId(modelName = 'sonnet-latest') {
  return AVAILABLE_MODELS[modelName] || DEFAULT_MODEL;
}
