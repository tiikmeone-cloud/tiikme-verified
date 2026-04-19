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
      academy_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          module_id: string
          score: number | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          module_id: string
          score?: number | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          module_id?: string
          score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      achievements: {
        Row: {
          achievement_date: string | null
          certificate_file_url: string | null
          certificate_url: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          icon_emoji: string | null
          id: string
          is_shared_to_feed: boolean | null
          issued_by: string | null
          issuing_body_recognized: boolean | null
          source_admin_name: string | null
          source_type: string | null
          source_workspace_id: string | null
          source_workspace_name: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
          verification_url: string | null
          visibility: string | null
        }
        Insert: {
          achievement_date?: string | null
          certificate_file_url?: string | null
          certificate_url?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon_emoji?: string | null
          id?: string
          is_shared_to_feed?: boolean | null
          issued_by?: string | null
          issuing_body_recognized?: boolean | null
          source_admin_name?: string | null
          source_type?: string | null
          source_workspace_id?: string | null
          source_workspace_name?: string | null
          title: string
          type?: string
          updated_at?: string | null
          user_id: string
          verification_url?: string | null
          visibility?: string | null
        }
        Update: {
          achievement_date?: string | null
          certificate_file_url?: string | null
          certificate_url?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon_emoji?: string | null
          id?: string
          is_shared_to_feed?: boolean | null
          issued_by?: string | null
          issuing_body_recognized?: boolean | null
          source_admin_name?: string | null
          source_type?: string | null
          source_workspace_id?: string | null
          source_workspace_name?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
          verification_url?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "achievements_source_workspace_id_fkey"
            columns: ["source_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          action_url: string | null
          body: string | null
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          title: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          body?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          title?: string | null
          type?: string
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          body?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          title?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_attempts: {
        Row: {
          answers: Json | null
          assessment_id: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          passed: boolean | null
          score: number | null
          user_id: string | null
        }
        Insert: {
          answers?: Json | null
          assessment_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          passed?: boolean | null
          score?: number | null
          user_id?: string | null
        }
        Update: {
          answers?: Json | null
          assessment_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          passed?: boolean | null
          score?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_attempts_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "hiring_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_url: string | null
          created_at: string | null
          description: string | null
          expiry_date: string | null
          id: string
          is_verified: boolean | null
          issued_by: string | null
          issued_date: string | null
          issued_to: string | null
          org_id: string | null
          title: string
        }
        Insert: {
          certificate_url?: string | null
          created_at?: string | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          is_verified?: boolean | null
          issued_by?: string | null
          issued_date?: string | null
          issued_to?: string | null
          org_id?: string | null
          title: string
        }
        Update: {
          certificate_url?: string | null
          created_at?: string | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          is_verified?: boolean | null
          issued_by?: string | null
          issued_date?: string | null
          issued_to?: string | null
          org_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_issued_to_fkey"
            columns: ["issued_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_members: {
        Row: {
          circle_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          circle_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          circle_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_members_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_post_upvotes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_post_upvotes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "circle_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_posts: {
        Row: {
          author_id: string
          body: string | null
          circle_id: string
          comment_count: number
          content: string | null
          created_at: string
          hot_score: number
          id: string
          is_flagged: boolean
          is_pinned: boolean
          link_url: string | null
          poll_ends_at: string | null
          poll_options: Json | null
          poll_votes: Json | null
          post_type: string
          reply_count: number
          signtype: string
          title: string | null
          updated_at: string
          upvote_count: number
        }
        Insert: {
          author_id: string
          body?: string | null
          circle_id: string
          comment_count?: number
          content?: string | null
          created_at?: string
          hot_score?: number
          id?: string
          is_flagged?: boolean
          is_pinned?: boolean
          link_url?: string | null
          poll_ends_at?: string | null
          poll_options?: Json | null
          poll_votes?: Json | null
          post_type?: string
          reply_count?: number
          signtype?: string
          title?: string | null
          updated_at?: string
          upvote_count?: number
        }
        Update: {
          author_id?: string
          body?: string | null
          circle_id?: string
          comment_count?: number
          content?: string | null
          created_at?: string
          hot_score?: number
          id?: string
          is_flagged?: boolean
          is_pinned?: boolean
          link_url?: string | null
          poll_ends_at?: string | null
          poll_options?: Json | null
          poll_votes?: Json | null
          post_type?: string
          reply_count?: number
          signtype?: string
          title?: string | null
          updated_at?: string
          upvote_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "circle_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circle_posts_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
        ]
      }
      circles: {
        Row: {
          active_7d: number
          created_at: string
          created_by: string | null
          description: string | null
          icon_url: string | null
          id: string
          is_unlocked: boolean
          member_count: number
          name: string
          post_count: number
          slug: string
          type: string
          updated_at: string
          visibility: string
        }
        Insert: {
          active_7d?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_unlocked?: boolean
          member_count?: number
          name: string
          post_count?: number
          slug: string
          type?: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          active_7d?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_unlocked?: boolean
          member_count?: number
          name?: string
          post_count?: number
          slug?: string
          type?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      comment_reactions: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          reaction_type?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          last_message_at: string | null
          participant_1: string | null
          participant_2: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_message_at?: string | null
          participant_1?: string | null
          participant_2?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_message_at?: string | null
          participant_1?: string | null
          participant_2?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_participant_1_fkey"
            columns: ["participant_1"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_2_fkey"
            columns: ["participant_2"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hiring_assessments: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          job_id: string | null
          org_id: string | null
          pass_score: number | null
          questions: Json | null
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          job_id?: string | null
          org_id?: string | null
          pass_score?: number | null
          questions?: Json | null
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          job_id?: string | null
          org_id?: string | null
          pass_score?: number | null
          questions?: Json | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "hiring_assessments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hiring_assessments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          address_line1: string | null
          city: string | null
          claimed_by: string | null
          created_at: string | null
          district: string | null
          founded_year: number | null
          head_profile_id: string | null
          id: string
          is_claimed: boolean | null
          is_verified: boolean | null
          member_count: number | null
          name: string
          official_email: string | null
          official_id_type: string | null
          official_id_value: string | null
          official_website: string | null
          parent_institution_id: string | null
          phone: string | null
          pincode: string | null
          state: string | null
          type: string | null
        }
        Insert: {
          address_line1?: string | null
          city?: string | null
          claimed_by?: string | null
          created_at?: string | null
          district?: string | null
          founded_year?: number | null
          head_profile_id?: string | null
          id?: string
          is_claimed?: boolean | null
          is_verified?: boolean | null
          member_count?: number | null
          name: string
          official_email?: string | null
          official_id_type?: string | null
          official_id_value?: string | null
          official_website?: string | null
          parent_institution_id?: string | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          type?: string | null
        }
        Update: {
          address_line1?: string | null
          city?: string | null
          claimed_by?: string | null
          created_at?: string | null
          district?: string | null
          founded_year?: number | null
          head_profile_id?: string | null
          id?: string
          is_claimed?: boolean | null
          is_verified?: boolean | null
          member_count?: number | null
          name?: string
          official_email?: string | null
          official_id_type?: string | null
          official_id_value?: string | null
          official_website?: string | null
          parent_institution_id?: string | null
          phone?: string | null
          pincode?: string | null
          state?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "institutions_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institutions_head_profile_id_fkey"
            columns: ["head_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institutions_parent_institution_id_fkey"
            columns: ["parent_institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institutions_parent_institution_id_fkey"
            columns: ["parent_institution_id"]
            isOneToOne: false
            referencedRelation: "institutions_public"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_interests: {
        Row: {
          created_at: string | null
          id: string
          interest_type: string | null
          investor_id: string | null
          message: string | null
          startup_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          interest_type?: string | null
          investor_id?: string | null
          message?: string | null
          startup_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          interest_type?: string | null
          investor_id?: string | null
          message?: string | null
          startup_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investor_interests_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_interests_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startup_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      item_verification_requests: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          org_id: string | null
          requester_id: string
          status: string | null
          verifier_email: string | null
          verifier_id: string | null
          work_item_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          org_id?: string | null
          requester_id: string
          status?: string | null
          verifier_email?: string | null
          verifier_id?: string | null
          work_item_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          org_id?: string | null
          requester_id?: string
          status?: string | null
          verifier_email?: string | null
          verifier_id?: string | null
          work_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_verification_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_verification_requests_verifier_id_fkey"
            columns: ["verifier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_verification_requests_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string | null
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          title: string | null
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          body?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          title?: string | null
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          body?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          title?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      open_to_work_profiles: {
        Row: {
          created_at: string
          desired_title: string | null
          id: string
          is_active: boolean
          location_type: string | null
          pitch: string | null
          preferred_location: string | null
          role_types: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          desired_title?: string | null
          id?: string
          is_active?: boolean
          location_type?: string | null
          pitch?: string | null
          preferred_location?: string | null
          role_types?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          desired_title?: string | null
          id?: string
          is_active?: boolean
          location_type?: string | null
          pitch?: string | null
          preferred_location?: string | null
          role_types?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          activity_score_min: number | null
          applications_count: number | null
          ask_portfolio: boolean | null
          assessment_id: string | null
          budget_max: number | null
          budget_min: number | null
          can_convert_fulltime: boolean | null
          company_id: string | null
          compensation: string | null
          created_at: string | null
          custom_attachment_label: string | null
          deadline: string | null
          description: string | null
          documents_to_bring: string[] | null
          domain: string | null
          duration_months: number | null
          end_date: string | null
          event_date: string | null
          event_mode: string | null
          event_time: string | null
          experience_min: number | null
          expires_at: string | null
          hr_contact_id: string | null
          id: string
          is_cross_domain: boolean | null
          is_expired: boolean | null
          is_open: boolean | null
          is_remote: boolean | null
          location: string | null
          org_id: string | null
          positions_available: number | null
          poster_id: string | null
          pricing_model: string | null
          prize_pool: string | null
          project_duration: string | null
          qualification_criteria: Json | null
          registration_deadline: string | null
          require_resume: boolean | null
          responses_count: number | null
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          screening_questions: Json | null
          skills_required: string[] | null
          start_date: string | null
          status: string | null
          stipend: string | null
          team_size_max: number | null
          team_size_min: number | null
          themes: string[] | null
          title: string
          type: string | null
          venue: string | null
        }
        Insert: {
          activity_score_min?: number | null
          applications_count?: number | null
          ask_portfolio?: boolean | null
          assessment_id?: string | null
          budget_max?: number | null
          budget_min?: number | null
          can_convert_fulltime?: boolean | null
          company_id?: string | null
          compensation?: string | null
          created_at?: string | null
          custom_attachment_label?: string | null
          deadline?: string | null
          description?: string | null
          documents_to_bring?: string[] | null
          domain?: string | null
          duration_months?: number | null
          end_date?: string | null
          event_date?: string | null
          event_mode?: string | null
          event_time?: string | null
          experience_min?: number | null
          expires_at?: string | null
          hr_contact_id?: string | null
          id?: string
          is_cross_domain?: boolean | null
          is_expired?: boolean | null
          is_open?: boolean | null
          is_remote?: boolean | null
          location?: string | null
          org_id?: string | null
          positions_available?: number | null
          poster_id?: string | null
          pricing_model?: string | null
          prize_pool?: string | null
          project_duration?: string | null
          qualification_criteria?: Json | null
          registration_deadline?: string | null
          require_resume?: boolean | null
          responses_count?: number | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          screening_questions?: Json | null
          skills_required?: string[] | null
          start_date?: string | null
          status?: string | null
          stipend?: string | null
          team_size_max?: number | null
          team_size_min?: number | null
          themes?: string[] | null
          title: string
          type?: string | null
          venue?: string | null
        }
        Update: {
          activity_score_min?: number | null
          applications_count?: number | null
          ask_portfolio?: boolean | null
          assessment_id?: string | null
          budget_max?: number | null
          budget_min?: number | null
          can_convert_fulltime?: boolean | null
          company_id?: string | null
          compensation?: string | null
          created_at?: string | null
          custom_attachment_label?: string | null
          deadline?: string | null
          description?: string | null
          documents_to_bring?: string[] | null
          domain?: string | null
          duration_months?: number | null
          end_date?: string | null
          event_date?: string | null
          event_mode?: string | null
          event_time?: string | null
          experience_min?: number | null
          expires_at?: string | null
          hr_contact_id?: string | null
          id?: string
          is_cross_domain?: boolean | null
          is_expired?: boolean | null
          is_open?: boolean | null
          is_remote?: boolean | null
          location?: string | null
          org_id?: string | null
          positions_available?: number | null
          poster_id?: string | null
          pricing_model?: string | null
          prize_pool?: string | null
          project_duration?: string | null
          qualification_criteria?: Json | null
          registration_deadline?: string | null
          require_resume?: boolean | null
          responses_count?: number | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          screening_questions?: Json | null
          skills_required?: string[] | null
          start_date?: string | null
          status?: string | null
          stipend?: string | null
          team_size_max?: number | null
          team_size_min?: number | null
          themes?: string[] | null
          title?: string
          type?: string | null
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "hiring_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "institutions_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_poster_id_fkey"
            columns: ["poster_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_applications: {
        Row: {
          applicant_id: string
          assessment_passed: boolean | null
          assessment_score: number | null
          cover_letter: string | null
          cover_note: string | null
          created_at: string | null
          custom_answers: Json | null
          id: string
          is_qualified: boolean | null
          joined_confirmed: boolean | null
          message: string | null
          offer_accepted: boolean | null
          opportunity_id: string
          portfolio_url: string | null
          recruiter_notes: string | null
          resume_url: string | null
          selected_at: string | null
          status: string | null
          why_good_fit: string | null
          work_items_attached: string[] | null
        }
        Insert: {
          applicant_id: string
          assessment_passed?: boolean | null
          assessment_score?: number | null
          cover_letter?: string | null
          cover_note?: string | null
          created_at?: string | null
          custom_answers?: Json | null
          id?: string
          is_qualified?: boolean | null
          joined_confirmed?: boolean | null
          message?: string | null
          offer_accepted?: boolean | null
          opportunity_id: string
          portfolio_url?: string | null
          recruiter_notes?: string | null
          resume_url?: string | null
          selected_at?: string | null
          status?: string | null
          why_good_fit?: string | null
          work_items_attached?: string[] | null
        }
        Update: {
          applicant_id?: string
          assessment_passed?: boolean | null
          assessment_score?: number | null
          cover_letter?: string | null
          cover_note?: string | null
          created_at?: string | null
          custom_answers?: Json | null
          id?: string
          is_qualified?: boolean | null
          joined_confirmed?: boolean | null
          message?: string | null
          offer_accepted?: boolean | null
          opportunity_id?: string
          portfolio_url?: string | null
          recruiter_notes?: string | null
          resume_url?: string | null
          selected_at?: string | null
          status?: string | null
          why_good_fit?: string | null
          work_items_attached?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_applications_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          opportunity_id: string
          parent_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          opportunity_id: string
          parent_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          opportunity_id?: string
          parent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_comments_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "opportunity_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_likes: {
        Row: {
          created_at: string
          id: string
          opportunity_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          opportunity_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          opportunity_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_likes_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_reactions: {
        Row: {
          created_at: string | null
          id: string
          opportunity_id: string | null
          reaction_type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          opportunity_id?: string | null
          reaction_type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          opportunity_id?: string | null
          reaction_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_reactions_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_referrals: {
        Row: {
          created_at: string
          id: string
          opportunity_id: string
          referred_user_id: string
          referrer_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          opportunity_id: string
          referred_user_id: string
          referrer_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          opportunity_id?: string
          referred_user_id?: string
          referrer_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_referrals_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      org_access_rules: {
        Row: {
          access_scope: string | null
          access_type: string
          created_at: string | null
          created_by: string | null
          delegated_by: string | null
          delegation_approved: boolean | null
          department_scope: string | null
          id: string
          member_id: string | null
          org_id: string | null
        }
        Insert: {
          access_scope?: string | null
          access_type: string
          created_at?: string | null
          created_by?: string | null
          delegated_by?: string | null
          delegation_approved?: boolean | null
          department_scope?: string | null
          id?: string
          member_id?: string | null
          org_id?: string | null
        }
        Update: {
          access_scope?: string | null
          access_type?: string
          created_at?: string | null
          created_by?: string | null
          delegated_by?: string | null
          delegation_approved?: boolean | null
          department_scope?: string | null
          id?: string
          member_id?: string | null
          org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_access_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_access_rules_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_access_rules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_contacts: {
        Row: {
          address: string | null
          city: string | null
          email: string | null
          id: string
          is_primary: boolean | null
          label: string | null
          org_id: string
          phone: string | null
          pincode: string | null
          state: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          label?: string | null
          org_id: string
          phone?: string | null
          pincode?: string | null
          state?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          label?: string | null
          org_id?: string
          phone?: string | null
          pincode?: string | null
          state?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_contacts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_followers: {
        Row: {
          followed_at: string | null
          id: string
          org_id: string
          user_id: string
        }
        Insert: {
          followed_at?: string | null
          id?: string
          org_id: string
          user_id: string
        }
        Update: {
          followed_at?: string | null
          id?: string
          org_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_followers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_followers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      org_members: {
        Row: {
          approval_status: string | null
          approved_by: string | null
          department: string | null
          granted_by: string | null
          id: string
          is_current: boolean | null
          is_verified: boolean | null
          joined_at: string | null
          org_id: string
          permissions: Json | null
          role: string | null
          title: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          approval_status?: string | null
          approved_by?: string | null
          department?: string | null
          granted_by?: string | null
          id?: string
          is_current?: boolean | null
          is_verified?: boolean | null
          joined_at?: string | null
          org_id: string
          permissions?: Json | null
          role?: string | null
          title?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          approval_status?: string | null
          approved_by?: string | null
          department?: string | null
          granted_by?: string | null
          id?: string
          is_current?: boolean | null
          is_verified?: boolean | null
          joined_at?: string | null
          org_id?: string
          permissions?: Json | null
          role?: string | null
          title?: string | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      org_metadata: {
        Row: {
          id: string
          key: string
          org_id: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          org_id: string
          value: string
        }
        Update: {
          id?: string
          key?: string
          org_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_metadata_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_subscriptions: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          current_period_end: string | null
          current_period_start: string | null
          discount_months_remaining: number | null
          id: string
          org_id: string | null
          plan: string
          profile_id: string | null
          status: string
          trial_ends_at: string | null
          trial_started_at: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          discount_months_remaining?: number | null
          id?: string
          org_id?: string | null
          plan?: string
          profile_id?: string | null
          status?: string
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          discount_months_remaining?: number | null
          id?: string
          org_id?: string | null
          plan?: string
          profile_id?: string | null
          status?: string
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      org_verif_requests: {
        Row: {
          created_at: string | null
          id: string
          member_type: string | null
          message: string | null
          org_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          title_at_org: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          member_type?: string | null
          message?: string | null
          org_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          title_at_org?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          member_type?: string | null
          message?: string | null
          org_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          title_at_org?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_verif_requests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_verif_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_verif_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      org_verif_routes: {
        Row: {
          assigned_to_user_id: string | null
          condition_type: string | null
          condition_value: string | null
          created_at: string | null
          id: string
          org_id: string | null
        }
        Insert: {
          assigned_to_user_id?: string | null
          condition_type?: string | null
          condition_value?: string | null
          created_at?: string | null
          id?: string
          org_id?: string | null
        }
        Update: {
          assigned_to_user_id?: string | null
          condition_type?: string | null
          condition_value?: string | null
          created_at?: string | null
          id?: string
          org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_verif_routes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          allow_employee_requests: boolean | null
          allow_messages: boolean | null
          city: string | null
          country: string | null
          cover_url: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          district: string | null
          email: string | null
          email_domain: string | null
          employee_count: string | null
          followers_count: number | null
          founded_year: number | null
          full_address: string | null
          id: string
          is_verified: boolean | null
          logo_url: string | null
          maps_url: string | null
          name: string
          phone: string | null
          pincode: string | null
          pings_enabled: boolean | null
          pings_visibility: string | null
          slug: string
          social_links: Json | null
          state: string | null
          subtype: string | null
          tagline: string | null
          type: string
          updated_at: string | null
          verification_type: string | null
          village: string | null
          website_url: string | null
        }
        Insert: {
          allow_employee_requests?: boolean | null
          allow_messages?: boolean | null
          city?: string | null
          country?: string | null
          cover_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          district?: string | null
          email?: string | null
          email_domain?: string | null
          employee_count?: string | null
          followers_count?: number | null
          founded_year?: number | null
          full_address?: string | null
          id?: string
          is_verified?: boolean | null
          logo_url?: string | null
          maps_url?: string | null
          name: string
          phone?: string | null
          pincode?: string | null
          pings_enabled?: boolean | null
          pings_visibility?: string | null
          slug: string
          social_links?: Json | null
          state?: string | null
          subtype?: string | null
          tagline?: string | null
          type: string
          updated_at?: string | null
          verification_type?: string | null
          village?: string | null
          website_url?: string | null
        }
        Update: {
          allow_employee_requests?: boolean | null
          allow_messages?: boolean | null
          city?: string | null
          country?: string | null
          cover_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          district?: string | null
          email?: string | null
          email_domain?: string | null
          employee_count?: string | null
          followers_count?: number | null
          founded_year?: number | null
          full_address?: string | null
          id?: string
          is_verified?: boolean | null
          logo_url?: string | null
          maps_url?: string | null
          name?: string
          phone?: string | null
          pincode?: string | null
          pings_enabled?: boolean | null
          pings_visibility?: string | null
          slug?: string
          social_links?: Json | null
          state?: string | null
          subtype?: string | null
          tagline?: string | null
          type?: string
          updated_at?: string | null
          verification_type?: string | null
          village?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      page_admins: {
        Row: {
          created_at: string | null
          id: string
          page_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          page_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          page_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_admins_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_trackers: {
        Row: {
          created_at: string | null
          id: string
          page_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          page_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          page_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_trackers_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          about: string | null
          activity_photos: string[] | null
          affiliation: string | null
          also_known_as: string | null
          awards: Json | null
          bed_count: number | null
          city: string | null
          client_types: string[] | null
          cover_url: string | null
          created_at: string | null
          created_by: string | null
          creator_specialisation_tags: string[] | null
          custom_links: Json | null
          emergency_contact: string | null
          founded_year: number | null
          founding_number: number | null
          govt_level: string | null
          id: string
          industry: string | null
          institution_id: string | null
          jurisdiction: string | null
          logo_url: string | null
          member_count: number | null
          naac_grade: string | null
          nabh_accredited: boolean | null
          name: string
          nirf_ranking: number | null
          notable_work: string | null
          official_email: string | null
          official_website: string | null
          page_type: string
          pincode: string | null
          service_hours: string | null
          slug: string
          specialisations: string[] | null
          state: string | null
          student_count: number | null
          sub_type: string | null
          team_size: string | null
          tracker_count: number | null
          trust_score: number | null
          updated_at: string | null
          why_work_with_us: string | null
          work_culture_tags: string[] | null
        }
        Insert: {
          about?: string | null
          activity_photos?: string[] | null
          affiliation?: string | null
          also_known_as?: string | null
          awards?: Json | null
          bed_count?: number | null
          city?: string | null
          client_types?: string[] | null
          cover_url?: string | null
          created_at?: string | null
          created_by?: string | null
          creator_specialisation_tags?: string[] | null
          custom_links?: Json | null
          emergency_contact?: string | null
          founded_year?: number | null
          founding_number?: number | null
          govt_level?: string | null
          id?: string
          industry?: string | null
          institution_id?: string | null
          jurisdiction?: string | null
          logo_url?: string | null
          member_count?: number | null
          naac_grade?: string | null
          nabh_accredited?: boolean | null
          name: string
          nirf_ranking?: number | null
          notable_work?: string | null
          official_email?: string | null
          official_website?: string | null
          page_type?: string
          pincode?: string | null
          service_hours?: string | null
          slug: string
          specialisations?: string[] | null
          state?: string | null
          student_count?: number | null
          sub_type?: string | null
          team_size?: string | null
          tracker_count?: number | null
          trust_score?: number | null
          updated_at?: string | null
          why_work_with_us?: string | null
          work_culture_tags?: string[] | null
        }
        Update: {
          about?: string | null
          activity_photos?: string[] | null
          affiliation?: string | null
          also_known_as?: string | null
          awards?: Json | null
          bed_count?: number | null
          city?: string | null
          client_types?: string[] | null
          cover_url?: string | null
          created_at?: string | null
          created_by?: string | null
          creator_specialisation_tags?: string[] | null
          custom_links?: Json | null
          emergency_contact?: string | null
          founded_year?: number | null
          founding_number?: number | null
          govt_level?: string | null
          id?: string
          industry?: string | null
          institution_id?: string | null
          jurisdiction?: string | null
          logo_url?: string | null
          member_count?: number | null
          naac_grade?: string | null
          nabh_accredited?: boolean | null
          name?: string
          nirf_ranking?: number | null
          notable_work?: string | null
          official_email?: string | null
          official_website?: string | null
          page_type?: string
          pincode?: string | null
          service_hours?: string | null
          slug?: string
          specialisations?: string[] | null
          state?: string | null
          student_count?: number | null
          sub_type?: string | null
          team_size?: string | null
          tracker_count?: number | null
          trust_score?: number | null
          updated_at?: string | null
          why_work_with_us?: string | null
          work_culture_tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "pages_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pages_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions_public"
            referencedColumns: ["id"]
          },
        ]
      }
      pings: {
        Row: {
          attachment_name: string | null
          attachment_size: number | null
          attachment_type: string | null
          attachment_url: string | null
          content: string
          conversation_id: string | null
          created_at: string | null
          deleted_at: string | null
          id: string
          is_deleted: boolean | null
          is_opener: boolean | null
          is_read: boolean | null
          pdf_url: string | null
          sender_id: string | null
          work_item_id: string | null
        }
        Insert: {
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          conversation_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_opener?: boolean | null
          is_read?: boolean | null
          pdf_url?: string | null
          sender_id?: string | null
          work_item_id?: string | null
        }
        Update: {
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_opener?: boolean | null
          is_read?: boolean | null
          pdf_url?: string | null
          sender_id?: string | null
          work_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pings_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pings_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pings_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          parent_id: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_mentions: {
        Row: {
          created_at: string | null
          id: string
          mentioned_org_id: string | null
          mentioned_page_id: string | null
          mentioned_user_id: string | null
          post_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mentioned_org_id?: string | null
          mentioned_page_id?: string | null
          mentioned_user_id?: string | null
          post_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mentioned_org_id?: string | null
          mentioned_page_id?: string | null
          mentioned_user_id?: string | null
          post_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_mentions_mentioned_org_id_fkey"
            columns: ["mentioned_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_mentions_mentioned_page_id_fkey"
            columns: ["mentioned_page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_mentions_mentioned_user_id_fkey"
            columns: ["mentioned_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_mentions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reports: {
        Row: {
          created_at: string | null
          id: string
          post_id: string | null
          reason: string | null
          reporter_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          reason?: string | null
          reporter_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          reason?: string | null
          reporter_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reposts: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          reposted_by: string
          reposted_by_org: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          reposted_by: string
          reposted_by_org?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          reposted_by?: string
          reposted_by_org?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_reposts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reposts_reposted_by_fkey"
            columns: ["reposted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reposts_reposted_by_org_fkey"
            columns: ["reposted_by_org"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      post_shares: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          post_id: string | null
          receiver_id: string | null
          sender_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          post_id?: string | null
          receiver_id?: string | null
          sender_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          post_id?: string | null
          receiver_id?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_shares_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_shares_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_shares_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string | null
          comment_count: number | null
          content: string
          created_at: string | null
          hashtags: string[] | null
          id: string
          image_urls: string[] | null
          is_edited: boolean | null
          is_shared_to_feed: boolean | null
          pdf_url: string | null
          post_type: string | null
          posted_by_org: string | null
          posted_by_user_id: string | null
          reactions: Json | null
          repost_count: number | null
          repost_of: string | null
          show_company_badge: boolean | null
          type: string | null
          updated_at: string | null
          visibility: string | null
          work_item_id: string | null
          workspace_id: string | null
          workspace_name: string | null
        }
        Insert: {
          author_id?: string | null
          comment_count?: number | null
          content: string
          created_at?: string | null
          hashtags?: string[] | null
          id?: string
          image_urls?: string[] | null
          is_edited?: boolean | null
          is_shared_to_feed?: boolean | null
          pdf_url?: string | null
          post_type?: string | null
          posted_by_org?: string | null
          posted_by_user_id?: string | null
          reactions?: Json | null
          repost_count?: number | null
          repost_of?: string | null
          show_company_badge?: boolean | null
          type?: string | null
          updated_at?: string | null
          visibility?: string | null
          work_item_id?: string | null
          workspace_id?: string | null
          workspace_name?: string | null
        }
        Update: {
          author_id?: string | null
          comment_count?: number | null
          content?: string
          created_at?: string | null
          hashtags?: string[] | null
          id?: string
          image_urls?: string[] | null
          is_edited?: boolean | null
          is_shared_to_feed?: boolean | null
          pdf_url?: string | null
          post_type?: string | null
          posted_by_org?: string | null
          posted_by_user_id?: string | null
          reactions?: Json | null
          repost_count?: number | null
          repost_of?: string | null
          show_company_badge?: boolean | null
          type?: string | null
          updated_at?: string | null
          visibility?: string | null
          work_item_id?: string | null
          workspace_id?: string | null
          workspace_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_posted_by_org_fkey"
            columns: ["posted_by_org"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_posted_by_user_id_fkey"
            columns: ["posted_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_repost_of_fkey"
            columns: ["repost_of"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      power_transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          reason: string
          reference_id: string | null
          reference_type: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          reason: string
          reference_id?: string | null
          reference_type?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          reason?: string
          reference_id?: string | null
          reference_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profile_roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          role_type: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          role_type: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          role_type?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          about: string | null
          about_qa: Json | null
          account_type: string | null
          activity_score: number | null
          avatar_url: string | null
          bio: string | null
          contact_email_visible: boolean | null
          cover_url: string | null
          created_at: string | null
          currently_working_at: string | null
          custom_links: Json | null
          department: string | null
          designation: string | null
          email: string | null
          full_name: string | null
          headline: string | null
          id: string
          institution_id: string | null
          institution_name: string | null
          is_public: boolean | null
          is_verified: boolean | null
          languages: string[] | null
          location_city: string | null
          location_state: string | null
          onboarding_complete: boolean | null
          open_to_work: boolean | null
          open_to_work_preferences: Json | null
          org_id: string | null
          otw_visibility: string | null
          phone: string | null
          phone_hash: string | null
          privacy_settings: Json | null
          referred_by: string | null
          role: string | null
          role_metadata: Json | null
          role_subtype: string | null
          section_order: Json | null
          sector: string | null
          skills: string[] | null
          status: string | null
          theme_preference: string | null
          updated_at: string | null
          username: string | null
          verification_badge_text: string | null
          verification_type: string | null
          verified_by: string | null
        }
        Insert: {
          about?: string | null
          about_qa?: Json | null
          account_type?: string | null
          activity_score?: number | null
          avatar_url?: string | null
          bio?: string | null
          contact_email_visible?: boolean | null
          cover_url?: string | null
          created_at?: string | null
          currently_working_at?: string | null
          custom_links?: Json | null
          department?: string | null
          designation?: string | null
          email?: string | null
          full_name?: string | null
          headline?: string | null
          id: string
          institution_id?: string | null
          institution_name?: string | null
          is_public?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          location_city?: string | null
          location_state?: string | null
          onboarding_complete?: boolean | null
          open_to_work?: boolean | null
          open_to_work_preferences?: Json | null
          org_id?: string | null
          otw_visibility?: string | null
          phone?: string | null
          phone_hash?: string | null
          privacy_settings?: Json | null
          referred_by?: string | null
          role?: string | null
          role_metadata?: Json | null
          role_subtype?: string | null
          section_order?: Json | null
          sector?: string | null
          skills?: string[] | null
          status?: string | null
          theme_preference?: string | null
          updated_at?: string | null
          username?: string | null
          verification_badge_text?: string | null
          verification_type?: string | null
          verified_by?: string | null
        }
        Update: {
          about?: string | null
          about_qa?: Json | null
          account_type?: string | null
          activity_score?: number | null
          avatar_url?: string | null
          bio?: string | null
          contact_email_visible?: boolean | null
          cover_url?: string | null
          created_at?: string | null
          currently_working_at?: string | null
          custom_links?: Json | null
          department?: string | null
          designation?: string | null
          email?: string | null
          full_name?: string | null
          headline?: string | null
          id?: string
          institution_id?: string | null
          institution_name?: string | null
          is_public?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          location_city?: string | null
          location_state?: string | null
          onboarding_complete?: boolean | null
          open_to_work?: boolean | null
          open_to_work_preferences?: Json | null
          org_id?: string | null
          otw_visibility?: string | null
          phone?: string | null
          phone_hash?: string | null
          privacy_settings?: Json | null
          referred_by?: string | null
          role?: string | null
          role_metadata?: Json | null
          role_subtype?: string | null
          section_order?: Json | null
          sector?: string | null
          skills?: string[] | null
          status?: string | null
          theme_preference?: string | null
          updated_at?: string | null
          username?: string | null
          verification_badge_text?: string | null
          verification_type?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          opportunity_id: string | null
          referred_user_id: string | null
          referrer_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          opportunity_id?: string | null
          referred_user_id?: string | null
          referrer_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          opportunity_id?: string | null
          referred_user_id?: string | null
          referrer_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      startup_profiles: {
        Row: {
          created_at: string | null
          founded_date: string | null
          founder_id: string | null
          funding_amount: number | null
          funding_currency: string | null
          funding_stage: string | null
          id: string
          looking_for_funding: boolean | null
          page_id: string | null
          pitch_deck_url: string | null
          revenue_range: string | null
          sectors: string[] | null
          team_size: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          founded_date?: string | null
          founder_id?: string | null
          funding_amount?: number | null
          funding_currency?: string | null
          funding_stage?: string | null
          id?: string
          looking_for_funding?: boolean | null
          page_id?: string | null
          pitch_deck_url?: string | null
          revenue_range?: string | null
          sectors?: string[] | null
          team_size?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          founded_date?: string | null
          founder_id?: string | null
          funding_amount?: number | null
          funding_currency?: string | null
          funding_stage?: string | null
          id?: string
          looking_for_funding?: boolean | null
          page_id?: string | null
          pitch_deck_url?: string | null
          revenue_range?: string | null
          sectors?: string[] | null
          team_size?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "startup_profiles_founder_id_fkey"
            columns: ["founder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "startup_profiles_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      strands: {
        Row: {
          created_at: string | null
          id: string
          is_public: boolean | null
          receiver_id: string | null
          requester_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          receiver_id?: string | null
          requester_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          receiver_id?: string | null
          requester_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "strands_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strands_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          contribution_description: string | null
          id: string
          joined_at: string | null
          permission_level: string | null
          role_in_project: string | null
          user_id: string | null
          work_item_id: string | null
        }
        Insert: {
          contribution_description?: string | null
          id?: string
          joined_at?: string | null
          permission_level?: string | null
          role_in_project?: string | null
          user_id?: string | null
          work_item_id?: string | null
        }
        Update: {
          contribution_description?: string | null
          id?: string
          joined_at?: string | null
          permission_level?: string | null
          role_in_project?: string | null
          user_id?: string | null
          work_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_additional_roles: {
        Row: {
          about: string | null
          achievements: string | null
          created_at: string | null
          designation: string | null
          id: string
          links: Json | null
          role_name: string
          show_on_profile: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          about?: string | null
          achievements?: string | null
          created_at?: string | null
          designation?: string | null
          id?: string
          links?: Json | null
          role_name: string
          show_on_profile?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          about?: string | null
          achievements?: string | null
          created_at?: string | null
          designation?: string | null
          id?: string
          links?: Json | null
          role_name?: string
          show_on_profile?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_additional_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_mutes: {
        Row: {
          created_at: string
          expires_at: string | null
          muted_id: string
          muter_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          muted_id: string
          muter_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          muted_id?: string
          muter_id?: string
        }
        Relationships: []
      }
      user_power: {
        Row: {
          current_power: number | null
          diamond_count: number | null
          id: string
          last_updated: string | null
          level: string | null
          level_num: number | null
          total_power_earned: number | null
          user_id: string
        }
        Insert: {
          current_power?: number | null
          diamond_count?: number | null
          id?: string
          last_updated?: string | null
          level?: string | null
          level_num?: number | null
          total_power_earned?: number | null
          user_id: string
        }
        Update: {
          current_power?: number | null
          diamond_count?: number | null
          id?: string
          last_updated?: string | null
          level?: string | null
          level_num?: number | null
          total_power_earned?: number | null
          user_id?: string
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          assigned_to: string | null
          context_note: string | null
          created_at: string | null
          document_type: string | null
          document_url: string | null
          id: string
          item_id: string
          item_type: string
          org_id: string
          requested_doc_message: string | null
          requester_id: string
          review_note: string | null
          reviewed_by: string | null
          status: string | null
          submitted_id: string
          supporting_doc_url: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          context_note?: string | null
          created_at?: string | null
          document_type?: string | null
          document_url?: string | null
          id?: string
          item_id: string
          item_type: string
          org_id: string
          requested_doc_message?: string | null
          requester_id: string
          review_note?: string | null
          reviewed_by?: string | null
          status?: string | null
          submitted_id: string
          supporting_doc_url?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          context_note?: string | null
          created_at?: string | null
          document_type?: string | null
          document_url?: string | null
          id?: string
          item_id?: string
          item_type?: string
          org_id?: string
          requested_doc_message?: string | null
          requester_id?: string
          review_note?: string | null
          reviewed_by?: string | null
          status?: string | null
          submitted_id?: string
          supporting_doc_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_requests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      verifications: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          scope: string | null
          status: string | null
          subject_user_id: string
          verification_type: string | null
          verified_at: string | null
          verifier_user_id: string | null
          work_item_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          scope?: string | null
          status?: string | null
          subject_user_id: string
          verification_type?: string | null
          verified_at?: string | null
          verifier_user_id?: string | null
          work_item_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          scope?: string | null
          status?: string | null
          subject_user_id?: string
          verification_type?: string | null
          verified_at?: string | null
          verifier_user_id?: string | null
          work_item_id?: string | null
        }
        Relationships: []
      }
      work_items: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_name: string | null
          created_at: string | null
          degree_type: string | null
          description: string | null
          display_order: number | null
          domain: string | null
          employment_type: string | null
          end_date: string | null
          end_month: string | null
          end_year: number | null
          field_of_study: string | null
          grade_score: string | null
          id: string
          institution_id: string | null
          institution_name: string | null
          institution_name_edu: string | null
          is_current: boolean | null
          is_tiik_approved: boolean | null
          is_tiiked: boolean | null
          item_type: string | null
          job_title: string | null
          links: Json | null
          owner_id: string | null
          project_type: string | null
          recruiter_views: number | null
          role_in_work: string | null
          skills_used: string[] | null
          slug: string | null
          start_date: string | null
          start_month: string | null
          start_year: number | null
          status: string | null
          tech_stack: string[] | null
          tiiked_by: string | null
          title: string
          total_views: number | null
          type: string | null
          updated_at: string | null
          verification_status: string | null
          verified_at: string | null
          verified_by_user: string | null
          visibility: string | null
          work_location: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          created_at?: string | null
          degree_type?: string | null
          description?: string | null
          display_order?: number | null
          domain?: string | null
          employment_type?: string | null
          end_date?: string | null
          end_month?: string | null
          end_year?: number | null
          field_of_study?: string | null
          grade_score?: string | null
          id?: string
          institution_id?: string | null
          institution_name?: string | null
          institution_name_edu?: string | null
          is_current?: boolean | null
          is_tiik_approved?: boolean | null
          is_tiiked?: boolean | null
          item_type?: string | null
          job_title?: string | null
          links?: Json | null
          owner_id?: string | null
          project_type?: string | null
          recruiter_views?: number | null
          role_in_work?: string | null
          skills_used?: string[] | null
          slug?: string | null
          start_date?: string | null
          start_month?: string | null
          start_year?: number | null
          status?: string | null
          tech_stack?: string[] | null
          tiiked_by?: string | null
          title: string
          total_views?: number | null
          type?: string | null
          updated_at?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by_user?: string | null
          visibility?: string | null
          work_location?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string | null
          created_at?: string | null
          degree_type?: string | null
          description?: string | null
          display_order?: number | null
          domain?: string | null
          employment_type?: string | null
          end_date?: string | null
          end_month?: string | null
          end_year?: number | null
          field_of_study?: string | null
          grade_score?: string | null
          id?: string
          institution_id?: string | null
          institution_name?: string | null
          institution_name_edu?: string | null
          is_current?: boolean | null
          is_tiik_approved?: boolean | null
          is_tiiked?: boolean | null
          item_type?: string | null
          job_title?: string | null
          links?: Json | null
          owner_id?: string | null
          project_type?: string | null
          recruiter_views?: number | null
          role_in_work?: string | null
          skills_used?: string[] | null
          slug?: string | null
          start_date?: string | null
          start_month?: string | null
          start_year?: number | null
          status?: string | null
          tech_stack?: string[] | null
          tiiked_by?: string | null
          title?: string
          total_views?: number | null
          type?: string | null
          updated_at?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by_user?: string | null
          visibility?: string | null
          work_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_items_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_items_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_access: {
        Row: {
          access_type: string
          granted_at: string | null
          granted_by: string | null
          id: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          access_type: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          access_type?: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: []
      }
      workspace_channel_members: {
        Row: {
          channel_id: string | null
          id: string
          joined_at: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          channel_id?: string | null
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          channel_id?: string | null
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspace_channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "workspace_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_channel_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_channels: {
        Row: {
          channel_type: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_private: boolean | null
          member_count: number | null
          name: string
          workspace_id: string | null
        }
        Insert: {
          channel_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_private?: boolean | null
          member_count?: number | null
          name: string
          workspace_id?: string | null
        }
        Update: {
          channel_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_private?: boolean | null
          member_count?: number | null
          name?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspace_channels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_channels_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          id: string
          invitation_status: string | null
          invited_by: string | null
          joined_at: string | null
          left_at: string | null
          role: string | null
          status: string | null
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          id?: string
          invitation_status?: string | null
          invited_by?: string | null
          joined_at?: string | null
          left_at?: string | null
          role?: string | null
          status?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          id?: string
          invitation_status?: string | null
          invited_by?: string | null
          joined_at?: string | null
          left_at?: string | null
          role?: string | null
          status?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_messages: {
        Row: {
          attachment_name: string | null
          attachment_type: string | null
          attachment_url: string | null
          channel_id: string | null
          content: string
          created_at: string | null
          deleted_at: string | null
          id: string
          is_deleted: boolean | null
          sender_id: string | null
        }
        Insert: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          channel_id?: string | null
          content: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean | null
          sender_id?: string | null
        }
        Update: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          channel_id?: string | null
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspace_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "workspace_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          institution_id: string | null
          is_active: boolean | null
          last_message_at: string | null
          member_count: number | null
          name: string
          org_id: string | null
          privacy: string | null
          project_count: number | null
          type: string | null
          workspace_type: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          institution_id?: string | null
          is_active?: boolean | null
          last_message_at?: string | null
          member_count?: number | null
          name: string
          org_id?: string | null
          privacy?: string | null
          project_count?: number | null
          type?: string | null
          workspace_type?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          institution_id?: string | null
          is_active?: boolean | null
          last_message_at?: string | null
          member_count?: number | null
          name?: string
          org_id?: string | null
          privacy?: string | null
          project_count?: number | null
          type?: string | null
          workspace_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspaces_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspaces_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspaces_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_dashboard: {
        Row: {
          doctor_count: number | null
          government_count: number | null
          new_users_24h: number | null
          new_users_7d: number | null
          posts_today: number | null
          professional_count: number | null
          student_count: number | null
          tiik_approved_works: number | null
          total_posts: number | null
          total_strands: number | null
          total_users: number | null
          trade_count: number | null
        }
        Relationships: []
      }
      institutions_public: {
        Row: {
          city: string | null
          created_at: string | null
          district: string | null
          founded_year: number | null
          head_profile_id: string | null
          id: string | null
          is_verified: boolean | null
          member_count: number | null
          name: string | null
          official_website: string | null
          parent_institution_id: string | null
          pincode: string | null
          state: string | null
          type: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          district?: string | null
          founded_year?: number | null
          head_profile_id?: string | null
          id?: string | null
          is_verified?: boolean | null
          member_count?: number | null
          name?: string | null
          official_website?: string | null
          parent_institution_id?: string | null
          pincode?: string | null
          state?: string | null
          type?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          district?: string | null
          founded_year?: number | null
          head_profile_id?: string | null
          id?: string | null
          is_verified?: boolean | null
          member_count?: number | null
          name?: string | null
          official_website?: string | null
          parent_institution_id?: string | null
          pincode?: string | null
          state?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "institutions_head_profile_id_fkey"
            columns: ["head_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institutions_parent_institution_id_fkey"
            columns: ["parent_institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institutions_parent_institution_id_fkey"
            columns: ["parent_institution_id"]
            isOneToOne: false
            referencedRelation: "institutions_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      award_power: {
        Args: {
          p_amount: number
          p_reason: string
          p_reference_id?: string
          p_reference_type?: string
          p_user_id: string
        }
        Returns: Json
      }
      calculate_activity_score: { Args: { p_user_id: string }; Returns: number }
      generate_clean_username: {
        Args: { p_full_name: string; p_user_id: string }
        Returns: string
      }
      get_page_tracker_count: { Args: { p_page_id: string }; Returns: number }
      get_user_list: {
        Args: { p_limit?: number; p_offset?: number; p_role?: string }
        Returns: {
          city: string
          created_at: string
          email: string
          full_name: string
          has_tiik_approved: boolean
          institution: string
          post_count: number
          role: string
          user_id: string
        }[]
      }
      increment_score: {
        Args: { amount: number; uid: string }
        Returns: undefined
      }
      match_opportunities_for_user: {
        Args: { p_user_id: string }
        Returns: {
          match_score: number
          opportunity_id: string
        }[]
      }
      rank_explore_pages: {
        Args: { p_page_type?: string; p_user_id: string }
        Returns: {
          explore_score: number
          page_id: string
        }[]
      }
      update_all_activity_scores: { Args: never; Returns: undefined }
    }
    Enums: {
      circle_post_type:
        | "discussion"
        | "poll"
        | "question"
        | "salary_share"
        | "company_review"
        | "link_share"
      circle_type: "company" | "college" | "sector" | "city" | "role" | "topic"
      post_signtype:
        | "full_profile"
        | "verified_employee"
        | "verified_alumni"
        | "verified_role"
        | "verified_anonymous"
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
      circle_post_type: [
        "discussion",
        "poll",
        "question",
        "salary_share",
        "company_review",
        "link_share",
      ],
      circle_type: ["company", "college", "sector", "city", "role", "topic"],
      post_signtype: [
        "full_profile",
        "verified_employee",
        "verified_alumni",
        "verified_role",
        "verified_anonymous",
      ],
    },
  },
} as const
