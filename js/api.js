/**
 * Analytics Hub - API Client
 * Thin fetch wrapper for communicating with the Lambda backend.
 * Includes TTL cache with request coalescing and prefix-based invalidation.
 */
const ApiClient = (function() {
  'use strict';

  // Cache: key = URL path, value = { data, expiry }
  const _cache = new Map();
  // Inflight: key = URL path, value = Promise (request coalescing)
  const _inflight = new Map();

  const DEFAULT_TTL = 2 * 60000;     // 2 minutes (mutations invalidate immediately)
  const DIVISIONS_TTL = 5 * 60000;   // 5 minutes (static data)

  function getBaseUrl() {
    return (AppConfig.API_BASE_URL || '').replace(/\/$/, '');
  }

  function getTTL(path) {
    return path === '/api/divisions' ? DIVISIONS_TTL : DEFAULT_TTL;
  }

  /** Extract resource prefix: /api/documents/abc123 → /api/documents */
  function getPrefix(path) {
    const clean = path.split('?')[0];       // strip query string
    const parts = clean.split('/');          // ['', 'api', 'documents', 'abc123']
    // keep up to 3 parts: ['', 'api', 'resource']
    return parts.slice(0, 3).join('/');
  }

  function invalidatePrefix(prefix) {
    for (const key of _cache.keys()) {
      if (key.startsWith(prefix)) {
        _cache.delete(key);
      }
    }
    // Also clear any inflight for this prefix so next read re-fetches
    for (const key of _inflight.keys()) {
      if (key.startsWith(prefix)) {
        _inflight.delete(key);
      }
    }
  }

  async function request(method, path, body) {
    const url = getBaseUrl() + path;
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API ${method} ${path} failed (${response.status}): ${errorBody}`);
    }
    return response.json();
  }

  async function cachedGet(path) {
    // 1. Cache hit
    const cached = _cache.get(path);
    if (cached && Date.now() < cached.expiry) {
      return structuredClone(cached.data);
    }

    // 2. Request coalescing — reuse inflight promise
    if (_inflight.has(path)) {
      const data = await _inflight.get(path);
      return structuredClone(data);
    }

    // 3. New fetch
    const promise = request('GET', path).then(data => {
      _cache.set(path, { data, expiry: Date.now() + getTTL(path) });
      _inflight.delete(path);
      return data;
    }).catch(err => {
      _inflight.delete(path);
      throw err;
    });

    _inflight.set(path, promise);
    const data = await promise;
    return structuredClone(data);
  }

  async function mutate(method, path, body) {
    const result = await request(method, path, body);
    invalidatePrefix(getPrefix(path));
    return result;
  }

  return {
    get:    (path) => cachedGet(path),
    post:   (path, body) => mutate('POST', path, body),
    put:    (path, body) => mutate('PUT', path, body),
    delete: (path) => mutate('DELETE', path)
  };
})();
