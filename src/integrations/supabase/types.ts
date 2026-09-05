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
      admin_activity_log: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          id: string
          metadata: Json | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      biosecurity_checks: {
        Row: {
          completed_at: string | null
          created_at: string
          farm_id: string
          id: string
          is_completed: boolean
          item: string
          notes: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          farm_id: string
          id?: string
          is_completed?: boolean
          item: string
          notes?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          farm_id?: string
          id?: string
          is_completed?: boolean
          item?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "biosecurity_checks_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcast_messages: {
        Row: {
          audience: string
          created_at: string
          id: string
          message: string
          recipient_count: number
          sender_id: string
          subject: string
        }
        Insert: {
          audience?: string
          created_at?: string
          id?: string
          message: string
          recipient_count?: number
          sender_id: string
          subject: string
        }
        Update: {
          audience?: string
          created_at?: string
          id?: string
          message?: string
          recipient_count?: number
          sender_id?: string
          subject?: string
        }
        Relationships: []
      }
      brooders: {
        Row: {
          avg_weight_g: number
          brooder_code: string
          created_at: string
          farm_id: string
          female_count: number | null
          health_status: string
          id: string
          male_count: number | null
          notes: string | null
          pond_name: string
          quantity: number
          species: string
          staff: string | null
          stocking_date: string
          updated_at: string
        }
        Insert: {
          avg_weight_g?: number
          brooder_code: string
          created_at?: string
          farm_id: string
          female_count?: number | null
          health_status?: string
          id?: string
          male_count?: number | null
          notes?: string | null
          pond_name: string
          quantity?: number
          species?: string
          staff?: string | null
          stocking_date?: string
          updated_at?: string
        }
        Update: {
          avg_weight_g?: number
          brooder_code?: string
          created_at?: string
          farm_id?: string
          female_count?: number | null
          health_status?: string
          id?: string
          male_count?: number | null
          notes?: string | null
          pond_name?: string
          quantity?: number
          species?: string
          staff?: string | null
          stocking_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brooders_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      farms: {
        Row: {
          created_at: string
          id: string
          location: string | null
          market_orientation: string
          name: string
          num_ponds: number | null
          onboarding_complete: boolean
          operation_type: string
          production_system: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          location?: string | null
          market_orientation?: string
          name?: string
          num_ponds?: number | null
          onboarding_complete?: boolean
          operation_type?: string
          production_system?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string | null
          market_orientation?: string
          name?: string
          num_ponds?: number | null
          onboarding_complete?: boolean
          operation_type?: string
          production_system?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feed_stock: {
        Row: {
          created_at: string
          farm_id: string
          feed_type: string
          id: string
          low_threshold_kg: number
          quantity_kg: number
          unit_cost: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          farm_id: string
          feed_type: string
          id?: string
          low_threshold_kg?: number
          quantity_kg?: number
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          farm_id?: string
          feed_type?: string
          id?: string
          low_threshold_kg?: number
          quantity_kg?: number
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_stock_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      feeding_logs: {
        Row: {
          amount_kg: number
          batch_id: string
          created_at: string
          feed_type: string
          feeding_time: string
          id: string
          notes: string | null
          status: string
        }
        Insert: {
          amount_kg: number
          batch_id: string
          created_at?: string
          feed_type: string
          feeding_time?: string
          id?: string
          notes?: string | null
          status?: string
        }
        Update: {
          amount_kg?: number
          batch_id?: string
          created_at?: string
          feed_type?: string
          feeding_time?: string
          id?: string
          notes?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "feeding_logs_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "fish_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_records: {
        Row: {
          amount: number
          batch_id: string | null
          category: string
          created_at: string
          description: string | null
          farm_id: string
          id: string
          record_type: string
          transaction_date: string
        }
        Insert: {
          amount?: number
          batch_id?: string | null
          category?: string
          created_at?: string
          description?: string | null
          farm_id: string
          id?: string
          record_type?: string
          transaction_date?: string
        }
        Update: {
          amount?: number
          batch_id?: string | null
          category?: string
          created_at?: string
          description?: string | null
          farm_id?: string
          id?: string
          record_type?: string
          transaction_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_records_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "fish_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_records_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      fish_batches: {
        Row: {
          avg_weight: number | null
          biomass: number | null
          created_at: string
          current_count: number
          farm_id: string
          fcr: number | null
          id: string
          initial_count: number
          mortality_rate: number | null
          name: string
          pond: string | null
          species: string
          stage: string
          status: string
          stock_date: string
          updated_at: string
        }
        Insert: {
          avg_weight?: number | null
          biomass?: number | null
          created_at?: string
          current_count?: number
          farm_id: string
          fcr?: number | null
          id?: string
          initial_count?: number
          mortality_rate?: number | null
          name: string
          pond?: string | null
          species: string
          stage?: string
          status?: string
          stock_date?: string
          updated_at?: string
        }
        Update: {
          avg_weight?: number | null
          biomass?: number | null
          created_at?: string
          current_count?: number
          farm_id?: string
          fcr?: number | null
          id?: string
          initial_count?: number
          mortality_rate?: number | null
          name?: string
          pond?: string | null
          species?: string
          stage?: string
          status?: string
          stock_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fish_batches_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_samples: {
        Row: {
          avg_length_cm: number | null
          avg_weight_g: number
          batch_id: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          sample_date: string
          sample_size: number
          updated_at: string
        }
        Insert: {
          avg_length_cm?: number | null
          avg_weight_g: number
          batch_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          sample_date?: string
          sample_size?: number
          updated_at?: string
        }
        Update: {
          avg_length_cm?: number | null
          avg_weight_g?: number
          batch_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          sample_date?: string
          sample_size?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "growth_samples_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "fish_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      hatchery_ponds: {
        Row: {
          capacity: number | null
          created_at: string
          farm_id: string
          id: string
          name: string
          notes: string | null
          purpose: string
          status: string
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          farm_id: string
          id?: string
          name: string
          notes?: string | null
          purpose?: string
          status?: string
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          created_at?: string
          farm_id?: string
          id?: string
          name?: string
          notes?: string | null
          purpose?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hatchery_ponds_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      hatchery_production: {
        Row: {
          batch_code: string
          brooder_id: string | null
          collected_date: string
          created_at: string
          farm_id: string
          grading_date: string | null
          id: string
          notes: string | null
          pond_stocked: string
          restocked_amount: number
          sold_amount: number
          staff: string | null
          status: string
          survival_rate: number
          total_collection: number
          total_graded: number
          updated_at: string
        }
        Insert: {
          batch_code: string
          brooder_id?: string | null
          collected_date?: string
          created_at?: string
          farm_id: string
          grading_date?: string | null
          id?: string
          notes?: string | null
          pond_stocked: string
          restocked_amount?: number
          sold_amount?: number
          staff?: string | null
          status?: string
          survival_rate?: number
          total_collection?: number
          total_graded?: number
          updated_at?: string
        }
        Update: {
          batch_code?: string
          brooder_id?: string | null
          collected_date?: string
          created_at?: string
          farm_id?: string
          grading_date?: string | null
          id?: string
          notes?: string | null
          pond_stocked?: string
          restocked_amount?: number
          sold_amount?: number
          staff?: string | null
          status?: string
          survival_rate?: number
          total_collection?: number
          total_graded?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hatchery_production_brooder_id_fkey"
            columns: ["brooder_id"]
            isOneToOne: false
            referencedRelation: "brooders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hatchery_production_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      health_records: {
        Row: {
          batch_id: string
          created_at: string
          description: string | null
          id: string
          mortality_count: number | null
          record_type: string
          recorded_at: string
          severity: string | null
          title: string
          treatment: string | null
        }
        Insert: {
          batch_id: string
          created_at?: string
          description?: string | null
          id?: string
          mortality_count?: number | null
          record_type?: string
          recorded_at?: string
          severity?: string | null
          title: string
          treatment?: string | null
        }
        Update: {
          batch_id?: string
          created_at?: string
          description?: string | null
          id?: string
          mortality_count?: number | null
          record_type?: string
          recorded_at?: string
          severity?: string | null
          title?: string
          treatment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "health_records_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "fish_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          batch_id: string | null
          buyer_contact: string | null
          buyer_name: string
          created_at: string
          due_date: string
          farm_id: string
          id: string
          issue_date: string
          item: string
          notes: string | null
          paid_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          batch_id?: string | null
          buyer_contact?: string | null
          buyer_name: string
          created_at?: string
          due_date: string
          farm_id: string
          id?: string
          issue_date?: string
          item: string
          notes?: string | null
          paid_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          batch_id?: string | null
          buyer_contact?: string | null
          buyer_name?: string
          created_at?: string
          due_date?: string
          farm_id?: string
          id?: string
          issue_date?: string
          item?: string
          notes?: string | null
          paid_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "fish_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          loan_id: string
          notes: string | null
          payment_date: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          loan_id: string
          notes?: string | null
          payment_date?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          loan_id?: string
          notes?: string | null
          payment_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          created_at: string
          farm_id: string
          id: string
          interest_rate: number
          lender: string
          monthly_installment: number
          principal: number
          purpose: string | null
          remaining_balance: number
          start_date: string
          status: string
          term_months: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          farm_id: string
          id?: string
          interest_rate?: number
          lender: string
          monthly_installment: number
          principal: number
          purpose?: string | null
          remaining_balance: number
          start_date?: string
          status?: string
          term_months: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          farm_id?: string
          id?: string
          interest_rate?: number
          lender?: string
          monthly_installment?: number
          principal?: number
          purpose?: string | null
          remaining_balance?: number
          start_date?: string
          status?: string
          term_months?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_cart_items: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          quantity: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          quantity?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_cart_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_dispute_messages: {
        Row: {
          created_at: string
          dispute_id: string
          id: string
          message: string
          sender_id: string
          sender_role: string
        }
        Insert: {
          created_at?: string
          dispute_id: string
          id?: string
          message: string
          sender_id: string
          sender_role: string
        }
        Update: {
          created_at?: string
          dispute_id?: string
          id?: string
          message?: string
          sender_id?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_dispute_messages_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "marketplace_disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_disputes: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          opened_by: string
          order_id: string
          reason: string
          resolution: string | null
          resolved_at: string | null
          seller_id: string
          status: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          opened_by: string
          order_id: string
          reason: string
          resolution?: string | null
          resolved_at?: string | null
          seller_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          opened_by?: string
          order_id?: string
          reason?: string
          resolution?: string | null
          resolved_at?: string | null
          seller_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_disputes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_listings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          location: string
          price: number
          quantity: string
          species: string
          status: string
          survival_guarantee: number | null
          title: string
          unit: string
          updated_at: string
          user_id: string
          weight: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          location: string
          price: number
          quantity: string
          species: string
          status?: string
          survival_guarantee?: number | null
          title: string
          unit: string
          updated_at?: string
          user_id: string
          weight?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          location?: string
          price?: number
          quantity?: string
          species?: string
          status?: string
          survival_guarantee?: number | null
          title?: string
          unit?: string
          updated_at?: string
          user_id?: string
          weight?: string | null
        }
        Relationships: []
      }
      marketplace_notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          read: boolean
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          related_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      marketplace_orders: {
        Row: {
          buyer_id: string
          created_at: string
          delivered_at: string | null
          delivery_address: string | null
          delivery_type: string
          eta: string | null
          id: string
          listing_id: string
          listing_title: string
          packed_at: string | null
          payment_status: string
          placed_at: string
          platform_fee: number
          quantity: number
          seller_id: string
          shipped_at: string | null
          status: string
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          subtotal: number
          total: number
          tracking_number: string | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_type?: string
          eta?: string | null
          id?: string
          listing_id: string
          listing_title: string
          packed_at?: string | null
          payment_status?: string
          placed_at?: string
          platform_fee?: number
          quantity?: number
          seller_id: string
          shipped_at?: string | null
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          subtotal: number
          total: number
          tracking_number?: string | null
          unit_price: number
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_type?: string
          eta?: string | null
          id?: string
          listing_id?: string
          listing_title?: string
          packed_at?: string | null
          payment_status?: string
          placed_at?: string
          platform_fee?: number
          quantity?: number
          seller_id?: string
          shipped_at?: string | null
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          subtotal?: number
          total?: number
          tracking_number?: string | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_orders_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_flags: {
        Row: {
          created_at: string
          flagged_by: string | null
          id: string
          listing_id: string
          reason: string
          resolved_at: string | null
          reviewer_id: string | null
          reviewer_notes: string | null
          risk_level: string
          status: string
        }
        Insert: {
          created_at?: string
          flagged_by?: string | null
          id?: string
          listing_id: string
          reason: string
          resolved_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          risk_level?: string
          status?: string
        }
        Update: {
          created_at?: string
          flagged_by?: string | null
          id?: string
          listing_id?: string
          reason?: string
          resolved_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          risk_level?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_flags_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          farm_id: string | null
          id: string
          link: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          farm_id?: string | null
          id?: string
          link?: string | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          farm_id?: string | null
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount_tzs: number
          channel: string
          created_at: string
          id: string
          payment_url: string | null
          phone: string | null
          plan: string | null
          provider: string
          provider_ref: string | null
          purpose: string
          raw: Json | null
          reference: string
          related_id: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          selcom_transid: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_tzs: number
          channel?: string
          created_at?: string
          id?: string
          payment_url?: string | null
          phone?: string | null
          plan?: string | null
          provider?: string
          provider_ref?: string | null
          purpose: string
          raw?: Json | null
          reference: string
          related_id?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selcom_transid?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_tzs?: number
          channel?: string
          created_at?: string
          id?: string
          payment_url?: string | null
          phone?: string | null
          plan?: string | null
          provider?: string
          provider_ref?: string | null
          purpose?: string
          raw?: Json | null
          reference?: string
          related_id?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selcom_transid?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          ai_advisor: boolean
          assured_delivery: boolean
          commission_rate: number
          dispute_auto_escalation: boolean
          free_user_listings: boolean
          id: number
          kyc_required: boolean
          maintenance_mode: boolean
          marketplace_open: boolean
          mpesa_account_name: string
          mpesa_auto_approve: boolean
          mpesa_number: string
          new_registrations: boolean
          price_basic_cents: number
          price_enterprise_cents: number
          price_pro_cents: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          ai_advisor?: boolean
          assured_delivery?: boolean
          commission_rate?: number
          dispute_auto_escalation?: boolean
          free_user_listings?: boolean
          id?: number
          kyc_required?: boolean
          maintenance_mode?: boolean
          marketplace_open?: boolean
          mpesa_account_name?: string
          mpesa_auto_approve?: boolean
          mpesa_number?: string
          new_registrations?: boolean
          price_basic_cents?: number
          price_enterprise_cents?: number
          price_pro_cents?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          ai_advisor?: boolean
          assured_delivery?: boolean
          commission_rate?: number
          dispute_auto_escalation?: boolean
          free_user_listings?: boolean
          id?: number
          kyc_required?: boolean
          maintenance_mode?: boolean
          marketplace_open?: boolean
          mpesa_account_name?: string
          mpesa_auto_approve?: boolean
          mpesa_number?: string
          new_registrations?: boolean
          price_basic_cents?: number
          price_enterprise_cents?: number
          price_pro_cents?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_suspended: boolean
          preferred_language: string | null
          suspended_at: string | null
          suspension_reason: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_suspended?: boolean
          preferred_language?: string | null
          suspended_at?: string | null
          suspension_reason?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_suspended?: boolean
          preferred_language?: string | null
          suspended_at?: string | null
          suspension_reason?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sales_records: {
        Row: {
          buyer_email: string | null
          buyer_name: string
          buyer_phone: string
          buyer_type: string
          created_at: string
          delivery_status: string
          id: string
          listing_id: string | null
          notes: string | null
          quantity: string
          sale_date: string
          seller_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          buyer_email?: string | null
          buyer_name: string
          buyer_phone: string
          buyer_type?: string
          created_at?: string
          delivery_status?: string
          id?: string
          listing_id?: string | null
          notes?: string | null
          quantity: string
          sale_date?: string
          seller_id: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          buyer_email?: string | null
          buyer_name?: string
          buyer_phone?: string
          buyer_type?: string
          created_at?: string
          delivery_status?: string
          id?: string
          listing_id?: string | null
          notes?: string | null
          quantity?: string
          sale_date?: string
          seller_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      seller_kyc: {
        Row: {
          address: string | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_name: string | null
          business_name: string | null
          business_type: string | null
          country: string | null
          created_at: string
          full_name: string
          id: string
          id_doc_number: string | null
          id_doc_type: string | null
          notes: string | null
          phone: string | null
          reviewed_at: string | null
          status: string
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          business_name?: string | null
          business_type?: string | null
          country?: string | null
          created_at?: string
          full_name: string
          id?: string
          id_doc_number?: string | null
          id_doc_type?: string | null
          notes?: string | null
          phone?: string | null
          reviewed_at?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          business_name?: string | null
          business_type?: string | null
          country?: string | null
          created_at?: string
          full_name?: string
          id?: string
          id_doc_number?: string | null
          id_doc_type?: string | null
          notes?: string | null
          phone?: string | null
          reviewed_at?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      seller_stripe_accounts: {
        Row: {
          charges_enabled: boolean
          created_at: string
          details_submitted: boolean
          id: string
          payouts_enabled: boolean
          stripe_account_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          charges_enabled?: boolean
          created_at?: string
          details_submitted?: boolean
          id?: string
          payouts_enabled?: boolean
          stripe_account_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          charges_enabled?: boolean
          created_at?: string
          details_submitted?: boolean
          id?: string
          payouts_enabled?: boolean
          stripe_account_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      smart_alerts: {
        Row: {
          batch_id: string | null
          created_at: string
          description: string | null
          farm_id: string
          id: string
          is_read: boolean
          source: string | null
          title: string
          type: string
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          description?: string | null
          farm_id: string
          id?: string
          is_read?: boolean
          source?: string | null
          title: string
          type?: string
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          description?: string | null
          farm_id?: string
          id?: string
          is_read?: boolean
          source?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "smart_alerts_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "fish_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_alerts_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers_cache: {
        Row: {
          mtd_spend_cents: number
          plan: string
          subscribed: boolean
          total_spend_cents: number
          trade_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          mtd_spend_cents?: number
          plan?: string
          subscribed?: boolean
          total_spend_cents?: number
          trade_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          mtd_spend_cents?: number
          plan?: string
          subscribed?: boolean
          total_spend_cents?: number
          trade_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          created_at: string
          id: string
          message: string
          priority: string
          status: string
          subject: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          message: string
          priority?: string
          status?: string
          subject: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          message?: string
          priority?: string
          status?: string
          subject?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          code: string | null
          created_at: string
          email: string
          expires_at: string
          farm_id: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          code?: string | null
          created_at?: string
          email: string
          expires_at?: string
          farm_id: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          code?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          farm_id?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          farm_id: string
          id: string
          invited_by: string | null
          is_active: boolean
          joined_at: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          farm_id: string
          id?: string
          invited_by?: string | null
          is_active?: boolean
          joined_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          farm_id?: string
          id?: string
          invited_by?: string | null
          is_active?: boolean
          joined_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_replies: {
        Row: {
          created_at: string
          id: string
          is_staff: boolean
          message: string
          ticket_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_staff?: boolean
          message: string
          ticket_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_staff?: boolean
          message?: string
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_replies_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
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
          role?: Database["public"]["Enums"]["app_role"]
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
      water_readings: {
        Row: {
          ammonia: number | null
          batch_id: string
          created_at: string
          dissolved_oxygen: number | null
          id: string
          nitrite: number | null
          ph: number | null
          reading_time: string
          salinity: number | null
          temperature: number | null
          turbidity: number | null
        }
        Insert: {
          ammonia?: number | null
          batch_id: string
          created_at?: string
          dissolved_oxygen?: number | null
          id?: string
          nitrite?: number | null
          ph?: number | null
          reading_time?: string
          salinity?: number | null
          temperature?: number | null
          turbidity?: number | null
        }
        Update: {
          ammonia?: number | null
          batch_id?: string
          created_at?: string
          dissolved_oxygen?: number | null
          id?: string
          nitrite?: number | null
          ph?: number | null
          reading_time?: string
          salinity?: number | null
          temperature?: number | null
          turbidity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "water_readings_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "fish_batches"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_batch_farm_member: { Args: { _batch_id: string }; Returns: boolean }
      is_batch_farm_owner: { Args: { _batch_id: string }; Returns: boolean }
      is_farm_member: { Args: { _farm_id: string }; Returns: boolean }
      is_farm_owner: { Args: { _farm_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "owner"
        | "manager"
        | "worker"
        | "super_admin"
        | "moderator"
        | "support_agent"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: [
        "owner",
        "manager",
        "worker",
        "super_admin",
        "moderator",
        "support_agent",
      ],
    },
  },
} as const
