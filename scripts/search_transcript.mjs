import fs from 'fs'
import readline from 'readline'

const fileStream = fs.createReadStream('C:/Users/User/.gemini/antigravity/brain/2082e158-a11e-4a08-87c8-a332f8f9b469/.system_generated/logs/transcript.jsonl')

const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
})

let found = []

rl.on('line', (line) => {
  if (line.includes('Callisto') || line.includes('monthly_rates') || line.includes('τιμές') || line.includes('τιμη') || line.includes('Ιανουάριος')) {
    try {
      const obj = JSON.parse(line)
      if (obj.content && (obj.content.includes('Callisto') || obj.content.includes('Ιανουάριος') || obj.content.includes('120') || obj.content.includes('85') || obj.content.includes('70') || obj.content.includes('Ιούλιος'))) {
        found.push(obj.content.slice(0, 300))
      }
    } catch {}
  }
})

rl.on('close', () => {
  console.log('FOUND LINES COUNT:', found.length)
  console.log('SAMPLES:', found.slice(-5))
})
