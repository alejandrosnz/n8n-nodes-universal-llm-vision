import { UniversalLlmVisionApi } from '../../credentials/UniversalLlmVisionApi.credentials';

describe('UniversalLlmVisionApi Credentials', () => {
  let credentials: UniversalLlmVisionApi;

  beforeEach(() => {
    credentials = new UniversalLlmVisionApi();
  });

  it('should be defined', () => {
    expect(credentials).toBeDefined();
    expect(credentials.name).toBe('universalLlmVisionApi');
    expect(credentials.displayName).toBe('Universal LLM Vision API');
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