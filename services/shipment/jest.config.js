/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/src'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  collectCoverageFrom: ['src/**/*.(t|j)s'],
  coveragePathIgnorePatterns: [
    'src/main.ts',
    '\\.module\\.ts$',
    '\\.dto\\.ts$',
    'src/prisma/prisma.service.ts',
    'src/common/',
    'src/health/',
  ],
  coverageDirectory: './coverage',
  coverageThreshold: {
    global: { branches: 75, functions: 85, lines: 85, statements: 85 },
  },
};
