export type InterestType = "SI" | "CI";
export type RatePeriod = "month" | "year";
export type TimeUnit = "months" | "years";
export type CompoundFreq = "monthly" | "quarterly" | "yearly";

export interface CalcInput {
  principal: number;
  rate: number;
  ratePeriod: RatePeriod;
  time: number;
  timeUnit: TimeUnit;
  type: InterestType;
  freq?: CompoundFreq;
}

export function calculate(input: CalcInput) {
  const { principal, rate, ratePeriod, time, timeUnit, type, freq = "monthly" } = input;
  if (!principal || !rate || !time) return { interest: 0, total: principal || 0 };

  // Normalize to years
  const years = timeUnit === "months" ? time / 12 : time;
  // Annual rate
  const annualRate = ratePeriod === "month" ? rate * 12 : rate;
  const r = annualRate / 100;

  if (type === "SI") {
    const interest = principal * r * years;
    return { interest, total: principal + interest };
  }
  // CI
  const n = freq === "monthly" ? 12 : freq === "quarterly" ? 4 : 1;
  const total = principal * Math.pow(1 + r / n, n * years);
  return { interest: total - principal, total };
}

export const fmtINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n || 0);
