/**
 * InternHub API Client Module
 * Provides robust Fetch API wrappers with AbortController timeout handling,
 * error classification, and configurable API base URL.
 */

// Configurable base URL: defaults to origin/relative path, easily overridden for remote deployments
const API_BASE_URL = (typeof window !== 'undefined' && window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL)
  ? window.APP_CONFIG.API_BASE_URL.replace(/\/+$/, '')
  : '';

const DEFAULT_TIMEOUT_MS = 10000;

/**
 * Custom error class for API interactions
 */
export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Internal helper to execute fetch with AbortController timeout
 */
async function fetchWithTimeout(url, options = {}, externalSignal = null) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new ApiError('You are currently offline. Please check your internet connection.', 0);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new Error('Request timed out. The server took too long to respond.'));
  }, options.timeout || DEFAULT_TIMEOUT_MS);

  // If an external signal was passed, connect it
  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(timeoutId);
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        controller.abort();
      });
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      if (externalSignal && externalSignal.aborted) {
        throw new ApiError('Request was superseded by a newer request.', 0);
      }
      throw new ApiError('Request timed out after 10 seconds. Please check your connection and retry.', 408);
    }
    throw new ApiError(err.message || 'Network connection failed. Please try again.', 0);
  }
}

/**
 * Fetch paginated and filtered list of internships
 * @param {Object} params - { search, domain, page, limit }
 * @param {AbortSignal} [signal] - Optional external AbortSignal
 * @returns {Promise<Object>} API response object
 */
export async function fetchInternships({ search = '', domain = '', page = 1, limit = 6 } = {}, signal = null) {
  const query = new URLSearchParams();
  if (search && search.trim()) query.set('search', search.trim());
  if (domain && domain.trim() && domain !== 'All') query.set('domain', domain.trim());
  if (page) query.set('page', String(page));
  if (limit) query.set('limit', String(limit));

  const url = `${API_BASE_URL}/api/internships?${query.toString()}`;

  const response = await fetchWithTimeout(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  }, signal);

  let result;
  try {
    result = await response.json();
  } catch {
    throw new ApiError('Unexpected response from server. Expected JSON data.', response.status);
  }

  if (!response.ok) {
    throw new ApiError(result.message || 'Failed to fetch internships from server.', response.status, result);
  }

  return result;
}

/**
 * Fetch a single internship by ID
 * @param {number|string} id
 * @param {AbortSignal} [signal]
 */
export async function fetchInternshipById(id, signal = null) {
  const url = `${API_BASE_URL}/api/internships/${encodeURIComponent(id)}`;

  const response = await fetchWithTimeout(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  }, signal);

  let result;
  try {
    result = await response.json();
  } catch {
    throw new ApiError('Unexpected response from server.', response.status);
  }

  if (!response.ok) {
    throw new ApiError(result.message || `Failed to fetch internship with ID ${id}.`, response.status, result);
  }

  return result;
}

/**
 * Submit an internship application
 * Note: Never automatically retries on timeout to avoid duplicate insertions.
 * @param {Object} applicationData
 * @param {AbortSignal} [signal]
 */
export async function submitApplicationApi(applicationData, signal = null) {
  const url = `${API_BASE_URL}/api/applications`;

  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(applicationData)
  }, signal);

  let result;
  try {
    result = await response.json();
  } catch {
    throw new ApiError('Server returned an unreadable response.', response.status);
  }

  if (!response.ok) {
    let customMessage = result.message || 'Application submission failed.';
    if (response.status === 429) {
      customMessage = 'Rate limit exceeded: You have submitted too many applications. Please wait 15 minutes before trying again.';
    } else if (response.status === 409) {
      customMessage = result.message || 'You have already applied for this internship position.';
    } else if (response.status === 404) {
      customMessage = result.message || 'The requested internship opportunity could not be found.';
    }
    throw new ApiError(customMessage, response.status, result);
  }

  return result;
}
