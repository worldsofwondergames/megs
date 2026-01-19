import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Generic icons for each item type
const GENERIC_ICONS = {
  power: 'systems/megs/assets/images/icons/power.png',
  advantage: 'icons/svg/item-bag.svg',
  drawback: 'icons/svg/item-bag.svg',
  bonus: 'icons/svg/item-bag.svg',
  limitation: 'icons/svg/item-bag.svg'
};

/**
 * Update icon path for an item based on its type
 */
function updateIcon(item) {
  const genericIcon = GENERIC_ICONS[item.type];
  if (genericIcon) {
    item.img = genericIcon;
  }
  return item;
}

/**
 * Process all files in a directory
 */
async function processDirectory(dirPath, itemType) {
  try {
    const files = await fs.readdir(dirPath);
    let updated = 0;

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const filePath = path.join(dirPath, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const item = JSON.parse(content);

      // Update icon to generic
      const oldIcon = item.img;
      updateIcon(item);

      if (oldIcon !== item.img) {
        // Write updated item back to file
        await fs.writeFile(filePath, JSON.stringify(item, null, 2), 'utf-8');
        updated++;
        console.log(`  ✓ ${item.name}: ${oldIcon} → ${item.img}`);
      }
    }

    return updated;
  } catch (error) {
    console.error(`Error processing ${dirPath}:`, error.message);
    return 0;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('===========================================');
  console.log('Removing specialized icons from compendiums');
  console.log('===========================================\n');

  const packsSrcDir = path.join(rootDir, 'packs-src');
  const itemTypes = ['powers', 'advantages', 'drawbacks', 'bonuses', 'limitations'];

  let totalUpdated = 0;

  for (const itemType of itemTypes) {
    const dirPath = path.join(packsSrcDir, itemType);
    console.log(`\nProcessing ${itemType}...`);

    try {
      const updated = await processDirectory(dirPath, itemType.slice(0, -1)); // Remove trailing 's'
      totalUpdated += updated;
      console.log(`Updated ${updated} items in ${itemType}`);
    } catch (error) {
      console.error(`Failed to process ${itemType}:`, error.message);
    }
  }

  console.log('\n===========================================');
  console.log(`Complete! Updated ${totalUpdated} total items`);
  console.log('===========================================');
}

main().catch(console.error);
