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
    const iconFiles = files.filter(f =>
      f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.svg') || f.endsWith('.webp')
    );
    return iconFiles;
  } catch (error) {
    return [];
  }
}

// Normalize a filename for comparison (handle spaces, URL encoding, hyphens, etc.)
function normalizeFilename(filename) {
  const decoded = decodeURIComponent(filename).toLowerCase();
  // Remove extension for comparison
  const withoutExt = decoded.replace(/\.(png|jpg|svg|webp)$/i, '');
  // Treat spaces and hyphens as equivalent
  return withoutExt.replace(/[-\s]+/g, '-');
}

// Get file extension
function getExtension(filename) {
  return path.extname(filename).toLowerCase();
}

// Score a file (higher is better)
function scoreFile(filename) {
  let score = 0;

  // Prefer .png over other formats
  const ext = getExtension(filename);
  if (ext === '.png') score += 100;
  else if (ext === '.svg') score += 50;
  else if (ext === '.jpg') score += 25;
  // .webp gets 0

  // Prefer hyphens over spaces
  if (!filename.includes(' ')) score += 10;

  return score;
}

// Find the best matching icon file
function findBestMatch(targetFilename, iconFiles) {
  const normalizedTarget = normalizeFilename(targetFilename);

  const matches = iconFiles.filter(f => normalizeFilename(f) === normalizedTarget);

  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];

  // Multiple matches - return the one with highest score
  return matches.sort((a, b) => scoreFile(b) - scoreFile(a))[0];
}

async function fixIconPaths(packType) {
  const packPath = path.join(rootDir, 'packs', packType);
  const db = new ClassicLevel(packPath, { valueEncoding: 'json' });

  const iconFiles = await getIconFiles(packType);
  const updates = [];

  try {
    await db.open();

    for await (const [key, value] of db.iterator()) {
      const item = value;

      if (!item.img) continue;

      const currentFilename = path.basename(item.img);
      const bestMatch = findBestMatch(currentFilename, iconFiles);

      if (!bestMatch) continue; // No matching icon file found

      const newPath = `systems/megs/assets/images/icons/${packType}/${bestMatch}`;

      // Update if path is different
      if (item.img !== newPath) {
        item.img = newPath;
        updates.push({ key, value: item, name: item.name, old: currentFilename, new: bestMatch });
      }
    }

    // Write updates
    for (const { key, value } of updates) {
      await db.put(key, value);
    }

  } catch (error) {
    console.error(`Error fixing ${packType}:`, error.message);
    throw error;
  } finally {
    await db.close();
  }

  return updates;
}

async function fixAll() {
  console.log('===========================================');
  console.log('Fixing Icon Paths...');
  console.log('===========================================\n');

  let totalFixed = 0;

  for (const packType of packTypes) {
    const updates = await fixIconPaths(packType);

    if (updates.length > 0) {
      console.log(`${packType.toUpperCase()}: Fixed ${updates.length} icon paths`);
      updates.forEach(({ name, old, new: newFile }) => {
        if (old !== newFile) {
          console.log(`  - ${name}: ${old} → ${newFile}`);
        }
      });
    } else {
      console.log(`${packType.toUpperCase()}: No changes needed`);
    }

    totalFixed += updates.length;
  }

  console.log('\n===========================================');
  console.log(`Total icon paths fixed: ${totalFixed}`);
  console.log('===========================================');
}

fixAll().catch(console.error);
