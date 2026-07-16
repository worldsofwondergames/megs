import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './e2e/tests',
    // The worker-scoped page fixture loads the Foundry world (~15-60s) and its
    // setup is charged to the first test that uses it, so the per-test timeout
    // must cover a slow world load as well as the test itself.
    timeout: 120_000,
    expect: { timeout: 10_000 },
    fullyParallel: false,
    workers: 1,
    // One retry absorbs transient browser/world-load failures; a genuinely
    // broken test still fails both attempts.
    retries: 1,
    reporter: 'list',
    use: {
        baseURL: 'http://localhost:30000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        actionTimeout: 10_000,
        navigationTimeout: 15_000,
        viewport: { width: 1920, height: 1080 },
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
