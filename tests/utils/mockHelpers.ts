/**
 * Test utilities for mocking IExecuteFunctions
 * Provides factory functions for creating mock execute function instances
 */

import type { IExecuteFunctions } from 'n8n-workflow';

/**
 * Creates a mock IExecuteFunctions object for testing
 * Provides default implementations of commonly used methods
 */
export const createMockExecuteFunctions = (): Partial<IExecuteFunctions> & {
  getNodeParameter: jest.Mock;
  getInputData: jest.Mock;
  getCredentials: jest.Mock;
  getBinaryData: jest.Mock;
  continueOnFail: jest.Mock;
  getNode: jest.Mock;
  helpers?: any;
} => ({
  getNodeParameter: jest.fn(),
  getInputData: jest.fn(),
  getCredentials: jest.fn(),
  getBinaryData: jest.fn(),
  continueOnFail: jest.fn(() => false),
  getNode: jest.fn(() => ({ typeVersion: 1.1 })),
  helpers: {
    request: jest.fn(),
    getBinaryDataBuffer: jest.fn(),
  },
});

/**
 * Creates a mock that implements parameter getter by object lookup
 * Usage: mockExecuteFunctions.getNodeParameter.mockImplementation(
 *          createParamGetter(MOCK_NODE_PARAMS.basic)
 *        )
 */
export const createParamGetter = (params: Record<string, any>) => {
  return (paramName: string) => (params as any)[paramName];
};
