-- Construction & Enhanced Property Management Module
-- Adds: Projects, Employees, Suppliers, Purchase Orders, Inventory, Assets, Expenses, Equipment Rentals

-- ============================================================
-- 1. EXPENSE CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6b7280',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. EXPENSES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.expense_categories(id),
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  expense_date DATE DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'cash',
  reference_number TEXT,
  vendor TEXT,
  project_id UUID,
  receipt_url TEXT,
  recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT, -- daily, weekly, monthly, yearly
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. PROJECTS / JOB SITES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning','in_progress','on_hold','completed','cancelled')),
  start_date DATE,
  target_end_date DATE,
  actual_end_date DATE,
  budget NUMERIC(15,2) DEFAULT 0,
  total_spent NUMERIC(15,2) DEFAULT 0,
  client_name TEXT,
  client_phone TEXT,
  client_email TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Link expenses to projects
ALTER TABLE public.expenses ADD CONSTRAINT fk_expense_project
  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

-- ============================================================
-- 4. EMPLOYEES / WORKERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  role TEXT DEFAULT 'worker', -- worker, supervisor, manager, admin, contractor
  employee_type TEXT DEFAULT 'full_time', -- full_time, part_time, contract, casual
  department TEXT,
  daily_rate NUMERIC(10,2) DEFAULT 0,
  monthly_salary NUMERIC(10,2) DEFAULT 0,
  bank_account TEXT,
  tax_id TEXT,
  national_id TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  address TEXT,
  hire_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','terminated')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. EMPLOYEE ATTENDANCE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.employee_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  hours_worked NUMERIC(5,2),
  project_id UUID REFERENCES public.projects(id),
  status TEXT DEFAULT 'present' CHECK (status IN ('present','absent','late','half_day','holiday')),
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

ALTER TABLE public.employee_attendance ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. SUPPLIERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  category TEXT, -- materials, equipment, services, transport
  payment_terms TEXT,
  tax_id TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 7. INVENTORY / MATERIALS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- building_materials, plumbing, electrical, finishing, safety, tools, other
  unit TEXT DEFAULT 'piece', -- piece, kg, meter, liter, bag, box, roll
  quantity NUMERIC(12,2) DEFAULT 0,
  min_stock_level NUMERIC(12,2) DEFAULT 0,
  unit_cost NUMERIC(12,2) DEFAULT 0,
  selling_price NUMERIC(12,2) DEFAULT 0,
  supplier_id UUID REFERENCES public.suppliers(id),
  location TEXT, -- warehouse, site_a, site_b
  sku TEXT,
  barcode TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 8. INVENTORY TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('purchase','sale','adjustment','transfer','damage','return')),
  quantity NUMERIC(12,2) NOT NULL,
  unit_price NUMERIC(12,2),
  total_price NUMERIC(12,2),
  reference_type TEXT, -- purchase_order, project, adjustment
  reference_id UUID,
  project_id UUID REFERENCES public.projects(id),
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 9. PURCHASE ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  supplier_id UUID REFERENCES public.suppliers(id),
  project_id UUID REFERENCES public.projects(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','pending','approved','ordered','received','cancelled')),
  order_date DATE DEFAULT CURRENT_DATE,
  expected_date DATE,
  received_date DATE,
  subtotal NUMERIC(12,2) DEFAULT 0,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 10. PURCHASE ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.inventory_items(id),
  description TEXT,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  received_quantity NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 11. ASSETS (Equipment, Tools, Vehicles)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- equipment, tool, vehicle, furniture, electronics, other
  serial_number TEXT,
  model TEXT,
  manufacturer TEXT,
  purchase_date DATE,
  purchase_cost NUMERIC(12,2) DEFAULT 0,
  current_value NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'available' CHECK (status IN ('available','in_use','maintenance','damaged','disposed')),
  condition TEXT DEFAULT 'good' CHECK (condition IN ('excellent','good','fair','poor','needs_repair','damaged')),
  location TEXT,
  assigned_to UUID REFERENCES public.employees(id),
  project_id UUID REFERENCES public.projects(id),
  warranty_expiry DATE,
  useful_life_years INTEGER DEFAULT 5,
  salvage_value NUMERIC(12,2) DEFAULT 0,
  image_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 12. ASSET MAINTENANCE LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.asset_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  maintenance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  type TEXT DEFAULT 'repair' CHECK (type IN ('repair','service','inspection','other')),
  cost NUMERIC(12,2) DEFAULT 0,
  performed_by TEXT,
  next_maintenance_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.asset_maintenance ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 13. EQUIPMENT RENTALS (rent tools to workers/sites)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.equipment_rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_number TEXT NOT NULL UNIQUE,
  asset_id UUID NOT NULL REFERENCES public.assets(id),
  employee_id UUID REFERENCES public.employees(id),
  project_id UUID REFERENCES public.projects(id),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_return_date DATE,
  actual_return_date DATE,
  daily_rate NUMERIC(10,2) DEFAULT 0,
  total_days INTEGER DEFAULT 0,
  total_charge NUMERIC(12,2) DEFAULT 0,
  deposit_amount NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','returned','overdue','damaged','lost')),
  condition_before TEXT,
  condition_after TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.equipment_rentals ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 14. REPORTS CONFIG
-- ============================================================
CREATE TABLE IF NOT EXISTS public.saved_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- financial, expense, project, inventory, rental
  config JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.saved_reports ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 15. ENHANCE EXISTING TABLES
-- ============================================================

-- Add construction fields to properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS property_type TEXT DEFAULT 'residential'
  CHECK (property_type IN ('residential','commercial','industrial','land','mixed_use'));
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS total_land_area NUMERIC(10,2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS total_build_area NUMERIC(10,2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS year_built INTEGER;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS utilities TEXT[] DEFAULT '{}';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}';

-- ============================================================
-- RLS POLICIES (staff = admin/manager can do everything)
-- ============================================================

-- Helper: is_staff check
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS for expense_categories
CREATE POLICY "Staff full access on expense_categories" ON public.expense_categories
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- RLS for expenses
CREATE POLICY "Staff full access on expenses" ON public.expenses
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- RLS for projects
CREATE POLICY "Staff full access on projects" ON public.projects
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- RLS for employees
CREATE POLICY "Staff full access on employees" ON public.employees
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- RLS for employee_attendance
CREATE POLICY "Staff full access on employee_attendance" ON public.employee_attendance
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- RLS for suppliers
CREATE POLICY "Staff full access on suppliers" ON public.suppliers
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- RLS for inventory_items
CREATE POLICY "Staff full access on inventory_items" ON public.inventory_items
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- RLS for inventory_transactions
CREATE POLICY "Staff full access on inventory_transactions" ON public.inventory_transactions
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- RLS for purchase_orders
CREATE POLICY "Staff full access on purchase_orders" ON public.purchase_orders
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- RLS for purchase_order_items
CREATE POLICY "Staff full access on purchase_order_items" ON public.purchase_order_items
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- RLS for assets
CREATE POLICY "Staff full access on assets" ON public.assets
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- RLS for asset_maintenance
CREATE POLICY "Staff full access on asset_maintenance" ON public.asset_maintenance
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- RLS for equipment_rentals
CREATE POLICY "Staff full access on equipment_rentals" ON public.equipment_rentals
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- RLS for saved_reports
CREATE POLICY "Staff full access on saved_reports" ON public.saved_reports
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ============================================================
-- UPDATED AT TRIGGERS
-- ============================================================
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER update_equipment_rentals_updated_at BEFORE UPDATE ON public.equipment_rentals
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
