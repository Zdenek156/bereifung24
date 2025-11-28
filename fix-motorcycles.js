const fs = require('fs');

const filePath = 'app/dashboard/customer/vehicles/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Edit Modal: Wrap Winter Tires section
content = content.replace(
  /(\/\/ Edit Vehicle Modal Component \[EDIT_MODAL_MARKER\][\s\S]*?)(\s+{\/\* Winter Tires \*\/}\s+<div className="border-t pt-6">)/,
  '$1\n\n            {/* Winter Tires (not used for motorcycles) */}\n            {formData.vehicleType !== \'MOTORCYCLE\' && (\n            <div className="border-t pt-6">'
);

// 2. Edit Modal: Close Winter section and wrap All Season section
content = content.replace(
  /(\/\/ Edit Vehicle Modal Component \[EDIT_MODAL_MARKER\][\s\S]*?Winter Tires[\s\S]*?              }\n            <\/div>\n\n)(            {\/\* All Season Tires \*\/}\s+<div className="border-t pt-6">)/,
  '$1            )}\n\n            {/* All Season Tires (not used for motorcycles) */}\n            {formData.vehicleType !== \'MOTORCYCLE\' && (\n            <div className="border-t pt-6">'
);

// 3. Edit Modal: Close All Season section before Modal Footer
content = content.replace(
  /(\/\/ Edit Vehicle Modal Component \[EDIT_MODAL_MARKER\][\s\S]*?All Season Tires[\s\S]*?              }\n            <\/div>\n          <\/div>\n\n)(          {\/\* Modal Footer \*\/})/,
  '$1            )}\n          </div>\n\n$2'
);

// 4. Add Modal: Wrap Winter Tires section
content = content.replace(
  /(\/\/ Add Vehicle Modal Component[\s\S]*?)(\s+{\/\* Winter Tires \*\/}\s+<div className="border-t pt-6">)/,
  '$1\n\n            {/* Winter Tires (not used for motorcycles) */}\n            {formData.vehicleType !== \'MOTORCYCLE\' && (\n            <div className="border-t pt-6">'
);

// 5. Add Modal: Close Winter section and wrap All Season section
content = content.replace(
  /(\/\/ Add Vehicle Modal Component[\s\S]*?Winter Tires[\s\S]*?              }\n            <\/div>\n\n)(            {\/\* All Season Tires \*\/}\s+<div className="border-t pt-6">)/,
  '$1            )}\n\n            {/* All Season Tires (not used for motorcycles) */}\n            {formData.vehicleType !== \'MOTORCYCLE\' && (\n            <div className="border-t pt-6">'
);

// 6. Add Modal: Close All Season section before Modal Footer
content = content.replace(
  /(\/\/ Add Vehicle Modal Component[\s\S]*?All Season Tires[\s\S]*?              }\n            <\/div>\n          <\/div>\n\n)(          {\/\* Modal Footer \*\/})/,
  '$1            )}\n          </div>\n\n$2'
);

// 7. Add Modal: Remove checkbox from Reifengrößen section
content = content.replace(
  /(\/\/ Add Vehicle Modal Component[\s\S]*?{\/\* Summer Tires \*\/}\s+<div className="border-t pt-6">\s+<div className="flex items-center mb-4">\s+)<input\s+type="checkbox"\s+id="hasSummerTires"\s+name="hasSummerTires"\s+checked=\{formData\.hasSummerTires\}\s+onChange=\{handleChange\}\s+className="[^"]+"\s+\/>\s+<label htmlFor="hasSummerTires" className="ml-3/,
  '$1{formData.vehicleType !== \'MOTORCYCLE\' && (\n                  <input\n                    type="checkbox"\n                    id="hasSummerTires"\n                    name="hasSummerTires"\n                    checked={formData.hasSummerTires}\n                    onChange={handleChange}\n                    className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"\n                  />\n                )}\n                <label htmlFor="hasSummerTires" className={`${formData.vehicleType !== \'MOTORCYCLE\' ? \'ml-3\' : \'\'}'
);

// 8. Add Modal: Change condition for showing summer tires content
content = content.replace(
  /(\/\/ Add Vehicle Modal Component[\s\S]*?{\/\* Summer Tires \*\/}[\s\S]*?<\/label>\s+<\/div>\s+\n\s+){formData\.hasSummerTires && \(/,
  '$1{(formData.vehicleType === \'MOTORCYCLE\' || formData.hasSummerTires) && ('
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✓ All modifications applied successfully');
