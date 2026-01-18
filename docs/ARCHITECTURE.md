# Architecture Guide

This document explains the architectural patterns used in this n8n community nodes boilerplate.

## Declarative Node Architecture

Unlike programmatic nodes that implement `execute()` methods, this boilerplate uses **declarative nodes** that leverage n8n's built-in HTTP client.

### Benefits

- **Simpler code**: No custom execution logic
- **Automatic HTTP handling**: n8n manages requests/responses
- **Better performance**: Built-in connection pooling and error handling
- **Agent compatibility**: Works seamlessly with n8n Agents

### Structure

```typescript
export class ExampleService implements INodeType {
  description: INodeTypeDescription = {
    // Node metadata
    displayName: 'Example Service',
    name: 'exampleService',

    // Agent compatibility
    usableAsTool: true,

    // HTTP configuration
    requestDefaults: {
      baseURL: '={{$credentials.baseUrl}}',
      headers: { 'Content-Type': 'application/json' }
    },

    // UI properties
    properties: [
      // Resource selector
      // Operation selector
      // Operation parameters
    ]
  };
}
```

## Resource/Operation Pattern

The boilerplate organizes API operations using a hierarchical pattern:

```
Resource (API domain)
├── Operation 1 (endpoint)
├── Operation 2 (endpoint)
└── Operation 3 (endpoint)
```

### Benefits

- **Scalable**: Easy to add new operations
- **Organized**: Clear separation of concerns
- **Testable**: Each operation can be tested independently
- **Reusable**: Operations can be shared across resources

### Implementation

**Resource** (`ItemCrudResource.ts`):
```typescript
export class ItemCrudResource {
  static readonly Operations: INodeProperties[] = [
    {
      // Operation selector dropdown
      displayName: 'Operation',
      name: 'operation',
      options: [/* operation list */]
    },
    // All operation fields
    ...ListItemsOperation.Fields,
    ...CreateItemOperation.Fields,
    // etc.
  ];
}
```

**Operation** (`ListItemsOperation.ts`):
```typescript
export class ListItemsOperation {
  static readonly OperationId = 'listItems';
  static readonly Operation = { /* dropdown option */ };
  static readonly Fields = [ /* parameter definitions */ ];
  static readonly Routing = { /* HTTP configuration */ };
}
```

## Routing Configuration

Each operation defines how HTTP requests are made and responses are processed.

### Request Configuration

```typescript
static readonly Routing = {
  request: {
    method: 'GET',
    url: '/posts',  // or dynamic: '=/posts/{{$parameter.itemId}}'
  }
};
```

### Request Transformation

```typescript
static readonly Routing = {
  send: {
    preSend: [
      (request) => {
        // Transform request before sending
        const { title, body } = request.body;
        request.body = { title, body };
        return request;
      }
    ]
  }
};
```

### Response Transformation

```typescript
static readonly Routing = {
  output: {
    postReceive: [
      (items) => {
        // Transform response data
        return items.map(item => ({
          id: item.id,
          title: item.title
        }));
      }
    ]
  }
};
```

## File Organization

```
nodes/
└── ExampleService/           # Node package
    ├── ExampleService.node.ts    # Main node class
    ├── example.svg               # Node icon
    ├── generic/                  # Type definitions
    │   ├── ExampleServiceN8nResource.ts
    │   └── ExampleServiceN8nOperation.ts
    └── resources/                # API operations
        ├── index.ts              # Resource exports
        ├── ItemCrudResource.ts   # Resource definition
        └── itemCrud/             # Operation implementations
            ├── index.ts         # Operation exports
            ├── ListItemsOperation.ts
            ├── GetItemOperation.ts
            └── ...
```

## n8n Agents Compatibility

The boilerplate is designed to work with n8n Agents:

### Required Properties

```typescript
{
  usableAsTool: true,  // Makes node available to agents
  // Clear parameter descriptions
  // Sensible defaults
  // Well-structured options
}
```

### Agent Benefits

- **Natural language invocation**: Agents can call your node operations
- **Parameter assistance**: AI helps fill complex parameters
- **Workflow generation**: Agents can create workflows using your nodes

## TypeScript Integration

Full TypeScript support with:

- **Strict typing**: All n8n interfaces properly typed
- **Path mapping**: Clean imports with `@/` aliases
- **Type checking**: Compile-time error detection
- **IDE support**: Better autocomplete and refactoring

## Testing Strategy

### Unit Tests

- **Operation validation**: Test parameter structures
- **Routing verification**: Ensure correct HTTP configuration
- **Type checking**: Validate TypeScript compilation

### Integration Tests

- **Workflow testing**: Manual testing with example workflows
- **HTTP mocking**: nock for reliable API simulation
- **Error scenarios**: Test failure conditions

## Extending the Boilerplate

### Adding a New Operation

1. Create operation file in `resources/operationName/`
2. Define `OperationId`, `Operation`, `Fields`, `Routing`
3. Add to resource's `Operations` array
4. Add to operation selector options
5. Create tests

### Adding a New Resource

1. Create resource directory under `resources/`
2. Implement resource class with operations
3. Add to node's resource selector
4. Update routing logic
5. Add comprehensive tests

### Custom Authentication

1. Modify `credentials/ExampleServiceApi.credentials.ts`
2. Update `authenticate` block for your auth method
3. Adjust `test` block for credential validation
4. Update node configuration

This architecture provides a solid foundation for building maintainable, scalable n8n community nodes.