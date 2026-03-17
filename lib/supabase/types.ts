export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          phone_number: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          phone_number: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
      };
      waivers: {
        Row: {
          id: string;
          customer_id: string;
          agreed_to_terms: boolean;
          signed_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          agreed_to_terms?: boolean;
          signed_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["waivers"]["Insert"]>;
      };
      queue: {
        Row: {
          id: string;
          customer_id: string;
          status: "waiting" | "notified" | "completed" | "cancelled";
          position: number;
          service_type: "tattoo" | "piercing";
          added_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          status?: "waiting" | "notified" | "completed" | "cancelled";
          position?: number;
          service_type: "tattoo" | "piercing";
          added_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["queue"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      cancel_queue_entry: {
        Args: { p_queue_id: string };
        Returns: undefined;
      };
      move_queue_entry: {
        Args: { p_queue_id: string; p_new_status: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
  };
}

export type Customer = Database["public"]["Tables"]["customers"]["Row"];
export type Waiver = Database["public"]["Tables"]["waivers"]["Row"];
export type QueueEntry = Database["public"]["Tables"]["queue"]["Row"];
