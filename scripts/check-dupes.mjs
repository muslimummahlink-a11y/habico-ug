import { readFileSync } from "fs";

const raw = JSON.parse(readFileSync(`${process.env.TEMP}/uganda_dataset.json`, "utf8"));

// Check for duplicate subcounty names within the same district
let totalSubs = 0;
let dupSubs = 0;
const subCounts = {};

// Check for duplicate parish names within the same subcounty+district
let dupParishes = 0;

for (const district of raw.districts) {
  const d = district.district;
  if (!subCounts[d]) subCounts[d] = {};

  for (const constituency of district.data) {
    for (const sub of constituency.data) {
      const s = sub.subcounty;
      totalSubs++;

      // Track subcounty occurrences within district
      if (!subCounts[d][s]) {
        subCounts[d][s] = { count: 0, constituencies: [] };
      }
      subCounts[d][s].count++;
      subCounts[d][s].constituencies.push(constituency.constituency);

      // Track parishes within subcounty
      const seenParishes = {};
      for (const p of sub.data) {
        if (seenParishes[p.parish]) {
          dupParishes++;
          console.log(`DUP PARISH: ${p.parish} in ${d} > ${s}`);
        }
        seenParishes[p.parish] = true;
      }
    }
  }
}

// Show subcounties that appear multiple times in the same district
for (const d of Object.keys(subCounts)) {
  for (const s of Object.keys(subCounts[d])) {
    if (subCounts[d][s].count > 1) {
      dupSubs++;
      console.log(`DUP SUb: "${s}" appears ${subCounts[d][s].count}x in ${d}: ${subCounts[d][s].constituencies.join(", ")}`);
    }
  }
}

console.log(`\nTotal subcounty entries: ${totalSubs}`);
console.log(`Duplicate subcounties (same district): ${dupSubs}`);
console.log(`Duplicate parishes (same subcounty): ${dupParishes}`);
