export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      allowances: {
        Row: {
          budgeted_amount: number | null
          created_at: string
          description: string | null
          id: string
          notes: string | null
          project_id: string
          spent_amount: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          budgeted_amount?: number | null
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          project_id: string
          spent_amount?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          budgeted_amount?: number | null
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          spent_amount?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "allowances_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_maintenance: {
        Row: {
          asset_id: string
          cost: number | null
          created_at: string | null
          description: string
          id: string
          maintenance_date: string
          next_maintenance_date: string | null
          notes: string | null
          performed_by: string | null
          type: string | null
        }
        Insert: {
          asset_id: string
          cost?: number | null
          created_at?: string | null
          description: string
          id?: string
          maintenance_date?: string
          next_maintenance_date?: string | null
          notes?: string | null
          performed_by?: string | null
          type?: string | null
        }
        Update: {
          asset_id?: string
          cost?: number | null
          created_at?: string | null
          description?: string
          id?: string
          maintenance_date?: string
          next_maintenance_date?: string | null
          notes?: string | null
          performed_by?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_maintenance_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          assigned_to: string | null
          category: string | null
          condition: string | null
          created_at: string | null
          current_value: number | null
          description: string | null
          id: string
          image_url: string | null
          location: string | null
          manufacturer: string | null
          model: string | null
          name: string
          notes: string | null
          project_id: string | null
          purchase_cost: number | null
          purchase_date: string | null
          salvage_value: number | null
          serial_number: string | null
          status: string | null
          updated_at: string | null
          useful_life_years: number | null
          warranty_expiry: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          condition?: string | null
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          manufacturer?: string | null
          model?: string | null
          name: string
          notes?: string | null
          project_id?: string | null
          purchase_cost?: number | null
          purchase_date?: string | null
          salvage_value?: number | null
          serial_number?: string | null
          status?: string | null
          updated_at?: string | null
          useful_life_years?: number | null
          warranty_expiry?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          condition?: string | null
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          project_id?: string | null
          purchase_cost?: number | null
          purchase_date?: string | null
          salvage_value?: number | null
          serial_number?: string | null
          status?: string | null
          updated_at?: string | null
          useful_life_years?: number | null
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      bid_packages: {
        Row: {
          actual_award: number | null
          awarded_to: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          estimated_budget: number | null
          id: string
          notes: string | null
          project_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          actual_award?: number | null
          awarded_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          estimated_budget?: number | null
          id?: string
          notes?: string | null
          project_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          actual_award?: number | null
          awarded_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          estimated_budget?: number | null
          id?: string
          notes?: string | null
          project_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bid_packages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          amount: number
          bill_number: string
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          paid_date: string | null
          project_id: string | null
          status: string
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          bill_number: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_date?: string | null
          project_id?: string | null
          status?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          bill_number?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_date?: string | null
          project_id?: string | null
          status?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bills_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      change_orders: {
        Row: {
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          change_order_number: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          notes: string | null
          project_id: string
          reason: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          change_order_number: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          project_id: string
          reason?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          change_order_number?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          reason?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      commitment_log: {
        Row: {
          amount: number | null
          budget_line: string | null
          created_at: string
          created_by: string | null
          description: string | null
          executed_date: string | null
          id: string
          notes: string | null
          project_id: string
          status: string | null
          type: string
          updated_at: string
          vendor: string
        }
        Insert: {
          amount?: number | null
          budget_line?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          executed_date?: string | null
          id?: string
          notes?: string | null
          project_id: string
          status?: string | null
          type: string
          updated_at?: string
          vendor: string
        }
        Update: {
          amount?: number | null
          budget_line?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          executed_date?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          status?: string | null
          type?: string
          updated_at?: string
          vendor?: string
        }
        Relationships: [
          {
            foreignKeyName: "commitment_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          license_key: string | null
          name: string
          phone: string | null
          plan_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          license_key?: string | null
          name: string
          phone?: string | null
          plan_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          license_key?: string | null
          name?: string
          phone?: string | null
          plan_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      company_branding: {
        Row: {
          accent_color: string
          company_id: string
          company_name_override: string | null
          created_at: string
          document_footer: string | null
          id: string
          logo_url: string | null
          primary_color: string
          receipt_footer: string | null
          secondary_color: string
          updated_at: string
        }
        Insert: {
          accent_color?: string
          company_id: string
          company_name_override?: string | null
          created_at?: string
          document_footer?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string
          receipt_footer?: string | null
          secondary_color?: string
          updated_at?: string
        }
        Update: {
          accent_color?: string
          company_id?: string
          company_name_override?: string | null
          created_at?: string
          document_footer?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string
          receipt_footer?: string | null
          secondary_color?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_branding_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_codes: {
        Row: {
          category: string | null
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_logs: {
        Row: {
          created_at: string
          created_by: string | null
          delays: string | null
          hours_worked: number | null
          id: string
          log_date: string
          notes: string | null
          project_id: string
          safety_incidents: string | null
          temperature: string | null
          updated_at: string
          weather: string | null
          workers_on_site: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          delays?: string | null
          hours_worked?: number | null
          id?: string
          log_date?: string
          notes?: string | null
          project_id: string
          safety_incidents?: string | null
          temperature?: string | null
          updated_at?: string
          weather?: string | null
          workers_on_site?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          delays?: string | null
          hours_worked?: number | null
          id?: string
          log_date?: string
          notes?: string | null
          project_id?: string
          safety_incidents?: string | null
          temperature?: string | null
          updated_at?: string
          weather?: string | null
          workers_on_site?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          doc_type: string | null
          file_url: string | null
          id: string
          related_id: string
          related_type: string
          title: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          doc_type?: string | null
          file_url?: string | null
          id?: string
          related_id: string
          related_type: string
          title: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          doc_type?: string | null
          file_url?: string | null
          id?: string
          related_id?: string
          related_type?: string
          title?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      employee_attendance: {
        Row: {
          clock_in: string | null
          clock_out: string | null
          created_at: string | null
          date: string
          employee_id: string
          hours_worked: number | null
          id: string
          notes: string | null
          project_id: string | null
          recorded_by: string | null
          status: string | null
        }
        Insert: {
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string | null
          date?: string
          employee_id: string
          hours_worked?: number | null
          id?: string
          notes?: string | null
          project_id?: string | null
          recorded_by?: string | null
          status?: string | null
        }
        Update: {
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string | null
          date?: string
          employee_id?: string
          hours_worked?: number | null
          id?: string
          notes?: string | null
          project_id?: string | null
          recorded_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_attendance_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          bank_account: string | null
          created_at: string | null
          daily_rate: number | null
          department: string | null
          email: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          employee_type: string | null
          full_name: string
          hire_date: string | null
          id: string
          monthly_salary: number | null
          national_id: string | null
          notes: string | null
          phone: string | null
          role: string | null
          status: string | null
          tax_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          bank_account?: string | null
          created_at?: string | null
          daily_rate?: number | null
          department?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          employee_type?: string | null
          full_name: string
          hire_date?: string | null
          id?: string
          monthly_salary?: number | null
          national_id?: string | null
          notes?: string | null
          phone?: string | null
          role?: string | null
          status?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          bank_account?: string | null
          created_at?: string | null
          daily_rate?: number | null
          department?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          employee_type?: string | null
          full_name?: string
          hire_date?: string | null
          id?: string
          monthly_salary?: number | null
          national_id?: string | null
          notes?: string | null
          phone?: string | null
          role?: string | null
          status?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      equipment_rentals: {
        Row: {
          actual_return_date: string | null
          asset_id: string
          condition_after: string | null
          condition_before: string | null
          created_at: string | null
          created_by: string | null
          daily_rate: number | null
          deposit_amount: number | null
          employee_id: string | null
          expected_return_date: string | null
          id: string
          notes: string | null
          project_id: string | null
          rental_number: string
          start_date: string
          status: string | null
          total_charge: number | null
          total_days: number | null
          updated_at: string | null
        }
        Insert: {
          actual_return_date?: string | null
          asset_id: string
          condition_after?: string | null
          condition_before?: string | null
          created_at?: string | null
          created_by?: string | null
          daily_rate?: number | null
          deposit_amount?: number | null
          employee_id?: string | null
          expected_return_date?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          rental_number: string
          start_date?: string
          status?: string | null
          total_charge?: number | null
          total_days?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_return_date?: string | null
          asset_id?: string
          condition_after?: string | null
          condition_before?: string | null
          created_at?: string | null
          created_by?: string | null
          daily_rate?: number | null
          deposit_amount?: number | null
          employee_id?: string | null
          expected_return_date?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          rental_number?: string
          start_date?: string
          status?: string | null
          total_charge?: number | null
          total_days?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_rentals_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_rentals_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_rentals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_items: {
        Row: {
          created_at: string
          description: string
          estimate_id: string
          id: string
          notes: string | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          estimate_id: string
          id?: string
          notes?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          estimate_id?: string
          id?: string
          notes?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "estimate_items_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          estimate_number: string
          id: string
          lead_id: string | null
          notes: string | null
          project_id: string | null
          status: string
          subtotal: number | null
          tax_amount: number | null
          tax_rate: number | null
          title: string
          total_amount: number | null
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimate_number: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          project_id?: string | null
          status?: string
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          title: string
          total_amount?: number | null
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimate_number?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          project_id?: string | null
          status?: string
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          title?: string
          total_amount?: number | null
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimates_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          description: string | null
          expense_date: string | null
          id: string
          notes: string | null
          payment_method: string | null
          project_id: string | null
          receipt_url: string | null
          recorded_by: string | null
          recurring: boolean | null
          recurring_frequency: string | null
          reference_number: string | null
          title: string
          updated_at: string | null
          vendor: string | null
        }
        Insert: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          expense_date?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          project_id?: string | null
          receipt_url?: string | null
          recorded_by?: string | null
          recurring?: boolean | null
          recurring_frequency?: string | null
          reference_number?: string | null
          title: string
          updated_at?: string | null
          vendor?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          expense_date?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          project_id?: string | null
          receipt_url?: string | null
          recorded_by?: string | null
          recurring?: boolean | null
          recurring_frequency?: string | null
          reference_number?: string | null
          title?: string
          updated_at?: string | null
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_expense_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          barcode: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          location: string | null
          min_stock_level: number | null
          name: string
          notes: string | null
          quantity: number | null
          selling_price: number | null
          sku: string | null
          supplier_id: string | null
          unit: string | null
          unit_cost: number | null
          updated_at: string | null
        }
        Insert: {
          barcode?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          min_stock_level?: number | null
          name: string
          notes?: string | null
          quantity?: number | null
          selling_price?: number | null
          sku?: string | null
          supplier_id?: string | null
          unit?: string | null
          unit_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          barcode?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          min_stock_level?: number | null
          name?: string
          notes?: string | null
          quantity?: number | null
          selling_price?: number | null
          sku?: string | null
          supplier_id?: string | null
          unit?: string | null
          unit_cost?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          notes: string | null
          project_id: string | null
          quantity: number
          recorded_by: string | null
          reference_id: string | null
          reference_type: string | null
          total_price: number | null
          type: string
          unit_price: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          notes?: string | null
          project_id?: string | null
          quantity: number
          recorded_by?: string | null
          reference_id?: string | null
          reference_type?: string | null
          total_price?: number | null
          type: string
          unit_price?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          notes?: string | null
          project_id?: string | null
          quantity?: number
          recorded_by?: string | null
          reference_id?: string | null
          reference_type?: string | null
          total_price?: number | null
          type?: string
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number | null
          client_name: string
          created_at: string
          created_by: string | null
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          project_id: string | null
          status: string
          subtotal: number | null
          tax_amount: number | null
          tax_rate: number | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          amount_paid?: number | null
          client_name: string
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          project_id?: string | null
          status?: string
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          amount_paid?: number | null
          client_name?: string
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          project_id?: string | null
          status?: string
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          budget_range_max: number | null
          budget_range_min: number | null
          company: string | null
          contact_email: string | null
          contact_name: string
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          notes: string | null
          project_id: string | null
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          budget_range_max?: number | null
          budget_range_min?: number | null
          company?: string | null
          contact_email?: string | null
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          budget_range_max?: number | null
          budget_range_min?: number | null
          company?: string | null
          contact_email?: string | null
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      lease_signatures: {
        Row: {
          id: string
          ip_address: string | null
          lease_id: string
          signatory_name: string
          signature_data: string | null
          signed_at: string
          signed_by: string
        }
        Insert: {
          id?: string
          ip_address?: string | null
          lease_id: string
          signatory_name: string
          signature_data?: string | null
          signed_at?: string
          signed_by: string
        }
        Update: {
          id?: string
          ip_address?: string | null
          lease_id?: string
          signatory_name?: string
          signature_data?: string | null
          signed_at?: string
          signed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "lease_signatures_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
        ]
      }
      leases: {
        Row: {
          billing_period: string | null
          created_at: string
          deposit: number
          deposit_months: number | null
          end_date: string | null
          id: string
          late_fee_amount: number | null
          late_fee_grace_days: number | null
          monthly_rent: number
          notes: string | null
          notice_period_days: number | null
          outstanding_balance: number | null
          payment_due_day: number | null
          signed_document_url: string | null
          special_conditions: string | null
          start_date: string
          status: string
          tenant_id: string
          termination_date: string | null
          termination_reason: string | null
          terms_and_conditions: string | null
          unit_id: string
          updated_at: string
        }
        Insert: {
          billing_period?: string | null
          created_at?: string
          deposit?: number
          deposit_months?: number | null
          end_date?: string | null
          id?: string
          late_fee_amount?: number | null
          late_fee_grace_days?: number | null
          monthly_rent: number
          notes?: string | null
          notice_period_days?: number | null
          outstanding_balance?: number | null
          payment_due_day?: number | null
          signed_document_url?: string | null
          special_conditions?: string | null
          start_date: string
          status?: string
          tenant_id: string
          termination_date?: string | null
          termination_reason?: string | null
          terms_and_conditions?: string | null
          unit_id: string
          updated_at?: string
        }
        Update: {
          billing_period?: string | null
          created_at?: string
          deposit?: number
          deposit_months?: number | null
          end_date?: string | null
          id?: string
          late_fee_amount?: number | null
          late_fee_grace_days?: number | null
          monthly_rent?: number
          notes?: string | null
          notice_period_days?: number | null
          outstanding_balance?: number | null
          payment_due_day?: number | null
          signed_document_url?: string | null
          special_conditions?: string | null
          start_date?: string
          status?: string
          tenant_id?: string
          termination_date?: string | null
          termination_reason?: string | null
          terms_and_conditions?: string | null
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      lien_waivers: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          project_id: string
          signed_date: string | null
          status: string
          supplier_id: string | null
          updated_at: string
          waiver_type: string
        }
        Insert: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          project_id: string
          signed_date?: string | null
          status?: string
          supplier_id?: string | null
          updated_at?: string
          waiver_type: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          signed_date?: string | null
          status?: string
          supplier_id?: string | null
          updated_at?: string
          waiver_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lien_waivers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lien_waivers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          maintenance_request_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          maintenance_request_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          maintenance_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_images_maintenance_request_id_fkey"
            columns: ["maintenance_request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          actual_cost: number | null
          category: string | null
          contractor_name: string | null
          contractor_phone: string | null
          created_at: string
          description: string | null
          estimated_cost: number | null
          id: string
          priority: string
          reported_by: string | null
          resolution_notes: string | null
          resolved_at: string | null
          scheduled_date: string | null
          status: string
          tenant_id: string | null
          title: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          category?: string | null
          contractor_name?: string | null
          contractor_phone?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          id?: string
          priority?: string
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          scheduled_date?: string | null
          status?: string
          tenant_id?: string | null
          title: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          category?: string | null
          contractor_name?: string | null
          contractor_phone?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          id?: string
          priority?: string
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          scheduled_date?: string | null
          status?: string
          tenant_id?: string | null
          title?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_schedules: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string
          description: string | null
          estimated_cost: number | null
          frequency: string
          id: string
          interval_days: number | null
          is_active: boolean | null
          last_completed_date: string | null
          next_due_date: string | null
          notes: string | null
          title: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          frequency: string
          id?: string
          interval_days?: number | null
          is_active?: boolean | null
          last_completed_date?: string | null
          next_due_date?: string | null
          notes?: string | null
          title: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          frequency?: string
          id?: string
          interval_days?: number | null
          is_active?: boolean | null
          last_completed_date?: string | null
          next_due_date?: string | null
          notes?: string | null
          title?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_schedules_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_minutes: {
        Row: {
          action_items: Json | null
          agenda: string | null
          attendees: string | null
          created_at: string
          created_by: string | null
          end_time: string | null
          id: string
          location: string | null
          meeting_date: string
          notes: string | null
          project_id: string
          start_time: string | null
          title: string
          updated_at: string
        }
        Insert: {
          action_items?: Json | null
          agenda?: string | null
          attendees?: string | null
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          meeting_date?: string
          notes?: string | null
          project_id: string
          start_time?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          action_items?: Json | null
          agenda?: string | null
          attendees?: string | null
          created_at?: string
          created_by?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          meeting_date?: string
          notes?: string | null
          project_id?: string
          start_time?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_minutes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_proofs: {
        Row: {
          amount: number
          created_at: string
          id: string
          lease_id: string | null
          notes: string | null
          payer_name: string
          payment_date: string
          payment_id: string | null
          payment_provider: string
          proof_image_url: string | null
          rejection_reason: string | null
          status: string
          tenant_id: string | null
          transaction_reference: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          lease_id?: string | null
          notes?: string | null
          payer_name: string
          payment_date?: string
          payment_id?: string | null
          payment_provider: string
          proof_image_url?: string | null
          rejection_reason?: string | null
          status?: string
          tenant_id?: string | null
          transaction_reference?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          lease_id?: string | null
          notes?: string | null
          payer_name?: string
          payment_date?: string
          payment_id?: string | null
          payment_provider?: string
          proof_image_url?: string | null
          rejection_reason?: string | null
          status?: string
          tenant_id?: string | null
          transaction_reference?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_proofs_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_proofs_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_proofs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_reminders: {
        Row: {
          amount: number
          created_at: string
          due_day: number
          id: string
          is_active: boolean | null
          last_reminder_sent: string | null
          lease_id: string
          next_reminder_date: string | null
          reminder_type: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_day?: number
          id?: string
          is_active?: boolean | null
          last_reminder_sent?: string | null
          lease_id: string
          next_reminder_date?: string | null
          reminder_type?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_day?: number
          id?: string
          is_active?: boolean | null
          last_reminder_sent?: string | null
          lease_id?: string
          next_reminder_date?: string | null
          reminder_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_reminders_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          lease_id: string | null
          method: string
          months_covered: number | null
          notes: string | null
          payment_date: string
          payment_type: string | null
          period_end: string | null
          period_label: string | null
          period_start: string | null
          recorded_by: string | null
          reference: string | null
          stripe_payment_intent_id: string | null
          stripe_payment_status: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          lease_id?: string | null
          method?: string
          months_covered?: number | null
          notes?: string | null
          payment_date?: string
          payment_type?: string | null
          period_end?: string | null
          period_label?: string | null
          period_start?: string | null
          recorded_by?: string | null
          reference?: string | null
          stripe_payment_intent_id?: string | null
          stripe_payment_status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          lease_id?: string | null
          method?: string
          months_covered?: number | null
          notes?: string | null
          payment_date?: string
          payment_type?: string | null
          period_end?: string | null
          period_label?: string | null
          period_start?: string | null
          recorded_by?: string | null
          reference?: string | null
          stripe_payment_intent_id?: string | null
          stripe_payment_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_features: {
        Row: {
          feature_key: string
          id: string
          is_enabled: boolean
          plan_id: string
        }
        Insert: {
          feature_key: string
          id?: string
          is_enabled?: boolean
          plan_id: string
        }
        Update: {
          feature_key?: string
          id?: string
          is_enabled?: boolean
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_features_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_payments: {
        Row: {
          amount: number | null
          application_number: string
          approved_date: string | null
          created_at: string
          created_by: string | null
          id: string
          net_amount: number | null
          notes: string | null
          paid_date: string | null
          period_end: string | null
          period_label: string | null
          period_start: string | null
          project_id: string
          retainage: number | null
          status: string | null
          submit_date: string | null
          updated_at: string
        }
        Insert: {
          amount?: number | null
          application_number: string
          approved_date?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          net_amount?: number | null
          notes?: string | null
          paid_date?: string | null
          period_end?: string | null
          period_label?: string | null
          period_start?: string | null
          project_id: string
          retainage?: number | null
          status?: string | null
          submit_date?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number | null
          application_number?: string
          approved_date?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          net_amount?: number | null
          notes?: string | null
          paid_date?: string | null
          period_end?: string | null
          period_label?: string | null
          period_start?: string | null
          project_id?: string
          retainage?: number | null
          status?: string | null
          submit_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_budgets: {
        Row: {
          budgeted: number | null
          category: string
          committed: number | null
          created_at: string
          id: string
          notes: string | null
          project_id: string
          spent: number | null
          updated_at: string
        }
        Insert: {
          budgeted?: number | null
          category: string
          committed?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          project_id: string
          spent?: number | null
          updated_at?: string
        }
        Update: {
          budgeted?: number | null
          category?: string
          committed?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          project_id?: string
          spent?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_budgets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_documents: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          name: string
          project_id: string
          updated_at: string
          version: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          name: string
          project_id: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          name?: string
          project_id?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_photos: {
        Row: {
          caption: string | null
          category: string | null
          created_at: string
          id: string
          image_url: string
          location: string | null
          photo_date: string | null
          project_id: string
          uploaded_by: string | null
        }
        Insert: {
          caption?: string | null
          category?: string | null
          created_at?: string
          id?: string
          image_url: string
          location?: string | null
          photo_date?: string | null
          project_id: string
          uploaded_by?: string | null
        }
        Update: {
          caption?: string | null
          category?: string | null
          created_at?: string
          id?: string
          image_url?: string
          location?: string | null
          photo_date?: string | null
          project_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_schedules: {
        Row: {
          assignee: string | null
          created_at: string
          description: string | null
          end_date: string
          id: string
          milestone: boolean | null
          notes: string | null
          parent_id: string | null
          progress: number | null
          project_id: string
          start_date: string
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assignee?: string | null
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          milestone?: boolean | null
          notes?: string | null
          parent_id?: string | null
          progress?: number | null
          project_id: string
          start_date: string
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assignee?: string | null
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          milestone?: boolean | null
          notes?: string | null
          parent_id?: string | null
          progress?: number | null
          project_id?: string
          start_date?: string
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_schedules_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "project_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_schedules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          actual_hours: number | null
          assignee_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          parent_id: string | null
          priority: string | null
          project_id: string
          sort_order: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          parent_id?: string | null
          priority?: string | null
          project_id: string
          sort_order?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          parent_id?: string | null
          priority?: string | null
          project_id?: string
          sort_order?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          actual_end_date: string | null
          budget: number | null
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          location: string | null
          name: string
          notes: string | null
          start_date: string | null
          status: string | null
          target_end_date: string | null
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          actual_end_date?: string | null
          budget?: number | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          start_date?: string | null
          status?: string | null
          target_end_date?: string | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_end_date?: string | null
          budget?: number | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          start_date?: string | null
          status?: string | null
          target_end_date?: string | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string | null
          amenities: string[] | null
          city: string | null
          created_at: string
          depreciation_rate: number | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          last_valuation_date: string | null
          location: string | null
          name: string
          owner_id: string | null
          property_type: string | null
          total_build_area: number | null
          total_land_area: number | null
          updated_at: string
          utilities: string[] | null
          valuation_amount: number | null
          year_built: number | null
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          city?: string | null
          created_at?: string
          depreciation_rate?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          last_valuation_date?: string | null
          location?: string | null
          name: string
          owner_id?: string | null
          property_type?: string | null
          total_build_area?: number | null
          total_land_area?: number | null
          updated_at?: string
          utilities?: string[] | null
          valuation_amount?: number | null
          year_built?: number | null
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          city?: string | null
          created_at?: string
          depreciation_rate?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          last_valuation_date?: string | null
          location?: string | null
          name?: string
          owner_id?: string | null
          property_type?: string | null
          total_build_area?: number | null
          total_land_area?: number | null
          updated_at?: string
          utilities?: string[] | null
          valuation_amount?: number | null
          year_built?: number | null
        }
        Relationships: []
      }
      proposals: {
        Row: {
          accepted_at: string | null
          content: string | null
          created_at: string
          created_by: string | null
          estimate_id: string | null
          id: string
          lead_id: string | null
          notes: string | null
          project_id: string | null
          proposal_number: string
          sent_at: string | null
          status: string
          title: string
          total_amount: number | null
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          accepted_at?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          estimate_id?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          project_id?: string | null
          proposal_number: string
          sent_at?: string | null
          status?: string
          title: string
          total_amount?: number | null
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          accepted_at?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          estimate_id?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          project_id?: string | null
          proposal_number?: string
          sent_at?: string | null
          status?: string
          title?: string
          total_amount?: number | null
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      punch_list_items: {
        Row: {
          assignee: string | null
          completed_date: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          priority: string | null
          project_id: string
          status: string | null
          title: string
          updated_at: string
          verified_by: string | null
        }
        Insert: {
          assignee?: string | null
          completed_date?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          project_id: string
          status?: string | null
          title: string
          updated_at?: string
          verified_by?: string | null
        }
        Update: {
          assignee?: string | null
          completed_date?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          project_id?: string
          status?: string | null
          title?: string
          updated_at?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "punch_list_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          item_id: string | null
          purchase_order_id: string
          quantity: number
          received_quantity: number | null
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          item_id?: string | null
          purchase_order_id: string
          quantity?: number
          received_quantity?: number | null
          total_price?: number
          unit_price?: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          item_id?: string | null
          purchase_order_id?: string
          quantity?: number
          received_quantity?: number | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          approved_by: string | null
          created_at: string | null
          created_by: string | null
          discount_amount: number | null
          expected_date: string | null
          id: string
          notes: string | null
          order_date: string | null
          order_number: string
          project_id: string | null
          received_date: string | null
          status: string | null
          subtotal: number | null
          supplier_id: string | null
          tax_amount: number | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          discount_amount?: number | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string | null
          order_number: string
          project_id?: string | null
          received_date?: string | null
          status?: string | null
          subtotal?: number | null
          supplier_id?: string | null
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          discount_amount?: number | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string | null
          order_number?: string
          project_id?: string | null
          received_date?: string | null
          status?: string | null
          subtotal?: number | null
          supplier_id?: string | null
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          amount: number
          created_at: string
          expense_id: string | null
          id: string
          image_url: string | null
          notes: string | null
          project_id: string | null
          receipt_date: string
          receipt_number: string
          uploaded_by: string | null
          vendor: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          expense_id?: string | null
          id?: string
          image_url?: string | null
          notes?: string | null
          project_id?: string | null
          receipt_date?: string
          receipt_number: string
          uploaded_by?: string | null
          vendor?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          expense_id?: string | null
          id?: string
          image_url?: string | null
          notes?: string | null
          project_id?: string | null
          receipt_date?: string
          receipt_number?: string
          uploaded_by?: string | null
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipts_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_application_links: {
        Row: {
          click_count: number | null
          created_at: string
          id: string
          is_active: boolean | null
          property_id: string | null
          slug: string
          unit_id: string | null
        }
        Insert: {
          click_count?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          property_id?: string | null
          slug: string
          unit_id?: string | null
        }
        Update: {
          click_count?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          property_id?: string | null
          slug?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_application_links_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_application_links_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_applications: {
        Row: {
          created_at: string
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employer: string | null
          full_name: string
          id: string
          id_number: string | null
          id_type: string | null
          monthly_income: number | null
          notes: string | null
          occupation: string | null
          phone: string | null
          previous_address: string | null
          property_id: string | null
          status: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employer?: string | null
          full_name: string
          id?: string
          id_number?: string | null
          id_type?: string | null
          monthly_income?: number | null
          notes?: string | null
          occupation?: string | null
          phone?: string | null
          previous_address?: string | null
          property_id?: string | null
          status?: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employer?: string | null
          full_name?: string
          id?: string
          id_number?: string | null
          id_type?: string | null
          monthly_income?: number | null
          notes?: string | null
          occupation?: string | null
          phone?: string | null
          previous_address?: string | null
          property_id?: string | null
          status?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_applications_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_applications_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_id_cards: {
        Row: {
          card_number: string
          created_at: string
          id: string
          issued_at: string
          lost_reason: string | null
          status: string
          tenant_id: string | null
          unit_id: string
          updated_at: string
        }
        Insert: {
          card_number: string
          created_at?: string
          id?: string
          issued_at?: string
          lost_reason?: string | null
          status?: string
          tenant_id?: string | null
          unit_id: string
          updated_at?: string
        }
        Update: {
          card_number?: string
          created_at?: string
          id?: string
          issued_at?: string
          lost_reason?: string | null
          status?: string
          tenant_id?: string | null
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_id_cards_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_id_cards_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_listing_banners: {
        Row: {
          banner_image_url: string | null
          created_at: string
          id: string
          is_active: boolean | null
          property_id: string
          qr_scans: number | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          banner_image_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          property_id: string
          qr_scans?: number | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          banner_image_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          property_id?: string
          qr_scans?: number | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_listing_banners_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_messages: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          parent_id: string | null
          read_at: string | null
          sender: string
          subject: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          parent_id?: string | null
          read_at?: string | null
          sender: string
          subject: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          parent_id?: string | null
          read_at?: string | null
          sender?: string
          subject?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_messages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "rental_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rfis: {
        Row: {
          answered_at: string | null
          answered_by: string | null
          asked_by: string | null
          created_at: string
          due_date: string | null
          id: string
          priority: string | null
          project_id: string
          question: string
          response: string | null
          rfi_number: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          answered_at?: string | null
          answered_by?: string | null
          asked_by?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          priority?: string | null
          project_id: string
          question: string
          response?: string | null
          rfi_number: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          answered_at?: string | null
          answered_by?: string | null
          asked_by?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          priority?: string | null
          project_id?: string
          question?: string
          response?: string | null
          rfi_number?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfis_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_incidents: {
        Row: {
          corrective_action: string | null
          created_at: string
          description: string
          id: string
          incident_date: string
          incident_type: string
          location: string | null
          project_id: string
          reported_by: string | null
          root_cause: string | null
          severity: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          corrective_action?: string | null
          created_at?: string
          description: string
          id?: string
          incident_date?: string
          incident_type: string
          location?: string | null
          project_id: string
          reported_by?: string | null
          root_cause?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          corrective_action?: string | null
          created_at?: string
          description?: string
          id?: string
          incident_date?: string
          incident_type?: string
          location?: string | null
          project_id?: string
          reported_by?: string | null
          root_cause?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_incidents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_reports: {
        Row: {
          config: Json | null
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          type: string
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          type: string
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      sop_checklist_items: {
        Row: {
          checked_at: string | null
          checked_by: string | null
          checklist_id: string
          created_at: string
          id: string
          is_checked: boolean | null
          item: string
          sort_order: number | null
        }
        Insert: {
          checked_at?: string | null
          checked_by?: string | null
          checklist_id: string
          created_at?: string
          id?: string
          is_checked?: boolean | null
          item: string
          sort_order?: number | null
        }
        Update: {
          checked_at?: string | null
          checked_by?: string | null
          checklist_id?: string
          created_at?: string
          id?: string
          is_checked?: boolean | null
          item?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sop_checklist_items_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "sop_checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      sop_checklists: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          project_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sop_checklists_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      sop_forms: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          form_config: Json | null
          id: string
          project_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          form_config?: Json | null
          id?: string
          project_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          form_config?: Json | null
          id?: string
          project_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sop_forms_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontracts: {
        Row: {
          contract_amount: number | null
          contract_number: string
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          notes: string | null
          paid_to_date: number | null
          project_id: string
          retention_percent: number | null
          scope_of_work: string
          start_date: string | null
          status: string
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          contract_amount?: number | null
          contract_number: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          paid_to_date?: number | null
          project_id: string
          retention_percent?: number | null
          scope_of_work: string
          start_date?: string | null
          status?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          contract_amount?: number | null
          contract_number?: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          paid_to_date?: number | null
          project_id?: string
          retention_percent?: number | null
          scope_of_work?: string
          start_date?: string | null
          status?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcontracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontracts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      submittals: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          file_url: string | null
          id: string
          project_id: string
          review_notes: string | null
          reviewed_by: string | null
          status: string
          submitted_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          file_url?: string | null
          id?: string
          project_id: string
          review_notes?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          file_url?: string | null
          id?: string
          project_id?: string
          review_notes?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submittals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          monthly_price: number
          name: string
          slug: string
          sort_order: number
          updated_at: string
          yearly_price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          monthly_price?: number
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
          yearly_price?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          monthly_price?: number
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
          yearly_price?: number
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          category: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          payment_terms: string | null
          phone: string | null
          status: string | null
          tax_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          status?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          status?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tax_alerts: {
        Row: {
          alert_type: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_active: boolean | null
          title: string
        }
        Insert: {
          alert_type?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_active?: boolean | null
          title: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
        }
        Relationships: []
      }
      tax_checklist_items: {
        Row: {
          checked: boolean
          checked_at: string | null
          checked_by: string | null
          created_at: string
          id: string
          label: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          checked?: boolean
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string
          id?: string
          label: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          checked?: boolean
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string
          id?: string
          label?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      tax_next_steps: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          is_completed: boolean | null
          label: string
          sort_order: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean | null
          label: string
          sort_order?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean | null
          label?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      tenants: {
        Row: {
          access_pin: string | null
          auth_user_id: string | null
          created_at: string
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employer: string | null
          full_name: string
          id: string
          id_number: string | null
          id_type: string | null
          monthly_income: number | null
          notes: string | null
          occupation: string | null
          phone: string | null
          previous_address: string | null
          status: string
          updated_at: string
        }
        Insert: {
          access_pin?: string | null
          auth_user_id?: string | null
          created_at?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employer?: string | null
          full_name: string
          id?: string
          id_number?: string | null
          id_type?: string | null
          monthly_income?: number | null
          notes?: string | null
          occupation?: string | null
          phone?: string | null
          previous_address?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          access_pin?: string | null
          auth_user_id?: string | null
          created_at?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employer?: string | null
          full_name?: string
          id?: string
          id_number?: string | null
          id_type?: string | null
          monthly_income?: number | null
          notes?: string | null
          occupation?: string | null
          phone?: string | null
          previous_address?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      timesheets: {
        Row: {
          approved_by: string | null
          created_at: string
          date: string
          description: string | null
          employee_id: string
          end_time: string | null
          hours: number
          id: string
          overtime_hours: number | null
          project_id: string | null
          start_time: string | null
          status: string
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          date?: string
          description?: string | null
          employee_id: string
          end_time?: string | null
          hours?: number
          id?: string
          overtime_hours?: number | null
          project_id?: string | null
          start_time?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          date?: string
          description?: string | null
          employee_id?: string
          end_time?: string | null
          hours?: number
          id?: string
          overtime_hours?: number | null
          project_id?: string | null
          start_time?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timesheets_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          bathrooms: number | null
          bedrooms: number | null
          created_at: string
          deposit_amount: number | null
          floor_number: number | null
          id: string
          is_active: boolean | null
          monthly_rent: number
          notes: string | null
          photos: Json | null
          property_id: string
          size_sqm: number | null
          status: string
          unit_number: string
          unit_type: string | null
          updated_at: string
        }
        Insert: {
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          deposit_amount?: number | null
          floor_number?: number | null
          id?: string
          is_active?: boolean | null
          monthly_rent?: number
          notes?: string | null
          photos?: Json | null
          property_id: string
          size_sqm?: number | null
          status?: string
          unit_number: string
          unit_type?: string | null
          updated_at?: string
        }
        Update: {
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          deposit_amount?: number | null
          floor_number?: number | null
          id?: string
          is_active?: boolean | null
          monthly_rent?: number
          notes?: string | null
          photos?: Json | null
          property_id?: string
          size_sqm?: number | null
          status?: string
          unit_number?: string
          unit_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      company_has_feature: {
        Args: { p_feature_key: string }
        Returns: {
          has_access: boolean
        }[]
      }
      get_company_branding: {
        Args: never
        Returns: {
          accent_color: string
          company_id: string
          company_name_override: string | null
          created_at: string
          document_footer: string | null
          id: string
          logo_url: string | null
          primary_color: string
          receipt_footer: string | null
          secondary_color: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "company_branding"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff:
        | { Args: never; Returns: boolean }
        | { Args: { _user_id: string }; Returns: boolean }
      validate_card_login: {
        Args: {
          p_access_pin: string
          p_card_number: string
          p_unit_number: string
        }
        Returns: {
          email: string
          error_message: string
          valid: boolean
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "owner" | "tenant"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager", "owner", "tenant"],
    },
  },
} as const
