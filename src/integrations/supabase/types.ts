export type Json = string | number | boolean | null | {
  [key: string]: Json | undefined
} | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options

  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)

  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }

  public: {
    Tables: {
      order_inquiries: {
        Row: {
          created_at: string

          customer_email: string | null

          customer_name: string

          customer_phone: string

          id: string

          items: Json

          note: string | null

          status: string
        }

        Insert: {
          created_at?: string

          customer_email?: string | null

          customer_name: string

          customer_phone: string

          id?: string

          items: Json

          note?: string | null

          status?: string
        }

        Update: {
          created_at?: string

          customer_email?: string | null

          customer_name?: string

          customer_phone?: string

          id?: string

          items?: Json

          note?: string | null

          status?: string
        }

        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_catalog_settings: {
        Row: {
          image_url: string | null
          image_urls: string[]
          is_visible: boolean
          price: string
          product_id: string
          product_key: string
          revision: number
          sort_order: number
          updated_at: string
          variant_id: string | null
        }
        Insert: {
          image_url?: string | null
          image_urls?: string[]
          is_visible?: boolean
          price: string
          product_id: string
          product_key: string
          revision?: number
          sort_order?: number
          updated_at?: string
          variant_id?: string | null
        }
        Update: {
          image_url?: string | null
          image_urls?: string[]
          is_visible?: boolean
          price?: string
          product_id?: string
          product_key?: string
          revision?: number
          sort_order?: number
          updated_at?: string
          variant_id?: string | null
        }
        Relationships: []
      }
      product_reviews: {
        Row: {
          id: string
          product_id: string
          customer_name: string
          rating: number
          body: string
          is_visible: boolean
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          customer_name: string
          rating: number
          body: string
          is_visible?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          customer_name?: string
          rating?: number
          body?: string
          is_visible?: boolean
          created_at?: string
        }
        Relationships: []
      }
      site_content: {
        Row: { content_key: string; published_value: string; is_visible: boolean; revision: number; published_at: string; published_by: string | null }
        Insert: { content_key: string; published_value?: string; is_visible?: boolean; revision?: number; published_at?: string; published_by?: string | null }
        Update: { content_key?: string; published_value?: string; is_visible?: boolean; revision?: number; published_at?: string; published_by?: string | null }
        Relationships: []
      }
      site_content_drafts: {
        Row: { content_key: string; draft_value: string; is_visible: boolean; updated_at: string; updated_by: string | null }
        Insert: { content_key: string; draft_value?: string; is_visible?: boolean; updated_at?: string; updated_by?: string | null }
        Update: { content_key?: string; draft_value?: string; is_visible?: boolean; updated_at?: string; updated_by?: string | null }
        Relationships: []
      }
      site_content_revisions: {
        Row: { id: number; content_key: string; value: string; is_visible: boolean; revision: number; created_at: string; created_by: string | null }
        Insert: { id?: number; content_key: string; value: string; is_visible: boolean; revision: number; created_at?: string; created_by?: string | null }
        Update: { id?: number; content_key?: string; value?: string; is_visible?: boolean; revision?: number; created_at?: string; created_by?: string | null }
        Relationships: []
      }
      ar_experiences: {
        Row: { product_id: string; enabled: boolean; target_url: string | null; model_url: string | null; scale: number; offset_x: number; offset_y: number; offset_z: number; rotation_x: number; rotation_y: number; rotation_z: number; updated_at: string }
        Insert: { product_id: string; enabled?: boolean; target_url?: string | null; model_url?: string | null; scale?: number; offset_x?: number; offset_y?: number; offset_z?: number; rotation_x?: number; rotation_y?: number; rotation_z?: number; updated_at?: string }
        Update: { product_id?: string; enabled?: boolean; target_url?: string | null; model_url?: string | null; scale?: number; offset_x?: number; offset_y?: number; offset_z?: number; rotation_x?: number; rotation_y?: number; rotation_z?: number; updated_at?: string }
        Relationships: []
      }
    }

    Views: {
      site_content_public: {
        Row: { content_key: string | null; published_value: string | null; is_visible: boolean | null; revision: number | null; published_at: string | null }
        Relationships: []
      }
    }

    Functions: {
      publish_all_site_content: { Args: Record<PropertyKey, never>; Returns: number }
      restore_site_content_revision: { Args: { target_key: string; target_revision: number }; Returns: boolean }
    }

    Enums: { [_ in never]: never }

    CompositeTypes: { [_ in never]: never }
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
    Enums: {},
  },
} as const
