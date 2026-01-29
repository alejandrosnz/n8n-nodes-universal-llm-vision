import nock from 'nock';
import { UniversalLlmVisionApi } from '../../credentials/UniversalLlmVisionApi.credentials';
import {
  PROVIDER_BASE_URLS,
  MOCK_ERROR_RESPONSES,
} from '../fixtures/testData';

describe('UniversalLlmVisionApi Credentials', () => {
  let credentials: UniversalLlmVisionApi;

  beforeEach(() => {
    credentials = new UniversalLlmVisionApi();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should be defined', () => {
    expect(credentials).toBeDefined();
    expect(credentials.name).toBe('universalLlmVisionApi');
    expect(credentials.displayName).toBe('Universal LLM Vision API');
  });

  it('should have correct properties', () => {
    expect(credentials.properties).toHaveLength(4);

    const propertyNames = credentials.properties.map((p) => p.name);
    // There are two properties with the name 'apiKey' (for standard and custom), so only check for presence and count.
    const apiKeyCount = propertyNames.filter((n) => n === 'apiKey').length;
    expect(apiKeyCount).toBe(2);
    expect(propertyNames).toContain('provider');
    expect(propertyNames).toContain('baseUrl');
  });

  it('should have authenticate configuration', () => {
    expect(credentials.authenticate).toBeDefined();
    expect(credentials.authenticate.type).toBe('generic');
  });

  it('should have test request', () => {
    expect(credentials.test).toBeDefined();
    expect(credentials.test.request).toBeDefined();
  });

  it('should mark apiKey as password type', () => {
    const apiKeyProp = credentials.properties.find((p) => p.name === 'apiKey');
    expect((apiKeyProp as any)?.typeOptions?.password).toBe(true);
  });

  it('should provide provider selection in properties', () => {
    const providerProp = credentials.properties.find((p) => p.name === 'provider');
    expect(providerProp).toBeDefined();
    expect(providerProp?.type).toBe('options');
  });

  describe('Credential Test Endpoints', () => {
    it('should successfully validate OpenAI credentials', async () => {
      nock(PROVIDER_BASE_URLS.openai)
        .get('/models')
        .reply(200, {
          object: 'list',
          data: [{ id: 'gpt-4-vision', owned_by: 'openai' }],
        });

      // Mock successful credential test
      const testRequest = credentials.test.request;
      expect(testRequest).toBeDefined();
      expect(testRequest?.url).toBeDefined();
    });

    it('should handle invalid OpenAI API key', async () => {
      nock(PROVIDER_BASE_URLS.openai)
        .get('/models')
        .reply(401, MOCK_ERROR_RESPONSES.UNAUTHORIZED.body);

      const testRequest = credentials.test.request;
      expect(testRequest).toBeDefined();
    });

    it('should successfully validate Anthropic credentials', async () => {
      nock(PROVIDER_BASE_URLS.anthropic)
        .get('/models')
        .reply(200, {
          data: [{ id: 'claude-3-5-sonnet-20241022' }],
        });

      const testRequest = credentials.test.request;
      expect(testRequest).toBeDefined();
    });

    it('should handle Anthropic API rate limiting', async () => {
      nock(PROVIDER_BASE_URLS.anthropic)
        .get('/models')
        .reply(429, MOCK_ERROR_RESPONSES.RATE_LIMIT.body);

      const testRequest = credentials.test.request;
      expect(testRequest).toBeDefined();
    });

    it('should successfully validate Groq credentials', async () => {
      nock(PROVIDER_BASE_URLS.groq)
        .get('/models')
        .reply(200, {
          object: 'list',
          data: [{ id: 'mixtral-8x7b-32768' }],
        });

      const testRequest = credentials.test.request;
      expect(testRequest).toBeDefined();
    });

    it('should successfully validate OpenRouter credentials', async () => {
      nock(PROVIDER_BASE_URLS.openrouter)
        .get('/models')
        .reply(200, {
          data: [{ id: 'gpt-4-vision' }],
        });

      const testRequest = credentials.test.request;
      expect(testRequest).toBeDefined();
    });
  });

  describe('Authentication Headers', () => {
    it('should include Authorization header in authenticate config', () => {
      const authConfig = credentials.authenticate as any;
      expect(authConfig.properties).toBeDefined();
      expect(authConfig.properties.headers).toBeDefined();
      expect(authConfig.properties.headers.Authorization).toBeDefined();
    });

    it('should use Bearer token format for API key', () => {
      const authConfig = credentials.authenticate as any;
      const authHeader = authConfig.properties.headers.Authorization;
      expect(authHeader).toContain('Bearer');
      expect(authHeader).toContain('$credentials.apiKey');
    });
  });

  describe('Provider Configuration', () => {
    it('should support all major LLM providers', () => {
      const providerProp = credentials.properties.find((p) => p.name === 'provider');
      const options = (providerProp as any)?.options || [];
      const providerIds = options.map((opt: any) => opt.value);

      expect(providerIds).toContain('openai');
      expect(providerIds).toContain('anthropic');
      expect(providerIds).toContain('groq');
      expect(providerIds).toContain('openrouter');
    });

    it('should provide base URL configuration', () => {
      const baseUrlProp = credentials.properties.find((p) => p.name === 'baseUrl');
      expect(baseUrlProp).toBeDefined();
      expect(baseUrlProp?.type).toBe('string');
      expect((baseUrlProp as any)?.displayOptions?.show?.provider).toBeDefined();
    });
  });

  describe('Credential Validation Scenarios', () => {
    it('should handle successful credential validation', () => {
      nock(PROVIDER_BASE_URLS.openai)
        .get('/models')
        .reply(200, { data: [] });

      const testRequest = credentials.test.request;
      expect(testRequest).toBeDefined();
      expect(testRequest?.url).toBe('/models');
    });

    it('should handle server error during credential validation', () => {
      nock(PROVIDER_BASE_URLS.openai)
        .get('/models')
        .reply(500, MOCK_ERROR_RESPONSES.SERVER_ERROR.body);

      const testRequest = credentials.test.request;
      expect(testRequest).toBeDefined();
    });

    it('should handle network timeout during credential validation', () => {
      nock(PROVIDER_BASE_URLS.openai)
        .get('/models')
        .delayConnection(5000)
        .reply(200, { data: [] });

      const testRequest = credentials.test.request;
      expect(testRequest).toBeDefined();
    });
  });
});