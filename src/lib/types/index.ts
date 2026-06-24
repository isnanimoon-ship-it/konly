export interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  sort_order: number;
  created_at: string;
  children?: Category[];
}

export interface Product {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  external_url: string;
  category_id: number | null;
  click_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Profile {
  id: string;
  role: "user" | "admin";
  created_at: string;
}

export interface Report {
  id: number;
  product_id: number;
  user_id: string;
  type: "info" | "link";
  description: string | null;
  status: "pending" | "resolved";
  created_at: string;
  product?: Product;
  profile?: Profile;
}

export interface Notice {
  id: number;
  title: string;
  content: string;
  is_pinned: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SiteSetting {
  key: string;
  value: string;
  updated_at: string;
}

export interface VisitorLog {
  id: number;
  page: string;
  user_id: string | null;
  visited_at: string;
}

export interface DailyVisitor {
  visit_date: string;
  visit_count: number;
  unique_user_count: number;
}

export interface RecentlyViewed {
  id: number;
  user_id: string;
  product_id: number;
  viewed_at: string;
  product?: Product;
}
