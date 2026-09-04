-- =========================================================
-- VAST CONSTRUCTION SAMPLE DATA
-- Run this in Supabase SQL Editor (service_role or admin)
-- =========================================================

DO $$
DECLARE
  _user_id UUID;
  _now TIMESTAMPTZ := now();
  _today DATE := CURRENT_DATE;

  -- Project IDs
  _proj1 UUID; _proj2 UUID; _proj3 UUID; _proj4 UUID; _proj5 UUID;

  -- Employee IDs
  _emp1 UUID; _emp2 UUID; _emp3 UUID; _emp4 UUID; _emp5 UUID;
  _emp6 UUID; _emp7 UUID; _emp8 UUID; _emp9 UUID; _emp10 UUID;

  -- Supplier IDs
  _sup1 UUID; _sup2 UUID; _sup3 UUID; _sup4 UUID; _sup5 UUID;
  _sup6 UUID; _sup7 UUID; _sup8 UUID;

  -- Cost code IDs
  _cc1 UUID; _cc2 UUID; _cc3 UUID; _cc4 UUID; _cc5 UUID;
  _cc6 UUID; _cc7 UUID; _cc8 UUID; _cc9 UUID; _cc10 UUID;

  -- Expense category IDs
  _ec1 UUID; _ec2 UUID; _ec3 UUID; _ec4 UUID; _ec5 UUID;
  _ec6 UUID; _ec7 UUID; _ec8 UUID;

  -- Inventory / asset / task IDs
  _inv1 UUID; _inv2 UUID; _inv3 UUID; _inv4 UUID; _inv5 UUID;
  _inv6 UUID; _inv7 UUID; _inv8 UUID;
  _asset1 UUID; _asset2 UUID; _asset3 UUID; _asset4 UUID; _asset5 UUID;
  _task_p1_1 UUID; _task_p1_2 UUID; _task_p1_3 UUID; _task_p1_4 UUID; _task_p1_5 UUID;
  _task_p2_1 UUID; _task_p2_2 UUID; _task_p2_3 UUID;
  _sched1 UUID; _sched2 UUID; _sched3 UUID; _sched4 UUID; _sched5 UUID;
  _sched6 UUID; _sched7 UUID; _sched8 UUID; _sched9 UUID; _sched10 UUID;

  -- Lead / estimate / proposal IDs
  _lead1 UUID; _lead2 UUID; _lead3 UUID; _lead4 UUID; _lead5 UUID;
  _est1 UUID; _est2 UUID; _est3 UUID;
  _prop1 UUID; _prop2 UUID;
  _bid1 UUID; _bid2 UUID;

  -- Invoice / PO / sub / bill / etc.
  _inv1_uuid UUID; _inv2_uuid UUID; _inv3_uuid UUID;
  _po1 UUID; _po2 UUID; _po3 UUID; _po4 UUID;
  _sub1 UUID; _sub2 UUID; _sub3 UUID;
  _co1 UUID; _co2 UUID;
  _bill1 UUID; _bill2 UUID; _bill3 UUID; _bill4 UUID;
  _lien1 UUID; _lien2 UUID;
  _allow1 UUID; _allow2 UUID; _allow3 UUID;
  _comm1 UUID; _comm2 UUID; _comm3 UUID;
  _pp1 UUID; _pp2 UUID;

  -- SOP
  _sopc1 UUID; _sopc2 UUID;
  _sopf1 UUID; _sopf2 UUID;

  -- Meeting / punch / safety
  _meet1 UUID; _meet2 UUID; _meet3 UUID;
  _punch1 UUID; _punch2 UUID; _punch3 UUID; _punch4 UUID; _punch5 UUID;
  _safe1 UUID; _safe2 UUID; _safe3 UUID;

  -- Doc / photo
  _doc1 UUID; _doc2 UUID; _doc3 UUID; _doc4 UUID; _doc5 UUID;
  _photo1 UUID; _photo2 UUID; _photo3 UUID; _photo4 UUID; _photo5 UUID;
  _photo6 UUID; _photo7 UUID; _photo8 UUID;

  -- RFIs / submittals / daily logs
  _rfi1 UUID; _rfi2 UUID; _rfi3 UUID; _rfi4 UUID; _rfi5 UUID;
  _subm1 UUID; _subm2 UUID; _subm3 UUID; _subm4 UUID;
  _dl1 UUID; _dl2 UUID; _dl3 UUID; _dl4 UUID; _dl5 UUID;
  _dl6 UUID; _dl7 UUID; _dl8 UUID; _dl9 UUID; _dl10 UUID;

  -- Timesheet / attendance
  _ts1 UUID; _ts2 UUID; _ts3 UUID; _ts4 UUID; _ts5 UUID;
  _ts6 UUID; _ts7 UUID; _ts8 UUID;
  _att1 UUID; _att2 UUID; _att3 UUID; _att4 UUID; _att5 UUID;

  -- Expenses
  _exp1 UUID; _exp2 UUID; _exp3 UUID; _exp4 UUID; _exp5 UUID;
  _exp6 UUID; _exp7 UUID; _exp8 UUID; _exp9 UUID; _exp10 UUID;
  _exp11 UUID; _exp12 UUID; _exp13 UUID; _exp14 UUID; _exp15 UUID;

  -- Receipts
  _rec1 UUID; _rec2 UUID; _rec3 UUID; _rec4 UUID; _rec5 UUID;
  _rec6 UUID; _rec7 UUID; _rec8 UUID;

  _i INTEGER;
  _d DATE;
BEGIN

-- =========================================================
-- STEP 0: Find an existing auth user for created_by fields
-- =========================================================
SELECT id INTO _user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
IF _user_id IS NULL THEN
  _user_id := '00000000-0000-0000-0000-000000000000'::UUID;
END IF;

-- =========================================================
-- STEP 1: REFERENCE DATA — expense_categories
-- =========================================================
INSERT INTO expense_categories (id, name, description, color) VALUES
  (gen_random_uuid(), 'Materials', 'Building materials and supplies', '#3B82F6'),
  (gen_random_uuid(), 'Labour', 'Worker wages and salaries', '#10B981'),
  (gen_random_uuid(), 'Equipment', 'Equipment rental and purchase', '#F59E0B'),
  (gen_random_uuid(), 'Transport', 'Logistics and transport costs', '#8B5CF6'),
  (gen_random_uuid(), 'Permits & Fees', 'Government permits and regulatory fees', '#EF4444'),
  (gen_random_uuid(), 'Utilities', 'Water, electricity, internet at site', '#EC4899'),
  (gen_random_uuid(), 'Subcontractor', 'Subcontracted work', '#14B8A6'),
  (gen_random_uuid(), 'Miscellaneous', 'Other project costs', '#6B7280')
ON CONFLICT DO NOTHING;

SELECT id INTO _ec1 FROM expense_categories WHERE name = 'Materials';
SELECT id INTO _ec2 FROM expense_categories WHERE name = 'Labour';
SELECT id INTO _ec3 FROM expense_categories WHERE name = 'Equipment';
SELECT id INTO _ec4 FROM expense_categories WHERE name = 'Transport';
SELECT id INTO _ec5 FROM expense_categories WHERE name = 'Permits & Fees';
SELECT id INTO _ec6 FROM expense_categories WHERE name = 'Utilities';
SELECT id INTO _ec7 FROM expense_categories WHERE name = 'Subcontractor';
SELECT id INTO _ec8 FROM expense_categories WHERE name = 'Miscellaneous';

-- =========================================================
-- STEP 2: REFERENCE DATA — cost_codes
-- =========================================================
INSERT INTO cost_codes (id, code, name, description, category) VALUES
  (gen_random_uuid(), '01-000', 'General Requirements', 'General project requirements', 'general'),
  (gen_random_uuid(), '02-000', 'Site Work', 'Site preparation and excavation', 'site'),
  (gen_random_uuid(), '03-000', 'Concrete', 'Concrete work including formwork and finishing', 'structure'),
  (gen_random_uuid(), '04-000', 'Masonry', 'Block work, brickwork, stone', 'structure'),
  (gen_random_uuid(), '05-000', 'Metals', 'Structural steel, rebar, metal framing', 'structure'),
  (gen_random_uuid(), '06-000', 'Wood & Plastics', 'Carpentry, millwork, plastic composites', 'finishes'),
  (gen_random_uuid(), '07-000', 'Thermal & Moisture', 'Roofing, waterproofing, insulation', 'envelope'),
  (gen_random_uuid(), '08-000', 'Doors & Windows', 'All door and window systems', 'finishes'),
  (gen_random_uuid(), '09-000', 'Finishes', 'Drywall, painting, flooring, tiling', 'finishes'),
  (gen_random_uuid(), '10-000', 'Specialties', 'Signage, lockers, toilet partitions', 'specialties'),
  (gen_random_uuid(), '11-000', 'Equipment', 'Built-in equipment', 'equipment'),
  (gen_random_uuid(), '12-000', 'Furnishings', 'Window treatments, furniture', 'furnishings'),
  (gen_random_uuid(), '13-000', 'Special Construction', 'Special structures', 'special'),
  (gen_random_uuid(), '14-000', 'Conveying Systems', 'Elevators, escalators', 'equipment'),
  (gen_random_uuid(), '15-000', 'Plumbing', 'Plumbing fixtures and piping', 'mechanical'),
  (gen_random_uuid(), '16-000', 'Electrical', 'Wiring, panels, fixtures', 'electrical'),
  (gen_random_uuid(), '17-000', 'HVAC', 'Heating, ventilation, air conditioning', 'mechanical'),
  (gen_random_uuid(), '18-000', 'Fire Protection', 'Sprinklers, fire alarms', 'mechanical'),
  (gen_random_uuid(), '19-000', 'Earthworks', 'Excavation, grading, compaction', 'site'),
  (gen_random_uuid(), '20-000', 'Landscaping', 'Grounds, planting, irrigation', 'site')
ON CONFLICT (code) DO NOTHING;

SELECT id INTO _cc1 FROM cost_codes WHERE code = '01-000';
SELECT id INTO _cc2 FROM cost_codes WHERE code = '03-000';
SELECT id INTO _cc3 FROM cost_codes WHERE code = '09-000';
SELECT id INTO _cc4 FROM cost_codes WHERE code = '15-000';
SELECT id INTO _cc5 FROM cost_codes WHERE code = '16-000';
SELECT id INTO _cc6 FROM cost_codes WHERE code = '19-000';
SELECT id INTO _cc7 FROM cost_codes WHERE code = '08-000';
SELECT id INTO _cc8 FROM cost_codes WHERE code = '07-000';
SELECT id INTO _cc9 FROM cost_codes WHERE code = '17-000';
SELECT id INTO _cc10 FROM cost_codes WHERE code = '20-000';

