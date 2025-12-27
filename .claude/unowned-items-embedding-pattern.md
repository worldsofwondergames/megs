# Unowned Items Embedding Pattern in MEGS

## Overview

This document explains the pattern for allowing standalone (unowned) items in Foundry VTT to have embedded child items, using the MEGS gadget implementation as a reference. This pattern is necessary because:

1. **Foundry Limitation**: When items are not owned by an actor, their embedded items collection is not automatically persisted
2. **Use Case**: Standalone gadgets in the sidebar need to "remember" their powers, skills, and traits
3. **Transfer Requirement**: When dragging these items to/from actors, child items must be preserved

## The Problem

Normally in Foundry VTT:
- Actors can own items with embedded child items (e.g., an actor owns a power with bonuses/limitations)
- When an item is standalone (in the Items sidebar), its `items` collection is NOT persisted by default
- Dragging an item from the sidebar to an actor, or vice versa, loses the embedded child items

## The Solution Pattern

The solution involves **three main components**:

### 1. Data Serialization (Flatten to System Fields)
### 2. Transfer via Global Cache
### 3. Restoration on Creation

---

## Part 1: Data Serialization

### Store Child Item Data as Flattened System Fields

Instead of relying on Foundry's `items` collection for standalone items, we store child item data as regular system fields that get persisted with the item document.

**Location**: `module/documents/item.mjs` - `prepareData()` method

**Pattern for Powers**:
```javascript
// Create flattened data structures keyed by item name
const powerAPs = {};
const powerBaseCosts = {};
const powerFactorCosts = {};
const powerRanges = {};
const powerIsLinked = {};
const powerLinks = {};

// Iterate through embedded items and extract key fields
for (const item of this.items) {
    if (item.type === 'power') {
        const name = item.name;
        powerAPs[name] = item.system.aps || 0;
        powerBaseCosts[name] = item.system.baseCost || 0;
        powerFactorCosts[name] = item.system.factorCost || 0;
        powerRanges[name] = item.system.range || '';
        powerIsLinked[name] = item.system.isLinked || false;
        powerLinks[name] = item.system.link || '';
    }
}

// Store in system data
this.system.powerAPs = powerAPs;
this.system.powerBaseCosts = powerBaseCosts;
// ... etc
```

**Pattern for Traits (Complex Objects)**:
```javascript
const traitData = {};

for (const item of this.items) {
    if (item.type === 'advantage' || item.type === 'drawback') {
        // Store complete item data with unique key
        const key = `${item.name}-${item.type}-${item._id}`;
        traitData[key] = {
            name: item.name,
            type: item.type,
            img: item.img,
            system: {
                baseCost: item.system.baseCost || 0,
                text: item.system.text || ''
            }
        };
    }
}

this.system.traitData = traitData;
```

**Why This Works**:
- System fields are automatically persisted by Foundry
- Flattened data survives item drag/drop operations
- Can be used for cost calculations without needing embedded items

---

## Part 2: Transfer via Global Cache

When an item is dragged between the sidebar and an actor, we use a global cache to preserve the flattened data.

**Location**: `module/documents/item.mjs` and `module/megs.mjs`

### Step A: Hook into preCreate

```javascript
// In megs.mjs
Hooks.on('preCreateItem', (document, data, options, userId) => {
    // Check if this is a gadget being created
    if (data.type === 'gadget') {
        // Look for transfer data in global cache
        const transferData = globalThis.MEGSGadgetTransferCache?.[data.name];

        if (transferData) {
            // Store transfer data in options for later retrieval
            options.MEGSTransferData = transferData;

            // Clean up cache
            delete globalThis.MEGSGadgetTransferCache[data.name];
        }
    }
});
```

### Step B: Serialize to Cache on toObject()

```javascript
// In item.mjs - toObject() method
toObject(source = true) {
    const data = super.toObject(source);

    if (this.type === 'gadget') {
        // Initialize global cache if needed
        if (!globalThis.MEGSGadgetTransferCache) {
            globalThis.MEGSGadgetTransferCache = {};
        }

        // Store transfer data keyed by item name
        globalThis.MEGSGadgetTransferCache[this.name] = {
            powerAPs: this.system.powerAPs || {},
            powerBaseCosts: this.system.powerBaseCosts || {},
            // ... all other flattened fields
            traitData: this.system.traitData || {}
        };

        // ALSO copy to data.system for immediate use
        data.system.powerAPs = this.system.powerAPs || {};
        data.system.powerBaseCosts = this.system.powerBaseCosts || {};
        // ... etc
    }

    return data;
}
```

