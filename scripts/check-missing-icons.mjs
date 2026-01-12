import { ClassicLevel } from 'classic-level';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const packTypes = ['powers', 'advantages', 'drawbacks', 'bonuses', 'limitations'];

async function getIconFiles(type) {
  const iconDir = path.join(rootDir, 'assets', 'images', 'icons', type);
  try {
    const files = await fs.readdir(iconDir);
    return new Set(files.filter(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.svg') || f.endsWith('.webp')));
  } catch (error) {
    return new Set();
  }
}

async function checkPack(packType) {
  const packPath = path.join(rootDir, 'packs', packType);
  const db = new ClassicLevel(packPath, { valueEncoding: 'json', readOnly: true });

  const missingIcons = [];

  try {
    await db.open();

    const iconFiles = await getIconFiles(packType);

    for await (const [key, value] of db.iterator()) {
      const item = value;

      // Extract icon filename from path
      if (item.img) {
        const iconFilename = path.basename(item.img);

        // Check if it's a default/placeholder icon or if the file doesn't exist
        if (item.img.includes('default.png') ||
            item.img.startsWith('icons/svg/') ||
            !iconFiles.has(iconFilename)) {
          missingIcons.push({
            name: item.name,
            currentIcon: item.img
          });
        }
      } else {
        missingIcons.push({
          name: item.name,
          currentIcon: 'NO ICON SET'
        });
      }
    }

  } catch (error) {
    console.error(`Error checking ${packType}:`, error.message);
  } finally {
    await db.close();
  }

  return missingIcons;
}

async function checkAll() {
  console.log('===========================================');
  console.log('Checking for Missing Icons...');
  console.log('===========================================\n');

  let totalMissing = 0;

  for (const packType of packTypes) {
    const missing = await checkPack(packType);

    if (missing.length > 0) {
      console.log(`\n${packType.toUpperCase()} (${missing.length} missing):`);
      console.log('='.repeat(50));
      missing.forEach(item => {
        console.log(`  - ${item.name}`);
        console.log(`    Current: ${item.currentIcon}`);
      });
      totalMissing += missing.length;
    } else {
      console.log(`\n${packType.toUpperCase()}: All items have icons ✓`);
    }
  }

  console.log('\n===========================================');
  console.log(`Total items missing icons: ${totalMissing}`);
  console.log('===========================================');
}

checkAll().catch(console.error);