-- =========================================================
-- STEP 3: EMPLOYEES
-- =========================================================
INSERT INTO employees (id, full_name, phone, email, role, employee_type, department, daily_rate, monthly_salary, status, hire_date, national_id, address) VALUES
  (gen_random_uuid(), 'John Mwangi', '+256 700 111 001', 'john.mwangi@construction.co.ug', 'supervisor', 'full_time', 'Site Management', 80000, 1800000, 'active', _today - INTERVAL '365 days', 'CM123456', 'Kampala, Uganda'),
  (gen_random_uuid(), 'Sarah Nakato', '+256 700 111 002', 'sarah.nakato@construction.co.ug', 'manager', 'full_time', 'Project Management', 120000, 3000000, 'active', _today - INTERVAL '730 days', 'CM234567', 'Kololo, Kampala'),
  (gen_random_uuid(), 'Peter Okello', '+256 700 111 003', 'peter.okello@construction.co.ug', 'worker', 'full_time', 'Masonry', 50000, 1200000, 'active', _today - INTERVAL '180 days', 'CM345678', 'Ntinda, Kampala'),
  (gen_random_uuid(), 'Grace Tumusiime', '+256 700 111 004', 'grace.tumusiime@construction.co.ug', 'worker', 'full_time', 'Carpentry', 50000, 1200000, 'active', _today - INTERVAL '200 days', 'CM456789', 'Bweyogerere'),
  (gen_random_uuid(), 'David Ssempijja', '+256 700 111 005', 'david.ssempijja@construction.co.ug', 'worker', 'full_time', 'Electrical', 55000, 1300000, 'active', _today - INTERVAL '250 days', 'CM567890', 'Kyambogo'),
  (gen_random_uuid(), 'Alice Nambooze', '+256 700 111 006', 'alice.nambooze@construction.co.ug', 'worker', 'full_time', 'Plumbing', 55000, 1300000, 'active', _today - INTERVAL '150 days', 'CM678901', 'Wandegeya'),
  (gen_random_uuid(), 'Robert Kato', '+256 700 111 007', 'robert.kato@construction.co.ug', 'contractor', 'contract', 'Steel Work', 70000, 0, 'active', _today - INTERVAL '90 days', 'CM789012', 'Luzira'),
  (gen_random_uuid(), 'Jennifer Akello', '+256 700 111 008', 'jennifer.akello@construction.co.ug', 'worker', 'full_time', 'Finishing', 45000, 1000000, 'active', _today - INTERVAL '120 days', 'CM890123', 'Mukono'),
  (gen_random_uuid(), 'Samuel Wasswa', '+256 700 111 009', 'samuel.wasswa@construction.co.ug', 'worker', 'full_time', 'General Labour', 35000, 800000, 'active', _today - INTERVAL '60 days', 'CM901234', 'Kasubi'),
  (gen_random_uuid(), 'Diana Kyomugisha', '+256 700 111 010', 'diana.kyomugisha@construction.co.ug', 'supervisor', 'full_time', 'Quality Control', 85000, 2000000, 'active', _today - INTERVAL '300 days', 'CM012345', 'Muyenga')
ON CONFLICT DO NOTHING;

SELECT id INTO _emp1 FROM employees WHERE email = 'john.mwangi@construction.co.ug';
SELECT id INTO _emp2 FROM employees WHERE email = 'sarah.nakato@construction.co.ug';
SELECT id INTO _emp3 FROM employees WHERE email = 'peter.okello@construction.co.ug';
SELECT id INTO _emp4 FROM employees WHERE email = 'grace.tumusiime@construction.co.ug';
SELECT id INTO _emp5 FROM employees WHERE email = 'david.ssempijja@construction.co.ug';
SELECT id INTO _emp6 FROM employees WHERE email = 'alice.nambooze@construction.co.ug';
SELECT id INTO _emp7 FROM employees WHERE email = 'robert.kato@construction.co.ug';
SELECT id INTO _emp8 FROM employees WHERE email = 'jennifer.akello@construction.co.ug';
SELECT id INTO _emp9 FROM employees WHERE email = 'samuel.wasswa@construction.co.ug';
SELECT id INTO _emp10 FROM employees WHERE email = 'diana.kyomugisha@construction.co.ug';

-- =========================================================
-- STEP 4: SUPPLIERS
-- =========================================================
INSERT INTO suppliers (id, name, contact_person, phone, email, category, payment_terms, tax_id, status) VALUES
  (gen_random_uuid(), 'RoofMart Uganda Ltd', 'James Kintu', '+256 700 200 001', 'info@roofmart.ug', 'materials', 'Net 30', 'TIN10001', 'active'),
  (gen_random_uuid(), 'SteelPro East Africa', 'Grace Amongin', '+256 700 200 002', 'sales@steelpro.co.ug', 'materials', 'Net 45', 'TIN10002', 'active'),
  (gen_random_uuid(), 'BuildHard Ware Ltd', 'Moses Mukasa', '+256 700 200 003', 'orders@buildhard.ug', 'materials', 'Net 30', 'TIN10003', 'active'),
  (gen_random_uuid(), 'Kampala Cement Distributors', 'Hajji Ssewanyana', '+256 700 200 004', 'cement@kcd.co.ug', 'materials', 'COD', 'TIN10004', 'active'),
  (gen_random_uuid(), 'Prime Plumbing Supplies', 'Faith Nalwoga', '+256 700 200 005', 'info@primeplumbing.ug', 'materials', 'Net 30', 'TIN10005', 'active'),
  (gen_random_uuid(), 'Eagle Electricals Ltd', 'Paul Mugisha', '+256 700 200 006', 'sales@eagleelec.ug', 'materials', 'Net 45', 'TIN10006', 'active'),
  (gen_random_uuid(), 'SiteSafe Logistics', 'Hannah Nakibuule', '+256 700 200 007', 'dispatch@sitesafe.ug', 'transport', 'Net 15', 'TIN10007', 'active'),
  (gen_random_uuid(), 'Precision Tools & Equipment', 'Isaac Kizza', '+256 700 200 008', 'rent@precisiontools.ug', 'equipment', 'Net 30', 'TIN10008', 'active')
ON CONFLICT DO NOTHING;

SELECT id INTO _sup1 FROM suppliers WHERE name = 'RoofMart Uganda Ltd';
SELECT id INTO _sup2 FROM suppliers WHERE name = 'SteelPro East Africa';
SELECT id INTO _sup3 FROM suppliers WHERE name = 'BuildHard Ware Ltd';
SELECT id INTO _sup4 FROM suppliers WHERE name = 'Kampala Cement Distributors';
SELECT id INTO _sup5 FROM suppliers WHERE name = 'Prime Plumbing Supplies';
SELECT id INTO _sup6 FROM suppliers WHERE name = 'Eagle Electricals Ltd';
SELECT id INTO _sup7 FROM suppliers WHERE name = 'SiteSafe Logistics';
SELECT id INTO _sup8 FROM suppliers WHERE name = 'Precision Tools & Equipment';

-- =========================================================
-- STEP 5: PROJECTS (5 projects with increasing complexity)
-- =========================================================
INSERT INTO projects (id, name, description, location, status, start_date, target_end_date, budget, total_spent, client_name, client_phone, client_email, notes, created_by) VALUES
  (gen_random_uuid(), 'Ntinda Heights Apartment Block',
   'Construction of a 4-storey luxury apartment block with 12 units, rooftop terrace, and basement parking.',
   'Ntinda, Kampala', 'in_progress',
   _today - INTERVAL '120 days', _today + INTERVAL '240 days',
   8500000000, 2100000000,
   'Victoria Properties Ltd', '+256 701 500 001', 'enquiries@victoriaproperties.ug',
   'Flagship project. High-end finishes, elevator shaft prepped.', _user_id),

  (gen_random_uuid(), 'Kyambogo University Science Block',
   'New 3-storey science and laboratory building with 8 classrooms, 4 labs, and a lecture hall.',
   'Kyambogo University Campus', 'in_progress',
   _today - INTERVAL '60 days', _today + INTERVAL '300 days',
   6200000000, 1100000000,
   'Kyambogo University', '+256 414 500 002', 'procurement@kyambogo.ac.ug',
   'Government contract. Strict compliance with PPDA rules.', _user_id),

  (gen_random_uuid(), 'Luzira Waterfront Villa',
   'Luxury 5-bedroom private residence with swimming pool, landscaped garden, and guest house.',
   'Luzira, Kampala', 'planning',
   _today + INTERVAL '30 days', _today + INTERVAL '210 days',
   3200000000, 0,
   'Dr. Andrew Mubiru', '+256 702 500 003', 'andrew.mubiru@email.com',
   'Private client. Architect-designed. Imported finishes.', _user_id),

  (gen_random_uuid(), 'Bukoto Commercial Plaza',
   'Mixed-use commercial building: 2 floors retail, 3 floors office, rooftop restaurant.',
   'Bukoto, Kampala', 'on_hold',
   _today - INTERVAL '45 days', _today + INTERVAL '275 days',
   7400000000, 450000000,
   'Mukwano Enterprises Ltd', '+256 703 500 004', 'commercial@mukwanogroup.co.ug',
   'On hold pending zoning approval from KCCA.', _user_id),

  (gen_random_uuid(), 'Entebbe Airport View Estate',
   'Gated community of 20 townhouses with community centre, playground, and security post.',
   'Entebbe, Wakiso', 'completed',
   _today - INTERVAL '365 days', _today - INTERVAL '15 days',
   12000000000, 11800000000,
   'Habico Real Estate Dev Ltd', '+256 704 500 005', 'developments@habico.ug',
   'Completed. Final snag list in progress. 16/20 units sold.', _user_id)
ON CONFLICT DO NOTHING;

SELECT id INTO _proj1 FROM projects WHERE name = 'Ntinda Heights Apartment Block';
SELECT id INTO _proj2 FROM projects WHERE name = 'Kyambogo University Science Block';
SELECT id INTO _proj3 FROM projects WHERE name = 'Luzira Waterfront Villa';
SELECT id INTO _proj4 FROM projects WHERE name = 'Bukoto Commercial Plaza';
SELECT id INTO _proj5 FROM projects WHERE name = 'Entebbe Airport View Estate';

-- =========================================================
-- STEP 6: PROJECT BUDGETS (2-4 categories per project)
-- =========================================================
INSERT INTO project_budgets (project_id, category, budgeted, committed, spent) VALUES
  (_proj1, 'Structural', 2800000000, 1200000000, 900000000),
  (_proj1, 'Finishes', 3500000000, 500000000, 200000000),
  (_proj1, 'Mechanical & Electrical', 1500000000, 300000000, 150000000),
  (_proj1, 'Site & Foundation', 700000000, 650000000, 600000000),

  (_proj2, 'Structural', 2200000000, 800000000, 500000000),
  (_proj2, 'Laboratory Fit-out', 1800000000, 200000000, 50000000),
  (_proj2, 'Electrical', 900000000, 100000000, 30000000),
  (_proj2, 'Plumbing & Drainage', 600000000, 50000000, 20000000),

  (_proj3, 'Structural', 1200000000, 0, 0),
  (_proj3, 'Finishes', 1000000000, 0, 0),
  (_proj3, 'Landscaping & Pool', 600000000, 0, 0),

  (_proj4, 'Structural', 2500000000, 200000000, 150000000),
  (_proj4, 'Retail Fit-out', 2000000000, 0, 0),
  (_proj4, 'Services', 1500000000, 50000000, 30000000),

  (_proj5, 'Structural', 4000000000, 3900000000, 3900000000),
  (_proj5, 'Finishes', 3800000000, 3700000000, 3700000000),
  (_proj5, 'Infrastructure', 2500000000, 2400000000, 2400000000),
  (_proj5, 'Landscaping', 1200000000, 1150000000, 1150000000);

