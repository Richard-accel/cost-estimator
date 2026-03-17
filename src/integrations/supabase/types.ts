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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      calculated_averages: {
        Row: {
          age_group: string | null
          calculated_at: string
          comorbidity: string | null
          data_years: string[] | null
          diagnosis_code: string | null
          doctor_id: string | null
          episode_type: string | null
          gender: string | null
          hospital_id: string
          id: string
          p50_breakdown: Json | null
          p50_total: number | null
          p75_breakdown: Json | null
          p75_total: number | null
          procedure_code: string
          sample_size: number | null
          ward_type: string | null
        }
        Insert: {
          age_group?: string | null
          calculated_at?: string
          comorbidity?: string | null
          data_years?: string[] | null
          diagnosis_code?: string | null
          doctor_id?: string | null
          episode_type?: string | null
          gender?: string | null
          hospital_id: string
          id?: string
          p50_breakdown?: Json | null
          p50_total?: number | null
          p75_breakdown?: Json | null
          p75_total?: number | null
          procedure_code: string
          sample_size?: number | null
          ward_type?: string | null
        }
        Update: {
          age_group?: string | null
          calculated_at?: string
          comorbidity?: string | null
          data_years?: string[] | null
          diagnosis_code?: string | null
          doctor_id?: string | null
          episode_type?: string | null
          gender?: string | null
          hospital_id?: string
          id?: string
          p50_breakdown?: Json | null
          p50_total?: number | null
          p75_breakdown?: Json | null
          p75_total?: number | null
          procedure_code?: string
          sample_size?: number | null
          ward_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calculated_averages_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calculated_averages_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          code: string
          created_at: string
          hospital_id: string | null
          id: string
          is_active: boolean
          name: string
          specialty: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          hospital_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          hospital_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          specialty?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctors_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      episode_types: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      historical_bills: {
        Row: {
          age: number | null
          batch_id: string | null
          bill_date: string | null
          breakdown: Json | null
          comorbidity: string | null
          created_at: string
          diagnosis_code: string | null
          doctor_id: string | null
          episode_type: string | null
          gender: string | null
          hospital_id: string
          id: string
          procedure_code: string
          total_bill: number
          ward_type: string | null
          year: number
        }
        Insert: {
          age?: number | null
          batch_id?: string | null
          bill_date?: string | null
          breakdown?: Json | null
          comorbidity?: string | null
          created_at?: string
          diagnosis_code?: string | null
          doctor_id?: string | null
          episode_type?: string | null
          gender?: string | null
          hospital_id: string
          id?: string
          procedure_code: string
          total_bill: number
          ward_type?: string | null
          year: number
        }
        Update: {
          age?: number | null
          batch_id?: string | null
          bill_date?: string | null
          breakdown?: Json | null
          comorbidity?: string | null
          created_at?: string
          diagnosis_code?: string | null
          doctor_id?: string | null
          episode_type?: string | null
          gender?: string | null
          hospital_id?: string
          id?: string
          procedure_code?: string
          total_bill?: number
          ward_type?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "historical_bills_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "ingestion_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historical_bills_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historical_bills_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitals: {
        Row: {
          address: string | null
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          state: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ingestion_batches: {
        Row: {
          created_at: string
          file_name: string
          id: string
          record_count: number | null
          status: string
          upload_date: string
          uploaded_by: string | null
          year: number
        }
        Insert: {
          created_at?: string
          file_name: string
          id?: string
          record_count?: number | null
          status?: string
          upload_date?: string
          uploaded_by?: string | null
          year: number
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: string
          record_count?: number | null
          status?: string
          upload_date?: string
          uploaded_by?: string | null
          year?: number
        }
        Relationships: []
      }
      payor_types: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      procedures: {
        Row: {
          category: string | null
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          doctor_id: string | null
          email: string | null
          full_name: string | null
          hospital_id: string | null
          id: string
        }
        Insert: {
          created_at?: string
          doctor_id?: string | null
          email?: string | null
          full_name?: string | null
          hospital_id?: string | null
          id: string
        }
        Update: {
          created_at?: string
          doctor_id?: string | null
          email?: string | null
          full_name?: string | null
          hospital_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          badge_text: string | null
          created_at: string
          description: string | null
          hospital_id: string | null
          id: string
          image_url: string | null
          includes: string[] | null
          is_active: boolean
          original_price: number | null
          package_price: number
          procedure_code: string | null
          sort_order: number
          title: string
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          badge_text?: string | null
          created_at?: string
          description?: string | null
          hospital_id?: string | null
          id?: string
          image_url?: string | null
          includes?: string[] | null
          is_active?: boolean
          original_price?: number | null
          package_price: number
          procedure_code?: string | null
          sort_order?: number
          title: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          badge_text?: string | null
          created_at?: string
          description?: string | null
          hospital_id?: string | null
          id?: string
          image_url?: string | null
          includes?: string[] | null
          is_active?: boolean
          original_price?: number | null
          package_price?: number
          procedure_code?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promotions_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      specialty_procedure_categories: {
        Row: {
          created_at: string
          id: string
          procedure_category: string
          specialty: string
        }
        Insert: {
          created_at?: string
          id?: string
          procedure_category: string
          specialty: string
        }
        Update: {
          created_at?: string
          id?: string
          procedure_category?: string
          specialty?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      ward_types: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
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
    }
    Enums: {
      app_role: "group" | "hospital" | "doctor" | "admin"
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
      app_role: ["group", "hospital", "doctor", "admin"],
    },
  },
} as const
