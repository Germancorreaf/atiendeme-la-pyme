// src/lib/rateLimit.js
// Rate limiting using Cloudflare KV namespace

const DEFAULT_MAX_REQUESTS = 10;
const DEFAULT_WINDOW_SECONDS = 60;
const DEFAULT_BURST_LIMIT = 3;

export async function checkRateLimit(
  identifier,
  kvNamespace,
  maxRequests = DEFAULT_MAX_REQUESTS,
  windowSeconds = DEFAULT_WINDOW_SECONDS
) {
  if (!kvNamespace) {
    console.warn('Rate limiting disabled: no KV namespace provided');
    return { allowed: true };
  }

  const key = `rl:${identifier}`;
  // Cloudflare KV rechaza expirationTtl < 60s (el put lanza y el catch de
  // abajo dejaba pasar la request sin límite).
  const kvTtl = Math.max(60, windowSeconds);

  try {
    const current = await kvNamespace.get(key, 'json');
    const now = Date.now();
    
    if (!current || now > current.resetAt) {
      await kvNamespace.put(
        key,
        JSON.stringify({ count: 1, resetAt: now + windowSeconds * 1000 }),
        { expirationTtl: kvTtl }
      );
      return { allowed: true };
    }

    if (current.count >= maxRequests) {
      const retryAfter = Math.ceil((current.resetAt - now) / 1000);
      
      return {
        allowed: false,
        retryAfter,
        limitExceeded: true
      };
    }

    await kvNamespace.put(
      key,
      JSON.stringify({ count: current.count + 1, resetAt: current.resetAt }),
      { expirationTtl: kvTtl }
    );

    return { allowed: true };
  } catch (err) {
    console.error('Rate limit check error:', err.message);
    return { allowed: true };
  }
}

export async function checkBurstLimit(
  identifier,
  kvNamespace,
  maxBurstRequests = DEFAULT_BURST_LIMIT,
  burstWindowSeconds = 5
) {
  if (!kvNamespace) {
    return { allowed: true };
  }

  const key = `burst:${identifier}`;
  // Cloudflare KV exige expirationTtl >= 60s, aunque la ventana de burst
  // real (usada para filtrar los timestamps) sea más corta.
  const kvTtl = Math.max(60, burstWindowSeconds);

  try {
    const current = await kvNamespace.get(key, 'json');
    const now = Date.now();
    const windowStart = now - burstWindowSeconds * 1000;

    if (!current) {
      await kvNamespace.put(
        key,
        JSON.stringify({ requests: [now] }),
        { expirationTtl: kvTtl }
      );
      return { allowed: true };
    }

    const recentRequests = (current.requests || []).filter(
      timestamp => timestamp > windowStart
    );

    if (recentRequests.length >= maxBurstRequests) {
      return {
        allowed: false,
        burstDetected: true,
        retryAfter: burstWindowSeconds
      };
    }

    recentRequests.push(now);
    await kvNamespace.put(
      key,
      JSON.stringify({ requests: recentRequests }),
      { expirationTtl: kvTtl }
    );

    return { allowed: true };
  } catch (err) {
    console.error('Burst limit check error:', err.message);
    return { allowed: true };
  }
}

export async function checkAllLimits(
  identifier,
  kvNamespace,
  options = {}
) {
  const {
    maxRequests = DEFAULT_MAX_REQUESTS,
    windowSeconds = DEFAULT_WINDOW_SECONDS,
    maxBurstRequests = DEFAULT_BURST_LIMIT,
    burstWindowSeconds = 5
  } = options;

  const burstCheck = await checkBurstLimit(
    identifier,
    kvNamespace,
    maxBurstRequests,
    burstWindowSeconds
  );

  if (!burstCheck.allowed) {
    return {
      allowed: false,
      reason: 'Burst limit exceeded',
      retryAfter: burstCheck.retryAfter
    };
  }

  const rlCheck = await checkRateLimit(
    identifier,
    kvNamespace,
    maxRequests,
    windowSeconds
  );

  if (!rlCheck.allowed) {
    return {
      allowed: false,
      reason: 'Rate limit exceeded',
      retryAfter: rlCheck.retryAfter
    };
  }

  return { allowed: true };
}
