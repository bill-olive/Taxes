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
  error: string | null;
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
  error: null,
  taxYear: getCurrentTaxYear(),
  updateSection: async () => {},
  refreshReturn: async () => {},
});

export function TaxReturnProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [taxReturn, setTaxReturn] = useState<TaxReturn>(getDefaultTaxReturn());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const taxYear = getCurrentTaxYear();

  const loadReturn = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getOrCreateTaxReturn(user.uid, taxYear);
      // Merge with defaults so new fields added to the schema are present
      const defaults = getDefaultTaxReturn();
      const merged: TaxReturn = {
        ...defaults,
        ...data,
        // Ensure nested objects have all required fields
        investmentIncome: {
          ...defaults.investmentIncome,
          ...(data.investmentIncome ?? {}),
        },
        additionalDeductions: {
          ...defaults.additionalDeductions,
          ...(data.additionalDeductions ?? {}),
        },
        personalInfo: {
          ...defaults.personalInfo,
          ...(data.personalInfo ?? {}),
          address: {
            ...defaults.personalInfo.address,
            ...(data.personalInfo?.address ?? {}),
          },
        },
        dependents: data.dependents ?? defaults.dependents,
        childcareExpenses: data.childcareExpenses ?? defaults.childcareExpenses,
      };
      setTaxReturn(merged);
    } catch (err) {
      console.error("Failed to load tax return from Firestore:", err);
      setError(
        "Could not connect to the database. You can still browse the app, but data won't be saved until the connection is restored."
      );
      // Use default data so the app is still usable
      setTaxReturn(getDefaultTaxReturn());
    } finally {
      setLoading(false);
    }
  }, [user, taxYear]);

  useEffect(() => {
    loadReturn();
  }, [loadReturn]);

  const updateSection = useCallback(
    async <K extends keyof TaxReturn>(section: K, data: TaxReturn[K]) => {
      if (!user) return;
      // Update local state immediately
      setTaxReturn((prev) => ({ ...prev, [section]: data }));
      try {
        await updateTaxReturnSection(user.uid, taxYear, section, data);
      } catch (err) {
        console.error("Failed to save to Firestore:", err);
      }
    },
    [user, taxYear]
  );

  return (
    <TaxReturnContext.Provider
      value={{ taxReturn, loading, error, taxYear, updateSection, refreshReturn: loadReturn }}
    >
      {children}
    </TaxReturnContext.Provider>
  );
}

export function useTaxReturn() {
  return useContext(TaxReturnContext);
}
