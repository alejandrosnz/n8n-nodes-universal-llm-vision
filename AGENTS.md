# AGENTS.md - Instructions for AI Coding Agents

> **Important**: You are working with an n8n community node starter template. Follow these instructions carefully to avoid common mistakes.

## 🚀 Quick Start

1. **Understand the request**: Identify service name, operations, and credentials.
2. **Clean up**: Remove example node and update package.json.
3. **Create node**: Use declarative or programmatic pattern based on API complexity.
4. **Add credentials**: Implement authentication if needed.
5. **Write tests**: Use agents/UNIT_TESTING.md for guidance.
6. **Test manually**: Follow agents/WORKFLOW_TESTING.md for workflow testing.
7. **Regenerate docs**: Update README.md from README_TEMPLATE.md.
8. **Build and verify**: Run npm run build, lint, and test.

For detailed steps, see below. To get more info about specific tasks, check agents/ folder.

## 🎯 Your Mission

When asked to create a new n8n node, you must:

1. **REPLACE** the example node, don't add alongside it
2. **UPDATE** all configuration files with the new service name
3. **REGENERATE** documentation using README_TEMPLATE.md
4. **MAINTAIN** the project structure and conventions

## ⚠️ Common Mistakes to AVOID

- ❌ Creating new nodes without removing `nodes/Example/`
- ❌ Forgetting to update `package.json` with new node name
- ❌ Not regenerating README.md from README_TEMPLATE.md
- ❌ Using generic names like "Example" in final code
- ❌ Breaking the directory structure

## 📋 Step-by-Step Workflow

### Step 1: Understand the Request

Ask clarifying questions if needed:
- What is the service/API name?
- What operations should the node support?
- Does it need credentials? What type (API key, OAuth, etc.)?
- Any specific requirements?

### Step 2: Clean Up Example Node

```bash
# Remove the example node completely
rm -rf nodes/Example/
rm -rf credentials/ExampleApi.credentials.ts
rm -rf __tests__/nodes/Example/
```

### Step 3: Create New Node Structure

```
nodes/
  └── [ServiceName]/
      ├── [ServiceName].node.ts
      ├── [ServiceName].node.json (optional, for declarative)
      ├── icon.svg
      └── descriptions/
          ├── [Resource1]Description.ts
          └── [Resource2]Description.ts
```

### Step 4: Update package.json

**CRITICAL**: Update these fields in `package.json`:

```json
{
  "name": "n8n-nodes-[servicename]",
  "version": "0.1.0",
  "description": "n8n node for [Service Name]",
  "keywords": ["n8n-community-node-package", "[servicename]"],
  "n8n": {
    "nodes": [
      "dist/nodes/[ServiceName]/[ServiceName].node.js"
    ],
    "credentials": [
      "dist/credentials/[ServiceName]Api.credentials.js"
    ]
  }
}
```

### Step 5: Create Credentials (if needed)

File: `credentials/[ServiceName]Api.credentials.ts`

```typescript
import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class [ServiceName]Api implements ICredentialType {
  name = '[serviceName]Api';
  displayName = '[Service Name] API';
  documentationUrl = 'https://docs.[service].com';
  
  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '=Bearer {{$credentials.apiKey}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: 'https://api.[service].com',
      url: '/v1/user', // or appropriate test endpoint
    },
  };
}
```

### Step 6: Create Node Implementation

Choose the appropriate pattern:

#### For Simple REST APIs (Declarative Pattern)

```typescript
import type {
  INodeType,
  INodeTypeDescription,
  INodeTypeBaseDescription,
} from 'n8n-workflow';

export class [ServiceName] implements INodeType {
  description: INodeTypeDescription;

  constructor(baseDescription: INodeTypeBaseDescription) {
    this.description = {
      ...baseDescription,
      displayName: '[Service Name]',
      name: '[serviceName]',
      icon: 'file:[serviceName].svg',
      group: ['transform'],
      version: 1,
      subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
      description: 'Interact with [Service Name] API',
      defaults: {
        name: '[Service Name]',
      },
      inputs: ['main'],
      outputs: ['main'],
      credentials: [
        {
          name: '[serviceName]Api',
          required: true,
        },
      ],
      requestDefaults: {
        baseURL: 'https://api.[service].com',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      },
      properties: [
        // Resource selector
        {
          displayName: 'Resource',
          name: 'resource',
          type: 'options',
          noDataExpression: true,
          options: [
            { name: 'User', value: 'user' },
            { name: 'Post', value: 'post' },
          ],
          default: 'user',
        },
        // Operation selector
        {
          displayName: 'Operation',
          name: 'operation',
          type: 'options',
          noDataExpression: true,
          displayOptions: {
            show: { resource: ['user'] },
          },
          options: [
            { name: 'Get', value: 'get', routing: { request: { method: 'GET', url: '=/users/{{$parameter.userId}}' }}},
            { name: 'List', value: 'list', routing: { request: { method: 'GET', url: '/users' }}},
          ],
          default: 'get',
        },
        // Add operation-specific parameters
      ],
    };
  }
}
```

