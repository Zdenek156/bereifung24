// Logo-Optimierungs-Script
// Komprimiert PNG-Logos und konvertiert sie zu WebP für schnelleres Laden

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const logosDir = path.join(__dirname, 'public', 'logos');

async function optimizeLogos() {
  console.log('🔧 Optimiere Payment-Logos...\n');
  
  const files = fs.readdirSync(logosDir);
  const pngFiles = files.filter(f => f.endsWith('.png'));
  
  for (const file of pngFiles) {
    const inputPath = path.join(logosDir, file);
    const outputPath = path.join(logosDir, file);
    const webpPath = path.join(logosDir, file.replace('.png', '.webp'));
    
    try {
      // Original-Größe
      const originalStats = fs.statSync(inputPath);
      const originalSize = (originalStats.size / 1024).toFixed(2);
      
      // PNG optimieren (auf max. 100px Breite skalieren wenn größer)
      await sharp(inputPath)
        .resize({ width: 100, fit: 'inside', withoutEnlargement: true })
        .png({ quality: 90, compressionLevel: 9 })
        .toFile(outputPath + '.tmp');
      
      fs.renameSync(outputPath + '.tmp', outputPath);
      
      // WebP Version erstellen (noch kleiner)
      await sharp(inputPath)
        .resize({ width: 100, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 90 })
        .toFile(webpPath);
      
      // Neue Größen
      const optimizedStats = fs.statSync(outputPath);
      const webpStats = fs.statSync(webpPath);
      const optimizedSize = (optimizedStats.size / 1024).toFixed(2);
      const webpSize = (webpStats.size / 1024).toFixed(2);
      
      const savings = ((1 - optimizedStats.size / originalStats.size) * 100).toFixed(1);
      const webpSavings = ((1 - webpStats.size / originalStats.size) * 100).toFixed(1);
      
      console.log(`✅ ${file}:`);
      console.log(`   Original:   ${originalSize} KB`);
      console.log(`   Optimiert:  ${optimizedSize} KB (${savings}% kleiner)`);
      console.log(`   WebP:       ${webpSize} KB (${webpSavings}% kleiner)`);
      console.log('');
    } catch (error) {
      console.error(`❌ Fehler bei ${file}:`, error.message);
    }
  }
  
  console.log('🎉 Optimierung abgeschlossen!');
  console.log('\n💡 Tipp: Next.js wird automatisch WebP verwenden, wenn der Browser es unterstützt.');
}

// Prüfen ob sharp installiert ist
try {
  require('sharp');
  optimizeLogos();
} catch (e) {
  console.log('❌ sharp nicht installiert!');
  console.log('📦 Installiere mit: npm install sharp --save-dev');
  console.log('\nOder für sofortige Nutzung: npx -y sharp-cli');
}
