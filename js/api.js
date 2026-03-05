/**
 * Analytics Hub - API Client
 * Thin fetch wrapper for communicating with the Lambda backend.
 */
const ApiClient = (function() {
  'use strict';

  function getBaseUrl() {
    return (AppConfig.API_BASE_URL || '').replace(/\/$/, '');
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

  return {
    get:    (path) => request('GET', path),
    post:   (path, body) => request('POST', path, body),
    put:    (path, body) => request('PUT', path, body),
    delete: (path) => request('DELETE', path)
  };
})();
