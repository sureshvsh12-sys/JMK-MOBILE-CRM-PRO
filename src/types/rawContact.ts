export type RawContactSegment = "finance" | "assets" | "solar";

export type RawContactCallStatus =
  | "Not Called"
  | "No Answer"
  | "Busy"
  | "Callback"
  | "Interested"
  | "Not Interested"
  | "Wrong Number";

export type RawContact = {
  id: string;
  segment: RawContactSegment;
  full_name: string;
  mobile: string;
  email: string;
  city: string;
  district?: string;
  source: string;
  call_status: RawContactCallStatus;
  remarks: string;
  callback_date: string | null;
  assigned_to: string;
  converted_to_lead: boolean;
  lead_id: string | null;
  created_at: string;
  updated_at: string;
};

export type RawContactUpdate = {
  call_status: RawContactCallStatus;
  remarks: string;
  callback_date: string | null;
};
