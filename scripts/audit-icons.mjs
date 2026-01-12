import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const packTypes = ['powers', 'advantages', 'drawbacks', 'bonuses', 'limitations'];

async function auditIcons(type) {
  const iconDir = path.join(rootDir, 'assets', 'images', 'icons', type);

  try {
    const files = await fs.readdir(iconDir);
    const iconFiles = files.filter(f =>
      f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.svg') || f.endsWith('.webp')
    );

    const byExtension = {
      png: [],
      jpg: [],
      svg: [],
      webp: [],
      other: []
    };

    for (const file of iconFiles) {
      const ext = path.extname(file).toLowerCase().slice(1);
      if (byExtension[ext]) {
        byExtension[ext].push(file);
      } else {
        byExtension.other.push(file);
      }
    }

    return {
      total: iconFiles.length,
      byExtension,
      hasSpaces: iconFiles.filter(f => f.includes(' '))
    };
  } catch (error) {
    return {
      total: 0,
      byExtension: { png: [], jpg: [], svg: [], webp: [], other: [] },
      hasSpaces: []
    };
  }
}

async function auditAll() {
  console.log('===========================================');
  console.log('Icon File Audit');
  console.log('===========================================\n');
  console.log('Requirement: All icons should be black with transparent backgrounds (.png format)\n');

  for (const packType of packTypes) {
    const audit = await auditIcons(packType);

    console.log(`\n${packType.toUpperCase()}:`);
    console.log('='.repeat(50));
    console.log(`  Total icon files: ${audit.total}`);
    console.log(`  PNG files: ${audit.byExtension.png.length}`);
    console.log(`  WEBP files: ${audit.byExtension.webp.length}`);
    console.log(`  SVG files: ${audit.byExtension.svg.length}`);
    console.log(`  JPG files: ${audit.byExtension.jpg.length}`);
    console.log(`  Other formats: ${audit.byExtension.other.length}`);

    if (audit.byExtension.webp.length > 0) {
      console.log('\n  ⚠ WEBP files (should convert to PNG):');
      audit.byExtension.webp.forEach(f => console.log(`    - ${f}`));
    }

    if (audit.byExtension.svg.length > 0) {
      console.log('\n  ℹ SVG files (may need conversion to PNG):');
      audit.byExtension.svg.forEach(f => console.log(`    - ${f}`));
    }

    if (audit.byExtension.jpg.length > 0) {
      console.log('\n  ⚠ JPG files (should convert to PNG):');
      audit.byExtension.jpg.forEach(f => console.log(`    - ${f}`));
    }

    if (audit.hasSpaces.length > 0) {
      console.log('\n  ⚠ Files with spaces (should rename):');
      audit.hasSpaces.forEach(f => console.log(`    - ${f}`));
    }
  }

  console.log('\n===========================================');
  console.log('Note: Visual verification (black/transparent) must be done manually');
  console.log('===========================================');
}

auditAll().catch(console.error);
