// Database type definitions for ZST Marketplace

export type UserRole = 'importer' | 'wholesaler' | 'retailer' | 'admin';
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
}

export interface Listing {
  id: number;
  product_id: number;
  seller_id: string;
  price: number;
  stock_quantity: number;
  target_role: TargetRole;
  created_at: string;
  updated_at: string;
}

export interface ListingWithProduct extends Listing {
  product: Product;
  category?: Category;
}

export interface OrderB2C {
  id: number;
  customer_name: string;
  customer_address: string;
  customer_phone: string;
  status: OrderStatusB2C;
  created_at: string;
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

