const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateFavicons() {
  const sourcePath = path.join(process.cwd(), 'public', 'logos', 'B24_Logo_blau.png');
  const publicDir = path.join(process.cwd(), 'public');

  // Generate 16x16 PNG
  await sharp(sourcePath)
    .resize(16, 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'favicon-16.png'));
  console.log('✅ favicon-16.png created');

  // Re-generate 32x32 PNG (ensure quality)
  await sharp(sourcePath)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'favicon-32.png'));
  console.log('✅ favicon-32.png created');

  // Generate favicon.ico (actually a 32x32 PNG renamed - browsers accept this)
  // Most modern browsers accept PNG as .ico
  await sharp(sourcePath)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('✅ favicon.ico created (PNG format)');

  // Verify files
  for (const f of ['favicon-16.png', 'favicon-32.png', 'favicon.ico', 'apple-touch-icon.png']) {
    const fp = path.join(publicDir, f);
    if (fs.existsSync(fp)) {
      const stat = fs.statSync(fp);
      console.log(`  ${f}: ${stat.size} bytes`);
    }
  }
}

generateFavicons().catch(e => { console.error(e); process.exit(1); });
