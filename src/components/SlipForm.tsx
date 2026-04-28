import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Upload, Calculator, Download, Save, RotateCcw, X } from "lucide-react";
import { format, addMonths, addYears } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { dict, type Lang } from "@/lib/i18n";
import { calculate, fmtINR, type CompoundFreq, type InterestType, type RatePeriod, type TimeUnit } from "@/lib/calc";
import { addRecord, nextSlipNo, type Record } from "@/lib/storage";
import { generateSlipPDF } from "@/lib/pdf";

const T = (k: keyof typeof dict, lang: Lang) => dict[k][lang];

interface Props {
  lang: Lang;
  onSaved: () => void;
}

export default function SlipForm({ lang, onSaved }: Props) {
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [itemName, setItemName] = useState("");
  const [weight, setWeight] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>();

  const [principal, setPrincipal] = useState("");
  const [type, setType] = useState<InterestType>("SI");
  const [rate, setRate] = useState("");
  const [ratePeriod, setRatePeriod] = useState<RatePeriod>("month");
  const [time, setTime] = useState("");
  const [timeUnit, setTimeUnit] = useState<TimeUnit>("months");
  const [freq, setFreq] = useState<CompoundFreq>("monthly");
  const [maturityDate, setMaturityDate] = useState<Date | undefined>();
  const [maturityTouched, setMaturityTouched] = useState(false);

  const calc = useMemo(
    () =>
      calculate({
        principal: Number(principal) || 0,
        rate: Number(rate) || 0,
        ratePeriod,
        time: Number(time) || 0,
        timeUnit,
        type,
        freq,
      }),
    [principal, rate, ratePeriod, time, timeUnit, type, freq]
  );

  // Auto-suggest maturity date from time period (only if user hasn't manually edited)
  const suggestedMaturity = useMemo(() => {
    const t = Number(time);
    if (!t) return undefined;
    return timeUnit === "months" ? addMonths(new Date(), t) : addYears(new Date(), t);
  }, [time, timeUnit]);

  const effectiveMaturity = maturityTouched ? maturityDate : suggestedMaturity;

  const handleImage = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large (max 5 MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = e => setImageDataUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setCustomerName(""); setAddress(""); setPhone("");
    setItemName(""); setWeight(""); setImageDataUrl(undefined);
    setPrincipal(""); setRate(""); setTime("");
    setMaturityDate(undefined); setMaturityTouched(false);
  };

  const buildRecord = (): Record | null => {
    if (!customerName.trim() || !address.trim() || !phone.trim() || !itemName.trim() || !weight || !principal || !rate || !time) {
      toast.error(T("fillRequired", lang));
      return null;
    }
    return {
      id: crypto.randomUUID(),
      slipNo: nextSlipNo(),
      createdAt: new Date().toISOString(),
      customerName: customerName.trim(),
      address: address.trim(),
      phone: phone.trim(),
      itemName: itemName.trim(),
      weight: Number(weight),
      imageDataUrl,
      calc: {
        principal: Number(principal),
        rate: Number(rate),
        ratePeriod,
        time: Number(time),
        timeUnit,
        type,
        freq,
      },
      interest: calc.interest,
      total: calc.total,
      maturityDate: effectiveMaturity?.toISOString(),
      status: "active",
    };
  };

  const handleCalculate = () => {
    const r = buildRecord();
    if (!r) return;
    toast.success(`${fmtINR(r.total)} • ${T("totalPayable", lang)}`);
  };

  const handleDownload = () => {
    const r = buildRecord();
    if (!r) return;
    generateSlipPDF(r, lang);
    toast.success(T("downloaded", lang));
  };

  const handleSave = () => {
    const r = buildRecord();
    if (!r) return;
    addRecord(r);
    generateSlipPDF(r, lang);
    toast.success(T("saved", lang));
    onSaved();
    reset();
  };

  const labelCls = lang === "hi" ? "font-devanagari" : "";

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Customer */}
        <Card>
          <CardHeader>
            <CardTitle className={cn("text-xl", labelCls)}>{T("customerDetails", lang)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className={labelCls}>{T("customerName", lang)} *</Label>
              <Input value={customerName} onChange={e => setCustomerName(e.target.value)} maxLength={100} />
            </div>
            <div>
              <Label className={labelCls}>{T("address", lang)} *</Label>
              <Textarea value={address} onChange={e => setAddress(e.target.value)} maxLength={300} rows={2} />
            </div>
            <div>
              <Label className={labelCls}>{T("phone", lang)} *</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value.replace(/[^0-9+\-\s]/g, ""))} maxLength={15} inputMode="tel" />
            </div>
          </CardContent>
        </Card>

        {/* Jewellery */}
        <Card>
          <CardHeader>
            <CardTitle className={cn("text-xl", labelCls)}>{T("jewelleryDetails", lang)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className={labelCls}>{T("itemName", lang)} *</Label>
                <Input value={itemName} onChange={e => setItemName(e.target.value)} maxLength={100} placeholder="22K Gold Chain" />
              </div>
              <div>
                <Label className={labelCls}>{T("weight", lang)} *</Label>
                <Input type="number" step="0.01" min="0" value={weight} onChange={e => setWeight(e.target.value)} />
              </div>
            </div>
            <div>
              <Label className={labelCls}>
                {imageDataUrl ? T("changeImage", lang) : T("uploadImage", lang)}
              </Label>
              <div className="flex items-center gap-4 mt-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && handleImage(e.target.files[0])}
                  />
                  <div className="flex items-center gap-2 px-4 py-2 border border-input rounded-md bg-background hover:bg-secondary transition-colors">
                    <Upload className="w-4 h-4" />
                    <span className={labelCls}>{imageDataUrl ? T("changeImage", lang) : T("uploadImage", lang)}</span>
                  </div>
                </label>
                {imageDataUrl && (
                  <div className="relative">
                    <img src={imageDataUrl} alt="jewellery" className="w-20 h-20 object-cover rounded-md border border-border" />
                    <button
                      type="button"
                      onClick={() => setImageDataUrl(undefined)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loan */}
        <Card>
          <CardHeader>
            <CardTitle className={cn("text-xl", labelCls)}>{T("loanDetails", lang)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className={labelCls}>{T("principal", lang)} *</Label>
              <Input type="number" step="1" min="0" value={principal} onChange={e => setPrincipal(e.target.value)} />
            </div>

            <div>
              <Label className={labelCls}>{T("interestType", lang)} *</Label>
              <Tabs value={type} onValueChange={v => setType(v as InterestType)} className="mt-2">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="SI" className={labelCls}>{T("simple", lang)}</TabsTrigger>
                  <TabsTrigger value="CI" className={labelCls}>{T("compound", lang)}</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className={labelCls}>{T("rate", lang)} *</Label>
                <div className="flex gap-2">
                  <Input type="number" step="0.01" min="0" value={rate} onChange={e => setRate(e.target.value)} />
                  <Select value={ratePeriod} onValueChange={v => setRatePeriod(v as RatePeriod)}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month" className={labelCls}>{T("perMonth", lang)}</SelectItem>
                      <SelectItem value="year" className={labelCls}>{T("perYear", lang)}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className={labelCls}>{T("time", lang)} *</Label>
                <div className="flex gap-2">
                  <Input type="number" step="1" min="0" value={time} onChange={e => setTime(e.target.value)} />
                  <Select value={timeUnit} onValueChange={v => setTimeUnit(v as TimeUnit)}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="months" className={labelCls}>{T("months", lang)}</SelectItem>
                      <SelectItem value="years" className={labelCls}>{T("years", lang)}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {type === "CI" && (
              <div>
                <Label className={labelCls}>{T("compoundFreq", lang)}</Label>
                <Select value={freq} onValueChange={v => setFreq(v as CompoundFreq)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly" className={labelCls}>{T("monthly", lang)}</SelectItem>
                    <SelectItem value="quarterly" className={labelCls}>{T("quarterly", lang)}</SelectItem>
                    <SelectItem value="yearly" className={labelCls}>{T("yearly", lang)}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label className={labelCls}>{T("maturityDate", lang)}</Label>
              <div className="flex gap-2 mt-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("flex-1 justify-start text-left font-normal", !effectiveMaturity && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {effectiveMaturity ? format(effectiveMaturity, "PPP") : T("pickDate", lang)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={effectiveMaturity}
                      onSelect={d => { setMaturityDate(d); setMaturityTouched(true); }}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                {effectiveMaturity && (
                  <Button variant="ghost" size="icon" onClick={() => { setMaturityDate(undefined); setMaturityTouched(true); }}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live calc panel */}
      <div className="lg:col-span-1">
        <div className="lg:sticky lg:top-4 space-y-4">
          <Card className="bg-gradient-to-br from-primary to-accent text-primary-foreground border-0 shadow-lg">
            <CardHeader>
              <CardTitle className={cn("text-xl", labelCls)}>{T("liveCalc", lang)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className={cn("opacity-90", labelCls)}>{T("principal", lang)}</span>
                <span className="font-semibold">{fmtINR(Number(principal) || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className={cn("opacity-90", labelCls)}>{T("interest", lang)}</span>
                <span className="font-semibold">{fmtINR(calc.interest)}</span>
              </div>
              <div className="border-t border-primary-foreground/30 pt-3 flex justify-between text-lg">
                <span className={cn("font-bold", labelCls)}>{T("totalPayable", lang)}</span>
                <span className="font-bold">{fmtINR(calc.total)}</span>
              </div>
              {effectiveMaturity && (
                <div className="text-sm opacity-90 pt-2">
                  <span className={labelCls}>{T("maturityDate", lang).split("(")[0]}: </span>
                  <span className="font-semibold">{format(effectiveMaturity, "dd MMM yyyy")}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleCalculate} variant="secondary" className="w-full">
              <Calculator className="w-4 h-4 mr-2" />
              <span className={labelCls}>{T("calculate", lang)}</span>
            </Button>
            <Button onClick={reset} variant="outline" className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" />
              <span className={labelCls}>{T("reset", lang)}</span>
            </Button>
            <Button onClick={handleDownload} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
              <Download className="w-4 h-4 mr-2" />
              <span className={labelCls}>PDF</span>
            </Button>
            <Button onClick={handleSave} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              <span className={labelCls}>{T("saveRecord", lang)}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
