import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './e2e/tests',
    timeout: 60_000,
    expect: { timeout: 10_000 },
    fullyParallel: false,
    workers: 1,
    retries: 0,
    reporter: 'list',
    use: {
        baseURL: 'http://localhost:30000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        actionTimeout: 10_000,
        navigationTimeout: 15_000,
    },
    globalSetup: './e2e/fixtures/global-setup.mjs',
    projects: [
        {
            name: 'chromium',
            use: {
                browserName: 'chromium',
                storageState: './e2e/.auth/state.json',
            },
        },
    ],
});
