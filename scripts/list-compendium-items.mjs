import { ClassicLevel } from 'classic-level';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const packType = process.argv[2] || 'limitations';
const packPath = path.join(rootDir, 'packs', packType);

async function listItems() {
  console.log(`\nItems in ${packType}:`);
  console.log('='.repeat(50));

  const db = new ClassicLevel(packPath, { valueEncoding: 'json', readOnly: true });

  try {
    await db.open();

    const items = [];
    for await (const [key, value] of db.iterator()) {
      items.push({ name: value.name, id: value._id, type: value.type });
    }

    // Sort by name
    items.sort((a, b) => a.name.localeCompare(b.name));

    items.forEach((item, idx) => {
      console.log(`${idx + 1}. ${item.name} (${item.type})`);
    });

    console.log(`\nTotal: ${items.length} items`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await db.close();
  }
}

listItems().catch(console.error);
