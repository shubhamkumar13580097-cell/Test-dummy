import { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, FileDown, Upload, Trash2, Eye, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { dict, type Lang } from "@/lib/i18n";
import { fmtINR } from "@/lib/calc";
import { deleteRecord, loadRecords, saveRecords, updateRecord, type Record } from "@/lib/storage";
import { exportCSV, generateRecordsPDF, generateSlipPDF } from "@/lib/pdf";

const T = (k: keyof typeof dict, lang: Lang) => dict[k][lang];

interface Props {
  lang: Lang;
  refreshKey: number;
  onChange: () => void;
}

export default function RecordsView({ lang, refreshKey, onChange }: Props) {
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const records = useMemo(() => loadRecords(), [refreshKey]);

  const filtered = useMemo(() => {
    return records.filter(r => {
      if (search) {
        const s = search.toLowerCase();
        if (!r.customerName.toLowerCase().includes(s) && !r.phone.includes(s) && !r.slipNo.toLowerCase().includes(s)) return false;
      }
      if (from && new Date(r.createdAt) < new Date(from)) return false;
      if (to && new Date(r.createdAt) > new Date(to + "T23:59:59")) return false;
      return true;
    });
  }, [records, search, from, to]);

  const labelCls = lang === "hi" ? "font-devanagari" : "";

  const totalActive = filtered.filter(r => r.status === "active").reduce((s, r) => s + r.total, 0);

  const handleDelete = (id: string) => {
    if (!confirm("Delete this record?")) return;
    deleteRecord(id);
    onChange();
    toast.success("Deleted");
  };

  const handleRepaid = (id: string) => {
    updateRecord(id, { status: "repaid" });
    onChange();
    toast.success("Marked as repaid");
  };

  const handleBackup = () => {
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `khushi-jewellers-backup-${format(new Date(), "yyyyMMdd-HHmm")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup downloaded");
  };

  const handleRestore = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!Array.isArray(data)) throw new Error();
        if (!confirm(`Restore ${data.length} records? This will replace current data.`)) return;
        saveRecords(data);
        onChange();
        toast.success(`Restored ${data.length} records`);
      } catch {
        toast.error("Invalid backup file");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle className={cn("text-xl", labelCls)}>{T("recordsList", lang)}</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => exportCSV(filtered)} disabled={!filtered.length}>
                <FileDown className="w-4 h-4 mr-2" />
                <span className={labelCls}>{T("exportCSV", lang)}</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => generateRecordsPDF(filtered)} disabled={!filtered.length}>
                <FileText className="w-4 h-4 mr-2" />
                <span className={labelCls}>{T("exportPDF", lang)}</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleBackup} disabled={!records.length}>
                <Download className="w-4 h-4 mr-2" />
                <span className={labelCls}>{T("backup", lang)}</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                <span className={labelCls}>{T("restore", lang)}</span>
              </Button>
              <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={e => e.target.files?.[0] && handleRestore(e.target.files[0])} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-3 mb-4">
            <Input placeholder={T("search", lang)} value={search} onChange={e => setSearch(e.target.value)} className={labelCls} />
            <div>
              <label className={cn("text-xs text-muted-foreground", labelCls)}>{T("fromDate", lang)}</label>
              <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
            </div>
            <div>
              <label className={cn("text-xs text-muted-foreground", labelCls)}>{T("toDate", lang)}</label>
              <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
            </div>
          </div>

          <div className="text-sm text-muted-foreground mb-3">
            <span className={labelCls}>{T("total", lang)}: </span>
            <span className="font-semibold text-foreground">{filtered.length}</span>
            {" • "}
            <span className={labelCls}>{T("active", lang)} {T("totalPayable", lang)}: </span>
            <span className="font-semibold text-foreground">{fmtINR(totalActive)}</span>
          </div>

          {filtered.length === 0 ? (
            <div className={cn("text-center py-12 text-muted-foreground", labelCls)}>{T("noRecords", lang)}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Slip</TableHead>
                    <TableHead className={labelCls}>{T("date", lang)}</TableHead>
                    <TableHead className={labelCls}>{T("customerName", lang)}</TableHead>
                    <TableHead className={labelCls}>{T("phone", lang)}</TableHead>
                    <TableHead className={cn("text-right", labelCls)}>{T("principal", lang)}</TableHead>
                    <TableHead className={cn("text-right", labelCls)}>{T("totalPayable", lang)}</TableHead>
                    <TableHead className={labelCls}>{T("status", lang)}</TableHead>
                    <TableHead className="text-right">⋯</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.slipNo}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{format(new Date(r.createdAt), "dd/MM/yy HH:mm")}</TableCell>
                      <TableCell className="font-medium">{r.customerName}</TableCell>
                      <TableCell className="text-xs">{r.phone}</TableCell>
                      <TableCell className="text-right">{fmtINR(r.calc.principal)}</TableCell>
                      <TableCell className="text-right font-semibold">{fmtINR(r.total)}</TableCell>
                      <TableCell>
                        <Badge variant={r.status === "active" ? "default" : "secondary"} className={cn(r.status === "repaid" && "bg-success text-success-foreground", labelCls)}>
                          {r.status === "active" ? T("active", lang) : T("repaid", lang)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" title={T("downloadPDF", lang)} onClick={() => generateSlipPDF(r, lang)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {r.status === "active" && (
                            <Button size="icon" variant="ghost" title={T("markRepaid", lang)} onClick={() => handleRepaid(r.id)}>
                              <CheckCircle2 className="w-4 h-4 text-success" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" title={T("delete", lang)} onClick={() => handleDelete(r.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
