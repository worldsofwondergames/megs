# Enriched Text Implementation Plan

**GitHub Issue:** #57 - Allow enriched text
**Branch:** 57-allow-enriched-text
**Priority:** Must Have (MEGS 1.0.0 Milestone)

## Overview

Implement Foundry VTT's text enrichment system using `TextEditor.enrichHTML` to support:
- Links to actors, items, journal entries (@Actor, @Item, @JournalEntry, etc.)
- Inline roll formulas ([[/roll 2d10]], etc.)
- Rich text formatting in biography and description fields
- Content links and references across the game system

## Current State Analysis

### Text Fields Requiring Enrichment

1. **Actor Biography** (`system.biography`)
   - Located in: `templates/actor/parts/actor-description.hbs` (line 96)
   - Currently displays: `{{{system.biography}}}` (raw HTML, not enriched)
   - Used by: hero, villain, npc, pet actor types

2. **Item Descriptions** (`system.description`)
   - Power sheet: `templates/item/item-power-sheet.hbs` (line 198) - uses `{{editor}}` helper
   - Skill sheet: `templates/item/item-skill-sheet.hbs` (line 133)
   - Subskill sheet: `templates/item/item-subskill-sheet.hbs` (line 131)
   - Advantage sheet: `templates/item/item-advantage-sheet.hbs` (line 54)
   - Limitation sheet: `templates/item/item-limitation-sheet.hbs` (line 41)
   - Bonus sheet: (needs verification)
   - Drawback sheet: (needs verification)
   - Gadget sheet: (needs verification)

3. **Linked Item Descriptions**
   - Vehicle sheet: `templates/actor/actor-vehicle-sheet.hbs` (line 129)
   - Displays linked gadget descriptions: `{{{system.linkedItem.system.description}}}`

### No Current Enrichment

- `enrichHTML` is not currently used anywhere in the codebase
- `TextEditor` is only used for `getDragEventData()` in drag-and-drop operations
- All description fields display raw HTML without enrichment

## Implementation Steps

### Phase 1: Actor Biography Enrichment

**File:** `module/sheets/actor-sheet.mjs`

1. **Modify `getData()` method** (starting at line 45)
   - Add biography enrichment before returning context
   - Use async/await pattern for enrichment

```javascript
// Add before return context; (around line 119)
// Enrich biography text for proper display of links and other enriched content
if (context.system.biography) {
    context.enrichedBiography = await TextEditor.enrichHTML(context.system.biography, {
        async: true,
        secrets: this.document.isOwner,
        relativeTo: this.actor
    });
} else {
    context.enrichedBiography = '';
}
```

2. **Update getData to async**
   - Change `getData()` to `async getData()`
   - Ensure all callers handle async properly (should be automatic in Foundry)

**File:** `templates/actor/parts/actor-description.hbs`

3. **Use enriched biography** (line 96)
   - Change from `{{{system.biography}}}` to `{{{enrichedBiography}}}`

```handlebars
<div class='indentLeft'>
    {{#if enrichedBiography}}
        {{{enrichedBiography}}}
    {{else}}
        ({{localize 'MEGS.None'}})
    {{/if}}
</div>
```

### Phase 2: Item Description Enrichment

**File:** `module/sheets/item-sheet.mjs`

1. **Modify `getData()` method** (starting at line 51)
   - Add description enrichment before returning context
   - Make method async if not already

```javascript
// Add before return context; (find the end of getData method)
// Enrich description text for proper display of links and other enriched content
if (context.system.description) {
    context.enrichedDescription = await TextEditor.enrichHTML(context.system.description, {
        async: true,
        secrets: this.document.isOwner,
        relativeTo: this.item
    });
} else {
    context.enrichedDescription = '';
}
```

2. **Update getData to async**
   - Change `getData()` to `async getData()`

**Files:** Multiple item sheet templates

3. **Update all item templates** to use enriched descriptions in read-only mode:
   - `templates/item/item-skill-sheet.hbs` (line 133)
   - `templates/item/item-subskill-sheet.hbs` (line 131)
   - `templates/item/item-advantage-sheet.hbs` (line 54)
   - `templates/item/item-limitation-sheet.hbs` (line 41)
   - Any other item sheets with description fields

For templates that show description in a static display:
```handlebars
{{!-- OLD --}}
<div class="description-text">{{{system.description}}}</div>

{{!-- NEW --}}
<div class="description-text">{{{enrichedDescription}}}</div>
```

**Note:** Templates using `{{editor}}` helper (like power sheet) already handle editing correctly and will automatically show enriched content when in read-only mode.

### Phase 3: Gadget Description Enrichment

**File:** `module/sheets/item-sheet.mjs`

1. **Handle gadget child items**
   - When preparing gadget data, enrich descriptions of child items (powers, skills, etc.)
   - Find where child items are prepared (likely in `_prepareItems` or similar method)
   - Add enrichment for each child item's description

**File:** `templates/actor/actor-vehicle-sheet.hbs`

2. **Update linked item description** (line 129)
   - Need to enrich linked gadget descriptions in actor-sheet.mjs
   - Add in vehicle/location data preparation section

```javascript
// In actor-sheet.mjs, in _populateLinkedGadgets or getData for vehicles/locations
if (context.system.linkedItem?.system?.description) {
    context.enrichedLinkedDescription = await TextEditor.enrichHTML(
        context.system.linkedItem.system.description,
        {
            async: true,
            secrets: this.document.isOwner,
            relativeTo: this.actor
        }
    );
}
```

Template update:
```handlebars
{{!-- OLD --}}
{{{system.linkedItem.system.description}}}

{{!-- NEW --}}
{{{enrichedLinkedDescription}}}
```

