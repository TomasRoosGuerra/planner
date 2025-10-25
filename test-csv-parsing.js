// Test the CSV parsing with your specific file
const testCSV = `=== AVAILABLE ITEMS ===
Item,Quantity
"Skriva skogsmulle","1"
"Lära mig japanska","1"
"Dammsuga lägenhet → förbereda dammsugare","1"

=== REPEATED ITEMS ===
Item,Frequency
"Meal prep","Weekly"
"Writing","2 days"`;

console.log("Testing CSV parsing...");
const lines = testCSV.split("\n");
console.log("Lines:", lines);

// Test the parseCSVLine function
function parseCSVLine(line) {
  const matches = line.match(/"([^"]+)"/g);
  if (matches && matches.length >= 2) {
    return [matches[0].slice(1, -1), matches[1].slice(1, -1)];
  }
  return [null, null];
}

// Test parsing
lines.forEach((line, i) => {
  if (line.includes('"Skriva skogsmulle"')) {
    const result = parseCSVLine(line);
    console.log("Parse result for Swedish item:", result);
  }
  if (line.includes('"Dammsuga lägenhet → förbereda dammsugare"')) {
    const result = parseCSVLine(line);
    console.log("Parse result for sub-item:", result);
  }
});
