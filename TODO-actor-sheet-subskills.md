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

4. **Template (actor-*-sheet.hbs)**
   - Update skills tab to show checkboxes for subskills
   - Show inherited APs as display-only value in subskills
   - Remove edit controls from subskill AP display

## Reference Implementation
See `character-creator-sheet.mjs` and `character-creator-sheet.hbs` for the correct implementation patterns.

## Related Files
- `module/sheets/actor-sheet.mjs` - Main actor sheet logic
- `templates/actor/actor-*-sheet.hbs` - Actor sheet templates for different actor types
- `module/documents/actor.mjs` - Cost calculation (already updated)
- `module/megs.mjs` - Handlebars helpers (already updated with new helpers)
