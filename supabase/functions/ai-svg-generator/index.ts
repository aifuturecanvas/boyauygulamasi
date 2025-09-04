import { createClient } from "@supabase/supabase-js";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// === ENV ===
// Not: SUPABASE_* prefix'i user secrets için yasak. Bu yüzden kendi isimlerimizi kullanıyoruz.
// PROJE URL'i için PROJECT_URL kullanıyoruz; yine de sistemin SUPABASE_URL'ı varsa ona da fallback veriyoruz.
const CLOUD_RUN_URL = Deno.env.get("CLOUD_RUN_URL")!;   // e.g. https://.../generate
const RUN_TOKEN = Deno.env.get("RUN_TOKEN")!;           // Cloud Run ile paylaşılan gizli header
const PROJECT_URL = Deno.env.get("PROJECT_URL") ?? Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;

const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

function slug(s: string) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
}

serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

    const { topic = "cute dinosaur", level = "simple" } = await req.json();

    // Cloud Run'a istek
    const r = await fetch(CLOUD_RUN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Run-Token": RUN_TOKEN
      },
      body: JSON.stringify({ topic, level })
    });

    if (!r.ok) {
      const txt = await r.text();
      return new Response(txt, { status: r.status, headers: { "Content-Type": "application/json" } });
    }

    const { pngBase64, width, height } = await r.json();

    // base64 -> bytes
    const bytes = Uint8Array.from(atob(pngBase64), (c) => c.charCodeAt(0));

    // Storage'a yükle (mevcut public bucket: 'ai')
    const bucket = "ai-pages";                 // eski: "ai"
    const filePath = `generated/${Date.now()}-${slug(topic)}.png`; // klasör adı serbest


    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(filePath, bytes, { contentType: "image/png", upsert: false });

    if (upErr) throw upErr;

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return new Response(
      JSON.stringify({ url: data.publicUrl, path: filePath, width, height }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
