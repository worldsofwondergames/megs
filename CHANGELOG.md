# CHANGELOG

## 1.0.1

### Enhancements

- Skill and subskill item sheets now have editable Default OV, Default RV, and OV/RV Note fields on the Characteristics tab — when rolling without a target token, these values pre-populate the roll dialog instead of defaulting to 0/0 (issue #148)
- Skills data includes default OV/RV values and rule-reference notes from the rulebook for all applicable subskills (Artist 4/4, Forensics 4/4, Forgery 4/4, Cartography 4/4, Security Systems 5/5, and context-dependent notes for Detective, Medicine, Military Science, Occultist, and Thief subskills) (issue #148)
- OV/RV Note is displayed as a hint in the roll dialog to remind the GM of the correct values for context-dependent checks (issue #148)
- Power item sheets now have configurable AV/EV/OV/RV sources — each value can be set to Power APs, a character attribute, or a target attribute (issue #56)
- Gadget item sheets now have a d10 roll button in the header that triggers the full gadget roll flow, matching the power sheet visual pattern (issue #13)
- Gadgets can now be rolled from the actor Gadgets tab for all rollable abilities: explicit AV/EV, child powers, child skills, and attribute pairs (issue #17)
- Added picker dialog when a gadget has multiple rollable abilities
- Added "Always Substitute" (italicized) checkbox per gadget attribute in edit mode; italicized attributes substitute for the actor's values when higher
- Added gadget macro support — dragging a gadget to the hotbar now triggers the roll flow instead of just posting description text
- Roll button tooltip on gadgets shows available roll options
- Added token image to chat message headers and reduced timestamp font size (issue #93)
- Added "On Creation Only" checkbox on advantage and drawback item sheets; creation-only traits are blocked from being dropped on actor sheets but allowed on the character creator (issue #3)
- Added Options tab on advantage and drawback item sheets for Gadget Only and On Creation Only checkboxes; moved Gadget Only from header to Options tab (issue #3, #178)
- Added "Gadget Only" checkbox on advantage and drawback item sheets; gadget-only traits are blocked from being dropped directly onto actor sheets (issue #178)
- Added editable detail/subtext field on advantage and drawback item sheets, displayed in parentheses on actor traits tab and character creator (issue #209)
- Alphabetized advantages and drawbacks on character builder sheet
- Added post-merge hook to sync README version references automatically
- Added post-checkout hook to auto-update system.json branch URLs on branch switch
- Added GitHub Action to sync system.json URLs on push to non-main branches
- Added GitHub Action to auto-close linked issues when PRs are merged to any branch

### Bug Fixes

- Fixed Dice So Nice 3D dice not showing before doubles prompt and re-triggering on final chat message (issue #196)
- Fixed `ReferenceError` crash when selecting multiple targets — `localize()` replaced with `game.i18n.localize()` (issue #215)
- Fixed `ReferenceError` in `compare` Handlebars helper — added missing `options` parameter (issue #215)
- Fixed trailing slash in system.json download URL that prevented Foundry from resolving the package
- Fixed empty gadget cost tooltip on the character creator sheet — a duplicate `getGadgetCostTooltip` Handlebars registration clobbered the cost-breakdown helper; the raw/adjusted cost helper is now registered as `getGadgetAdjustedCostTooltip` (issue #245)
- Fixed item and actor sheets overwriting the edit-mode flag on every open — the sheet constructors wrote the flag with an un-awaited `setFlag` that raced the first render; the lock state is now derived at render time, so edit/view mode persists per document and no longer flips back to edit mode when a sheet is reopened (issue #243)
- Fixed the edit-mode toggle negating the stored flag rather than the effective state, and no longer writing the flag for non-owners or compendium documents (issue #243)
- Fixed the NPC sheet failing to render in edit mode — NPCs had no `system.motivations`, so the motivation `selectOptions` threw `Cannot convert undefined or null to object` and took down the entire sheet render; NPCs now receive the full motivation list (hero, villain, and antihero). This was masked by the edit-mode flag race, which left the first render in view mode (issue #243)
- Fixed `getAPCost` accepting empty strings, NaN, and other non-numeric values — inputs are now coerced via `Number()` so form-cleared fields and unset data properties return 0 instead of falling through to a spurious console warning (issue #244)
- Fixed accordion expanded state lost on re-renders not triggered by instrumented handlers — accordion state is now saved in the `_render` lifecycle override before the DOM is replaced, so expanded rows survive any re-render source (programmatic, multiplayer, token bar changes) (issue #242)

### Testing

- Added Playwright E2E test suite with 62 tests across 8 spec files covering all 1.0.1 milestone features (issue #226)
- Configured Playwright with global setup for Foundry login, shared fixtures, and serial execution
- Converted 3 existing ad-hoc E2E tests to Playwright: gadget rolling (#17), gadget sheet rolling (#13), power roll sources (#56)
- Added new E2E tests for: trait subtext (#209), trait drop blocking (#178, #3), chat message formatting (#93), accordion state persistence (#67), reliability number (#8)
- Fixed the `ItemSheet`/`ActorSheet` Jest mocks not setting `this.object`, which left the sheet constructors' flag-writing branch as dead code in every unit test and hid issue #243; added unit coverage for edit-mode derivation and toggling (issue #243)
- Removed E2E workarounds that constructed a sheet before setting the edit-mode flag, and awaited `setFlag` calls that were previously fire-and-forget (issue #243)
- Added unit tests for `MEGS.getAPCost` edge inputs: empty string, numeric string, NaN, null, undefined, negative, and boundary values (issue #244)
- Removed `test.fail()` markers from accordion E2E tests now that #242 is fixed (issue #242)

### Code Quality

- Configured ESLint and Stylelint with project-specific rules and added lint CI workflow (issue #214)
- Wrapped switch-case lexical declaration in a block to prevent temporal dead zone issues (issue #216)
- Replaced 12 direct `.hasOwnProperty()` calls with `Object.hasOwn()` across actor, item, and item-sheet modules (issue #217)
- Cleaned up 249 lint findings across 16 files — `prefer-const`, `quotes`, `indent`, brace-style, unused variables/imports, URL quoting, hex shorthand (issue #218)
- Replaced 37 global `parseInt()` calls with `Number.parseInt()` across 6 modules for consistency (issue #218)

## 1.0.0 (February 1, 2026)

### Enhancements

- Skills can now have modifiers (bonuses and limitations) just like powers
- Modifiers can be added to standalone powers and skills (not owned by actors)
- Standalone powers and skills preserve their modifiers when dragged to/from actors
- Hide R# display in gadget summaries when reliability is 0
- Implemented AP Purchase Chart for accurate MEGS character creation costs (issue #27)
- Powers and skills linked to attributes now receive -2 Factor Cost reduction (minimum FC 1)
- Hero Point budget tracking calculates total HP spent on attributes and items
- Character creator sheet with comprehensive point-buy character creation
    - Attributes tab with increment/decrement controls and individual AP cost display
    - Powers tab with drag-and-drop support for Bonuses/Limitations, linking, and cost calculations
    - Skills tab with accordion display for subskills, linking support, and cost tracking
        - Link checkbox to link skills to attributes (reduces Factor Cost by 2)
        - Linked skills display asterisk and show validation warnings if APs don't match linked attribute
    - Traits tab with two-column layout for Advantages and Drawbacks
    - Gadgets tab with drag-and-drop support and automatic cost calculation
        - Display gadget name with attribute/power/skill summary
        - Automatic cost calculation following MEGS rules including Reliability Number modifiers
        - Cost breakdown tooltip showing attributes, AV/EV/Range, child items, and Gadget Bonus
        - Child items (powers, skills, advantages) only displayed under parent gadget
    - Wealth tab with inflation-adjusted purchasing power
        - Wealth selection from 0-21 APs with corresponding Hero Point costs (Factor Cost 2)
        - Inflation adjustment feature with year selection (1940-2025)
        - Dollar value display adjusted for selected year using CPI-based multipliers
        - Wealth cost integrated into Hero Point budget tracking
- Powers tab accordion display shows bonuses and limitations beneath each power (alphabetically sorted and labeled)
- Drag and drop support for power modifiers with visual feedback and state persistence
- Gadget cost calculation implements complete MEGS rules
    - Reliability Number modifies Factor Cost for all abilities
    - AV/EV/Range have Base Cost 5 and Factor Cost 1 (modified by R#)
    - Attributes have Base Cost 0, Factor Cost from template (modified by R#)
    - Italicized attributes add +2 to Factor Cost
    - Hardened Defenses add +2 to BODY Factor Cost
    - Child items (powers, skills, advantages, drawbacks) included in total
    - Gadget Bonus correctly applied: ÷4 if can be Taken Away, ÷2 if cannot
- Added confirmation dialog when deleting items, powers, skills, traits, and effects
- Added double-click to activate TinyMCE editors for biography and item descriptions
- Added enriched text support for biography and description fields using Foundry's TextEditor.enrichHTML
- Added system setting to control whether skills and subskills can be deleted from actor and gadget sheets
- Added comma formatting to HP Spent and HP Remaining values on character creator sheet
- Improved chat message styling with customized roll result headers

### Bug Fixes

- Prevented NaN errors in cost calculations by adding null-safe attribute access
- Added pre-validation to ensure only valid Factor Cost values are used in AP Purchase Chart lookups
- Fixed Hardened Defenses boolean comparison to handle string "false" correctly
- Fixed gadget range cost to support both systemData.range and systemData.weapon.range fields
- Ensured current condition tracks (currentBody, currentMind, currentSpirit) are initialized in prepareBaseData()
- Fixed empty gadget descriptions no longer display empty parentheses in character creator
- Fixed initiative bonus tooltip showing calculation breakdown (DEX + INT + INFL + modifiers)

### Technical Debt

- Automatic cleanup of child items when parent gadget or skill is deleted
- Migrated all CSS styles to SCSS source files to prevent build process from overwriting manual edits

### Development Aids

- Added system setting to enable/disable debug logging (replaces hardcoded flag)

### Testing

- Added test coverage for character budget calculations, reliability number conversion, and base cost only powers
- Test coverage for gadget cost calculations including rulebook example (Machinegun)
- Comprehensive test coverage for table extrapolation beyond 60 (Action and Result tables)

## 0.7.0 (December 15, 2025)

### Enhancements

- Added a tooltip explanation on hover for the Initiative, AV/OV (if HP spent), and column shifts
- Standalone gadgets (unowned) can now store skill APs that transfer when added to actors
- Gadgets dragged to the Items sidebar now retain their powers and skills, which are recreated when dragged to another character
- Gadgets can now have skills with optional Skills tab (toggle in Settings)
- Gadgets can now have powers with optional Powers tab (drag-and-drop only, toggle in Settings)
- Gadgets can now have traits with optional Traits tab (toggle in Settings)
- Increment/decrement buttons added for skills and powers on gadgets (in edit mode)
- Vehicle and location actors display skills from linked gadgets (read-only)
- Owner dropdown on vehicle/location sheets now alphabetized by name
- Changed configure sheet icon from cog to document icon
- Settings moved from tab to header button with cog icon on gadgets
- Minor styling changes
- Localized still more hard-coded English strings

### Foundry VTT V13 Compatibility

- Fixed deprecation warning for `renderTemplate` - now uses `foundry.applications.handlebars.renderTemplate`
- Fixed deprecation warning for `roll.evaluate()` - removed deprecated `async` option
- Fixed deprecation warning for chat message creation - now uses `rolls` array instead of deprecated `CHAT_MESSAGE_STYLES.ROLL`
- Registered custom MegsRoll class with Foundry's dice system for proper serialization
- Changed usage of other deprecated Foundry constants and functions

### Bug Fixes

- Fixed column shift calculation in dice roller that was producing incorrect results
- Corrected threshold logic to properly implement MEGS rule: roll must be "on or beyond" the column shift threshold (11)
- Added test coverage for edge case where roll is exactly on threshold
- Fixed Dice So Nice integration to display the same dice values shown in chat messages (issue #169)

## 0.6.0 (April 19, 2025)

- Allow current scores to be negative (up to negative value of base attribute)
- Made some technical changes caused by Foundry changes around select components
- Limited item durability to the delimited values (0, 2, 3, 5, 7, 9, 11)
- Fixed some yes/no labels that were showing as true/false
- Fixed motivation to display label when uneditable
- Fixed description page to not show raw HTML when non-editable
- Localized several labels missed in previous efforts to selected language
- Made some fields missed in 0.5.3 uneditable when not in edit mode
- Corrected tabbing when actor page open
- Fixed reliability display value on gadgets
- Linked powers now display asterisk
- Cleanup minor code issues from static code analysis

## 0.5.3 (February 24, 2025)

- Fixed bug that defaulted macros to looking at selected token actor instead of macro's actor
- Fixed bug that had all rolls from Item object defaulting to unskilled (-2 column shifts)
- Allow skills and subskills to be editable
- Updated README to conform to requests by Foundry devs
- Added locations as Actors (still some cleanup to do here)
- Portuguese language support (many thanks to @rodrigomiranda on Discord!)
- Several minor bug and typo fixes

## 0.5.2 (January 11, 2025)

- Edit lock capability for actors and items
- Macro fixes and simplification for skills/subskills
- Bug fixes from user submissions

## 0.5.1 (December 25, 2024)

- Added direct roll macro capability for skills
- Fixed bug with unskilled rolls when targeting
- Minor code cleanup and simplification

## 0.5.0 (December 7, 2024)

- Added generic skill tree
- Various bug fixes

## 0.4.0 (May 15, 2024)

- Officially entered beta with a very barebones system
