import { readFileSync } from 'fs';
const PAT = process.env.SUPABASE_MANAGEMENT_TOKEN;
if (!PAT) { console.error('Set SUPABASE_MANAGEMENT_TOKEN env var'); process.exit(1); }
const sql = readFileSync('scripts/fix-quotation-rls.sql', 'utf8');
const payload = JSON.stringify({ query: sql });
const resp = await fetch('https://api.supabase.com/v1/projects/uraamzowxkffonnscfep/database/query', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${PAT}`,
    'Content-Type': 'application/json',
  },
  body: payload,
});
console.log('Status:', resp.status);
const text = await resp.text();
console.log('Response:', text);
