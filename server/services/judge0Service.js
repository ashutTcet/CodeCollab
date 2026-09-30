const DEFAULT_POLL_INTERVAL_MS = 900;
const DEFAULT_MAX_POLLS = 18;
const DEFAULT_CPU_TIME_LIMIT = 2;
const DEFAULT_WALL_TIME_LIMIT = 5;
const DEFAULT_MEMORY_LIMIT_KB = 131072;
const DEFAULT_JUDGE0_BASE_URL = 'https://ce.judge0.com';
const DEFAULT_REQUEST_RETRIES = 3;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientStatus(status) {
  return status === 429 || (status >= 500 && status < 600);
}

function buildHeaders() {
  const headers = {
    'Content-Type': 'application/json',
  };

  const apiKey = process.env.JUDGE0_API_KEY;
  const rapidApiHost = process.env.JUDGE0_RAPIDAPI_HOST;
  const authToken = process.env.JUDGE0_AUTH_TOKEN;
  const authUser = process.env.JUDGE0_AUTH_USER;

  if (apiKey && rapidApiHost) {
    headers['X-RapidAPI-Key'] = apiKey;
    headers['X-RapidAPI-Host'] = rapidApiHost;
  } else if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  if (authToken) {
    headers['X-Auth-Token'] = authToken;
  }

  if (authUser) {
    headers['X-Auth-User'] = authUser;
  }

  return headers;
}

function normalizeBaseUrl() {
  const configured = (process.env.JUDGE0_BASE_URL || DEFAULT_JUDGE0_BASE_URL).trim();
  return configured.replace(/\/$/, '');
}

function isPendingStatus(statusId) {
  return statusId === 1 || statusId === 2;
}

class Judge0Service {
  constructor() {
    this.baseUrl = normalizeBaseUrl();
    this.headers = buildHeaders();
    this.pollInterval = Number(process.env.JUDGE0_POLL_INTERVAL_MS || DEFAULT_POLL_INTERVAL_MS);
    this.maxPolls = Number(process.env.JUDGE0_MAX_POLLS || DEFAULT_MAX_POLLS);
    this.requestRetries = Number(process.env.JUDGE0_REQUEST_RETRIES || DEFAULT_REQUEST_RETRIES);
  }

  get isConfigured() {
    return Boolean(this.baseUrl);
  }

  ensureConfigured() {
    if (!this.isConfigured) {
      const error = new Error('Code execution service is temporarily unavailable.');
      error.status = 503;
      throw error;
    }
  }

  async submitCode(payload) {
    this.ensureConfigured();

    const response = await this.fetchWithRetry(
      `${this.baseUrl}/submissions?base64_encoded=false&wait=false`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.token) {
      const error = new Error('Code execution service is temporarily unavailable.');
      error.status = 503;
      throw error;
    }

    return data.token;
  }

  async getSubmission(token) {
    const response = await this.fetchWithRetry(
      `${this.baseUrl}/submissions/${token}?base64_encoded=false&fields=*`,
      {
        method: 'GET',
        headers: this.headers,
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error('Code execution service is temporarily unavailable.');
      error.status = 503;
      throw error;
    }

    return data;
  }

  async fetchWithRetry(url, options) {
    let lastError = null;

    for (let attempt = 0; attempt < this.requestRetries; attempt += 1) {
      try {
        const response = await fetch(url, options);

        if (isTransientStatus(response.status) && attempt < this.requestRetries - 1) {
          await delay(250 * (attempt + 1));
          continue;
        }

        return response;
      } catch (error) {
        lastError = error;

        if (attempt < this.requestRetries - 1) {
          await delay(250 * (attempt + 1));
          continue;
        }
      }
    }

    const transportError = new Error('Code execution service is temporarily unavailable.');
    transportError.status = 503;
    transportError.cause = lastError;
    throw transportError;
  }

  async runCode({ languageId, sourceCode, stdin }) {
    const token = await this.submitCode({
      language_id: languageId,
      source_code: sourceCode,
      stdin: stdin || '',
      cpu_time_limit: Number(process.env.JUDGE0_CPU_TIME_LIMIT || DEFAULT_CPU_TIME_LIMIT),
      wall_time_limit: Number(process.env.JUDGE0_WALL_TIME_LIMIT || DEFAULT_WALL_TIME_LIMIT),
      memory_limit: Number(process.env.JUDGE0_MEMORY_LIMIT_KB || DEFAULT_MEMORY_LIMIT_KB),
    });

    let submission = null;

    for (let attempt = 0; attempt < this.maxPolls; attempt += 1) {
      submission = await this.getSubmission(token);
      if (!isPendingStatus(submission.status?.id)) {
        break;
      }
      await delay(this.pollInterval);
    }

    if (!submission || isPendingStatus(submission.status?.id)) {
      const timeoutError = new Error('Execution timed out while waiting for sandbox response.');
      timeoutError.status = 504;
      throw timeoutError;
    }

    return submission;
  }
}

module.exports = new Judge0Service();