### Step C: Restore from Cache in _onCreate

```javascript
// In item.mjs - _onCreate() method
_onCreate(data, options, userId) {
    super._onCreate(data, options, userId);

    if (this.type === 'gadget' && options.MEGSTransferData) {
        const transferData = options.MEGSTransferData;

        // Restore all flattened data fields
        this.system.powerAPs = transferData.powerAPs || {};
        this.system.powerBaseCosts = transferData.powerBaseCosts || {};
        // ... etc
        this.system.traitData = transferData.traitData || {};
    }
}
```

**Why This Works**:
- `toObject()` is called when dragging items
- Global cache survives between toObject() and _onCreate()
- Options parameter passes data through Foundry's creation pipeline
- Cache is cleaned up after use

---

## Part 3: UI Integration

### Drop Handlers for Standalone Items

**Location**: `module/sheets/item-sheet.mjs` - `_onDropItem()` method

```javascript
async _onDropItem(event, data) {
    const item = await Item.implementation.fromDropData(data);
    const itemData = item.toObject();

    // Handle standalone gadgets
    if (!this.object.parent && this.object.type === 'gadget') {
        if (itemData.type === 'power') {
            return this._onDropPowerToStandaloneGadget(itemData);
        }
        if (itemData.type === 'advantage' || itemData.type === 'drawback') {
            return this._onDropTraitToStandaloneGadget(itemData);
        }
        return false; // Prevent other drops
    }

    // ... existing code for owned items
}
```

### Handler: Add Power to Standalone Gadget

```javascript
async _onDropPowerToStandaloneGadget(itemData) {
    // Get existing flattened data
    const powerAPs = foundry.utils.duplicate(this.object.system.powerAPs || {});
    const powerBaseCosts = foundry.utils.duplicate(this.object.system.powerBaseCosts || {});
    // ... etc

    // Add new power data using power name as key
    const powerName = itemData.name;
    powerAPs[powerName] = itemData.system.aps || 0;
    powerBaseCosts[powerName] = itemData.system.baseCost || 0;
    // ... etc

    // Update the gadget document
    await this.object.update({
        'system.powerAPs': powerAPs,
        'system.powerBaseCosts': powerBaseCosts,
        // ... etc
    });

    this.render(false);
}
```

### Handler: Add Trait to Standalone Gadget

```javascript
async _onDropTraitToStandaloneGadget(itemData) {
    const traitData = foundry.utils.duplicate(this.object.system.traitData || {});

    // Create unique key with timestamp
    const key = `${itemData.name}-${itemData.type}-${Date.now()}`;

    // Store complete trait object
    traitData[key] = {
        name: itemData.name,
        type: itemData.type,
        img: itemData.img,
        system: {
            baseCost: itemData.system.baseCost || 0,
            text: itemData.system.text || ''
        }
    };

    await this.object.update({
        'system.traitData': traitData
    });

    this.render(false);
}
```

---

## Part 4: Template Display

### Show Child Items in Template

**Location**: Templates (e.g., `templates/item/item-gadget-sheet.hbs`)

Templates need to display the flattened data as if it were embedded items:

```handlebars
{{!-- Powers Section --}}
<div class="powers">
    {{#each system.powerAPs as |aps name|}}
        <div class="power-item">
            <span class="power-name">{{name}}</span>
            <span class="power-aps">{{aps}} APs</span>
            <span class="power-cost">
                Base: {{lookup ../system.powerBaseCosts name}}
                Factor: {{lookup ../system.powerFactorCosts name}}
            </span>
        </div>
    {{/each}}
</div>

{{!-- Traits Section --}}
<div class="traits">
    {{#each system.traitData as |trait key|}}
        <div class="trait-item">
            <img src="{{trait.img}}" />
            <span>{{trait.name}}</span>
            <span>{{trait.type}}</span>
            <span>Cost: {{trait.system.baseCost}}</span>
        </div>
    {{/each}}
</div>
```

---

