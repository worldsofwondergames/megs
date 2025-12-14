# Character Creator Implementation - AP Purchase Chart

## Overview
Implementation of the AP Purchase Chart system for the MEGS Character Creator sheet (GitHub Issue #27). This document tracks all features, changes, and technical details from the development session.

## Branch
`27-ap-purchase-chart`

## Key Features Implemented

### 1. Powers Tab for Character Creator
Created a fully functional Powers tab in the character creator sheet with drag-and-drop support.

**Location**: `templates/actor/character-creator-sheet.hbs`

**Features**:
- Drag and drop Powers from compendiums
- Display all power properties in a table format
- AP adjustment with +/- buttons
- Delete functionality
- Linking checkbox to link powers to attributes

**Columns**:
- Name (flex: 2.2)
- Link? (checkbox, 50px wide, centered)
- Base Cost
- Factor Cost (calculated, shows effective FC with tooltip)
- APs (flex: 1.15, with +/- buttons)
- Total Cost (calculated via AP Purchase Chart)
- Delete (trash icon, 30px wide)

### 2. AP Purchase Chart Cost Calculation

**Key Rule**:
- If APs = 0: Total Cost = 0 (not purchased)
- If APs > 0: Total Cost = Base Cost + AP Purchase Chart(APs, Factor Cost)

**Implementation**:
- `module/documents/item.mjs` lines 219-241
- Uses `MEGS.getAPCost(aps, factorCost)` function
- Properly handles 0 APs as valid (costs 0)

**Factor Cost Calculation**:
- Base Factor Cost from power definition
- -2 if linked (minimum 1)
- Plus all modifier Factor Cost Mods
- Always minimum FC of 1

### 3. Linked Powers System

**Rules** (from official MEGS rulebook):
- Linked powers must have APs equal to linked attribute
- Factor Cost reduced by 2 (minimum 1)
- Powers forever tied to attribute
- If attribute decreases, linked powers decrease

**Implementation**:
- Checkbox in Link? column
- Red/bold error highlighting when APs don't match attribute
- Helper: `isLinkedPowerMismatch(power, actor)` in `module/megs.mjs`
- CSS class: `.link-mismatch` (red, bold)

### 4. Bonuses and Limitations (Modifiers)

**Drag-and-Drop**:
- Bonuses/Limitations can be dragged onto specific Power rows
- Sets `system.parent = powerId` to link to power
- Display indented under parent power

**Display**:
- Appears directly under parent power row
- Light gray background (rgba(0, 0, 0, 0.02))
- 25px left indent in Name column
- Italic, gray text (smaller font 0.9em)
- Shows Factor Cost Mod in Factor Cost column (always signed: +2, -1, etc.)

**Implementation**:
- Drop handler: `_onDropOnPower()` in `character-creator-sheet.mjs`
- Template helper: `getPowerModifiers(powerId, items)`
- Display helper: `formatSigned(number)` - formats with + or - sign

### 5. Calculated Factor Cost with Tooltip

**Display**:
- Factor Cost column shows effective/calculated value
- Includes: Base FC ± linking ± modifiers
- Pointer cursor on hover
- Tooltip shows complete breakdown

**Tooltip Format**:
```
Base FC: 3
Linked: -2
Range: +1
Total: 2
```

**Implementation**:
- Helper: `getEffectiveFactorCost(power, items)`
- Helper: `getFactorCostTooltip(power, items)`
- CSS: `.factor-cost-calculated { cursor: pointer; }`

### 6. Budget Tracking

**Display** (header section):
- HP Budget (editable input)
- HP Spent (calculated)
- HP Remaining (calculated, red if negative)

**Calculation** (`module/documents/actor.mjs` lines 153-229):
- Attributes cost via AP Purchase Chart
- Powers cost (tracked separately)
- All items cost
- Drawbacks add back to budget
- `.over-budget` class for negative remaining (red, bold)

### 7. Character Creator Sheet Styling

**Unique Class**: `.character-creator` added to form
- Prevents CSS bleed to actor sheet
- All Powers tab styling scoped to `.character-creator .tab.powers .items-list`

**Key CSS Rules** (`css/megs.css`):
```css
/* Column widths */
.character-creator .tab.powers .items-list .item-name { flex: 2.2; }
.character-creator .tab.powers .items-list .item-linked { flex: 0 0 50px; }
.character-creator .tab.powers .items-list .item-aps { flex: 1.15; }
.character-creator .tab.powers .items-list .item-controls { flex: 0 0 30px; }

/* Modifiers */
.megs.character-creator .tab.powers .modifier-row {
    background: rgba(0, 0, 0, 0.02);
    font-size: 0.9em;
}
.megs.character-creator .tab.powers .modifier-name {
    padding-left: 25px;
    font-style: italic;
    color: #666;
}

/* Error states */
.megs .over-budget,
.megs .link-mismatch {
    color: #d32f2f;
    font-weight: bold;
}
```

**Sheet Dimensions**:
- Width: 650px (increased from 600px)
- Height: 600px

## File Changes

### Templates
- `templates/actor/character-creator-sheet.hbs`
  - Added Powers tab with full functionality
  - Added modifier rows under powers
  - Added calculated Factor Cost with tooltip

### JavaScript/Modules
- `module/sheets/character-creator-sheet.mjs`
  - Added `_enablePowerRowDropZones()`
  - Added `_onDragOver()`
  - Added `_onDropOnPower()`
  - Updated `getData()` to provide items collection
  - AP +/- handlers
  - Link checkbox handler
  - Cascade delete: deleting a power/skill also deletes all associated bonuses/limitations

- `module/megs.mjs` (Handlebars Helpers)
  - `isLinkedPowerMismatch(power, actor)` - check if linked power APs match attribute
  - `getPowerModifiers(powerId, items)` - filter modifiers for power
  - `formatSigned(number)` - format number with +/- sign
  - `getEffectiveFactorCost(power, items)` - calculate effective FC
  - `getFactorCostTooltip(power, items)` - generate tooltip text

- `module/documents/item.mjs`
  - Fixed cost calculation to use AP Purchase Chart
  - 0 APs = 0 cost validation
  - Linked power FC reduction

- `module/documents/actor.mjs`
  - Updated `_calculateHeroPointBudget()` to use stored budget
  - Separate powers cost tracking
  - Attribute cost via AP Purchase Chart

- `module/helpers/config.mjs`
  - Updated `getAPCost()` to allow 0 APs as valid

### Stylesheets
- `css/megs.css`
  - Character creator scoped styles
  - Powers tab column widths
  - Modifier row styling
  - Error state styling (.over-budget, .link-mismatch)
  - Factor Cost tooltip cursor

### Data
- `template.json`
  - Added `creationBudget.base` field (default 450)

### Localization
- `lang/en.json`
  - Added "Cost": "Cost"

- `lang/pt.json`
  - Added "Cost": "Custo"

## Technical Patterns

### Drag-and-Drop Pattern
```javascript
// 1. Enable drop zones
powerRows.each((i, row) => {
    row.addEventListener('dragover', this._onDragOver.bind(this));
    row.addEventListener('drop', this._onDropOnPower.bind(this));
});

// 2. Handle drop
async _onDropOnPower(event) {
    const data = TextEditor.getDragEventData(event);
    const droppedItem = await Item.implementation.fromDropData(data);
    const itemData = droppedItem.toObject(); // Creates copy
    itemData.system.parent = powerId; // Link to power
    await this.actor.createEmbeddedDocuments('Item', [itemData]);
}
```

### Cost Calculation Pattern
```javascript
// Item preparation (item.mjs)
if ((systemData.aps || 0) === 0) {
    systemData.totalCost = 0;
} else {
    const apCost = MEGS.getAPCost(systemData.aps, effectiveFC);
    systemData.totalCost = systemData.baseCost + apCost;
}
```

### Parent-Child Linking
Bonuses/Limitations link to Powers via `system.parent` field:
```javascript
itemData.system.parent = this.object._id; // Power's ID
```

Filter by parent:
```javascript
items.filter(i => i.system.parent === powerId)
```

### Handlebars Helper Pattern
```javascript
Handlebars.registerHelper('helperName', function(param1, param2) {
    // Calculate/process
    return result;
});

// Usage in template
{{helperName item ../context}}
```

### CSS Specificity for Scoping
```css
/* Scoped to character creator only */
.character-creator .tab.powers .items-list .item-name { }

/* vs general rule */
.megs .items-list .item-name { }
```
Higher specificity (more classes) = overrides general rules

## Important Rules & Validations

### MEGS Cost Rules
1. Base Cost paid once when purchasing power/skill at 0 APs
2. 0 APs = 0 total cost (not yet purchased)
3. APs > 0 = Base Cost + AP Chart lookup
4. Minimum Factor Cost is always 1
5. Linking reduces FC by 2 (minimum 1)

### Linked Power Rules
1. Must have APs equal to linked attribute
2. Forever tied to attribute
3. If attribute decreases, power decreases
4. Damage doesn't lower attribute, only Current Condition

### Data Integrity
- All items are copies (via `toObject()`)
- Original compendium items unchanged
- Each actor has independent item instances

## CSS Architecture

### Avoid SCSS
**Important**: Changes to SCSS files break the sheet. All styling changes must go directly to `css/megs.css`.

### Scoping Strategy
- Add unique class to sheet form (`.character-creator`)
- Use specific selectors to prevent bleed
- Include `.items-list` in selector path for proper specificity

## Known Patterns

### Error Highlighting
- Red, bold text for errors
- Classes: `.over-budget`, `.link-mismatch`
- Applied conditionally via Handlebars helpers

### Tooltip Pattern
- Use `title` attribute on element
- `\n` for line breaks in tooltip text
- Pointer cursor via CSS

### Flex Layout
- Most columns use flex ratios (flex: 1, flex: 2.2, etc.)
- Fixed columns use `flex: 0 0 [width]px`
- Centering: `display: flex; justify-content: center; align-items: center;`

## Testing Considerations

### Scenarios to Test
1. Power with 0 APs (should cost 0)
2. Power with APs (should use AP Chart + Base Cost)
3. Linked power matching attribute (no error)
4. Linked power NOT matching attribute (red error)
5. Power with bonuses (FC should update, tooltip should show)
6. Power with limitations (FC should update, tooltip should show)
7. Drag bonus onto power (should appear indented below)
8. Delete bonus (should remove from power)
9. Budget over-limit (HP Remaining should be red)

### Edge Cases
- 0 APs with linked power (should show mismatch if attribute > 0)
- Multiple modifiers on same power (all should stack)
- Linked power with modifiers (FC = base - 2 + mods, min 1)
- Negative Factor Cost after modifiers (should enforce minimum 1)

## Git Workflow

All commits include push:
```bash
git add <files> && git commit -m "message" && git push
```

## Future Work / Placeholders

### Incomplete Tabs
- Skills Tab (placeholder)
- Traits Tab (placeholder)
- Wealth Tab (placeholder)

These follow similar pattern to Powers tab when implemented.

## Key Commits

1. Initial Powers tab setup
2. Add drag-and-drop for Powers
3. Fix cost calculation with AP Purchase Chart
4. Add Link checkbox and mismatch detection
5. Implement Bonus/Limitation drag-and-drop
6. Add calculated Factor Cost with tooltip
7. Scope CSS to prevent actor sheet bleed

## References

### MEGS Rulebook Quotes
**Power/Skill Purchasing**:
> "Each Power and Skill has a Factor Cost listed in its description. To purchase a Power or Skill, a Player should simply cross-index the Power/Skill Factor Cost with the number of APs desired on the AP Purchase Chart."

**Base Cost**:
> "The Base Cost represents the cost of acquiring the Power or Skill at 0 APs; the Player only pays the Base Cost once, no matter how many APs of the Power or Skill are purchased."

**Linking**:
> "One of the advantages of linking Powers and Skills is that Hero Point Costs are much less expensive - a Player is allowed to subtract two (2) from the Factor Cost of any linked Power or Skill (to a minimum Factor Cost of 1)."

## Session Summary

Successfully implemented a fully functional Powers tab for the MEGS Character Creator with:
- AP Purchase Chart integration
- Linked powers with validation
- Bonuses/Limitations support via drag-and-drop
- Calculated Factor Cost with detailed tooltips
- Budget tracking
- Proper CSS scoping to avoid affecting actor sheets

All changes committed and pushed to branch `27-ap-purchase-chart`.
