import { ClassicLevel } from 'classic-level';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const packTypes = ['powers', 'advantages', 'drawbacks', 'bonuses', 'limitations'];

async function extractPack(packType) {
  const packPath = path.join(rootDir, 'packs', packType);
  const destPath = path.join(rootDir, 'packs-src', packType);

  console.log(`\nExtracting ${packType}...`);
  console.log(`  Pack: ${packPath}`);
  console.log(`  Destination: ${destPath}`);

  // Ensure destination directory exists
  await fs.mkdir(destPath, { recursive: true });

  // Open the LevelDB database
  const db = new ClassicLevel(packPath, { valueEncoding: 'json' });

  try {
    await db.open();

    let count = 0;

    // Iterate through all entries
    const iterator = db.iterator();
    for await (const [key, value] of iterator) {
      const item = value;
      const filename = `${item.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}_${item._id}.json`;
      const filepath = path.join(destPath, filename);

      await fs.writeFile(filepath, JSON.stringify(item, null, 2), 'utf-8');
      count++;
    }

    console.log(`  ✓ Extracted ${count} items successfully`);
  } catch (error) {
    console.error(`  ✗ Error extracting ${packType}:`, error.message);
    throw error;
  } finally {
    await db.close();
  }
}

async function extractAll() {
  console.log('===========================================');
  console.log('Extracting MEGS compendium packs...');
  console.log('===========================================');

  for (const packType of packTypes) {
    try {
      await extractPack(packType);
    } catch (error) {
      console.error(`Failed to extract ${packType}:`, error);
    }
  }

  console.log('\n===========================================');
  console.log('All compendiums extracted!');
  console.log('===========================================');
}

extractAll().catch(console.error);
