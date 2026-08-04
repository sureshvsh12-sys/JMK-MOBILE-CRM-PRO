import { isSupabaseConfigured, supabase } from "./supabase";
import type { Property } from "../types/property";

const mapRow = (row: Record<string, unknown>): Property => ({
  id: String(row.id), title: String(row.title || ""), type: String(row.type || "Residential"),
  category: String(row.category || "Sale"), location: String(row.location || ""), locality: String(row.locality || ""),
  city: String(row.city || "Dewas"), state: String(row.state || "Madhya Pradesh"), price: String(row.price || ""),
  priceValue: Number(row.price_value || 0), negotiable: Boolean(row.negotiable), areaValue: Number(row.area_value || 0),
  areaUnit: String(row.area_unit || "Sq. Ft."), facing: String(row.facing || ""), roadWidth: String(row.road_width || ""),
  status: (row.status || "Available") as Property["status"], description: String(row.description || ""),
  amenities: Array.isArray(row.amenities) ? row.amenities.map(String) : [], imageUrls: Array.isArray(row.image_urls) ? row.image_urls.map(String) : [],
  coverImageUrl: String(row.cover_image_url || ""), mapUrl: String(row.map_url || ""), officeLocation: String(row.office_location || ""),
  featured: Boolean(row.featured), updatedAt: String(row.updated_at || ""),
});

export async function getProperties(): Promise<Property[]> {
  if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.from("properties").select("*").eq("published", true).order("featured", { ascending: false }).order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => mapRow(row as Record<string, unknown>));
}
