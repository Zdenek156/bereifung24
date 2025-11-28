const fs = require('fs');

const filePath = 'app/dashboard/customer/vehicles/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');
let lines = content.split('\n');

// Step 1: Change Summer label for Edit Modal (around line 801-803)
for (let i = 0; i < 1000; i++) {
  if (lines[i].includes('Sommerreifen') && lines[i].includes('</label>') && i > 700) {
    lines[i-1] = '                  <span className="text-2xl mr-2">{formData.vehicleType === \'MOTORCYCLE\' ? \'🏍️\' : \'☀️\'}</span>';
    lines[i] = '                  {formData.vehicleType === \'MOTORCYCLE\' ? \'Reifengrößen\' : \'Sommerreifen\'}';
    console.log(`Updated Summer label at line ${i}`);
    break;
  }
}

// Step 2: Wrap Winter section for Edit Modal
for (let i = 0; i < 1100; i++) {
  if (lines[i].includes('{/* Winter Tires */}')) {
    lines[i] = '            {/* Winter Tires - Hidden for motorcycles */}\n            {formData.vehicleType !== \'MOTORCYCLE\' && (';
    console.log(`Wrapped Winter opening at line ${i}`);
    break;
  }
}

// Step 3: Close Winter, open All Season for Edit Modal
for (let i = 0; i < 1200; i++) {
  if (lines[i].includes('{/* All Season Tires */}')) {
    lines[i] = '            )}\n\n            {/* All Season Tires - Hidden for motorcycles */}\n            {formData.vehicleType !== \'MOTORCYCLE\' && (';
    console.log(`Closed Winter, opened All Season at line ${i}`);
    break;
  }
}

// Step 4: Close All Season before Footer for Edit Modal - find the closing </div> before Footer
for (let i = 1150; i < 1200; i++) {
  if (lines[i].includes('{/* Footer */}')) {
    // Insert closing before Footer comment, after the previous </div>
    lines.splice(i, 0, '            )}', '');
    console.log(`Closed All Season at line ${i}`);
    break;
  }
}

// Step 5: Change Summer label for Add Modal (around line 1620)
for (let i = 1500; i < 2000; i++) {
  if (lines[i].includes('Sommerreifen') && lines[i].includes('</label>')) {
    lines[i-1] = '                  <span className="text-2xl mr-2">{formData.vehicleType === \'MOTORCYCLE\' ? \'🏍️\' : \'☀️\'}</span>';
    lines[i] = '                  {formData.vehicleType === \'MOTORCYCLE\' ? \'Reifengrößen\' : \'Sommerreifen\'}';
    console.log(`Updated Summer label for Add Modal at line ${i}`);
    break;
  }
}

// Step 6: Wrap Winter section for Add Modal
for (let i = 1600; i < 2000; i++) {
  if (lines[i].includes('{/* Winter Tires */}')) {
    lines[i] = '            {/* Winter Tires - Hidden for motorcycles */}\n            {formData.vehicleType !== \'MOTORCYCLE\' && (';
    console.log(`Wrapped Winter opening for Add Modal at line ${i}`);
    break;
  }
}

// Step 7: Close Winter, open All Season for Add Modal
for (let i = 1700; i < 2000; i++) {
  if (lines[i].includes('{/* All Season Tires */}')) {
    lines[i] = '            )}\n\n            {/* All Season Tires - Hidden for motorcycles */}\n            {formData.vehicleType !== \'MOTORCYCLE\' && (';
    console.log(`Closed Winter, opened All Season for Add Modal at line ${i}`);
    break;
  }
}

// Step 8: Close All Season before Submit Button for Add Modal
for (let i = 1900; i < 2100; i++) {
  if (lines[i].includes('{/* Submit Button */}')) {
    lines.splice(i, 0, '            )}', '');
    console.log(`Closed All Season for Add Modal at line ${i}`);
    break;
  }
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('\n✅ All modifications completed successfully!');
