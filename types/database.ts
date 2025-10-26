export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      answers: {
        Row: {
          clarity_tag: string | null;
          created_at: string | null;
          duration_seconds: number | null;
          extension_used: boolean | null;
          honesty_flag: boolean | null;
          id: string;
          impact_tag: string | null;
          question_id: string;
          retake_used: boolean | null;
          session_id: string;
          specificity_tag: string | null;
          star_action_score: number | null;
          star_result_score: number | null;
          star_situation_score: number | null;
          star_task_score: number | null;
          transcript_text: string;
        };
        Insert: {
          clarity_tag?: string | null;
          created_at?: string | null;
          duration_seconds?: number | null;
          extension_used?: boolean | null;
          honesty_flag?: boolean | null;
          id?: string;
          impact_tag?: string | null;
          question_id: string;
          retake_used?: boolean | null;
          session_id: string;
          specificity_tag?: string | null;
          star_action_score?: number | null;
          star_result_score?: number | null;
          star_situation_score?: number | null;
          star_task_score?: number | null;
          transcript_text: string;
        };
        Update: {
          clarity_tag?: string | null;
          created_at?: string | null;
          duration_seconds?: number | null;
          extension_used?: boolean | null;
          honesty_flag?: boolean | null;
          id?: string;
          impact_tag?: string | null;
          question_id?: string;
          retake_used?: boolean | null;
          session_id?: string;
          specificity_tag?: string | null;
          star_action_score?: number | null;
          star_result_score?: number | null;
          star_situation_score?: number | null;
          star_task_score?: number | null;
          transcript_text?: string;
        };
        Relationships: [
          {
            foreignKeyName: "answers_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: true;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "answers_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action_type: string;
          admin_user_id: string | null;
          created_at: string | null;
          details: Json | null;
          id: string;
          resource_id: string | null;
          resource_type: string | null;
        };
        Insert: {
          action_type: string;
          admin_user_id?: string | null;
          created_at?: string | null;
          details?: Json | null;
          id?: string;
          resource_id?: string | null;
          resource_type?: string | null;
        };
        Update: {
          action_type?: string;
          admin_user_id?: string | null;
          created_at?: string | null;
          details?: Json | null;
          id?: string;
          resource_id?: string | null;
          resource_type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_admin_user_id_fkey";
            columns: ["admin_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      consents: {
        Row: {
          created_at: string | null;
          id: string;
          ip_address: unknown | null;
          privacy_version: string;
          terms_version: string;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          ip_address?: unknown | null;
          privacy_version: string;
          terms_version: string;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          ip_address?: unknown | null;
          privacy_version?: string;
          terms_version?: string;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "consents_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      cost_tracking: {
        Row: {
          audio_seconds: number | null;
          created_at: string | null;
          estimated_cost_usd: number;
          id: string;
          model: string;
          period_end: string;
          period_start: string;
          tokens_used: number | null;
        };
        Insert: {
          audio_seconds?: number | null;
          created_at?: string | null;
          estimated_cost_usd: number;
          id?: string;
          model: string;
          period_end: string;
          period_start: string;
          tokens_used?: number | null;
        };
        Update: {
          audio_seconds?: number | null;
          created_at?: string | null;
          estimated_cost_usd?: number;
          id?: string;
          model?: string;
          period_end?: string;
          period_start?: string;
          tokens_used?: number | null;
        };
        Relationships: [];
      };
      events: {
        Row: {
          created_at: string | null;
          event_type: string;
          id: string;
          payload: Json | null;
          session_id: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          event_type: string;
          id?: string;
          payload?: Json | null;
          session_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          event_type?: string;
          id?: string;
          payload?: Json | null;
          session_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "events_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      jobs: {
        Row: {
          active: boolean | null;
          company: string;
          curated_at: string | null;
          id: string;
          location: string | null;
          must_have_skills: string[] | null;
          posting_url: string;
          seniority_level: string;
          skills: string[];
          source: string;
          title: string;
        };
        Insert: {
          active?: boolean | null;
          company: string;
          curated_at?: string | null;
          id?: string;
          location?: string | null;
          must_have_skills?: string[] | null;
          posting_url: string;
          seniority_level: string;
          skills: string[];
          source: string;
          title: string;
        };
        Update: {
          active?: boolean | null;
          company?: string;
          curated_at?: string | null;
          id?: string;
          location?: string | null;
          must_have_skills?: string[] | null;
          posting_url?: string;
          seniority_level?: string;
          skills?: string[];
          source?: string;
          title?: string;
        };
        Relationships: [];
      };
      matches: {
        Row: {
          created_at: string | null;
          hard_skills_score: number | null;
          id: string;
          job_id: string;
          logistics_score: number | null;
          match_reasons: string[] | null;
          match_score: number;
          notified_at: string | null;
          recruiting_alert_sent: boolean | null;
          seniority_score: number | null;
          soft_skills_score: number | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          hard_skills_score?: number | null;
          id?: string;
          job_id: string;
          logistics_score?: number | null;
          match_reasons?: string[] | null;
          match_score: number;
          notified_at?: string | null;
          recruiting_alert_sent?: boolean | null;
          seniority_score?: number | null;
          soft_skills_score?: number | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          hard_skills_score?: number | null;
          id?: string;
          job_id?: string;
          logistics_score?: number | null;
          match_reasons?: string[] | null;
          match_score?: number;
          notified_at?: string | null;
          recruiting_alert_sent?: boolean | null;
          seniority_score?: number | null;
          soft_skills_score?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "matches_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string | null;
          id: string;
          resume_file_size_bytes: number | null;
          resume_filename: string | null;
          resume_storage_path: string | null;
          resume_uploaded_at: string | null;
          seniority_level: string | null;
          target_roles: string[] | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          resume_file_size_bytes?: number | null;
          resume_filename?: string | null;
          resume_storage_path?: string | null;
          resume_uploaded_at?: string | null;
          seniority_level?: string | null;
          target_roles?: string[] | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          resume_file_size_bytes?: number | null;
          resume_filename?: string | null;
          resume_storage_path?: string | null;
          resume_uploaded_at?: string | null;
          seniority_level?: string | null;
          target_roles?: string[] | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      questions: {
        Row: {
          category: string;
          created_at: string | null;
          follow_up_question: string | null;
          follow_up_used: boolean | null;
          id: string;
          is_gentle: boolean | null;
          is_tailored: boolean;
          question_order: number;
          question_text: string;
          session_id: string;
        };
        Insert: {
          category: string;
          created_at?: string | null;
          follow_up_question?: string | null;
          follow_up_used?: boolean | null;
          id?: string;
          is_gentle?: boolean | null;
          is_tailored: boolean;
          question_order: number;
          question_text: string;
          session_id: string;
        };
        Update: {
          category?: string;
          created_at?: string | null;
          follow_up_question?: string | null;
          follow_up_used?: boolean | null;
          id?: string;
          is_gentle?: boolean | null;
          is_tailored?: boolean;
          question_order?: number;
          question_text?: string;
          session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "questions_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      reports: {
        Row: {
          clarifications: Json;
          created_at: string | null;
          id: string;
          pdf_generated_at: string | null;
          pdf_storage_path: string | null;
          per_question_feedback: Json;
          session_id: string;
          strengths: Json;
        };
        Insert: {
          clarifications: Json;
          created_at?: string | null;
          id?: string;
          pdf_generated_at?: string | null;
          pdf_storage_path?: string | null;
          per_question_feedback: Json;
          session_id: string;
          strengths: Json;
        };
        Update: {
          clarifications?: Json;
          created_at?: string | null;
          id?: string;
          pdf_generated_at?: string | null;
          pdf_storage_path?: string | null;
          per_question_feedback?: Json;
          session_id?: string;
          strengths?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "reports_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: true;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      sessions: {
        Row: {
          avg_star_score: number | null;
          completed_at: string | null;
          completion_rate: number | null;
          created_at: string | null;
          draft_save: Json | null;
          id: string;
          job_description_text: string | null;
          low_anxiety_enabled: boolean | null;
          mode: string;
          per_question_coaching: boolean | null;
          question_count: number;
          started_at: string | null;
          target_role_override: string | null;
          user_id: string | null;
        };
        Insert: {
          avg_star_score?: number | null;
          completed_at?: string | null;
          completion_rate?: number | null;
          created_at?: string | null;
          draft_save?: Json | null;
          id?: string;
          job_description_text?: string | null;
          low_anxiety_enabled?: boolean | null;
          mode: string;
          per_question_coaching?: boolean | null;
          question_count: number;
          started_at?: string | null;
          target_role_override?: string | null;
          user_id?: string | null;
        };
        Update: {
          avg_star_score?: number | null;
          completed_at?: string | null;
          completion_rate?: number | null;
          created_at?: string | null;
          draft_save?: Json | null;
          id?: string;
          job_description_text?: string | null;
          low_anxiety_enabled?: boolean | null;
          mode?: string;
          per_question_coaching?: boolean | null;
          question_count?: number;
          started_at?: string | null;
          target_role_override?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      system_config: {
        Row: {
          key: string;
          updated_at: string | null;
          value: string;
        };
        Insert: {
          key: string;
          updated_at?: string | null;
          value: string;
        };
        Update: {
          key?: string;
          updated_at?: string | null;
          value?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          auth_provider: string;
          comp_range_max: number | null;
          comp_range_min: number | null;
          created_at: string | null;
          digest_confirmed: boolean | null;
          digest_opt_in: boolean | null;
          eligibility_confirmed: boolean | null;
          email: string;
          id: string;
          location: string | null;
          recruiter_access_granted: boolean | null;
          remote_preference: string | null;
          updated_at: string | null;
          work_auth_status: string | null;
        };
        Insert: {
          auth_provider: string;
          comp_range_max?: number | null;
          comp_range_min?: number | null;
          created_at?: string | null;
          digest_confirmed?: boolean | null;
          digest_opt_in?: boolean | null;
          eligibility_confirmed?: boolean | null;
          email: string;
          id?: string;
          location?: string | null;
          recruiter_access_granted?: boolean | null;
          remote_preference?: string | null;
          updated_at?: string | null;
          work_auth_status?: string | null;
        };
        Update: {
          auth_provider?: string;
          comp_range_max?: number | null;
          comp_range_min?: number | null;
          created_at?: string | null;
          digest_confirmed?: boolean | null;
          digest_opt_in?: boolean | null;
          eligibility_confirmed?: boolean | null;
          email?: string;
          id?: string;
          location?: string | null;
          recruiter_access_granted?: boolean | null;
          remote_preference?: string | null;
          updated_at?: string | null;
          work_auth_status?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_current_month_cost: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      get_monthly_cost_threshold: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      has_reached_cost_threshold: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_audio_mode_enabled: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_recruiter: {
        Args: { check_user_id: string };
        Returns: boolean;
      };
      session_meets_recruiter_threshold: {
        Args: { check_session_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
