const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'Bereifung24_SEO_Landing_Pages.xlsx');

try {
  const workbook = XLSX.readFile(filePath);
  
  console.log('📊 Excel-Datei gefunden!');
  console.log('Sheets:', workbook.SheetNames);
  
  workbook.SheetNames.forEach(sheetName => {
    console.log(`\n--- Sheet: ${sheetName} ---`);
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Erste 5 Zeilen anzeigen
    console.log('Erste 5 Zeilen:');
    data.slice(0, 5).forEach((row, idx) => {
      console.log(`Zeile ${idx}:`, row);
    });
    
    // Spaltennamen (erste Zeile)
    if (data.length > 0) {
      console.log('\nSpaltennamen:', data[0]);
    }
  });
} catch (error) {
  console.error('Fehler beim Lesen der Excel-Datei:', error.message);
}
