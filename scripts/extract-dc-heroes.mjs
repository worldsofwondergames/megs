import { ClassicLevel } from 'classic-level';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function extractPack() {
  const packPath = 'C:\\Users\\jeff_\\AppData\\Local\\FoundryVTT\\Data\\modules\\dc-heroes-3rd-edition-content\\packs\\dch3e-items';
  const outputPath = path.join(__dirname, '..', 'temp', 'dch3e-items-extracted');

  console.log(`Opening LevelDB pack: ${packPath}`);
  console.log(`Output directory: ${outputPath}`);

  // Create output directory
  await fs.mkdir(outputPath, { recursive: true });

  // Open the LevelDB database in read-only mode
  const db = new ClassicLevel(packPath, {
    valueEncoding: 'json',
    readOnly: true
  });

  try {
    // Wait for database to fully open
    await db.open();
    console.log('Database opened successfully\n');

    let count = 0;
    console.log('Extracting items...');

    // Iterate through all entries
    const iterator = db.iterator();
    for await (const [key, value] of iterator) {
      const item = value;
      const filename = `${item.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}_${item._id}.json`;
      const filepath = path.join(outputPath, filename);

      await fs.writeFile(filepath, JSON.stringify(item, null, 2), 'utf-8');
      console.log(`  ✓ ${item.name} (${item.type})`);
      count++;
    }

    console.log(`\nExtracted ${count} items successfully!`);
  } catch (error) {
    console.error('Error extracting pack:', error);
    throw error;
  } finally {
    await db.close();
  }
}

extractPack().catch(console.error);
