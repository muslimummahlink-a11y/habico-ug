-- =============================================================
-- CONSTRUCTION SEED DATA (plain SQL, no DO block)
-- Run in Supabase SQL Editor
-- =============================================================

-- UUIDs are hardcoded so all FK references resolve correctly
-- Format: aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001 (incrementing)

-- ========== EXPENSE CATEGORIES ==========
-- Company ID for all seeded data
-- Run this AFTER seed if company_id is not set:
-- UPDATE TABLE SET company_id = 'f9e48e5a-6dfd-43c8-a247-a05b3a2557f4' WHERE company_id IS NULL;

INSERT INTO expense_categories (id, name, description, color) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Materials', 'Building materials and supplies', '#3B82F6'),
  ('00000000-0000-0000-0000-000000000002', 'Labour', 'Worker wages and salaries', '#10B981'),
  ('00000000-0000-0000-0000-000000000003', 'Equipment', 'Equipment rental and purchase', '#F59E0B'),
  ('00000000-0000-0000-0000-000000000004', 'Transport', 'Logistics and transport costs', '#8B5CF6'),
  ('00000000-0000-0000-0000-000000000005', 'Permits & Fees', 'Government permits and regulatory fees', '#EF4444'),
  ('00000000-0000-0000-0000-000000000006', 'Utilities', 'Water, electricity, internet at site', '#EC4899'),
  ('00000000-0000-0000-0000-000000000007', 'Subcontractor', 'Subcontracted work', '#14B8A6'),
  ('00000000-0000-0000-0000-000000000008', 'Miscellaneous', 'Other project costs', '#6B7280')
ON CONFLICT DO NOTHING;

-- ========== COST CODES ==========
INSERT INTO cost_codes (id, code, name, description, category) VALUES
  ('00000000-0000-0000-0000-000000000011', '01-000', 'General Requirements', 'General project requirements', 'general'),
  ('00000000-0000-0000-0000-000000000012', '02-000', 'Site Work', 'Site preparation and excavation', 'site'),
  ('00000000-0000-0000-0000-000000000013', '03-000', 'Concrete', 'Concrete work', 'structure'),
  ('00000000-0000-0000-0000-000000000014', '04-000', 'Masonry', 'Block work, brickwork', 'structure'),
  ('00000000-0000-0000-0000-000000000015', '05-000', 'Metals', 'Structural steel, rebar', 'structure'),
  ('00000000-0000-0000-0000-000000000016', '06-000', 'Wood & Plastics', 'Carpentry, millwork', 'finishes'),
  ('00000000-0000-0000-0000-000000000017', '07-000', 'Thermal & Moisture', 'Roofing, waterproofing', 'envelope'),
  ('00000000-0000-0000-0000-000000000018', '08-000', 'Doors & Windows', 'Door and window systems', 'finishes'),
  ('00000000-0000-0000-0000-000000000019', '09-000', 'Finishes', 'Drywall, painting, flooring', 'finishes'),
  ('00000000-0000-0000-0000-000000000020', '10-000', 'Specialties', 'Signage, lockers', 'specialties'),
  ('00000000-0000-0000-0000-000000000021', '15-000', 'Plumbing', 'Plumbing fixtures and piping', 'mechanical'),
  ('00000000-0000-0000-0000-000000000022', '16-000', 'Electrical', 'Wiring, panels, fixtures', 'electrical'),
  ('00000000-0000-0000-0000-000000000023', '17-000', 'HVAC', 'Heating, ventilation, AC', 'mechanical'),
  ('00000000-0000-0000-0000-000000000024', '18-000', 'Fire Protection', 'Sprinklers, fire alarms', 'mechanical'),
  ('00000000-0000-0000-0000-000000000025', '19-000', 'Earthworks', 'Excavation, grading', 'site'),
  ('00000000-0000-0000-0000-000000000026', '20-000', 'Landscaping', 'Grounds, planting', 'site')
ON CONFLICT (code) DO NOTHING;

-- ========== EMPLOYEES ==========
INSERT INTO employees (id, full_name, phone, email, role, employee_type, department, daily_rate, monthly_salary, status, hire_date, national_id) VALUES
  ('00000000-0000-0000-0000-000000000031', 'John Mwangi', '+256 700 111 001', 'john.mwangi@constr.ug', 'supervisor', 'full_time', 'Site Management', 80000, 1800000, 'active', CURRENT_DATE - INTERVAL '365 days', 'CM123456'),
  ('00000000-0000-0000-0000-000000000032', 'Sarah Nakato', '+256 700 111 002', 'sarah.nakato@constr.ug', 'manager', 'full_time', 'Project Management', 120000, 3000000, 'active', CURRENT_DATE - INTERVAL '730 days', 'CM234567'),
  ('00000000-0000-0000-0000-000000000033', 'Peter Okello', '+256 700 111 003', 'peter.okello@constr.ug', 'worker', 'full_time', 'Masonry', 50000, 1200000, 'active', CURRENT_DATE - INTERVAL '180 days', 'CM345678'),
  ('00000000-0000-0000-0000-000000000034', 'Grace Tumusiime', '+256 700 111 004', 'grace.tumusiime@constr.ug', 'worker', 'full_time', 'Carpentry', 50000, 1200000, 'active', CURRENT_DATE - INTERVAL '200 days', 'CM456789'),
  ('00000000-0000-0000-0000-000000000035', 'David Ssempijja', '+256 700 111 005', 'david.ssempijja@constr.ug', 'worker', 'full_time', 'Electrical', 55000, 1300000, 'active', CURRENT_DATE - INTERVAL '250 days', 'CM567890'),
  ('00000000-0000-0000-0000-000000000036', 'Alice Nambooze', '+256 700 111 006', 'alice.nambooze@constr.ug', 'worker', 'full_time', 'Plumbing', 55000, 1300000, 'active', CURRENT_DATE - INTERVAL '150 days', 'CM678901'),
  ('00000000-0000-0000-0000-000000000037', 'Robert Kato', '+256 700 111 007', 'robert.kato@constr.ug', 'contractor', 'contract', 'Steel Work', 70000, 0, 'active', CURRENT_DATE - INTERVAL '90 days', 'CM789012'),
  ('00000000-0000-0000-0000-000000000038', 'Jennifer Akello', '+256 700 111 008', 'jennifer.akello@constr.ug', 'worker', 'full_time', 'Finishing', 45000, 1000000, 'active', CURRENT_DATE - INTERVAL '120 days', 'CM890123'),
  ('00000000-0000-0000-0000-000000000039', 'Samuel Wasswa', '+256 700 111 009', 'samuel.wasswa@constr.ug', 'worker', 'full_time', 'General Labour', 35000, 800000, 'active', CURRENT_DATE - INTERVAL '60 days', 'CM901234'),
  ('00000000-0000-0000-0000-000000000040', 'Diana Kyomugisha', '+256 700 111 010', 'diana.kyomugisha@constr.ug', 'supervisor', 'full_time', 'Quality Control', 85000, 2000000, 'active', CURRENT_DATE - INTERVAL '300 days', 'CM012345')
ON CONFLICT DO NOTHING;

-- ========== SUPPLIERS ==========
INSERT INTO suppliers (id, name, contact_person, phone, email, category, payment_terms, tax_id, status) VALUES
  ('00000000-0000-0000-0000-000000000041', 'RoofMart Uganda Ltd', 'James Kintu', '+256 700 200 001', 'info@roofmart.ug', 'materials', 'Net 30', 'TIN10001', 'active'),
  ('00000000-0000-0000-0000-000000000042', 'SteelPro East Africa', 'Grace Amongin', '+256 700 200 002', 'sales@steelpro.co.ug', 'materials', 'Net 45', 'TIN10002', 'active'),
  ('00000000-0000-0000-0000-000000000043', 'BuildHard Ware Ltd', 'Moses Mukasa', '+256 700 200 003', 'orders@buildhard.ug', 'materials', 'Net 30', 'TIN10003', 'active'),
  ('00000000-0000-0000-0000-000000000044', 'Kampala Cement Distributors', 'Hajji Ssewanyana', '+256 700 200 004', 'cement@kcd.co.ug', 'materials', 'COD', 'TIN10004', 'active'),
  ('00000000-0000-0000-0000-000000000045', 'Prime Plumbing Supplies', 'Faith Nalwoga', '+256 700 200 005', 'info@primeplumbing.ug', 'materials', 'Net 30', 'TIN10005', 'active'),
  ('00000000-0000-0000-0000-000000000046', 'Eagle Electricals Ltd', 'Paul Mugisha', '+256 700 200 006', 'sales@eagleelec.ug', 'materials', 'Net 45', 'TIN10006', 'active'),
  ('00000000-0000-0000-0000-000000000047', 'SiteSafe Logistics', 'Hannah Nakibuule', '+256 700 200 007', 'dispatch@sitesafe.ug', 'transport', 'Net 15', 'TIN10007', 'active'),
  ('00000000-0000-0000-0000-000000000048', 'Precision Tools & Equipment', 'Isaac Kizza', '+256 700 200 008', 'rent@precisiontools.ug', 'equipment', 'Net 30', 'TIN10008', 'active')
