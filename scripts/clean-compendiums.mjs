import { ClassicLevel } from 'classic-level';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const packTypes = ['powers', 'advantages', 'drawbacks', 'bonuses', 'limitations'];

// Items to remove by name
const ITEMS_TO_REMOVE = [
  'Yellow Impurity',
  'Powers',
  'Advantages',
  'Drawbacks',
  'Bonuses',
  'Limitations'
];

async function cleanPack(packType) {
  const packPath = path.join(rootDir, 'packs', packType);

  console.log(`\nCleaning ${packType}...`);
  console.log(`  Path: ${packPath}`);

  const db = new ClassicLevel(packPath, { valueEncoding: 'json' });

  try {
    await db.open();

    const itemsToDelete = [];
    const seenItems = new Map(); // Track items by name to find duplicates

    // Read all items
    for await (const [key, value] of db.iterator()) {
      const item = value;

      // Mark folder items for deletion
      if (ITEMS_TO_REMOVE.includes(item.name)) {
        console.log(`  - Removing: "${item.name}"`);
        itemsToDelete.push(key);
        continue;
      }

      // Check for duplicates
      if (seenItems.has(item.name)) {
        console.log(`  - Removing duplicate: "${item.name}" (${key})`);
        itemsToDelete.push(key);
      } else {
        seenItems.set(item.name, key);
      }
    }

    // Delete marked items
    for (const key of itemsToDelete) {
      await db.del(key);
    }

    console.log(`  ✓ Removed ${itemsToDelete.length} items (duplicates and unwanted)`);
    console.log(`  ✓ Remaining: ${seenItems.size} unique items`);

  } catch (error) {
    console.error(`  ✗ Error cleaning ${packType}:`, error.message);
    throw error;
  } finally {
    await db.close();
  }
}

async function cleanAll() {
  console.log('===========================================');
  console.log('Cleaning compendium packs...');
  console.log('===========================================');

  for (const packType of packTypes) {
    try {
      await cleanPack(packType);
    } catch (error) {
      console.error(`Failed to clean ${packType}:`, error);
      process.exit(1);
    }
  }

  console.log('\n===========================================');
  console.log('All packs cleaned successfully!');
  console.log('===========================================');
}

cleanAll().catch(console.error);
