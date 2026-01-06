import { ClassicLevel } from 'classic-level';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const packTypes = ['powers', 'advantages', 'drawbacks', 'bonuses', 'limitations'];

async function stripDescriptions(packType) {
  const packPath = path.join(rootDir, 'packs', packType);

  console.log(`\nProcessing ${packType}...`);
  console.log(`  Path: ${packPath}`);

  const db = new ClassicLevel(packPath, { valueEncoding: 'json' });

  try {
    await db.open();

    let count = 0;
    const updates = [];

    // Read all items
    for await (const [key, value] of db.iterator()) {
      const item = value;

      // Strip description if it exists
      if (item.system && item.system.description !== undefined) {
        item.system.description = '';
        updates.push({ key, value: item });
        count++;
      }
    }

    // Write updates back
    for (const { key, value } of updates) {
      await db.put(key, value);
    }

    console.log(`  ✓ Stripped descriptions from ${count} items`);

  } catch (error) {
    console.error(`  ✗ Error processing ${packType}:`, error.message);
    throw error;
  } finally {
    await db.close();
  }
}

async function stripAll() {
  console.log('===========================================');
  console.log('Stripping descriptions from compendium items...');
  console.log('===========================================');

  for (const packType of packTypes) {
    try {
      await stripDescriptions(packType);
    } catch (error) {
      console.error(`Failed to process ${packType}:`, error);
      process.exit(1);
    }
  }

  console.log('\n===========================================');
  console.log('All descriptions stripped successfully!');
  console.log('===========================================');
}

stripAll().catch(console.error);