## Part 5: Embedded Items API for Standalone Items

### Enable Creating Embedded Items

For bonuses/limitations on standalone powers/skills, we can use Foundry's built-in embedded documents API.

**Location**: `module/sheets/item-sheet.mjs`

```javascript
async _onDropModifierToStandaloneItem(itemData) {
    // Set parent reference
    itemData.system.parent = this.object._id;

    // Use Foundry's API to create embedded item
    const createdItems = await this.object.createEmbeddedDocuments('Item', [itemData]);

    this.render(false);
    return createdItems[0];
}
```

**Key Difference**:
- For simple modifiers (bonus/limitation), use embedded documents API
- For complex items that need to appear in UI when standalone, use flattened data pattern
- Choice depends on whether the child items need to survive drag operations

---

## Summary: When to Use Each Approach

### Use Embedded Documents API When:
- Child items are on items owned by actors
- Full item sheets need to be opened and edited
- Example: Bonuses/Limitations on Powers/Skills that belong to actors

### Use Flattened Data Pattern When:
- Standalone items (not owned by actors) need child items
- Child items need to display in item sidebar
- Need to calculate costs involving child items
- Child items must survive drag to/from actors
- Example: Powers/Skills/Traits on Gadgets, Modifiers on standalone Powers/Skills

---

## Checklist for Implementing Unowned Item Embedding

### 1. Data Model (template.json)
- [ ] Add flattened data fields to item type (e.g., `powerAPs`, `traitData`)

### 2. Item Document (module/documents/item.mjs)
- [ ] In `prepareData()`: Serialize embedded items to flattened fields
- [ ] In `toObject()`: Copy flattened data to both global cache and returned data object
- [ ] In `_onCreate()`: Restore from options.MEGSTransferData if present

### 3. Hook Setup (module/megs.mjs)
- [ ] Add `preCreateItem` hook to transfer cache data via options

### 4. Sheet (module/sheets/item-sheet.mjs)
- [ ] Update `_onDrop()` to detect standalone item type
- [ ] Add `_onDropChildToStandaloneItem()` handler method
- [ ] Update flattened data fields in handler

### 5. Templates
- [ ] Display flattened data in template using `{{#each}}`
- [ ] Add create/delete controls if needed

### 6. Data Preparation (module/sheets/item-sheet.mjs)
- [ ] In `getData()`: Prepare child item data from flattened fields for template context
- [ ] In `_prepareModifiers()` or similar: Check both `parent.items` AND `item.items`

---

## Common Pitfalls

1. **Forgetting to duplicate flattened objects**: Always use `foundry.utils.duplicate()` before modifying
2. **Not cleaning up cache**: Remove items from global cache after use
3. **Unique keys for traits**: Use timestamp or ID to prevent overwrites
4. **Template iteration**: Remember to use `lookup` helper for nested data
5. **Both paths**: Always check both `parent.items` and `item.items` when looking for child items

---

## Example Files Reference

- **Data Serialization**: `module/documents/item.mjs` lines 28-110
- **Transfer Cache**: `module/documents/item.mjs` lines 115-148, `module/megs.mjs` lines 160-231
- **Drop Handlers**: `module/sheets/item-sheet.mjs` lines 1163-1253
- **Template Display**: `templates/item/item-gadget-sheet.hbs`
- **Data Preparation**: `module/sheets/item-sheet.mjs` lines 613-667 (`_prepareModifiers`)

---

## Historical Reference - Evolution of This Pattern

This pattern was developed through issue #176 and PR #183 for retaining gadget powers and skills.

### Key Commits (in chronological order):

1. **7d9bba9** - Initial attempt: Preserve gadget powers and skills when dragging to Items sidebar
2. **4289bc8** - Fix gadget data preservation when dragging to sidebar
3. **1972d24** - Persist powerData and skillData to database for standalone gadgets
4. **47e827b** - Expand _preCreate logging for all gadgets
5. **b245107** - Use updateSource to force powerData persistence
6. **2e39d53** - Change powerData and traitData from objects to arrays
7. **9d81b52** - Use flags for complex powerData/traitData storage
8. **2a549c5** - Store only essential power fields, not entire system object
9. **6d5e4f5** - Serialize gadget powers and skills to retain when dragging to sidebar
10. **7fd975b** - Update gadget item sheet to display virtual powers from flattened fields
11. **34ef659** - Fix toObject to preserve virtual data when dragging standalone gadgets
12. **36a5162** - Use flags to transfer virtual data when dragging standalone gadgets to actors
13. **a4298c2** - Wrap gadget serialization debug logs behind MEGS.debug.enabled flag
14. **a3ffd4d** - Merge PR #183

