import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify caller is a group user
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Not authenticated");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller } } = await supabase.auth.getUser(token);
    if (!caller) throw new Error("Invalid token");

    const { data: roleCheck } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "group")
      .maybeSingle();
    if (!roleCheck) throw new Error("Unauthorized: group role required");

    const { action, ...payload } = await req.json();

    if (action === "create") {
      const { email, password, full_name, hospital_id, doctor_id, roles } = payload;
      if (!email || !password) throw new Error("Email and password required");

      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: full_name || "" },
      });
      if (createErr) throw createErr;

      // Update profile with hospital/doctor
      if (hospital_id || doctor_id) {
        await supabase
          .from("profiles")
          .update({ hospital_id: hospital_id || null, doctor_id: doctor_id || null, full_name: full_name || "" })
          .eq("id", newUser.user.id);
      }

      // Assign roles
      if (roles && roles.length > 0) {
        const roleInserts = roles.map((role: string) => ({ user_id: newUser.user.id, role }));
        await supabase.from("user_roles").insert(roleInserts);
      }

      return new Response(JSON.stringify({ success: true, user_id: newUser.user.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update") {
      const { user_id, full_name, hospital_id, doctor_id } = payload;
      if (!user_id) throw new Error("user_id required");

      await supabase
        .from("profiles")
        .update({ full_name: full_name ?? null, hospital_id: hospital_id || null, doctor_id: doctor_id || null })
        .eq("id", user_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const { user_id } = payload;
      if (!user_id) throw new Error("user_id required");

      // Delete roles, then profile will cascade, then auth user
      await supabase.from("user_roles").delete().eq("user_id", user_id);
      const { error: delErr } = await supabase.auth.admin.deleteUser(user_id);
      if (delErr) throw delErr;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
