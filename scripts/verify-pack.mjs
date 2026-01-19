import { ClassicLevel } from 'classic-level';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

async function verifyPack() {
  const packPath = path.join(rootDir, 'packs', 'powers');

  console.log(`Opening pack: ${packPath}\n`);

  const db = new ClassicLevel(packPath, { valueEncoding: 'json' });

  try {
    await db.open();

    let count = 0;
    console.log('First 5 entries:');
    console.log('================');

    for await (const [key, value] of db.iterator({ limit: 5 })) {
      console.log(`Key: ${key}`);
      console.log(`Value._id: ${value._id}`);
      console.log(`Value.name: ${value.name}`);
      console.log(`Value.type: ${value.type}`);
      console.log('---');
      count++;
    }

    // Count total
    let total = 0;
    for await (const [key] of db.iterator()) {
      total++;
    }

    console.log(`\nTotal items in database: ${total}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.close();
  }
}

verifyPack().catch(console.error);
