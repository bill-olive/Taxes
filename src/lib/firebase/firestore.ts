import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "./config";
import { type TaxReturn, getDefaultTaxReturn } from "@/types";
import { getCurrentTaxYear } from "@/lib/utils";

function taxReturnRef(uid: string, taxYear: number) {
  return doc(db, "users", uid, "taxReturns", String(taxYear));
}

export async function getTaxReturn(
  uid: string,
  taxYear: number
): Promise<TaxReturn | null> {
  const snap = await getDoc(taxReturnRef(uid, taxYear));
  return snap.exists() ? (snap.data() as TaxReturn) : null;
}

export async function createTaxReturn(
  uid: string,
  taxYear: number,
  data?: Partial<TaxReturn>
): Promise<TaxReturn> {
  const taxReturn: TaxReturn = { ...getDefaultTaxReturn(), ...data };
  await setDoc(taxReturnRef(uid, taxYear), taxReturn);
  return taxReturn;
}

export async function updateTaxReturn(
  uid: string,
  taxYear: number,
  data: Partial<TaxReturn>
): Promise<void> {
  await updateDoc(taxReturnRef(uid, taxYear), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function updateTaxReturnSection<K extends keyof TaxReturn>(
  uid: string,
  taxYear: number,
  section: K,
  data: TaxReturn[K]
): Promise<void> {
  await updateDoc(taxReturnRef(uid, taxYear), {
    [section]: data,
    updatedAt: new Date().toISOString(),
  });
}

export async function getAllTaxYears(
  uid: string
): Promise<{ year: number; status: string }[]> {
  const colRef = collection(db, "users", uid, "taxReturns");
  const q = query(colRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    year: Number(d.id),
    status: (d.data() as TaxReturn).status,
  }));
}

export async function prefillFromPriorYear(
  uid: string,
  currentYear: number
): Promise<Partial<TaxReturn> | null> {
  const priorYear = currentYear - 1;
  const prior = await getTaxReturn(uid, priorYear);
  if (!prior) return null;

  return {
    personalInfo: {
      ...prior.personalInfo,
    },
    filingStatus: prior.filingStatus,
    residency: prior.residency,
    education: {
      ...prior.education,
      tuitionPaid: 0,
    },
    property: {
      ...prior.property,
      propertyTaxPaid: 0,
    },
    w2s: prior.w2s.map((w2) => ({
      ...w2,
      wages: 0,
      federalWithheld: 0,
      stateWages: 0,
      stateWithheld: 0,
    })),
  };
}

export async function getOrCreateTaxReturn(
  uid: string,
  taxYear?: number
): Promise<TaxReturn> {
  const year = taxYear ?? getCurrentTaxYear();
  const existing = await getTaxReturn(uid, year);
  if (existing) return existing;

  const prefill = await prefillFromPriorYear(uid, year);
  return createTaxReturn(uid, year, prefill ?? undefined);
}
