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

// Query function for packs
export async function getPacksQueryFn(context: RouterContext) {
  const { data: packs, error: packsError } = await context.supabase
    .from("packs")
    .select("id, name, white_card_count, black_card_count")
    .order("name");

  if (packsError) {
    throw new Error("Failed to load card packs");
  }

  return (packs ?? []) as Pack[];
}

export async function newGameLoader({ context }: { context: RouterContext }): Promise<NewGameLoaderData> {
  // Ensure query data is loaded and cached
  const packs = await context.queryClient.ensureQueryData({
    queryKey: ["packs"],
    queryFn: () => getPacksQueryFn(context),
  });

  return { packs };
}