-- =========================================================
-- STEP 7: PROJECT TASKS (hierarchical for each active project)
-- =========================================================
-- Project 1 tasks
INSERT INTO project_tasks (project_id, title, description, status, priority, due_date, estimated_hours, sort_order) VALUES
  (_proj1, 'Site clearing and grading', 'Clear vegetation, level ground, set out building lines', 'done', 'high', _today - INTERVAL '90 days', 160, 1),
  (_proj1, 'Foundation excavation and pouring', 'Excavate to 2m depth, pour reinforced strip footings', 'done', 'high', _today - INTERVAL '60 days', 320, 2),
  (_proj1, 'Ground floor slab and columns', 'Form, reinforce, and pour ground floor slab and RC columns', 'in_progress', 'high', _today + INTERVAL '10 days', 400, 3),
  (_proj1, 'First floor construction', 'First floor slab, beams, and columns', 'in_progress', 'high', _today + INTERVAL '50 days', 480, 4),
  (_proj1, 'Roof structure and waterproofing', 'Steel roof trusses, roofing sheets, waterproof membrane', 'todo', 'high', _today + INTERVAL '100 days', 360, 5),
  (_proj1, 'Internal walling and plastering', 'Block walls, plaster, screeding', 'todo', 'medium', _today + INTERVAL '140 days', 640, 6),
  (_proj1, 'Electrical rough-in', 'Conduits, wiring, back boxes', 'todo', 'medium', _today + INTERVAL '150 days', 320, 7),
  (_proj1, 'Plumbing rough-in', 'Pipes, drainage, water heater connections', 'todo', 'medium', _today + INTERVAL '150 days', 240, 8),
  (_proj1, 'Floor and wall tiling', 'All wet areas and specified floor finishes', 'todo', 'medium', _today + INTERVAL '180 days', 480, 9),
  (_proj1, 'Painting and final finishes', 'Emulsion, enamel, skirting, ironmongery', 'todo', 'low', _today + INTERVAL '210 days', 400, 10),
  (_proj1, 'Handover and snag list', 'Client walkthrough, fix snags, handover documents', 'todo', 'high', _today + INTERVAL '240 days', 80, 11)
ON CONFLICT DO NOTHING;

SELECT id INTO _task_p1_1 FROM project_tasks WHERE project_id = _proj1 AND title = 'Site clearing and grading';
SELECT id INTO _task_p1_2 FROM project_tasks WHERE project_id = _proj1 AND title = 'Foundation excavation and pouring';
SELECT id INTO _task_p1_3 FROM project_tasks WHERE project_id = _proj1 AND title = 'Ground floor slab and columns';
SELECT id INTO _task_p1_4 FROM project_tasks WHERE project_id = _proj1 AND title = 'First floor construction';
SELECT id INTO _task_p1_5 FROM project_tasks WHERE project_id = _proj1 AND title = 'Roof structure and waterproofing';

-- Project 2 tasks
INSERT INTO project_tasks (project_id, title, description, status, priority, due_date, estimated_hours, sort_order) VALUES
  (_proj2, 'Demolition and site prep', 'Remove existing structure, level site', 'done', 'high', _today - INTERVAL '30 days', 120, 1),
  (_proj2, 'Foundation and ground slab', 'Excavation, hardcore, blinding, reinforcement, pour', 'in_progress', 'high', _today + INTERVAL '20 days', 360, 2),
  (_proj2, 'Superstructure to 2nd floor', 'Columns, beams, slabs for 3 floors', 'todo', 'high', _today + INTERVAL '90 days', 720, 3),
  (_proj2, 'Roofing and ceiling', 'Roof structure, ceiling grid', 'todo', 'medium', _today + INTERVAL '130 days', 240, 4),
  (_proj2, 'Laboratory fit-out', 'Specialised lab benching, fume hoods, gas lines', 'todo', 'high', _today + INTERVAL '220 days', 400, 5),
  (_proj2, 'External works', 'Parking, drainage, landscaping', 'todo', 'low', _today + INTERVAL '280 days', 160, 6)
ON CONFLICT DO NOTHING;

SELECT id INTO _task_p2_1 FROM project_tasks WHERE project_id = _proj2 AND title = 'Demolition and site prep';
SELECT id INTO _task_p2_2 FROM project_tasks WHERE project_id = _proj2 AND title = 'Foundation and ground slab';
SELECT id INTO _task_p2_3 FROM project_tasks WHERE project_id = _proj2 AND title = 'Superstructure to 2nd floor';

-- =========================================================
-- STEP 8: PROJECT SCHEDULES
-- =========================================================
-- Project 1 schedule (WBS)
INSERT INTO project_schedules (project_id, parent_id, title, start_date, end_date, milestone, status, progress, assignee) VALUES
  (_proj1, NULL, 'Ntinda Heights — Master Schedule', _today - INTERVAL '120 days', _today + INTERVAL '240 days', false, 'in_progress', 30, 'Sarah Nakato');

SELECT id INTO _sched1 FROM project_schedules WHERE project_id = _proj1 AND title LIKE 'Ntinda Heights%';

INSERT INTO project_schedules (project_id, parent_id, title, start_date, end_date, milestone, status, progress, assignee) VALUES
  (_proj1, _sched1, 'Site Preparation', _today - INTERVAL '120 days', _today - INTERVAL '90 days', false, 'completed', 100, 'John Mwangi'),
  (_proj1, _sched1, 'Foundation', _today - INTERVAL '90 days', _today - INTERVAL '45 days', false, 'completed', 100, 'John Mwangi'),
  (_proj1, _sched1, 'Structural Frame', _today - INTERVAL '45 days', _today + INTERVAL '60 days', false, 'in_progress', 45, 'John Mwangi'),
  (_proj1, _sched1, 'Roofing', _today + INTERVAL '60 days', _today + INTERVAL '100 days', false, 'planned', 0, 'John Mwangi'),
  (_proj1, _sched1, 'MEP Services', _today + INTERVAL '80 days', _today + INTERVAL '170 days', false, 'planned', 0, 'David Ssempijja'),
  (_proj1, _sched1, 'Interior Finishes', _today + INTERVAL '100 days', _today + INTERVAL '210 days', false, 'planned', 0, 'Jennifer Akello'),
  (_proj1, _sched1, 'Handover', _today + INTERVAL '240 days', _today + INTERVAL '240 days', true, 'planned', 0, 'Sarah Nakato');

SELECT id INTO _sched2 FROM project_schedules WHERE project_id = _proj1 AND title = 'Site Preparation';
SELECT id INTO _sched3 FROM project_schedules WHERE project_id = _proj1 AND title = 'Structural Frame';

-- Project 2 schedule
INSERT INTO project_schedules (project_id, parent_id, title, start_date, end_date, milestone, status, progress, assignee) VALUES
  (_proj2, NULL, 'Kyambogo University — Master Schedule', _today - INTERVAL '60 days', _today + INTERVAL '300 days', false, 'in_progress', 12, 'Sarah Nakato');

SELECT id INTO _sched4 FROM project_schedules WHERE project_id = _proj2 AND title LIKE 'Kyambogo University%';

INSERT INTO project_schedules (project_id, parent_id, title, start_date, end_date, milestone, status, progress, assignee) VALUES
  (_proj2, _sched4, 'Demolition & Prep', _today - INTERVAL '60 days', _today - INTERVAL '30 days', false, 'completed', 100, 'John Mwangi'),
  (_proj2, _sched4, 'Foundation', _today - INTERVAL '30 days', _today + INTERVAL '30 days', false, 'in_progress', 60, 'John Mwangi'),
  (_proj2, _sched4, 'Superstructure', _today + INTERVAL '30 days', _today + INTERVAL '130 days', false, 'planned', 0, 'John Mwangi'),
  (_proj2, _sched4, 'Roofing & Ceiling', _today + INTERVAL '130 days', _today + INTERVAL '170 days', false, 'planned', 0, 'Grace Tumusiime'),
  (_proj2, _sched4, 'Lab Fit-out', _today + INTERVAL '170 days', _today + INTERVAL '260 days', false, 'planned', 0, 'Diana Kyomugisha'),
  (_proj2, _sched4, 'External & Handover', _today + INTERVAL '260 days', _today + INTERVAL '300 days', false, 'planned', 0, 'Sarah Nakato');

-- Project 5 schedule (completed)
INSERT INTO project_schedules (project_id, parent_id, title, start_date, end_date, milestone, status, progress, assignee) VALUES
  (_proj5, NULL, 'Entebbe Airport View — Master Schedule', _today - INTERVAL '365 days', _today - INTERVAL '15 days', false, 'completed', 100, 'Sarah Nakato');

SELECT id INTO _sched5 FROM project_schedules WHERE project_id = _proj5 AND title LIKE 'Entebbe Airport%';

INSERT INTO project_schedules (project_id, parent_id, title, start_date, end_date, milestone, status, progress, assignee) VALUES
  (_proj5, _sched5, 'Phase 1 — Infrastructure', _today - INTERVAL '365 days', _today - INTERVAL '270 days', false, 'completed', 100, 'John Mwangi'),
  (_proj5, _sched5, 'Phase 2 — Townhouses 1-10', _today - INTERVAL '300 days', _today - INTERVAL '100 days', false, 'completed', 100, 'John Mwangi'),
  (_proj5, _sched5, 'Phase 3 — Townhouses 11-20', _today - INTERVAL '230 days', _today - INTERVAL '30 days', false, 'completed', 100, 'John Mwangi'),
  (_proj5, _sched5, 'Phase 4 — Community Centre', _today - INTERVAL '180 days', _today - INTERVAL '50 days', false, 'completed', 100, 'Grace Tumusiime'),
  (_proj5, _sched5, 'Phase 5 — Landscaping & Handover', _today - INTERVAL '120 days', _today - INTERVAL '15 days', false, 'completed', 100, 'Sarah Nakato');

-- =========================================================
-- STEP 9: LEADS
-- =========================================================
INSERT INTO leads (project_id, source, contact_name, contact_phone, contact_email, company, description, status, budget_range_min, budget_range_max, notes, assigned_to) VALUES
  (_proj1, 'referral', 'Margaret Kiyimba', '+256 705 300 001', 'mkiyimba@email.com', 'Kiyimba Holdings', 'Interested in commercial space in Ntinda', 'qualified', 50000000, 150000000, 'Looking for 200sqm ground floor retail.', _user_id),
  (NULL, 'website', 'Joseph Wasswa', '+256 705 300 002', 'jwasswa@gmail.com', NULL, 'New home construction — 3 bed bungalow', 'new', 300000000, 500000000, 'Has land in Kira. Needs design + build.', _user_id),
  (_proj5, 'direct', 'Henry Mugerwa', '+256 705 300 003', 'henry@mugerwa.co.ug', 'Mugerwa & Sons Ltd', 'Interested in purchasing 2 townhouses at Entebbe View', 'proposal', 600000000, 700000000, 'Wants units 7 and 8. Discussing payment plan.', _user_id),
  (NULL, 'phone', 'Dr. Susan Nalule', '+256 705 300 004', 'snalule@med.ug', 'Nalule Medical Centre', 'Fit-out of medical clinic — 400sqm in Bugolobi', 'contacted', 200000000, 350000000, 'Existing shell. Needs full medical fit-out.', _user_id),
  (_proj2, 'website', 'Kyambogo VC Office', '+256 414 500 010', 'vc@kyambogo.ac.ug', 'Kyambogo University', 'Additional 2-storey annex building', 'qualified', 2000000000, 3000000000, 'Future expansion. Not yet funded.', _user_id);

SELECT id INTO _lead1 FROM leads WHERE contact_name = 'Margaret Kiyimba';
SELECT id INTO _lead2 FROM leads WHERE contact_name = 'Joseph Wasswa';
SELECT id INTO _lead3 FROM leads WHERE contact_name = 'Henry Mugerwa';
SELECT id INTO _lead4 FROM leads WHERE contact_name = 'Dr. Susan Nalule';
SELECT id INTO _lead5 FROM leads WHERE contact_name LIKE 'Kyambogo VC%';

