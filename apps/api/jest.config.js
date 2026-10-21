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
  // Transform ESM packages shipped by @nestjs/*
  transformIgnorePatterns: [
    'node_modules/(?!(@nestjs/(config|swagger|terminus|bullmq|bull-shared|throttler)|jose|firebase-admin|@firebase|jwks-rsa)/)',
  ],
};