### Lessons Learned from Evolution:

1. **First Attempts**: Tried to persist embedded items directly - didn't work for standalone items
2. **Arrays vs Objects**: Initially used arrays, switched to objects keyed by name for easier lookup
3. **Flags vs System Fields**: Tried using Foundry flags, but system fields proved more reliable
4. **Minimal Data**: Store only essential fields to reduce data size and complexity
5. **Virtual Display**: Template displays "virtual" items from flattened data
6. **Global Cache**: Essential for transferring data during drag operations

### Related Issues:

- **#176**: When gadgets are dragged from a character to the right dock area, retain powers and skills
- **#183**: Pull request implementing the solution
- **#44**: Skills can have modifiers as well (implemented modifiers for standalone powers/skills)

---

## Case Study: Powers and Skills with Modifiers

This case study demonstrates implementing the flattened data pattern for a simpler use case than gadgets.

### Initial Approach (Failed)

**Attempt**: Use Foundry's embedded documents API
```javascript
async _onDropModifierToStandaloneItem(itemData) {
    itemData.system.parent = this.object._id;
    const createdItems = await this.object.createEmbeddedDocuments('Item', [itemData]);
}
```

**Result**: `Error: Item is not a valid embedded Document within the Item Document`

**Lesson**: Foundry does NOT support embedded Items on standalone Items (items without a parent actor).

### Solution: Flattened Arrays (Simplified Pattern)

Unlike gadgets which needed multiple flattened fields for different attributes, powers and skills already had a simpler structure in their template:

```javascript
"hasModifiers": {
    "bonuses": [],           // Already exists!
    "customBonuses": [],
    "limitations": [],       // Already exists!
    "customLimitations": []
}
```

### Implementation Steps

#### 1. Drop Handler - Store in Arrays
```javascript
async _onDropModifierToStandaloneItem(itemData) {
    const isBonus = itemData.type === MEGS.itemTypes.bonus;
    const arrayKey = isBonus ? 'bonuses' : 'limitations';

    const modifiers = foundry.utils.duplicate(this.object.system[arrayKey] || []);

    modifiers.push({
        name: itemData.name,
        img: itemData.img,
        factorCostMod: itemData.system.factorCostMod || 0,
        text: itemData.system.text || ''
    });

    await this.object.update({
        [`system.${arrayKey}`]: modifiers
    });
}
```

#### 2. Data Preparation - Dual Source Reading

The `_prepareModifiers()` method needs to handle both:
- **Items on actors**: Read from embedded items collection
- **Standalone items**: Read from flattened arrays

```javascript
_prepareModifiers(context) {
    const bonuses = [];
    const limitations = [];

    if (this.object.parent && this.object.parent.items) {
        // For items on actors - use embedded items
        for (let i of this.object.parent.items) {
            if (i.system.parent === this.item._id) {
                if (i.type === MEGS.itemTypes.bonus) {
                    bonuses.push(i);  // Real item object
                }
            }
        }
    } else {
        // For standalone items - use flattened arrays
        const bonusArray = context.system.bonuses || [];

        bonusArray.forEach((bonus, index) => {
            bonuses.push({
                _id: `virtual-bonus-${index}`,  // Virtual ID for template
                name: bonus.name,
                img: bonus.img || Item.DEFAULT_ICON,
                system: {
                    factorCostMod: bonus.factorCostMod || 0,
                    text: bonus.text || ''
                }
            });
        });
    }

    context.bonuses = bonuses;
}
```

**Key Insight**: Create pseudo-item objects with virtual IDs for template compatibility.

#### 3. Virtual IDs for Template Display

Templates expect items with `_id` fields for `data-item-id` attributes:

```handlebars
{{#each bonuses as |item id|}}
    <li class='item flexrow' data-item-id='{{item._id}}'>
        {{item.name}}
    </li>
{{/each}}
```

