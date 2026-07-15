// functions/lib/errors.js
// Centralized error handling and response formatting

export class ApiError extends Error {
  constructor(message, status = 500, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export function sendError(err, requestPath = '') {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  const safeMessage = message
    .replace(/Bearer\s+[^\s]+/g, '[REDACTED_TOKEN]')
    .replace(/api[_-]?key[=:]\s*[^\s&]*/gi, '[REDACTED_KEY]')
    .replace(/@[\w.-]+\.\w+/g, '[REDACTED_EMAIL]');
  
  console.error(`[${status}] ${requestPath || 'unknown'}: ${safeMessage}`);
  
  return new Response(
    JSON.stringify({
      error: message,
      status: status
    }),
    {
      status: status,
      headers: {
        'Content-Type': 'application/json',
        'X-Error-Status': status.toString()
      }
    }
  );
}

export function sendSuccess(data = {}, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status: status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    }
  );
}

export async function parseJSON(request) {
  try {
    return await request.json();
  } catch (err) {
    throw new ApiError('Invalid JSON in request body', 400, { parseError: err.message });
  }
}

export async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    return response;
  } catch (err) {
    clearTimeout(timeout);
    
    if (err.name === 'AbortError') {
      throw new ApiError(`Request timeout after ${timeoutMs}ms`, 504);
    }
    
    throw err;
  }
}
