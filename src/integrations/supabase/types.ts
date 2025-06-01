export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      celebrity_picks: {
        Row: {
          celebrity_name: string
          created_at: string | null
          game_year: number | null
          id: string
          is_hit: boolean | null
          points_awarded: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          celebrity_name: string
          created_at?: string | null
          game_year?: number | null
          id?: string
          is_hit?: boolean | null
          points_awarded?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          celebrity_name?: string
          created_at?: string | null
          game_year?: number | null
          id?: string
          is_hit?: boolean | null
          points_awarded?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      deceased_celebrities: {
        Row: {
          age_at_death: number
          approved_at: string | null
          approved_by_admin_id: string | null
          canonical_name: string
          cause_of_death_category: string | null
          cause_of_death_details: string | null
          celebrity_description: string | null
          created_at: string | null
          date_of_birth: string | null
          date_of_death: string
          died_during_public_event: boolean | null
          died_in_extreme_sport: boolean | null
          died_on_birthday: boolean | null
          died_on_major_holiday: boolean | null
          entered_by_admin_id: string | null
          game_year: number | null
          id: string
          is_approved: boolean | null
          is_first_death_of_year: boolean | null
          is_last_death_of_year: boolean | null
          source_url: string | null
          updated_at: string | null
        }
        Insert: {
          age_at_death: number
          approved_at?: string | null
          approved_by_admin_id?: string | null
          canonical_name: string
          cause_of_death_category?: string | null
          cause_of_death_details?: string | null
          celebrity_description?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          date_of_death: string
          died_during_public_event?: boolean | null
          died_in_extreme_sport?: boolean | null
          died_on_birthday?: boolean | null
          died_on_major_holiday?: boolean | null
          entered_by_admin_id?: string | null
          game_year?: number | null
          id?: string
          is_approved?: boolean | null
          is_first_death_of_year?: boolean | null
          is_last_death_of_year?: boolean | null
          source_url?: string | null
          updated_at?: string | null
        }
        Update: {
          age_at_death?: number
          approved_at?: string | null
          approved_by_admin_id?: string | null
          canonical_name?: string
          cause_of_death_category?: string | null
          cause_of_death_details?: string | null
          celebrity_description?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          date_of_death?: string
          died_during_public_event?: boolean | null
          died_in_extreme_sport?: boolean | null
          died_on_birthday?: boolean | null
          died_on_major_holiday?: boolean | null
          entered_by_admin_id?: string | null
          game_year?: number | null
          id?: string
          is_approved?: boolean | null
          is_first_death_of_year?: boolean | null
          is_last_death_of_year?: boolean | null
          source_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deceased_celebrities_approved_by_admin_id_fkey"
            columns: ["approved_by_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fetch_logs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          deaths_added: number | null
          deaths_found: number | null
          error_message: string | null
          id: string
          picks_scored: number | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          deaths_added?: number | null
          deaths_found?: number | null
          error_message?: string | null
          id?: string
          picks_scored?: number | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          deaths_added?: number | null
          deaths_found?: number | null
          error_message?: string | null
          id?: string
          picks_scored?: number | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_admin: boolean | null
          total_score: number | null
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          is_admin?: boolean | null
          total_score?: number | null
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_admin?: boolean | null
          total_score?: number | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      rss_feeds: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