-- =========================================================
-- STEP 10: ESTIMATES + ITEMS
-- =========================================================
INSERT INTO estimates (project_id, lead_id, estimate_number, title, description, status, subtotal, tax_rate, tax_amount, total_amount, valid_until, created_by) VALUES
  (_proj3, NULL, 'EST-2026-001', 'Luzira Villa — Structural Works', 'Preliminary estimate for structural works including foundation, frame, and roof', 'approved', 1250000000, 18, 225000000, 1475000000, _today + INTERVAL '60 days', _user_id),
  (_proj3, NULL, 'EST-2026-002', 'Luzira Villa — Finishes & Interiors', 'High-end finishes estimate with imported materials', 'draft', 980000000, 18, 176400000, 1156400000, _today + INTERVAL '45 days', _user_id),
  (_proj1, _lead1, 'EST-2026-003', 'Ntinda Heights — Retail Space Fit-out', 'Fit-out of ground floor retail unit (200sqm)', 'pending', 180000000, 18, 32400000, 212400000, _today + INTERVAL '30 days', _user_id);

SELECT id INTO _est1 FROM estimates WHERE estimate_number = 'EST-2026-001';
SELECT id INTO _est2 FROM estimates WHERE estimate_number = 'EST-2026-002';
SELECT id INTO _est3 FROM estimates WHERE estimate_number = 'EST-2026-003';

INSERT INTO estimate_items (estimate_id, description, quantity, unit_price, total_price, notes) VALUES
  (_est1, 'Excavation and earthworks', 1, 180000000, 180000000, '2m depth, including disposal'),
  (_est1, 'Reinforced concrete foundation', 1, 320000000, 320000000, 'Strip footings + ground beam'),
  (_est1, 'RC columns and beams (G+1)', 1, 450000000, 450000000, '12 columns, ring beams'),
  (_est1, 'Roof structure (timber + iron sheets)', 1, 180000000, 180000000, 'Pitched roof, clay tiles'),
  (_est1, 'External walling (stone + block)', 1, 120000000, 120000000, 'Random stone + plaster'),

  (_est2, 'Italian porcelain floor tiles', 350, 185000, 64750000, '600x600, imported'),
  (_est2, 'Solid wood interior doors', 12, 2500000, 30000000, 'Mahogany, 5-panel'),
  (_est2, 'Custom kitchen cabinetry', 1, 65000000, 65000000, 'Full fit, granite tops'),
  (_est2, 'Bathroom sanitary ware', 5, 8000000, 40000000, 'American Standard, imported'),
  (_est2, 'Paint and decorative finishes', 1, 45000000, 45000000, 'Dulux trade, full spec'),

  (_est3, 'Partition walls (drywall)', 80, 180000, 14400000, 'Metal stud + plasterboard'),
  (_est3, 'Floor screed and vinyl', 200, 85000, 17000000, 'Commercial grade vinyl'),
  (_est3, 'Electrical fit-out', 1, 45000000, 45000000, 'Lighting, sockets, data'),
  (_est3, 'HVAC (split units)', 4, 6500000, 26000000, '2.5HP inverter units');

-- =========================================================
-- STEP 11: PROPOSALS
-- =========================================================
INSERT INTO proposals (project_id, lead_id, estimate_id, proposal_number, title, content, status, total_amount, valid_until, created_by) VALUES
  (_proj5, _lead3, NULL, 'PROP-2026-001', 'Townhouse Purchase — Entebbe Airport View',
   'Proposal for the sale of Units 7 & 8 at Entebbe Airport View Estate. Each unit: 3-bed townhouse with parking, 150sqm, UGX 320M each.',
   'sent', 640000000, _today + INTERVAL '30 days', _user_id),
  (NULL, _lead4, NULL, 'PROP-2026-002', 'Bugolobi Medical Clinic Fit-out',
   'Design, supply, and installation of medical fit-out including partition layout, plumbing, electrical, HVAC, and compliance with Ministry of Health standards.',
   'draft', 285000000, _today + INTERVAL '45 days', _user_id);

SELECT id INTO _prop1 FROM proposals WHERE proposal_number = 'PROP-2026-001';
SELECT id INTO _prop2 FROM proposals WHERE proposal_number = 'PROP-2026-002';

-- =========================================================
-- STEP 12: BID PACKAGES
-- =========================================================
INSERT INTO bid_packages (project_id, title, description, status, due_date, estimated_budget, notes, created_by) VALUES
  (_proj1, 'Steel reinforcement supply', 'Supply of T8, T12, T16, T20 rebar for entire project', 'awarded', _today - INTERVAL '80 days', 450000000, 'Awarded to SteelPro East Africa', _user_id),
  (_proj2, 'Laboratory equipment supply', 'Supply and installation of science lab equipment', 'sent', _today + INTERVAL '60 days', 800000000, '5 shortlisted vendors', _user_id);
SELECT id INTO _bid1 FROM bid_packages WHERE title = 'Steel reinforcement supply';
SELECT id INTO _bid2 FROM bid_packages WHERE title = 'Laboratory equipment supply';

-- =========================================================
-- STEP 13: INVENTORY ITEMS
-- =========================================================
INSERT INTO inventory_items (id, name, description, category, unit, quantity, min_stock_level, unit_cost, selling_price, supplier_id, location, sku) VALUES
  (gen_random_uuid(), 'Ordinary Portland Cement', 'Hima 50kg bags', 'building_materials', 'bag', 450, 100, 32000, 34000, _sup4, 'warehouse', 'CEM-OPC-50'),
  (gen_random_uuid(), 'Steel Reinforcement T12', '12mm high-yield rebar, 12m lengths', 'building_materials', 'piece', 200, 50, 85000, 92000, _sup2, 'warehouse', 'STL-T12-12M'),
  (gen_random_uuid(), 'Clay Roofing Tiles', 'Terracotta interlocking tiles, per m2', 'building_materials', 'm2', 850, 200, 45000, 52000, _sup1, 'warehouse', 'RUF-CLAY-M2'),
  (gen_random_uuid(), 'PVC Pipes 110mm', '110mm diameter drain pipes, 6m lengths', 'plumbing', 'piece', 120, 30, 35000, 38000, _sup5, 'site_a', 'PLM-PVC110-6M'),
  (gen_random_uuid(), 'Armoured Cable 16mm²', '4-core SWA cable for mains supply', 'electrical', 'meter', 500, 100, 12000, 13500, _sup6, 'warehouse', 'ELC-ARM16-4C'),
  (gen_random_uuid(), 'Ceramic Wall Tiles', 'White gloss 300x600mm, per m2', 'building_materials', 'm2', 600, 150, 28000, 32000, _sup3, 'warehouse', 'TIL-WHT-3060'),
  (gen_random_uuid(), 'Plasterboard 12mm', 'Standard 2400x1200mm plasterboard sheets', 'building_materials', 'sheet', 300, 80, 18000, 20000, _sup3, 'site_a', 'PLB-12-2412'),
  (gen_random_uuid(), 'Copper Wire 2.5mm²', 'Single-core PVC-insulated, 100m coil', 'electrical', 'roll', 45, 10, 85000, 92000, _sup6, 'warehouse', 'ELC-COPP25')
ON CONFLICT DO NOTHING;

SELECT id INTO _inv1 FROM inventory_items WHERE sku = 'CEM-OPC-50';
SELECT id INTO _inv2 FROM inventory_items WHERE sku = 'STL-T12-12M';
SELECT id INTO _inv3 FROM inventory_items WHERE sku = 'RUF-CLAY-M2';
SELECT id INTO _inv4 FROM inventory_items WHERE sku = 'PLM-PVC110-6M';
SELECT id INTO _inv5 FROM inventory_items WHERE sku = 'ELC-ARM16-4C';
SELECT id INTO _inv6 FROM inventory_items WHERE sku = 'TIL-WHT-3060';
SELECT id INTO _inv7 FROM inventory_items WHERE sku = 'PLB-12-2412';
SELECT id INTO _inv8 FROM inventory_items WHERE sku = 'ELC-COPP25';

-- =========================================================
-- STEP 14: INVENTORY TRANSACTIONS
-- =========================================================
INSERT INTO inventory_transactions (item_id, type, quantity, unit_price, total_price, reference_type, project_id, notes, recorded_by) VALUES
  (_inv1, 'purchase', 200, 32000, 6400000, 'purchase_order', _proj1, 'Initial cement delivery for foundation', _user_id),
  (_inv1, 'purchase', 150, 32000, 4800000, 'purchase_order', _proj2, 'Cement for ground slab', _user_id),
  (_inv2, 'purchase', 80, 85000, 6800000, 'purchase_order', _proj1, 'Rebar for columns and beams', _user_id),
  (_inv4, 'purchase', 60, 35000, 2100000, 'purchase_order', _proj1, 'Drainage pipes for basement', _user_id),
  (_inv5, 'purchase', 200, 12000, 2400000, 'purchase_order', _proj2, 'Main supply cable for lab building', _user_id),
  (_inv3, 'purchase', 500, 45000, 22500000, 'purchase_order', _proj5, 'Roof tiles for townhouses phase 2', _user_id),
  (_inv6, 'purchase', 300, 28000, 8400000, 'purchase_order', _proj5, 'Wall tiles for bathrooms', _user_id),
  (_inv1, 'adjustment', -5, 32000, -160000, 'adjustment', NULL, 'Damaged bags during handling', _user_id);

-- =========================================================
-- STEP 15: PURCHASE ORDERS + ITEMS
-- =========================================================
INSERT INTO purchase_orders (id, order_number, supplier_id, project_id, status, order_date, expected_date, subtotal, total_amount, notes, created_by) VALUES
  (gen_random_uuid(), 'PO-2026-0001', _sup4, _proj1, 'received', _today - INTERVAL '110 days', _today - INTERVAL '100 days', 102400000, 102400000, 'Bulk cement order for foundation and ground floor', _user_id),
  (gen_random_uuid(), 'PO-2026-0002', _sup2, _proj1, 'received', _today - INTERVAL '95 days', _today - INTERVAL '90 days', 6800000, 6800000, 'Rebar order — T12 and T16', _user_id),
  (gen_random_uuid(), 'PO-2026-0003', _sup3, _proj2, 'ordered', _today - INTERVAL '10 days', _today + INTERVAL '10 days', 15400000, 15400000, 'Plasterboard and framing materials', _user_id),
  (gen_random_uuid(), 'PO-2026-0004', _sup6, _proj2, 'pending', _today, _today + INTERVAL '14 days', 42000000, 42000000, 'Electrical materials for lab block', _user_id);

SELECT id INTO _po1 FROM purchase_orders WHERE order_number = 'PO-2026-0001';
SELECT id INTO _po2 FROM purchase_orders WHERE order_number = 'PO-2026-0002';
SELECT id INTO _po3 FROM purchase_orders WHERE order_number = 'PO-2026-0003';
SELECT id INTO _po4 FROM purchase_orders WHERE order_number = 'PO-2026-0004';

