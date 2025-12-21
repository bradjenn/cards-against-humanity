// supabase/functions/seed-cards/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: "Missing Supabase environment variables" }),
      { status: 500 }
    );
  }

  const supabase = createClient(
    supabaseUrl,
    supabaseServiceKey, // IMPORTANT: service key
  );

  // 1. Load JSON from storage
  const { data: fileData, error: fileError } = await supabase.storage
    .from("seeds")
    .download("cah-cards-full.json");

  if (fileError) {
    return new Response(JSON.stringify(fileError), { status: 500 });
  }

  const text = await fileData.text();
  const packsJson = JSON.parse(text);

  console.log("Loaded JSON packs:", packsJson.length);

  for (const pack of packsJson) {
    // 2. Insert pack
    const { data: packRow, error: packErr } = await supabase
      .from("packs")
      .insert({ name: pack.name })
      .select()
      .single();

    if (packErr) {
      console.log("Pack insert error", packErr);
      continue;
    }

    const packId = packRow.id;
    console.log("Inserted pack:", pack.name);

    // 3. Insert white cards
    if (pack.white) {
      const whiteCards = pack.white.map((c: any) => ({
        pack_id: packId,
        text: c.text,
        type: "WHITE",
        pick: 1,
      }));

      const { error: whiteErr } = await supabase
        .from("cards")
        .insert(whiteCards);

      if (whiteErr) console.log("White insert error", whiteErr);
    }

    // 4. Insert black cards
    if (pack.black) {
      const blackCards = pack.black.map((c: any) => ({
        pack_id: packId,
        text: c.text,
        type: "BLACK",
        pick: c.pick ?? 1,
      }));

      const { error: blackErr } = await supabase
        .from("cards")
        .insert(blackCards);

      if (blackErr) console.log("Black insert error", blackErr);
    }
  }

  return new Response("Seeding complete!");
});
