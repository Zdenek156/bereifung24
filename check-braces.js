const fs = require('fs')
const content = fs.readFileSync('app/page.tsx', 'utf8')
const lines = content.split('\n')
let depth = 0
for (let i = 99; i < 1812; i++) {
  const line = lines[i]
  let opens = 0, closes = 0
  // Simple brace counting (ignoring strings/comments for speed)
  for (const ch of line) {
    if (ch === '{') opens++
    if (ch === '}') closes++
  }
  depth += opens - closes
  if (i >= 1805 || depth <= 0) {
    console.log(`L${i + 1} depth=${depth}: ${line.substring(0, 100)}`)
  }
}
console.log(`\nFinal depth at L1812: ${depth}`)
