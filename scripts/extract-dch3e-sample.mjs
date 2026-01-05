import { ClassicLevel } from 'classic-level';
import fs from 'fs/promises';
import path from 'path';

const packPath = 'C:\\Users\\jeff_\\AppData\\Local\\FoundryVTT\\Data\\modules\\dc-heroes-3rd-edition-content\\packs\\dch3e-items';
const outputDir = 'C:\\Users\\jeff_\\OneDrive\\Gaming\\DC Heroes\\megs\\temp\\dch3e-compare';

async function extractSample() {
  console.log(`Extracting from: ${packPath}`);
  console.log(`Output to: ${outputDir}\n`);

  await fs.mkdir(outputDir, { recursive: true });

  const db = new ClassicLevel(packPath, {
    valueEncoding: 'json',
    readOnly: true
  });

  try {
    await db.open();

    let count = 0;
    // Extract only first 5 items as samples
    for await (const [key, value] of db.iterator({ limit: 5 })) {
      const item = value;
      const filename = `${item.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}_${item._id}.json`;
      const filepath = path.join(outputDir, filename);

      await fs.writeFile(filepath, JSON.stringify(item, null, 2), 'utf-8');
      console.log(`Extracted: ${filename}`);
      count++;
    }

    console.log(`\nExtracted ${count} sample items`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.close();
  }
}

extractSample().catch(console.error);
