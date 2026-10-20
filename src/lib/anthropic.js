// src/lib/anthropic.js
// Wrapper for Anthropic Claude API calls

import { ApiError, fetchWithTimeout } from './errors.js';

const ANTHROPIC_API_BASE = 'https://api.anthropic.com/v1';
// Claude Haiku 5.5: el modelo más económico ($0,10 / $0,50 por millón de
// tokens de entrada / salida). Alcanza para conversar, responder y agendar.
// Piensa antes de responder (adaptive thinking por defecto): el esfuerzo
// `low` lo mantiene corto, y ese pensamiento cuenta dentro de max_tokens.
const DEFAULT_MODEL = 'claude-haiku-5-5';
const DEFAULT_EFFORT = 'low';
const DEFAULT_TIMEOUT = 30000;

export async function callClaude(messages, systemPrompt, context, options = {}) {
  const {
    model = DEFAULT_MODEL,
    effort = DEFAULT_EFFORT,
    maxTokens = 2048,
    timeout = DEFAULT_TIMEOUT,
    apiKeyVar = 'ANTHROPIC_API_KEY'
  } = options;

  const apiKey = context.env[apiKeyVar];

  if (!apiKey) {
    throw new ApiError(`Missing ${apiKeyVar} environment variable`, 500);
  }

  const payload = {
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages,
    output_config: { effort }
  };

  try {
    const response = await fetchWithTimeout(
      `${ANTHROPIC_API_BASE}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
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
      // stop_reason "refusal" (filtros de seguridad del modelo, con
      // stop_details.category) o "max_tokens" (el pensamiento usó el tope).
      throw new ApiError(`No text content in Anthropic response (stop_reason: ${data.stop_reason})`, 500, {
        stopReason: data.stop_reason,
        stopDetails: data.stop_details
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
