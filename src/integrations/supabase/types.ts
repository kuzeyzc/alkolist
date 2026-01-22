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
      badges: {
        Row: {
          description: string
          icon: string
          id: string
          name: string
          name_en: string
          requirement_type: string
          requirement_value: number
        }
        Insert: {
          description: string
          icon: string
          id?: string
          name: string
          name_en: string
          requirement_type: string
          requirement_value: number
        }
        Update: {
          description?: string
          icon?: string
          id?: string
          name?: string
          name_en?: string
          requirement_type?: string
          requirement_value?: number
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          log_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          log_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          log_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: false
            referencedRelation: "drink_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      drink_logs: {
        Row: {
          after_photo_url: string | null
          before_photo_url: string | null
          category: string
          created_at: string
          drink_name: string | null
          has_recipe: boolean | null
          id: string
          location: string | null
          logged_at: string
          notes: string | null
          photo_url: string | null
          promil_score: number | null
          quantity: number
          recipe_ingredients: string | null
          recipe_instructions: string | null
          user_id: string
          venue_foursquare_id: string | null
          venue_latitude: number | null
          venue_longitude: number | null
          venue_address: string | null
        }
        Insert: {
          after_photo_url?: string | null
          before_photo_url?: string | null
          category: string
          created_at?: string
          drink_name?: string | null
          has_recipe?: boolean | null
          id?: string
          location?: string | null
          logged_at?: string
          notes?: string | null
          photo_url?: string | null
          promil_score?: number | null
          quantity?: number
          recipe_ingredients?: string | null
          recipe_instructions?: string | null
          user_id: string
          venue_foursquare_id?: string | null
          venue_latitude?: number | null
          venue_longitude?: number | null
          venue_address?: string | null
        }
        Update: {
          after_photo_url?: string | null
          before_photo_url?: string | null
          category?: string
          created_at?: string
          drink_name?: string | null
          has_recipe?: boolean | null
          id?: string
          location?: string | null
          logged_at?: string
          notes?: string | null
          photo_url?: string | null
          promil_score?: number | null
          quantity?: number
          recipe_ingredients?: string | null
          recipe_instructions?: string | null
          user_id?: string
          venue_foursquare_id?: string | null
          venue_latitude?: number | null
          venue_longitude?: number | null
          venue_address?: string | null
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          id: string
          log_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          log_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          log_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: false
            referencedRelation: "drink_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string
          created_at: string
          id: string
          is_read: boolean
          type: string
          user_id: string
          metadata: Record<string, any> | null
        }
        Insert: {
          actor_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          type: string
          user_id: string
          metadata?: Record<string, any> | null
        }
        Update: {
          actor_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          type?: string
          user_id?: string
          metadata?: Record<string, any> | null
        }
        Relationships: []
      }
      organization_events: {
        Row: {
          id: string
          organizer_id: string
          event_name: string
          event_type: string
          date: string
          time: string
          description: string | null
          location_id: string | null
          location_name: string
          ticket_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organizer_id: string
          event_name: string
          event_type: string
          date: string
          time: string
          description?: string | null
          location_id?: string | null
          location_name: string
          ticket_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organizer_id?: string
          event_name?: string
          event_type?: string
          date?: string
          time?: string
          description?: string | null
          location_id?: string | null
          location_name?: string
          ticket_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
          username: string
          is_organizer: boolean | null
          organization_name: string | null
          organization_type: string | null
          organization_logo: string | null
          organization_location_id: string | null
          organization_location_name: string | null
          organization_status: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
          username: string
          is_organizer?: boolean | null
          organization_name?: string | null
          organization_type?: string | null
          organization_logo?: string | null
          organization_location_id?: string | null
          organization_location_name?: string | null
          organization_status?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          username?: string
          is_organizer?: boolean | null
          organization_name?: string | null
          organization_type?: string | null
          organization_logo?: string | null
          organization_location_id?: string | null
          organization_location_name?: string | null
          organization_status?: string | null
        }
        Relationships: []
      }
      saved_drinks: {
        Row: {
          created_at: string
          id: string
          log_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          log_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          log_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_drinks_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: false
            referencedRelation: "drink_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_notes: {
        Row: {
          created_at: string
          decoration_type: number
          id: string
          note: string
          venue_name: string
        }
        Insert: {
          created_at?: string
          decoration_type?: number
          id?: string
          note: string
          venue_name: string
        }
        Update: {
          created_at?: string
          decoration_type?: number
          id?: string
          note?: string
          venue_name?: string
        }
        Relationships: []
      }
      venue_note_cheers: {
        Row: {
          created_at: string
          id: string
          note_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_note_cheers_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "venue_notes"
            referencedColumns: ["id"]
          },
        ]
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
