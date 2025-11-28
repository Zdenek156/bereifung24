const fs = require('fs');
const filePath = 'app/dashboard/customer/vehicles/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Edit Modal: Summer label (already has unique comment marker)
content = content.replace(
  /\/\/ Summer Tires \(For motorcycles: all tire sizes stored here regardless of season\)([\s\S]{500,700})<label htmlFor="hasSummerTires"[^>]+>\s*<span[^>]+>☀️<\/span>\s*Sommerreifen/,
  '// Summer Tires (For motorcycles: all tire sizes stored here regardless of season)<label htmlFor="hasSummerTires" className="ml-3 text-lg font-semibold text-gray-900 flex items-center">\n                  <span className="text-2xl mr-2">{formData.vehicleType === ''MOTORCYCLE'' ? ''��️'' : ''☀️''}</span>\n                  {formData.vehicleType === ''MOTORCYCLE'' ? ''Reifengrößen'' : ''Sommerreifen''}'
);

// 2. Edit Modal: Wrap Winter section
content = content.replace(
  /(\/\/ Summer Tires \(For motorcycles:[\s\S]{1500,2000})\{\/\* Winter Tires \*\/\}/,
  '{/* Winter Tires - Hidden for motorcycles */}\n            {formData.vehicleType !== ''MOTORCYCLE'' && ('
);

// 3. Edit Modal: Close Winter, open All Season
content = content.replace(
  /(\/\/ Summer Tires \(For motorcycles:[\s\S]{2500,3500})\{\/\* All Season Tires \*\/\}/,
  ')}\n\n            {/* All Season Tires - Hidden for motorcycles */}\n            {formData.vehicleType !== ''MOTORCYCLE'' && ('
);

// 4. Edit Modal: Close All Season before Footer
content = content.replace(
  /(\/\/ Summer Tires \(For motorcycles:[\s\S]{4000,5500})<\/div>\s*<\/div>\s*\{\/\* Footer \*\/\}/,
  '</div>\n            )}\n          </div>\n\n          {/* Footer */}'
);

// 5. Add Modal: Add unique comment marker
content = content.replace(
  /\/\/ Add Vehicle Modal Component\s+function AddVehicleModal[^{]+\{[^{]+\{[^{]+\{[\s\S]{100,300}\/\/ Summer Tires\s+hasSummerTires: false,/,
  function(match) {
    return match.replace('// Summer Tires', '// Summer Tires (For motorcycles: all tire sizes stored here regardless of season - ADD_MODAL)');
  }
);

// 6. Add Modal: Summer label
content = content.replace(
  /\/\/ Summer Tires \(For motorcycles: all tire sizes stored here regardless of season - ADD_MODAL\)([\s\S]{500,700})<label htmlFor="hasSummerTires"[^>]+>\s*<span[^>]+>☀️<\/span>\s*Sommerreifen/,
  '// Summer Tires (For motorcycles: all tire sizes stored here regardless of season - ADD_MODAL)<label htmlFor="hasSummerTires" className="ml-3 text-lg font-semibold text-gray-900 flex items-center">\n                  <span className="text-2xl mr-2">{formData.vehicleType === ''MOTORCYCLE'' ? ''🏍️'' : ''☀️''}</span>\n                  {formData.vehicleType === ''MOTORCYCLE'' ? ''Reifengrößen'' : ''Sommerreifen''}'
);

// 7. Add Modal: Wrap Winter section
content = content.replace(
  /(\/\/ Summer Tires \(For motorcycles: all tire sizes stored here regardless of season - ADD_MODAL\)[\s\S]{1500,2000})\{\/\* Winter Tires \*\/\}/,
  '{/* Winter Tires - Hidden for motorcycles */}\n            {formData.vehicleType !== ''MOTORCYCLE'' && ('
);

// 8. Add Modal: Close Winter, open All Season
content = content.replace(
  /(\/\/ Summer Tires \(For motorcycles: all tire sizes stored here regardless of season - ADD_MODAL\)[\s\S]{2500,3500})\{\/\* All Season Tires \*\/\}/,
  ')}\n\n            {/* All Season Tires - Hidden for motorcycles */}\n            {formData.vehicleType !== ''MOTORCYCLE'' && ('
);

// 9. Add Modal: Close All Season before Footer
content = content.replace(
  /(\/\/ Summer Tires \(For motorcycles: all tire sizes stored here regardless of season - ADD_MODAL\)[\s\S]{4000,5500})<\/div>\s*<\/div>\s*\{\/\* Footer \*\/\}/,
  '</div>\n            )}\n          </div>\n\n          {/* Footer */}'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ All 8 modifications completed!');
