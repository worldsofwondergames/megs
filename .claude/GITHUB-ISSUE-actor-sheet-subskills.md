# GitHub Issue: Update Actor and Item sheets for new checkbox-based subskill system

**Labels:** `must have`
**Milestone:** MEGS Release 1.0.0

---

## Overview
The Character Creator sheet has been updated to use a new checkbox-based subskill system (branch `27-ap-purchase-chart`), but the Actor sheets and Item sheets still use the old AP-based system. These need to be updated to match.

## New Subskill Model (Character Creator - Already Implemented)
- **Skills**: Hold the AP values and calculate costs
- **Subskills**: Only have checkboxes (`isTrained: true/false`)
- **Factor Cost**: Reduced by number of unchecked subskills (FC = Base FC - unchecked count)
- **APs**: Subskills inherit APs from parent skill (display only, not editable at subskill level)

## Changes Required

### 1. Actor Sheet - Skills Tab
- Display format: "Acrobatics (Climbing)" showing trained subskills in parentheses
- APs editable at skill level only
- Remove AP increment/decrement controls from subskills
- Add checkbox for subskill trained status

### 2. Skill Item Sheet
**Main Tab:**
- Show effective Factor Cost (reduced by unchecked subskills)
- Show APs at skill level only

**Subskills Tab:**
- Add checkboxes for each subskill (isTrained)
- Remove APs column from subskills display
- Add visual indicators: Blue die (trained) vs Gray die (untrained)
- Roll behavior: Normal for trained, untrained penalty for unchecked

### 3. Subskill Item Sheet
When opening a subskill's own item sheet:
- Hide Base Cost
- Hide Factor Cost
- Show APs as read-only label (value = parent skill's APs)
- Show trained status (isTrained checkbox)

### 4. Data Model Cleanup
- Remove `aps` field from subskill data model in `template.json`
- Update all code that references `subskill.system.aps` to look up parent skill's APs instead
- Affects: display logic, roll handlers, calculations

## Test Case
**Example: Acrobatics (3 subskills: Climbing, Dodging, Gymnastics)**

Scenario: Only Climbing is trained (checked), skill has 3 APs

- **Actor Sheet**: Shows "Acrobatics (Climbing)" with 3 APs, FC 5 (7 - 2 untrained)
- **Skill Item Sheet**: Shows FC 5, 3 APs, subskills tab has checkboxes (only Climbing checked)
- **Roll Icons**: Climbing = blue die (trained), others = gray die (untrained)
- **Subskill Item Sheet**: Opening "Climbing" shows 3 APs as label, no Base/Factor Cost

## Reference
See `TODO-actor-sheet-subskills.md` for detailed specification.

Reference implementation: `module/sheets/character-creator-sheet.mjs` and `templates/actor/character-creator-sheet.hbs`

## Related Files
- `module/sheets/actor-sheet.mjs`
- `templates/actor/actor-*-sheet.hbs`
- `module/sheets/item-sheet.mjs`
- `templates/item/item-skill-sheet.hbs`
- `templates/item/item-subskill-sheet.hbs`
- `template.json`
