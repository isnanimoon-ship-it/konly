"use client";

import { Product } from "@/lib/types";
import { useCallback } from "react";

const STORAGE_KEY = "recently_viewed";
const MAX_ITEMS = 20;

export function getRecentlyViewedIds(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function useRecentlyViewed() {
  const addProduct = useCallback((product: Product) => {
    const ids = getRecentlyViewedIds();
    const filtered = ids.filter((id) => id !== product.id);
    const updated = [product.id, ...filtered].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  return { addProduct, getIds: getRecentlyViewedIds };
}

export async function fetchRecentProducts(ids: number[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  const res = await fetch(`/api/recent?ids=${ids.join(",")}`);
  if (!res.ok) return [];
  const { products } = await res.json();
  return products as Product[];
}
