import { ClassicLevel } from 'classic-level';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const packTypes = ['powers', 'advantages', 'drawbacks', 'bonuses', 'limitations'];

async function buildPack(packType) {
  const srcPath = path.join(rootDir, 'packs-src', packType);
  const destPath = path.join(rootDir, 'packs', packType);

  console.log(`\nBuilding ${packType}...`);
  console.log(`  Source: ${srcPath}`);
  console.log(`  Destination: ${destPath}`);

  // Clear and recreate destination directory to avoid stale data
  try {
    await fs.rm(destPath, { recursive: true, force: true });
  } catch (e) {
    // Directory might not exist, that's fine
  }
  await fs.mkdir(destPath, { recursive: true });

  // Open/create the LevelDB database
  // Foundry v10+ expects string values, not JSON-encoded objects
  const db = new ClassicLevel(destPath, { valueEncoding: 'utf8' });

  try {
    await db.open();

    // Read all JSON files from source directory
    const files = await fs.readdir(srcPath);
    let count = 0;

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(srcPath, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const item = JSON.parse(content);

        // Foundry v10+ expects keys in format: !items!<id>
        const key = `!items!${item._id}`;
        // Store value as JSON string
        await db.put(key, JSON.stringify(item));
        count++;
      }
    }

    console.log(`  ✓ Compiled ${count} items successfully`);
  } catch (error) {
    console.error(`  ✗ Error compiling ${packType}:`, error.message);
    throw error;
  } finally {
    await db.close();
  }
}

async function buildAll() {
  console.log('===========================================');
  console.log('Building MEGS compendium packs...');
  console.log('===========================================');

  for (const packType of packTypes) {
    try {
      await buildPack(packType);
    } catch (error) {
      console.error(`Failed to build ${packType}:`, error);
      process.exit(1);
    }
  }

  console.log('\n===========================================');
  console.log('All compendiums built successfully!');
  console.log('===========================================');
}

buildAll().catch(console.error);
