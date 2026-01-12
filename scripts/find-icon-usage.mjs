import { ClassicLevel } from 'classic-level';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const packTypes = ['powers', 'advantages', 'drawbacks', 'bonuses', 'limitations'];

async function findIconUsage(iconPattern) {
  const results = [];

  for (const packType of packTypes) {
    const packPath = path.join(rootDir, 'packs', packType);
    const db = new ClassicLevel(packPath, { valueEncoding: 'json', readOnly: true });

    try {
      await db.open();

      for await (const [key, value] of db.iterator()) {
        const item = value;
        if (item.img && item.img.includes(iconPattern)) {
          results.push({
            pack: packType,
            name: item.name,
            icon: item.img
          });
        }
      }
    } catch (error) {
      console.error(`Error checking ${packType}:`, error.message);
    } finally {
      await db.close();
    }
  }

  return results;
}

async function main() {
  const searchPattern = process.argv[2] || 'omni';

  console.log(`Searching for items using icon pattern: "${searchPattern}"\n`);

  const results = await findIconUsage(searchPattern);

  if (results.length === 0) {
    console.log('No items found using this icon pattern.');
  } else {
    console.log(`Found ${results.length} item(s):\n`);
    results.forEach(({ pack, name, icon }) => {
      console.log(`[${pack.toUpperCase()}] ${name}`);
      console.log(`  Icon: ${icon}\n`);
    });
  }
}

main().catch(console.error);
