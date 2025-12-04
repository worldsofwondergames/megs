# ApplicationV2 Migration Plan for MEGS System

## Overview

This document outlines the plan to migrate the MEGS (Multiversal Exponential Gaming System) from Foundry VTT's deprecated V1 Application framework to the modern V2 Application framework (ApplicationV2).

## Current Status

- **Foundry Version Compatibility**: V12-V13 (verified through V12.331)
- **Current Framework**: Application V1 (deprecated since V13)
- **Deprecation Timeline**: Backwards compatible until V16
- **Urgency**: Medium - must complete before Foundry V16 release

## Why This Migration is Needed

### Deprecation Warning
```
Error: The V1 Application framework is deprecated, and will be removed in a later core software version.
Please use the V2 version of the Application framework available under foundry.applications.api.ApplicationV2.
Deprecated since Version 13
Backwards-compatible support will be removed in Version 16
```

### Benefits of V2
1. **More robust render lifecycle** with sequential processing
2. **Better state management** (no auto-maximize on re-render)
3. **Improved positioning** consistency
4. **Native form handling** without FormApplication
5. **Event-driven architecture** with EventEmitter
6. **No jQuery dependency** - modern vanilla JavaScript
7. **Type safety** with generic type parameters
8. **Better performance** and predictability

## Files Requiring Migration

### Primary Sheet Classes
1. **`module/sheets/item-sheet.mjs`** - `MEGSItemSheet` extends `ItemSheet`
2. **`module/sheets/actor-sheet.mjs`** - `MEGSActorSheet` extends `ActorSheet`

### Supporting Files (may need updates)
- Template files in `templates/` (minimal changes expected)
- CSS in `src/scss/` and `css/` (may need updates for V2 class names)
- Event handlers and helper methods throughout sheets

## Key Differences: V1 vs V2

### Class Hierarchy Changes
| V1 | V2 |
|----|----|
| `Application` | `foundry.applications.api.ApplicationV2` |
| `FormApplication` | `ApplicationV2` (forms built-in) |
| `DocumentSheet` | `foundry.applications.api.DocumentSheetV2` |
| `ItemSheet` | `foundry.applications.sheets.ItemSheetV2` |
| `ActorSheet` | `foundry.applications.sheets.ActorSheetV2` |

### Lifecycle Method Mapping
| V1 Method | V2 Equivalent | Notes |
|-----------|---------------|-------|
| `getData()` | `_prepareContext()` | Returns context object for rendering |
| N/A | `_renderHTML(context, options)` | **Required** - must implement to return HTML |
| `activateListeners(html)` | Event handlers in `_onRender()` or action-based | No jQuery, use vanilla JS |
| `_render()` | `render()` | Different signature and behavior |
| N/A | `_preRender(context, options)` | Async pre-render hook |
| N/A | `_postRender(context, options)` | Async post-render hook |
| `close()` | `close(options)` | Similar but with V2 lifecycle hooks |

### New V2 Lifecycle Hooks
1. `_preFirstRender(context, options)` - before first render
2. `_onFirstRender(context, options)` - after first render
3. `_preRender(context, options)` - before each render
4. `_onRender(context, options)` - after each render
5. `_preClose(options)` - before close
6. `_onClose(options)` - after close
7. `_prePosition(position)` - before position change
8. `_onPosition(position)` - after position change

### Event Handling Changes
**V1 Pattern:**
```javascript
activateListeners(html) {
  super.activateListeners(html);

  html.find('.item-delete').click(this._onItemDelete.bind(this));
  html.find('.item-edit').click(this._onItemEdit.bind(this));
}
```

**V2 Pattern (Action-based):**
```javascript
_onRender(context, options) {
  super._onRender(context, options);

  // Use data-action attributes in templates
  // V2 automatically routes to methods
  this.element.querySelector('[data-action="delete-item"]')
    .addEventListener('click', this._onDeleteItem.bind(this));
}
```

### Template Rendering
**V1:**
- Uses `renderTemplate()` internally
- Returns HTML string automatically

**V2:**
- Must implement `_renderHTML()` to return HTML
- Can use `renderTemplate()` within implementation
- Separates frame (window chrome) from content

**Example V2 Implementation:**
```javascript
async _renderHTML(context, options) {
  const html = await renderTemplate(this.constructor.DEFAULT_OPTIONS.window.template, context);
  return html;
}
```

