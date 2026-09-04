import { readFileSync, writeFileSync, statSync } from "fs";

const raw = JSON.parse(readFileSync(`${process.env.TEMP}/uganda_dataset.json`, "utf8"));

// Use (district, subcounty) as key, and for duplicate parishes merge village lists
const parishesBySubcounty = {};
const villagesByParish = {};

for (const district of raw.districts) {
  const d = district.district;
  if (!parishesBySubcounty[d]) parishesBySubcounty[d] = {};
  if (!villagesByParish[d]) villagesByParish[d] = {};

  for (const constituency of district.data) {
    for (const sub of constituency.data) {
      const s = sub.subcounty;
      if (!parishesBySubcounty[d][s]) parishesBySubcounty[d][s] = [];
      if (!villagesByParish[d][s]) villagesByParish[d][s] = {};

      for (const p of sub.data) {
        const parishName = p.parish;
        // Only add to parishes list once
        if (!villagesByParish[d][s][parishName]) {
          parishesBySubcounty[d][s].push(parishName);
          villagesByParish[d][s][parishName] = [];
        }
        // Merge village lists for duplicate parishes
        for (const v of p.villages) {
          if (!villagesByParish[d][s][parishName].includes(v)) {
            villagesByParish[d][s][parishName].push(v);
          }
        }
      }
    }
  }
}

const outDir = "src/data";
writeFileSync(`${outDir}/uganda-parishes.json`, JSON.stringify(parishesBySubcounty), "utf8");
writeFileSync(`${outDir}/uganda-villages.json`, JSON.stringify(villagesByParish), "utf8");

let parishCount = 0;
let villageCount = 0;
for (const d of Object.keys(parishesBySubcounty)) {
  for (const s of Object.keys(parishesBySubcounty[d])) {
    parishCount += parishesBySubcounty[d][s].length;
    const vp = villagesByParish[d][s];
    for (const p of Object.keys(vp)) {
      villageCount += vp[p].length;
    }
  }
}
console.log(`Parishes: ${parishCount}`);
console.log(`Villages: ${villageCount}`);

const pSize = statSync(`${outDir}/uganda-parishes.json`).size;
const vSize = statSync(`${outDir}/uganda-villages.json`).size;
console.log(`Parishes file: ${(pSize / 1024).toFixed(0)} KB`);
console.log(`Villages file: ${(vSize / 1024).toFixed(0)} KB`);
