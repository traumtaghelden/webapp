import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export interface Wedding {
  id: string;
  partner_1_name: string;
  partner_2_name: string;
  partner_1_age?: number;
  partner_2_age?: number;
  partner_1_hero_type?: string;
  partner_2_hero_type?: string;
  wedding_date: string;
  guest_count: number;
  ceremony_type: string;
  total_budget: number;
  is_premium: boolean;
  vision_text?: string;
  vision_keywords?: string[];
  style_colors?: any;
  style_fonts?: any;
  style_theme?: string;
  fundament_completed?: any;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  wedding_id: string;
  title: string;
  category: string;
  assigned_to: string;
  due_date: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  notes: string;
  timeline_event_id: string | null;
  budget_item_id: string | null;
  vendor_id: string | null;
  color: string;
  recurrence_parent_id: string | null;
  is_overdue_notified: boolean;
  created_at: string;
}

export interface TaskSubtask {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface TaskDependency {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  created_at: string;
}

export interface RecurringTask {
  id: string;
  wedding_id: string;
  title: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  assigned_to: string;
  notes: string;
  recurrence_pattern: 'daily' | 'weekly' | 'monthly';
  recurrence_interval: number;
  start_date: string;
  end_date: string | null;
  last_generated: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BudgetItem {
  id: string;
  wedding_id: string;
  category: string;
  item_name: string;
  estimated_cost: number; // DEPRECATED: Use actual_cost
  actual_cost: number;
  paid: boolean;
  payment_method: string;
  tax_rate: number;
  discount_amount: number;
  discount_percentage: number;
  notes: string;
  priority: 'low' | 'medium' | 'high';
  currency: string;
  payment_status: 'open' | 'paid'; // Simplified: only open or paid
  contract_signed: boolean;
  deposit_amount: number; // DEPRECATED
  deposit_paid: boolean; // DEPRECATED
  final_payment_due: string | null; // DEPRECATED
  vendor_id: string | null;
  location_id: string | null;
  is_per_person: boolean; // Available for ALL categories, not just catering
  cost_per_person: number | null;
  use_confirmed_guests_only: boolean;
  guest_count_override: number | null;
  timeline_event_id: string | null;
  is_manually_paid: boolean;
  budget_category_id: string | null;
  budget_payments?: BudgetPayment[];
  budget_category?: BudgetCategory;
  created_at: string;
}

export interface BudgetCategory {
  id: string;
  wedding_id: string;
  name: string;
  icon: string;
  color: string;
  budget_limit: number;
  parent_category_id: string | null;
  order_index: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface BudgetPayment {
  id: string;
  budget_item_id: string;
  amount: number;
  payment_date: string | null;
  due_date: string;
  payment_method: string;
  status: 'open' | 'paid'; // Simplified: only open or paid
  notes: string;
  receipt_url: string | null;
  // DEPRECATED fields removed in database migration 20251116000000
  created_at: string;
  updated_at: string;
}

export interface BudgetAttachment {
  id: string;
  budget_item_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  attachment_type: 'invoice' | 'contract' | 'quote' | 'receipt' | 'other';
  uploaded_by: string | null;
  created_at: string;
}

// DEPRECATED: Partner split functionality removed in two-state simplification
// Table archived as budget_partner_splits_archived for KPI access
export interface BudgetPartnerSplit {
  id: string;
  budget_item_id: string;
  partner_type: 'partner_1' | 'partner_2';
  amount: number;
  percentage: number;
  paid_amount: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetTag {
  id: string;
  wedding_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface BudgetItemTag {
  budget_item_id: string;
  tag_id: string;
  created_at: string;
}

export interface Guest {
  id: string;
  wedding_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  rsvp_status: 'planned' | 'invited' | 'accepted' | 'declined';
  plus_one: boolean;
  dietary_restrictions: string | null;
  table_number: number | null;
  group_id: string | null;
  age_group: 'adult' | 'child' | 'infant';
  relationship: string | null;
  invitation_status: 'not_sent' | 'save_the_date_sent' | 'invitation_sent' | 'reminder_sent';
  invitation_sent_date: string | null;
  rsvp_date: string | null;
  is_vip: boolean;
  special_needs: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  notes: string | null;
  plus_one_name: string | null;
  gift_received: boolean;
  gift_description: string | null;
  checked_in: boolean;
  checked_in_at: string | null;
  family_group_id: string | null;
  is_family_head: boolean;
  family_role: string | null;
  partner_side: 'partner_1' | 'partner_2' | 'both' | null;
  created_at: string;
}

export interface FamilyGroup {
  id: string;
  wedding_id: string;
  family_name: string;
  notes: string | null;
  partner_side: 'partner_1' | 'partner_2' | 'both' | null;
  created_at: string;
  updated_at: string;
}

export interface WeddingTeamRole {
  id: string;
  wedding_id: string;
  name: string;
  role: 'trauzeuge' | 'eltern' | 'helfer';
  partner_assignment: 'partner_1' | 'partner_2';
  email: string | null;
  phone: string | null;
  character_id: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  wedding_id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  uploaded_by: string;
  created_at: string;
}

export interface GuestGroup {
  id: string;
  wedding_id: string;
  name: string;
  color: string;
  description: string | null;
  created_at: string;
}

export interface BudgetHistory {
  id: string;
  wedding_id: string;
  budget_item_id: string | null;
  action: string;
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  changed_by: string | null;
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  wedding_id: string;
  time: string;
  title: string;
  description: string | null;
  location: string | null;
  duration_minutes: number;
  assigned_to: string | null;
  order_index: number;
  event_type: 'event' | 'buffer';
  end_time: string | null;
  buffer_label: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id: string;
  wedding_id: string;
  name: string;
  category: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  contract_status: string;
  total_cost: number | null;
  paid_amount: number;
  payment_due_date: string | null;
  rating: number | null;
  notes: string | null;
  description: string | null;
  timeline_event_id: string | null;
  contract_sent: boolean;
  deposit_paid: boolean;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface VendorCategory {
  id: string;
  wedding_id: string;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface VendorPayment {
  id: string;
  vendor_id: string;
  amount: number;
  due_date: string;
  payment_date: string | null;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  payment_type: 'deposit' | 'milestone' | 'final' | 'monthly';
  payment_method: string;
  notes: string;
  percentage_of_total: number | null;
  receipt_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface VendorAttachment {
  id: string;
  vendor_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  attachment_type: 'contract' | 'invoice' | 'quote' | 'receipt' | 'other';
  uploaded_by: string | null;
  created_at: string;
}

export interface VendorEventAssignment {
  id: string;
  vendor_id: string;
  timeline_event_id: string;
  cost_allocation_percentage: number;
  allocated_cost: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  wedding_type: string;
  tasks_json: any;
  is_public: boolean;
  created_by: string | null;
  created_at: string;
}

export interface TimelineBlockSubtask {
  id: string;
  timeline_event_id: string;
  title: string;
  start_offset_minutes: number;
  duration_minutes: number;
  description: string;
  assigned_to: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface TimelineBlockChecklistCategory {
  id: string;
  wedding_id: string;
  category_name: string;
  is_default: boolean;
  order_index: number;
  created_at: string;
}

export interface TimelineBlockChecklistItem {
  id: string;
  timeline_event_id: string;
  item_text: string;
  is_completed: boolean;
  category: string;
  order_index: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimelineBlockItemCategory {
  id: string;
  wedding_id: string;
  category_name: string;
  icon: string;
  is_default: boolean;
  order_index: number;
  created_at: string;
}

export interface TimelineBlockItem {
  id: string;
  timeline_event_id: string;
  item_name: string;
  quantity: number;
  category: string;
  is_packed: boolean;
  location: string;
  notes: string;
  order_index: number;
  packed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimelineEventGuestAttendance {
  id: string;
  timeline_event_id: string;
  guest_id: string;
  is_attending: boolean;
  created_at: string;
  updated_at: string;
}

export interface LocationCategory {
  id: string;
  wedding_id: string;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  wedding_id: string;
  name: string;
  category: string;
  location_category_id: string | null;
  description: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  max_capacity: number;
  seated_capacity: number | null;
  standing_capacity: number | null;
  rental_cost: number;
  deposit_amount: number;
  additional_costs: number;
  total_cost: number;
  currency: string;
  booking_status: 'inquiry' | 'visited' | 'reserved' | 'booked' | 'confirmed' | 'cancelled';
  contract_status: 'not_sent' | 'sent' | 'signed' | 'completed';
  contract_sent: boolean;
  deposit_paid: boolean;
  is_favorite: boolean;
  rating: number | null;
  visit_date: string | null;
  availability_notes: string | null;
  amenities: string[];
  parking_available: boolean;
  parking_spaces: number | null;
  accessibility_notes: string | null;
  catering_included: boolean;
  catering_cost_per_person: number | null;
  timeline_event_id: string | null;
  budget_item_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LocationAttachment {
  id: string;
  location_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  attachment_type: 'contract' | 'floor_plan' | 'photo' | 'price_list' | 'other';
  uploaded_by: string | null;
  created_at: string;
}

export interface LocationTimelineAssignment {
  id: string;
  location_id: string;
  timeline_event_id: string;
  is_primary_location: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LocationCategoryAssignment {
  id: string;
  wedding_id: string;
  location_id: string;
  category_id: string;
  created_at: string;
}
