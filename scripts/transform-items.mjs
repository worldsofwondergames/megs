import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Read all extracted items
async function readExtractedItems() {
  const extractDir = path.join(rootDir, 'temp', 'dch3e-items-extracted');
  const files = await fs.readdir(extractDir);
  const items = [];

  for (const file of files) {
    if (file.endsWith('.json')) {
      const content = await fs.readFile(path.join(extractDir, file), 'utf-8');
      items.push(JSON.parse(content));
    }
  }

  return items;
}

// Update icon path from module path to system path
function updateIconPath(originalPath, type) {
  if (!originalPath) return `systems/megs/assets/images/icons/${type}/default.png`;

  // Extract filename from path
  const filename = path.basename(originalPath);

  // Handle Foundry core icons
  if (originalPath.startsWith('icons/svg/')) {
    return originalPath; // Keep Foundry core icons as-is
  }

  return `systems/megs/assets/images/icons/${type}/${filename}`;
}

// Transform attributes object
function transformAttributes(attrs) {
  const template = {
    dex: { value: 0, factorCost: 7, label: 'Dexterity', type: 'physical', rolls: ['action', 'opposing'], alwaysSubstitute: false, isAttribute: true },
    str: { value: 0, factorCost: 6, label: 'Strength', type: 'physical', rolls: ['effect'], alwaysSubstitute: false, isAttribute: true },
    body: { value: 0, factorCost: 6, label: 'Body', type: 'physical', rolls: ['resistance'], alwaysSubstitute: false, isAttribute: true },
    int: { value: 0, factorCost: 7, label: 'Intelligence', type: 'mental', rolls: ['action', 'opposing'], alwaysSubstitute: false, isAttribute: true },
    will: { value: 0, factorCost: 6, label: 'Will', type: 'mental', rolls: ['effect'], alwaysSubstitute: false, isAttribute: true },
    mind: { value: 0, factorCost: 6, label: 'Mind', type: 'mental', rolls: ['resistance'], alwaysSubstitute: false, isAttribute: true },
    infl: { value: 0, factorCost: 7, label: 'Influence', type: 'mystical', rolls: ['action', 'opposing'], alwaysSubstitute: false, isAttribute: true },
    aura: { value: 0, factorCost: 6, label: 'Aura', type: 'mystical', rolls: ['effect'], alwaysSubstitute: false, isAttribute: true },
    spirit: { value: 0, factorCost: 6, label: 'Spirit', type: 'mystical', rolls: ['resistance'], alwaysSubstitute: false, isAttribute: true }
  };

  // Merge DC Heroes attributes with MEGS template
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (template[key] && value) {
        if (value.value !== undefined) template[key].value = value.value;
        if (value.alwaysSubstitute !== undefined) template[key].alwaysSubstitute = value.alwaysSubstitute;
      }
    }
  }

  return template;
}

// Transform power to MEGS structure
function transformPower(dcItem) {
  return {
    _id: dcItem._id,
    name: dcItem.name,
    type: 'power',
    img: updateIconPath(dcItem.img, 'powers'),
    system: {
      name: dcItem.name,
      description: '', // Strip per requirements
      attributes: transformAttributes(dcItem.system?.attributes),
      link: dcItem.system?.link || '',
      isLinked: dcItem.system?.isLinked || false,
      range: dcItem.system?.range || '',
      rangeAPs: dcItem.system?.rangeAPs || 0,
      formula: dcItem.system?.formula || '1d10 + 1d10',
      baseCost: dcItem.system?.baseCost || 0,
      totalCost: dcItem.system?.totalCost || 0,
      factorCost: dcItem.system?.factorCost || 0,
      aps: dcItem.system?.aps || 0,
      source: dcItem.system?.source || '',
      activateFree: dcItem.system?.activateFree || false,
      bonuses: [],
      customBonuses: [],
      limitations: [],
      customLimitations: [],
      parent: ''
    },
    effects: [],
    flags: {},
    ownership: { default: 0 },
    sort: 0,
    _stats: {
      compendiumSource: null,
      duplicateSource: null,
      exportSource: null,
      coreVersion: '13.346',
      systemId: 'megs',
      systemVersion: '1.0.0',
      createdTime: Date.now(),
      modifiedTime: Date.now(),
      lastModifiedBy: 'megs-system'
    }
  };
}

// Transform advantage to MEGS structure
function transformAdvantage(dcItem) {
  return {
    _id: dcItem._id,
    name: dcItem.name,
    type: 'advantage',
    img: updateIconPath(dcItem.img, 'advantages'),
    system: {
      name: dcItem.name,
      description: '', // Strip per requirements
      baseCost: dcItem.system?.baseCost || 0,
      totalCost: dcItem.system?.totalCost || 0,
      text: dcItem.system?.text || '',
      hasSubtext: dcItem.system?.hasSubtext !== false,
      parent: '',
      originalId: ''
    },
    effects: [],
    flags: {},
    ownership: { default: 0 },
    sort: 0,
    _stats: {
      compendiumSource: null,
      duplicateSource: null,
      exportSource: null,
      coreVersion: '13.346',
      systemId: 'megs',
      systemVersion: '1.0.0',
      createdTime: Date.now(),
      modifiedTime: Date.now(),
      lastModifiedBy: 'megs-system'
    }
  };
}

