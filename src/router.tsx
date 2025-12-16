import { createRouter } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import type { RouterContext } from "./routerContext";
// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
export const getRouter = () => {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    context: {
      supabase,
    } satisfies RouterContext,
  });

  return router;
};
