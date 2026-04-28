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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
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
      team_invitations: {
        Row: {
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
      is_batch_farm_owner: { Args: { _batch_id: string }; Returns: boolean }
      is_farm_owner: { Args: { _farm_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "owner" | "manager" | "worker"
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
      app_role: ["owner", "manager", "worker"],
    },
  },
} as const
