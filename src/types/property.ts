export type PropertyStatus = "Available" | "Reserved" | "Sold";
export type Property = {
  id: string; title: string; type: string; category: string; location: string; locality: string;
  city: string; state: string; price: string; priceValue: number; negotiable: boolean;
  areaValue: number; areaUnit: string; facing: string; roadWidth: string; status: PropertyStatus;
  description: string; amenities: string[]; imageUrls: string[]; coverImageUrl: string;
  mapUrl: string; officeLocation: string; featured: boolean; updatedAt: string;
};