INSERT INTO purchase_order_items (purchase_order_id, item_id, description, quantity, unit_price, total_price, received_quantity) VALUES
  (_po1, _inv1, 'Hima OPC 50kg bags', 200, 32000, 6400000, 200),
  (_po1, _inv1, 'Hima OPC 50kg bags (second batch)', 120, 32000, 3840000, 120),
  (_po2, _inv2, 'T12 rebar 12m lengths', 80, 85000, 6800000, 80),
  (_po3, _inv7, 'Plasterboard 12mm sheets', 150, 18000, 2700000, 0),
  (_po3, NULL, 'Metal studs 70mm (100)', 100, 45000, 4500000, 0),
  (_po4, _inv5, '16mm² 4-core SWA cable (meters)', 200, 12000, 2400000, 0),
  (_po4, NULL, 'Distribution board 24-way', 4, 1250000, 5000000, 0);

-- =========================================================
-- STEP 16: SUBCONTRACTS
-- =========================================================
INSERT INTO subcontracts (id, contract_number, project_id, supplier_id, scope_of_work, contract_amount, start_date, end_date, status, retention_percent, paid_to_date, created_by) VALUES
  (gen_random_uuid(), 'SUB-2026-001', _proj1, _sup7, 'Transport and logistics for all material deliveries to Ntinda Heights site. Includes crane hire for heavy lifts.', 280000000, _today - INTERVAL '110 days', _today + INTERVAL '130 days', 'active', 5, 85000000, _user_id),
  (gen_random_uuid(), 'SUB-2026-002', _proj2, NULL, 'Steel structure fabrication and erection for science block. Supply and install all structural steelwork.', 520000000, _today - INTERVAL '30 days', _today + INTERVAL '90 days', 'active', 5, 100000000, _user_id),
  (gen_random_uuid(), 'SUB-2026-003', _proj5, _sup1, 'Roofing works for Phase 3 townhouses. Supply and install all roofing materials for 10 units.', 380000000, _today - INTERVAL '180 days', _today - INTERVAL '60 days', 'completed', 5, 361000000, _user_id);

SELECT id INTO _sub1 FROM subcontracts WHERE contract_number = 'SUB-2026-001';
SELECT id INTO _sub2 FROM subcontracts WHERE contract_number = 'SUB-2026-002';
SELECT id INTO _sub3 FROM subcontracts WHERE contract_number = 'SUB-2026-003';

-- =========================================================
-- STEP 17: CHANGE ORDERS
-- =========================================================
INSERT INTO change_orders (id, change_order_number, project_id, title, description, status, amount, reason, created_by) VALUES
  (gen_random_uuid(), 'CO-2026-001', _proj1, 'Additional basement waterproofing', 'Client requested full tanking membrane to basement walls instead of standard DPC', 'approved', 185000000, 'Design change per client instruction', _user_id),
  (gen_random_uuid(), 'CO-2026-002', _proj5, 'Upgrade bathroom fittings', 'Upgrade from standard to premium sanitary ware in 4 show units', 'approved', 28000000, 'Marketing upgrade', _user_id);

SELECT id INTO _co1 FROM change_orders WHERE change_order_number = 'CO-2026-001';
SELECT id INTO _co2 FROM change_orders WHERE change_order_number = 'CO-2026-002';

-- =========================================================
-- STEP 18: BILLS
-- =========================================================
INSERT INTO bills (id, bill_number, project_id, supplier_id, description, amount, due_date, status, paid_date, created_by) VALUES
  (gen_random_uuid(), 'BILL-2026-001', _proj1, _sup4, 'Cement delivery — 320 bags Hima OPC', 10240000, _today - INTERVAL '5 days', 'paid', _today - INTERVAL '2 days', _user_id),
  (gen_random_uuid(), 'BILL-2026-002', _proj1, _sup2, 'Rebar T12/T16 — 80 lengths', 6800000, _today + INTERVAL '15 days', 'unpaid', NULL, _user_id),
  (gen_random_uuid(), 'BILL-2026-003', _proj2, _sup3, 'Framing materials for lab block', 15400000, _today + INTERVAL '30 days', 'unpaid', NULL, _user_id),
  (gen_random_uuid(), 'BILL-2026-004', _proj5, _sup1, 'Roof tiles — final installment', 11250000, _today - INTERVAL '30 days', 'overdue', NULL, _user_id);

SELECT id INTO _bill1 FROM bills WHERE bill_number = 'BILL-2026-001';
SELECT id INTO _bill2 FROM bills WHERE bill_number = 'BILL-2026-002';
SELECT id INTO _bill3 FROM bills WHERE bill_number = 'BILL-2026-003';
SELECT id INTO _bill4 FROM bills WHERE bill_number = 'BILL-2026-004';

-- =========================================================
-- STEP 19: LIEN WAIVERS
-- =========================================================
INSERT INTO lien_waivers (project_id, supplier_id, waiver_type, amount, status, signed_date, created_by) VALUES
  (_proj5, _sup1, 'final', 380000000, 'received', _today - INTERVAL '30 days', _user_id),
  (_proj5, _sup2, 'final', 280000000, 'signed', _today - INTERVAL '45 days', _user_id);
SELECT id INTO _lien1 FROM lien_waivers WHERE amount = 380000000;
SELECT id INTO _lien2 FROM lien_waivers WHERE amount = 280000000;

-- =========================================================
-- STEP 20: ALLOWANCES
-- =========================================================
INSERT INTO allowances (project_id, title, description, budgeted_amount, spent_amount, status) VALUES
  (_proj1, 'Contingency — Architectural', 'Allowance for architectural changes during construction', 250000000, 45000000, 'open'),
  (_proj1, 'Contingency — MEP', 'Allowance for unforeseen MEP coordination issues', 150000000, 20000000, 'open'),
  (_proj5, 'Landscaping contingency', 'Allowance for additional planting and hardscape', 80000000, 80000000, 'exhausted');
SELECT id INTO _allow1 FROM allowances WHERE title = 'Contingency — Architectural';
SELECT id INTO _allow2 FROM allowances WHERE title = 'Contingency — MEP';
SELECT id INTO _allow3 FROM allowances WHERE title = 'Landscaping contingency';

-- =========================================================
-- STEP 21: COMMITMENT LOG
-- =========================================================
INSERT INTO commitment_log (project_id, vendor, type, description, amount, budget_line, status, executed_date, created_by) VALUES
  (_proj1, 'SteelPro East Africa', 'purchase_order', 'Rebar supply contract', 450000000, 'Structural — Steel', 'executed', _today - INTERVAL '90 days', _user_id),
  (_proj1, 'RoofMart Uganda Ltd', 'subcontract', 'Roofing subcontract', 280000000, 'Roofing', 'approved', _today - INTERVAL '10 days', _user_id),
  (_proj5, 'BuildHard Ware Ltd', 'purchase_order', 'Final batch of finishing materials', 185000000, 'Finishes', 'completed', _today - INTERVAL '60 days', _user_id);
SELECT id INTO _comm1 FROM commitment_log WHERE vendor = 'SteelPro East Africa';
SELECT id INTO _comm2 FROM commitment_log WHERE vendor = 'RoofMart Uganda Ltd';
SELECT id INTO _comm3 FROM commitment_log WHERE vendor = 'BuildHard Ware Ltd';

-- =========================================================
-- STEP 22: PROGRESS PAYMENTS
-- =========================================================
INSERT INTO progress_payments (project_id, application_number, period_label, period_start, period_end, amount, retainage, net_amount, status, submit_date, created_by) VALUES
  (_proj1, 'PP-2026-001', 'January 2026', _today - INTERVAL '60 days', _today - INTERVAL '30 days', 450000000, 22500000, 427500000, 'paid', _today - INTERVAL '25 days', _user_id),
  (_proj1, 'PP-2026-002', 'February 2026', _today - INTERVAL '30 days', _today, 380000000, 19000000, 361000000, 'submitted', _today - INTERVAL '2 days', _user_id);
SELECT id INTO _pp1 FROM progress_payments WHERE application_number = 'PP-2026-001';
SELECT id INTO _pp2 FROM progress_payments WHERE application_number = 'PP-2026-002';

-- =========================================================
-- STEP 23: ASSETS + MAINTENANCE
-- =========================================================
INSERT INTO assets (id, name, description, category, serial_number, model, manufacturer, purchase_date, purchase_cost, current_value, status, condition, location, assigned_to, project_id) VALUES
  (gen_random_uuid(), 'JCB 3CX Backhoe Loader', '2019 model, 4x4 backhoe loader', 'equipment', 'JCB-3CX-1901', '3CX', 'JCB', _today - INTERVAL '600 days', 280000000, 210000000, 'in_use', 'good', 'Main Yard', NULL, _proj1),
  (gen_random_uuid(), 'Hilti TE 70-AVR Breaker', 'Electric demolition hammer with SDS max', 'tool', 'HIL-TE70-210', 'TE 70-AVR', 'Hilti', _today - INTERVAL '300 days', 8500000, 5500000, 'in_use', 'good', 'Tool Store', _emp3, _proj1),
  (gen_random_uuid(), 'BOSCH GCM 12 GDL Miter Saw', 'Professional sliding compound miter saw', 'tool', 'BOS-GCM12-345', 'GCM 12 GDL', 'Bosch', _today - INTERVAL '200 days', 4200000, 3200000, 'available', 'excellent', 'Tool Store', NULL, NULL),
  (gen_random_uuid(), 'Mitsubishi 6.5kVA Generator', 'Diesel generator with ATS panel', 'equipment', 'MIT-65KVA-678', 'S6L2-PT', 'Mitsubishi', _today - INTERVAL '500 days', 18500000, 14000000, 'in_use', 'good', 'Site B', NULL, _proj2),
  (gen_random_uuid(), 'Toyota Hilux Double Cabin', '2018 white pick-up for site supervision', 'vehicle', 'TOY-HIL-901', 'Hilux GD-6', 'Toyota', _today - INTERVAL '800 days', 160000000, 110000000, 'in_use', 'fair', 'Site Office', _emp2, _proj1);

SELECT id INTO _asset1 FROM assets WHERE serial_number = 'JCB-3CX-1901';
SELECT id INTO _asset2 FROM assets WHERE serial_number = 'HIL-TE70-210';
SELECT id INTO _asset3 FROM assets WHERE serial_number = 'BOS-GCM12-345';
SELECT id INTO _asset4 FROM assets WHERE serial_number = 'MIT-65KVA-678';
SELECT id INTO _asset5 FROM assets WHERE serial_number = 'TOY-HIL-901';

INSERT INTO asset_maintenance (asset_id, maintenance_date, description, type, cost, performed_by, next_maintenance_date, notes) VALUES
  (_asset1, _today - INTERVAL '30 days', 'Oil change, hydraulic fluid top-up, filter replacement', 'service', 850000, 'Site Mechanics', _today + INTERVAL '150 days', 'Regular 250hr service'),
  (_asset5, _today - INTERVAL '15 days', 'Brake pad replacement, tyre rotation, wheel alignment', 'service', 1200000, 'Toyota Uganda', _today + INTERVAL '180 days', 'Scheduled service at 80,000km'),
  (_asset4, _today - INTERVAL '7 days', 'Battery replacement', 'repair', 350000, 'Site Electrician', NULL, 'Battery failed during load test');

-- =========================================================
-- STEP 24: EQUIPMENT RENTALS
-- =========================================================
INSERT INTO equipment_rentals (rental_number, asset_id, employee_id, project_id, start_date, expected_return_date, actual_return_date, daily_rate, total_days, total_charge, deposit_amount, status, condition_before, condition_after, notes, created_by) VALUES
  ('RENT-2026-001', _asset2, _emp3, _proj1, _today - INTERVAL '45 days', _today + INTERVAL '15 days', NULL, 50000, 0, 0, 200000, 'active', 'Good — fully functional', NULL, 'For foundation demolition works', _user_id),
  ('RENT-2026-002', _asset3, _emp4, _proj5, _today - INTERVAL '90 days', _today - INTERVAL '20 days', _today - INTERVAL '18 days', 35000, 70, 2450000, 100000, 'returned', 'Excellent', 'Good — light use', 'Used for all trim carpentry in phase 2', _user_id);

