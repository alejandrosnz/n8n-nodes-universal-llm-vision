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
    
    const propertyNames = credentials.properties.map(p => p.name);
    expect(propertyNames).toContain('provider');
    expect(propertyNames).toContain('apiKey');
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
    const apiKeyProp = credentials.properties.find(p => p.name === 'apiKey');
    expect((apiKeyProp as any)?.typeOptions?.password).toBe(true);
  });

  it('should provide provider selection in properties', () => {
    const providerProp = credentials.properties.find(p => p.name === 'provider');
    expect(providerProp).toBeDefined();
    expect(providerProp?.type).toBe('options');
  });
});