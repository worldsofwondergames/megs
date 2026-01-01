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

## 0.7.0 (December 15, 2025)

### Enhancements

- Added enriched text support for biography and description fields using Foundry's TextEditor.enrichHTML
- Actor biographies and item descriptions now support entity links (@Actor, @Item, @JournalEntry), inline rolls, and content links
- Added system setting to control whether skills and subskills can be deleted from actor and gadget sheets
- Added system setting to enable/disable debug logging (replaces hardcoded flag)
- Added confirmation dialog when deleting items, powers, skills, traits, and effects

## 1.0.0 (February 1, 2026)

### Enhancements

- Skills can now have modifiers (bonuses and limitations) just like powers
- Modifiers can be added to standalone powers and skills (not owned by actors)
- Standalone powers and skills preserve their modifiers when dragged to/from actors
- Added double-click to activate TinyMCE editors for biography and item descriptions
- Hide R# display in gadget summaries when reliability is 0
- Automatic cleanup of child items when parent gadget or skill is deleted
- Fixed empty gadget descriptions no longer display empty parentheses in character creator
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
- Gadget cost calculation implements complete MEGS rules
    - Reliability Number modifies Factor Cost for all abilities
    - AV/EV/Range have Base Cost 5 and Factor Cost 1 (modified by R#)
    - Attributes have Base Cost 0, Factor Cost from template (modified by R#)
    - Italicized attributes add +2 to Factor Cost
    - Hardened Defenses add +2 to BODY Factor Cost
    - Child items (powers, skills, advantages, drawbacks) included in total
    - Gadget Bonus correctly applied: ÷4 if can be Taken Away, ÷2 if cannot
- Test coverage for gadget cost calculations including rulebook example (Machinegun)

### Bug Fixes

- Fixed modifiers not displaying when dragged onto standalone powers or skills
- Standalone powers and skills use flattened arrays for modifiers instead of embedded items
- Fixed gadget power and skill data preservation when dragging from sidebar to character sheet
- Fixed trait (advantage/drawback) type and cost data being lost during gadget transfer
- Fixed validation in AP cost calculation to handle items without Factor Cost
- Prevented NaN errors in cost calculations by adding null-safe attribute access
- Added pre-validation to ensure only valid Factor Cost values are used in AP Purchase Chart lookups
- Fixed type consistency issues in wealth system to ensure radio button and dropdown selections persist correctly
- Fixed gadget cost calculation converting reliability from index to actual R# value
- Fixed Hardened Defenses boolean comparison to handle string "false" correctly
- Fixed gadget range cost to support both systemData.range and systemData.weapon.range fields
- Fixed HP budget double-counting child items belonging to gadgets
- Fixed gadget child item cost calculation to compute directly during data preparation
- Fixed subskills incorrectly triggering invalid Factor Cost validation errors
- Added support for base cost only powers without Factor Cost
- Added comma formatting to HP Spent and HP Remaining values on character creator sheet
- Ensured current condition tracks (currentBody, currentMind, currentSpirit) are initialized in prepareBaseData()

### Testing

- Added test coverage for character budget calculations, reliability number conversion, and base cost only powers
