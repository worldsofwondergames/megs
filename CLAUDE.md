# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MEGS (Multiversal Exponential Gaming System) is a Foundry VTT system implementation of the Mayfair Exponential Gaming System, originally used in games like DC Heroes, Underground, and Blood of Heroes. This is a fan-created, unofficial implementation for Foundry Virtual Tabletop version 11+.

## Common Development Commands

### Build and Watch
```bash
# Build SCSS to CSS (production)
npm run build

# Watch SCSS files and rebuild on changes (development)
npm run watch
```

### Testing
```bash
# Run all tests
npm test

# Note: Uses Jest with custom mocks for Foundry VTT
# Tests are located in module/__tests__/
```

### Code Quality
```bash
# Format code (StandardJS + Stylelint)
npm run format
```

### System Generation
```bash
# Generate MEGS system files
npm run generate
```

## Architecture Overview

### Module System (ES Modules)
This project uses ES modules (.mjs files) throughout. All JavaScript uses `import/export` syntax.

### Core Entry Point
- **module/megs.mjs** - Main system initialization
  - Registers custom Document classes (MEGSActor, MEGSItem)
  - Registers sheet applications (ActorSheet, ItemSheet)
  - Loads JSON data files (tables, combat maneuvers, motivations, skills)
  - Sets up Handlebars helpers and partials
  - Configures combat initiative system
  - Registers system settings

### Document Models

#### Actors (module/documents/actor.mjs)
- **MEGSActor** extends Foundry's base Actor class
- Actor types: hero, villain, npc, pet, vehicle, location
- Auto-loads skills from JSON data on actor creation
- Calculates initiative bonuses based on attributes and abilities (Superspeed, Martial Artist, Lightning Reflexes)
- Prepares derived data (current Body/Mind/Spirit max values)
- Template system in template.json defines data structure

#### Items (module/documents/item.mjs)
- **MEGSItem** extends Foundry's base Item class
- Item types: power, skill, subskill, gadget, advantage, drawback, bonus, limitation
- Implements `rollMegs()` method for MEGS-specific dice rolling
- Calculates total costs (baseCost + factorCost × APs)
- Handles gadget bonuses

### Sheet Applications

#### Actor Sheets (module/sheets/)
- **actor-sheet.mjs** - Base sheet class for all actor types
- **character-creator-sheet.mjs** - Character builder view (planned feature)
- Templates in templates/actor/ directory
  - Separate templates per actor type: actor-{type}-sheet.hbs
  - Partials in templates/actor/parts/ for reusable components

#### Item Sheets (module/sheets/)
- **item-sheet.mjs** - Handles all item types
- Templates in templates/item/ directory
- Item-specific templates: item-{type}-sheet.hbs

### Dice System (module/dice.mjs)

The core MEGS dice mechanics are implemented here:

- **MegsRoll** - Custom Roll class extending Foundry's Roll
- **RollValues** - Data structure for roll parameters (AV, OV, EV, RV)
- **MegsTableRolls** - Main roll handler implementing MEGS table lookups

#### MEGS Roll Mechanics
1. **Action Table** - Determines if action succeeds (AV vs OV)
2. **Result Table** - Determines effect magnitude (EV vs RV)
3. **Column Shifts** - Earned when roll exceeds 11 (COLUMN_SHIFT_THRESHOLD)
4. **Double 1s** - Automatic failure
5. **Matching Dice** - Player can choose to continue rolling

Key methods:
- `_handleRoll()` - Shows roll dialog, processes targeted/untargeted rolls
- `_handleRolls()` - Performs actual dice rolls and table lookups
- `_getActionTableDifficulty()` - Consults action table
- `_getColumnShifts()` - Calculates column shifts earned
- `_getRangeIndex()` - Maps values (1-60) to table indices

### Configuration (module/helpers/config.mjs)

The **MEGS** object contains all system constants:
- Attribute definitions (DEX, STR, BODY, INT, WILL, MIND, INFL, AURA, SPIRIT)
- Character types
- Item types
- Power types, sources, and ranges
- Named constants for specific powers/skills/advantages

### Combat System (module/combat/)

- **combat.js** - MEGSCombat class
- **combatTracker.js** - MEGSCombatTracker UI
- **combatant.js** - MEGSCombatant class
- Initiative formula: 1d10 with bonuses from attributes and abilities

### Data Files (assets/data/)

JSON files loaded at init:
- **tables.json** - Action Table and Result Table
- **combatManeuvers.json** - Combat maneuvers with OV/RV shifts
- **motivations.json** - Character motivations by type
- **skills.json** - Default skill tree with subskills

### Templates (templates/)

Handlebars (.hbs) templates:
- Actor sheets organized by type
- Item sheets organized by type
- Partials in parts/ subdirectories
- Dialog templates in dialogs/
- Chat message templates in chat/

### Styling (src/scss/)

SASS architecture:
- **megs.scss** - Main entry point
- **components/** - Component-specific styles
- **global/** - Layout utilities (flex, grid, window)
- **utils/** - Variables, mixins, colors, typography

Compiled output: css/megs.css

## Important Development Notes

### Foundry VTT API Integration
- This system extends Foundry's Document classes (Actor, Item, Combat)
- Uses Foundry's Hook system for lifecycle events
- Implements custom sheet applications
- Leverages Foundry's localization system (lang/en.json)

### Data Model
- **template.json** defines the data schema for Actors and Items
- Uses Foundry's template system for shared data structures
- Attributes have standardized structure: value, factorCost, label, type, rolls

### Roll System
- MEGS uses a unique 2d10 exploding dice system with table lookups
- Rolls require four values: AV (Action Value), OV (Opposing Value), EV (Effect Value), RV (Resistance Value)
- Hero Points can be spent to temporarily boost values
- Combat maneuvers provide column shifts
- Unskilled attempts incur -2 column shifts

### Testing
- Mocks for Foundry VTT globals are in module/__mocks__/
- Tests must import mocks before any system code
- Jest configured with setupFiles in package.json

### Localization
- All user-facing strings should use game.i18n.localize()
- Language files in lang/ directory (en.json, pt.json)

### Current Development Status
Version 0.7.0 is in active development. The system has:
- Basic character sheets for heroes, villains, NPCs
- Dice rolling with MEGS table resolution
- Powers, skills, gadgets, traits system
- Combat tracker with initiative
- Character builder sheet (in progress)

Planned features:
- Active Effects automation
- Character builder improvements
- UI/UX overhaul

## Issue Tracking
Issues are tracked on GitHub: https://github.com/worldsofwondergames/megs/issues
- When a branch is checked out, change all GitHub URL instances in system.json to point to the current branch. When prompted, change them back.
- If I tell you to commit a change, go ahead and push it as well
- Avoid SCSS changes if possible. If it does not seem possible, prompt me before making the change.
- Update CHANGELOG.md with any significant changes you commit and push. Do not add anything relating to development documentation including Claude docs
- Never add any statements related to Claude or Claude COde in commit messages or CHANGELOG.md. Use succinct commit comments.
- Combine commit and push into a single command
- When I say to do final cleanup, return the URLs in system.json to the base branch, update CHANGELOG.md, commit, and push without prompting me. This will be an exception to my directive not to push without prompting me.
- When asked to update system.json to the current branch, always use "git branch --show-current" to check the current branch before making any changes