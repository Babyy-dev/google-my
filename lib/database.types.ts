// lib/database.types.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];

export interface Database {
  public: {
    Tables: {
      google_ads_accounts: {
        Row: {
          id: string;
          user_id: string;
          customer_id: string;
          login_customer_id: string | null;
          account_name: string;
          currency_code: string;
          access_token: string;
          refresh_token: string;
          token_expires_at: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          customer_id: string;
          login_customer_id?: string | null;
          account_name: string;
          currency_code: string;
          access_token: string;
          refresh_token: string;
          token_expires_at: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          customer_id?: string;
          login_customer_id?: string | null;
          account_name?: string;
          currency_code?: string;
          access_token?: string;
          refresh_token?: string;
          token_expires_at?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      ad_clicks: {
        Row: {
          id: number;
          gclid: string | null;
          ip_address: string | null;
          user_agent: string | null;
          landing_page_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          gclid?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          landing_page_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          gclid?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          landing_page_url?: string | null;
          created_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          company: string | null;
          phone_number: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
          click_fraud_threshold: number | null;
          stripe_customer_id: string | null;
          click_fraud_window_hours: number | null;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          company?: string | null;
          phone_number?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          click_fraud_threshold?: number | null;
          stripe_customer_id?: string | null;
          click_fraud_window_hours?: number | null;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          company?: string | null;
          phone_number?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          click_fraud_threshold?: number | null;
          stripe_customer_id?: string | null;
          click_fraud_window_hours?: number | null;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          stripe_price_id: string | null;
          stripe_current_period_end: string | null;
          status: "active" | "trialing" | "canceled" | "unpaid" | null;
        };
        Insert: {
          id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          stripe_current_period_end?: string | null;
          status?: "active" | "trialing" | "canceled" | "unpaid" | null;
        };
        Update: {
          id?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          stripe_current_period_end?: string | null;
          status?: "active" | "trialing" | "canceled" | "unpaid" | null;
        };
      };
      fraud_alerts: {
        Row: {
          id: number;
          user_id: string;
          google_ads_account_id: string;
          ip_address: string;
          timestamp: string;
          reason: string;
          cost: number;
          campaign_id: string;
          ad_group_id: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          google_ads_account_id: string;
          ip_address: string;
          timestamp: string;
          reason: string;
          cost: number;
          campaign_id: string;
          ad_group_id: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          google_ads_account_id?: string;
          ip_address?: string;
          timestamp?: string;
          reason?: string;
          cost?: number;
          campaign_id?: string;
          ad_group_id?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