ON CONFLICT DO NOTHING;

-- ========== PROJECTS ==========
INSERT INTO projects (id, name, description, location, status, start_date, target_end_date, budget, total_spent, client_name, client_phone, client_email, notes) VALUES
  ('00000000-0000-0000-0000-000000000101', 'Ntinda Heights Apartment Block',
   '4-storey luxury apartment block with 12 units, rooftop terrace, and basement parking.',
   'Ntinda, Kampala', 'in_progress',
   CURRENT_DATE - INTERVAL '120 days', CURRENT_DATE + INTERVAL '240 days',
   8500000000, 2100000000,
   'Victoria Properties Ltd', '+256 701 500 001', 'enquiries@victoriaproperties.ug',
   'Flagship project. High-end finishes.'),
  ('00000000-0000-0000-0000-000000000102', 'Kyambogo University Science Block',
   '3-storey science building with 8 classrooms, 4 labs, and a lecture hall.',
   'Kyambogo University Campus', 'in_progress',
   CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE + INTERVAL '300 days',
   6200000000, 1100000000,
   'Kyambogo University', '+256 414 500 002', 'procurement@kyambogo.ac.ug',
   'Government contract. PPDA rules apply.'),
  ('00000000-0000-0000-0000-000000000103', 'Luzira Waterfront Villa',
   'Luxury 5-bedroom residence with swimming pool, landscaped garden, and guest house.',
   'Luzira, Kampala', 'planning',
   CURRENT_DATE + INTERVAL '30 days', CURRENT_DATE + INTERVAL '210 days',
   3200000000, 0,
   'Dr. Andrew Mubiru', '+256 702 500 003', 'andrew.mubiru@email.com',
   'Private client. Architect-designed.'),
  ('00000000-0000-0000-0000-000000000104', 'Bukoto Commercial Plaza',
   'Mixed-use: 2 floors retail, 3 floors office, rooftop restaurant.',
   'Bukoto, Kampala', 'on_hold',
   CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE + INTERVAL '275 days',
   7400000000, 450000000,
   'Mukwano Enterprises Ltd', '+256 703 500 004', 'commercial@mukwanogroup.co.ug',
   'On hold pending KCCA zoning approval.'),
  ('00000000-0000-0000-0000-000000000105', 'Entebbe Airport View Estate',
   'Gated community of 20 townhouses with community centre and playground.',
   'Entebbe, Wakiso', 'completed',
   CURRENT_DATE - INTERVAL '365 days', CURRENT_DATE - INTERVAL '15 days',
   12000000000, 11800000000,
   'Habico Real Estate Dev Ltd', '+256 704 500 005', 'developments@habico.ug',
   'Completed. 16/20 units sold.')
ON CONFLICT DO NOTHING;

-- ========== PROJECT BUDGETS ==========
INSERT INTO project_budgets (project_id, category, budgeted, committed, spent) VALUES
  ('00000000-0000-0000-0000-000000000101', 'Structural', 2800000000, 1200000000, 900000000),
  ('00000000-0000-0000-0000-000000000101', 'Finishes', 3500000000, 500000000, 200000000),
  ('00000000-0000-0000-0000-000000000101', 'MEP', 1500000000, 300000000, 150000000),
  ('00000000-0000-0000-0000-000000000101', 'Site & Foundation', 700000000, 650000000, 600000000),
  ('00000000-0000-0000-0000-000000000102', 'Structural', 2200000000, 800000000, 500000000),
  ('00000000-0000-0000-0000-000000000102', 'Lab Fit-out', 1800000000, 200000000, 50000000),
  ('00000000-0000-0000-0000-000000000102', 'Electrical', 900000000, 100000000, 30000000),
  ('00000000-0000-0000-0000-000000000103', 'Structural', 1200000000, 0, 0),
  ('00000000-0000-0000-0000-000000000103', 'Finishes', 1000000000, 0, 0),
  ('00000000-0000-0000-0000-000000000103', 'Landscaping & Pool', 600000000, 0, 0),
  ('00000000-0000-0000-0000-000000000104', 'Structural', 2500000000, 200000000, 150000000),
  ('00000000-0000-0000-0000-000000000104', 'Retail Fit-out', 2000000000, 0, 0),
  ('00000000-0000-0000-0000-000000000105', 'Structural', 4000000000, 3900000000, 3900000000),
  ('00000000-0000-0000-0000-000000000105', 'Finishes', 3800000000, 3700000000, 3700000000),
  ('00000000-0000-0000-0000-000000000105', 'Infrastructure', 2500000000, 2400000000, 2400000000);

-- ========== PROJECT TASKS ==========
INSERT INTO project_tasks (id, project_id, title, description, status, priority, due_date, estimated_hours, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101', 'Site clearing', 'Clear vegetation, level ground', 'done', 'high', CURRENT_DATE - INTERVAL '90 days', 160, 1),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000101', 'Foundation', 'Excavate and pour reinforced strip footings', 'done', 'high', CURRENT_DATE - INTERVAL '55 days', 320, 2),
  ('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000101', 'Ground floor slab + columns', 'Form, reinforce, and pour', 'in_progress', 'high', CURRENT_DATE + INTERVAL '10 days', 400, 3),
  ('00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000101', 'First floor structure', 'Slab, beams, and columns', 'in_progress', 'high', CURRENT_DATE + INTERVAL '50 days', 480, 4),
  ('00000000-0000-0000-0000-000000000205', '00000000-0000-0000-0000-000000000101', 'Roof structure', 'Steel trusses, roofing, waterproofing', 'todo', 'high', CURRENT_DATE + INTERVAL '100 days', 360, 5),
  ('00000000-0000-0000-0000-000000000206', '00000000-0000-0000-0000-000000000101', 'Internal walling & plaster', 'Block walls, plaster, screeding', 'todo', 'medium', CURRENT_DATE + INTERVAL '140 days', 640, 6),
  ('00000000-0000-0000-0000-000000000207', '00000000-0000-0000-0000-000000000101', 'Electrical rough-in', 'Conduits, wiring, back boxes', 'todo', 'medium', CURRENT_DATE + INTERVAL '150 days', 320, 7),
  ('00000000-0000-0000-0000-000000000208', '00000000-0000-0000-0000-000000000101', 'Floor & wall tiling', 'All wet areas', 'todo', 'medium', CURRENT_DATE + INTERVAL '180 days', 480, 8),
  ('00000000-0000-0000-0000-000000000209', '00000000-0000-0000-0000-000000000101', 'Painting & finishes', 'Emulsion, enamel, skirting', 'todo', 'low', CURRENT_DATE + INTERVAL '210 days', 400, 9),
  ('00000000-0000-0000-0000-000000000210', '00000000-0000-0000-0000-000000000101', 'Handover', 'Snag list, documents', 'todo', 'high', CURRENT_DATE + INTERVAL '240 days', 80, 10),
  ('00000000-0000-0000-0000-000000000211', '00000000-0000-0000-0000-000000000102', 'Demolition & site prep', 'Remove existing structure', 'done', 'high', CURRENT_DATE - INTERVAL '30 days', 120, 1),
  ('00000000-0000-0000-0000-000000000212', '00000000-0000-0000-0000-000000000102', 'Foundation & ground slab', 'Excavation, hardcore, reinforcement', 'in_progress', 'high', CURRENT_DATE + INTERVAL '20 days', 360, 2),
  ('00000000-0000-0000-0000-000000000213', '00000000-0000-0000-0000-000000000102', 'Superstructure to 2nd floor', 'Columns, beams, slabs', 'todo', 'high', CURRENT_DATE + INTERVAL '90 days', 720, 3),
  ('00000000-0000-0000-0000-000000000214', '00000000-0000-0000-0000-000000000102', 'Roofing & ceiling', 'Roof structure, ceiling grid', 'todo', 'medium', CURRENT_DATE + INTERVAL '130 days', 240, 4),
  ('00000000-0000-0000-0000-000000000215', '00000000-0000-0000-0000-000000000102', 'Laboratory fit-out', 'Lab benching, fume hoods, gas', 'todo', 'high', CURRENT_DATE + INTERVAL '220 days', 400, 5)
