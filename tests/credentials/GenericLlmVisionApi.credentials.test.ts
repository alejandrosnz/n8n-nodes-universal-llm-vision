import { GenericLlmVisionApi } from 'credentials/GenericLlmVisionApi.credentials';

describe('GenericLlmVisionApi Credentials', () => {
  let credentials: GenericLlmVisionApi;

  beforeEach(() => {
    credentials = new GenericLlmVisionApi();
  });

  it('should be defined', () => {
    expect(credentials).toBeDefined();
    expect(credentials.name).toBe('genericLlmVisionApi');
    expect(credentials.displayName).toBe('Generic LLM Vision API');
  });

  it('should have correct properties', () => {
    expect(credentials.properties).toHaveLength(3);
    expect(credentials.properties[0].name).toBe('provider');
    expect(credentials.properties[1].name).toBe('apiKey');
    expect(credentials.properties[2].name).toBe('baseUrl');
  });

  it('should have authenticate configuration', () => {
    expect(credentials.authenticate.type).toBe('generic');
    expect((credentials.authenticate as any).properties.headers.Authorization).toBe('=Bearer {{$credentials.apiKey}}');
  });

  it('should have test request', () => {
    expect(credentials.test.request.url).toBe('/models');
    expect(credentials.test.request.baseURL).toContain('$credentials.provider');
  });
});