### Phase 4: Character Creator Sheet

**File:** `module/sheets/character-creator-sheet.mjs`

1. **Update getData method** (line 30)
   - Already async
   - Add biography enrichment similar to actor-sheet.mjs

```javascript
// Add before return context;
if (context.system.biography) {
    context.enrichedBiography = await TextEditor.enrichHTML(context.system.biography, {
        async: true,
        secrets: this.document.isOwner,
        relativeTo: this.actor
    });
}
```

2. **Update character creator template**
   - Find and update any biography displays to use enrichedBiography

### Phase 5: Testing & Validation

1. **Test actor biography enrichment**
   - Create test actor with links: `@Actor[id]{Actor Name}`, `@Item[id]{Item Name}`
   - Create test with inline rolls: `[[/roll 2d10]]`
   - Verify links are clickable and functional
   - Verify rolls work when clicked

2. **Test item description enrichment**
   - Create powers/skills/gadgets with enriched descriptions
   - Test all item types (power, skill, subskill, advantage, limitation, bonus, drawback)
   - Verify edit mode uses TinyMCE editor
   - Verify read-only mode shows enriched content

3. **Test permission handling**
   - Verify `secrets: this.document.isOwner` properly hides GM-only content
   - Test as player and as GM

4. **Test linked content**
   - Verify vehicle/location sheets show enriched gadget descriptions
   - Test nested enrichment (gadget with enriched description on vehicle sheet)

5. **Test edge cases**
   - Empty/null biography or description
   - Very long descriptions with multiple enrichments
   - Nested enrichments
   - Invalid references (broken links)

## Files to Modify

### JavaScript Files
- [ ] `module/sheets/actor-sheet.mjs` - Add biography enrichment in getData()
- [ ] `module/sheets/item-sheet.mjs` - Add description enrichment in getData()
- [ ] `module/sheets/character-creator-sheet.mjs` - Add biography enrichment in getData()

### Template Files
- [ ] `templates/actor/parts/actor-description.hbs` - Use enrichedBiography
- [ ] `templates/item/item-skill-sheet.hbs` - Use enrichedDescription
- [ ] `templates/item/item-subskill-sheet.hbs` - Use enrichedDescription
- [ ] `templates/item/item-advantage-sheet.hbs` - Use enrichedDescription
- [ ] `templates/item/item-limitation-sheet.hbs` - Use enrichedDescription
- [ ] `templates/item/item-bonus-sheet.hbs` - Check and update if needed
- [ ] `templates/item/item-drawback-sheet.hbs` - Check and update if needed
- [ ] `templates/item/item-gadget-sheet.hbs` - Check and update if needed
- [ ] `templates/actor/actor-vehicle-sheet.hbs` - Use enrichedLinkedDescription
- [ ] `templates/actor/actor-location-sheet.hbs` - Check and update if needed

## Important Notes

1. **Async/Await Pattern**
   - `TextEditor.enrichHTML()` is async, so getData() methods must be async
   - Foundry handles async getData() correctly, no changes needed to callers

2. **Enrichment Options**
   - `async: true` - Required for async enrichment
   - `secrets: this.document.isOwner` - Shows secret blocks only to owners
   - `relativeTo: this.actor/this.item` - Resolves relative UUIDs correctly

3. **Editor Helper**
   - The `{{editor}}` Handlebars helper already handles TinyMCE editing
   - When editor is in read-only mode, it automatically shows the content
   - We only need to enrich content shown outside the editor helper

4. **Triple Braces**
   - Use `{{{enrichedBiography}}}` (triple braces) to render HTML
   - enrichHTML returns HTML string, needs unescaped rendering

5. **Backward Compatibility**
   - Enrichment should not break existing content
   - Plain text displays as plain text
   - Only content with special syntax gets enriched

## Testing Checklist

- [ ] Actor biography with @Actor links works
- [ ] Actor biography with @Item links works
- [ ] Actor biography with @JournalEntry links works
- [ ] Actor biography with inline rolls [[/roll]] works
- [ ] Power descriptions show enriched content (read-only mode)
- [ ] Skill descriptions show enriched content
- [ ] Subskill descriptions show enriched content
- [ ] Advantage descriptions show enriched content
- [ ] Limitation descriptions show enriched content
- [ ] Bonus descriptions show enriched content (if applicable)
- [ ] Drawback descriptions show enriched content (if applicable)
- [ ] Gadget descriptions show enriched content
- [ ] Vehicle sheet shows enriched linked gadget descriptions
- [ ] Location sheet shows enriched content
- [ ] Character creator sheet shows enriched biography
- [ ] Secret blocks hidden from non-owners
- [ ] Edit mode still uses TinyMCE editor properly
- [ ] Empty/null descriptions don't cause errors
- [ ] Performance is acceptable (no lag when opening sheets)

## References

- Foundry VTT Documentation: [Text Enrichment](https://foundryvtt.com/article/text-enrichment/)
- Foundry API: `TextEditor.enrichHTML()`
- Example implementation: Vaesen Foundry VTT project

## Estimated Effort

- Phase 1 (Actor Biography): 30-45 minutes
- Phase 2 (Item Descriptions): 45-60 minutes
- Phase 3 (Gadget Descriptions): 30-45 minutes
- Phase 4 (Character Creator): 15-30 minutes
- Phase 5 (Testing): 60-90 minutes

**Total: 3-4.5 hours**

## Success Criteria

1. All biography and description fields support Foundry VTT text enrichment
2. Links to actors, items, and journal entries work correctly
3. Inline rolls are clickable and functional
4. Edit mode continues to work with TinyMCE editor
5. Read-only mode shows properly enriched content
6. No errors in console
7. No performance degradation
8. Backward compatible with existing content
