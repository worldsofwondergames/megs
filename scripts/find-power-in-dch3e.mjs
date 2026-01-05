import { ClassicLevel } from 'classic-level';
import fs from 'fs/promises';
import path from 'path';

const packPath = 'C:\\Users\\jeff_\\AppData\\Local\\FoundryVTT\\Data\\modules\\dc-heroes-3rd-edition-content\\packs\\dch3e-items';
const outputDir = 'C:\\Users\\jeff_\\OneDrive\\Gaming\\DC Heroes\\megs\\temp\\dch3e-compare';

async function findPower() {
  await fs.mkdir(outputDir, { recursive: true });

  const db = new ClassicLevel(packPath, {
    valueEncoding: 'json',
    readOnly: true
  });

  try {
    await db.open();

    let count = 0;
    // Find first 5 power items
    for await (const [key, value] of db.iterator()) {
      const item = value;

      if (item.type === 'power' && count < 5) {
        const filename = `power-${item.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}_${item._id}.json`;
        const filepath = path.join(outputDir, filename);

        await fs.writeFile(filepath, JSON.stringify(item, null, 2), 'utf-8');
        console.log(`Found power: ${item.name} (${item._id})`);
        count++;
      }

      if (count >= 5) break;
    }

    console.log(`\nExtracted ${count} power items`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.close();
  }
}

findPower().catch(console.error);
