# CHANGELOG

## 1.1.1

### Enhancements

- Roll dialog now shows how many Hero Points the character has, and says so explicitly when there are none to spend
- `game.megs` now also exposes `RollValues` and `MegsTableRolls`, so an external module can make a roll go through the system's own roll path rather than reimplementing it (groundwork for issue #156)
- `game.megs` also exposes `Utils`, so an integration can ask the system whether a gadget has anything to roll instead of restating the rule (issue #156)
- Hero, villain and NPC sheets have a Role Playing Notes field below Biography on the Description tab, edited with the same rich-text editor. In edit mode the Biography and Role Playing Notes editors each start at 15em tall instead of Biography filling the whole tab. Locations, pets and vehicles have no Role Playing Notes (issue #285)
- When Bar Brawl is enabled and the world has no Bar Brawl defaults, the system sets Current BODY, MIND and SPIRIT bars for heroes, villains and NPCs. Owners always see them; other players see a hero's bars but not a villain's or NPC's. Worlds without Bar Brawl, or with their own Bar Brawl defaults, are unchanged (issue #290)
- An equipped gadget's italicized Attributes now replace the character's own for rolls when they are higher, as the rules allow for italicized gadget Attributes. Gadgets have a new Is Equipped? setting, off by default, so existing gadgets change nothing until equipped. Attribute rolls, OV/RV lookups, power AV/EV/OV/RV sources and unskilled skills use the replaced values. The actor sheet still shows the character's own Attribute, with an info icon naming the gadget and its value. Current BODY, MIND and SPIRIT keep the character's own maximums (issue #210)
- The Initiative Bonus on the sheet and in combat now uses an equipped gadget's italicized DEX, INT and INFL when they are higher, and the sheet's Initiative tooltip names the gadget (issue #306)

### Bug Fixes

- Fixed roll dialog controls broken by Foundry v14 (issue #275). v14 runs DialogV2 string content through `foundry.utils.cleanHTML()`, which strips inline `on*` handlers, so:
    - The `-`/`+` buttons beside Action, Effect, Opposing and Resistance Value had become plain submit buttons — clicking one closed the dialog and discarded the roll instead of changing the value
    - The number beside each Hero Point slider never moved off 0, even though the hero points were being applied to the roll
    - The initiative dialog's Hero Point slider readout was dead for the same reason
- Increment/decrement buttons now respect the field's own minimum and maximum instead of stepping past them
- A gadget's cost now includes the bonuses and limitations on its powers and the untrained subskills on its skills, so a Power Restriction on a gadget power lowers the character's Hero Point total. The gadget cost and the gadget point budget now share one Factor Cost calculation (issue #287)
- A power or skill marked Linked in the character builder now shows as linked on the regular actor sheet: its name gets the asterisk, its item sheet shows Is Linked: Yes, and a linked skill's APs lock to the attribute. The builder saves Linked as a boolean and these checks accepted only the string the item sheet saves. Yes/No fields such as Can Be Taken Away also now read Yes for a boolean true (issue #282)
- A linked Power or Skill whose APs differ from its linked Attribute now shows a red AP value, a warning icon, and a tooltip such as "Linked to Dexterity (7) but rated 6 APs" on the Character Builder and the regular actor sheet. The Character Builder flagged the mismatch before, but the AP input kept its own color, so the warning was invisible (issue #286)
- The blue die on rollable powers, skills and gadgets now uses `d10blue.svg`, the same drawing as the gray die on auto powers, instead of a PNG that filled its whole box and looked stretched next to it. Icons in a crowded row of item controls, such as the Powers tab's die, edit and delete links, no longer shrink below their 20px width (issue #283)
- A gadget's Reliability Number now changes the Factor Cost of its powers and skills, as the rules require for every Ability on the gadget. Before, only its attributes, AV, EV and Range were adjusted, so a gadget made only of powers cost the same at every R#. An R# 0 gadget's powers now cost more and an R# 7 or higher gadget's powers cost less (issue #294)

### Localization

- User-facing English text that was written straight into templates and modules now comes from the localization files, so it changes with the client language (issue #279). This covers the `aria-label` on every `+`/`-` button, the attribute tooltips on the character creator and gadget builder, the roll and delete tooltips, the character name placeholder, the delete confirmation dialogs, and every `ui.notifications` message
- The HP cost tooltips on the Character Builder, gadget sheet and Gadget Builder, the omni-gadget range names, and the AV, EV, Range, Ammo and R# labels in a gadget's description now come from the localization files (issue #281). The HP unit and the ÷4 or ÷2 gadget bonus are part of each translated string, so a translator can place them.
- Fixed three `{{localize}}` calls written with mismatched quotes that rendered the key itself instead of the text: the Hero Points label on the actor sheet, the skill edit icon's `alt`, and an "Unskilled" roll tooltip
- Added the four `MEGS` keys that `effects.mjs` and `item-sheet.mjs` asked for but no dictionary defined, so new active effects and the trait and power delete prompts were showing a raw key
- Added Portuguese for the 11 keys that only existed in English; `lang/en.json` and `lang/pt.json` now define the same keys

### Test Infrastructure

- Extended the localization unit tests to the cost tooltip helpers and omni-gadget ranges in `megs.mjs`, and added E2E coverage that swaps in marked translations and checks they reach the rendered tooltips and gadget descriptions (issue #281)
- Added E2E coverage that measures the rendered dice on the Powers tab and the size of every control icon on the Powers, Skills and Gadgets tabs (issue #283)
- Added E2E coverage for the linked APs warning on the Character Builder and the regular actor sheet in edit and view mode (issue #286)
- Added E2E coverage that ticks Linked in the character builder and checks the regular actor sheet and item sheet (issue #282)
- `E2E_USER` and `E2E_OTHER_SESSIONS` let the E2E suite log in as its own GM user while someone else is connected as Gamemaster
- Added E2E coverage that clicks the roll dialog's `+`/`-` buttons and drags its sliders through real pointer input; the previous specs set `.value` directly, which could not see this class of failure
- Added unit tests for increment/decrement bounds handling
- Added unit tests for the Bar Brawl defaults: Bar Brawl enabled, disabled and not installed, existing defaults, and a non-active GM (issue #290)
- Added unit tests that read the shipped templates and modules and fail if English text reappears in an `aria-label`, `title`, `alt`, or `placeholder`, in a notification, or in a dialog title, and that check every `MEGS` key a template or module asks for is defined in both dictionaries (issue #279)
- Added unit tests for the Reliability Number on gadget powers and skills, including the Factor Cost limits of 1 and 10 and unowned gadgets, and E2E coverage that changes a gadget's R# and checks the gadget and character costs (issue #294)
- Added E2E coverage for Role Playing Notes: view and edit mode on hero, villain and NPC sheets, (None) when empty, saving through the editor, and no field on location sheets (issue #285)
- Added unit tests for equipped gadget Attributes (equipped and not, higher and lower, italicized and not, several gadgets, the item sheet's string value) and the roll helpers that read them, and E2E coverage for the Equipped select, the attribute icon and an attribute roll's starting values (issue #210)
- Added unit tests for the Initiative Bonus and its tooltip with an equipped and an unequipped gadget, and an E2E test that checks the sheet and the combat value before and after equipping (issue #306)

## 1.1.0 (August 28, 2026)

### Foundry VTT v14 Compatibility

- Upgraded system compatibility to Foundry VTT v14 (issue #230)
- Migrated all dialogs from Dialog V1 to DialogV2
- Fixed v14 runtime errors: data preparation, header buttons, viewport handling
- Updated E2E test suite for DialogV2 timing and teardown

### Enhancements

- Hidden Pet actor type from create menu until sheet is implemented (issue #263)

### Code Quality

- Deduplicated roll dialog code and fixed SonarCloud issues
- Fixed SonarCloud blockers: cognitive complexity, `isNaN`, SCSS scoping

### Test Infrastructure

- Fixed DialogV2 teardown: dialogs are ApplicationV2 and live in `foundry.applications.instances`, not `ui.windows`, so closing the `<dialog>` element directly left the app registered and a stale element in the DOM for later tests
- Scoped every E2E dialog lookup to the open dialog and identified it by its own content instead of DOM position; `footer` scoping added because the window header X also carries `data-action="close"`
- Removed match-by-text fallbacks from dialog helpers so a renamed `data-action` fails instead of silently passing
- E2E helpers now assert a dialog is present before waiting for it to close; waiting for absence alone passed instantly when a selector matched nothing
- Test teardown no longer swallows errors, so leaked dialog state fails the test that caused it
- `globalSetup` waits for `/api/status` to report an idle world before and after login, so a leftover browser holding the single Gamemaster seat fails fast with a clear message instead of a silent 60s timeout on the first test
- Removed four dead spec files outside `testDir` that never ran

## 1.0.1 (July 14, 2026)

### Enhancements

- Sub-gadgets: visible indented display, drag-and-drop re-parenting, and cost rollup on actor Gadgets tab (issue #78)
- Gadget rolling from actor sheet and gadget item sheet with picker dialog for multiple abilities (issues #13, #17)
- Gadget macro support via hotbar drag-and-drop
- Stackable gadgets: quantity increments on duplicate drops instead of creating separate items (issue #179)
- Configurable AV/EV/OV/RV sources on power sheets — Power APs, character attribute, or target attribute (issue #56)
- "Always Substitute" (italicized) attribute option on gadgets
- Trait options: Gadget Only, On Creation Only, and editable subtext on advantages and drawbacks (issues #3, #178, #209)
- Token image in chat message headers (issue #93)
- Accordion state persistence across all re-render sources (issue #242)
- Alphabetized advantages and drawbacks on character builder
- GitHub Actions for system.json URL sync and auto-closing linked issues on merge

### Bug Fixes

- Fixed Dice So Nice not showing before doubles prompt (issue #196)
- Fixed crashes from multiple target selection and Handlebars `compare` helper (issue #215)
- Fixed edit-mode flag race condition causing sheets to reset to edit mode on open (issue #243)
- Fixed NPC sheet crash in edit mode due to missing motivations data (issue #243)
- Fixed gadget cost tooltip collision on character creator (issue #245)
- Fixed omni-gadget class flags treating string "false" as truthy (issue #254)
- Fixed `getAPCost` accepting non-numeric values (issue #244)
- Fixed trailing slash in system.json download URL

### Testing

- Added Playwright E2E test suite (158 tests) covering all 1.0.1 milestone features (issue #226)
- Added Jest unit tests for sub-gadgets, omni-gadgets, stackable gadgets, AP cost edge cases, and edit-mode logic

### Code Quality

- Configured ESLint and Stylelint with lint CI workflow (issue #214)
- General cleanup: `Object.hasOwn()`, `Number.parseInt()`, optional chaining, reduced cognitive complexity (issues #216, #217, #218, #256)

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
