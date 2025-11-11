// Database type definitions for ZST Marketplace - 5-Tier Hierarchy

export type UserRole = 'admin' | 'importer' | 'wholesaler' | 'retailer' | 'normal_user';
export type TargetRole = 'customer' | 'retailer' | 'wholesaler';
export type OrderStatusB2C = 'pending' | 'shipped' | 'delivered' | 'cancelled';
export type OrderStatusB2B = 'pending' | 'paid' | 'shipped' | 'completed';

export interface Profile {
  id: string;
  email: string;
  business_name: string | null;
  role: UserRole;
  balance?: number;
  due_amount?: number;
  is_banned?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  icon_svg: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  category_id: number | null;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Listing {
  id: number;
  product_id: number;
  seller_id: string;
  price: number;
  stock_quantity: number;
  target_role: TargetRole;
  is_bulk_offer?: boolean; // true for Importer "Offers"
  min_order_quantity?: number; // for bulk offers
  created_at: string;
  updated_at: string;
}

export interface ListingWithProduct extends Listing {
  product: Product;
}

export interface OrderB2C {
  id: number;
  user_id?: string | null; // NULL for guest checkout
  customer_name: string;
  customer_email?: string | null; // for authenticated users
  customer_address: string;
  customer_phone: string;
  total_amount: number;
  status: OrderStatusB2C;
  created_at: string;
  updated_at?: string;
}

export interface OrderItemB2C {
  id: number;
  order_id: number;
  listing_id: number;
  quantity: number;
  price_at_purchase: number;
}

export interface OrderB2CWithItems extends OrderB2C {
  items: (OrderItemB2C & { listing: ListingWithProduct })[];
}

export interface OrderB2B {
  id: number;
  buyer_id: string;
  seller_id: string;
  total_price: number;
  status: OrderStatusB2B;
  created_at: string;
}

export interface OrderItemB2B {
  id: number;
  order_id: number;
  listing_id: number;
  quantity: number;
  price_at_purchase: number;
}

export interface OrderB2BWithItems extends OrderB2B {
  items: (OrderItemB2B & { listing: ListingWithProduct })[];
  buyer?: Profile;
  seller?: Profile;
}

export interface OrderB2BWithDetails extends OrderB2B {
  order_items_b2b?: any[];
  buyer_profile?: Partial<Profile>;
  seller_profile?: Partial<Profile>;
}

