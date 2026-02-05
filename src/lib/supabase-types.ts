 import { Database } from "@/integrations/supabase/types";
 
 export type Reward = Database["public"]["Tables"]["rewards"]["Row"];
 export type Activity = Database["public"]["Tables"]["activities"]["Row"];
 export type UserCredits = Database["public"]["Tables"]["user_credits"]["Row"];
 export type Redemption = Database["public"]["Tables"]["redemptions"]["Row"];
 
 export type ActivityInsert = Database["public"]["Tables"]["activities"]["Insert"];
 export type RedemptionInsert = Database["public"]["Tables"]["redemptions"]["Insert"];