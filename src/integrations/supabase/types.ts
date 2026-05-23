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
      activity_role_weights: {
        Row: {
          role: string
          w_connections: number | null
          w_content: number | null
          w_engagement: number | null
          w_profile: number | null
        }
        Insert: {
          role: string
          w_connections?: number | null
          w_content?: number | null
          w_engagement?: number | null
          w_profile?: number | null
        }
        Update: {
          role?: string
          w_connections?: number | null
          w_content?: number | null
          w_engagement?: number | null
          w_profile?: number | null
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action_type: string
          actor_id: string | null
          actor_role: string | null
          actor_type: string
          created_at: string
          id: string
          payload: Json
          reason: string | null
          target_id: string | null
          target_table: string | null
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          actor_id?: string | null
          actor_role?: string | null
          actor_type: string
          created_at?: string
          id?: string
          payload?: Json
          reason?: string | null
          target_id?: string | null
          target_table?: string | null
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          actor_id?: string | null
          actor_role?: string | null
          actor_type?: string
          created_at?: string
          id?: string
          payload?: Json
          reason?: string | null
          target_id?: string | null
          target_table?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_audit_log_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      appeal_requests: {
        Row: {
          appellant_id: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          appellant_id: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          appellant_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appeal_requests_appellant_id_fkey"
            columns: ["appellant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appeal_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      application_stage_history: {
        Row: {
          application_id: string
          changed_by: string | null
          created_at: string
          from_status: string | null
          id: string
          note: string | null
          to_status: string
        }
        Insert: {
          application_id: string
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          to_status: string
        }
        Update: {
          application_id?: string
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_stage_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "opportunity_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_stage_history_changed_by_fkey"
            columns: ["changed_by"]
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
      campaign_daily_stats: {
        Row: {
          applications: number
          budget_allocated: number
          campaign_id: string
          clicks: number
          created_at: string
          date: string
          follows: number
          id: string
          impressions: number
          spent: number
        }
        Insert: {
          applications?: number
          budget_allocated?: number
          campaign_id: string
          clicks?: number
          created_at?: string
          date: string
          follows?: number
          id?: string
          impressions?: number
          spent?: number
        }
        Update: {
          applications?: number
          budget_allocated?: number
          campaign_id?: string
          clicks?: number
          created_at?: string
          date?: string
          follows?: number
          id?: string
          impressions?: number
          spent?: number
        }
        Relationships: [
          {
            foreignKeyName: "campaign_daily_stats_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_impressions: {
        Row: {
          action: string
          campaign_id: string
          created_at: string
          id: string
          placement: string
          user_id: string | null
        }
        Insert: {
          action?: string
          campaign_id: string
          created_at?: string
          id?: string
          placement?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          campaign_id?: string
          created_at?: string
          id?: string
          placement?: string
          user_id?: string | null
        }
        Relationships: []
      }
      campaign_impressions_2026_05: {
        Row: {
          action: string
          campaign_id: string
          created_at: string
          id: string
          placement: string
          user_id: string | null
        }
        Insert: {
          action?: string
          campaign_id: string
          created_at?: string
          id?: string
          placement?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          campaign_id?: string
          created_at?: string
          id?: string
          placement?: string
          user_id?: string | null
        }
        Relationships: []
      }
      campaign_impressions_2026_06: {
        Row: {
          action: string
          campaign_id: string
          created_at: string
          id: string
          placement: string
          user_id: string | null
        }
        Insert: {
          action?: string
          campaign_id: string
          created_at?: string
          id?: string
          placement?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          campaign_id?: string
          created_at?: string
          id?: string
          placement?: string
          user_id?: string | null
        }
        Relationships: []
      }
      campaign_impressions_default: {
        Row: {
          action: string
          campaign_id: string
          created_at: string
          id: string
          placement: string
          user_id: string | null
        }
        Insert: {
          action?: string
          campaign_id: string
          created_at?: string
          id?: string
          placement?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          campaign_id?: string
          created_at?: string
          id?: string
          placement?: string
          user_id?: string | null
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          budget_daily: number | null
          budget_total: number | null
          content_id: string | null
          content_type: string
          created_at: string
          created_by: string
          end_date: string | null
          id: string
          name: string
          objective: string
          org_id: string
          spent_total: number
          start_date: string | null
          status: string
          targeting: Json
          updated_at: string
        }
        Insert: {
          budget_daily?: number | null
          budget_total?: number | null
          content_id?: string | null
          content_type?: string
          created_at?: string
          created_by: string
          end_date?: string | null
          id?: string
          name: string
          objective?: string
          org_id: string
          spent_total?: number
          start_date?: string | null
          status?: string
          targeting?: Json
          updated_at?: string
        }
        Update: {
          budget_daily?: number | null
          budget_total?: number | null
          content_id?: string | null
          content_type?: string
          created_at?: string
          created_by?: string
          end_date?: string | null
          id?: string
          name?: string
          objective?: string
          org_id?: string
          spent_total?: number
          start_date?: string | null
          status?: string
          targeting?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_brain_summary"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "campaigns_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
            referencedRelation: "org_brain_summary"
            referencedColumns: ["org_id"]
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
      circle_moderators: {
        Row: {
          circle_id: string
          created_at: string
          granted_at: string
          granted_by: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          circle_id: string
          created_at?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          circle_id?: string
          created_at?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_moderators_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circle_moderators_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circle_moderators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          like_count: number | null
          parent_id: string | null
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          like_count?: number | null
          parent_id?: string | null
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          like_count?: number | null
          parent_id?: string | null
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_post_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "circle_post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circle_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "circle_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circle_post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          downvote_count: number
          flag_reason: string | null
          hot_score: number
          id: string
          is_edited: boolean | null
          is_flagged: boolean
          is_pinned: boolean
          link_url: string | null
          poll_ends_at: string | null
          poll_options: Json | null
          poll_votes: Json | null
          post_type: string
          posted_as_org_id: string | null
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
          downvote_count?: number
          flag_reason?: string | null
          hot_score?: number
          id?: string
          is_edited?: boolean | null
          is_flagged?: boolean
          is_pinned?: boolean
          link_url?: string | null
          poll_ends_at?: string | null
          poll_options?: Json | null
          poll_votes?: Json | null
          post_type?: string
          posted_as_org_id?: string | null
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
          downvote_count?: number
          flag_reason?: string | null
          hot_score?: number
          id?: string
          is_edited?: boolean | null
          is_flagged?: boolean
          is_pinned?: boolean
          link_url?: string | null
          poll_ends_at?: string | null
          poll_options?: Json | null
          poll_votes?: Json | null
          post_type?: string
          posted_as_org_id?: string | null
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
          {
            foreignKeyName: "circle_posts_posted_as_org_id_fkey"
            columns: ["posted_as_org_id"]
            isOneToOne: false
            referencedRelation: "org_brain_summary"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "circle_posts_posted_as_org_id_fkey"
            columns: ["posted_as_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          linked_org_id: string | null
          member_count: number
          name: string
          post_count: number
          rules: string | null
          slug: string
          status: string
          type: string
          updated_at: string
          visibility: string
          who_can_join: string
          who_can_post: string
        }
        Insert: {
          active_7d?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_unlocked?: boolean
          linked_org_id?: string | null
          member_count?: number
          name: string
          post_count?: number
          rules?: string | null
          slug: string
          status?: string
          type?: string
          updated_at?: string
          visibility?: string
          who_can_join?: string
          who_can_post?: string
        }
        Update: {
          active_7d?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_unlocked?: boolean
          linked_org_id?: string | null
          member_count?: number
          name?: string
          post_count?: number
          rules?: string | null
          slug?: string
          status?: string
          type?: string
          updated_at?: string
          visibility?: string
          who_can_join?: string
          who_can_post?: string
        }
        Relationships: [
          {
            foreignKeyName: "circles_linked_org_id_fkey"
            columns: ["linked_org_id"]
            isOneToOne: false
            referencedRelation: "org_brain_summary"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "circles_linked_org_id_fkey"
            columns: ["linked_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          context_id: string | null
          context_type: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_message_at: string | null
          participant_1: string | null
          participant_2: string | null
        }
        Insert: {
          context_id?: string | null
          context_type?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_message_at?: string | null
          participant_1?: string | null
          participant_2?: string | null
        }
        Update: {
          context_id?: string | null
          context_type?: string | null
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
      disposable_domains: {
        Row: {
          domain: string
        }
        Insert: {
          domain: string
        }
        Update: {
          domain?: string
        }
        Relationships: []
      }
      domain_verification_challenges: {
        Row: {
          attempts_count: number
          created_at: string
          created_by: string | null
          domain: string
          evidence_type: string
          expires_at: string
          id: string
          last_attempt_at: string | null
          metadata: Json
          method: string
          status: string
          subject_category: string
          subject_org_id: string | null
          subject_page_id: string | null
          subject_profile_id: string | null
          token_hash: string
          trust_evidence_id: string
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          attempts_count?: number
          created_at?: string
          created_by?: string | null
          domain: string
          evidence_type: string
          expires_at: string
          id?: string
          last_attempt_at?: string | null
          metadata?: Json
          method: string
          status?: string
          subject_category: string
          subject_org_id?: string | null
          subject_page_id?: string | null
          subject_profile_id?: string | null
          token_hash: string
          trust_evidence_id: string
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          attempts_count?: number
          created_at?: string
          created_by?: string | null
          domain?: string
          evidence_type?: string
          expires_at?: string
          id?: string
          last_attempt_at?: string | null
          metadata?: Json
          method?: string
          status?: string
          subject_category?: string
          subject_org_id?: string | null
          subject_page_id?: string | null
          subject_profile_id?: string | null
          token_hash?: string
          trust_evidence_id?: string
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "domain_verification_challenges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "domain_verification_challenges_subject_org_id_fkey"
            columns: ["subject_org_id"]
            isOneToOne: false
            referencedRelation: "org_brain_summary"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "domain_verification_challenges_subject_org_id_fkey"
            columns: ["subject_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "domain_verification_challenges_subject_page_id_fkey"
            columns: ["subject_page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "domain_verification_challenges_subject_profile_id_fkey"
            columns: ["subject_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "domain_verification_challenges_trust_evidence_id_fkey"
            columns: ["trust_evidence_id"]
            isOneToOne: false
            referencedRelation: "trust_evidence"
            referencedColumns: ["id"]
          },
        ]
      }
      employer_endorsement_requests: {
        Row: {
          approval_note: string | null
          approved_by: string | null
          created_at: string
          email_verified: boolean
          expires_at: string
          id: string
          org_id: string
          requested_role: string
          requester_id: string
          resolved_at: string | null
          status: string
          work_email: string | null
        }
        Insert: {
          approval_note?: string | null
          approved_by?: string | null
          created_at?: string
          email_verified?: boolean
          expires_at?: string
          id?: string
          org_id: string
          requested_role: string
          requester_id: string
          resolved_at?: string | null
          status?: string
          work_email?: string | null
        }
        Update: {
          approval_note?: string | null
          approved_by?: string | null
          created_at?: string
          email_verified?: boolean
          expires_at?: string
          id?: string
          org_id?: string
          requested_role?: string
          requester_id?: string
          resolved_at?: string | null
          status?: string
          work_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employer_endorsement_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employer_endorsement_requests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_brain_summary"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "employer_endorsement_requests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employer_endorsement_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      explore_impressions: {
        Row: {
          action: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          source: string
          user_id: string | null
        }
        Insert: {
          action?: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          source?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          source?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "explore_impressions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      explore_impressions_2026_05: {
        Row: {
          action: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          source: string
          user_id: string | null
        }
        Insert: {
          action?: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          source?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          source?: string
          user_id?: string | null
        }
        Relationships: []
      }
      explore_impressions_2026_06: {
        Row: {
          action: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          source: string
          user_id: string | null
        }
        Insert: {
          action?: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          source?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          source?: string
          user_id?: string | null
        }
        Relationships: []
      }
      explore_impressions_default: {
        Row: {
          action: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          source: string
          user_id: string | null
        }
        Insert: {
          action?: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          source?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          source?: string
          user_id?: string | null
        }
        Relationships: []
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
            referencedRelation: "org_brain_summary"
            referencedColumns: ["org_id"]
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
      interview_schedules: {
        Row: {
          application_id: string
          created_at: string
          duration_mins: number
          feedback: Json | null
          id: string
          interview_type: string
          interviewer_ids: string[]
          meeting_link: string | null
          org_id: string | null
          scheduled_at: string
          scheduled_by: string
          status: string
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          duration_mins?: number
          feedback?: Json | null
          id?: string
          interview_type?: string
          interviewer_ids?: string[]
          meeting_link?: string | null
          org_id?: string | null
          scheduled_at: string
          scheduled_by: string
          status?: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          duration_mins?: number
          feedback?: Json | null
          id?: string
          interview_type?: string
          interviewer_ids?: string[]
          meeting_link?: string | null
          org_id?: string | null
          scheduled_at?: string
          scheduled_by?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_schedules_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "opportunity_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_schedules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_brain_summary"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "interview_schedules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_schedules_scheduled_by_fkey"
            columns: ["scheduled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      moderation_flags: {
        Row: {
          author_id: string | null
          category: string | null
          content_id: string | null
          content_type: string
          created_at: string
          id: string
          reporter_id: string | null
          severity: number | null
          source: string
          status: string
          text_preview: string | null
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content_id?: string | null
          content_type: string
          created_at?: string
          id?: string
          reporter_id?: string | null
          severity?: number | null
          source?: string
          status?: string
          text_preview?: string | null
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content_id?: string | null
          content_type?: string
          created_at?: string
          id?: string
          reporter_id?: string | null
          severity?: number | null
          source?: string
          status?: string
          text_preview?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_flags_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_flags_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          alerts_email: boolean
          alerts_in_app: boolean
          alerts_push: boolean
          circles_email: boolean
          circles_in_app: boolean
          circles_push: boolean
          connections_email: boolean
          connections_in_app: boolean
          connections_push: boolean
          jobs_email: boolean
          jobs_in_app: boolean
          jobs_push: boolean
          messages_email: boolean
          messages_in_app: boolean
          messages_push: boolean
          posts_email: boolean
          posts_in_app: boolean
          posts_push: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          alerts_email?: boolean
          alerts_in_app?: boolean
          alerts_push?: boolean
          circles_email?: boolean
          circles_in_app?: boolean
          circles_push?: boolean
          connections_email?: boolean
          connections_in_app?: boolean
          connections_push?: boolean
          jobs_email?: boolean
          jobs_in_app?: boolean
          jobs_push?: boolean
          messages_email?: boolean
          messages_in_app?: boolean
          messages_push?: boolean
          posts_email?: boolean
          posts_in_app?: boolean
          posts_push?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          alerts_email?: boolean
          alerts_in_app?: boolean
          alerts_push?: boolean
          circles_email?: boolean
          circles_in_app?: boolean
          circles_push?: boolean
          connections_email?: boolean
          connections_in_app?: boolean
          connections_push?: boolean
          jobs_email?: boolean
          jobs_in_app?: boolean
          jobs_push?: boolean
          messages_email?: boolean
          messages_in_app?: boolean
          messages_push?: boolean
          posts_email?: boolean
          posts_in_app?: boolean
          posts_push?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          actor_count: number
          actor_id: string | null
          body: string | null
          category: string
          created_at: string | null
          data: Json | null
          expires_at: string | null
          group_key: string | null
          id: string
          is_read: boolean | null
          priority: string
          title: string | null
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          actor_count?: number
          actor_id?: string | null
          body?: string | null
          category?: string
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          group_key?: string | null
          id?: string
          is_read?: boolean | null
          priority?: string
          title?: string | null
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          actor_count?: number
          actor_id?: string | null
          body?: string | null
          category?: string
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          group_key?: string | null
          id?: string
          is_read?: boolean | null
          priority?: string
          title?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      obs_alert_firings: {
        Row: {
          fired_at: string
          id: string
          metric_value: number
          notified: boolean
          resolved_at: string | null
          rule_id: string
        }
        Insert: {
          fired_at?: string
          id?: string
          metric_value: number
          notified?: boolean
          resolved_at?: string | null
          rule_id: string
        }
        Update: {
          fired_at?: string
          id?: string
          metric_value?: number
          notified?: boolean
          resolved_at?: string | null
          rule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "obs_alert_firings_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "obs_alert_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      obs_alert_rules: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          metric: string
          name: string
          operator: string
          severity: string
          surface: string | null
          threshold: number
          webhook_url: string | null
          window_min: number
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          metric: string
          name: string
          operator: string
          severity: string
          surface?: string | null
          threshold: number
          webhook_url?: string | null
          window_min?: number
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          metric?: string
          name?: string
          operator?: string
          severity?: string
          surface?: string | null
          threshold?: number
          webhook_url?: string | null
          window_min?: number
        }
        Relationships: []
      }
      obs_db_failures: {
        Row: {
          captured_at: string
          duration_ms: number | null
          id: string
          pid: number | null
          query_sample: string | null
          state: string | null
          wait_event: string | null
        }
        Insert: {
          captured_at?: string
          duration_ms?: number | null
          id?: string
          pid?: number | null
          query_sample?: string | null
          state?: string | null
          wait_event?: string | null
        }
        Update: {
          captured_at?: string
          duration_ms?: number | null
          id?: string
          pid?: number | null
          query_sample?: string | null
          state?: string | null
          wait_event?: string | null
        }
        Relationships: []
      }
      obs_events: {
        Row: {
          created_at: string
          event: string
          id: string
          properties: Json
          session_id: string | null
          surface: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          properties?: Json
          session_id?: string | null
          surface?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          properties?: Json
          session_id?: string | null
          surface?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      obs_events_2026_05: {
        Row: {
          created_at: string
          event: string
          id: string
          properties: Json
          session_id: string | null
          surface: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          properties?: Json
          session_id?: string | null
          surface?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          properties?: Json
          session_id?: string | null
          surface?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      obs_events_2026_06: {
        Row: {
          created_at: string
          event: string
          id: string
          properties: Json
          session_id: string | null
          surface: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          properties?: Json
          session_id?: string | null
          surface?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          properties?: Json
          session_id?: string | null
          surface?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      obs_events_2026_07: {
        Row: {
          created_at: string
          event: string
          id: string
          properties: Json
          session_id: string | null
          surface: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          properties?: Json
          session_id?: string | null
          surface?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          properties?: Json
          session_id?: string | null
          surface?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      obs_events_2026_08: {
        Row: {
          created_at: string
          event: string
          id: string
          properties: Json
          session_id: string | null
          surface: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          properties?: Json
          session_id?: string | null
          surface?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          properties?: Json
          session_id?: string | null
          surface?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      obs_events_2026_09: {
        Row: {
          created_at: string
          event: string
          id: string
          properties: Json
          session_id: string | null
          surface: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          properties?: Json
          session_id?: string | null
          surface?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          properties?: Json
          session_id?: string | null
          surface?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      obs_events_default: {
        Row: {
          created_at: string
          event: string
          id: string
          properties: Json
          session_id: string | null
          surface: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          properties?: Json
          session_id?: string | null
          surface?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          properties?: Json
          session_id?: string | null
          surface?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      obs_frontend_errors: {
        Row: {
          component: string | null
          created_at: string
          error_type: string
          id: string
          message: string
          metadata: Json
          session_id: string | null
          stack: string | null
          surface: string | null
          url: string | null
          user_id: string | null
        }
        Insert: {
          component?: string | null
          created_at?: string
          error_type: string
          id?: string
          message: string
          metadata?: Json
          session_id?: string | null
          stack?: string | null
          surface?: string | null
          url?: string | null
          user_id?: string | null
        }
        Update: {
          component?: string | null
          created_at?: string
          error_type?: string
          id?: string
          message?: string
          metadata?: Json
          session_id?: string | null
          stack?: string | null
          surface?: string | null
          url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "obs_frontend_errors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      obs_rpc_logs: {
        Row: {
          caller_id: string | null
          created_at: string
          duration_ms: number
          error_code: string | null
          error_msg: string | null
          id: string
          rpc_name: string
          success: boolean
          surface: string | null
        }
        Insert: {
          caller_id?: string | null
          created_at?: string
          duration_ms: number
          error_code?: string | null
          error_msg?: string | null
          id?: string
          rpc_name: string
          success?: boolean
          surface?: string | null
        }
        Update: {
          caller_id?: string | null
          created_at?: string
          duration_ms?: number
          error_code?: string | null
          error_msg?: string | null
          id?: string
          rpc_name?: string
          success?: boolean
          surface?: string | null
        }
        Relationships: []
      }
      offer_letters: {
        Row: {
          application_id: string
          candidate_response_at: string | null
          compensation: Json
          created_at: string
          created_by: string
          id: string
          offer_expiry_date: string | null
          org_id: string
          revocation_reason: string | null
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          application_id: string
          candidate_response_at?: string | null
          compensation?: Json
          created_at?: string
          created_by: string
          id?: string
          offer_expiry_date?: string | null
          org_id: string
          revocation_reason?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          candidate_response_at?: string | null
          compensation?: Json
          created_at?: string
          created_by?: string
          id?: string
          offer_expiry_date?: string | null
          org_id?: string
          revocation_reason?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_letters_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "opportunity_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_letters_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_letters_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_brain_summary"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "offer_letters_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
            referencedRelation: "org_brain_summary"
            referencedColumns: ["org_id"]
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
            referencedRelation: "org_brain_summary"
            referencedColumns: ["org_id"]
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
      org_admin_invites: {
        Row: {
          consumed_at: string | null
          consumed_by: string | null
          created_at: string
          expires_at: string
          id: string
          invited_by: string
          invited_email: string
          org_id: string
          role: string
          token: string
        }
        Insert: {
          consumed_at?: string | null
          consumed_by?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          invited_by: string
          invited_email: string
          org_id: string
          role?: string
          token: string
        }
        Update: {
          consumed_at?: string | null
          consumed_by?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          invited_by?: string
          invited_email?: string
          org_id?: string
          role?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_admin_invites_consumed_by_fkey"
            columns: ["consumed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_admin_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_admin_invites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_brain_summary"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "org_admin_invites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_admins: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          org_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          org_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          org_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_admins_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_admins_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_brain_summary"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "org_admins_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_admins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            referencedRelation: "org_brain_summary"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "org_contacts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_culture_ratings: {
        Row: {
          cons: string | null
          created_at: string
          employment_status: string | null
          id: string
          is_anonymous: boolean
          is_verified_employee: boolean
          job_title: string | null
          org_id: string
          pros: string | null
          rater_id: string | null
          rating_compensation: number | null
          rating_culture: number | null
          rating_growth: number | null
          rating_management: number | null
          rating_overall: number | null
          rating_work_life: number | null
          status: string
          would_recommend: boolean | null
        }
        Insert: {
          cons?: string | null
          created_at?: string
          employment_status?: string | null
          id?: string
          is_anonymous?: boolean
          is_verified_employee?: boolean
          job_title?: string | null
          org_id: string
          pros?: string | null
          rater_id?: string | null
          rating_compensation?: number | null
          rating_culture?: number | null
          rating_growth?: number | null
          rating_management?: number | null
          rating_overall?: number | null
          rating_work_life?: number | null
          status?: string
          would_recommend?: boolean | null
        }
        Update: {
          cons?: string | null
          created_at?: string
          employment_status?: string | null
          id?: string
          is_anonymous?: boolean
          is_verified_employee?: boolean
          job_title?: string | null
          org_id?: string
          pros?: string | null
          rater_id?: string | null
          rating_compensation?: number | null
          rating_culture?: number | null
          rating_growth?: number | null
          rating_management?: number | null
          rating_overall?: number | null
          rating_work_life?: number | null
          status?: string
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "org_culture_ratings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_brain_summary"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "org_culture_ratings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_culture_ratings_rater_id_fkey"
            columns: ["rater_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      org_faq_upvotes: {
        Row: {
          created_at: string
          faq_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          faq_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          faq_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_faq_upvotes_faq_id_fkey"
            columns: ["faq_id"]
            isOneToOne: false
            referencedRelation: "org_faqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_faq_upvotes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      org_faqs: {
        Row: {
          answer: string | null
          answered_by: string | null
          asked_by: string | null
          created_at: string
          id: string
          is_anonymous: boolean
          is_official_answer: boolean
          org_id: string
          question: string
          status: string
          updated_at: string
          upvote_count: number
        }
        Insert: {
          answer?: string | null
          answered_by?: string | null
          asked_by?: string | null
          created_at?: string
          id?: string
          is_anonymous?: boolean
          is_official_answer?: boolean
          org_id: string
          question: string
          status?: string
          updated_at?: string
          upvote_count?: number
        }
        Update: {
          answer?: string | null
          answered_by?: string | null
          asked_by?: string | null
          created_at?: string
          id?: string
          is_anonymous?: boolean
          is_official_answer?: boolean
          org_id?: string
          question?: string
          status?: string
          updated_at?: string
          upvote_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "org_faqs_answered_by_fkey"
            columns: ["answered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_faqs_asked_by_fkey"
            columns: ["asked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_faqs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_brain_summary"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "org_faqs_org_id_fkey"
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
            referencedRelation: "org_brain_summary"
            referencedColumns: ["org_id"]
          },
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
      org_follows: {
        Row: {
          created_at: string | null
          follower_org_id: string
          following_org_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_org_id: string
          following_org_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_org_id?: string
          following_org_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_follows_follower_org_id_fkey"
            columns: ["follower_org_id"]
            isOneToOne: false
            referencedRelation: "org_brain_summary"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "org_follows_follower_org_id_fkey"
            columns: ["follower_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_follows_following_org_id_fkey"
            columns: ["following_org_id"]
            isOneToOne: false
            referencedRelation: "org_brain_summary"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "org_follows_following_org_id_fkey"
            columns: ["following_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_knowledge_items: {
        Row: {
          content: string | null
          content_type: string
          created_at: string
          created_by: string
          id: string
          org_id: string
          source_id: string | null
          tags: string[]
          title: string
          updated_at: string
          visibility: string
          workspace_id: string | null
        }
        Insert: {
          content?: string | null
          content_type?: string
          created_at?: string
          created_by: string
          id?: string
          org_id: string
          source_id?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          visibility?: string
          workspace_id?: string | null
        }
        Update: {
          content?: string | null
          content_type?: string
          created_at?: string
          created_by?: string
          id?: string
          org_id?: string
          source_id?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          visibility?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_knowledge_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_knowledge_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_brain_summary"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "org_knowledge_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_knowledge_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
            referencedRelation: "org_brain_summary"
            referencedColumns: ["org_id"]
          },
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
      org_memberships: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          invited_by: string | null
          joined_at: string
          membership_type: string
          org_id: string
          permissions: Json
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          invited_by?: string | null
          joined_at?: string
          membership_type?: string
          org_id: string
          permissions?: Json
          role?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          invited_by?: string | null
          joined_at?: string
          membership_type?: string
          org_id?: string
          permissions?: Json
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_memberships_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_memberships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_brain_summary"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "org_memberships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_memberships_user_id_fkey"
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
            referencedRelation: "org_brain_summary"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "org_metadata_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_salary_insights: {
        Row: {
          benefits: string | null
          created_at: string
          employment_type: string | null
          experience_years_max: number | null
          experience_years_min: number | null
          id: string
          is_anonymous: boolean
          is_verified_employee: boolean
          job_title: string
          location_city: string | null
          org_id: string
          salary_currency: string
          salary_max: number | null
          salary_min: number | null
          salary_period: string
          status: string
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          benefits?: string | null
          created_at?: string
          employment_type?: string | null
          experience_years_max?: number | null
          experience_years_min?: number | null
          id?: string
          is_anonymous?: boolean
          is_verified_employee?: boolean
          job_title: string
          location_city?: string | null
          org_id: string
          salary_currency?: string
          salary_max?: number | null
          salary_min?: number | null
          salary_period?: string
          status?: string
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          benefits?: string | null
          created_at?: string
          employment_type?: string | null
          experience_years_max?: number | null
          experience_years_min?: number | null
          id?: string
          is_anonymous?: boolean
          is_verified_employee?: boolean
          job_title?: string
          location_city?: string | null
          org_id?: string
          salary_currency?: string
          salary_max?: number | null
          salary_min?: number | null
          salary_period?: string
          status?: string
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_salary_insights_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_brain_summary"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "org_salary_insights_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_salary_insights_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            referencedRelation: "org_brain_summary"
            referencedColumns: ["org_id"]
          },
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
      org_verif_routes: {
        Row: {
          assigned_to_user_id: string | null
          condition_type: string | null
          condition_value: string | null
          created_at: string | null
          id: string
          org_id: string | null
          role_category: string | null
        }
        Insert: {
          assigned_to_user_id?: string | null
          condition_type?: string | null
          condition_value?: string | null
          created_at?: string | null
          id?: string
          org_id?: string | null
          role_category?: string | null
        }
        Update: {
          assigned_to_user_id?: string | null
          condition_type?: string | null
          condition_value?: string | null
          created_at?: string | null
          id?: string
          org_id?: string | null
          role_category?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_verif_routes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_brain_summary"
            referencedColumns: ["org_id"]
          },
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
          employee_count: number | null
          followers_count: number | null
          founded_year: number | null
          full_address: string | null
          id: string
          industry: string | null
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
          status: string
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
          employee_count?: number | null
          followers_count?: number | null
          founded_year?: number | null
          full_address?: string | null
          id?: string
          industry?: string | null
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
          status?: string
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
          employee_count?: number | null
          followers_count?: number | null
          founded_year?: number | null
          full_address?: string | null
          id?: string
          industry?: string | null
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
          status?: string
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
          encrypted_body: string | null
          id: string
          is_deleted: boolean | null
          is_encrypted: boolean | null
          is_opener: boolean | null
          is_read: boolean | null
          nonce: string | null
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
          encrypted_body?: string | null
          id?: string
          is_deleted?: boolean | null
          is_encrypted?: boolean | null
          is_opener?: boolean | null
          is_read?: boolean | null
          nonce?: string | null
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
          encrypted_body?: string | null
          id?: string
          is_deleted?: boolean | null
          is_encrypted?: boolean | null
          is_opener?: boolean | null
          is_read?: boolean | null
          nonce?: string | null
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
      platform_roles: {
        Row: {
          created_at: string
          granted_at: string
          granted_by: string | null
          id: string
          notes: string | null
          revocation_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          notes?: string | null
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          notes?: string | null
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_roles_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      post_content_hashes: {
        Row: {
          author_id: string | null
          content_hash: string | null
          content_preview: string | null
          created_at: string | null
          id: string
        }
        Insert: {
          author_id?: string | null
          content_hash?: string | null
          content_preview?: string | null
          created_at?: string | null
          id?: string
        }
        Update: {
          author_id?: string | null
          content_hash?: string | null
          content_preview?: string | null
          created_at?: string | null
          id?: string
        }
        Relationships: []
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
            referencedRelation: "org_brain_summary"
            referencedColumns: ["org_id"]
          },
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
          content_id: string | null
          content_type: string | null
          created_at: string | null
          id: string
          notes: string | null
          post_id: string | null
          reason: string | null
          reporter_id: string | null
          status: string
        }
        Insert: {
          content_id?: string | null
          content_type?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          post_id?: string | null
          reason?: string | null
          reporter_id?: string | null
          status?: string
        }
        Update: {
          content_id?: string | null
          content_type?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          post_id?: string | null
          reason?: string | null
          reporter_id?: string | null
          status?: string
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
            referencedRelation: "org_brain_summary"
            referencedColumns: ["org_id"]
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
          author_id: string
          comment_count: number
          content: string
          created_at: string | null
          hashtags: string[] | null
          id: string
          image_urls: string[] | null
          is_edited: boolean | null
          is_featured: boolean
          is_shared_to_feed: boolean | null
          like_count: number
          pdf_url: string | null
          post_type: string | null
          posted_by_org: string | null
          posted_by_user_id: string | null
          reactions: Json | null
          repost_count: number | null
          repost_of: string | null
          share_count: number
          show_company_badge: boolean | null
          type: string | null
          updated_at: string | null
          view_count: number
          visibility: string | null
          work_item_id: string | null
          workspace_id: string | null
          workspace_name: string | null
        }
        Insert: {
          author_id: string
          comment_count?: number
          content: string
          created_at?: string | null
          hashtags?: string[] | null
          id?: string
          image_urls?: string[] | null
          is_edited?: boolean | null
          is_featured?: boolean
          is_shared_to_feed?: boolean | null
          like_count?: number
          pdf_url?: string | null
          post_type?: string | null
          posted_by_org?: string | null
          posted_by_user_id?: string | null
          reactions?: Json | null
          repost_count?: number | null
          repost_of?: string | null
          share_count?: number
          show_company_badge?: boolean | null
          type?: string | null
          updated_at?: string | null
          view_count?: number
          visibility?: string | null
          work_item_id?: string | null
          workspace_id?: string | null
          workspace_name?: string | null
        }
        Update: {
          author_id?: string
          comment_count?: number
          content?: string
          created_at?: string | null
          hashtags?: string[] | null
          id?: string
          image_urls?: string[] | null
          is_edited?: boolean | null
          is_featured?: boolean
          is_shared_to_feed?: boolean | null
          like_count?: number
          pdf_url?: string | null
          post_type?: string | null
          posted_by_org?: string | null
          posted_by_user_id?: string | null
          reactions?: Json | null
          repost_count?: number | null
          repost_of?: string | null
          share_count?: number
          show_company_badge?: boolean | null
          type?: string | null
          updated_at?: string | null
          view_count?: number
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
            referencedRelation: "org_brain_summary"
            referencedColumns: ["org_id"]
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
          end_date: string | null
          id: string
          role_type: string
          start_date: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          role_type: string
          start_date?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          role_type?: string
          start_date?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_verification_state: {
        Row: {
          created_at: string
          evidence_id: string | null
          evidence_type: string | null
          expires_at: string | null
          id: string
          issued_at: string
          issuer_org_id: string | null
          metadata: Json
          request_id: string | null
          revoked_at: string | null
          revoked_reason: string | null
          status: string
          subject_user_id: string
          target_item_id: string | null
          updated_at: string
          verification_type: string
          verifier_user_id: string | null
        }
        Insert: {
          created_at?: string
          evidence_id?: string | null
          evidence_type?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string
          issuer_org_id?: string | null
          metadata?: Json
          request_id?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          status: string
          subject_user_id: string
          target_item_id?: string | null
          updated_at?: string
          verification_type: string
          verifier_user_id?: string | null
        }
        Update: {
          created_at?: string
          evidence_id?: string | null
          evidence_type?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string
          issuer_org_id?: string | null
          metadata?: Json
          request_id?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          status?: string
          subject_user_id?: string
          target_item_id?: string | null
          updated_at?: string
          verification_type?: string
          verifier_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_verification_state_evidence_id_fkey"
            columns: ["evidence_id"]
            isOneToOne: false
            referencedRelation: "verification_evidence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_verification_state_issuer_org_id_fkey"
            columns: ["issuer_org_id"]
            isOneToOne: false
            referencedRelation: "org_brain_summary"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "profile_verification_state_issuer_org_id_fkey"
            columns: ["issuer_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_verification_state_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "verification_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_verification_state_subject_user_id_fkey"
            columns: ["subject_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_verification_state_verifier_user_id_fkey"
            columns: ["verifier_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          about: string | null
          about_qa: Json | null
          account_type: string | null
          activity_score: number | null
          activity_score_v2_live: boolean | null
          avatar_url: string | null
          bio: string | null
          clean_username: string | null
          contact_email_visible: boolean | null
          country: string | null
          cover_url: string | null
          created_at: string | null
          currently_working_at: string | null
          custom_links: Json | null
          days_active: number | null
          deletion_requested_at: string | null
          department: string | null
          designation: string | null
          display_preference: string | null
          email: string | null
          follower_count: number | null
          following_count: number | null
          full_name: string | null
          headline: string | null
          id: string
          institution_id: string | null
          institution_name: string | null
          interests: string[] | null
          is_moderator: boolean
          is_public: boolean | null
          is_verified: boolean | null
          key_created_at: string | null
          languages: string[] | null
          last_active_date: string | null
          last_onboarding_step: number | null
          location_city: string | null
          location_district: string | null
          location_state: string | null
          onboarding_complete: boolean | null
          open_to_work: boolean | null
          open_to_work_preferences: Json | null
          org_id: string | null
          otw_visibility: string | null
          pending_deletion: boolean
          phone: string | null
          phone_hash: string | null
          privacy: Json
          privacy_settings: Json | null
          profession_type: string | null
          public_key: string | null
          referred_by: string | null
          role: string | null
          role_metadata: Json | null
          role_subtype: string | null
          score_penalty: number | null
          section_order: Json | null
          sector: string | null
          skills: string[] | null
          spam_flag_count: number | null
          status: string | null
          terms_accepted_at: string | null
          terms_version: string | null
          theme_preference: string | null
          updated_at: string | null
          username: string | null
          verification_badge_text: string | null
          verification_type: string | null
          verified_at: string | null
          verified_by: string | null
          years_exp: string | null
        }
        Insert: {
          about?: string | null
          about_qa?: Json | null
          account_type?: string | null
          activity_score?: number | null
          activity_score_v2_live?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          clean_username?: string | null
          contact_email_visible?: boolean | null
          country?: string | null
          cover_url?: string | null
          created_at?: string | null
          currently_working_at?: string | null
          custom_links?: Json | null
          days_active?: number | null
          deletion_requested_at?: string | null
          department?: string | null
          designation?: string | null
          display_preference?: string | null
          email?: string | null
          follower_count?: number | null
          following_count?: number | null
          full_name?: string | null
          headline?: string | null
          id: string
          institution_id?: string | null
          institution_name?: string | null
          interests?: string[] | null
          is_moderator?: boolean
          is_public?: boolean | null
          is_verified?: boolean | null
          key_created_at?: string | null
          languages?: string[] | null
          last_active_date?: string | null
          last_onboarding_step?: number | null
          location_city?: string | null
          location_district?: string | null
          location_state?: string | null
          onboarding_complete?: boolean | null
          open_to_work?: boolean | null
          open_to_work_preferences?: Json | null
          org_id?: string | null
          otw_visibility?: string | null
          pending_deletion?: boolean
          phone?: string | null
          phone_hash?: string | null
          privacy?: Json
          privacy_settings?: Json | null
          profession_type?: string | null
          public_key?: string | null
          referred_by?: string | null
          role?: string | null
          role_metadata?: Json | null
          role_subtype?: string | null
          score_penalty?: number | null
          section_order?: Json | null
          sector?: string | null
          skills?: string[] | null
          spam_flag_count?: number | null
          status?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          theme_preference?: string | null
          updated_at?: string | null
          username?: string | null
          verification_badge_text?: string | null
          verification_type?: string | null
          verified_at?: string | null
          verified_by?: string | null
          years_exp?: string | null
        }
        Update: {
          about?: string | null
          about_qa?: Json | null
          account_type?: string | null
          activity_score?: number | null
          activity_score_v2_live?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          clean_username?: string | null
          contact_email_visible?: boolean | null
          country?: string | null
          cover_url?: string | null
          created_at?: string | null
          currently_working_at?: string | null
          custom_links?: Json | null
          days_active?: number | null
          deletion_requested_at?: string | null
          department?: string | null
          designation?: string | null
          display_preference?: string | null
          email?: string | null
          follower_count?: number | null
          following_count?: number | null
          full_name?: string | null
          headline?: string | null
          id?: string
          institution_id?: string | null
          institution_name?: string | null
          interests?: string[] | null
          is_moderator?: boolean
          is_public?: boolean | null
          is_verified?: boolean | null
          key_created_at?: string | null
          languages?: string[] | null
          last_active_date?: string | null
          last_onboarding_step?: number | null
          location_city?: string | null
          location_district?: string | null
          location_state?: string | null
          onboarding_complete?: boolean | null
          open_to_work?: boolean | null
          open_to_work_preferences?: Json | null
          org_id?: string | null
          otw_visibility?: string | null
          pending_deletion?: boolean
          phone?: string | null
          phone_hash?: string | null
          privacy?: Json
          privacy_settings?: Json | null
          profession_type?: string | null
          public_key?: string | null
          referred_by?: string | null
          role?: string | null
          role_metadata?: Json | null
          role_subtype?: string | null
          score_penalty?: number | null
          section_order?: Json | null
          sector?: string | null
          skills?: string[] | null
          spam_flag_count?: number | null
          status?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          theme_preference?: string | null
          updated_at?: string | null
          username?: string | null
          verification_badge_text?: string | null
          verification_type?: string | null
          verified_at?: string | null
          verified_by?: string | null
          years_exp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_brain_summary"
            referencedColumns: ["org_id"]
          },
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
      trust_badges: {
        Row: {
          badge_type: string
          confidence_score: number
          created_at: string
          evidence_id: string | null
          expires_at: string | null
          id: string
          issued_at: string
          issued_by_org_id: string | null
          issued_by_user_id: string | null
          issued_reason: string | null
          metadata: Json
          revoked_at: string | null
          revoked_reason: string | null
          score_id: string | null
          status: string
          subject_category: string
          subject_org_id: string | null
          subject_page_id: string | null
          subject_profile_id: string | null
          updated_at: string
          verification_state_id: string | null
        }
        Insert: {
          badge_type: string
          confidence_score?: number
          created_at?: string
          evidence_id?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string
          issued_by_org_id?: string | null
          issued_by_user_id?: string | null
          issued_reason?: string | null
          metadata?: Json
          revoked_at?: string | null
          revoked_reason?: string | null
          score_id?: string | null
          status?: string
          subject_category: string
          subject_org_id?: string | null
          subject_page_id?: string | null
          subject_profile_id?: string | null
          updated_at?: string
          verification_state_id?: string | null
        }
        Update: {
          badge_type?: string
          confidence_score?: number
          created_at?: string
          evidence_id?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string
          issued_by_org_id?: string | null
          issued_by_user_id?: string | null
          issued_reason?: string | null
          metadata?: Json
          revoked_at?: string | null
          revoked_reason?: string | null
          score_id?: string | null
          status?: string
          subject_category?: string
          subject_org_id?: string | null
          subject_page_id?: string | null
          subject_profile_id?: string | null
          updated_at?: string
          verification_state_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trust_badges_evidence_id_fkey"
            columns: ["evidence_id"]
            isOneToOne: false
            referencedRelation: "trust_evidence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_badges_issued_by_org_id_fkey"
            columns: ["issued_by_org_id"]
            isOneToOne: false
            referencedRelation: "org_brain_summary"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "trust_badges_issued_by_org_id_fkey"
            columns: ["issued_by_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_badges_issued_by_user_id_fkey"
            columns: ["issued_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_badges_score_id_fkey"
            columns: ["score_id"]
            isOneToOne: false
            referencedRelation: "trust_scores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_badges_subject_org_id_fkey"
            columns: ["subject_org_id"]
            isOneToOne: false
            referencedRelation: "org_brain_summary"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "trust_badges_subject_org_id_fkey"
            columns: ["subject_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_badges_subject_page_id_fkey"
            columns: ["subject_page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_badges_subject_profile_id_fkey"
            columns: ["subject_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_badges_verification_state_id_fkey"
            columns: ["verification_state_id"]
            isOneToOne: false
            referencedRelation: "profile_verification_state"
            referencedColumns: ["id"]
          },
        ]
      }
      trust_checks: {
        Row: {
          actor_user_id: string | null
          check_type: string
          checked_at: string
          confidence_score: number
          created_at: string
          evidence_id: string | null
          id: string
          next_check_at: string | null
          notes: string | null
          outcome: string
          performed_by: string
          result_payload: Json
          risk_level: string
          subject_category: string
          subject_org_id: string | null
          subject_page_id: string | null
          subject_profile_id: string | null
          updated_at: string
        }
        Insert: {
          actor_user_id?: string | null
          check_type: string
          checked_at?: string
          confidence_score?: number
          created_at?: string
          evidence_id?: string | null
          id?: string
          next_check_at?: string | null
          notes?: string | null
          outcome: string
          performed_by?: string
          result_payload?: Json
          risk_level?: string
          subject_category: string
          subject_org_id?: string | null
          subject_page_id?: string | null
          subject_profile_id?: string | null
          updated_at?: string
        }
        Update: {
          actor_user_id?: string | null
          check_type?: string
          checked_at?: string
          confidence_score?: number
          created_at?: string
          evidence_id?: string | null
          id?: string
          next_check_at?: string | null
          notes?: string | null
          outcome?: string
          performed_by?: string
          result_payload?: Json
          risk_level?: string
          subject_category?: string
          subject_org_id?: string | null
          subject_page_id?: string | null
          subject_profile_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trust_checks_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_checks_evidence_id_fkey"
            columns: ["evidence_id"]
            isOneToOne: false
            referencedRelation: "trust_evidence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_checks_subject_org_id_fkey"
            columns: ["subject_org_id"]
            isOneToOne: false
            referencedRelation: "org_brain_summary"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "trust_checks_subject_org_id_fkey"
            columns: ["subject_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_checks_subject_page_id_fkey"
            columns: ["subject_page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_checks_subject_profile_id_fkey"
            columns: ["subject_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trust_events: {
        Row: {
          actor_role: string
          actor_user_id: string | null
          badge_id: string | null
          check_id: string | null
          created_at: string
          event_type: string
          evidence_id: string | null
          id: string
          note: string | null
          payload: Json
          score_id: string | null
          subject_category: string | null
          subject_org_id: string | null
          subject_page_id: string | null
          subject_profile_id: string | null
          verification_request_id: string | null
          verification_state_id: string | null
        }
        Insert: {
          actor_role?: string
          actor_user_id?: string | null
          badge_id?: string | null
          check_id?: string | null
          created_at?: string
          event_type: string
          evidence_id?: string | null
          id?: string
          note?: string | null
          payload?: Json
          score_id?: string | null
          subject_category?: string | null
          subject_org_id?: string | null
          subject_page_id?: string | null
          subject_profile_id?: string | null
          verification_request_id?: string | null
          verification_state_id?: string | null
        }
        Update: {
          actor_role?: string
          actor_user_id?: string | null
          badge_id?: string | null
          check_id?: string | null
          created_at?: string
          event_type?: string
          evidence_id?: string | null
          id?: string
          note?: string | null
          payload?: Json
          score_id?: string | null
          subject_category?: string | null
          subject_org_id?: string | null
          subject_page_id?: string | null
          subject_profile_id?: string | null
          verification_request_id?: string | null
          verification_state_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trust_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_events_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "trust_badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_events_check_id_fkey"
            columns: ["check_id"]
            isOneToOne: false
            referencedRelation: "trust_checks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_events_evidence_id_fkey"
            columns: ["evidence_id"]
            isOneToOne: false
            referencedRelation: "trust_evidence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_events_score_id_fkey"
            columns: ["score_id"]
            isOneToOne: false
            referencedRelation: "trust_scores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_events_subject_org_id_fkey"
            columns: ["subject_org_id"]
            isOneToOne: false
            referencedRelation: "org_brain_summary"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "trust_events_subject_org_id_fkey"
            columns: ["subject_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_events_subject_page_id_fkey"
            columns: ["subject_page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_events_subject_profile_id_fkey"
            columns: ["subject_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_events_verification_request_id_fkey"
            columns: ["verification_request_id"]
            isOneToOne: false
            referencedRelation: "verification_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_events_verification_state_id_fkey"
            columns: ["verification_state_id"]
            isOneToOne: false
            referencedRelation: "profile_verification_state"
            referencedColumns: ["id"]
          },
        ]
      }
      trust_evidence: {
        Row: {
          collected_by_user_id: string | null
          confidence_score: number
          created_at: string
          document_path: string | null
          evidence_hash: string | null
          evidence_type: string
          evidence_value: string | null
          expires_at: string | null
          id: string
          last_checked_at: string | null
          metadata: Json
          observed_at: string
          source_label: string | null
          source_reference: string | null
          source_type: string
          source_url: string | null
          status: string
          subject_category: string
          subject_org_id: string | null
          subject_page_id: string | null
          subject_profile_id: string | null
          updated_at: string
          verification_request_id: string | null
          verification_state_id: string | null
          verified_at: string | null
        }
        Insert: {
          collected_by_user_id?: string | null
          confidence_score?: number
          created_at?: string
          document_path?: string | null
          evidence_hash?: string | null
          evidence_type: string
          evidence_value?: string | null
          expires_at?: string | null
          id?: string
          last_checked_at?: string | null
          metadata?: Json
          observed_at?: string
          source_label?: string | null
          source_reference?: string | null
          source_type?: string
          source_url?: string | null
          status?: string
          subject_category: string
          subject_org_id?: string | null
          subject_page_id?: string | null
          subject_profile_id?: string | null
          updated_at?: string
          verification_request_id?: string | null
          verification_state_id?: string | null
          verified_at?: string | null
        }
        Update: {
          collected_by_user_id?: string | null
          confidence_score?: number
          created_at?: string
          document_path?: string | null
          evidence_hash?: string | null
          evidence_type?: string
          evidence_value?: string | null
          expires_at?: string | null
          id?: string
          last_checked_at?: string | null
          metadata?: Json
          observed_at?: string
          source_label?: string | null
          source_reference?: string | null
          source_type?: string
          source_url?: string | null
          status?: string
          subject_category?: string
          subject_org_id?: string | null
          subject_page_id?: string | null
          subject_profile_id?: string | null
          updated_at?: string
          verification_request_id?: string | null
          verification_state_id?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trust_evidence_collected_by_user_id_fkey"
            columns: ["collected_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_evidence_subject_org_id_fkey"
            columns: ["subject_org_id"]
            isOneToOne: false
            referencedRelation: "org_brain_summary"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "trust_evidence_subject_org_id_fkey"
            columns: ["subject_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_evidence_subject_page_id_fkey"
            columns: ["subject_page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_evidence_subject_profile_id_fkey"
            columns: ["subject_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_evidence_verification_request_id_fkey"
            columns: ["verification_request_id"]
            isOneToOne: false
            referencedRelation: "verification_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_evidence_verification_state_id_fkey"
            columns: ["verification_state_id"]
            isOneToOne: false
            referencedRelation: "profile_verification_state"
            referencedColumns: ["id"]
          },
        ]
      }
      trust_scores: {
        Row: {
          computed_by: string
          computed_by_user_id: string | null
          consistency_score: number
          created_at: string
          expires_at: string | null
          explanation: string | null
          failed_signal_count: number
          id: string
          internal_notes: string | null
          last_recomputed_at: string
          legal_existence_score: number
          metadata: Json
          model_version: string
          next_review_at: string | null
          overall_score: number
          ownership_control_score: number
          public_presence_score: number
          relationship_score: number
          risk_score: number
          subject_category: string
          subject_org_id: string | null
          subject_page_id: string | null
          subject_profile_id: string | null
          updated_at: string
          valid_signal_count: number
          verdict: string
        }
        Insert: {
          computed_by?: string
          computed_by_user_id?: string | null
          consistency_score?: number
          created_at?: string
          expires_at?: string | null
          explanation?: string | null
          failed_signal_count?: number
          id?: string
          internal_notes?: string | null
          last_recomputed_at?: string
          legal_existence_score?: number
          metadata?: Json
          model_version?: string
          next_review_at?: string | null
          overall_score?: number
          ownership_control_score?: number
          public_presence_score?: number
          relationship_score?: number
          risk_score?: number
          subject_category: string
          subject_org_id?: string | null
          subject_page_id?: string | null
          subject_profile_id?: string | null
          updated_at?: string
          valid_signal_count?: number
          verdict: string
        }
        Update: {
          computed_by?: string
          computed_by_user_id?: string | null
          consistency_score?: number
          created_at?: string
          expires_at?: string | null
          explanation?: string | null
          failed_signal_count?: number
          id?: string
          internal_notes?: string | null
          last_recomputed_at?: string
          legal_existence_score?: number
          metadata?: Json
          model_version?: string
          next_review_at?: string | null
          overall_score?: number
          ownership_control_score?: number
          public_presence_score?: number
          relationship_score?: number
          risk_score?: number
          subject_category?: string
          subject_org_id?: string | null
          subject_page_id?: string | null
          subject_profile_id?: string | null
          updated_at?: string
          valid_signal_count?: number
          verdict?: string
        }
        Relationships: [
          {
            foreignKeyName: "trust_scores_computed_by_user_id_fkey"
            columns: ["computed_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_scores_subject_org_id_fkey"
            columns: ["subject_org_id"]
            isOneToOne: false
            referencedRelation: "org_brain_summary"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "trust_scores_subject_org_id_fkey"
            columns: ["subject_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_scores_subject_page_id_fkey"
            columns: ["subject_page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_scores_subject_profile_id_fkey"
            columns: ["subject_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      user_follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_following_id_fkey"
            columns: ["following_id"]
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
      user_restrictions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          imposed_at: string
          imposed_by: string | null
          lifted_at: string | null
          lifted_by: string | null
          notes: string | null
          reason: string | null
          restriction: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          imposed_at?: string
          imposed_by?: string | null
          lifted_at?: string | null
          lifted_by?: string | null
          notes?: string | null
          reason?: string | null
          restriction: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          imposed_at?: string
          imposed_by?: string | null
          lifted_at?: string | null
          lifted_by?: string | null
          notes?: string | null
          reason?: string | null
          restriction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_restrictions_imposed_by_fkey"
            columns: ["imposed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_restrictions_lifted_by_fkey"
            columns: ["lifted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_restrictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_events: {
        Row: {
          actor_role: string | null
          actor_user_id: string | null
          created_at: string
          event_type: string
          id: string
          note: string | null
          payload: Json
          request_id: string
        }
        Insert: {
          actor_role?: string | null
          actor_user_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          note?: string | null
          payload?: Json
          request_id: string
        }
        Update: {
          actor_role?: string | null
          actor_user_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          note?: string | null
          payload?: Json
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_events_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "verification_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_evidence: {
        Row: {
          created_at: string
          evidence_type: string | null
          file_name: string | null
          file_size_bytes: number | null
          id: string
          is_primary: boolean
          metadata: Json
          mime_type: string | null
          notes: string | null
          request_id: string
          status: string
          storage_bucket: string
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          evidence_type?: string | null
          file_name?: string | null
          file_size_bytes?: number | null
          id?: string
          is_primary?: boolean
          metadata?: Json
          mime_type?: string | null
          notes?: string | null
          request_id: string
          status?: string
          storage_bucket?: string
          storage_path: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          evidence_type?: string | null
          file_name?: string | null
          file_size_bytes?: number | null
          id?: string
          is_primary?: boolean
          metadata?: Json
          mime_type?: string | null
          notes?: string | null
          request_id?: string
          status?: string
          storage_bucket?: string
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_evidence_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "verification_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_evidence_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_requests: {
        Row: {
          assigned_to: string | null
          auto_triggered: boolean | null
          context_note: string | null
          created_at: string | null
          document_type: string | null
          document_url: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          item_id: string
          item_type: string
          org_id: string | null
          rejection_reason: string | null
          requested_doc_message: string | null
          requested_role: string | null
          requested_verification_type: string | null
          requester_id: string
          resolved_at: string | null
          review_note: string | null
          review_queue: string
          review_thread: Json | null
          reviewed_by: string | null
          role_category: string | null
          status: string | null
          submitted_id: string
          supporting_doc_url: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          auto_triggered?: boolean | null
          context_note?: string | null
          created_at?: string | null
          document_type?: string | null
          document_url?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          item_id: string
          item_type?: string
          org_id?: string | null
          rejection_reason?: string | null
          requested_doc_message?: string | null
          requested_role?: string | null
          requested_verification_type?: string | null
          requester_id: string
          resolved_at?: string | null
          review_note?: string | null
          review_queue?: string
          review_thread?: Json | null
          reviewed_by?: string | null
          role_category?: string | null
          status?: string | null
          submitted_id?: string
          supporting_doc_url?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          auto_triggered?: boolean | null
          context_note?: string | null
          created_at?: string | null
          document_type?: string | null
          document_url?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          item_id?: string
          item_type?: string
          org_id?: string | null
          rejection_reason?: string | null
          requested_doc_message?: string | null
          requested_role?: string | null
          requested_verification_type?: string | null
          requester_id?: string
          resolved_at?: string | null
          review_note?: string | null
          review_queue?: string
          review_thread?: Json | null
          reviewed_by?: string | null
          role_category?: string | null
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
            referencedRelation: "org_brain_summary"
            referencedColumns: ["org_id"]
          },
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
      verified_employment_claims: {
        Row: {
          claim_kind: string
          claimed_role: string | null
          created_at: string
          evidence_id: string | null
          expires_at: string | null
          id: string
          issuer_org_id: string
          metadata: Json
          org_id: string
          org_member_id: string | null
          request_id: string | null
          revoked_at: string | null
          revoked_reason: string | null
          role_category: string | null
          status: string
          subject_user_id: string
          updated_at: string
          verified_at: string
          verifier_user_id: string | null
        }
        Insert: {
          claim_kind: string
          claimed_role?: string | null
          created_at?: string
          evidence_id?: string | null
          expires_at?: string | null
          id?: string
          issuer_org_id: string
          metadata?: Json
          org_id: string
          org_member_id?: string | null
          request_id?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          role_category?: string | null
          status?: string
          subject_user_id: string
          updated_at?: string
          verified_at?: string
          verifier_user_id?: string | null
        }
        Update: {
          claim_kind?: string
          claimed_role?: string | null
          created_at?: string
          evidence_id?: string | null
          expires_at?: string | null
          id?: string
          issuer_org_id?: string
          metadata?: Json
          org_id?: string
          org_member_id?: string | null
          request_id?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          role_category?: string | null
          status?: string
          subject_user_id?: string
          updated_at?: string
          verified_at?: string
          verifier_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verified_employment_claims_evidence_id_fkey"
            columns: ["evidence_id"]
            isOneToOne: false
            referencedRelation: "verification_evidence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verified_employment_claims_issuer_org_id_fkey"
            columns: ["issuer_org_id"]
            isOneToOne: false
            referencedRelation: "org_brain_summary"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "verified_employment_claims_issuer_org_id_fkey"
            columns: ["issuer_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verified_employment_claims_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_brain_summary"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "verified_employment_claims_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verified_employment_claims_org_member_id_fkey"
            columns: ["org_member_id"]
            isOneToOne: false
            referencedRelation: "org_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verified_employment_claims_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "verification_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verified_employment_claims_subject_user_id_fkey"
            columns: ["subject_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verified_employment_claims_verifier_user_id_fkey"
            columns: ["verifier_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          work_item_id: string | null
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
          work_item_id?: string | null
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
          work_item_id?: string | null
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
          {
            foreignKeyName: "workspace_messages_work_item_id_fkey"
            columns: ["work_item_id"]
            isOneToOne: false
            referencedRelation: "work_items"
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
      obs_v_dau: {
        Row: {
          dau: number | null
          day: string | null
          total_events: number | null
        }
        Relationships: []
      }
      obs_v_error_rate: {
        Row: {
          bucket: string | null
          cnt: number | null
          error_type: string | null
          surface: string | null
        }
        Relationships: []
      }
      obs_v_product_funnel: {
        Row: {
          cnt: number | null
          event: string | null
          hour: string | null
          surface: string | null
          unique_users: number | null
        }
        Relationships: []
      }
      obs_v_rpc_health: {
        Row: {
          avg_ms: number | null
          calls: number | null
          errors: number | null
          p50_ms: number | null
          p95_ms: number | null
          p99_ms: number | null
          rpc_name: string | null
        }
        Relationships: []
      }
      obs_v_surface_health: {
        Row: {
          errors_1h: number | null
          errors_5m: number | null
          errors_6h: number | null
          last_error_at: string | null
          surface: string | null
        }
        Relationships: []
      }
      org_brain_summary: {
        Row: {
          faqs_answered: number | null
          faqs_open: number | null
          is_verified: boolean | null
          org_id: string | null
          org_name: string | null
          org_type: string | null
          rating_compensation: number | null
          rating_growth: number | null
          rating_management: number | null
          rating_overall: number | null
          rating_work_life: number | null
          salary_summary: Json | null
          total_ratings: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      apply_to_opportunity: {
        Args: {
          p_cover_letter?: string
          p_cover_note?: string
          p_custom_answers?: Json
          p_opportunity_id: string
          p_portfolio_url?: string
          p_resume_url?: string
          p_why_good_fit?: string
          p_work_items?: string[]
        }
        Returns: Json
      }
      approve_employer_endorsement: {
        Args: { _endorsement_id: string }
        Returns: Json
      }
      approve_verification_request: {
        Args: { p_request_id: string; p_review_note?: string }
        Returns: Json
      }
      are_users_connected: {
        Args: { _a: string; _b: string }
        Returns: boolean
      }
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
      build_domain_verification_instructions: {
        Args: { _domain: string; _method: string; _raw_token: string }
        Returns: Json
      }
      calculate_activity_score: { Args: { p_user_id: string }; Returns: number }
      calculate_activity_score_v2: { Args: { uid: string }; Returns: number }
      calculate_circle_post_hot_score: {
        Args: { p_id: string }
        Returns: number
      }
      can_message_user: { Args: { _target: string }; Returns: boolean }
      circle_add_moderator: {
        Args: { p_circle_id: string; p_user_id: string }
        Returns: undefined
      }
      circle_archive: {
        Args: { p_circle_id: string; p_status?: string }
        Returns: undefined
      }
      circle_flag_post: {
        Args: {
          p_circle_id: string
          p_flagged?: boolean
          p_post_id: string
          p_reason?: string
        }
        Returns: undefined
      }
      circle_pin_post: {
        Args: { p_circle_id: string; p_pinned?: boolean; p_post_id: string }
        Returns: undefined
      }
      circle_remove_moderator: {
        Args: { p_circle_id: string; p_user_id: string }
        Returns: undefined
      }
      complete_interview: {
        Args: { p_interview_id: string; p_notes?: string; p_outcome?: string }
        Returns: Json
      }
      confirm_domain_verification_challenge: {
        Args: {
          _challenge_id: string
          _observed_payload?: Json
          _provided_token?: string
        }
        Returns: Json
      }
      create_domain_verification_challenge: {
        Args: {
          _domain_or_email?: string
          _evidence_type?: string
          _method?: string
          _subject_org_id?: string
          _subject_page_id?: string
          _subject_profile_id?: string
        }
        Returns: Json
      }
      create_notification: {
        Args: {
          p_action_url?: string
          p_actor_id?: string
          p_body?: string
          p_category?: string
          p_data?: Json
          p_expires_at?: string
          p_group_key?: string
          p_priority?: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: undefined
      }
      cron_refresh_circle_post_hot: { Args: never; Returns: undefined }
      current_user_can_manage_trust_subject: {
        Args: {
          _subject_org_id?: string
          _subject_page_id?: string
          _subject_profile_id?: string
        }
        Returns: boolean
      }
      current_user_has_restriction: {
        Args: { p_restriction: string }
        Returns: boolean
      }
      current_user_is_active: { Args: never; Returns: boolean }
      current_user_is_circle_mod: {
        Args: { p_circle_id: string }
        Returns: boolean
      }
      current_user_is_circle_owner: {
        Args: { p_circle_id: string }
        Returns: boolean
      }
      current_user_is_moderator: { Args: never; Returns: boolean }
      current_user_is_platform_admin: { Args: never; Returns: boolean }
      current_user_platform_role: { Args: never; Returns: string }
      derive_requested_verification_type: {
        Args: { _entity_type: string; _org_id: string }
        Returns: string
      }
      derive_trust_subject_category: {
        Args: {
          _subject_org_id?: string
          _subject_page_id?: string
          _subject_profile_id?: string
        }
        Returns: string
      }
      expire_domain_verification_challenges: { Args: never; Returns: Json }
      expire_stale_verifications: { Args: never; Returns: number }
      generate_clean_username: {
        Args: { p_full_name: string; p_user_id: string }
        Returns: string
      }
      get_application_status: {
        Args: { p_opportunity_id: string; p_user_id: string }
        Returns: string
      }
      get_clean_username: { Args: { raw_username: string }; Returns: string }
      get_explore_profiles: {
        Args: { p_cursor?: number; p_limit?: number; p_role?: string }
        Returns: Json
      }
      get_feed_posts: {
        Args: { p_cursor?: string; p_limit?: number }
        Returns: Json
      }
      get_my_contact: {
        Args: never
        Returns: {
          email: string
          phone: string
        }[]
      }
      get_page_tracker_count: { Args: { p_page_id: string }; Returns: number }
      get_profile_completion_score: { Args: { p_id: string }; Returns: number }
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
      grant_platform_role: {
        Args: { p_notes?: string; p_role: string; p_user_id: string }
        Returns: Json
      }
      impose_restriction: {
        Args: {
          p_expires_at?: string
          p_notes?: string
          p_reason?: string
          p_restriction: string
          p_user_id: string
        }
        Returns: string
      }
      increment_days_active: { Args: { uid: string }; Returns: undefined }
      increment_score: {
        Args: { amount: number; uid: string }
        Returns: undefined
      }
      internal_recompute_trust_score: {
        Args: {
          _actor_role?: string
          _actor_user_id?: string
          _note?: string
          _subject_category?: string
          _subject_org_id?: string
          _subject_page_id?: string
          _subject_profile_id?: string
        }
        Returns: Json
      }
      is_moderator: { Args: { _user_id: string }; Returns: boolean }
      is_org_admin: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_admin_m5: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_platform_verification_reviewer: {
        Args: { _user_id: string }
        Returns: boolean
      }
      issue_domain_verified_badge_if_eligible: {
        Args: { _reason?: string; _trust_evidence_id: string }
        Returns: string
      }
      lift_restriction: {
        Args: { p_notes?: string; p_restriction_id: string }
        Returns: undefined
      }
      match_opportunities_for_user: {
        Args: { p_user_id: string }
        Returns: {
          match_score: number
          opportunity_id: string
        }[]
      }
      materialize_verification_from_request: {
        Args: { _request_id: string }
        Returns: undefined
      }
      normalize_trust_domain_input: {
        Args: { _evidence_type: string; _input: string }
        Returns: string
      }
      obs_capture_db_failures: { Args: never; Returns: number }
      obs_check_alerts: {
        Args: never
        Returns: {
          fired: boolean
          metric_value: number
          rule_name: string
          severity: string
        }[]
      }
      obs_cleanup_old_data: {
        Args: never
        Returns: {
          rows_deleted: number
          table_name: string
        }[]
      }
      obs_log_rpc: {
        Args: {
          p_caller_id: string
          p_duration_ms: number
          p_error_code?: string
          p_error_msg?: string
          p_rpc_name: string
          p_success?: boolean
          p_surface?: string
        }
        Returns: undefined
      }
      rank_explore_pages: {
        Args: { p_page_type?: string; p_user_id: string }
        Returns: {
          explore_score: number
          page_id: string
        }[]
      }
      recompute_overdue_trust_scores: { Args: never; Returns: undefined }
      recompute_trust_score: {
        Args: {
          _note?: string
          _subject_category?: string
          _subject_org_id?: string
          _subject_page_id?: string
          _subject_profile_id?: string
        }
        Returns: Json
      }
      reject_verification_request: {
        Args: {
          p_rejection_reason: string
          p_request_id: string
          p_review_note?: string
        }
        Returns: Json
      }
      request_verification_more_info: {
        Args: { p_message: string; p_request_id: string }
        Returns: Json
      }
      resolve_verification_assignee: {
        Args: { _org_id: string; _role_category: string }
        Returns: string
      }
      respond_to_offer: {
        Args: { p_accept: boolean; p_offer_id: string }
        Returns: Json
      }
      revoke_platform_role: {
        Args: { p_reason: string; p_role: string; p_user_id: string }
        Returns: Json
      }
      schedule_interview: {
        Args: {
          p_application_id: string
          p_duration_mins?: number
          p_interview_type?: string
          p_interviewer_ids?: string[]
          p_meeting_link?: string
          p_scheduled_at: string
        }
        Returns: Json
      }
      send_offer: {
        Args: {
          p_application_id: string
          p_compensation: Json
          p_offer_expiry_date?: string
          p_start_date?: string
        }
        Returns: Json
      }
      send_ping: {
        Args: {
          p_content?: string
          p_conversation_id: string
          p_encrypted_body?: string
          p_is_encrypted?: boolean
          p_nonce?: string
        }
        Returns: Json
      }
      send_workspace_message: {
        Args: {
          p_channel_id: string
          p_content: string
          p_work_item_id?: string
        }
        Returns: Json
      }
      submit_appeal: {
        Args: { p_entity_id: string; p_entity_type: string; p_reason: string }
        Returns: string
      }
      sync_legacy_verification_evidence: {
        Args: { _request_id: string }
        Returns: string
      }
      track_explore_impression: {
        Args: {
          p_action?: string
          p_entity_id: string
          p_entity_type: string
          p_source?: string
        }
        Returns: undefined
      }
      update_all_activity_scores: { Args: never; Returns: undefined }
      update_all_activity_scores_v2: { Args: never; Returns: undefined }
      user_can_review_verification_request: {
        Args: { _actor: string; _request_id: string }
        Returns: boolean
      }
      verification_internal_write_allowed: { Args: never; Returns: boolean }
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
