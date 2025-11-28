const fs = require('fs');

const filePath = 'app/dashboard/customer/vehicles/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Step 1: Add markers to distinguish the two modals
content = content.replace(
  '// Edit Vehicle Modal Component',
  '// Edit Vehicle Modal Component [EDIT_MODAL]'
);

content = content.replace(
  '// Add Vehicle Modal Component',
  '// Add Vehicle Modal Component [ADD_MODAL]'
);

// ============ EDIT MODAL ============

// 1. Edit Modal: Hide checkbox for motorcycles in Summer section
const editSummerCheckboxOld = `// Edit Vehicle Modal Component [EDIT_MODAL]
function EditVehicleModal({ vehicle, onClose, onSuccess }: { vehicle: Vehicle, onClose: () => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    vehicleType: vehicle.vehicleType || 'CAR',
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    licensePlate: vehicle.licensePlate || '',
    vin: vehicle.vin || '',
    nextInspectionDate: vehicle.nextInspectionDate ? new Date(vehicle.nextInspectionDate).toISOString().substring(0, 7) : '',
    // Summer Tires (For motorcycles: all tire sizes stored here regardless of season)
    hasSummerTires: !!vehicle.summerTires,
    summerDifferentSizes: vehicle.summerTires?.hasDifferentSizes || false,
    summerWidth: vehicle.summerTires?.width.toString() || '',
    summerAspectRatio: vehicle.summerTires?.aspectRatio.toString() || '',
    summerDiameter: vehicle.summerTires?.diameter.toString() || '',
    summerLoadIndex: vehicle.summerTires?.loadIndex?.toString() || '',
    summerSpeedRating: vehicle.summerTires?.speedRating || '',
    summerRearWidth: vehicle.summerTires?.rearWidth?.toString() || '',
    summerRearAspectRatio: vehicle.summerTires?.rearAspectRatio?.toString() || '',
    summerRearDiameter: vehicle.summerTires?.rearDiameter?.toString() || '',
    summerRearLoadIndex: vehicle.summerTires?.rearLoadIndex?.toString() || '',
    summerRearSpeedRating: vehicle.summerTires?.rearSpeedRating || '',
    // Winter Tires (not used for motorcycles)
    hasWinterTires: !!vehicle.winterTires,
    winterDifferentSizes: vehicle.winterTires?.hasDifferentSizes || false,
    winterWidth: vehicle.winterTires?.width.toString() || '',
    winterAspectRatio: vehicle.winterTires?.aspectRatio.toString() || '',
    winterDiameter: vehicle.winterTires?.diameter.toString() || '',
    winterLoadIndex: vehicle.winterTires?.loadIndex?.toString() || '',
    winterSpeedRating: vehicle.winterTires?.speedRating || '',
    winterRearWidth: vehicle.winterTires?.rearWidth?.toString() || '',
    winterRearAspectRatio: vehicle.winterTires?.rearAspectRatio?.toString() || '',
    winterRearDiameter: vehicle.winterTires?.rearDiameter?.toString() || '',
    winterRearLoadIndex: vehicle.winterTires?.rearLoadIndex?.toString() || '',
    winterRearSpeedRating: vehicle.winterTires?.rearSpeedRating || '',
    // All Season Tires (not used for motorcycles)
    hasAllSeasonTires: !!vehicle.allSeasonTires,
    allSeasonDifferentSizes: vehicle.allSeasonTires?.hasDifferentSizes || false,
    allSeasonWidth: vehicle.allSeasonTires?.width.toString() || '',
    allSeasonAspectRatio: vehicle.allSeasonTires?.aspectRatio.toString() || '',
    allSeasonDiameter: vehicle.allSeasonTires?.diameter.toString() || '',
    allSeasonLoadIndex: vehicle.allSeasonTires?.loadIndex?.toString() || '',
    allSeasonSpeedRating: vehicle.allSeasonTires?.speedRating || '',
    allSeasonRearWidth: vehicle.allSeasonTires?.rearWidth?.toString() || '',
    allSeasonRearAspectRatio: vehicle.allSeasonTires?.rearAspectRatio?.toString() || '',
    allSeasonRearDiameter: vehicle.allSeasonTires?.rearDiameter?.toString() || '',
    allSeasonRearLoadIndex: vehicle.allSeasonTires?.rearLoadIndex?.toString() || '',
    allSeasonRearSpeedRating: vehicle.allSeasonTires?.rearSpeedRating || '',
  })

  // Dynamische Reifengrößen basierend auf Fahrzeugtyp
  const TIRE_WIDTHS = formData.vehicleType === 'MOTORCYCLE'`;

const editSummerCheckboxNew = editSummerCheckboxOld; // We're keeping formData as is

content = content.replace(editSummerCheckboxOld, editSummerCheckboxNew);

// 2. Edit Modal: Wrap Winter section with conditional
content = content.replace(
  /(\[EDIT_MODAL\][\s\S]*?            }<\/div>\n\n)(\s+{\/\* Winter Tires \*\/}\n\s+<div className="border-t pt-6">)/,
  '$1\n            {/* Winter Tires (not used for motorcycles) */}\n            {formData.vehicleType !== \'MOTORCYCLE\' && (\n            <div className="border-t pt-6">'
);

