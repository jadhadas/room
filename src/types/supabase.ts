export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string
          name: string
          rent: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          rent: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          rent?: number
          created_at?: string
        }
      }
      tenants: {
        Row: {
          id: string
          name: string
          phone: string
          room_id: string
          join_date: string
          leave_date: string | null
          uses_mess: boolean
          deposit_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          phone: string
          room_id: string
          join_date: string
          leave_date?: string | null
          uses_mess?: boolean
          deposit_amount: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string
          room_id?: string
          join_date?: string
          leave_date?: string | null
          uses_mess?: boolean
          deposit_amount?: number
          created_at?: string
        }
      }
      rent_payments: {
        Row: {
          id: string
          tenant_id: string
          month: string
          amount_paid: number
          payment_date: string
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          month: string
          amount_paid: number
          payment_date: string
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          month?: string
          amount_paid?: number
          payment_date?: string
          created_at?: string
        }
      }
      mess_payments: {
        Row: {
          id: string
          tenant_id: string
          month: string
          mess_charge: number
          payment_date: string
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          month: string
          mess_charge: number
          payment_date: string
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          month?: string
          mess_charge?: number
          payment_date?: string
          created_at?: string
        }
      }
      deposit_transactions: {
        Row: {
          id: string
          tenant_id: string
          date: string
          amount: number
          type: string
          reason: string
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          date: string
          amount: number
          type: string
          reason: string
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          date?: string
          amount?: number
          type?: string
          reason?: string
          created_at?: string
        }
      }
    }
  }
}