#### For Complex Logic (Programmatic Pattern)

```typescript
import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';

export class [ServiceName] implements INodeType {
  description: INodeTypeDescription = {
    displayName: '[Service Name]',
    name: '[serviceName]',
    // ... (same as declarative)
    properties: [
      // Define parameters
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const resource = this.getNodeParameter('resource', 0);
    const operation = this.getNodeParameter('operation', 0);

    for (let i = 0; i < items.length; i++) {
      try {
        if (resource === 'user') {
          if (operation === 'get') {
            // Implementation
          }
        }
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({ json: { error: error.message }});
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}
```

### Step 7: Write Tests

Create tests in `__tests__/nodes/[ServiceName]/`:

```typescript
import { mock } from 'jest-mock-extended';
import type { IExecuteFunctions } from 'n8n-workflow';
import { [ServiceName] } from '../../../nodes/[ServiceName]/[ServiceName].node';

describe('[ServiceName] Node', () => {
  let mockExecuteFunctions: IExecuteFunctions;
  let node: [ServiceName];

  beforeEach(() => {
    mockExecuteFunctions = mock<IExecuteFunctions>();
    node = new [ServiceName]();
  });

  it('should be defined', () => {
    expect(node).toBeDefined();
    expect(node.description.displayName).toBe('[Service Name]');
  });

  // Add operation tests
});
```

### Step 8: Update README.md

**IMPORTANT**: Regenerate README using the template:

1. Read `README_TEMPLATE.md`
2. Replace all placeholders:
   - `[Service Name]` → Actual service name
   - `[serviceName]` → camelCase version
   - `n8n-nodes-starter` → `n8n-nodes-[servicename]`
3. Add actual operations and credentials info
4. Include usage examples
5. Save as `README.md`

### Step 9: Verify Changes

Run this checklist:

```bash
# Build check
npm run build

# Lint check
npm run lint

# Test check
npm test

# Verify package.json has correct:
# - name
# - description
# - n8n.nodes paths
# - n8n.credentials paths

# Verify no "Example" references remain:
grep -r "Example" nodes/ credentials/ --exclude-dir=node_modules
```

## 🎨 Node Design Guidelines

### Naming Conventions

- **Files**: `ServiceName.node.ts` (PascalCase)
- **Class names**: `export class ServiceName` (PascalCase)
- **Node name**: `name: 'serviceName'` (camelCase)
- **Credential name**: `name: 'serviceNameApi'` (camelCase + Api suffix)
- **Display names**: `displayName: 'Service Name'` (Title Case)

### Icon Guidelines

- Format: SVG
- Size: Approximately 60x60px
- Monochrome or brand colors
- Simple, recognizable design
- Save as: `icon.svg` in node directory

### Parameter Best Practices

1. **Always include Resource and Operation selectors** for multi-operation nodes
2. **Use `noDataExpression: true`** for resource/operation parameters
3. **Use `displayOptions`** to show/hide fields contextually
4. **Provide sensible defaults**
5. **Add helpful descriptions**
6. **Use proper parameter types** (string, options, number, boolean, etc.)

### Error Handling

```typescript
import { NodeOperationError } from 'n8n-workflow';

// For user errors
throw new NodeOperationError(this.getNode(), 'User ID is required');

// For API errors
throw new NodeApiError(this.getNode(), error);

// Support continue on fail
if (this.continueOnFail()) {
  returnData.push({ json: { error: error.message }});
  continue;
}
```

## 📚 Technical Reference

For detailed technical information, refer to:

