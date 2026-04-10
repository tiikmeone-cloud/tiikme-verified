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
          actor_id: string | null
          body: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          title: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          title?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          title?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      opportunities: {
        Row: {
          company_id: string | null
          compensation: string | null
          created_at: string | null
          deadline: string | null
          description: string | null
          domain: string | null
          id: string
          is_cross_domain: boolean | null
          is_open: boolean | null
          location: string | null
          poster_id: string | null
          responses_count: number | null
          title: string
          type: string | null
        }
        Insert: {
          company_id?: string | null
          compensation?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          domain?: string | null
          id?: string
          is_cross_domain?: boolean | null
          is_open?: boolean | null
          location?: string | null
          poster_id?: string | null
          responses_count?: number | null
          title: string
          type?: string | null
        }
        Update: {
          company_id?: string | null
          compensation?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          domain?: string | null
          id?: string
          is_cross_domain?: boolean | null
          is_open?: boolean | null
          location?: string | null
          poster_id?: string | null
          responses_count?: number | null
          title?: string
          type?: string | null
        }
        Relationships: [
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
          cover_note: string | null
          created_at: string | null
          id: string
          opportunity_id: string
          status: string | null
          work_items_attached: string[] | null
        }
        Insert: {
          applicant_id: string
          cover_note?: string | null
          created_at?: string | null
          id?: string
          opportunity_id: string
          status?: string | null
          work_items_attached?: string[] | null
        }
        Update: {
          applicant_id?: string
          cover_note?: string | null
          created_at?: string | null
          id?: string
          opportunity_id?: string
          status?: string | null
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
          content: string
          conversation_id: string | null
          created_at: string | null
          id: string
          is_opener: boolean | null
          is_read: boolean | null
          pdf_url: string | null
          sender_id: string | null
          work_item_id: string | null
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          is_opener?: boolean | null
          is_read?: boolean | null
          pdf_url?: string | null
          sender_id?: string | null
          work_item_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
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
      posts: {
        Row: {
          author_id: string | null
          comment_count: number | null
          content: string
          created_at: string | null
          hashtags: string[] | null
          id: string
          image_urls: string[] | null
          is_shared_to_feed: boolean | null
          pdf_url: string | null
          post_type: string | null
          reactions: Json | null
          repost_of: string | null
          type: string | null
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
          is_shared_to_feed?: boolean | null
          pdf_url?: string | null
          post_type?: string | null
          reactions?: Json | null
          repost_of?: string | null
          type?: string | null
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
          is_shared_to_feed?: boolean | null
          pdf_url?: string | null
          post_type?: string | null
          reactions?: Json | null
          repost_of?: string | null
          type?: string | null
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
      profiles: {
        Row: {
          about_qa: Json | null
          activity_score: number | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          custom_links: Json | null
          department: string | null
          designation: string | null
          first_name: string | null
          full_name: string | null
          headline: string | null
          id: string
          institution_id: string | null
          institution_name: string | null
          is_public: boolean | null
          is_verified: boolean | null
          languages: string[] | null
          last_name: string | null
          location_city: string | null
          location_state: string | null
          onboarding_complete: boolean | null
          open_to_work: boolean | null
          phone_hash: string | null
          role: string | null
          role_metadata: Json | null
          role_subtype: string | null
          sector: string | null
          status: string | null
          theme_preference: string | null
          updated_at: string | null
          username: string | null
          verification_badge_text: string | null
          verification_type: string | null
          verified_by: string | null
        }
        Insert: {
          about_qa?: Json | null
          activity_score?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          custom_links?: Json | null
          department?: string | null
          designation?: string | null
          first_name?: string | null
          full_name?: string | null
          headline?: string | null
          id: string
          institution_id?: string | null
          institution_name?: string | null
          is_public?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          last_name?: string | null
          location_city?: string | null
          location_state?: string | null
          onboarding_complete?: boolean | null
          open_to_work?: boolean | null
          phone_hash?: string | null
          role?: string | null
          role_metadata?: Json | null
          role_subtype?: string | null
          sector?: string | null
          status?: string | null
          theme_preference?: string | null
          updated_at?: string | null
          username?: string | null
          verification_badge_text?: string | null
          verification_type?: string | null
          verified_by?: string | null
        }
        Update: {
          about_qa?: Json | null
          activity_score?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          custom_links?: Json | null
          department?: string | null
          designation?: string | null
          first_name?: string | null
          full_name?: string | null
          headline?: string | null
          id?: string
          institution_id?: string | null
          institution_name?: string | null
          is_public?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          last_name?: string | null
          location_city?: string | null
          location_state?: string | null
          onboarding_complete?: boolean | null
          open_to_work?: boolean | null
          phone_hash?: string | null
          role?: string | null
          role_metadata?: Json | null
          role_subtype?: string | null
          sector?: string | null
          status?: string | null
          theme_preference?: string | null
          updated_at?: string | null
          username?: string | null
          verification_badge_text?: string | null
          verification_type?: string | null
          verified_by?: string | null
        }
        Relationships: []
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
          created_at: string | null
          description: string | null
          domain: string | null
          end_date: string | null
          id: string
          institution_id: string | null
          institution_name: string | null
          is_current: boolean | null
          is_tiik_approved: boolean | null
          is_tiiked: boolean | null
          links: Json | null
          owner_id: string | null
          project_type: string | null
          recruiter_views: number | null
          role_in_work: string | null
          slug: string | null
          start_date: string | null
          status: string | null
          tech_stack: string[] | null
          tiiked_by: string | null
          title: string
          total_views: number | null
          type: string | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          description?: string | null
          domain?: string | null
          end_date?: string | null
          id?: string
          institution_id?: string | null
          institution_name?: string | null
          is_current?: boolean | null
          is_tiik_approved?: boolean | null
          is_tiiked?: boolean | null
          links?: Json | null
          owner_id?: string | null
          project_type?: string | null
          recruiter_views?: number | null
          role_in_work?: string | null
          slug?: string | null
          start_date?: string | null
          status?: string | null
          tech_stack?: string[] | null
          tiiked_by?: string | null
          title: string
          total_views?: number | null
          type?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          description?: string | null
          domain?: string | null
          end_date?: string | null
          id?: string
          institution_id?: string | null
          institution_name?: string | null
          is_current?: boolean | null
          is_tiik_approved?: boolean | null
          is_tiiked?: boolean | null
          links?: Json | null
          owner_id?: string | null
          project_type?: string | null
          recruiter_views?: number | null
          role_in_work?: string | null
          slug?: string | null
          start_date?: string | null
          status?: string | null
          tech_stack?: string[] | null
          tiiked_by?: string | null
          title?: string
          total_views?: number | null
          type?: string | null
          updated_at?: string | null
          visibility?: string | null
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
      workspace_members: {
        Row: {
          id: string
          joined_at: string | null
          left_at: string | null
          role: string | null
          status: string | null
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          id?: string
          joined_at?: string | null
          left_at?: string | null
          role?: string | null
          status?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          id?: string
          joined_at?: string | null
          left_at?: string | null
          role?: string | null
          status?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
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
      workspaces: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          institution_id: string | null
          member_count: number | null
          name: string
          privacy: string | null
          project_count: number | null
          type: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          institution_id?: string | null
          member_count?: number | null
          name: string
          privacy?: string | null
          project_count?: number | null
          type?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          institution_id?: string | null
          member_count?: number | null
          name?: string
          privacy?: string | null
          project_count?: number | null
          type?: string | null
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
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
