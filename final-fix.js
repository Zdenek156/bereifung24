const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/dashboard/customer/vehicles/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');
let changes = 0;

// Helper function to replace first occurrence
function replaceFirst(str, search, replace) {
    const index = str.indexOf(search);
    if (index === -1) return { str, found: false };
    return {
        str: str.substring(0, index) + replace + str.substring(index + search.length),
        found: true
    };
}

// 1. Edit Modal - Hide checkbox from Summer section
const editSummerCheckbox = `            {/* Summer Tires */}
            <div className="border-t pt-6">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="hasSummerTires"
                  name="hasSummerTires"
                  checked={formData.hasSummerTires}
                  onChange={handleChange}
                  className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="hasSummerTires" className="ml-3 text-lg font-semibold text-gray-900 flex items-center">
                  <span className="text-2xl mr-2">{formData.vehicleType === 'MOTORCYCLE' ? '🏍️' : '☀️'}</span>
                  {formData.vehicleType === 'MOTORCYCLE' ? 'Reifengrößen' : 'Sommerreifen'}
                </label>
              </div>

              {formData.hasSummerTires && (`;

const editSummerCheckboxNew = `            {/* Summer Tires */}
            <div className="border-t pt-6">
              <div className="flex items-center mb-4">
                {formData.vehicleType !== 'MOTORCYCLE' && (
                  <input
                    type="checkbox"
                    id="hasSummerTires"
                    name="hasSummerTires"
                    checked={formData.hasSummerTires}
                    onChange={handleChange}
                    className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                )}
                <label htmlFor="hasSummerTires" className={\`\${formData.vehicleType !== 'MOTORCYCLE' ? 'ml-3' : ''} text-lg font-semibold text-gray-900 flex items-center\`}>
                  <span className="text-2xl mr-2">{formData.vehicleType === 'MOTORCYCLE' ? '🏍️' : '☀️'}</span>
                  {formData.vehicleType === 'MOTORCYCLE' ? 'Reifengrößen' : 'Sommerreifen'}
                </label>
              </div>

              {(formData.vehicleType === 'MOTORCYCLE' || formData.hasSummerTires) && (`;

let result = replaceFirst(content, editSummerCheckbox, editSummerCheckboxNew);
if (result.found) {
    content = result.str;
    changes++;
    console.log('✓ 1. Edit Modal: Summer checkbox hidden for motorcycles');
} else {
    console.log('✗ 1. Edit Modal: Summer checkbox pattern not found');
}

// 2. Edit Modal - Wrap Winter section
const editWinterStart = `            {/* Winter Tires */}
            <div className="border-t pt-6">`;

const editWinterStartNew = `            {/* Winter Tires (not used for motorcycles) */}
            {formData.vehicleType !== 'MOTORCYCLE' && (
            <div className="border-t pt-6">`;

result = replaceFirst(content, editWinterStart, editWinterStartNew);
if (result.found) {
    content = result.str;
    changes++;
    console.log('✓ 2. Edit Modal: Winter section wrapped');
} else {
    console.log('✗ 2. Edit Modal: Winter section not found');
}

// 3. Edit Modal - Close Winter and wrap All Season
const editAllSeasonStart = `            {/* All Season Tires */}
            <div className="border-t pt-6">`;

const editAllSeasonStartNew = `            )}

            {/* All Season Tires (not used for motorcycles) */}
            {formData.vehicleType !== 'MOTORCYCLE' && (
            <div className="border-t pt-6">`;

result = replaceFirst(content, editAllSeasonStart, editAllSeasonStartNew);
if (result.found) {
    content = result.str;
    changes++;
    console.log('✓ 3. Edit Modal: All Season section wrapped');
} else {
    console.log('✗ 3. Edit Modal: All Season section not found');
}

// 4. Edit Modal - Close All Season before Footer
const editFooter = `          </div>

          {/* Modal Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Wird gespeichert...' : 'Speichern'}
            </button>
          </div>`;

const editFooterNew = `          </div>
            )}

          {/* Modal Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Wird gespeichert...' : 'Speichern'}
            </button>
          </div>`;

result = replaceFirst(content, editFooter, editFooterNew);
if (result.found) {
    content = result.str;
    changes++;
    console.log('✓ 4. Edit Modal: All Season closed');
} else {
    console.log('✗ 4. Edit Modal: All Season close not found');
}

// 5. Add Modal - Hide checkbox from Summer section
const addSummerCheckbox = `            {/* Summer Tires */}
            <div className="border-t pt-6">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="hasSummerTires"
                  name="hasSummerTires"
                  checked={formData.hasSummerTires}
                  onChange={handleChange}
                  className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="hasSummerTires" className="ml-3 text-lg font-semibold text-gray-900 flex items-center">
                  <span className="text-2xl mr-2">☀️</span>
                  Sommerreifen
                </label>
              </div>

              {formData.hasSummerTires && (`;

const addSummerCheckboxNew = `            {/* Summer Tires */}
            <div className="border-t pt-6">
              <div className="flex items-center mb-4">
                {formData.vehicleType !== 'MOTORCYCLE' && (
                  <input
                    type="checkbox"
                    id="hasSummerTires"
                    name="hasSummerTires"
                    checked={formData.hasSummerTires}
                    onChange={handleChange}
                    className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                )}
                <label htmlFor="hasSummerTires" className={\`\${formData.vehicleType !== 'MOTORCYCLE' ? 'ml-3' : ''} text-lg font-semibold text-gray-900 flex items-center\`}>
                  <span className="text-2xl mr-2">{formData.vehicleType === 'MOTORCYCLE' ? '🏍️' : '☀️'}</span>
                  {formData.vehicleType === 'MOTORCYCLE' ? 'Reifengrößen' : 'Sommerreifen'}
                </label>
              </div>

              {(formData.vehicleType === 'MOTORCYCLE' || formData.hasSummerTires) && (`;

result = replaceFirst(content, addSummerCheckbox, addSummerCheckboxNew);
if (result.found) {
    content = result.str;
    changes++;
    console.log('✓ 5. Add Modal: Summer checkbox hidden for motorcycles');
} else {
    console.log('✗ 5. Add Modal: Summer checkbox not found');
}

// 6. Add Modal - Wrap Winter section
result = replaceFirst(content, editWinterStart, editWinterStartNew);
if (result.found) {
    content = result.str;
    changes++;
    console.log('✓ 6. Add Modal: Winter section wrapped');
} else {
    console.log('✗ 6. Add Modal: Winter section not found');
}

// 7. Add Modal - Close Winter and wrap All Season
result = replaceFirst(content, editAllSeasonStart, editAllSeasonStartNew);
if (result.found) {
    content = result.str;
    changes++;
    console.log('✓ 7. Add Modal: All Season section wrapped');
} else {
    console.log('✗ 7. Add Modal: All Season section not found');
}

// 8. Add Modal - Close All Season before Footer
result = replaceFirst(content, editFooter, editFooterNew);
if (result.found) {
    content = result.str;
    changes++;
    console.log('✓ 8. Add Modal: All Season closed');
} else {
    console.log('✗ 8. Add Modal: All Season close not found');
}

// Write the file
fs.writeFileSync(filePath, content, 'utf8');

console.log(`\n✅ Applied ${changes}/8 changes successfully!`);

if (changes < 8) {
    console.log('\n⚠️  Some changes were not applied. Please review manually.');
    process.exit(1);
}
