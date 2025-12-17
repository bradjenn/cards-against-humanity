import type { RouterContext } from "@/routerContext";

export type Pack = {
  id: string;
  name: string;
  white_card_count: number;
  black_card_count: number;
};

export type NewGameLoaderData = {
  packs: Pack[];
};

export async function newGameLoader({ context }: { context: RouterContext }): Promise<NewGameLoaderData> {
  const supabase = context.supabase;

  // Fetch packs with card counts
  const { data: packs, error: packsError } = await supabase
    .from("packs")
    .select("id, name, white_card_count, black_card_count")
    .order("name");

  if (packsError) {
    throw new Error("Failed to load card packs");
  }

  return {
    packs: (packs ?? []) as Pack[],
  };
}
