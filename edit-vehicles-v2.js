const fs = require('fs');

const filePath = 'app/dashboard/customer/vehicles/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Edit Modal: Change Summer label
content = content.replace(
  /(\/\/ Edit Vehicle Modal Component.*?[\s\S]*?)<label htmlFor="hasSummerTires" className="ml-3 text-lg font-semibold text-gray-900 flex items-center">\s*<span className="text-2xl mr-2">☀️<\/span>\s*Sommerreifen\s*<\/label>/,
  `$1<label htmlFor="hasSummerTires" className="ml-3 text-lg font-semibold text-gray-900 flex items-center">
                  <span className="text-2xl mr-2">{formData.vehicleType === 'MOTORCYCLE' ? '🏍️' : '☀️'}</span>
                  {formData.vehicleType === 'MOTORCYCLE' ? 'Reifengrößen' : 'Sommerreifen'}
                </label>`
);

// Edit Modal: Wrap Winter section
content = content.replace(
  /(\/\/ Edit Vehicle Modal Component.*?[\s\S]*?)(\s+)\{\/\* Winter Tires \*\/\}/,
  `$1$2{/* Winter Tires - Hidden for motorcycles */}$2{formData.vehicleType !== 'MOTORCYCLE' && (`
);

// Edit Modal: Close Winter, open All Season
content = content.replace(
  /(\/\/ Edit Vehicle Modal Component.*?[\s\S]*?)(\s+)\{\/\* All Season Tires \*\/\}/,
  `$1$2)}

$2{/* All Season Tires - Hidden for motorcycles */}$2{formData.vehicleType !== 'MOTORCYCLE' && (`
);

// Edit Modal: Close All Season before Footer
content = content.replace(
  /(\/\/ Edit Vehicle Modal Component.*?[\s\S]*?All Season Tires - Hidden for motorcycles[\s\S]*?}[\s]*<\/div>[\s]*<\/div>)(\s+)\{\/\* Footer \*\/\}/,
  `$1$2)}

$2{/* Footer */}`
);

// Add Modal: Change Summer label
content = content.replace(
  /(\/\/ Add Vehicle Modal Component.*?[\s\S]*?)<label htmlFor="hasSummerTires" className="ml-3 text-lg font-semibold text-gray-900 flex items-center">\s*<span className="text-2xl mr-2">☀️<\/span>\s*Sommerreifen\s*<\/label>/,
  `$1<label htmlFor="hasSummerTires" className="ml-3 text-lg font-semibold text-gray-900 flex items-center">
                  <span className="text-2xl mr-2">{formData.vehicleType === 'MOTORCYCLE' ? '🏍️' : '☀️'}</span>
                  {formData.vehicleType === 'MOTORCYCLE' ? 'Reifengrößen' : 'Sommerreifen'}
                </label>`
);

// Add Modal: Wrap Winter section
content = content.replace(
  /(\/\/ Add Vehicle Modal Component.*?[\s\S]*?)(\s+)\{\/\* Winter Tires \*\/\}/,
  `$1$2{/* Winter Tires - Hidden for motorcycles */}$2{formData.vehicleType !== 'MOTORCYCLE' && (`
);

// Add Modal: Close Winter, open All Season
content = content.replace(
  /(\/\/ Add Vehicle Modal Component.*?[\s\S]*?)(\s+)\{\/\* All Season Tires \*\/\}/,
  `$1$2)}

$2{/* All Season Tires - Hidden for motorcycles */}$2{formData.vehicleType !== 'MOTORCYCLE' && (`
);

// Add Modal: Close All Season before Footer
content = content.replace(
  /(\/\/ Add Vehicle Modal Component.*?[\s\S]*?All Season Tires - Hidden for motorcycles[\s\S]*?}[\s]*<\/div>[\s]*<\/div>)(\s+)\{\/\* Footer \*\/\}/,
  `$1$2)}

$2{/* Footer */}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ All modifications completed successfully!');
