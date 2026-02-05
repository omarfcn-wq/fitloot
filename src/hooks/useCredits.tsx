 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "./useAuth";
 
 export function useCredits() {
   const { user } = useAuth();
   const queryClient = useQueryClient();
 
   const { data: credits, isLoading } = useQuery({
     queryKey: ["credits", user?.id],
     queryFn: async () => {
       if (!user) return null;
       const { data, error } = await supabase
         .from("user_credits")
         .select("*")
         .eq("user_id", user.id)
         .single();
       if (error) throw error;
       return data;
     },
     enabled: !!user,
   });
 
   const addCredits = useMutation({
     mutationFn: async (amount: number) => {
       if (!user || !credits) throw new Error("No user or credits");
       const { error } = await supabase
         .from("user_credits")
         .update({ balance: credits.balance + amount })
         .eq("user_id", user.id);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["credits", user?.id] });
     },
   });
 
   const spendCredits = useMutation({
     mutationFn: async (amount: number) => {
       if (!user || !credits) throw new Error("No user or credits");
       if (credits.balance < amount) throw new Error("Insufficient credits");
       const { error } = await supabase
         .from("user_credits")
         .update({ balance: credits.balance - amount })
         .eq("user_id", user.id);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["credits", user?.id] });
     },
   });
 
   return {
     credits: credits?.balance ?? 0,
     isLoading,
     addCredits: addCredits.mutate,
     spendCredits: spendCredits.mutate,
   };
 }