module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  // Transform ESM packages shipped by @nestjs/* and better-auth
  transformIgnorePatterns: [
    'node_modules/(?!(@nestjs/(config|swagger|terminus|bullmq|bull-shared|throttler)|better-auth)/)',
  ],
  moduleNameMapper: {
    '^better-auth$': '<rootDir>/__mocks__/better-auth.js',
    '^better-auth/adapters/prisma$': '<rootDir>/__mocks__/better-auth.js',
    '^better-auth/plugins$': '<rootDir>/__mocks__/better-auth.js',
    '^better-auth/node$': '<rootDir>/__mocks__/better-auth.js',
  },
};
