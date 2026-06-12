import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  verbose: true,
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  testMatch: ['<rootDir>/test/*'],
  testEnvironment: '<rootDir>/test-environment.ts',
  setupFilesAfterEnv: ['<rootDir>/after-env-setup.ts'],
};

export default config;