- **Node Architecture**: See "Node Structure" section below
- **Testing Patterns**: `agents/UNIT_TESTING.md` - Detailed prompts for AI-assisted unit testing, including mocking strategies and test categories
- **Workflow Testing**: `agents/WORKFLOW_TESTING.md` - Guide for manual workflow testing in n8n, with example JSON structures
- **Quick Test Guide**: `agents/QUICK_GUIDE.md` - Fast reference for using AI to write tests
- **Publishing**: `docs/PUBLISHING.md` - Instructions for publishing your node to the n8n community

---

## Node Structure Reference

Every node implements the `INodeType` interface with:
- `description: INodeTypeDescription` - Node metadata and UI configuration
- `execute?()` - For programmatic nodes
- `poll?()` - For polling triggers (set `polling: true` in description)
- `trigger?()` - For generic triggers
- `webhook?()` - For webhook triggers
- `webhookMethods?` - Webhook lifecycle (checkExists, create, delete)
- `methods?` - loadOptions, listSearch, credentialTest, resourceMapping

## Node Types

### Programmatic Nodes
Use `execute` function for custom logic.

### Declarative Nodes
Use `requestDefaults` and routing configuration instead of `execute`.

#### Advanced Routing for Multiple Operations
For nodes with multiple operations, use a shared `routing` configuration with `preSend` to dynamically select operation-specific routing:

```typescript
routing: {
  request: { method: 'GET', url: '/base' },
  send: {
    preSend: [
      (request: IHttpRequestOptions) => {
        // Dynamically select routing based on operation for declarative nodes with multiple operations
        const operation = (request.body as { operation: string }).operation;
        switch (operation) {
          case 'list':
            return Promise.resolve({ ...request, ...ListOperation.Routing });
          case 'create':
            return Promise.resolve({ ...request, ...CreateOperation.Routing });
          // ... other operations
          default:
            return Promise.resolve(request);
        }
      }
    ]
  }
}
```

### Trigger Nodes
- **Webhook triggers**: Implement `webhook` and `webhookMethods` (checkExists, create, delete).
- **Polling triggers**: Set `polling: true` and implement `poll`. Use `getWorkflowStaticData('node')` to persist state.
- **Generic triggers**: Implement `trigger` function.

## Node Parameters

Common parameter types:
- `string` - Text input
- `options` - Dropdown (static or dynamic via `loadOptionsMethod`)
- `resourceLocator` - Select by list, ID, or URL
- `collection` - Key-value pairs
- `fixedCollection` - Structured collections

Use `displayOptions` to show/hide fields based on other parameters. Use `noDataExpression: true` for resource/operation selectors.

## Versioning

- **Light versioning**: Use version arrays in description: `version: [3, 3.1, 3.2]`
- **Full versioning**: Use `VersionedNodeType` class with separate version implementations.

## Credentials

Credentials are defined in `credentials/` directory and implement `ICredentialType`:
- `name` - Internal identifier
- `displayName` - Human-readable name
- `properties` - Credential fields
- `authenticate` - Authentication configuration (generic or custom function)
- `test` - Credential test request

Nodes can test credentials via `methods.credentialTest`.

## Testing

### Unit Tests
- Use `jest-mock-extended` for mocking interfaces
- Use `nock` for HTTP mocking
- Mock all external dependencies
- Test happy paths, error handling, edge cases, and binary data

## Best Practices

### TypeScript
- Never use `any` type - use proper types or `unknown`
- Avoid type casting with `as` - use type guards instead
- Define interfaces for API responses

### Error Handling
- Use `NodeOperationError` for user-facing errors
- Use `NodeApiError` for API-related errors
- Support `continueOnFail` option when appropriate

### Code Organization
- Separate operation/field descriptions into separate files
- Create reusable API request helpers in GenericFunctions
- Use marker interfaces to categorize classes (e.g., `implements [ServiceName]N8nResource`)
- Use kebab-case for files, PascalCase for classes

### UI/UX
- Use clear `displayName` and `description` fields
- Set sensible default values
- Use `displayOptions` to show/hide fields conditionally

---

## 🤖 Agent Communication Protocol

When you complete a task, provide a summary like this:

```
✅ Task Complete: Created [Service Name] Node

Changes made:
- ✅ Removed Example node
- ✅ Created [ServiceName] node with [X] operations
- ✅ Created [ServiceName]Api credentials
- ✅ Updated package.json
- ✅ Regenerated README.md
- ✅ Added unit tests

Next steps:
1. Run `npm install`
2. Run `npm run build`
3. Test the node locally in n8n
```

This helps track progress and ensures nothing was missed.
