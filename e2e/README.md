# MEGS E2E Tests

End-to-end tests for the MEGS Foundry VTT game system using [Playwright](https://playwright.dev/).

## Prerequisites

- Node.js 18+
- Foundry VTT running at `http://localhost:30000` with a MEGS world loaded
- A Gamemaster user configured in the world

## Setup

```bash
npm install
npx playwright install chromium
```

## Running Tests

Start Foundry VTT, then:

```bash
npm run test:e2e
```

Run a single test file:

```bash
npx playwright test --config=playwright.config.mjs gadget-rolling
```

Run tests matching a pattern:

```bash
npx playwright test --config=playwright.config.mjs --grep "Default power"
```

## How It Works

- **Global setup** (`fixtures/global-setup.mjs`) logs into Foundry as Gamemaster and saves the session to `e2e/.auth/state.json` (gitignored). This runs once before all tests.
- **Test fixture** (`fixtures/foundry-test.mjs`) navigates to `/game`, waits for `game.ready`, and closes all Foundry windows after each test.
- **Shared helpers** (`fixtures/test-data.mjs`, `fixtures/roll-helpers.mjs`) provide actor/item creation, sheet management, and roll dialog interaction.
- Tests run serially (`workers: 1`) because Foundry VTT is single-user.

## Test Data Conventions

- All test actors are prefixed with `_E2E_` so they can be identified and cleaned up.
- Each test file creates its own temporary data and cleans up in `afterAll`.
- Global setup also cleans up any leftover `_E2E_` actors from previous failed runs.

## Test Files

| File | Issue | Tests | Description |
|------|-------|-------|-------------|
| `gadget-rolling.spec.mjs` | #17 | 23 | Gadget rolling from actor sheet |
| `gadget-sheet-rolling.spec.mjs` | #13 | 9 | Roll from gadget item sheet |
| `power-roll-sources.spec.mjs` | #56 | 9 | Power AV/EV/OV/RV source overrides |
| `trait-subtext.spec.mjs` | #209 | 5 | Trait detail/subtext display |
| `trait-drop-blocking.spec.mjs` | #178, #3 | 5 | Gadget-only and creation-only drop blocking |
| `chat-message-formatting.spec.mjs` | #93 | 4 | Chat message avatar and formatting |
| `accordion-state.spec.mjs` | #67 | 3 | Accordion expand/collapse persistence |
| `reliability-number.spec.mjs` | #8 | 4 | Reliability number display and cost |

## Legacy Tests

The `legacy/` directory contains the original ad-hoc E2E tests that were designed for MCP browser control. They are preserved for reference but are not part of the Playwright test suite.
