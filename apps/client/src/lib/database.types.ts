// Auto-generated database types (placeholder - will be generated from Supabase)
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          business_name: string | null
          role: 'importer' | 'wholesaler' | 'retailer' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          business_name?: string | null
          role?: 'importer' | 'wholesaler' | 'retailer' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          business_name?: string | null
          role?: 'importer' | 'wholesaler' | 'retailer' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: number
          name: string
          icon_svg: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          icon_svg?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          icon_svg?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: number
          name: string
          description: string | null
          image_url: string | null
          category_id: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          image_url?: string | null
          category_id?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          image_url?: string | null
          category_id?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      listings: {
        Row: {
          id: number
          product_id: number
          seller_id: string
          price: number
          stock_quantity: number
          target_role: 'customer' | 'retailer' | 'wholesaler'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          product_id: number
          seller_id: string
          price: number
          stock_quantity?: number
          target_role: 'customer' | 'retailer' | 'wholesaler'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          product_id?: number
          seller_id?: string
          price?: number
          stock_quantity?: number
          target_role?: 'customer' | 'retailer' | 'wholesaler'
          created_at?: string
          updated_at?: string
        }
      }
      orders_b2c: {
        Row: {
          id: number
          customer_name: string
          customer_address: string
          customer_phone: string
          status: 'pending' | 'shipped' | 'delivered' | 'cancelled'
          created_at: string
        }
        Insert: {
          id?: number
          customer_name: string
          customer_address: string
          customer_phone: string
          status?: 'pending' | 'shipped' | 'delivered' | 'cancelled'
          created_at?: string
        }
        Update: {
          id?: number
          customer_name?: string
          customer_address?: string
          customer_phone?: string
          status?: 'pending' | 'shipped' | 'delivered' | 'cancelled'
          created_at?: string
        }
      }
      order_items_b2c: {
        Row: {
          id: number
          order_id: number
          listing_id: number
          quantity: number
          price_at_purchase: number
        }
        Insert: {
          id?: number
          order_id: number
          listing_id: number
          quantity: number
          price_at_purchase: number
        }
        Update: {
          id?: number
          order_id?: number
          listing_id?: number
          quantity?: number
          price_at_purchase?: number
        }
      }
      orders_b2b: {
        Row: {
          id: number
          buyer_id: string
          seller_id: string
          total_price: number
          status: 'pending' | 'paid' | 'shipped' | 'completed'
          created_at: string
        }
        Insert: {
          id?: number
          buyer_id: string
          seller_id: string
          total_price: number
          status?: 'pending' | 'paid' | 'shipped' | 'completed'
          created_at?: string
        }
        Update: {
          id?: number
          buyer_id?: string
          seller_id?: string
          total_price?: number
          status?: 'pending' | 'paid' | 'shipped' | 'completed'
          created_at?: string
        }
      }
      order_items_b2b: {
        Row: {
          id: number
          order_id: number
          listing_id: number
          quantity: number
          price_at_purchase: number
        }
        Insert: {
          id?: number
          order_id: number
          listing_id: number
          quantity: number
          price_at_purchase: number
        }
        Update: {
          id?: number
          order_id?: number
          listing_id?: number
          quantity?: number
          price_at_purchase?: number
        }
      }
    }
  }
}

