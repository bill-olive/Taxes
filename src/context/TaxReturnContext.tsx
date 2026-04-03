"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { type TaxReturn, getDefaultTaxReturn } from "@/types";
import {
  getOrCreateTaxReturn,
  updateTaxReturnSection,
} from "@/lib/firebase/firestore";
import { getCurrentTaxYear } from "@/lib/utils";

interface TaxReturnState {
  taxReturn: TaxReturn;
  loading: boolean;
  taxYear: number;
  updateSection: <K extends keyof TaxReturn>(
    section: K,
    data: TaxReturn[K]
  ) => Promise<void>;
  refreshReturn: () => Promise<void>;
}

const TaxReturnContext = createContext<TaxReturnState>({
  taxReturn: getDefaultTaxReturn(),
  loading: true,
  taxYear: getCurrentTaxYear(),
  updateSection: async () => {},
  refreshReturn: async () => {},
});

export function TaxReturnProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [taxReturn, setTaxReturn] = useState<TaxReturn>(getDefaultTaxReturn());
  const [loading, setLoading] = useState(true);
  const taxYear = getCurrentTaxYear();

  const loadReturn = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await getOrCreateTaxReturn(user.uid, taxYear);
    setTaxReturn(data);
    setLoading(false);
  }, [user, taxYear]);

  useEffect(() => {
    loadReturn();
  }, [loadReturn]);

  const updateSection = useCallback(
    async <K extends keyof TaxReturn>(section: K, data: TaxReturn[K]) => {
      if (!user) return;
      await updateTaxReturnSection(user.uid, taxYear, section, data);
      setTaxReturn((prev) => ({ ...prev, [section]: data }));
    },
    [user, taxYear]
  );

  return (
    <TaxReturnContext.Provider
      value={{ taxReturn, loading, taxYear, updateSection, refreshReturn: loadReturn }}
    >
      {children}
    </TaxReturnContext.Provider>
  );
}

export function useTaxReturn() {
  return useContext(TaxReturnContext);
}
