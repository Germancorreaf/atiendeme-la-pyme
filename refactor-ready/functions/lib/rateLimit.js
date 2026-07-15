// functions/lib/rateLimit.js
// Rate limiting using Cloudflare KV namespace

import { ApiError } from './errors.js';

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
  
  try {
    const current = await kvNamespace.get(key, 'json');
    const now = Date.now();
    
    if (!current) {
      await kvNamespace.put(
        key,
        JSON.stringify({
          count: 1,
          resetAt: now + windowSeconds * 1000,
          requests: [now]
        }),
        { expirationTtl: windowSeconds }
      );
      
      return { allowed: true };
    }

    if (now > current.resetAt) {
      await kvNamespace.put(
        key,
        JSON.stringify({
          count: 1,
          resetAt: now + windowSeconds * 1000,
          requests: [now]
        }),
        { expirationTtl: windowSeconds }
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

    current.count++;
    current.requests = (current.requests || []).slice(-9);
    current.requests.push(now);
    
    await kvNamespace.put(
      key,
      JSON.stringify(current),
      { expirationTtl: windowSeconds }
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
  
  try {
    const current = await kvNamespace.get(key, 'json');
    const now = Date.now();
    const windowStart = now - burstWindowSeconds * 1000;
    
    if (!current) {
      await kvNamespace.put(
        key,
        JSON.stringify({ requests: [now] }),
        { expirationTtl: burstWindowSeconds }
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
      { expirationTtl: burstWindowSeconds }
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

export async function resetRateLimit(identifier, kvNamespace) {
  if (!kvNamespace) return;

  try {
    await kvNamespace.delete(`rl:${identifier}`);
    await kvNamespace.delete(`burst:${identifier}`);
    return { success: true };
  } catch (err) {
    console.error('Reset rate limit error:', err.message);
    return { success: false, error: err.message };
  }
}
