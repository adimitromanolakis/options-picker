import { readFileSync } from 'fs';

const csvText = readFileSync(new URL('../public/option_data.csv', import.meta.url), 'utf-8');

const { readCSVOptionsData } = await import('../src/lib/csvreader.js');

const chains = readCSVOptionsData(csvText);

console.error(`Parsed ${chains.length} expirations:`);
for (const chain of chains) {
  console.error(`  ${chain.date} (DTE: ${chain.dte}) — ${chain.contracts.length} strikes`);
}

console.error(`\nFull JSON:\n`);
console.log(JSON.stringify(chains, null, 2));
