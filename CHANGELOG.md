# CHANGELOG

## 0.4.0 (May 15, 2024)

- Officially entered beta with a very barebones system

## 0.5.0 (December 7, 2024)

- Added generic skill tree
- Various bug fixes

## 0.5.1 (December 25, 2024)

- Added direct roll macro capability for skills
- Fixed bug with unskilled rolls when targeting
- Minor code cleanup and simplification

## 0.5.2 (January 11, 2025)

- Edit lock capability for actors and items
- Macro fixes and simplification for skills/subskills
- Bug fixes from user submissions

## 0.5.3 (February 24, 2025)

- Fixed bug that defaulted macros to looking at selected token actor instead of macro's actor
- Fixed bug that had all rolls from Item object defaulting to unskilled (-2 column shifts)
- Allow skills and subskills to be editable
- Updated README to conform to requests by Foundry devs
- Added locations as Actors (still some cleanup to do here)
- Portuguese language support (many thanks to @rodrigomiranda on Discord!)
- Several minor bug and typo fixes

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

## 1.0.0 (TBD)

### Enhancements

- Implemented AP Purchase Chart for accurate MEGS character creation costs (issue #27)
- Powers and skills linked to attributes now receive -2 Factor Cost reduction (minimum FC 1)
- Hero Point budget tracking calculates total HP spent on attributes and items
- Character creator sheet with comprehensive point-buy character creation
  - Attributes tab with increment/decrement controls and individual AP cost display
  - Powers tab with drag-and-drop support for Bonuses/Limitations, linking, and cost calculations
  - Skills tab with accordion display for subskills and cost tracking
  - Traits tab with two-column layout for Advantages and Drawbacks
  - Gadgets tab (placeholder for future functionality)
  - Wealth tab with inflation-adjusted purchasing power
    - Wealth selection from 0-21 APs with corresponding Hero Point costs (Factor Cost 2)
    - Inflation adjustment feature with year selection (1940-2025)
    - Dollar value display adjusted for selected year using CPI-based multipliers
    - Wealth cost integrated into Hero Point budget tracking

### Bug Fixes

- Fixed validation in AP cost calculation to handle items without Factor Cost
- Prevented NaN errors in cost calculations by adding null-safe attribute access
- Added pre-validation to ensure only valid Factor Cost values are used in AP Purchase Chart lookups
- Fixed type consistency issues in wealth system to ensure radio button and dropdown selections persist correctly

## 0.7.0 (December 15, 2025)

### Enhancements

- Added a tooltip explanation on hover for the Initiative, AV/OV (if HP spent), and column shifts
- Standalone gadgets (unowned) can now store skill APs that transfer when added to actors
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
