/**
 * Macht den blauen Hintergrund der B24 Logo-Assets transparent.
 * Ergebnis: Weiße Elemente auf transparentem Hintergrund.
 */
const sharp = require('sharp');
const path = require('path');

const files = [
  'assets/splash/Logo_Ausschnitt_B24_weiß.png',
  'assets/splash/Logo_Ausschnitt_Reifenspur_weiß.png',
];

async function makeTransparent(filePath) {
  const input = await sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data, info } = input;
  const { width, height, channels } = info;

  const output = Buffer.alloc(width * height * 4);

  for (let i = 0; i < width * height; i++) {
    const r = data[i * channels + 0];
    const g = data[i * channels + 1];
    const b = data[i * channels + 2];

    // Erkennt Blautöne: mehr Blau als Rot+Grün, typischer B24-Blau-Bereich
    const isBlue = b > 100 && b > r * 1.5 && b > g * 1.2 && r < 150;

    output[i * 4 + 0] = 255; // R → Weiß
    output[i * 4 + 1] = 255; // G → Weiß
    output[i * 4 + 2] = 255; // B → Weiß
    output[i * 4 + 3] = isBlue ? 0 : 255; // Alpha: Blau = transparent, sonst opak
  }

  await sharp(output, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(filePath);

  console.log(`✓ Transparenz: ${filePath}`);
}

(async () => {
  for (const file of files) {
    await makeTransparent(file);
  }
  console.log('\nFertig! Alle Logos sind jetzt transparent.');
})();
