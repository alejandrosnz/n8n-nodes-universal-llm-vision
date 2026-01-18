export default {
  preset: 'ts-jest',
  moduleNameMapper: {
    '^nodes/(.*)$': '<rootDir>/nodes/$1',
    '^credentials/(.*)$': '<rootDir>/credentials/$1',
  },
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
};