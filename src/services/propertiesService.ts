import type { Property } from "../types/property";
import { isSupabaseConfigured, supabase } from "./supabase";

function numberValue(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatPrice(value: number, fallback: unknown): string {
  if (value >= 10_000_000) return `₹${(value / 10_000_000).toLocaleString("en-IN", { maximumFractionDigits: 2 })} Crore`;
  if (value >= 100_000) return `₹${(value / 100_000).toLocaleString("en-IN", { maximumFractionDigits: 2 })} Lakh`;
  if (value > 0) return `₹${value.toLocaleString("en-IN")}`;
  const text = String(fallback || "").trim();
  return text || "Price on Request";
}

function mapRow(row: Record<string, unknown>): Property {
  const rawImages = Array.isArray(row.image_urls) ? row.image_urls.map(String) : [];
  const cover = String(row.cover_image_url || "").trim();
  const imageUrls = [...new Set([cover, ...rawImages].filter(Boolean))];
  const priceValue = numberValue(row.price_value);
  const amenities = Array.isArray(row.amenities) ? row.amenities.map(String) : [];

  return {
    id: String(row.id),
    title: String(row.title || "Untitled Property"),
    type: String(row.type || "Residential"),
    category: String(row.category || "Sale"),
    location: String(row.location || [row.locality, row.city, row.state].filter(Boolean).join(", ")),
    locality: String(row.locality || ""),
    city: String(row.city || "Dewas"),
    state: String(row.state || "Madhya Pradesh"),
    price: formatPrice(priceValue, row.price),
    priceValue,
    negotiable: Boolean(row.negotiable),
    areaValue: numberValue(row.area_value),
    areaUnit: String(row.area_unit || "Sq. Ft."),
    dimensions: String(row.dimensions || ""),
    frontage: String(row.frontage || ""),
    facing: String(row.facing || ""),
    roadWidth: String(row.road_width || ""),
    bedrooms: numberValue(row.bedrooms),
    bathrooms: numberValue(row.bathrooms),
    parking: String(row.parking || (amenities.some((item) => /parking/i.test(item)) ? "Available" : "")),
    status: (row.status || "Available") as Property["status"],
    description: String(row.description || ""),
    amenities,
    imageUrls,
    coverImageUrl: cover || imageUrls[0] || "",
    mapUrl: String(row.map_url || ""),
    latitude: row.latitude == null ? null : numberValue(row.latitude),
    longitude: row.longitude == null ? null : numberValue(row.longitude),
    officeLocation: String(row.office_location || "JMK Group Office, Dewas"),
    featured: Boolean(row.featured),
    updatedAt: String(row.updated_at || ""),
  };
}

export async function getProperties(): Promise<Property[]> {
  if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.from("properties").select("*").eq("published", true).order("featured", { ascending: false }).order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function getPropertyById(id: string): Promise<Property | null> {
  if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.from("properties").select("*").eq("id", id).eq("published", true).maybeSingle();
  if (error) throw error;
  return data ? mapRow(data as Record<string, unknown>) : null;
}
