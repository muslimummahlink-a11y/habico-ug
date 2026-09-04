const fs = require('fs');
const sql = `
INSERT INTO public.quotations (id, company_id, quotation_number, client_name, client_email, client_phone, title, description, status, subtotal, tax_rate, tax_amount, discount_amount, total_amount, valid_until, notes, terms_and_conditions) VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'f9e48e5a-6dfd-43c8-a247-a05b3a2557f4', 'QT-2026-001', 'Mukono District Local Government', 'procurement@mukono.go.ug', '+256-772-123456', 'Construction of 3-Classroom Block at Mukono Primary School', 'Design, construction, and finishing of a single-story 3-classroom block with store, staff room, and external works including drainage and fencing.', 'sent', 185000000, 18, 33300000, 5000000, 213300000, '2026-08-31', 'This quotation includes all materials, labor, and supervision. Site handover within 6 months of signing.', '1. Payment: 30% advance, 40% at structural completion, 30% at handover. 2. Validity: 60 days from date of issue. 3. Warranty: 12-month defects liability. 4. Variation orders must be agreed in writing. 5. Contractor to maintain comprehensive insurance.');

INSERT INTO public.quotation_items (quotation_id, description, quantity, unit_price, amount) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Site clearance and preparation', 1, 8500000, 8500000),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Foundation works (mass concrete + reinforced)', 1, 25000000, 25000000),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Masonry superstructure (walls, columns, beams)', 1, 45000000, 45000000),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Roofing works (timber trusses + iron sheets)', 1, 28000000, 28000000),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Floor finishing (terrazzo + tiling)', 1, 22000000, 22000000),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Doors, windows, and hardware', 1, 15000000, 15000000),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Plumbing and drainage works', 1, 12000000, 12000000),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Electrical installation (wiring, fittings, DB)', 1, 10000000, 10000000),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'External works (drainage, fencing, landscaping)', 1, 14500000, 14500000),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Painting and decoration (internal + external)', 1, 5000000, 5000000),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Project management and supervision', 1, 9500000, 9500000);
`;
fs.writeFileSync('C:/Users/user/AppData/Local/Temp/opencode/quotation_seed.json', JSON.stringify({query: sql}));
console.log('OK', sql.length);
