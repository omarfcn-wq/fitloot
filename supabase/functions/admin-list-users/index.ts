// Admin-only edge function to list users with their email + profile + activity stats.
// Uses the service role key, but verifies the caller is an admin via user_roles.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Confirm admin role
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // List all auth users (paginate)
    const allUsers: any[] = [];
    let page = 1;
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw error;
      allUsers.push(...data.users);
      if (data.users.length < 1000) break;
      page++;
    }

    const [{ data: credits }, { data: roles }, { data: activities }, { data: profiles }] =
      await Promise.all([
        admin.from("user_credits").select("user_id, balance"),
        admin.from("user_roles").select("user_id, role").eq("role", "admin"),
        admin.from("activities").select("user_id, credits_earned, completed_at"),
        admin.from("profiles").select("user_id, name"),
      ]);

    const creditsMap = new Map((credits ?? []).map((c: any) => [c.user_id, c.balance]));
    const adminSet = new Set((roles ?? []).map((r: any) => r.user_id));
    const profileMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p.name]));

    const actMap = new Map<string, { count: number; credits: number; last: string | null }>();
    (activities ?? []).forEach((a: any) => {
      const cur = actMap.get(a.user_id) ?? { count: 0, credits: 0, last: null };
      cur.count += 1;
      cur.credits += a.credits_earned ?? 0;
      if (!cur.last || a.completed_at > cur.last) cur.last = a.completed_at;
      actMap.set(a.user_id, cur);
    });

    const users = allUsers.map((u) => {
      const stats = actMap.get(u.id);
      return {
        id: u.id,
        email: u.email ?? "",
        name: profileMap.get(u.id) ?? null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        email_confirmed_at: u.email_confirmed_at ?? null,
        balance: creditsMap.get(u.id) ?? 0,
        total_activities: stats?.count ?? 0,
        total_credits_earned: stats?.credits ?? 0,
        last_activity_at: stats?.last ?? null,
        is_admin: adminSet.has(u.id),
      };
    });

    users.sort((a, b) => (b.created_at > a.created_at ? 1 : -1));

    return new Response(JSON.stringify({ users }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-list-users error", e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
