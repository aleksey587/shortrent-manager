import fs from 'fs';

const content = fs.readFileSync('C:\\Users\\User\\.gemini\\antigravity\\brain\\2082e158-a11e-4a08-87c8-a332f8f9b469\\.system_generated\\steps\\1248\\content.md', 'utf8');

// Search for price strings, currency strings, cleaning fee
const regex = /(?:cleaning_fee|cleaningFee|price_per_night|priceString|accessibilityLabel|nightly_price|formattedPrice|qualifier|rate|amount)[^,}]{1,100}/gi;
let match;
const matches = [];
while ((match = regex.exec(content)) !== null) {
  matches.push(match[0]);
  if (matches.length > 50) break;
}
console.log('Matches:', matches.slice(0, 30));

// Also search for any "€[0-9]+"
const euroRegex = /€\s*[0-9]+(?:\.[0-9]+)?/g;
const euroMatches = content.match(euroRegex) || [];
console.log('Euro occurrences:', [...new Set(euroMatches)]);
