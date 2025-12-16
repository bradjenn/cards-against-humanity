import { createContext, useContext } from "react";
import { supabase } from "../lib/supabase";

const SupabaseContext = createContext(supabase);

export const SupabaseProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => useContext(SupabaseContext);
