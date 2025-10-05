module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/__tests__/**',
    '!src/setupTests.ts',
    // Exclude infrastructure/initialization code
    '!src/index.ts',
    '!src/database/redis.ts',
    '!src/database/pool.ts',
    '!src/database/migrate.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 59,
      lines: 65,
      statements: 65
    }
  }
};
