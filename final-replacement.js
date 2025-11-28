const fs = require('fs');
const filePath = 'app/dashboard/customer/vehicles/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

console.log('Starting modifications...\n');

// 1. Edit Modal: Summer label (already has unique comment marker from previous step)
const editModalSummerLabelBefore = content.match(/\/\/ Summer Tires \(For motorcycles: all tire sizes stored here regardless of season\)([\s\S]{500,700})<label htmlFor="hasSummerTires"[^>]+>\s*<span[^>]+>☀️<\/span>\s*Sommerreifen/);
if (editModalSummerLabelBefore) {
  content = content.replace(
    /\/\/ Summer Tires \(For motorcycles: all tire sizes stored here regardless of season\)([\s\S]{500,700})<label htmlFor="hasSummerTires" className="ml-3 text-lg font-semibold text-gray-900 flex items-center">\s*<span className="text-2xl mr-2">☀️<\/span>\s*Sommerreifen/,
    function(match, group1) {
      return `// Summer Tires (For motorcycles: all tire sizes stored here regardless of season)${group1}<label htmlFor="hasSummerTires" className="ml-3 text-lg font-semibold text-gray-900 flex items-center">
                  <span className="text-2xl mr-2">{formData.vehicleType === 'MOTORCYCLE' ? '🏍️' : '☀️'}</span>
                  {formData.vehicleType === 'MOTORCYCLE' ? 'Reifengrößen' : 'Sommerreifen'}`;
    }
  );
  console.log('✓ Edit Modal: Summer label updated');
} else {
  console.log('✗ Edit Modal: Summer label not found');
}

// 2. Edit Modal: Wrap Winter section
if (content.includes('// Summer Tires (For motorcycles:')) {
  content = content.replace(
    /(\/\/ Summer Tires \(For motorcycles:[\s\S]{1500,2000})\{\/\* Winter Tires \*\/\}/,
    `$1{/* Winter Tires - Hidden for motorcycles */}
            {formData.vehicleType !== 'MOTORCYCLE' && (`
  );
  console.log('✓ Edit Modal: Winter section wrapped');
}

// 3. Edit Modal: Close Winter, open All Season
content = content.replace(
  /(\/\/ Summer Tires \(For motorcycles:[\s\S]{2500,3500})\{\/\* All Season Tires \*\/\}/,
  `$1)}

            {/* All Season Tires - Hidden for motorcycles */}
            {formData.vehicleType !== 'MOTORCYCLE' && (`
);
console.log('✓ Edit Modal: Winter closed, All Season opened');

// 4. Edit Modal: Close All Season before Footer
content = content.replace(
  /(\/\/ Summer Tires \(For motorcycles:[\s\S]{4000,5500})<\/div>\s*<\/div>\s*\{\/\* Footer \*\/\}/,
  `$1</div>
            )}
          </div>

          {/* Footer */}`
);
console.log('✓ Edit Modal: All Season closed');

// 5. Add Modal: Add unique comment marker
content = content.replace(
  /\/\/ Add Vehicle Modal Component\s+function AddVehicleModal[^{]+\{[^{]+\{[^{]+\{[\s\S]{100,300}\/\/ Summer Tires\s+hasSummerTires: false,/,
  function(match) {
    return match.replace('// Summer Tires', '// Summer Tires (For motorcycles: all tire sizes stored here regardless of season - ADD_MODAL)');
  }
);
console.log('✓ Add Modal: Unique marker added');

// 6. Add Modal: Summer label
content = content.replace(
  /\/\/ Summer Tires \(For motorcycles: all tire sizes stored here regardless of season - ADD_MODAL\)([\s\S]{500,700})<label htmlFor="hasSummerTires" className="ml-3 text-lg font-semibold text-gray-900 flex items-center">\s*<span className="text-2xl mr-2">☀️<\/span>\s*Sommerreifen/,
  function(match, group1) {
    return `// Summer Tires (For motorcycles: all tire sizes stored here regardless of season - ADD_MODAL)${group1}<label htmlFor="hasSummerTires" className="ml-3 text-lg font-semibold text-gray-900 flex items-center">
                  <span className="text-2xl mr-2">{formData.vehicleType === 'MOTORCYCLE' ? '🏍️' : '☀️'}</span>
                  {formData.vehicleType === 'MOTORCYCLE' ? 'Reifengrößen' : 'Sommerreifen'}`;
  }
);
console.log('✓ Add Modal: Summer label updated');

// 7. Add Modal: Wrap Winter section
content = content.replace(
  /(\/\/ Summer Tires \(For motorcycles: all tire sizes stored here regardless of season - ADD_MODAL\)[\s\S]{1500,2000})\{\/\* Winter Tires \*\/\}/,
  `$1{/* Winter Tires - Hidden for motorcycles */}
            {formData.vehicleType !== 'MOTORCYCLE' && (`
);
console.log('✓ Add Modal: Winter section wrapped');

// 8. Add Modal: Close Winter, open All Season
content = content.replace(
  /(\/\/ Summer Tires \(For motorcycles: all tire sizes stored here regardless of season - ADD_MODAL\)[\s\S]{2500,3500})\{\/\* All Season Tires \*\/\}/,
  `$1)}

            {/* All Season Tires - Hidden for motorcycles */}
            {formData.vehicleType !== 'MOTORCYCLE' && (`
);
console.log('✓ Add Modal: Winter closed, All Season opened');

// 9. Add Modal: Close All Season before Footer
content = content.replace(
  /(\/\/ Summer Tires \(For motorcycles: all tire sizes stored here regardless of season - ADD_MODAL\)[\s\S]{4000,5500})<\/div>\s*<\/div>\s*\{\/\* Footer \*\/\}/,
  `$1</div>
            )}
          </div>

          {/* Footer */}`
);
console.log('✓ Add Modal: All Season closed');

fs.writeFileSync(filePath, content, 'utf8');
console.log('\n✅ All modifications completed successfully!');
