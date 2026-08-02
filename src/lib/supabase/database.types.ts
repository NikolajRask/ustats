export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      sites: {
        Row: {
          id: string;
          name: string;
          domain: string;
          public_key: string;
          cross_day_tracking: boolean;
          data_retention_days: number | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          domain: string;
          public_key?: string;
          cross_day_tracking?: boolean;
          data_retention_days?: number | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          domain?: string;
          public_key?: string;
          cross_day_tracking?: boolean;
          data_retention_days?: number | null;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      site_members: {
        Row: {
          site_id: string;
          user_id: string;
          role: "owner" | "admin";
          created_at: string;
        };
        Insert: {
          site_id: string;
          user_id: string;
          role?: "owner" | "admin";
          created_at?: string;
        };
        Update: {
          site_id?: string;
          user_id?: string;
          role?: "owner" | "admin";
          created_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: number;
          site_id: string;
          name: string;
          path: string | null;
          url: string | null;
          referrer: string | null;
          referrer_host: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          utm_term: string | null;
          utm_content: string | null;
          country: string | null;
          region: string | null;
          city: string | null;
          device: string | null;
          browser: string | null;
          os: string | null;
          visitor_hash: string;
          session_hash: string;
          props: Json;
          created_at: string;
        };
        Insert: {
          id?: number;
          site_id: string;
          name?: string;
          path?: string | null;
          url?: string | null;
          referrer?: string | null;
          referrer_host?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          utm_term?: string | null;
          utm_content?: string | null;
          country?: string | null;
          region?: string | null;
          city?: string | null;
          device?: string | null;
          browser?: string | null;
          os?: string | null;
          visitor_hash: string;
          session_hash: string;
          props?: Json;
          created_at?: string;
        };
        Update: {
          id?: number;
          site_id?: string;
          name?: string;
          path?: string | null;
          url?: string | null;
          referrer?: string | null;
          referrer_host?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          utm_term?: string | null;
          utm_content?: string | null;
          country?: string | null;
          region?: string | null;
          city?: string | null;
          device?: string | null;
          browser?: string | null;
          os?: string | null;
          visitor_hash?: string;
          session_hash?: string;
          props?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      funnels: {
        Row: {
          id: string;
          site_id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          site_id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "funnels_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      funnel_steps: {
        Row: {
          id: string;
          funnel_id: string;
          position: number;
          name: string;
          step_type: "path" | "event";
          match_value: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          funnel_id: string;
          position: number;
          name: string;
          step_type: "path" | "event";
          match_value: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          funnel_id?: string;
          position?: number;
          name?: string;
          step_type?: "path" | "event";
          match_value?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "funnel_steps_funnel_id_fkey";
            columns: ["funnel_id"];
            isOneToOne: false;
            referencedRelation: "funnels";
            referencedColumns: ["id"];
          },
        ];
      };
      site_graphs: {
        Row: {
          id: string;
          site_id: string;
          name: string;
          chart_type:
            | "timeseries"
            | "line"
            | "bar"
            | "column"
            | "donut"
            | "pie"
            | "treemap";
          metric:
            | "pageviews"
            | "visitors"
            | "events"
            | "bounceRate"
            | "avgSessionTime";
          metrics: (
            | "pageviews"
            | "visitors"
            | "events"
            | "bounceRate"
            | "avgSessionTime"
          )[];
          series: unknown;
          dimension:
            | "pages"
            | "referrers"
            | "countries"
            | "devices"
            | "browsers"
            | "sources"
            | "mediums"
            | "campaigns"
            | "events"
            | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          name: string;
          chart_type:
            | "timeseries"
            | "line"
            | "bar"
            | "column"
            | "donut"
            | "pie"
            | "treemap";
          metric:
            | "pageviews"
            | "visitors"
            | "events"
            | "bounceRate"
            | "avgSessionTime";
          metrics?: (
            | "pageviews"
            | "visitors"
            | "events"
            | "bounceRate"
            | "avgSessionTime"
          )[];
          series?: unknown;
          dimension?:
            | "pages"
            | "referrers"
            | "countries"
            | "devices"
            | "browsers"
            | "sources"
            | "mediums"
            | "campaigns"
            | "events"
            | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          site_id?: string;
          name?: string;
          chart_type?:
            | "timeseries"
            | "line"
            | "bar"
            | "column"
            | "donut"
            | "pie"
            | "treemap";
          metric?:
            | "pageviews"
            | "visitors"
            | "events"
            | "bounceRate"
            | "avgSessionTime";
          metrics?: (
            | "pageviews"
            | "visitors"
            | "events"
            | "bounceRate"
            | "avgSessionTime"
          )[];
          series?: unknown;
          dimension?:
            | "pages"
            | "referrers"
            | "countries"
            | "devices"
            | "browsers"
            | "sources"
            | "mediums"
            | "campaigns"
            | "events"
            | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "site_graphs_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      site_event_aliases: {
        Row: {
          site_id: string;
          event_name: string;
          title: string;
          description: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          site_id: string;
          event_name: string;
          title?: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          site_id?: string;
          event_name?: string;
          title?: string;
          description?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "site_event_aliases_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      error_groups: {
        Row: {
          id: string;
          site_id: string;
          fingerprint: string;
          type: string;
          message: string;
          culprit: string | null;
          level: "error" | "warning" | "info";
          status: "unresolved" | "resolved" | "ignored";
          first_seen: string;
          last_seen: string;
          event_count: number;
        };
        Insert: {
          id?: string;
          site_id: string;
          fingerprint: string;
          type?: string;
          message: string;
          culprit?: string | null;
          level?: "error" | "warning" | "info";
          status?: "unresolved" | "resolved" | "ignored";
          first_seen?: string;
          last_seen?: string;
          event_count?: number;
        };
        Update: {
          id?: string;
          site_id?: string;
          fingerprint?: string;
          type?: string;
          message?: string;
          culprit?: string | null;
          level?: "error" | "warning" | "info";
          status?: "unresolved" | "resolved" | "ignored";
          first_seen?: string;
          last_seen?: string;
          event_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "error_groups_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      error_events: {
        Row: {
          id: number;
          site_id: string;
          group_id: string;
          type: string;
          message: string;
          level: "error" | "warning" | "info";
          stack: string | null;
          url: string | null;
          path: string | null;
          country: string | null;
          region: string | null;
          city: string | null;
          device: string | null;
          browser: string | null;
          os: string | null;
          visitor_hash: string | null;
          release: string | null;
          environment: string | null;
          extra: Json;
          created_at: string;
        };
        Insert: {
          id?: number;
          site_id: string;
          group_id: string;
          type?: string;
          message: string;
          level?: "error" | "warning" | "info";
          stack?: string | null;
          url?: string | null;
          path?: string | null;
          country?: string | null;
          region?: string | null;
          city?: string | null;
          device?: string | null;
          browser?: string | null;
          os?: string | null;
          visitor_hash?: string | null;
          release?: string | null;
          environment?: string | null;
          extra?: Json;
          created_at?: string;
        };
        Update: {
          id?: number;
          site_id?: string;
          group_id?: string;
          type?: string;
          message?: string;
          level?: "error" | "warning" | "info";
          stack?: string | null;
          url?: string | null;
          path?: string | null;
          country?: string | null;
          region?: string | null;
          city?: string | null;
          device?: string | null;
          browser?: string | null;
          os?: string | null;
          visitor_hash?: string | null;
          release?: string | null;
          environment?: string | null;
          extra?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "error_events_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "error_events_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "error_groups";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      record_error_group: {
        Args: {
          p_site_id: string;
          p_fingerprint: string;
          p_type: string;
          p_message: string;
          p_culprit: string | null;
          p_level: string;
        };
        Returns: string;
      };
      purge_site_expired_analytics: {
        Args: {
          p_site_id: string;
        };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Site = Database["public"]["Tables"]["sites"]["Row"];
export type Event = Database["public"]["Tables"]["events"]["Row"];
export type FunnelRow = Database["public"]["Tables"]["funnels"]["Row"];
export type FunnelStepRow = Database["public"]["Tables"]["funnel_steps"]["Row"];
export type SiteGraphRow = Database["public"]["Tables"]["site_graphs"]["Row"];
export type SiteEventAlias =
  Database["public"]["Tables"]["site_event_aliases"]["Row"];
export type ErrorGroup = Database["public"]["Tables"]["error_groups"]["Row"];
export type ErrorEvent = Database["public"]["Tables"]["error_events"]["Row"];
