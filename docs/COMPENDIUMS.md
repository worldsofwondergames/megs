# Compendium Development Guide

## Overview

MEGS uses LevelDB compendium packs compiled from JSON source files. This allows version control of pack contents while distributing efficient binary packs with the system.

## Directory Structure

```
megs/
├── packs/                  # LevelDB compiled packs (distributed with system)
│   ├── powers/
│   ├── advantages/
│   ├── drawbacks/
│   ├── bonuses/
│   └── limitations/
├── packs-src/              # JSON source files (version controlled)
│   ├── powers/
│   ├── advantages/
│   ├── drawbacks/
│   ├── bonuses/
│   └── limitations/
├── scripts/                # Build and maintenance scripts
│   ├── transform-items.mjs
│   ├── build-compendiums.mjs
│   └── extract-compendiums.mjs
└── assets/images/icons/    # Icon assets
    ├── powers/
    ├── advantages/
    ├── drawbacks/
    ├── bonuses/
    └── limitations/
```

## Building Compendiums

### Prerequisites

- Node.js 16+
- `classic-level` package (installed as dependency)

### Build Commands

```bash
# Compile JSON source to LevelDB packs
npm run build:packs

# Extract LevelDB packs to JSON (for updates/maintenance)
npm run extract:packs
```

## Adding New Items

1. Add JSON file to appropriate `packs-src/<type>/` directory
2. Follow template.json structure for item type
3. Use placeholder icon or appropriate icon from assets
4. Run `npm run build:packs` to recompile
5. Test in Foundry VTT

## Updating Items

1. Run `npm run extract:packs` to extract current packs to JSON
2. Edit JSON files in `packs-src/`
3. Run `npm run build:packs` to recompile
4. Test in Foundry VTT

## Icon Management

Icons are stored in `assets/images/icons/<type>/` and referenced as:
```
systems/megs/assets/images/icons/<type>/<filename>
```

Icon counts:
- Powers: 180+ PNG files
- Advantages: 50+ PNG files
- Drawbacks: 15+ PNG files
- Bonuses: 4+ PNG files
- Limitations: 3+ PNG files

## Item Data Structure

### Powers

```json
{
  "_id": "unique-id",
  "name": "Power Name",
  "type": "power",
  "img": "systems/megs/assets/images/icons/powers/power-icon.png",
  "system": {
    "name": "Power Name",
    "description": "",
    "attributes": { /* attribute substitution data */ },
    "link": "",
    "isLinked": false,
    "range": "",
    "rangeAPs": 0,
    "formula": "1d10 + 1d10",
    "baseCost": 0,
    "totalCost": 0,
    "factorCost": 0,
    "aps": 0,
    "source": "",
    "activateFree": false,
    "bonuses": [],
    "customBonuses": [],
    "limitations": [],
    "customLimitations": [],
    "parent": ""
  },
  "flags": {},
  "ownership": { "default": 0 },
  "_stats": {
    "systemId": "megs",
    "systemVersion": "1.0.0"
  }
}
```

### Advantages/Drawbacks

```json
{
  "_id": "unique-id",
  "name": "Item Name",
  "type": "advantage",  // or "drawback"
  "img": "systems/megs/assets/images/icons/advantages/item-icon.png",
  "system": {
    "name": "Item Name",
    "description": "",
    "baseCost": 0,
    "totalCost": 0,
    "text": "",
    "hasSubtext": true,
    "parent": "",
    "originalId": ""
  },
  "flags": {},
  "ownership": { "default": 0 },
  "_stats": {
    "systemId": "megs",
    "systemVersion": "1.0.0"
  }
}
```

### Bonuses/Limitations

```json
{
  "_id": "unique-id",
  "name": "Modifier Name",
  "type": "bonus",  // or "limitation"
  "img": "systems/megs/assets/images/icons/bonuses/modifier-icon.png",
  "system": {
    "name": "Modifier Name",
    "description": "",
    "factorCostMod": 0,
    "text": "",
    "hasSubtext": true,
    "parent": "",
    "originalId": ""
  },
  "flags": {},
  "ownership": { "default": 0 },
  "_stats": {
    "systemId": "megs",
    "systemVersion": "1.0.0"
  }
}
```

## Compendium Configuration

Compendium packs are registered in `system.json`:

```json
{
  "packs": [
    {
      "name": "powers",
      "label": "MEGS Powers",
      "path": "packs/powers",
      "type": "Item",
      "system": "megs",
      "ownership": {
        "PLAYER": "LIMITED",
        "TRUSTED": "OBSERVER",
        "ASSISTANT": "OWNER"
      }
    }
    // ... additional packs
  ],
  "packFolders": [
    {
      "name": "MEGS Item Repository",
      "sorting": "a",
      "packs": ["powers", "advantages", "drawbacks", "bonuses", "limitations"]
    }
  ]
}
```

## Scripts Reference

### transform-items.mjs

Transforms DC Heroes items to MEGS format:
- Reads extracted JSON items from temp directory
- Categorizes by type (power, advantage, drawback, bonus, limitation)
- Transforms to MEGS template structure
- Strips descriptions (empty string)
- Updates icon paths
- Writes to `packs-src/<type>/` directories

### build-compendiums.mjs

Compiles JSON source to LevelDB packs:
- Uses `classic-level` package
- Reads JSON files from `packs-src/<type>/`
- Creates LevelDB databases in `packs/<type>/`
- Uses item._id as database key

### extract-compendiums.mjs

Extracts LevelDB packs to JSON:
- Opens LevelDB databases from `packs/<type>/`
- Iterates through all entries
- Writes JSON files to `packs-src/<type>/`
- For maintenance and updates

## Attribution

Item data sourced from DC Heroes 3rd Edition with permission. Icons sourced from dcheroes3e-shared module.

## Version Control

- `packs-src/` directory is version controlled (JSON files)
- `packs/` directory is version controlled (LevelDB files)
- LOCK and LOG* files are excluded via `.gitignore`
- `temp/` directory is excluded via `.gitignore`
