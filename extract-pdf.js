const fs = require('fs');
const pdfParse = require('pdf-parse');

(async () => {
    const dataBuffer = fs.readFileSync('EPREL Public API key - Zdenek Kyzlink.pdf');
    
    try {
        const data = await pdfParse(dataBuffer);
        
        console.log('=== PDF TEXT ===');
        console.log(data.text);
        
        console.log('\n\n=== METADATA ===');
        console.log(JSON.stringify(data.info, null, 2));
        
        console.log('\n\n=== URLs FOUND ===');
        const urls = data.text.match(/https?:\/\/[^\s<>\"']+/g);
        if (urls) {
            urls.forEach(url => console.log(url));
        }
        
        console.log('\n\n=== API KEYWORDS ===');
        const keywords = data.text.match(/\b(endpoint|api|rest|products|tyres|token|bearer|authorization)\b/gi);
        if (keywords) {
            console.log([...new Set(keywords)].join(', '));
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
})();
