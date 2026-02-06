import { Database } from "@/integrations/supabase/types";

export type Reward = Database["public"]["Tables"]["rewards"]["Row"];
export type Activity = Database["public"]["Tables"]["activities"]["Row"];
export type UserCredits = Database["public"]["Tables"]["user_credits"]["Row"];
export type Redemption = Database["public"]["Tables"]["redemptions"]["Row"];
export type Achievement = Database["public"]["Tables"]["achievements"]["Row"];
export type UserAchievement = Database["public"]["Tables"]["user_achievements"]["Row"];
export type UserLevel = Database["public"]["Tables"]["user_levels"]["Row"];
export type ActivityValidationRule = Database["public"]["Tables"]["activity_validation_rules"]["Row"];

export type ActivityInsert = Database["public"]["Tables"]["activities"]["Insert"];
export type RedemptionInsert = Database["public"]["Tables"]["redemptions"]["Insert"];
export type UserAchievementInsert = Database["public"]["Tables"]["user_achievements"]["Insert"];
export type UserLevelInsert = Database["public"]["Tables"]["user_levels"]["Insert"];