const fs = require('fs');

let content = fs.readFileSync('app/dashboard/customer/vehicles/page.tsx', 'utf8');

// 1. Edit Modal: Wrap Winter section
const winterSearch = `            {/* Winter Tires */}
            <div className="border-t pt-6">`;

const winterReplace = `            {/* Winter Tires (not used for motorcycles) */}
            {formData.vehicleType !== 'MOTORCYCLE' && (
            <div className="border-t pt-6">`;

let pos = content.indexOf(winterSearch);
if (pos >= 0) {
    content = content.substring(0, pos) + winterReplace + content.substring(pos + winterSearch.length);
    console.log('✓ Edit Modal: Winter section wrapped');
} else {
    console.log('✗ Edit Modal: Winter section not found');
}

// 2. Add Modal: Wrap Winter section (second occurrence)
pos = content.indexOf(winterSearch);
if (pos >= 0) {
    content = content.substring(0, pos) + winterReplace + content.substring(pos + winterSearch.length);
    console.log('✓ Add Modal: Winter section wrapped');
} else {
    console.log('✗ Add Modal: Winter section not found');
}

// 3. Edit Modal: Close Winter and wrap All Season
const allSeasonSearch = `            {/* All Season Tires */}
            <div className="border-t pt-6">`;

const allSeasonReplace = `            )}

            {/* All Season Tires (not used for motorcycles) */}
            {formData.vehicleType !== 'MOTORCYCLE' && (
            <div className="border-t pt-6">`;

pos = content.indexOf(allSeasonSearch);
if (pos >= 0) {
    content = content.substring(0, pos) + allSeasonReplace + content.substring(pos + allSeasonSearch.length);
    console.log('✓ Edit Modal: All Season section wrapped');
} else {
    console.log('✗ Edit Modal: All Season section not found');
}

// 4. Add Modal: Close Winter and wrap All Season (second occurrence)
pos = content.indexOf(allSeasonSearch);
if (pos >= 0) {
    content = content.substring(0, pos) + allSeasonReplace + content.substring(pos + allSeasonSearch.length);
    console.log('✓ Add Modal: All Season section wrapped');
} else {
    console.log('✗ Add Modal: All Season section not found');
}

// 5. Edit Modal: Close All Season before Footer
const footerSearch = `          </div>

          {/* Modal Footer */}`;

const footerReplace = `          </div>
            )}

          {/* Modal Footer */}`;

pos = content.indexOf(footerSearch);
if (pos >= 0) {
    content = content.substring(0, pos) + footerReplace + content.substring(pos + footerSearch.length);
    console.log('✓ Edit Modal: All Season closed');
} else {
    console.log('✗ Edit Modal: All Season close not found');
}

// 6. Add Modal: Close All Season before Footer (second occurrence)
pos = content.indexOf(footerSearch);
if (pos >= 0) {
    content = content.substring(0, pos) + footerReplace + content.substring(pos + footerSearch.length);
    console.log('✓ Add Modal: All Season closed');
} else {
    console.log('✗ Add Modal: All Season close not found');
}

// 7. Add Modal: Fix Summer label to show Reifengrößen for motorcycles
const addSummerLabel = `                <label htmlFor="hasSummerTires" className="ml-3 text-lg font-semibold text-gray-900 flex items-center">
                  <span className="text-2xl mr-2">☀️</span>
                  Sommerreifen
                </label>`;

const addSummerLabelFixed = `                <label htmlFor="hasSummerTires" className={\`\${formData.vehicleType !== 'MOTORCYCLE' ? 'ml-3' : ''} text-lg font-semibold text-gray-900 flex items-center\`}>
                  <span className="text-2xl mr-2">{formData.vehicleType === 'MOTORCYCLE' ? '🏍️' : '☀️'}</span>
                  {formData.vehicleType === 'MOTORCYCLE' ? 'Reifengrößen' : 'Sommerreifen'}
                </label>`;

pos = content.indexOf(addSummerLabel);
if (pos >= 0) {
    content = content.substring(0, pos) + addSummerLabelFixed + content.substring(pos + addSummerLabel.length);
    console.log('✓ Add Modal: Summer label fixed');
} else {
    console.log('✗ Add Modal: Summer label not found');
}

// 8. Add Modal: Change condition for showing summer tires content
// Find the second occurrence of "hasSummerTires && (" and change to "(formData.vehicleType === 'MOTORCYCLE' || formData.hasSummerTires) && ("
const oldCondition = `              {formData.hasSummerTires && (`;
const newCondition = `              {(formData.vehicleType === 'MOTORCYCLE' || formData.hasSummerTires) && (`;

// Find second occurrence (Add Modal)
let firstPos = content.indexOf(oldCondition);
if (firstPos >= 0) {
    let remaining = content.substring(firstPos + oldCondition.length);
    let secondPosInRemaining = remaining.indexOf(oldCondition);
    if (secondPosInRemaining >= 0) {
        let secondPos = firstPos + oldCondition.length + secondPosInRemaining;
        content = content.substring(0, secondPos) + newCondition + content.substring(secondPos + oldCondition.length);
        console.log('✓ Add Modal: Summer condition fixed');
    } else {
        console.log('✗ Add Modal: Summer condition second occurrence not found');
    }
} else {
    console.log('✗ Add Modal: Summer condition not found');
}

fs.writeFileSync('app/dashboard/customer/vehicles/page.tsx', content, 'utf8');
console.log('\n✅ All changes applied successfully!');