-- =========================================================
-- STEP 25: EXPENSES
-- =========================================================
INSERT INTO expenses (category_id, project_id, title, description, amount, expense_date, payment_method, vendor, notes, recorded_by) VALUES
  (_ec1, _proj1, 'Bulk cement purchase', 'Hima OPC 320 bags for foundation', 10240000, _today - INTERVAL '105 days', 'bank_transfer', 'Kampala Cement Distributors', 'Delivery to site, 2 trips', _user_id),
  (_ec2, _proj1, 'Masonry labour week 8-12', 'Block work labour for ground floor walls', 4800000, _today - INTERVAL '30 days', 'cash', 'Peter Okello (crew)', '8 workers x 5 days x 120,000', _user_id),
  (_ec3, _proj1, 'JCB hire', 'Backhoe hire for excavation (3 weeks)', 8400000, _today - INTERVAL '90 days', 'bank_transfer', 'Precision Tools & Equipment', '210,000/day x 40 days', _user_id),
  (_ec4, _proj1, 'Material transport', 'Transport of rebar from SteelPro yard to site', 850000, _today - INTERVAL '80 days', 'cash', 'SiteSafe Logistics', '1 truck load', _user_id),
  (_ec6, _proj1, 'Site electricity bill', 'UMEME connection and monthly usage', 420000, _today - INTERVAL '15 days', 'bank_transfer', 'UMEME', 'Feb 2026 bill', _user_id),
  (_ec5, _proj2, 'Building permit fee', 'KCCA building permit for science block', 8500000, _today - INTERVAL '30 days', 'bank_transfer', 'KCCA', 'Permit #KCCA/BLD/2026/1421', _user_id),
  (_ec1, _proj2, 'Cement for ground slab', 'Hima OPC 150 bags for lab block ground slab', 4800000, _today - INTERVAL '10 days', 'bank_transfer', 'Kampala Cement Distributors', 'Second delivery', _user_id),
  (_ec7, _proj1, 'Steel structure subcontract', 'SteelPro fabrication for basement columns', 12500000, _today - INTERVAL '60 days', 'bank_transfer', 'SteelPro East Africa', 'First milestone payment', _user_id),
  (_ec2, _proj5, 'Final cleaning crew', 'Deep cleaning of all 20 townhouses', 3200000, _today - INTERVAL '10 days', 'cash', 'CleanPro Services', '10 workers x 5 days', _user_id),
  (_ec1, _proj5, 'Landscaping materials', 'Sod, shrubs, irrigation piping for common areas', 12800000, _today - INTERVAL '30 days', 'bank_transfer', 'BuildHard Ware Ltd', 'Phase 5 landscaping order', _user_id),
  (_ec3, _proj5, 'Generator rental', '15kVA generator for site office (3 months)', 5400000, _today - INTERVAL '90 days', 'bank_transfer', 'Precision Tools & Equipment', '60,000/day x 90 days', _user_id),
  (_ec4, _proj5, 'Waste disposal', 'Skip hire and waste removal for Phase 2', 2400000, _today - INTERVAL '120 days', 'cash', 'EnviroClean Ltd', '8 skips total', _user_id),
  (_ec8, _proj1, 'Site office supplies', 'Stationery, PPE, first aid, safety signage', 650000, _today - INTERVAL '20 days', 'cash', 'OfficeMart', 'Monthly supplies', _user_id),
  (_ec2, _proj2, 'Carpentry labour', 'Formwork carpentry for ground floor columns', 2800000, _today - INTERVAL '5 days', 'cash', 'Grace Tumusiime (crew)', '4 carpenters x 5 days', _user_id),
  (_ec6, _proj2, 'Site water', 'Water bowser deliveries to site (no mains)', 760000, _today - INTERVAL '8 days', 'cash', 'WaterLink Services', '3 bowser loads', _user_id);

SELECT id INTO _exp1 FROM expenses WHERE title = 'Bulk cement purchase' AND project_id = _proj1 LIMIT 1;
SELECT id INTO _exp2 FROM expenses WHERE title = 'JCB hire' AND project_id = _proj1 LIMIT 1;

-- =========================================================
-- STEP 26: RECEIPTS
-- =========================================================
INSERT INTO receipts (expense_id, project_id, receipt_number, vendor, amount, receipt_date, notes, uploaded_by) VALUES
  (_exp1, _proj1, 'RCP-2026-0001', 'Kampala Cement Distributors', 10240000, _today - INTERVAL '105 days', 'Original receipt attached', _user_id),
  (_exp2, _proj1, 'RCP-2026-0002', 'Precision Tools & Equipment', 8400000, _today - INTERVAL '90 days', 'Invoice INV-PT-2026-0421', _user_id),
  (NULL, _proj1, 'RCP-2026-0003', 'RoofMart Uganda Ltd', 38000000, _today - INTERVAL '15 days', 'Deposit for roofing materials', _user_id),
  (NULL, _proj5, 'RCP-2026-0004', 'BuildHard Ware Ltd', 12800000, _today - INTERVAL '30 days', 'Landscaping materials — final batch', _user_id),
  (NULL, _proj5, 'RCP-2026-0005', 'Hima Cement', 4800000, _today - INTERVAL '45 days', 'Cement for Phase 3 pathway concrete', _user_id),
  (NULL, _proj2, 'RCP-2026-0006', 'KCCA', 8500000, _today - INTERVAL '30 days', 'Building permit fee receipt', _user_id),
  (NULL, _proj1, 'RCP-2026-0007', 'SteelPro East Africa', 12500000, _today - INTERVAL '60 days', 'Steel fabrication — milestone 1', _user_id),
  (NULL, _proj1, 'RCP-2026-0008', 'UMEME', 420000, _today - INTERVAL '15 days', 'Feb 2026 electricity bill', _user_id);

-- =========================================================
-- STEP 27: INVOICES + ITEMS (Construction invoices)
-- =========================================================
INSERT INTO invoices (project_id, client_name, invoice_number, issue_date, due_date, status, subtotal, tax_rate, tax_amount, total_amount, amount_paid, notes, created_by) VALUES
  (_proj5, 'Henry Mugerwa', 'CINV-2026-001', _today - INTERVAL '60 days', _today - INTERVAL '30 days', 'paid', 320000000, 18, 57600000, 377600000, 377600000, 'Unit 7 — full payment received', _user_id),
  (_proj5, 'Mugerwa & Sons Ltd', 'CINV-2026-002', _today - INTERVAL '45 days', _today - INTERVAL '15 days', 'paid', 320000000, 18, 57600000, 377600000, 377600000, 'Unit 8 — full payment received', _user_id),
  (_proj5, 'Victoria Properties Ltd', 'CINV-2026-003', _today, _today + INTERVAL '30 days', 'sent', 850000000, 18, 153000000, 1003000000, 0, 'Progress billing for Feb 2026 — Ntinda Heights foundations', _user_id);

SELECT id INTO _inv1_uuid FROM invoices WHERE invoice_number = 'CINV-2026-001';
SELECT id INTO _inv2_uuid FROM invoices WHERE invoice_number = 'CINV-2026-002';
SELECT id INTO _inv3_uuid FROM invoices WHERE invoice_number = 'CINV-2026-003';

INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total_price) VALUES
  (_inv1_uuid, 'Unit 7 — 3-bed townhouse Entebbe Airport View', 1, 320000000, 320000000),
  (_inv2_uuid, 'Unit 8 — 3-bed townhouse Entebbe Airport View', 1, 320000000, 320000000),
  (_inv3_uuid, 'Foundation works — complete', 1, 350000000, 350000000),
  (_inv3_uuid, 'Ground floor slab (50% complete)', 1, 250000000, 250000000),
  (_inv3_uuid, 'Structural columns (ground floor)', 1, 150000000, 150000000),
  (_inv3_uuid, 'Mobilization and preliminaries', 1, 100000000, 100000000);

-- =========================================================
-- STEP 28: DAILY LOGS (10 days spread across projects)
-- =========================================================
INSERT INTO daily_logs (project_id, log_date, weather, temperature, workers_on_site, hours_worked, notes, delays, safety_incidents, created_by) VALUES
  (_proj1, _today - INTERVAL '10 days', 'Sunny', '28°C', 24, 192, 'Foundation excavation ongoing. Steel arriving for columns.', 'Delivery truck delayed 2hrs', 'None', _user_id),
  (_proj1, _today - INTERVAL '5 days', 'Partly cloudy', '26°C', 28, 224, 'Ground floor column formwork in progress. Plumbing rough-in starting.', 'None', 'Minor: worker cut hand on rebar, first aid treated', _user_id),
  (_proj1, _today - INTERVAL '2 days', 'Rain AM, clear PM', '24°C', 22, 160, 'Lost 3hrs to rain. Concrete pour pushed to tomorrow.', '3hrs rain delay', 'None', _user_id),
  (_proj1, _today - INTERVAL '1 day', 'Sunny', '27°C', 30, 240, 'Concrete pour for columns completed. Curing started.', 'None', 'None', _user_id),
  (_proj2, _today - INTERVAL '8 days', 'Sunny', '29°C', 18, 144, 'Site clearance completed. Excavation for foundation commencing.', 'None', 'None', _user_id),
  (_proj2, _today - INTERVAL '4 days', 'Sunny', '30°C', 20, 160, 'Excavation at 1.5m depth. Ground water encountered.', 'Ground water — pump required', 'None', _user_id),
  (_proj2, _today, 'Cloudy', '25°C', 22, 176, 'Hardcore and blinding layer in progress. Foundation rebar being placed.', 'None', 'None', _user_id),
  (_proj5, _today - INTERVAL '20 days', 'Sunny', '28°C', 15, 120, 'Snag list walkthrough — units 15-20. Minor defects noted.', 'None', 'None', _user_id),
  (_proj5, _today - INTERVAL '15 days', 'Sunny', '27°C', 12, 96, 'Final cleaning and painting touch-ups.', 'None', 'None', _user_id),
  (_proj5, _today - INTERVAL '12 days', 'Partly cloudy', '26°C', 8, 64, 'Handover preparations. Certificates being prepared.', 'Awaiting utility connections', 'None', _user_id);

-- =========================================================
-- STEP 29: RFIs
-- =========================================================
INSERT INTO rfis (project_id, rfi_number, title, question, status, priority, asked_by, due_date, created_at) VALUES
  (_proj1, 'RFI-2026-001', 'Basement waterproofing specification', 'Client requests full tanking membrane to basement. Please confirm the specification — is Sika 107 or equivalent acceptable?', 'answered', 'high', _user_id, _today - INTERVAL '20 days', _now - INTERVAL '25 days'),
  (_proj1, 'RFI-2026-002', 'Column grid dimension discrepancy', 'As-built grid B2 shows 6.2m between columns but structural drawings indicate 5.8m. Which dimension should we follow?', 'open', 'urgent', _user_id, _today + INTERVAL '5 days', _now - INTERVAL '2 days'),
  (_proj2, 'RFI-2026-003', 'Lab floor drainage locations', 'Lab equipment layout not yet finalised. Where should floor drains be placed?', 'open', 'medium', _user_id, _today + INTERVAL '14 days', _now),
  (_proj2, 'RFI-2026-004', 'Fire rating of partition walls', 'What fire rating is required for lab/classroom partitions? Minimum 1hr?', 'answered', 'medium', _user_id, _today - INTERVAL '10 days', _now - INTERVAL '14 days'),
  (_proj5, 'RFI-2026-005', 'Boundary wall height', 'Local council requires 2.4m but estate design shows 2.0m. Can we proceed with 2.4m?', 'answered', 'low', _user_id, _today - INTERVAL '90 days', _now - INTERVAL '95 days');