// 3. Edit Modal: Close Winter and wrap All Season
content = content.replace(
  /(\[EDIT_MODAL\][\s\S]*?Winter Tires[\s\S]*?              }\n            <\/div>\n\n)(\s+{\/\* All Season Tires \*\/}\n\s+<div className="border-t pt-6">)/,
  '$1            )}\n\n            {/* All Season Tires (not used for motorcycles) */}\n            {formData.vehicleType !== \'MOTORCYCLE\' && (\n            <div className="border-t pt-6">'
);

// 4. Edit Modal: Close All Season before Footer
content = content.replace(
  /(\[EDIT_MODAL\][\s\S]*?All Season Tires[\s\S]*?              }\n            <\/div>\n          <\/div>\n\n)(\s+{\/\* Modal Footer \*\/})/,
  '$1            )}\n          </div>\n\n$2'
);

// 5. Edit Modal: Remove checkbox and change label for motorcycles in Summer section
content = content.replace(
  /(\[EDIT_MODAL\][\s\S]*?{\/\* Summer Tires[\s\S]*?<\/span>\}[\s\S]*?<div className="border-t pt-6">\s+<div className="flex items-center mb-4">\s+)<input[\s\S]*?className="w-5 h-5[\s\S]*?rounded"\s+\/>\s+<label htmlFor="hasSummerTires" className="ml-3 text-lg font-semibold text-gray-900 flex items-center">\s+<span className="text-2xl mr-2">\{formData\.vehicleType === 'MOTORCYCLE' \? '🏍️' : '☀️'\}<\/span>\s+\{formData\.vehicleType === 'MOTORCYCLE' \? 'Reifengrößen' : 'Sommerreifen'\}\s+<\/label>\s+<\/div>\n\n\s+\{formData\.hasSummerTires && \(/,
  '$1{formData.vehicleType !== \'MOTORCYCLE\' && (\n                  <input\n                    type="checkbox"\n                    id="hasSummerTires"\n                    name="hasSummerTires"\n                    checked={formData.hasSummerTires}\n                    onChange={handleChange}\n                    className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"\n                  />\n                )}\n                <label htmlFor="hasSummerTires" className={`${formData.vehicleType !== \'MOTORCYCLE\' ? \'ml-3\' : \'\'} text-lg font-semibold text-gray-900 flex items-center`}>\n                  <span className="text-2xl mr-2">{formData.vehicleType === \'MOTORCYCLE\' ? \'🏍️\' : \'☀️\'}</span>\n                  {formData.vehicleType === \'MOTORCYCLE\' ? \'Reifengrößen\' : \'Sommerreifen\'}\n                </label>\n              </div>\n\n              {(formData.vehicleType === \'MOTORCYCLE\' || formData.hasSummerTires) && ('
);

// ============ ADD MODAL ============

// 6. Add Modal: Wrap Winter section
content = content.replace(
  /(\[ADD_MODAL\][\s\S]*?            }<\/div>\n\n)(\s+{\/\* Winter Tires \*\/}\n\s+<div className="border-t pt-6">)/,
  '$1\n            {/* Winter Tires (not used for motorcycles) */}\n            {formData.vehicleType !== \'MOTORCYCLE\' && (\n            <div className="border-t pt-6">'
);

// 7. Add Modal: Close Winter and wrap All Season
content = content.replace(
  /(\[ADD_MODAL\][\s\S]*?Winter Tires[\s\S]*?              }\n            <\/div>\n\n)(\s+{\/\* All Season Tires \*\/}\n\s+<div className="border-t pt-6">)/,
  '$1            )}\n\n            {/* All Season Tires (not used for motorcycles) */}\n            {formData.vehicleType !== \'MOTORCYCLE\' && (\n            <div className="border-t pt-6">'
);

// 8. Add Modal: Close All Season before Footer
content = content.replace(
  /(\[ADD_MODAL\][\s\S]*?All Season Tires[\s\S]*?              }\n            <\/div>\n          <\/div>\n\n)(\s+{\/\* Modal Footer \*\/})/,
  '$1            )}\n          </div>\n\n$2'
);

// 9. Add Modal: Remove checkbox and change label
content = content.replace(
  /(\[ADD_MODAL\][\s\S]*?{\/\* Summer Tires \*\/}\s+<div className="border-t pt-6">\s+<div className="flex items-center mb-4">\s+)<input[\s\S]*?className="w-5 h-5[\s\S]*?rounded"\s+\/>\s+<label htmlFor="hasSummerTires" className="ml-3 text-lg font-semibold text-gray-900 flex items-center">\s+<span className="text-2xl mr-2">☀️<\/span>\s+Sommerreifen\s+<\/label>\s+<\/div>\n\n\s+\{formData\.hasSummerTires && \(/,
  '$1{formData.vehicleType !== \'MOTORCYCLE\' && (\n                  <input\n                    type="checkbox"\n                    id="hasSummerTires"\n                    name="hasSummerTires"\n                    checked={formData.hasSummerTires}\n                    onChange={handleChange}\n                    className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"\n                  />\n                )}\n                <label htmlFor="hasSummerTires" className={`${formData.vehicleType !== \'MOTORCYCLE\' ? \'ml-3\' : \'\'} text-lg font-semibold text-gray-900 flex items-center`}>\n                  <span className="text-2xl mr-2">{formData.vehicleType === \'MOTORCYCLE\' ? \'🏍️\' : \'☀️\'}</span>\n                  {formData.vehicleType === \'MOTORCYCLE\' ? \'Reifengrößen\' : \'Sommerreifen\'}\n                </label>\n              </div>\n\n              {(formData.vehicleType === \'MOTORCYCLE\' || formData.hasSummerTires) && ('
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✓ All modifications applied successfully');