ON CONFLICT DO NOTHING;

-- ========== PROJECT SCHEDULES ==========
INSERT INTO project_schedules (project_id, title, start_date, end_date, milestone, status, progress, assignee) VALUES
  ('00000000-0000-0000-0000-000000000101', 'Ntinda — Site Preparation', CURRENT_DATE - INTERVAL '120 days', CURRENT_DATE - INTERVAL '90 days', false, 'completed', 100, 'John Mwangi'),
  ('00000000-0000-0000-0000-000000000101', 'Ntinda — Foundation', CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE - INTERVAL '45 days', false, 'completed', 100, 'John Mwangi'),
  ('00000000-0000-0000-0000-000000000101', 'Ntinda — Structural Frame', CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE + INTERVAL '60 days', false, 'in_progress', 45, 'John Mwangi'),
  ('00000000-0000-0000-0000-000000000101', 'Ntinda — Roofing', CURRENT_DATE + INTERVAL '60 days', CURRENT_DATE + INTERVAL '100 days', false, 'planned', 0, 'John Mwangi'),
  ('00000000-0000-0000-0000-000000000101', 'Ntinda — MEP Services', CURRENT_DATE + INTERVAL '80 days', CURRENT_DATE + INTERVAL '170 days', false, 'planned', 0, 'David Ssempijja'),
  ('00000000-0000-0000-0000-000000000101', 'Ntinda — Interior Finishes', CURRENT_DATE + INTERVAL '100 days', CURRENT_DATE + INTERVAL '210 days', false, 'planned', 0, 'Jennifer Akello'),
  ('00000000-0000-0000-0000-000000000101', 'Ntinda — Handover', CURRENT_DATE + INTERVAL '240 days', CURRENT_DATE + INTERVAL '240 days', true, 'planned', 0, 'Sarah Nakato'),
  ('00000000-0000-0000-0000-000000000102', 'Kyambogo — Demolition', CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE - INTERVAL '30 days', false, 'completed', 100, 'John Mwangi'),
  ('00000000-0000-0000-0000-000000000102', 'Kyambogo — Foundation', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '30 days', false, 'in_progress', 60, 'John Mwangi'),
  ('00000000-0000-0000-0000-000000000102', 'Kyambogo — Superstructure', CURRENT_DATE + INTERVAL '30 days', CURRENT_DATE + INTERVAL '130 days', false, 'planned', 0, 'John Mwangi'),
  ('00000000-0000-0000-0000-000000000105', 'Entebbe — Infrastructure', CURRENT_DATE - INTERVAL '365 days', CURRENT_DATE - INTERVAL '270 days', false, 'completed', 100, 'John Mwangi'),
  ('00000000-0000-0000-0000-000000000105', 'Entebbe — Phase 2 (Units 1-10)', CURRENT_DATE - INTERVAL '300 days', CURRENT_DATE - INTERVAL '100 days', false, 'completed', 100, 'John Mwangi'),
  ('00000000-0000-0000-0000-000000000105', 'Entebbe — Phase 3 (Units 11-20)', CURRENT_DATE - INTERVAL '230 days', CURRENT_DATE - INTERVAL '30 days', false, 'completed', 100, 'John Mwangi'),
  ('00000000-0000-0000-0000-000000000105', 'Entebbe — Community Centre', CURRENT_DATE - INTERVAL '180 days', CURRENT_DATE - INTERVAL '50 days', false, 'completed', 100, 'Grace Tumusiime'),
  ('00000000-0000-0000-0000-000000000105', 'Entebbe — Landscaping & Handover', CURRENT_DATE - INTERVAL '120 days', CURRENT_DATE - INTERVAL '15 days', false, 'completed', 100, 'Sarah Nakato');

-- ========== LEADS ==========
INSERT INTO leads (id, project_id, source, contact_name, contact_phone, contact_email, company, description, status, budget_range_min, budget_range_max) VALUES
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000101', 'referral', 'Margaret Kiyimba', '+256 705 300 001', 'mkiyimba@email.com', 'Kiyimba Holdings', 'Interested in 200sqm ground floor retail at Ntinda', 'qualified', 50000000, 150000000),
  ('00000000-0000-0000-0000-000000000302', NULL, 'website', 'Joseph Wasswa', '+256 705 300 002', 'jwasswa@gmail.com', NULL, 'New 3-bed bungalow in Kira. Needs design + build.', 'new', 300000000, 500000000),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000105', 'direct', 'Henry Mugerwa', '+256 705 300 003', 'henry@mugerwa.co.ug', 'Mugerwa & Sons Ltd', 'Wants units 7 and 8 at Entebbe View Estate', 'proposal', 600000000, 700000000),
  ('00000000-0000-0000-0000-000000000304', NULL, 'phone', 'Dr. Susan Nalule', '+256 705 300 004', 'snalule@med.ug', 'Nalule Medical Centre', 'Medical clinic fit-out 400sqm in Bugolobi', 'contacted', 200000000, 350000000),
  ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000102', 'website', 'Kyambogo VC Office', '+256 414 500 010', 'vc@kyambogo.ac.ug', 'Kyambogo University', 'Additional 2-storey annex (future)', 'qualified', 2000000000, 3000000000)
ON CONFLICT DO NOTHING;

-- ========== ESTIMATES + ITEMS ==========
INSERT INTO estimates (id, project_id, estimate_number, title, status, subtotal, tax_rate, tax_amount, total_amount, valid_until) VALUES
  ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000103', 'EST-2026-001', 'Luzira Villa — Structural Works', 'approved', 1250000000, 18, 225000000, 1475000000, CURRENT_DATE + INTERVAL '60 days'),
  ('00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000103', 'EST-2026-002', 'Luzira Villa — Finishes', 'draft', 980000000, 18, 176400000, 1156400000, CURRENT_DATE + INTERVAL '45 days'),
  ('00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000101', 'EST-2026-003', 'Ntinda Heights — Retail Fit-out', 'pending', 180000000, 18, 32400000, 212400000, CURRENT_DATE + INTERVAL '30 days')
ON CONFLICT DO NOTHING;

INSERT INTO estimate_items (estimate_id, description, quantity, unit_price, total_price) VALUES
  ('00000000-0000-0000-0000-000000000401', 'Excavation and earthworks', 1, 180000000, 180000000),
  ('00000000-0000-0000-0000-000000000401', 'Reinforced concrete foundation', 1, 320000000, 320000000),
  ('00000000-0000-0000-0000-000000000401', 'RC columns and beams (G+1)', 1, 450000000, 450000000),
  ('00000000-0000-0000-0000-000000000401', 'Roof structure (timber + clay tiles)', 1, 180000000, 180000000),
  ('00000000-0000-0000-0000-000000000402', 'Italian porcelain floor tiles (600x600)', 350, 185000, 64750000),
  ('00000000-0000-0000-0000-000000000402', 'Solid wood interior doors (mahogany)', 12, 2500000, 30000000),
  ('00000000-0000-0000-0000-000000000402', 'Custom kitchen cabinetry with granite', 1, 65000000, 65000000),
  ('00000000-0000-0000-0000-000000000403', 'Partition walls (drywall)', 80, 180000, 14400000),
  ('00000000-0000-0000-0000-000000000403', 'Floor screed and commercial vinyl', 200, 85000, 17000000);

-- ========== INVENTORY ITEMS ==========
INSERT INTO inventory_items (id, name, description, category, unit, quantity, min_stock_level, unit_cost, selling_price, supplier_id, location, sku) VALUES
  ('00000000-0000-0000-0000-000000000501', 'Ordinary Portland Cement', 'Hima 50kg bags', 'building_materials', 'bag', 450, 100, 32000, 34000, '00000000-0000-0000-0000-000000000044', 'warehouse', 'CEM-OPC-50'),
  ('00000000-0000-0000-0000-000000000502', 'Steel Reinforcement T12', '12mm high-yield rebar, 12m lengths', 'building_materials', 'piece', 200, 50, 85000, 92000, '00000000-0000-0000-0000-000000000042', 'warehouse', 'STL-T12-12M'),
  ('00000000-0000-0000-0000-000000000503', 'Clay Roofing Tiles', 'Terracotta interlocking tiles per m2', 'building_materials', 'm2', 850, 200, 45000, 52000, '00000000-0000-0000-0000-000000000041', 'warehouse', 'RUF-CLAY-M2'),
  ('00000000-0000-0000-0000-000000000504', 'PVC Pipes 110mm', 'Drain pipes, 6m lengths', 'plumbing', 'piece', 120, 30, 35000, 38000, '00000000-0000-0000-0000-000000000045', 'site_a', 'PLM-PVC110'),
  ('00000000-0000-0000-0000-000000000505', 'Armoured Cable 16mm2', '4-core SWA', 'electrical', 'meter', 500, 100, 12000, 13500, '00000000-0000-0000-0000-000000000046', 'warehouse', 'ELC-ARM16'),
  ('00000000-0000-0000-0000-000000000506', 'Ceramic Wall Tiles', 'White gloss 300x600mm per m2', 'building_materials', 'm2', 600, 150, 28000, 32000, '00000000-0000-0000-0000-000000000043', 'warehouse', 'TIL-WHT-3060'),
  ('00000000-0000-0000-0000-000000000507', 'Plasterboard 12mm', '2400x1200mm sheets', 'building_materials', 'sheet', 300, 80, 18000, 20000, '00000000-0000-0000-0000-000000000043', 'site_a', 'PLB-12-2412'),
  ('00000000-0000-0000-0000-000000000508', 'Copper Wire 2.5mm2', 'Single-core, 100m coil', 'electrical', 'roll', 45, 10, 85000, 92000, '00000000-0000-0000-0000-000000000046', 'warehouse', 'ELC-COPP25')
