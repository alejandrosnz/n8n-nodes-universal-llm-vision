# Development Guide

This guide covers local development, testing, and deployment of n8n community nodes using this boilerplate.

## Local Development Setup

### Prerequisites

- **Node.js**: >= 20.15 (matches n8n requirements)
- **npm**: Latest version
- **Git**: For version control

### Installation

```bash
# Clone your forked repository
git clone https://github.com/alejandrosnz/n8n-nodes-your-api.git
cd n8n-nodes-your-api

# Install dependencies
npm install

# Verify installation
npm run build
npm test
```

### Development Workflow

```bash
# Start TypeScript watch mode
npm run dev

# In another terminal, run tests
npm test

# Or run tests in watch mode
npm test -- --watch
```

## Project Structure

```
├── nodes/ExampleService/          # Your node implementation
├── credentials/                   # Authentication definitions
├── tests/                        # Test files
├── docs/                         # Documentation
├── .github/workflows/            # CI/CD pipelines
├── package.json                  # Node configuration
├── tsconfig.json                 # TypeScript config
└── gulpfile.js                   # Build automation
```

## Customizing the Boilerplate

### 1. Update Package Information

Edit `package.json`:

```json
{
  "name": "n8n-nodes-your-api-name",
  "description": "Description of your API integration",
  "author": {
    "name": "Your Name",
    "email": "your.email@example.com"
  },
  "repository": {
    "url": "https://github.com/alejandrosnz/n8n-nodes-your-api-name.git"
  }
}
```

### 2. Configure Your API Credentials

Edit `credentials/ExampleServiceApi.credentials.ts`:

```typescript
export class YourApiCredentials implements ICredentialType {
  name = 'yourApi';
  displayName = 'Your API';

  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      default: '',
    },
    // Add other required fields
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: 'Bearer {{$credentials.apiKey}}',
      },
    },
  };
}
```

### 3. Update Node Definition

Edit `nodes/ExampleService/ExampleService.node.ts`:

```typescript
export class YourService implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Your API Service',
    name: 'yourService',
    description: 'Integrate with Your API',
    // Update other properties...
  };
}
```

### 4. Implement Your Operations

Create operation files in `nodes/ExampleService/resources/yourResource/`:

```typescript
export class YourOperation {
  static readonly OperationId = 'yourOperation';

  static readonly Fields: INodeProperties[] = [
    {
      displayName: 'Parameter Name',
      name: 'parameterName',
      type: 'string',
      default: '',
      required: true,
    },
  ];

  static readonly Routing = {
    request: {
      method: 'GET',
      url: '/your-endpoint',
    },
  };
}
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/nodes/ExampleService/ExampleService.node.test.ts

# Run tests in watch mode
npm test -- --watch
```

### Writing Tests

#### Unit Tests

Test individual operations and routing:

```typescript
describe('ListItemsOperation', () => {
  it('should have correct operation metadata', () => {
    expect(ListItemsOperation.OperationId).toBe('listItems');
    expect(ListItemsOperation.Operation.name).toBe('List Items');
  });

  it('should have required fields', () => {
    const fields = ListItemsOperation.Fields;
    expect(fields).toContainEqual(
      expect.objectContaining({ name: 'returnAll' })
    );
  });
});
```

#### Integration Tests

For integration testing, manually test with example workflows in the `example-workflow.json` file. Use n8n's workflow editor to run and verify node behavior.

### Mocking HTTP Requests

Use nock to mock API responses in unit tests:

```typescript
import nock from 'nock';

describe('API Integration', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  it('should handle successful responses', () => {
    nock('https://api.example.com')
      .get('/items')
      .reply(200, [{ id: 1, name: 'Item 1' }]);
  });

  it('should handle errors', () => {
    nock('https://api.example.com')
      .get('/items')
      .reply(500, { error: 'Internal Server Error' });
  });
});
```

## Building and Publishing

### Local Build

```bash
# Build TypeScript and copy assets
npm run build

# Lint code
npm run lint

# Fix linting issues
npm run lintfix
```

### Linking to Local n8n

To test your node in a local n8n instance:

1. **Build your node**:
   ```bash
   npm run build
   ```

2. **Link to n8n** (if using npm link):
   ```bash
   cd /path/to/your/n8n/installation
   npm link /path/to/your/node/package
   ```

3. **Or use community node loading**:
   - Copy your built node to n8n's custom nodes directory
   - Restart n8n

### Publishing to npm

```bash
# Manual publishing
npm publish

# Or use automated releases
npm run release
```

## Debugging

### Common Issues

1. **TypeScript errors**:
   ```bash
   npx tsc --noEmit
   ```

2. **ESLint issues**:
   ```bash
   npm run lint
   npm run lintfix
   ```

3. **Test failures**:
   - Check nock mocks are properly configured
   - Verify credential setup
   - Ensure routing configuration is correct

### Development Tips

- **Use watch mode**: `npm run dev` for automatic rebuilding
- **Test frequently**: Run tests after each change
- **Check n8n logs**: Look for node loading errors
- **Validate credentials**: Test authentication separately
- **Use breakpoints**: Debug with your IDE's TypeScript debugger

## Contributing

1. **Follow the architecture**: Maintain Resource/Operation pattern
2. **Add tests**: Every new feature needs tests
3. **Update documentation**: Keep docs in sync
4. **Use TypeScript**: Full type safety required
5. **Follow conventions**: Consistent naming and structure

## Resources

- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)
- [n8n Node Development Guide](https://docs.n8n.io/integrations/community-nodes/node-development/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)