// Transform drawback to MEGS structure
function transformDrawback(dcItem) {
  return {
    _id: dcItem._id,
    name: dcItem.name,
    type: 'drawback',
    img: updateIconPath(dcItem.img, 'drawbacks'),
    system: {
      name: dcItem.name,
      description: '', // Strip per requirements
      baseCost: dcItem.system?.baseCost || 0,
      totalCost: dcItem.system?.totalCost || 0,
      text: dcItem.system?.text || '',
      hasSubtext: dcItem.system?.hasSubtext !== false,
      parent: '',
      originalId: ''
    },
    effects: [],
    flags: {},
    ownership: { default: 0 },
    sort: 0,
    _stats: {
      compendiumSource: null,
      duplicateSource: null,
      exportSource: null,
      coreVersion: '13.346',
      systemId: 'megs',
      systemVersion: '1.0.0',
      createdTime: Date.now(),
      modifiedTime: Date.now(),
      lastModifiedBy: 'megs-system'
    }
  };
}

// Transform bonus to MEGS structure
function transformBonus(dcItem) {
  return {
    _id: dcItem._id,
    name: dcItem.name,
    type: 'bonus',
    img: updateIconPath(dcItem.img, 'bonuses'),
    system: {
      name: dcItem.name,
      description: '', // Strip per requirements
      factorCostMod: dcItem.system?.factorCostMod || 0,
      text: dcItem.system?.text || '',
      hasSubtext: dcItem.system?.hasSubtext !== false,
      parent: '',
      originalId: ''
    },
    effects: [],
    flags: {},
    ownership: { default: 0 },
    sort: 0,
    _stats: {
      compendiumSource: null,
      duplicateSource: null,
      exportSource: null,
      coreVersion: '13.346',
      systemId: 'megs',
      systemVersion: '1.0.0',
      createdTime: Date.now(),
      modifiedTime: Date.now(),
      lastModifiedBy: 'megs-system'
    }
  };
}

// Transform limitation to MEGS structure
function transformLimitation(dcItem) {
  return {
    _id: dcItem._id,
    name: dcItem.name,
    type: 'limitation',
    img: updateIconPath(dcItem.img, 'limitations'),
    system: {
      name: dcItem.name,
      description: '', // Strip per requirements
      factorCostMod: dcItem.system?.factorCostMod || 0,
      text: dcItem.system?.text || '',
      hasSubtext: dcItem.system?.hasSubtext !== false,
      parent: '',
      originalId: ''
    },
    effects: [],
    flags: {},
    ownership: { default: 0 },
    sort: 0,
    _stats: {
      compendiumSource: null,
      duplicateSource: null,
      exportSource: null,
      coreVersion: '13.346',
      systemId: 'megs',
      systemVersion: '1.0.0',
      createdTime: Date.now(),
      modifiedTime: Date.now(),
      lastModifiedBy: 'megs-system'
    }
  };
}

// Main transformation function
async function transformAll() {
  console.log('Reading extracted items...');
  const items = await readExtractedItems();
  console.log(`Found ${items.length} items\n`);

  const categorized = {
    powers: [],
    advantages: [],
    drawbacks: [],
    bonuses: [],
    limitations: []
  };

  let skipped = 0;

  // Categorize and transform items
  for (const item of items) {
    try {
      switch (item.type) {
        case 'power':
          categorized.powers.push(transformPower(item));
          break;
        case 'advantage':
          categorized.advantages.push(transformAdvantage(item));
          break;
        case 'drawback':
          categorized.drawbacks.push(transformDrawback(item));
          break;
        case 'bonus':
          categorized.bonuses.push(transformBonus(item));
          break;
        case 'limitation':
          categorized.limitations.push(transformLimitation(item));
          break;
        default:
          // Skip skills, subskills, gadgets, folders, etc.
          skipped++;
      }
    } catch (error) {
      console.error(`Error transforming item ${item.name}:`, error.message);
    }
  }

  console.log(`Skipped ${skipped} items (skills, subskills, gadgets, folders, etc.)\n`);

  // Write transformed items to packs-src
  for (const [type, items] of Object.entries(categorized)) {
    const destDir = path.join(rootDir, 'packs-src', type);
    await fs.mkdir(destDir, { recursive: true });

    console.log(`Writing ${items.length} ${type}...`);
    for (const item of items) {
      const filename = `${item.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}_${item._id}.json`;
      const destPath = path.join(destDir, filename);
      await fs.writeFile(destPath, JSON.stringify(item, null, 2), 'utf-8');
      console.log(`  ✓ ${item.name}`);
    }
  }

  console.log('\n===========================================');
  console.log('Transformation complete!');
  console.log('===========================================');
  console.log(`Powers: ${categorized.powers.length}`);
  console.log(`Advantages: ${categorized.advantages.length}`);
  console.log(`Drawbacks: ${categorized.drawbacks.length}`);
  console.log(`Bonuses: ${categorized.bonuses.length}`);
  console.log(`Limitations: ${categorized.limitations.length}`);
  console.log(`Total: ${Object.values(categorized).reduce((sum, arr) => sum + arr.length, 0)}`);
}

transformAll().catch(console.error);