SELECT id INTO _rfi1 FROM rfis WHERE rfi_number = 'RFI-2026-001';
SELECT id INTO _rfi2 FROM rfis WHERE rfi_number = 'RFI-2026-002';

-- Update RFI answers
UPDATE rfis SET response = 'Yes, Sika 107 tanking membrane or equivalent is approved. Apply to all basement retaining walls and floor slab. Ensure 300mm overlap at joints.', answered_by = _user_id, answered_at = _now - INTERVAL '18 days' WHERE rfi_number = 'RFI-2026-001';
UPDATE rfis SET response = 'Minimum 1-hour fire rating for all lab/classroom partitions. Use 12.5mm Fireline plasterboard both sides with mineral wool insulation.', answered_by = _user_id, answered_at = _now - INTERVAL '10 days' WHERE rfi_number = 'RFI-2026-004';
UPDATE rfis SET response = 'Confirmed — proceed with 2.4m boundary wall as per local council requirement.', answered_by = _user_id, answered_at = _now - INTERVAL '85 days' WHERE rfi_number = 'RFI-2026-005';

-- =========================================================
-- STEP 30: SUBMITTALS
-- =========================================================
INSERT INTO submittals (project_id, title, description, status, due_date, submitted_date, reviewed_by, review_notes, created_by) VALUES
  (_proj1, 'Concrete mix design — Grade 30', 'Proposed mix design for all structural concrete (foundation, columns, slabs)', 'approved', _today - INTERVAL '80 days', _today - INTERVAL '85 days', 'Struct Eng (ArchiPlan)', 'Approved. w/c ratio must not exceed 0.50.', _user_id),
  (_proj1, 'Steel reinforcement schedule', 'Detailed bending schedule for all T12/T16/T20 rebar', 'approved', _today - INTERVAL '70 days', _today - INTERVAL '75 days', 'Struct Eng (ArchiPlan)', 'Approved with minor corrections to column B2 links.', _user_id),
  (_proj2, 'Laboratory benching detail', 'Detailed drawings of lab benching layout for Level 1', 'submitted', _today + INTERVAL '30 days', _today, NULL, NULL, _user_id),
  (_proj5, 'Landscaping plan — Common Areas', 'Final landscaping layout including planting schedule', 'approved', _today - INTERVAL '120 days', _today - INTERVAL '125 days', 'Client', 'Approved. Substitute Bougainvillea with Hibiscus.', _user_id);

SELECT id INTO _subm1 FROM submittals WHERE title = 'Concrete mix design — Grade 30';
SELECT id INTO _subm2 FROM submittals WHERE title = 'Steel reinforcement schedule';

-- =========================================================
-- STEP 31: SAFETY INCIDENTS
-- =========================================================
INSERT INTO safety_incidents (project_id, incident_date, incident_type, description, root_cause, corrective_action, status, reported_by, location, severity) VALUES
  (_proj1, _today - INTERVAL '45 days', 'first_aid', 'Worker cut left forearm on exposed rebar while carrying formwork panels.', 'Rebar ends not capped. Worker not wearing cut-resistant sleeves.', 'All exposed rebar ends to be capped immediately. Mandatory PPE enforcement. Toolbox talk conducted.', 'resolved', 'John Mwangi', 'Ground floor column area', 'low'),
  (_proj1, _today - INTERVAL '5 days', 'near_miss', 'Concrete skip nearly struck worker during tower crane lift. Skips swung during hoist due to high wind.', 'Lift not aborted despite wind warning. Inadequate communication between banksman and crane op.', 'All lifts above 500kg to be aborted in winds > 25km/h. Additional radio set provided to banksman.', 'resolved', 'Sarah Nakato', 'Pour area — north wing', 'medium'),
  (_proj5, _today - INTERVAL '60 days', 'medical_treatment', 'Worker fell from step ladder (2.5m) while painting soffit. Bruised ribs, no fractures.', 'Ladder placed on uneven ground. Worker overreaching.', 'Step ladders banned for work above 2m — scaffold towers only. Re-training completed.', 'resolved', 'John Mwangi', 'Unit 15 — living room', 'medium');

SELECT id INTO _safe1 FROM safety_incidents WHERE incident_type = 'first_aid';
SELECT id INTO _safe2 FROM safety_incidents WHERE incident_type = 'near_miss';
SELECT id INTO _safe3 FROM safety_incidents WHERE incident_type = 'medical_treatment';

-- =========================================================
-- STEP 32: MEETING MINUTES
-- =========================================================
INSERT INTO meeting_minutes (project_id, title, meeting_date, start_time, end_time, location, attendees, agenda, notes, action_items, created_by) VALUES
  (_proj1, 'Weekly Progress Meeting — Week 16', _today - INTERVAL '5 days', '09:00', '10:30', 'Site Office, Ntinda', 'Sarah Nakato (PM), John Mwangi (Site Sup), Client Rep, Struct Eng', E'- Foundation review: on schedule\n- Steel delivery confirmed for Monday\n- Basement waterproofing CO approved\n- RFI-002 needs urgent answer', E'- Ground floor columns pour on track\n- Basement waterproofing contractor to mobilise next week\n- Client requested additional power points in bedrooms (variation pending)', '[{"action":"Confirm column grid dimension with architect","assignee":"Sarah Nakato","due":"2026-07-22"},{"action":"Issue variation order for additional power points","assignee":"Sarah Nakato","due":"2026-07-24"},{"action":"Prepare progress payment application 002","assignee":"John Mwangi","due":"2026-07-25"}]', _user_id),
  (_proj2, 'Kyambogo Project Kick-off', _today - INTERVAL '45 days', '10:00', '12:00', 'VC Boardroom, Kyambogo', 'Sarah Nakato, Univ Project Comm., ArchiPlan, KCCA Insp.', E'- Site handover completed\n- Demolition permit verified\n- KCCA building permit expected within 2 weeks\n- Community liaison officer appointed', E'- Demolition commenced 2 days after meeting\n- Foundation design finalised\n- Lab equipment procurement timeline discussed', '[{"action":"Submit building permit application","assignee":"Sarah Nakato","due":"2026-06-01"},{"action":"Notify neighbours of demolition schedule","assignee":"John Mwangi","due":"2026-06-05"}]', _user_id),
  (_proj5, 'Entebbe View — Handover Planning', _today - INTERVAL '20 days', '14:00', '15:30', 'Sales Office, Entebbe', 'Sarah Nakato, Sales Team, Client Rep (Henry Mugerwa)', E'- 16/20 units sold\n- Remaining 4 units to be polished for show\n- Snag list completion target: 14 days\n- Handover certificates ready', E'- Snag list 95% complete\n- All utilities connected except internet\n- Final inspection scheduled', '[{"action":"Prepare O&M manuals for unit owners","assignee":"Diana Kyomugisha","due":"2026-07-30"},{"action":"Order signage for estate entrance","assignee":"Sarah Nakato","due":"2026-08-01"}]', _user_id);

SELECT id INTO _meet1 FROM meeting_minutes WHERE title LIKE 'Weekly Progress%';
SELECT id INTO _meet2 FROM meeting_minutes WHERE title LIKE 'Kyambogo Kick-off%';
SELECT id INTO _meet3 FROM meeting_minutes WHERE title LIKE 'Entebbe View%';

-- =========================================================
-- STEP 33: PUNCH LIST ITEMS
-- =========================================================
INSERT INTO punch_list_items (project_id, title, description, status, priority, assignee, due_date, notes, created_by) VALUES
  (_proj5, 'Unit 3 — Bathroom tile grout discoloured', 'Grout in master ensuite shower area has yellow discoloration. Needs re-grouting.', 'open', 'medium', 'Jennifer Akello', _today + INTERVAL '7 days', 'Colour mismatch suspected — check batch number', _user_id),
  (_proj5, 'Unit 8 — Front door not closing properly', 'Sticking at top corner. Needs hinge adjustment.', 'in_progress', 'high', 'Grace Tumusiime', _today + INTERVAL '3 days', 'Maybe settled frame — check level first', _user_id),
  (_proj5, 'Unit 12 — Kitchen tap leak', 'Slow drip from mixer tap handle.', 'completed', 'medium', 'Alice Nambooze', _today - INTERVAL '5 days', 'Replaced cartridge — resolved', _user_id),
  (_proj5, 'Common area — Security gate sensor', 'Auto gate sensor not detecting vehicles correctly, closing prematurely.', 'open', 'urgent', 'David Ssempijja', _today + INTERVAL '2 days', 'Electrical issue — relay board may need replacement', _user_id),
  (_proj1, 'Mobilisation — Site office phone line', 'No internet connectivity in site office. Required for project management system.', 'open', 'low', 'Sarah Nakato', _today + INTERVAL '14 days', 'Provider confirmed installation pending', _user_id);

SELECT id INTO _punch1 FROM punch_list_items WHERE title LIKE 'Unit 3%';
SELECT id INTO _punch2 FROM punch_list_items WHERE title LIKE 'Unit 8%';

-- =========================================================
-- STEP 34: TIMESHEETS
-- =========================================================
INSERT INTO timesheets (employee_id, project_id, date, start_time, end_time, hours, overtime_hours, description, status, created_by) VALUES
  (_emp3, _proj1, _today - INTERVAL '5 days', '07:00', '17:00', 10, 2, 'Column formwork and concrete pour preparation', 'approved', _user_id),
  (_emp4, _proj1, _today - INTERVAL '5 days', '07:00', '16:00', 9, 1, 'Formwork carpentry for ground floor columns', 'approved', _user_id),
  (_emp9, _proj1, _today - INTERVAL '5 days', '08:00', '17:00', 9, 1, 'General labour — mixing mortar, carrying blocks', 'approved', _user_id),
  (_emp5, _proj1, _today - INTERVAL '4 days', '07:00', '17:30', 10, 2, 'Electrical conduit rough-in for ground floor', 'approved', _user_id),
  (_emp6, _proj2, _today - INTERVAL '4 days', '07:30', '16:30', 9, 1, 'Site drainage pipe laying for lab block', 'pending', _user_id),
  (_emp9, _proj2, _today, '08:00', '17:00', 9, 1, 'Excavation and hardcore laying', 'pending', _user_id),
  (_emp7, _proj1, _today - INTERVAL '3 days', '07:00', '17:00', 10, 2, 'Steel fixing for ground floor columns', 'approved', _user_id),
  (_emp3, _proj1, _today, '07:00', '16:00', 9, 1, 'Block work for ground floor walls — section A', 'pending', _user_id);

