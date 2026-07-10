# MEGS E2E Tests

End-to-end tests for the MEGS Foundry VTT game system using Playwright MCP.

## Prerequisites

- Foundry VTT running at `http://localhost:30000` with a MEGS world loaded
- Logged in as Gamemaster
- Playwright MCP plugin available in Claude Code

## Test Files

- `gadget-rolling.spec.mjs` — Tests for Issue #17 (Gadgets - Rolling)
- `gadget-sheet-rolling.spec.mjs` — Tests for Issue #13 (Roll attacks from gadget sheet)

## Running Tests

These tests are designed to be run via Playwright MCP in Claude Code sessions.
Each test creates its own temporary actors/gadgets and cleans up after itself.

All test actors are prefixed with `_E2E_GadgetTest_` so they can be identified
and cleaned up manually if a test fails mid-run.