ON CONFLICT DO NOTHING;

-- ========== PURCHASE ORDERS + ITEMS ==========
INSERT INTO purchase_orders (id, order_number, supplier_id, project_id, status, order_date, expected_date, subtotal, total_amount, notes) VALUES
  ('00000000-0000-0000-0000-000000000601', 'PO-2026-0001', '00000000-0000-0000-0000-000000000044', '00000000-0000-0000-0000-000000000101', 'received', CURRENT_DATE - INTERVAL '110 days', CURRENT_DATE - INTERVAL '100 days', 10240000, 10240000, 'Cement for foundation'),
  ('00000000-0000-0000-0000-000000000602', 'PO-2026-0002', '00000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000101', 'received', CURRENT_DATE - INTERVAL '95 days', CURRENT_DATE - INTERVAL '90 days', 6800000, 6800000, 'Rebar T12/T16'),
  ('00000000-0000-0000-0000-000000000603', 'PO-2026-0003', '00000000-0000-0000-0000-000000000043', '00000000-0000-0000-0000-000000000102', 'ordered', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '10 days', 7200000, 7200000, 'Plasterboard and framing'),
  ('00000000-0000-0000-0000-000000000604', 'PO-2026-0004', '00000000-0000-0000-0000-000000000046', '00000000-0000-0000-0000-000000000102', 'pending', CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days', 2400000, 2400000, 'Electrical cable')
ON CONFLICT DO NOTHING;

INSERT INTO purchase_order_items (purchase_order_id, item_id, description, quantity, unit_price, total_price, received_quantity) VALUES
  ('00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000501', 'Hima OPC 50kg', 320, 32000, 10240000, 320),
  ('00000000-0000-0000-0000-000000000602', '00000000-0000-0000-0000-000000000502', 'T12 rebar 12m', 80, 85000, 6800000, 80),
  ('00000000-0000-0000-0000-000000000603', '00000000-0000-0000-0000-000000000507', 'Plasterboard 12mm', 150, 18000, 2700000, 0),
  ('00000000-0000-0000-0000-000000000603', NULL, 'Metal studs 70mm', 100, 45000, 4500000, 0),
  ('00000000-0000-0000-0000-000000000604', '00000000-0000-0000-0000-000000000505', '16mm2 4-core SWA (m)', 200, 12000, 2400000, 0);

-- ========== SUBCONTRACTS ==========
INSERT INTO subcontracts (id, contract_number, project_id, supplier_id, scope_of_work, contract_amount, start_date, end_date, status, retention_percent, paid_to_date) VALUES
  ('00000000-0000-0000-0000-000000000701', 'SUB-2026-001', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000047', 'Transport and logistics for material deliveries', 280000000, CURRENT_DATE - INTERVAL '110 days', CURRENT_DATE + INTERVAL '130 days', 'active', 5, 85000000),
  ('00000000-0000-0000-0000-000000000702', 'SUB-2026-002', '00000000-0000-0000-0000-000000000102', NULL, 'Steel structure fabrication and erection', 520000000, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '90 days', 'active', 5, 100000000),
  ('00000000-0000-0000-0000-000000000703', 'SUB-2026-003', '00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000041', 'Roofing works for Phase 3 townhouses', 380000000, CURRENT_DATE - INTERVAL '180 days', CURRENT_DATE - INTERVAL '60 days', 'completed', 5, 361000000)
ON CONFLICT DO NOTHING;

-- ========== CHANGE ORDERS ==========
INSERT INTO change_orders (id, change_order_number, project_id, title, status, amount, reason) VALUES
  ('00000000-0000-0000-0000-000000000801', 'CO-2026-001', '00000000-0000-0000-0000-000000000101', 'Additional basement waterproofing', 'approved', 185000000, 'Client requested full tanking membrane'),
  ('00000000-0000-0000-0000-000000000802', 'CO-2026-002', '00000000-0000-0000-0000-000000000105', 'Upgrade bathroom fittings in show units', 'approved', 28000000, 'Marketing upgrade')
ON CONFLICT DO NOTHING;

-- ========== BILLS ==========
INSERT INTO bills (id, bill_number, project_id, supplier_id, description, amount, due_date, status, paid_date) VALUES
  ('00000000-0000-0000-0000-000000000901', 'BILL-2026-001', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000044', 'Cement delivery 320 bags', 10240000, CURRENT_DATE - INTERVAL '5 days', 'paid', CURRENT_DATE - INTERVAL '2 days'),
  ('00000000-0000-0000-0000-000000000902', 'BILL-2026-002', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000042', 'Rebar 80 lengths', 6800000, CURRENT_DATE + INTERVAL '15 days', 'unpaid', NULL),
  ('00000000-0000-0000-0000-000000000903', 'BILL-2026-003', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000043', 'Framing materials', 7200000, CURRENT_DATE + INTERVAL '30 days', 'unpaid', NULL),
  ('00000000-0000-0000-0000-000000000904', 'BILL-2026-004', '00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000041', 'Roof tiles final installment', 11250000, CURRENT_DATE - INTERVAL '30 days', 'overdue', NULL)
ON CONFLICT DO NOTHING;

-- ========== INVOICES (Construction) ==========
INSERT INTO invoices (id, project_id, client_name, invoice_number, issue_date, due_date, status, subtotal, tax_rate, tax_amount, total_amount, amount_paid) VALUES
  ('00000000-0000-0000-0000-000000001001', '00000000-0000-0000-0000-000000000105', 'Henry Mugerwa', 'CINV-2026-001', CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE - INTERVAL '30 days', 'paid', 320000000, 18, 57600000, 377600000, 377600000),
  ('00000000-0000-0000-0000-000000001002', '00000000-0000-0000-0000-000000000105', 'Mugerwa & Sons Ltd', 'CINV-2026-002', CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE - INTERVAL '15 days', 'paid', 320000000, 18, 57600000, 377600000, 377600000),
  ('00000000-0000-0000-0000-000000001003', '00000000-0000-0000-0000-000000000105', 'Victoria Properties Ltd', 'CINV-2026-003', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'sent', 850000000, 18, 153000000, 1003000000, 0)
ON CONFLICT DO NOTHING;

INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total_price) VALUES
  ('00000000-0000-0000-0000-000000001001', 'Unit 7 — 3-bed townhouse Entebbe View', 1, 320000000, 320000000),
  ('00000000-0000-0000-0000-000000001002', 'Unit 8 — 3-bed townhouse Entebbe View', 1, 320000000, 320000000),
  ('00000000-0000-0000-0000-000000001003', 'Foundation works complete', 1, 350000000, 350000000),
  ('00000000-0000-0000-0000-000000001003', 'Ground floor slab (50%)', 1, 250000000, 250000000),
  ('00000000-0000-0000-0000-000000001003', 'Structural columns (ground floor)', 1, 150000000, 150000000),
  ('00000000-0000-0000-0000-000000001003', 'Mobilization and preliminaries', 1, 100000000, 100000000);

-- ========== EXPENSES ==========
INSERT INTO expenses (category_id, project_id, title, description, amount, expense_date, payment_method, vendor, notes) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'Bulk cement purchase', 'Hima OPC 320 bags for foundation', 10240000, CURRENT_DATE - INTERVAL '105 days', 'bank_transfer', 'Kampala Cement Distributors', 'Delivery to site'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000101', 'Masonry labour week 8-12', 'Block work labour for ground floor walls', 4800000, CURRENT_DATE - INTERVAL '30 days', 'cash', 'Peter Okello (crew)', '8 workers x 5 days'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000101', 'JCB hire', 'Backhoe hire for excavation (3 weeks)', 8400000, CURRENT_DATE - INTERVAL '90 days', 'bank_transfer', 'Precision Tools & Equipment', '210,000/day x 40 days'),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000101', 'Material transport', 'Transport of rebar from SteelPro', 850000, CURRENT_DATE - INTERVAL '80 days', 'cash', 'SiteSafe Logistics', '1 truck load'),
  ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000101', 'Site electricity bill', 'UMEME connection', 420000, CURRENT_DATE - INTERVAL '15 days', 'bank_transfer', 'UMEME', 'Feb 2026'),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000102', 'Building permit fee', 'KCCA permit for science block', 8500000, CURRENT_DATE - INTERVAL '30 days', 'bank_transfer', 'KCCA', 'Permit #KCCA/2026/1421'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000102', 'Cement for ground slab', 'Hima OPC 150 bags', 4800000, CURRENT_DATE - INTERVAL '10 days', 'bank_transfer', 'Kampala Cement Distributors', 'Second delivery'),
  ('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000101', 'Steel fabrication', 'SteelPro fabrication milestone 1', 12500000, CURRENT_DATE - INTERVAL '60 days', 'bank_transfer', 'SteelPro East Africa', 'Basement columns'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000105', 'Final cleaning crew', 'Deep cleaning of 20 townhouses', 3200000, CURRENT_DATE - INTERVAL '10 days', 'cash', 'CleanPro Services', '10 workers x 5 days'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000105', 'Landscaping materials', 'Sod, shrubs, irrigation piping', 12800000, CURRENT_DATE - INTERVAL '30 days', 'bank_transfer', 'BuildHard Ware Ltd', 'Phase 5'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000105', 'Generator rental', '15kVA genny (3 months)', 5400000, CURRENT_DATE - INTERVAL '90 days', 'bank_transfer', 'Precision Tools', '60,000/day x 90'),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000105', 'Waste disposal', 'Skip hire Phase 2', 2400000, CURRENT_DATE - INTERVAL '120 days', 'cash', 'EnviroClean Ltd', '8 skips'),
  ('00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000101', 'Site office supplies', 'Stationery, PPE, first aid', 650000, CURRENT_DATE - INTERVAL '20 days', 'cash', 'OfficeMart', 'Monthly supplies'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000102', 'Carpentry labour', 'Formwork for ground floor columns', 2800000, CURRENT_DATE - INTERVAL '5 days', 'cash', 'Grace Tumusiime', '4 carpenters x 5 days'),
  ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000102', 'Site water', 'Water bowser deliveries', 760000, CURRENT_DATE - INTERVAL '8 days', 'cash', 'WaterLink Services', '3 bowser loads');

-- ========== ASSETS ==========
INSERT INTO assets (id, name, description, category, serial_number, purchase_date, purchase_cost, current_value, status, condition, location, project_id) VALUES
  ('00000000-0000-0000-0000-000000001101', 'JCB 3CX Backhoe', '2019 backhoe loader', 'equipment', 'JCB-3CX-1901', CURRENT_DATE - INTERVAL '600 days', 280000000, 210000000, 'in_use', 'good', 'Main Yard', '00000000-0000-0000-0000-000000000101'),
  ('00000000-0000-0000-0000-000000001102', 'Hilti TE 70-AVR Breaker', 'Electric demolition hammer', 'tool', 'HIL-TE70-210', CURRENT_DATE - INTERVAL '300 days', 8500000, 5500000, 'in_use', 'good', 'Tool Store', '00000000-0000-0000-0000-000000000101'),
  ('00000000-0000-0000-0000-000000001103', 'BOSCH GCM 12 Miter Saw', 'Sliding compound miter saw', 'tool', 'BOS-GCM12-345', CURRENT_DATE - INTERVAL '200 days', 4200000, 3200000, 'available', 'excellent', 'Tool Store', NULL),
  ('00000000-0000-0000-0000-000000001104', 'Mitsubishi 6.5kVA Generator', 'Diesel generator with ATS', 'equipment', 'MIT-65KVA-678', CURRENT_DATE - INTERVAL '500 days', 18500000, 14000000, 'in_use', 'good', 'Site B', '00000000-0000-0000-0000-000000000102'),
  ('00000000-0000-0000-0000-000000001105', 'Toyota Hilux Double Cabin', '2018 pick-up for site supervision', 'vehicle', 'TOY-HIL-901', CURRENT_DATE - INTERVAL '800 days', 160000000, 110000000, 'in_use', 'fair', 'Site Office', '00000000-0000-0000-0000-000000000101')
ON CONFLICT DO NOTHING;

-- ========== DAILY LOGS ==========
INSERT INTO daily_logs (project_id, log_date, weather, temperature, workers_on_site, hours_worked, notes, delays) VALUES
  ('00000000-0000-0000-0000-000000000101', CURRENT_DATE - INTERVAL '10 days', 'Sunny', '28C', 24, 192, 'Foundation excavation. Steel arriving.', 'Delivery delayed 2hrs'),
  ('00000000-0000-0000-0000-000000000101', CURRENT_DATE - INTERVAL '5 days', 'Partly cloudy', '26C', 28, 224, 'Column formwork in progress.', 'None'),
  ('00000000-0000-0000-0000-000000000101', CURRENT_DATE - INTERVAL '2 days', 'Rain AM', '24C', 22, 160, 'Concrete pour pushed to tomorrow.', '3hrs rain'),
  ('00000000-0000-0000-0000-000000000102', CURRENT_DATE - INTERVAL '8 days', 'Sunny', '29C', 18, 144, 'Site clearance completed.', 'None'),
  ('00000000-0000-0000-0000-000000000102', CURRENT_DATE, 'Cloudy', '25C', 22, 176, 'Hardcore and blinding in progress.', 'None'),
  ('00000000-0000-0000-0000-000000000105', CURRENT_DATE - INTERVAL '20 days', 'Sunny', '28C', 15, 120, 'Snag list walkthrough units 15-20.', 'None'),
  ('00000000-0000-0000-0000-000000000105', CURRENT_DATE - INTERVAL '15 days', 'Sunny', '27C', 12, 96, 'Final cleaning and touch-ups.', 'None'),
  ('00000000-0000-0000-0000-000000000105', CURRENT_DATE - INTERVAL '12 days', 'Partly cloudy', '26C', 8, 64, 'Handover preparations.', 'Utility connections');

-- ========== RFIs ==========
INSERT INTO rfis (project_id, rfi_number, title, question, status, priority, due_date) VALUES
  ('00000000-0000-0000-0000-000000000101', 'RFI-2026-001', 'Basement waterproofing spec', 'Client requests full tanking membrane. Sika 107 acceptable?', 'answered', 'high', CURRENT_DATE - INTERVAL '20 days'),
  ('00000000-0000-0000-0000-000000000101', 'RFI-2026-002', 'Column grid discrepancy', 'As-built grid B2 = 6.2m, drawing says 5.8m. Which to follow?', 'open', 'urgent', CURRENT_DATE + INTERVAL '5 days'),
  ('00000000-0000-0000-0000-000000000102', 'RFI-2026-003', 'Lab floor drains location', 'Lab equipment layout not final. Floor drain positions?', 'open', 'medium', CURRENT_DATE + INTERVAL '14 days'),
  ('00000000-0000-0000-0000-000000000102', 'RFI-2026-004', 'Fire rating of partitions', 'Fire rating for lab/classroom partitions?', 'answered', 'medium', CURRENT_DATE - INTERVAL '10 days'),
  ('00000000-0000-0000-0000-000000000105', 'RFI-2026-005', 'Boundary wall height', 'Council requires 2.4m, design shows 2.0m. Proceed with 2.4m?', 'answered', 'low', CURRENT_DATE - INTERVAL '90 days')
ON CONFLICT DO NOTHING;

UPDATE rfis SET response = 'Sika 107 or equivalent approved. Apply to all basement walls. 300mm overlap at joints.', answered_at = CURRENT_DATE - INTERVAL '18 days' WHERE rfi_number = 'RFI-2026-001';
UPDATE rfis SET response = '1-hour fire rating minimum. Use 12.5mm Fireline plasterboard with mineral wool.', answered_at = CURRENT_DATE - INTERVAL '10 days' WHERE rfi_number = 'RFI-2026-004';
UPDATE rfis SET response = 'Confirmed — proceed with 2.4m as per council requirement.', answered_at = CURRENT_DATE - INTERVAL '85 days' WHERE rfi_number = 'RFI-2026-005';

-- ========== MEETING MINUTES ==========
INSERT INTO meeting_minutes (project_id, title, meeting_date, start_time, end_time, location, attendees, agenda, notes, action_items) VALUES
  ('00000000-0000-0000-0000-000000000101', 'Weekly Progress Meeting — Week 16', CURRENT_DATE - INTERVAL '5 days', '09:00', '10:30', 'Site Office, Ntinda', 'Sarah Nakato, John Mwangi, Client Rep', E'- Foundation review: on schedule\n- Steel delivery confirmed\n- Basement waterproofing CO approved', E'- Ground floor columns pour on track\n- RFI-002 needs urgent answer', '[{"action":"Confirm column grid","assignee":"Sarah Nakato","due":"2026-07-22"},{"action":"Prepare progress payment 002","assignee":"John Mwangi","due":"2026-07-25"}]'),
  ('00000000-0000-0000-0000-000000000102', 'Kyambogo Project Kick-off', CURRENT_DATE - INTERVAL '45 days', '10:00', '12:00', 'VC Boardroom', 'Sarah Nakato, Univ Project Comm., KCCA', E'- Site handover done\n- Demolition permit verified\n- Building permit in 2 weeks', E'- Demolition commenced\n- Foundation design finalised', '[{"action":"Submit building permit","assignee":"Sarah Nakato","due":"2026-06-01"}]'),
  ('00000000-0000-0000-0000-000000000105', 'Entebbe View — Handover Planning', CURRENT_DATE - INTERVAL '20 days', '14:00', '15:30', 'Sales Office, Entebbe', 'Sarah Nakato, Sales Team, Client Rep', E'- 16/20 units sold\n- Snag list 95% complete\n- Handover certificates ready', E'- Final inspection scheduled\n- All utilities connected', '[{"action":"O&M manuals for unit owners","assignee":"Diana Kyomugisha","due":"2026-07-30"}]')
ON CONFLICT DO NOTHING;

-- ========== SAFETY INCIDENTS ==========
INSERT INTO safety_incidents (project_id, incident_date, incident_type, description, root_cause, corrective_action, status, reported_by, severity) VALUES
  ('00000000-0000-0000-0000-000000000101', CURRENT_DATE - INTERVAL '45 days', 'first_aid', 'Worker cut forearm on exposed rebar.', 'Rebar ends not capped. No cut-resistant sleeves.', 'All rebar ends capped. PPE enforcement. Toolbox talk.', 'resolved', 'John Mwangi', 'low'),
  ('00000000-0000-0000-0000-000000000101', CURRENT_DATE - INTERVAL '5 days', 'near_miss', 'Concrete skip nearly struck worker during crane lift.', 'Lift not aborted despite wind warning.', 'All lifts >500kg aborted in winds >25km/h.', 'resolved', 'Sarah Nakato', 'medium'),
  ('00000000-0000-0000-0000-000000000105', CURRENT_DATE - INTERVAL '60 days', 'medical_treatment', 'Worker fell from step ladder (2.5m). Bruised ribs.', 'Ladder on uneven ground. Overreaching.', 'Step ladders banned above 2m. Scaffold towers only.', 'resolved', 'John Mwangi', 'medium')
ON CONFLICT DO NOTHING;

-- ========== TIMESHEETS ==========
INSERT INTO timesheets (employee_id, project_id, date, start_time, end_time, hours, overtime_hours, description, status) VALUES
  ('00000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000101', CURRENT_DATE - INTERVAL '5 days', '07:00', '17:00', 10, 2, 'Column formwork and concrete', 'approved'),
  ('00000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000101', CURRENT_DATE - INTERVAL '5 days', '07:00', '16:00', 9, 1, 'Formwork carpentry', 'approved'),
  ('00000000-0000-0000-0000-000000000039', '00000000-0000-0000-0000-000000000101', CURRENT_DATE - INTERVAL '5 days', '08:00', '17:00', 9, 1, 'General labour', 'approved'),
  ('00000000-0000-0000-0000-000000000035', '00000000-0000-0000-0000-000000000101', CURRENT_DATE - INTERVAL '4 days', '07:00', '17:30', 10.5, 2, 'Electrical conduit rough-in', 'approved'),
  ('00000000-0000-0000-0000-000000000037', '00000000-0000-0000-0000-000000000101', CURRENT_DATE - INTERVAL '3 days', '07:00', '17:00', 10, 2, 'Steel fixing for columns', 'approved'),
  ('00000000-0000-0000-0000-000000000036', '00000000-0000-0000-0000-000000000102', CURRENT_DATE - INTERVAL '4 days', '07:30', '16:30', 9, 1, 'Site drainage pipe laying', 'pending'),
  ('00000000-0000-0000-0000-000000000039', '00000000-0000-0000-0000-000000000102', CURRENT_DATE, '08:00', '17:00', 9, 1, 'Excavation and hardcore', 'pending'),
  ('00000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000101', CURRENT_DATE, '07:00', '16:00', 9, 1, 'Block work section A', 'pending')
ON CONFLICT DO NOTHING;

-- ========== PROGRESS PAYMENTS ==========
INSERT INTO progress_payments (project_id, application_number, period_label, period_start, period_end, amount, retainage, net_amount, status, submit_date) VALUES
  ('00000000-0000-0000-0000-000000000101', 'PP-2026-001', 'Jan 2026', CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE - INTERVAL '30 days', 450000000, 22500000, 427500000, 'paid', CURRENT_DATE - INTERVAL '25 days'),
  ('00000000-0000-0000-0000-000000000101', 'PP-2026-002', 'Feb 2026', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, 380000000, 19000000, 361000000, 'submitted', CURRENT_DATE - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

-- ========== SOP CHECKLISTS + ITEMS ==========
INSERT INTO sop_checklists (id, project_id, title, description, category) VALUES
  ('00000000-0000-0000-0000-000000001201', '00000000-0000-0000-0000-000000000101', 'Daily Site Safety Inspection', 'Mandatory daily inspection before work commences.', 'safety'),
  ('00000000-0000-0000-0000-000000001202', '00000000-0000-0000-0000-000000000105', 'Townhouse Handover Checklist', 'Complete for each unit before handover.', 'quality')
ON CONFLICT DO NOTHING;

INSERT INTO sop_checklist_items (checklist_id, item, sort_order) VALUES
  ('00000000-0000-0000-0000-000000001201', 'All workers wearing correct PPE', 1),
  ('00000000-0000-0000-0000-000000001201', 'Scaffolding inspected and safe', 2),
  ('00000000-0000-0000-0000-000000001201', 'First aid kit fully stocked', 3),
  ('00000000-0000-0000-0000-000000001201', 'Fire extinguisher in date', 4),
  ('00000000-0000-0000-0000-000000001201', 'Excavation edges protected', 5),
  ('00000000-0000-0000-0000-000000001201', 'Electrical cables checked', 6),
  ('00000000-0000-0000-0000-000000001202', 'All windows and doors open/close correctly', 1),
  ('00000000-0000-0000-0000-000000001202', 'Plumbing tested (taps, toilets, showers)', 2),
  ('00000000-0000-0000-0000-000000001202', 'Electrical tested (sockets, switches, lights)', 3),
  ('00000000-0000-0000-0000-000000001202', 'Floor finishes — no cracks or damage', 4),
  ('00000000-0000-0000-0000-000000001202', 'Paint — no missed spots or drips', 5),
  ('00000000-0000-0000-0000-000000001202', 'Kitchen cabinets and sink tested', 6);

-- ========== PROJECT DOCUMENTS ==========
INSERT INTO project_documents (project_id, name, file_type, category, version, description) VALUES
  ('00000000-0000-0000-0000-000000000101', 'Architectural Drawings Set A', 'PDF', 'drawings', '2.1', 'Full architectural set including plans, elevations, sections'),
  ('00000000-0000-0000-0000-000000000101', 'Structural Calculations', 'PDF', 'engineering', '1.0', 'Structural design calculations by ArchiPlan'),
  ('00000000-0000-0000-0000-000000000101', 'Bill of Quantities', 'XLSX', 'estimating', '1.2', 'Full BOQ for Ntinda Heights'),
  ('00000000-0000-0000-0000-000000000102', 'Lab Equipment Schedule', 'XLSX', 'specifications', '1.0', 'Schedule of all lab equipment with specs'),
  ('00000000-0000-0000-0000-000000000105', 'Title Deeds Units 1-20', 'PDF', 'legal', '1.0', 'Certified copies of registered title deeds')
ON CONFLICT DO NOTHING;

-- ========== PROJECT PHOTOS ==========
INSERT INTO project_photos (project_id, image_url, caption, photo_date, category) VALUES
  ('00000000-0000-0000-0000-000000000101', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800', 'Site clearing — before photo', CURRENT_DATE - INTERVAL '120 days', 'progress'),
  ('00000000-0000-0000-0000-000000000101', 'https://images.unsplash.com/photo-1578996952280-8f0c83e60e61?w=800', 'Foundation excavation complete', CURRENT_DATE - INTERVAL '90 days', 'progress'),
  ('00000000-0000-0000-0000-000000000101', 'https://images.unsplash.com/photo-1541888946425-d81bb66c3d8a?w=800', 'Ground floor column formwork', CURRENT_DATE - INTERVAL '10 days', 'progress'),
  ('00000000-0000-0000-0000-000000000101', 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=800', 'Steel delivery', CURRENT_DATE - INTERVAL '80 days', 'delivery'),
  ('00000000-0000-0000-0000-000000000102', 'https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?w=800', 'Pre-demolition site condition', CURRENT_DATE - INTERVAL '60 days', 'progress'),
  ('00000000-0000-0000-0000-000000000102', 'https://images.unsplash.com/photo-1574629819369-5d46a6ec2ec6?w=800', 'Excavation with groundwater', CURRENT_DATE - INTERVAL '4 days', 'progress'),
  ('00000000-0000-0000-0000-000000000105', 'https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=800', 'Phase 2 completed exterior', CURRENT_DATE - INTERVAL '45 days', 'completed'),
  ('00000000-0000-0000-0000-000000000105', 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800', 'Show unit finished interior', CURRENT_DATE - INTERVAL '30 days', 'completed')
ON CONFLICT DO NOTHING;

-- ========== PUNCH LIST ==========
INSERT INTO punch_list_items (project_id, title, description, status, priority, due_date) VALUES
  ('00000000-0000-0000-0000-000000000105', 'Unit 3 — Bathroom tile grout', 'Grout discoloured in shower. Needs re-grouting.', 'open', 'medium', CURRENT_DATE + INTERVAL '7 days'),
  ('00000000-0000-0000-0000-000000000105', 'Unit 8 — Front door adjustment', 'Door sticking at top corner.', 'in_progress', 'high', CURRENT_DATE + INTERVAL '3 days'),
  ('00000000-0000-0000-0000-000000000105', 'Security gate sensor', 'Gate closing prematurely.', 'open', 'urgent', CURRENT_DATE + INTERVAL '2 days'),
  ('00000000-0000-0000-0000-000000000101', 'Site office internet', 'No connectivity in site office.', 'open', 'low', CURRENT_DATE + INTERVAL '14 days'),
  ('00000000-0000-0000-0000-000000000105', 'Unit 12 — Kitchen tap leak', 'Slow drip from mixer tap.', 'completed', 'medium', CURRENT_DATE - INTERVAL '5 days')
ON CONFLICT DO NOTHING;

-- ========== SUBMITTALS ==========
INSERT INTO submittals (project_id, title, description, status, due_date, submitted_date, reviewed_by, review_notes) VALUES
  ('00000000-0000-0000-0000-000000000101', 'Concrete mix design Grade 30', 'Mix design for all structural concrete', 'approved', CURRENT_DATE - INTERVAL '80 days', CURRENT_DATE - INTERVAL '85 days', 'Struct Eng ArchiPlan', 'Approved. w/c ratio <= 0.50.'),
  ('00000000-0000-0000-0000-000000000101', 'Steel reinforcement schedule', 'Bending schedule for all rebar', 'approved', CURRENT_DATE - INTERVAL '70 days', CURRENT_DATE - INTERVAL '75 days', 'Struct Eng ArchiPlan', 'Approved with corrections to column B2 links.'),
  ('00000000-0000-0000-0000-000000000102', 'Lab benching detail', 'Lab benching layout for Level 1', 'submitted', CURRENT_DATE + INTERVAL '30 days', CURRENT_DATE, NULL, NULL),
  ('00000000-0000-0000-0000-000000000105', 'Landscaping plan common areas', 'Final landscaping with planting schedule', 'approved', CURRENT_DATE - INTERVAL '120 days', CURRENT_DATE - INTERVAL '125 days', 'Client', 'Approved. Use Hibiscus instead of Bougainvillea.')
ON CONFLICT DO NOTHING;

-- ========== PROPOSALS ==========
INSERT INTO proposals (id, project_id, lead_id, proposal_number, title, status, total_amount, valid_until) VALUES
  ('00000000-0000-0000-0000-000000001301', '00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000303', 'PROP-2026-001', 'Townhouse Purchase — Units 7 & 8', 'sent', 640000000, CURRENT_DATE + INTERVAL '30 days'),
  ('00000000-0000-0000-0000-000000001302', NULL, '00000000-0000-0000-0000-000000000304', 'PROP-2026-002', 'Bugolobi Medical Clinic Fit-out', 'draft', 285000000, CURRENT_DATE + INTERVAL '45 days')
ON CONFLICT DO NOTHING;

-- ========== BID PACKAGES ==========
INSERT INTO bid_packages (id, project_id, title, status, due_date, estimated_budget, notes) VALUES
  ('00000000-0000-0000-0000-000000001401', '00000000-0000-0000-0000-000000000101', 'Steel reinforcement supply', 'awarded', CURRENT_DATE - INTERVAL '80 days', 450000000, 'Awarded to SteelPro'),
  ('00000000-0000-0000-0000-000000001402', '00000000-0000-0000-0000-000000000102', 'Laboratory equipment supply', 'sent', CURRENT_DATE + INTERVAL '60 days', 800000000, '5 shortlisted vendors')
ON CONFLICT DO NOTHING;

-- ========== ALLOWANCES ==========
INSERT INTO allowances (project_id, title, description, budgeted_amount, spent_amount, status) VALUES
  ('00000000-0000-0000-0000-000000000101', 'Architectural contingency', 'Allowance for design changes', 250000000, 45000000, 'open'),
  ('00000000-0000-0000-0000-000000000101', 'MEP contingency', 'Unforeseen MEP coordination', 150000000, 20000000, 'open'),
  ('00000000-0000-0000-0000-000000000105', 'Landscaping contingency', 'Additional planting', 80000000, 80000000, 'exhausted')
ON CONFLICT DO NOTHING;

-- ========== COMMITMENT LOG ==========
INSERT INTO commitment_log (project_id, vendor, type, description, amount, budget_line, status, executed_date) VALUES
  ('00000000-0000-0000-0000-000000000101', 'SteelPro East Africa', 'purchase_order', 'Rebar supply', 450000000, 'Structural Steel', 'executed', CURRENT_DATE - INTERVAL '90 days'),
  ('00000000-0000-0000-0000-000000000101', 'RoofMart Uganda Ltd', 'subcontract', 'Roofing subcontract', 280000000, 'Roofing', 'approved', CURRENT_DATE - INTERVAL '10 days'),
  ('00000000-0000-0000-0000-000000000105', 'BuildHard Ware Ltd', 'purchase_order', 'Finishing materials batch', 185000000, 'Finishes', 'completed', CURRENT_DATE - INTERVAL '60 days')
ON CONFLICT DO NOTHING;

-- ========== LIEN WAIVERS ==========
INSERT INTO lien_waivers (project_id, supplier_id, waiver_type, amount, status, signed_date) VALUES
  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000041', 'final', 380000000, 'received', CURRENT_DATE - INTERVAL '30 days'),
  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000042', 'final', 280000000, 'signed', CURRENT_DATE - INTERVAL '45 days')
ON CONFLICT DO NOTHING;

-- ========== EMPLOYEE ATTENDANCE ==========
INSERT INTO employee_attendance (employee_id, date, hours_worked, project_id, status) VALUES
  ('00000000-0000-0000-0000-000000000033', CURRENT_DATE - INTERVAL '5 days', 10, '00000000-0000-0000-0000-000000000101', 'present'),
  ('00000000-0000-0000-0000-000000000034', CURRENT_DATE - INTERVAL '5 days', 9, '00000000-0000-0000-0000-000000000101', 'present'),
  ('00000000-0000-0000-0000-000000000039', CURRENT_DATE - INTERVAL '5 days', 9, '00000000-0000-0000-0000-000000000101', 'present'),
  ('00000000-0000-0000-0000-000000000035', CURRENT_DATE - INTERVAL '4 days', 10.5, '00000000-0000-0000-0000-000000000101', 'present'),
  ('00000000-0000-0000-0000-000000000039', CURRENT_DATE, 9, '00000000-0000-0000-0000-000000000102', 'present')
ON CONFLICT DO NOTHING;

-- ========== INVENTORY TRANSACTIONS ==========
INSERT INTO inventory_transactions (item_id, type, quantity, unit_price, total_price, reference_type, project_id, notes) VALUES
  ('00000000-0000-0000-0000-000000000501', 'purchase', 320, 32000, 10240000, 'purchase_order', '00000000-0000-0000-0000-000000000101', 'Cement foundation delivery'),
  ('00000000-0000-0000-0000-000000000501', 'purchase', 150, 32000, 4800000, 'purchase_order', '00000000-0000-0000-0000-000000000102', 'Cement ground slab'),
  ('00000000-0000-0000-0000-000000000502', 'purchase', 80, 85000, 6800000, 'purchase_order', '00000000-0000-0000-0000-000000000101', 'Rebar order'),
  ('00000000-0000-0000-0000-000000000503', 'purchase', 500, 45000, 22500000, 'purchase_order', '00000000-0000-0000-0000-000000000105', 'Roof tiles Phase 2'),
  ('00000000-0000-0000-0000-000000000501', 'adjustment', -5, 32000, -160000, 'adjustment', NULL, 'Damaged bags');

-- ========== EQUIPMENT RENTALS ==========
INSERT INTO equipment_rentals (rental_number, asset_id, employee_id, project_id, start_date, expected_return_date, daily_rate, total_charge, deposit_amount, status) VALUES
  ('RENT-2026-001', '00000000-0000-0000-0000-000000001102', '00000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000101', CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE + INTERVAL '15 days', 50000, 0, 200000, 'active'),
  ('RENT-2026-002', '00000000-0000-0000-0000-000000001103', '00000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000105', CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE - INTERVAL '20 days', 35000, 2450000, 100000, 'returned')
ON CONFLICT DO NOTHING;

-- ========== ASSET MAINTENANCE ==========
INSERT INTO asset_maintenance (asset_id, maintenance_date, description, type, cost, performed_by, next_maintenance_date) VALUES
  ('00000000-0000-0000-0000-000000001101', CURRENT_DATE - INTERVAL '30 days', 'Oil change, hydraulic fluid top-up', 'service', 850000, 'Site Mechanics', CURRENT_DATE + INTERVAL '150 days'),
  ('00000000-0000-0000-0000-000000001105', CURRENT_DATE - INTERVAL '15 days', 'Brake pads, tyre rotation, alignment', 'service', 1200000, 'Toyota Uganda', CURRENT_DATE + INTERVAL '180 days'),
  ('00000000-0000-0000-0000-000000001104', CURRENT_DATE - INTERVAL '7 days', 'Battery replacement', 'repair', 350000, 'Site Electrician', NULL)
ON CONFLICT DO NOTHING;

-- ========== RECEIPTS ==========
INSERT INTO receipts (project_id, receipt_number, vendor, amount, receipt_date, notes) VALUES
  ('00000000-0000-0000-0000-000000000101', 'RCP-2026-0001', 'Kampala Cement Distributors', 10240000, CURRENT_DATE - INTERVAL '105 days', 'Original receipt'),
  ('00000000-0000-0000-0000-000000000101', 'RCP-2026-0002', 'Precision Tools', 8400000, CURRENT_DATE - INTERVAL '90 days', 'JCB hire'),
  ('00000000-0000-0000-0000-000000000101', 'RCP-2026-0003', 'RoofMart Uganda Ltd', 38000000, CURRENT_DATE - INTERVAL '15 days', 'Roofing deposit'),
  ('00000000-0000-0000-0000-000000000105', 'RCP-2026-0004', 'BuildHard Ware Ltd', 12800000, CURRENT_DATE - INTERVAL '30 days', 'Landscaping'),
  ('00000000-0000-0000-0000-000000000105', 'RCP-2026-0005', 'Hima Cement', 4800000, CURRENT_DATE - INTERVAL '45 days', 'Pathway concrete'),
  ('00000000-0000-0000-0000-000000000102', 'RCP-2026-0006', 'KCCA', 8500000, CURRENT_DATE - INTERVAL '30 days', 'Building permit'),
  ('00000000-0000-0000-0000-000000000101', 'RCP-2026-0007', 'SteelPro East Africa', 12500000, CURRENT_DATE - INTERVAL '60 days', 'Steel fabrication'),
  ('00000000-0000-0000-0000-000000000101', 'RCP-2026-0008', 'UMEME', 420000, CURRENT_DATE - INTERVAL '15 days', 'Electricity bill')
ON CONFLICT DO NOTHING;

-- ========== SOP FORMS ==========
INSERT INTO sop_forms (id, project_id, title, description, form_config, category) VALUES
  ('00000000-0000-0000-0000-000000001501', '00000000-0000-0000-0000-000000000101', 'Concrete Pour Checklist', 'QC form for structural concrete pours.',
   '{"fields":[{"key":"rebar_inspected","label":"Rebar inspected?","type":"checkbox"},{"key":"slump_test","label":"Slump test (mm)","type":"number"},{"key":"cubes_taken","label":"Cube samples?","type":"checkbox"},{"key":"curing_method","label":"Curing method","type":"select","options":["Wet burlap","Ponding","Curing compound"]}]}',
   'quality'),
  ('00000000-0000-0000-0000-000000001502', NULL, 'Subcontractor Evaluation', 'Evaluate subcontractor performance.',
   '{"fields":[{"key":"name","label":"Subcontractor name","type":"text"},{"key":"quality","label":"Quality","type":"select","options":["Excellent","Good","Average","Poor"]},{"key":"timeliness","label":"Timeliness","type":"select","options":["On time","Minor delays","Major delays"]},{"key":"would_rehire","label":"Rehire?","type":"radio","options":["Yes","No"]}]}',
   'quality')
ON CONFLICT DO NOTHING;

-- ========== SAVED REPORTS ==========
INSERT INTO saved_reports (name, type, config) VALUES
  ('Monthly Status — Jan 2026', 'project', '{"projects":["00000000-0000-0000-0000-000000000101","00000000-0000-0000-0000-000000000102","00000000-0000-0000-0000-000000000104","00000000-0000-0000-0000-000000000105"],"period":"monthly","include_budget":true}'),
  ('Expense Analysis Q1 2026', 'expense', '{"period_start":"2026-01-01","period_end":"2026-03-31","group_by":"category","include_vat":true}')
ON CONFLICT DO NOTHING;

-- ========== SUMMARY ==========
SELECT 'SEED COMPLETE' AS status,
  (SELECT COUNT(*) FROM projects) AS projects,
  (SELECT COUNT(*) FROM employees) AS employees,
  (SELECT COUNT(*) FROM suppliers) AS suppliers,
  (SELECT COUNT(*) FROM inventory_items) AS inventory_items,
  (SELECT COUNT(*) FROM purchase_orders) AS purchase_orders,
  (SELECT COUNT(*) FROM project_tasks) AS tasks,
  (SELECT COUNT(*) FROM project_budgets) AS budgets,
  (SELECT COUNT(*) FROM project_schedules) AS schedules,
  (SELECT COUNT(*) FROM expenses) AS expenses,
  (SELECT COUNT(*) FROM invoices) AS invoices,
  (SELECT COUNT(*) FROM bills) AS bills,
  (SELECT COUNT(*) FROM leads) AS leads,
  (SELECT COUNT(*) FROM estimates) AS estimates,
  (SELECT COUNT(*) FROM rfis) AS rfis,
  (SELECT COUNT(*) FROM submittals) AS submittals,
  (SELECT COUNT(*) FROM safety_incidents) AS safety_incidents,
  (SELECT COUNT(*) FROM meeting_minutes) AS meetings,
  (SELECT COUNT(*) FROM punch_list_items) AS punch_list,
  (SELECT COUNT(*) FROM timesheets) AS timesheets,
  (SELECT COUNT(*) FROM daily_logs) AS daily_logs,
  (SELECT COUNT(*) FROM progress_payments) AS progress_payments,
  (SELECT COUNT(*) FROM commitment_log) AS commitments,
  (SELECT COUNT(*) FROM subcontracts) AS subcontracts,
  (SELECT COUNT(*) FROM change_orders) AS change_orders,
  (SELECT COUNT(*) FROM allowances) AS allowances,
  (SELECT COUNT(*) FROM lien_waivers) AS lien_waivers,
  (SELECT COUNT(*) FROM project_documents) AS documents,
  (SELECT COUNT(*) FROM project_photos) AS photos,
  (SELECT COUNT(*) FROM proposals) AS proposals,
  (SELECT COUNT(*) FROM bid_packages) AS bid_packages,
  (SELECT COUNT(*) FROM sop_checklists) AS sop_checklists,
  (SELECT COUNT(*) FROM sop_forms) AS sop_forms,
  (SELECT COUNT(*) FROM cost_codes) AS cost_codes,
  (SELECT COUNT(*) FROM expense_categories) AS expense_categories;
