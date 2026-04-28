import type { CalcInput } from "./calc";

export interface Record {
  id: string;
  slipNo: string;
  createdAt: string; // ISO
  customerName: string;
  address: string;
  phone: string;
  itemName: string;
  weight: number;
  imageDataUrl?: string;
  calc: CalcInput;
  interest: number;
  total: number;
  maturityDate?: string; // ISO or undefined
  status: "active" | "repaid";
}

const KEY = "khushi-jewellers-records-v1";

export function loadRecords(): Record[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveRecords(records: Record[]) {
  localStorage.setItem(KEY, JSON.stringify(records));
}

export function addRecord(r: Record) {
  const all = loadRecords();
  all.unshift(r);
  saveRecords(all);
}

export function updateRecord(id: string, patch: Partial<Record>) {
  const all = loadRecords().map(r => (r.id === id ? { ...r, ...patch } : r));
  saveRecords(all);
}

export function deleteRecord(id: string) {
  saveRecords(loadRecords().filter(r => r.id !== id));
}

export function nextSlipNo(): string {
  const all = loadRecords();
  const yr = new Date().getFullYear();
  const max = all
    .map(r => r.slipNo)
    .filter(s => s.startsWith(`KJ-${yr}-`))
    .map(s => parseInt(s.split("-")[2] || "0", 10))
    .reduce((a, b) => Math.max(a, b), 0);
  return `KJ-${yr}-${String(max + 1).padStart(4, "0")}`;
}