## Migration Steps

### Phase 1: Preparation & Analysis (Recommended First)
- [ ] **1.1** Create feature branch: `applicationv2-migration`
- [ ] **1.2** Audit all current sheet classes
  - Document all methods in `MEGSItemSheet`
  - Document all methods in `MEGSActorSheet`
  - List all event handlers and their purposes
  - Identify jQuery dependencies
- [ ] **1.3** Review V2 documentation thoroughly
  - [ApplicationV2 API Docs](https://foundryvtt.com/api/classes/foundry.applications.api.ApplicationV2.html)
  - [Community Wiki Conversion Guide](https://foundryvtt.wiki/en/development/guides/applicationV2-conversion-guide)
- [ ] **1.4** Set up test world with sample characters/items
- [ ] **1.5** Document current functionality as test cases

### Phase 2: Migrate ItemSheet (Start Here - Simpler)
- [ ] **2.1** Create new `MEGSItemSheetV2` class
  ```javascript
  import { ItemSheetV2 } from "foundry/applications/sheets/item";

  export class MEGSItemSheetV2 extends ItemSheetV2 {
    static DEFAULT_OPTIONS = {
      classes: ["megs", "sheet", "item"],
      window: {
        template: "systems/megs/templates/item/item-sheet.hbs"
      }
    };
  }
  ```

- [ ] **2.2** Convert `getData()` to `_prepareContext()`
  - Current location: `module/sheets/item-sheet.mjs` (~line 45)
  - Remove jQuery dependencies
  - Return context object matching template needs

- [ ] **2.3** Implement `_renderHTML()`
  - Must return HTML string or element
  - Use `renderTemplate()` for Handlebars templates
  - Handle different item types (gadget, power, skill, etc.)

- [ ] **2.4** Convert event handlers
  - Audit all handlers in `activateListeners()` (~line 237)
  - Key handlers to migrate:
    - `.item-create` - create sub-items
    - `.item-edit` - edit sub-items
    - `.item-delete` - delete sub-items
    - `.rollable` - dice rolling
    - `.item-toggle` - toggle item properties
    - Drag/drop handlers
    - Tab switching
  - Convert from jQuery to vanilla JavaScript
  - Move to `_onRender()` or action-based pattern

- [ ] **2.5** Remove jQuery Dependencies
  - Replace `html.find()` with `querySelector()`/`querySelectorAll()`
  - Replace `$(event.currentTarget)` with `event.currentTarget`
  - Replace `.parents()` with `.closest()`
  - Replace `.data()` with `.dataset` or `.getAttribute()`
  - Replace `.addClass()/.removeClass()` with `.classList.add()/.remove()`

- [ ] **2.6** Update form handling
  - V2 has native form support
  - Review `_updateObject()` if used
  - Update to V2 form submission patterns

- [ ] **2.7** Handle special cases
  - Virtual items for standalone gadgets (skills/traits storage)
  - Nested item sheets (gadgets with powers/skills)
  - Drag-drop for item creation
  - `_onDropItem()` handler (~line 811)
  - Custom context menus

- [ ] **2.8** Update templates if needed
  - Change `data-item-id` patterns if necessary
  - Add `data-action` attributes for V2 action routing
  - Test with all item types:
    - advantage
    - bonus
    - drawback
    - gadget (regular and omni)
    - limitation
    - power
    - skill
    - subskill

- [ ] **2.9** Test ItemSheet thoroughly
  - Open/close sheets
  - Edit all item types
  - Create/delete sub-items
  - Drag/drop functionality
  - Rolling from items
  - Virtual item handling (standalone gadgets)
  - Form submission and data updates

### Phase 3: Migrate ActorSheet
- [ ] **3.1** Create new `MEGSActorSheetV2` class
  ```javascript
  import { ActorSheetV2 } from "foundry/applications/sheets/actor";

  export class MEGSActorSheetV2 extends ActorSheetV2 {
    static DEFAULT_OPTIONS = {
      classes: ["megs", "sheet", "actor"],
      window: {
        template: "systems/megs/templates/actor/actor-sheet.hbs"
      }
    };
  }
  ```

- [ ] **3.2** Convert `getData()` to `_prepareContext()`
  - Similar process to ItemSheet
  - Handle actor-specific data preparation
  - Prepare owned items (powers, skills, gadgets, traits)

- [ ] **3.3** Implement `_renderHTML()`
  - Handle different actor types (hero, villain, npc, pet, vehicle, location)
  - Template selection logic

- [ ] **3.4** Convert event handlers
  - All handlers from `activateListeners()`
  - Actor-specific handlers:
    - Attribute rolling
    - Hero point management
    - Item management (create/edit/delete)
    - Drag/drop
    - Initiative rolling
    - Tab navigation

- [ ] **3.5** Remove jQuery dependencies
  - Same process as ItemSheet

- [ ] **3.6** Update form handling
  - Actor data updates
  - Embedded document (item) updates

- [ ] **3.7** Handle special cases
  - Combat integration
  - Token updates
  - Linked actors vs unlinked tokens
  - Gadget ownership and nesting
  - Vehicle/pet ownership

- [ ] **3.8** Test ActorSheet thoroughly
  - All actor types: hero, villain, npc, pet, vehicle, location
  - Attribute updates and rolling
  - Item management
  - Hero points
  - Combat/initiative
  - Token integration

### Phase 4: Integration & Registration
- [ ] **4.1** Update `module/megs.mjs` registration
  ```javascript
  // Old V1
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("megs", MEGSItemSheet, { makeDefault: true });

  // New V2
  DocumentSheetConfig.unregisterSheet(Item, "core", ItemSheet);
  DocumentSheetConfig.registerSheet(Item, "megs", MEGSItemSheetV2, {
    makeDefault: true
  });
  ```

- [ ] **4.2** Update imports across system
  - Change all references from old to new classes
  - Update any helpers that reference sheet classes

- [ ] **4.3** Handle backwards compatibility (if needed)
  - Consider migration path for existing worlds
  - Document any breaking changes

### Phase 5: CSS & Styling
- [ ] **5.1** Review CSS for V2 compatibility
  - V13+ uses CSS Layers
  - May need custom theming with CSS variables
  - Check `src/scss/` and compiled `css/`

- [ ] **5.2** Update class names if changed
  - V2 may use different CSS classes
  - Test visual appearance of all sheets

- [ ] **5.3** Test responsive behavior
  - Window positioning
  - Minimized state
  - Different screen sizes

### Phase 6: Testing & Validation
- [ ] **6.1** Comprehensive functional testing
  - All item types
  - All actor types
  - All CRUD operations
  - All rolling functions
  - Drag/drop
  - Gadget nesting
  - Virtual items (skills/traits on standalone gadgets)

- [ ] **6.2** Performance testing
  - Sheet open/close speed
  - Re-render performance
  - Large actors with many items

- [ ] **6.3** Integration testing
  - Combat integration
  - Macro integration
  - Compendium integration
  - Module compatibility (if any known modules)

- [ ] **6.4** Browser compatibility
  - Chrome
  - Firefox
  - Safari
  - Edge

- [ ] **6.5** Foundry version testing
  - Test on V13 (current verified: 12.331)
  - Test on latest stable
  - Test on latest development version (if possible)

### Phase 7: Cleanup & Documentation
- [ ] **7.1** Remove old V1 classes
  - Delete old `MEGSItemSheet`
  - Delete old `MEGSActorSheet`
  - Clean up any V1-specific code

- [ ] **7.2** Update documentation
  - README.md
  - CHANGELOG.md
  - Code comments
  - API documentation if any

- [ ] **7.3** Update `system.json`
  - Bump version number
  - Update compatibility.verified to V13+
  - Update changelog reference

- [ ] **7.4** Code cleanup
  - Remove commented-out V1 code
  - Ensure consistent code style
  - Run linter if configured

### Phase 8: Release
- [ ] **8.1** Create pull request
  - Comprehensive description of changes
  - Link to this migration plan
  - List breaking changes (if any)

- [ ] **8.2** Tag release
  - Follow semantic versioning
  - Consider this a major version bump (breaking change)

- [ ] **8.3** Announce migration
  - GitHub release notes
  - Any community channels
  - Note V13+ requirement

## Critical Implementation Notes

### 1. Virtual Items (Standalone Gadgets)
The MEGS system has a unique feature where standalone (unowned) gadgets can store "virtual" skills and traits in `skillData`, `subskillData`, and `traitData` objects. These are displayed as virtual items and converted to real items when the gadget is added to an actor.

**V2 Considerations:**
- Ensure `_prepareContext()` includes virtual item generation
- Event handlers must distinguish virtual vs real items
- Virtual item deletion uses Foundry's key deletion syntax: `system.traitData.-=${key}: null`
- Must use `render(true)` for full re-render after virtual item changes

**Key Methods to Preserve:**
- `_createVirtualSkillsFromData()` - item-sheet.mjs
- `_createVirtualTraitsFromData()` - item-sheet.mjs
- `_onDropSkillToStandaloneGadget()` - item-sheet.mjs
- `_onDropTraitToStandaloneGadget()` - item-sheet.mjs
- Virtual item delete handler logic

### 2. Nested Items (Gadgets with Powers/Skills)
Gadgets can own other items (powers, skills, traits) when attached to an actor. The sheet must handle:
- Creating items on parent actor with `parent` field set to gadget ID
- Filtering actor items by parent
- Delete cascades (when gadget deleted, its items should be deleted)

**V2 Considerations:**
- Ensure `_prepareContext()` properly filters items by parent
- Maintain `_prepareGadgetData()` logic (~line 587 in item-sheet.mjs)
- Preserve `_addSkillsToGadget()` and `_addTraitsToGadget()` in item.mjs

### 3. Rolling System
MEGS uses a custom rolling system with `MegsTableRolls` and `RollValues`:
- Powers roll with APs as AV/EV
- Skills roll with linked attributes
- Target actor selection for OV/RV calculation

**V2 Considerations:**
- Preserve `rollMegs()` method in item.mjs
- Ensure `.rollable` click handlers work in V2
- Test rolling from both actor sheets and item sheets

### 4. Omni Gadgets
Special gadget type with different template and behavior:
- `item-gadget-omni-header.hbs` vs `item-gadget-header.hbs`
- `item-gadget-omni-abilities.hbs` vs `item-gadget-abilities.hbs`
- Conditional rendering based on `system.isOmni`

**V2 Considerations:**
- Ensure template selection logic works in `_renderHTML()`
- Test omni gadget creation and editing

### 5. Tab Management
Both actor and item sheets use tabbed navigation (`data-group="primary"`)

**V2 Considerations:**
- V2 has built-in tab support via `changeTab()` method
- Ensure tab state persists across renders
- May use `_onChangeTab()` hook

### 6. Drag & Drop
Complex drag/drop system:
- Dragging items from sidebar to sheets
- Dragging items between actors
- Dragging items to gadgets (creates nested items)
- Dragging skills/traits to standalone gadgets (creates virtual items)

**V2 Considerations:**
- May need to implement `_onDrop()` and related handlers
- Preserve `_onDropItem()` logic (~line 811 in item-sheet.mjs)
- Test all drag/drop scenarios thoroughly

## jQuery to Vanilla JavaScript Conversion Reference

### Common Patterns

| jQuery | Vanilla JavaScript |
|--------|-------------------|
| `html.find('.class')` | `element.querySelector('.class')` |
| `html.find('.class')` (all) | `element.querySelectorAll('.class')` |
| `$(this)` | `this` or `event.currentTarget` |
| `$(event.currentTarget)` | `event.currentTarget` |
| `elem.parents('.class')` | `elem.closest('.class')` |
| `elem.data('key')` | `elem.dataset.key` or `elem.getAttribute('data-key')` |
| `elem.addClass('class')` | `elem.classList.add('class')` |
| `elem.removeClass('class')` | `elem.classList.remove('class')` |
| `elem.toggleClass('class')` | `elem.classList.toggle('class')` |
| `elem.hasClass('class')` | `elem.classList.contains('class')` |
| `elem.html()` | `elem.innerHTML` |
| `elem.text()` | `elem.textContent` |
| `elem.val()` | `elem.value` |
| `elem.attr('name')` | `elem.getAttribute('name')` |
| `elem.attr('name', 'value')` | `elem.setAttribute('name', 'value')` |
| `elem.prop('checked')` | `elem.checked` |
| `elem.click(handler)` | `elem.addEventListener('click', handler)` |
| `elem.on('click', '.child', handler)` | Delegate manually or use `element.addEventListener` with event.target check |

### Event Delegation Example

**jQuery:**
```javascript
html.on('click', '.item-delete', (ev) => {
  ev.preventDefault();
  const li = $(ev.currentTarget).parents('.item');
  const itemId = li.data('item-id');
  // ...
});
```

**Vanilla JavaScript:**
```javascript
element.addEventListener('click', (ev) => {
  const deleteBtn = ev.target.closest('.item-delete');
  if (!deleteBtn) return;

  ev.preventDefault();
  const li = deleteBtn.closest('.item');
  const itemId = li.dataset.itemId;
  // ...
});
```

## Testing Checklist

### Item Sheet Testing
- [ ] Open gadget sheet (regular)
- [ ] Open gadget sheet (omni)
- [ ] Open power sheet
- [ ] Open skill sheet
- [ ] Open subskill sheet
- [ ] Open advantage sheet
- [ ] Open drawback sheet
- [ ] Open bonus sheet
- [ ] Open limitation sheet
- [ ] Edit item name
- [ ] Edit item description
- [ ] Update numeric fields (APs, costs, etc.)
- [ ] Toggle checkboxes
- [ ] Change dropdowns
- [ ] Add sub-item via + button (gadget owned by actor)
- [ ] Add sub-item via drag/drop (gadget owned by actor)
- [ ] Edit sub-item
- [ ] Delete sub-item via trash icon
- [ ] Add skill to standalone gadget (drag/drop)
- [ ] Add skill to standalone gadget (+ button)
- [ ] Delete skill from standalone gadget
- [ ] Add trait to standalone gadget (drag/drop)
- [ ] Add trait to standalone gadget (+ button)
- [ ] Delete trait from standalone gadget
- [ ] Switch between tabs
- [ ] Roll from power
- [ ] Roll from skill
- [ ] Save and close
- [ ] Re-open and verify changes persisted

### Actor Sheet Testing
- [ ] Open hero actor
- [ ] Open villain actor
- [ ] Open NPC actor
- [ ] Open pet actor
- [ ] Open vehicle actor
- [ ] Open location actor
- [ ] Edit actor name
- [ ] Edit actor attributes (DEX, STR, BODY, INT, WILL, MIND, INFL, AURA, SPIRIT)
- [ ] Update current condition tracks (currentBody, currentMind, currentSpirit)
- [ ] Update hero points
- [ ] Add power via + button
- [ ] Add power via drag/drop
- [ ] Edit power from actor sheet
- [ ] Delete power
- [ ] Add skill via + button
- [ ] Add skill via drag/drop
- [ ] Edit skill from actor sheet
- [ ] Delete skill
- [ ] Add gadget via drag/drop
- [ ] Edit gadget from actor sheet
- [ ] Delete gadget
- [ ] Verify gadget's nested items appear when gadget added
- [ ] Add advantage via drag/drop
- [ ] Add drawback via drag/drop
- [ ] Delete advantage/drawback
- [ ] Roll attribute
- [ ] Roll initiative
- [ ] Switch between tabs
- [ ] Save and close
- [ ] Re-open and verify changes persisted

### Integration Testing
- [ ] Drag actor to scene (creates token)
- [ ] Edit token actor sheet (unlinked)
- [ ] Verify linked actor updates
- [ ] Add actor to combat tracker
- [ ] Roll initiative from combat tracker
- [ ] Verify initiative uses actor data
- [ ] Create macro from item
- [ ] Execute macro and verify roll
- [ ] Import actor from compendium
- [ ] Export actor to compendium
- [ ] Drag item from compendium to actor
- [ ] Drag item from compendium to world

## Resources

### Official Documentation
- [ApplicationV2 API Documentation](https://foundryvtt.com/api/classes/foundry.applications.api.ApplicationV2.html)
- [ItemSheetV2 API Documentation](https://foundryvtt.com/api/classes/foundry.applications.sheets.ItemSheetV2.html)
- [ActorSheetV2 API Documentation](https://foundryvtt.com/api/classes/foundry.applications.sheets.ActorSheetV2.html)
- [DocumentSheetV2 API Documentation](https://foundryvtt.com/api/classes/foundry.applications.api.DocumentSheetV2.html)

### Community Resources
- [ApplicationV2 Community Wiki](https://foundryvtt.wiki/en/development/api/applicationv2)
- [ApplicationV2 Conversion Guide](https://foundryvtt.wiki/en/development/guides/applicationV2-conversion-guide)
- [Converting to ApplicationV2 Guide](https://foundryvtt.wiki/en/development/guides/converting-to-appv2)
- [ApplicationV2 GitHub Issue #5441](https://github.com/foundryvtt/foundryvtt/issues/5441)

### Additional Learning
- [ApplicationV2 Development Guide by Rayner](https://docs.rayners.dev/seasons-and-stars/applicationv2-development/)

## Timeline Estimate

### Minimum Viable Migration
- **Phase 1 (Preparation)**: 4-8 hours
- **Phase 2 (ItemSheet)**: 16-24 hours
- **Phase 3 (ActorSheet)**: 16-24 hours
- **Phase 4 (Integration)**: 2-4 hours
- **Phase 5 (CSS)**: 4-8 hours
- **Phase 6 (Testing)**: 8-16 hours
- **Phase 7 (Cleanup)**: 2-4 hours
- **Phase 8 (Release)**: 1-2 hours

**Total Estimated Time**: 53-90 hours (1.5-2.5 weeks full-time, or 3-5 weeks part-time)

### Factors That Could Increase Time
- Unfamiliar with V2 architecture (add 25-50% time for learning)
- Complex custom features in sheets (virtual items, nested items)
- Extensive testing requirements
- Bug fixes and edge cases discovered during testing
- CSS/styling issues requiring significant rework

### Factors That Could Decrease Time
- Prior V2 migration experience
- Simple sheet implementations
- Good existing test coverage
- Clean, well-documented V1 code

## Success Criteria

Migration is considered complete when:
1. ✅ All deprecation warnings removed from console
2. ✅ All item types can be created, edited, and deleted
3. ✅ All actor types can be created, edited, and deleted
4. ✅ All rolling functions work correctly
5. ✅ Drag/drop functionality works for all scenarios
6. ✅ Virtual items (standalone gadget skills/traits) work correctly
7. ✅ Nested items (gadget powers/skills) work correctly
8. ✅ All tabs navigate correctly
9. ✅ Forms submit and update data correctly
10. ✅ Sheets render at correct size and position
11. ✅ No jQuery dependencies remain
12. ✅ All tests pass (create comprehensive test checklist)
13. ✅ Performance is same or better than V1
14. ✅ No console errors or warnings
15. ✅ Visual appearance matches or improves upon V1
16. ✅ Compatibility verified on Foundry V13+
17. ✅ Documentation updated

## Notes for Future Developer

### Current Code Organization
- **Sheets**: `module/sheets/` (item-sheet.mjs, actor-sheet.mjs)
- **Documents**: `module/documents/` (item.mjs, actor.mjs)
- **Templates**: `templates/` (Handlebars .hbs files)
- **Styles**: `src/scss/` (SCSS source), `css/` (compiled)
- **Helpers**: `module/helpers/` (config, utils, etc.)
- **Dice**: `module/dice.mjs` (MegsTableRolls, RollValues)

### Key System-Specific Features to Preserve
1. **MEGS Rolling System**: Custom 2d10 + column shift system
2. **Virtual Items**: Skills/traits stored as data on standalone gadgets
3. **Nested Items**: Gadgets owning powers/skills/traits
4. **Omni Gadgets**: Special gadget type with different templates
5. **Linked Attributes**: Powers/skills linked to specific attributes
6. **Hero Points**: System-specific resource tracking
7. **Action/Opposing/Effect/Resistance Values**: Four-value combat system

### Watch Out For
- Don't break virtual item system (critical for standalone gadgets)
- Preserve all rolling functionality (complex custom system)
- Maintain gadget nesting behavior (items with parent field)
- Keep omni gadget special handling
- Don't lose any data during form submissions
- Test thoroughly with actual game data, not just new items

### If You Get Stuck
1. Review official V2 documentation (links above)
2. Check community wiki conversion guides
3. Look for example systems that have migrated:
   - Search GitHub for "ApplicationV2" + "Foundry"
   - Check Foundry VTT Discord #system-development
4. Start with simplest item type (bonus/limitation) before complex ones (gadget)
5. Create minimal test case if behavior is confusing
6. Remember: V2 is about lifecycle and events, not jQuery tricks

### Development Tips
- Use browser DevTools heavily (especially for event debugging)
- Console.log liberally during development
- Test each change incrementally, don't code for hours without testing
- Keep V1 backup until fully confident V2 works
- Consider feature flag to toggle between V1/V2 during development
- Use git branches and commit frequently

---

**Document Version**: 1.0
**Created**: 2025-12-03
**Last Updated**: 2025-12-03
**Next Review**: Before starting Phase 1
