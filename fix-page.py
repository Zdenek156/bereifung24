import re

with open('app/dashboard/customer/vehicles/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Track changes
changes = []

# 1. Edit Modal: Hide checkbox for motorcycles in Summer section (around line 793)
old1 = r'''(\[EDIT_MODAL\][\s\S]*?{/\* Summer Tires \*/}\s+<div className="border-t pt-6">\s+<div className="flex items-center mb-4">\s+)<input\s+type="checkbox"\s+id="hasSummerTires"\s+name="hasSummerTires"\s+checked=\{formData\.hasSummerTires\}\s+onChange=\{handleChange\}\s+className="[^"]+"\s+/>\s+<label htmlFor="hasSummerTires" className="ml-3 text-lg font-semibold text-gray-900 flex items-center">\s+<span className="text-2xl mr-2">\{formData\.vehicleType === 'MOTORCYCLE' \? '🏍️' : '☀️'\}</span>\s+\{formData\.vehicleType === 'MOTORCYCLE' \? 'Reifengrößen' : 'Sommerreifen'\}\s+</label>\s+</div>\s+\n\s+\{formData\.hasSummerTires && \('''

new1 = r'''\1{formData.vehicleType !== 'MOTORCYCLE' && (
                  <input
                    type="checkbox"
                    id="hasSummerTires"
                    name="hasSummerTires"
                    checked={formData.hasSummerTires}
                    onChange={handleChange}
                    className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                )}
                <label htmlFor="hasSummerTires" className={`${formData.vehicleType !== 'MOTORCYCLE' ? 'ml-3' : ''} text-lg font-semibold text-gray-900 flex items-center`}>
                  <span className="text-2xl mr-2">{formData.vehicleType === 'MOTORCYCLE' ? '🏍️' : '☀️'}</span>
                  {formData.vehicleType === 'MOTORCYCLE' ? 'Reifengrößen' : 'Sommerreifen'}
                </label>
              </div>

              {(formData.vehicleType === 'MOTORCYCLE' || formData.hasSummerTires) && ('''

if re.search(old1, content):
    content = re.sub(old1, new1, content, count=1)
    changes.append("Edit Modal: Summer section checkbox hidden for motorcycles")
else:
    print("ERROR: Edit Modal Summer pattern not found!")

# 2. Edit Modal: Wrap Winter section
pattern2_search = r'(\[EDIT_MODAL\][\s\S]*?)\n\s+{/\* Winter Tires \*/}\s+\n\s+<div className="border-t pt-6">'
pattern2_replace = r'\1\n\n            {/* Winter Tires (not used for motorcycles) */}\n            {formData.vehicleType !== \'MOTORCYCLE\' && (\n            <div className="border-t pt-6">'

if re.search(pattern2_search, content):
    content = re.sub(pattern2_search, pattern2_replace, content, count=1)
    changes.append("Edit Modal: Winter section wrapped with conditional")
else:
    print("ERROR: Edit Modal Winter start pattern not found!")

# 3. Edit Modal: Close Winter and open All Season
pattern3_search = r'(\[EDIT_MODAL\][\s\S]*?Winter Tires[\s\S]*?              }\n            </div>\n)\n(\s+{/\* All Season Tires \*/}\s+\n\s+<div className="border-t pt-6">)'
pattern3_replace = r'\1            )}\n\n            {/* All Season Tires (not used for motorcycles) */}\n            {formData.vehicleType !== \'MOTORCYCLE\' && (\n            <div className="border-t pt-6">'

if re.search(pattern3_search, content):
    content = re.sub(pattern3_search, pattern3_replace, content, count=1)
    changes.append("Edit Modal: Winter closed, All Season wrapped")
else:
    print("ERROR: Edit Modal Winter/All Season transition not found!")

# 4. Edit Modal: Close All Season before Footer
pattern4_search = r'(\[EDIT_MODAL\][\s\S]*?All Season Tires[\s\S]*?              }\n            </div>\n          </div>\n)\n(\s+{/\* Modal Footer \*/})'
pattern4_replace = r'\1            )}\n          </div>\n\n\2'

if re.search(pattern4_search, content):
    content = re.sub(pattern4_search, pattern4_replace, content, count=1)
    changes.append("Edit Modal: All Season closed before footer")
else:
    print("ERROR: Edit Modal All Season close not found!")

# Now repeat for ADD Modal...
# 5. Add Modal: Hide checkbox
old5 = r'''(\[ADD_MODAL\][\s\S]*?{/\* Summer Tires \*/}\s+<div className="border-t pt-6">\s+<div className="flex items-center mb-4">\s+)<input\s+type="checkbox"\s+id="hasSummerTires"\s+name="hasSummerTires"\s+checked=\{formData\.hasSummerTires\}\s+onChange=\{handleChange\}\s+className="[^"]+"\s+/>\s+<label htmlFor="hasSummerTires" className="ml-3 text-lg font-semibold text-gray-900 flex items-center">\s+<span className="text-2xl mr-2">☀️</span>\s+Sommerreifen\s+</label>\s+</div>\s+\n\s+\{formData\.hasSummerTires && \('''

new5 = r'''\1{formData.vehicleType !== 'MOTORCYCLE' && (
                  <input
                    type="checkbox"
                    id="hasSummerTires"
                    name="hasSummerTires"
                    checked={formData.hasSummerTires}
                    onChange={handleChange}
                    className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                )}
                <label htmlFor="hasSummerTires" className={`${formData.vehicleType !== 'MOTORCYCLE' ? 'ml-3' : ''} text-lg font-semibold text-gray-900 flex items-center`}>
                  <span className="text-2xl mr-2">{formData.vehicleType === 'MOTORCYCLE' ? '🏍️' : '☀️'}</span>
                  {formData.vehicleType === 'MOTORCYCLE' ? 'Reifengrößen' : 'Sommerreifen'}
                </label>
              </div>

              {(formData.vehicleType === 'MOTORCYCLE' || formData.hasSummerTires) && ('''

if re.search(old5, content):
    content = re.sub(old5, new5, content, count=1)
    changes.append("Add Modal: Summer section checkbox hidden for motorcycles")
else:
    print("ERROR: Add Modal Summer pattern not found!")

# 6. Add Modal: Wrap Winter
pattern6_search = r'(\[ADD_MODAL\][\s\S]*?)\n\s+{/\* Winter Tires \*/}\s+\n\s+<div className="border-t pt-6">'
pattern6_replace = r'\1\n\n            {/* Winter Tires (not used for motorcycles) */}\n            {formData.vehicleType !== \'MOTORCYCLE\' && (\n            <div className="border-t pt-6">'

if re.search(pattern6_search, content):
    content = re.sub(pattern6_search, pattern6_replace, content, count=1)
    changes.append("Add Modal: Winter section wrapped")
else:
    print("ERROR: Add Modal Winter start not found!")

# 7. Add Modal: Close Winter, open All Season
pattern7_search = r'(\[ADD_MODAL\][\s\S]*?Winter Tires[\s\S]*?              }\n            </div>\n)\n(\s+{/\* All Season Tires \*/}\s+\n\s+<div className="border-t pt-6">)'
pattern7_replace = r'\1            )}\n\n            {/* All Season Tires (not used for motorcycles) */}\n            {formData.vehicleType !== \'MOTORCYCLE\' && (\n            <div className="border-t pt-6">'

if re.search(pattern7_search, content):
    content = re.sub(pattern7_search, pattern7_replace, content, count=1)
    changes.append("Add Modal: Winter closed, All Season wrapped")
else:
    print("ERROR: Add Modal Winter/All Season transition not found!")

# 8. Add Modal: Close All Season
pattern8_search = r'(\[ADD_MODAL\][\s\S]*?All Season Tires[\s\S]*?              }\n            </div>\n          </div>\n)\n(\s+{/\* Modal Footer \*/})'
pattern8_replace = r'\1            )}\n          </div>\n\n\2'

if re.search(pattern8_search, content):
    content = re.sub(pattern8_search, pattern8_replace, content, count=1)
    changes.append("Add Modal: All Season closed")
else:
    print("ERROR: Add Modal All Season close not found!")

# Write back
with open('app/dashboard/customer/vehicles/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\n✓ Applied {len(changes)} changes:")
for change in changes:
    print(f"  - {change}")