**Solution**: Generate virtual IDs with index: `virtual-bonus-0`, `virtual-bonus-1`, etc.

This allows:
- Templates to work unchanged
- Delete handler to identify which array element to remove

#### 4. Delete Handler - Parse Virtual IDs

```javascript
html.on('click', '.item-delete', async (ev) => {
    const itemId = li.attr('data-item-id');

    const isStandalonePowerOrSkill = !this.object.parent &&
        (this.object.type === MEGS.itemTypes.power ||
         this.object.type === MEGS.itemTypes.skill);
    const isVirtualBonus = itemId.startsWith('virtual-bonus-');
    const isVirtualLimitation = itemId.startsWith('virtual-limitation-');

    if (isStandalonePowerOrSkill && (isVirtualBonus || isVirtualLimitation)) {
        const index = parseInt(itemId.split('-')[2]);  // Extract index
        const arrayKey = isVirtualBonus ? 'bonuses' : 'limitations';

        const modifiers = foundry.utils.duplicate(this.object.system[arrayKey] || []);
        modifiers.splice(index, 1);  // Remove by index

        await this.object.update({[`system.${arrayKey}`]: modifiers});
    } else if (this.object.parent) {
        // Real embedded item on actor
        const item = this.object.parent.items.get(itemId);
        await item.delete();
    }
});
```

#### 5. Conditional Edit Controls in Templates

Flattened array items can't be "opened" for editing (they're not real items). Hide edit icons for standalone items:

```handlebars
{{#each bonuses as |item id|}}
    <li class='item flexrow' data-item-id='{{item._id}}'>
        <div class='item-name'>
            {{#if ../hasActor}}
                <a class='item-edit' title='Edit'>{{item.name}}</a>
            {{else}}
                <span>{{item.name}}</span>
            {{/if}}
        </div>
        <div class='item-controls'>
            {{#if ../hasActor}}
                <a class='item-control item-edit'><i class='fas fa-edit'></i></a>
            {{/if}}
            {{#if ../flags.megs.edit-mode}}
                <a class='item-control item-delete'><i class='fas fa-trash'></i></a>
            {{/if}}
        </div>
    </li>
{{/each}}
```

### Comparison: Powers/Skills vs Gadgets

| Aspect | Gadgets | Powers/Skills Modifiers |
|--------|---------|------------------------|
| **Data Structure** | Multiple flattened fields per type | Single array per type |
| **Template Fields** | `powerAPs`, `powerBaseCosts`, etc. | `bonuses[]`, `limitations[]` |
| **Virtual IDs** | Based on name: `virtual-power-${name}` | Based on index: `virtual-bonus-${index}` |
| **Delete Method** | Delete by key using `.-=${key}` | Delete by index using `splice()` |
| **Complexity** | High (multiple fields to sync) | Low (one array per type) |

### Key Differences from Gadget Pattern

1. **No Transfer Cache Needed**: Arrays persist automatically in system data
2. **Simpler Serialization**: Don't need toObject/onCreate handling
3. **Index-based IDs**: Simpler than name-based keys
4. **Template Reuse**: Same template works for both owned and standalone

### Files Modified

- **module/sheets/item-sheet.mjs**:
  - Line 1261-1290: `_onDropModifierToStandaloneItem()` - stores in arrays
  - Line 644-674: `_prepareModifiers()` - reads from both sources
  - Line 407-419: Delete handler for virtual modifiers
- **templates/item/item-power-sheet.hbs**:
  - Line 225-237: Conditional edit controls for bonuses
  - Line 270-283: Conditional edit controls for limitations
- **templates/item/item-skill-sheet.hbs**:
  - Line 227-231: Conditional edit controls for bonuses
  - Line 271-275: Conditional edit controls for limitations

### Lessons Learned

1. **Check Foundry Limitations First**: Not all embedded document operations work on standalone items
2. **Leverage Existing Templates**: `hasModifiers` template already had the arrays we needed
3. **Dual-Mode Reading**: Support both embedded items and flattened arrays in the same method
4. **Virtual IDs**: Essential for template compatibility and delete operations
5. **Conditional UI**: Hide edit controls that don't make sense for flattened data
6. **Index-based is Simpler**: When order doesn't matter, index-based IDs are easier than name-based keys