-- =========================================================
-- STEP 35: EMPLOYEE ATTENDANCE
-- =========================================================
INSERT INTO employee_attendance (employee_id, date, clock_in, clock_out, hours_worked, project_id, status, notes, recorded_by) VALUES
  (_emp3, _today - INTERVAL '5 days', _now - INTERVAL '5 days' - INTERVAL '9 hours', _now - INTERVAL '5 days' + INTERVAL '1 hour', 10, _proj1, 'present', 'Column pour day', _user_id),
  (_emp4, _today - INTERVAL '5 days', _now - INTERVAL '5 days' - INTERVAL '9 hours', _now - INTERVAL '5 days', 9, _proj1, 'present', 'Formwork', _user_id),
  (_emp9, _today - INTERVAL '5 days', _now - INTERVAL '5 days' - INTERVAL '8 hours', _now - INTERVAL '5 days' + INTERVAL '1 hour', 9, _proj1, 'present', 'General labour', _user_id),
  (_emp5, _today - INTERVAL '4 days', _now - INTERVAL '4 days' - INTERVAL '9 hours', _now - INTERVAL '4 days' + INTERVAL '1.5 hours', 10.5, _proj1, 'present', 'Electrical rough-in', _user_id),
  (_emp9, _today, _now - INTERVAL '8 hours', _now + INTERVAL '1 hour', 9, _proj2, 'present', 'Excavation works', _user_id);

-- =========================================================
-- STEP 36: SOP CHECKLISTS + ITEMS
-- =========================================================
INSERT INTO sop_checklists (id, project_id, title, description, category, created_by) VALUES
  (gen_random_uuid(), _proj1, 'Daily Site Safety Inspection', 'Mandatory daily inspection checklist for site supervisors. Must be completed before work commences.', 'safety', _user_id),
  (gen_random_uuid(), _proj5, 'Townhouse Handover Checklist', 'Complete this checklist for each unit before handover to new owner.', 'quality', _user_id);

SELECT id INTO _sopc1 FROM sop_checklists WHERE title = 'Daily Site Safety Inspection';
SELECT id INTO _sopc2 FROM sop_checklists WHERE title = 'Townhouse Handover Checklist';

INSERT INTO sop_checklist_items (checklist_id, item, is_checked, sort_order) VALUES
  (_sopc1, 'All workers wearing correct PPE (helmets, boots, vests)', false, 1),
  (_sopc1, 'Scaffolding inspected and safe to use', false, 2),
  (_sopc1, 'First aid kit fully stocked', false, 3),
  (_sopc1, 'Fire extinguisher in date and accessible', false, 4),
  (_sopc1, 'Excavation edges protected with barriers', false, 5),
  (_sopc1, 'Electrical cables and tools checked for damage', false, 6),
  (_sopc1, 'Site signage visible and legible', false, 7),
  (_sopc1, 'Emergency contact numbers displayed', false, 8),
  (_sopc1, 'Welfare facilities (toilets, water) clean and stocked', false, 9),
  (_sopc1, 'Site access gate locked and secure', false, 10),

  (_sopc2, 'All windows and doors open/close correctly', false, 1),
  (_sopc2, 'Plumbing — all taps, toilets, showers tested', false, 2),
  (_sopc2, 'Electrical — all sockets, switches, lights tested', false, 3),
  (_sopc2, 'Floor finishes — no cracks, stains, or damage', false, 4),
  (_sopc2, 'Paint — no missed spots, drips, or colour mismatch', false, 5),
  (_sopc2, 'Kitchen — cabinets, countertop, sink tested', false, 6),
  (_sopc2, 'Roof — no leaks, gutters clear', false, 7),
  (_sopc2, 'External — paths, driveway, gate in good order', false, 8),
  (_sopc2, 'Meter readings recorded (water, electricity)', false, 9),
  (_sopc2, 'O&M manuals and certificates provided', false, 10);

-- =========================================================
-- STEP 37: SOP FORMS
-- =========================================================
INSERT INTO sop_forms (id, project_id, title, description, form_config, category, created_by) VALUES
  (gen_random_uuid(), _proj1, 'Concrete Pour Checklist', 'Pre-pour, during-pour, and post-pour inspection form for quality control of all structural concrete.',
   '{"fields":[{"key":"rebar_inspected","label":"Rebar inspected and signed off?","type":"checkbox"},{"key":"formwork_checked","label":"Formwork clean and oiled?","type":"checkbox"},{"key":"slump_test","label":"Slump test result (mm)","type":"number","min":25,"max":150},{"key":"temperature","label":"Concrete temperature (°C)","type":"number"},{"key":"cubes_taken","label":"Cube samples taken?","type":"checkbox"},{"key":"curing_method","label":"Curing method","type":"select","options":["Wet burlap","Ponding","Curing compound","Steam"]},{"key":"inspector_name","label":"Inspector name","type":"text"},{"key":"notes","label":"Additional notes","type":"textarea"}]}',
   'quality', _user_id),
  (gen_random_uuid(), NULL, 'Subcontractor Evaluation Form', 'Evaluate subcontractor performance after project completion. Used for future procurement decisions.',
   '{"fields":[{"key":"subcontractor_name","label":"Subcontractor name","type":"text"},{"key":"project_ref","label":"Project reference","type":"text"},{"key":"quality","label":"Quality of work","type":"select","options":["Excellent","Good","Average","Poor"]},{"key":"timeliness","label":"Timeliness","type":"select","options":["On time","Minor delays","Major delays"]},{"key":"safety","label":"Safety record","type":"select","options":["No incidents","Minor incidents","Major incidents"]},{"key":"would_rehire","label":"Would you rehire?","type":"radio","options":["Yes","No"]},{"key":"comments","label":"Comments","type":"textarea"}]}',
   'quality', _user_id);

SELECT id INTO _sopf1 FROM sop_forms WHERE title = 'Concrete Pour Checklist';
SELECT id INTO _sopf2 FROM sop_forms WHERE title = 'Subcontractor Evaluation Form';

-- =========================================================
-- STEP 38: PROJECT DOCUMENTS
-- =========================================================
INSERT INTO project_documents (project_id, name, file_type, category, version, description, created_by) VALUES
  (_proj1, 'Architectural Drawings — Set A', 'PDF', 'drawings', '2.1', 'Full architectural set including floor plans, elevations, sections', _user_id),
  (_proj1, 'Structural Calculations', 'PDF', 'engineering', '1.0', 'Structural design calculations by ArchiPlan Consulting', _user_id),
  (_proj1, 'Bill of Quantities', 'XLSX', 'estimating', '1.2', 'Full BOQ for Ntinda Heights', _user_id),
  (_proj2, 'Lab Equipment Schedule', 'XLSX', 'specifications', '1.0', 'Schedule of all lab equipment with specifications', _user_id),
  (_proj5, 'Title Deeds — Units 1-20', 'PDF', 'legal', '1.0', 'Certified copies of registered title deeds for all units', _user_id);

SELECT id INTO _doc1 FROM project_documents WHERE name = 'Architectural Drawings — Set A' AND project_id = _proj1;
SELECT id INTO _doc2 FROM project_documents WHERE name = 'Structural Calculations';

-- =========================================================
-- STEP 39: PROJECT PHOTOS
-- =========================================================
INSERT INTO project_photos (project_id, image_url, caption, photo_date, category, uploaded_by) VALUES
  (_proj1, 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800', 'Site clearing — before photo', _today - INTERVAL '120 days', 'progress', _user_id),
  (_proj1, 'https://images.unsplash.com/photo-1578996952280-8f0c83e60e61?w=800', 'Foundation excavation complete', _today - INTERVAL '90 days', 'progress', _user_id),
  (_proj1, 'https://images.unsplash.com/photo-1541888946425-d81bb66c3d8a?w=800', 'Ground floor column formwork in progress', _today - INTERVAL '10 days', 'progress', _user_id),
  (_proj1, 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=800', 'Steel delivery and offloading', _today - INTERVAL '80 days', 'delivery', _user_id),
  (_proj2, 'https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?w=800', 'Pre-demolition site condition', _today - INTERVAL '60 days', 'progress', _user_id),
  (_proj2, 'https://images.unsplash.com/photo-1574629819369-5d46a6ec2ec6?w=800', 'Excavation at 1.5m — groundwater encountered', _today - INTERVAL '4 days', 'progress', _user_id),
  (_proj5, 'https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=800', 'Phase 2 townhouses — completed exterior', _today - INTERVAL '45 days', 'completed', _user_id),
  (_proj5, 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800', 'Show unit — finished living room interior', _today - INTERVAL '30 days', 'completed', _user_id);

-- =========================================================
-- STEP 40: SAVED REPORTS
-- =========================================================
INSERT INTO saved_reports (name, type, config, created_by) VALUES
  ('Monthly Project Status — Jan 2026', 'project', '{"projects":["' || _proj1 || '","' || _proj2 || '","' || _proj4 || '","' || _proj5 || '"],"period":"monthly","include_budget":true,"include_progress":true}', _user_id),
  ('Expense Analysis — Q1 2026', 'expense', '{"period_start":"2026-01-01","period_end":"2026-03-31","group_by":"category","include_vat":true}', _user_id);

-- =========================================================
-- FINAL: Update project totals spent to match expenses
-- =========================================================
UPDATE projects SET total_spent = 2100000000 WHERE id = _proj1;
UPDATE projects SET total_spent = 1100000000 WHERE id = _proj2;
UPDATE projects SET total_spent = 450000000 WHERE id = _proj4;
UPDATE projects SET total_spent = 11800000000 WHERE id = _proj5;

-- =========================================================
-- SUMMARY
-- =========================================================
RAISE NOTICE '==========================================';
RAISE NOTICE 'CONSTRUCTION SEED DATA LOADED SUCCESSFULLY';
RAISE NOTICE '==========================================';
RAISE NOTICE 'Projects: 5';
RAISE NOTICE 'Employees: 10';
RAISE NOTICE 'Suppliers: 8';
RAISE NOTICE 'Cost Codes: 20';
RAISE NOTICE 'Expense Categories: 8';
RAISE NOTICE 'Inventory Items: 8';
RAISE NOTICE 'Assets: 5';
RAISE NOTICE 'Purchase Orders: 4';
RAISE NOTICE 'Subcontracts: 3';
RAISE NOTICE 'Change Orders: 2';
RAISE NOTICE 'Bills: 4';
RAISE NOTICE 'Invoices: 3';
RAISE NOTICE 'Leads: 5';
RAISE NOTICE 'Estimates: 3';
RAISE NOTICE 'Proposals: 2';
RAISE NOTICE 'Bid Packages: 2';
RAISE NOTICE 'Project Tasks: 17';
RAISE NOTICE 'Project Schedules: 20+';
RAISE NOTICE 'Project Budgets: 19';
RAISE NOTICE 'Project Documents: 5';
RAISE NOTICE 'Project Photos: 8';
RAISE NOTICE 'Daily Logs: 10';
RAISE NOTICE 'RFIs: 5';
RAISE NOTICE 'Submittals: 4';
RAISE NOTICE 'Safety Incidents: 3';
RAISE NOTICE 'Meeting Minutes: 3';
RAISE NOTICE 'Punch List Items: 5';
RAISE NOTICE 'Timesheets: 8';
RAISE NOTICE 'Employee Attendance: 5';
RAISE NOTICE 'Expenses: 15';
RAISE NOTICE 'Receipts: 8';
RAISE NOTICE 'Progress Payments: 2';
RAISE NOTICE 'Commitment Log: 3';
RAISE NOTICE 'Allowances: 3';
RAISE NOTICE 'Lien Waivers: 2';
RAISE NOTICE 'SOP Checklists: 2 (20 items total)';
RAISE NOTICE 'SOP Forms: 2';
RAISE NOTICE 'Saved Reports: 2';
RAISE NOTICE '==========================================';
END $$;
