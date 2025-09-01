export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      branch_stocks: {
        Row: {
          branch_name: string
          created_at: string | null
          id: string
          product_id: string
          stock: number | null
          updated_at: string | null
        }
        Insert: {
          branch_name: string
          created_at?: string | null
          id?: string
          product_id: string
          stock?: number | null
          updated_at?: string | null
        }
        Update: {
          branch_name?: string
          created_at?: string | null
          id?: string
          product_id?: string
          stock?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branch_stocks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string
          allow_variants: boolean
          created_at: string | null
          id: string
          is_active: boolean | null
          manager_id: string | null
          name: string
          name_en: string | null
          phone: string
          updated_at: string | null
        }
        Insert: {
          address: string
          allow_variants?: boolean
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          name: string
          name_en?: string | null
          phone: string
          updated_at?: string | null
        }
        Update: {
          address?: string
          allow_variants?: boolean
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          name?: string
          name_en?: string | null
          phone?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          created_at: string | null
          id: string
          price: number
          product_id: string
          quantity: number
          selected_color: string | null
          selected_size: string | null
          session_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          price?: number
          product_id: string
          quantity?: number
          selected_color?: string | null
          selected_size?: string | null
          session_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          price?: number
          product_id?: string
          quantity?: number
          selected_color?: string | null
          selected_size?: string | null
          session_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      cashbox_entries: {
        Row: {
          amount: number
          branch_id: string
          created_at: string | null
          description: string | null
          entry_type: string
          id: string
          reference_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          branch_id: string
          created_at?: string | null
          description?: string | null
          entry_type: string
          id?: string
          reference_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          branch_id?: string
          created_at?: string | null
          description?: string | null
          entry_type?: string
          id?: string
          reference_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashbox_entries_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashbox_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          name_en: string | null
          parent_id: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          name_en?: string | null
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          name_en?: string | null
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_groups: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_groups_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "customer_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_payments: {
        Row: {
          amount: number
          branch_id: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string
          id: string
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          reference_number: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          reference_number?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          reference_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_payments_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          account_balance: number | null
          address: string | null
          category: string | null
          city: string | null
          company_name: string | null
          contact_person: string | null
          country: string | null
          created_at: string | null
          credit_limit: number | null
          email: string | null
          group_id: string | null
          id: string
          is_active: boolean | null
          loyalty_points: number | null
          name: string
          notes: string | null
          phone: string | null
          rank: string | null
          tax_id: string | null
          updated_at: string | null
        }
        Insert: {
          account_balance?: number | null
          address?: string | null
          category?: string | null
          city?: string | null
          company_name?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string | null
          credit_limit?: number | null
          email?: string | null
          group_id?: string | null
          id?: string
          is_active?: boolean | null
          loyalty_points?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          rank?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Update: {
          account_balance?: number | null
          address?: string | null
          category?: string | null
          city?: string | null
          company_name?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string | null
          credit_limit?: number | null
          email?: string | null
          group_id?: string | null
          id?: string
          is_active?: boolean | null
          loyalty_points?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          rank?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "customer_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          branch_id: string
          category: string
          created_at: string | null
          description: string
          id: string
          receipt_url: string | null
          user_id: string
        }
        Insert: {
          amount: number
          branch_id: string
          category?: string
          created_at?: string | null
          description: string
          id?: string
          receipt_url?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          branch_id?: string
          category?: string
          created_at?: string | null
          description?: string
          id?: string
          receipt_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          branch_id: string
          id: string
          last_updated: string | null
          min_stock: number | null
          product_id: string
          quantity: number
        }
        Insert: {
          branch_id: string
          id?: string
          last_updated?: string | null
          min_stock?: number | null
          product_id: string
          quantity?: number
        }
        Update: {
          branch_id?: string
          id?: string
          last_updated?: string | null
          min_stock?: number | null
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          discount: number | null
          id: string
          notes: string | null
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          discount?: number | null
          id?: string
          notes?: string | null
          order_id: string
          product_id: string
          quantity?: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          discount?: number | null
          id?: string
          notes?: string | null
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          branch_id: string | null
          created_at: string | null
          customer_address: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string
          id: string
          invoice_type: Database["public"]["Enums"]["invoice_type_enum"] | null
          notes: string | null
          order_number: string
          time: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          id?: string
          invoice_type?: Database["public"]["Enums"]["invoice_type_enum"] | null
          notes?: string | null
          order_number: string
          time?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          id?: string
          invoice_type?: Database["public"]["Enums"]["invoice_type_enum"] | null
          notes?: string | null
          order_number?: string
          time?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      product_cost_tracking: {
        Row: {
          average_cost: number
          created_at: string | null
          has_purchase_history: boolean | null
          id: string
          last_purchase_date: string | null
          last_purchase_price: number | null
          product_id: string | null
          total_cost: number
          total_quantity_purchased: number
          updated_at: string | null
          variant_id: string | null
        }
        Insert: {
          average_cost?: number
          created_at?: string | null
          has_purchase_history?: boolean | null
          id?: string
          last_purchase_date?: string | null
          last_purchase_price?: number | null
          product_id?: string | null
          total_cost?: number
          total_quantity_purchased?: number
          updated_at?: string | null
          variant_id?: string | null
        }
        Update: {
          average_cost?: number
          created_at?: string | null
          has_purchase_history?: boolean | null
          id?: string
          last_purchase_date?: string | null
          last_purchase_price?: number | null
          product_id?: string | null
          total_cost?: number
          total_quantity_purchased?: number
          updated_at?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_cost_tracking_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string | null
          id: string
          image_url: string
          product_id: string
          sort_order: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          product_id: string
          sort_order?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          product_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          branch_id: string
          created_at: string | null
          id: string
          name: string
          product_id: string
          quantity: number
          updated_at: string | null
          value: string | null
          variant_type: string
        }
        Insert: {
          branch_id: string
          created_at?: string | null
          id?: string
          name: string
          product_id: string
          quantity?: number
          updated_at?: string | null
          value?: string | null
          variant_type: string
        }
        Update: {
          branch_id?: string
          created_at?: string | null
          id?: string
          name?: string
          product_id?: string
          quantity?: number
          updated_at?: string | null
          value?: string | null
          variant_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          barcodes: string[] | null
          branch: string | null
          category_id: string | null
          cost_price: number
          created_at: string | null
          description: string | null
          description_en: string | null
          id: string
          is_active: boolean | null
          location: string | null
          main_image_url: string | null
          max_stock: number | null
          min_stock: number | null
          name: string
          name_en: string | null
          price: number
          price1: number | null
          price2: number | null
          price3: number | null
          price4: number | null
          product_code: string | null
          status: string | null
          stock: number | null
          tax_price: number | null
          unit: string | null
          updated_at: string | null
          video_url: string | null
          warehouse: string | null
          wholesale_price: number | null
        }
        Insert: {
          barcode?: string | null
          barcodes?: string[] | null
          branch?: string | null
          category_id?: string | null
          cost_price?: number
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          main_image_url?: string | null
          max_stock?: number | null
          min_stock?: number | null
          name: string
          name_en?: string | null
          price?: number
          price1?: number | null
          price2?: number | null
          price3?: number | null
          price4?: number | null
          product_code?: string | null
          status?: string | null
          stock?: number | null
          tax_price?: number | null
          unit?: string | null
          updated_at?: string | null
          video_url?: string | null
          warehouse?: string | null
          wholesale_price?: number | null
        }
        Update: {
          barcode?: string | null
          barcodes?: string[] | null
          branch?: string | null
          category_id?: string | null
          cost_price?: number
          created_at?: string | null
          description?: string | null
          description_en?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          main_image_url?: string | null
          max_stock?: number | null
          min_stock?: number | null
          name?: string
          name_en?: string | null
          price?: number
          price1?: number | null
          price2?: number | null
          price3?: number | null
          price4?: number | null
          product_code?: string | null
          status?: string | null
          stock?: number | null
          tax_price?: number | null
          unit?: string | null
          updated_at?: string | null
          video_url?: string | null
          warehouse?: string | null
          wholesale_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_invoice_items: {
        Row: {
          created_at: string | null
          discount_amount: number | null
          id: string
          notes: string | null
          product_id: string | null
          purchase_invoice_id: string | null
          quantity: number
          tax_amount: number | null
          total_price: number
          unit_purchase_price: number
          updated_at: string | null
          variant_id: string | null
        }
        Insert: {
          created_at?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          product_id?: string | null
          purchase_invoice_id?: string | null
          quantity: number
          tax_amount?: number | null
          total_price: number
          unit_purchase_price: number
          updated_at?: string | null
          variant_id?: string | null
        }
        Update: {
          created_at?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          product_id?: string | null
          purchase_invoice_id?: string | null
          quantity?: number
          tax_amount?: number | null
          total_price?: number
          unit_purchase_price?: number
          updated_at?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_invoice_items_purchase_invoice_id_fkey"
            columns: ["purchase_invoice_id"]
            isOneToOne: false
            referencedRelation: "purchase_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_invoices: {
        Row: {
          branch_id: string | null
          created_at: string | null
          created_by: string | null
          discount_amount: number | null
          id: string
          invoice_date: string
          invoice_number: string
          invoice_type: Database["public"]["Enums"]["purchase_invoice_type_enum"] | null
          is_active: boolean | null
          net_amount: number
          notes: string | null
          payment_status: string | null
          record_id: string | null
          supplier_id: string | null
          tax_amount: number | null
          time: string | null
          total_amount: number
          updated_at: string | null
          warehouse_id: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          discount_amount?: number | null
          id?: string
          invoice_date?: string
          invoice_number: string
          invoice_type?: Database["public"]["Enums"]["purchase_invoice_type_enum"] | null
          is_active?: boolean | null
          net_amount?: number
          notes?: string | null
          payment_status?: string | null
          record_id?: string | null
          supplier_id?: string | null
          tax_amount?: number | null
          time?: string | null
          total_amount?: number
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          discount_amount?: number | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          invoice_type?: Database["public"]["Enums"]["purchase_invoice_type_enum"] | null
          is_active?: boolean | null
          net_amount?: number
          notes?: string | null
          payment_status?: string | null
          record_id?: string | null
          supplier_id?: string | null
          tax_amount?: number | null
          time?: string | null
          total_amount?: number
          updated_at?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_purchase_invoices_record_id"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_invoices_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_invoices_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      records: {
        Row: {
          branch_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "safes_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          cost_price: number
          created_at: string | null
          discount: number | null
          id: string
          notes: string | null
          product_id: string
          quantity: number
          sale_id: string
          unit_price: number
        }
        Insert: {
          cost_price?: number
          created_at?: string | null
          discount?: number | null
          id?: string
          notes?: string | null
          product_id: string
          quantity?: number
          sale_id: string
          unit_price: number
        }
        Update: {
          cost_price?: number
          created_at?: string | null
          discount?: number | null
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          sale_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          branch_id: string
          cashier_id: string | null
          created_at: string | null
          customer_id: string | null
          discount_amount: number | null
          id: string
          invoice_number: string
          invoice_type: Database["public"]["Enums"]["sales_invoice_type_enum"] | null
          is_updated: boolean | null
          notes: string | null
          payment_method: string
          profit: number | null
          record_id: string | null
          tax_amount: number | null
          time: string | null
          total_amount: number
          update_history: Json | null
        }
        Insert: {
          branch_id: string
          cashier_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          id?: string
          invoice_number: string
          invoice_type?: Database["public"]["Enums"]["sales_invoice_type_enum"] | null
          is_updated?: boolean | null
          notes?: string | null
          payment_method?: string
          profit?: number | null
          record_id?: string | null
          tax_amount?: number | null
          time?: string | null
          total_amount?: number
          update_history?: Json | null
        }
        Update: {
          branch_id?: string
          cashier_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          id?: string
          invoice_number?: string
          invoice_type?: Database["public"]["Enums"]["sales_invoice_type_enum"] | null
          is_updated?: boolean | null
          notes?: string | null
          payment_method?: string
          profit?: number | null
          record_id?: string | null
          tax_amount?: number | null
          time?: string | null
          total_amount?: number
          update_history?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sales_record_id"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_cashier_id_fkey"
            columns: ["cashier_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_groups: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_groups_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "supplier_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_payments: {
        Row: {
          amount: number
          branch_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          reference_number: string | null
          supplier_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          reference_number?: string | null
          supplier_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          branch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          reference_number?: string | null
          supplier_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_payments_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          account_balance: number | null
          address: string | null
          category: string | null
          city: string | null
          company_name: string | null
          contact_person: string | null
          country: string | null
          created_at: string | null
          credit_limit: number | null
          email: string | null
          group_id: string | null
          id: string
          is_active: boolean | null
          last_purchase: string | null
          name: string
          notes: string | null
          phone: string | null
          rank: string | null
          tax_id: string | null
          total_purchases: number | null
          updated_at: string | null
        }
        Insert: {
          account_balance?: number | null
          address?: string | null
          category?: string | null
          city?: string | null
          company_name?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string | null
          credit_limit?: number | null
          email?: string | null
          group_id?: string | null
          id?: string
          is_active?: boolean | null
          last_purchase?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          rank?: string | null
          tax_id?: string | null
          total_purchases?: number | null
          updated_at?: string | null
        }
        Update: {
          account_balance?: number | null
          address?: string | null
          category?: string | null
          city?: string | null
          company_name?: string | null
          contact_person?: string | null
          country?: string | null
          created_at?: string | null
          credit_limit?: number | null
          email?: string | null
          group_id?: string | null
          id?: string
          is_active?: boolean | null
          last_purchase?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          rank?: string | null
          tax_id?: string | null
          total_purchases?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_suppliers_group_id"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "supplier_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          branch_id: string | null
          created_at: string | null
          full_name: string
          id: string
          is_active: boolean | null
          phone: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          branch_id?: string | null
          created_at?: string | null
          full_name: string
          id: string
          is_active?: boolean | null
          phone?: string | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          branch_id?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_profiles_branch"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_stocks: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          stock: number | null
          updated_at: string | null
          warehouse_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          stock?: number | null
          updated_at?: string | null
          warehouse_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          stock?: number | null
          updated_at?: string | null
          warehouse_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_stocks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          address: string
          allow_variants: boolean
          created_at: string | null
          id: string
          is_active: boolean | null
          manager_id: string | null
          name: string
          name_en: string | null
          phone: string
          updated_at: string | null
        }
        Insert: {
          address: string
          allow_variants?: boolean
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          name: string
          name_en?: string | null
          phone: string
          updated_at?: string | null
        }
        Update: {
          address?: string
          allow_variants?: boolean
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          name?: string
          name_en?: string | null
          phone?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_admin_user: {
        Args: {
          admin_email: string
          admin_password: string
          admin_name: string
        }
        Returns: string
      }
      create_invoice: {
        Args: {
          p_order_number: string
          p_paid_amount: number
          p_branch_id: string
          p_record_id: string
          p_notes?: string
          p_next_status?: string
        }
        Returns: Json
      }
      generate_invoice_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_low_stock_products: {
        Args: { p_branch_id?: string }
        Returns: {
          product_id: string
          product_name: string
          current_quantity: number
          min_stock: number
          branch_id: string
          branch_name: string
        }[]
      }
      transfer_stock: {
        Args: {
          p_product_id: string
          p_from_branch_id: string
          p_to_branch_id: string
          p_quantity: number
          p_user_id: string
        }
        Returns: boolean
      }
      update_inventory_quantity: {
        Args: {
          p_product_id: string
          p_branch_id: string
          p_quantity_change: number
        }
        Returns: undefined
      }
    }
    Enums: {
      invoice_type_enum: "Sale" | "Purchase" | "Sale Return" | "Purchase Return"
      purchase_invoice_type_enum: "Purchase Invoice" | "Purchase Return"
      sales_invoice_type_enum: "Sale Invoice" | "Sale Return"
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
      invoice_type_enum: ["Sale", "Purchase", "Sale Return", "Purchase Return"],
      purchase_invoice_type_enum: ["Purchase Invoice", "Purchase Return"],
      sales_invoice_type_enum: ["Sale Invoice", "Sale Return"],
    },
  },
} as const