# TODO: Update Actor Sheet for New Subskill System

## Current Status

The Character Creator sheet has been updated to use the new subskill system (commit 03352e4), but the Actor sheet still uses the old system.

## Changes Needed for Actor Sheet

### New Subskill Model (Character Creator - Implemented)

- **Skills**: Hold the AP values and calculate costs
- **Subskills**: Only have checkboxes (isTrained: true/false)
- **Factor Cost**: Reduced by number of unchecked subskills (FC = Base FC - unchecked count)
- **APs**: Subskills inherit APs from parent skill (display only, not editable at subskill level)

### Actor Sheet Updates Required

1. **Skills Tab Display**
    - Skills show: Name, APs (editable), Cost
    - Subskills show: Checkbox (isTrained), Name, APs (inherited from parent, display only)
    - Remove AP increment/decrement controls from subskills
    - Subskills display parent skill's AP value but are not editable

2. **Factor Cost Calculation**
    - Update to use unchecked subskill count (same logic as Character Creator)
    - Display effective FC in skill tooltips

3. **Sheet Logic (actor-sheet.mjs)**
    - Remove subskill AP editing handlers
    - Add checkbox change handler for subskill isTrained property
    - Update any skill/subskill display logic to match Character Creator pattern

4. **Template (actor-\*-sheet.hbs)**
    - Update skills tab to show checkboxes for subskills
    - Show inherited APs as display-only value in subskills
    - Remove edit controls from subskill AP display

## Test Case / Expected Behavior

**Example: Acrobatics Skill (3 subskills: Climbing, Dodging, Gymnastics)**

Scenario: Only Climbing is trained (checked)

### Actor Sheet - Skills Tab

- **Display Name**: "Acrobatics (Climbing)" - shows trained subskills in parentheses
- **APs**: 1+ APs selectable at skill level (not at subskill level)
- **Factor Cost**: 5 (base FC 7 - 2 untrained subskills)

### Skill Item Sheet

**Main Tab:**

- Shows updated Factor Cost: 5
- Shows 1+ APs selected at skill level

**Subskills Tab:**

- **Checkboxes**: Only Climbing is checked; Dodging and Gymnastics are unchecked
- **APs Column**: Removed from subskills display
- **Roll Icons**:
    - Climbing: Blue die icon (trained)
    - Dodging: Gray die icon (untrained)
    - Gymnastics: Gray die icon (untrained)

**Rolling Behavior:**

- Rolling Climbing: Normal roll (uses skill APs)
- Rolling Dodging: Untrained roll (penalty applied)
- Rolling Gymnastics: Untrained roll (penalty applied)

### Subskill Item Sheet

When opening a subskill's own item sheet (e.g., "Climbing" item):

- **Base Cost**: Not displayed
- **Factor Cost**: Not displayed
- **APs**: Displayed as a read-only label (not +/- component)
    - Value equals the parent skill's AP value (e.g., if Acrobatics has 3 APs, Climbing shows "3 APs")
- **Trained Status**: Shows whether this subskill is checked (isTrained: true/false)

## Reference Implementation

See `character-creator-sheet.mjs` and `character-creator-sheet.hbs` for the correct implementation patterns.

5. **Skill Item Sheet Display**
    - This change will also impact how Subskills are displayed on a Skill item sheet
    - Item sheets will need to reflect that subskills are checkbox-based (isTrained)
    - Subskills should show as checked/unchecked, not as having independent AP values

6. **Data Model Cleanup**
    - Remove `aps` field from subskill data model in `template.json`
    - Subskills no longer store their own AP values (they inherit from parent skill)
    - Update any code that references `subskill.system.aps` to instead look up parent skill's APs
    - This includes: display logic, roll handlers, and any calculations

## Related Files

- `module/sheets/actor-sheet.mjs` - Main actor sheet logic
- `templates/actor/actor-*-sheet.hbs` - Actor sheet templates for different actor types
- `module/sheets/item-sheet.mjs` - Item sheet logic (may need updates for skill display)
- `templates/item/item-skill-sheet.hbs` - Skill item sheet template (may need updates)
- `module/documents/actor.mjs` - Cost calculation (already updated)
- `module/megs.mjs` - Handlebars helpers (already updated with new helpers)
