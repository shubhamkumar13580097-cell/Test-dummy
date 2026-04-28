import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import type { Record } from "./storage";
import type { Lang } from "./i18n";
import { dict } from "./i18n";
import { fmtINR } from "./calc";
import { format } from "date-fns";

const SHOP_EN = "Khushi Jewellers";
const SHOP_HI = "खुशी ज्वैलर्स";
const ADDR_EN = "Bari Pahari, Bihar Sharif, Bihar 803118";
const ADDR_HI = "बाड़ी पहाड़ी, बिहार शरीफ, बिहार 803118";

const escapeHtml = (s: string) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br/>");

function buildSlipHtml(r: Record, lang: Lang): string {
  const isHi = lang === "hi";
  const L = (hi: string, en: string) => (isHi ? hi : en);

  const ratePeriod = r.calc.ratePeriod === "month" ? L("प्रति माह", "per month") : L("प्रति वर्ष", "per year");
  const timeUnit = r.calc.timeUnit === "months" ? L("माह", "Months") : L("वर्ष", "Years");
  const typeLabel =
    r.calc.type === "SI"
      ? L("साधारण ब्याज", "Simple Interest")
      : `${L("चक्रवृद्धि ब्याज", "Compound Interest")} (${r.calc.freq})`;

  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:8px 10px;border:1px solid #d4af37;background:#fffaf0;font-weight:600;width:42%;">${escapeHtml(label)}</td>
      <td style="padding:8px 10px;border:1px solid #d4af37;">${escapeHtml(value)}</td>
    </tr>`;

  const imgBlock = r.imageDataUrl
    ? `<img src="${r.imageDataUrl}" style="width:130px;height:130px;object-fit:cover;border:2px solid #b8860b;border-radius:6px;" />`
    : "";

  return `
  <div style="
    width:794px;
    min-height:1123px;
    padding:40px 38px;
    box-sizing:border-box;
    background:#ffffff;
    color:#1f1f1f;
    font-family: 'Noto Sans Devanagari', 'Noto Sans', Arial, sans-serif;
    font-size:14px;
    line-height:1.45;
  ">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#b8860b,#d4af37);color:#fff;padding:18px 20px;border-radius:8px;text-align:center;">
      <div style="font-size:26px;font-weight:800;letter-spacing:0.5px;">${SHOP_HI} / ${SHOP_EN}</div>
      <div style="font-size:13px;margin-top:4px;opacity:0.95;">${ADDR_HI}</div>
      <div style="font-size:12px;opacity:0.92;">${ADDR_EN}</div>
      <div style="margin-top:6px;font-size:13px;font-weight:600;">गिरवी ऋण पर्ची / Mortgage Loan Slip</div>
    </div>

    <!-- Meta -->
    <div style="display:flex;justify-content:space-between;margin-top:18px;font-weight:600;font-size:13px;">
      <div>${L("पर्ची संख्या", "Slip No")}: ${escapeHtml(r.slipNo)}</div>
      <div>${L("दिनांक", "Date")}: ${format(new Date(r.createdAt), "dd MMM yyyy, hh:mm a")}</div>
    </div>
    <hr style="border:none;border-top:2px solid #b8860b;margin:10px 0 16px;" />

    <!-- Customer -->
    <div style="font-weight:700;font-size:16px;color:#8b6914;margin-bottom:8px;">${L("ग्राहक विवरण", "Customer Details")}</div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:14px;">
      ${row(L("नाम / Name", "Name / नाम"), r.customerName)}
      ${row(L("पता / Address", "Address / पता"), r.address)}
      ${row(L("फोन / Phone", "Phone / फोन"), r.phone)}
    </table>

    <!-- Jewellery -->
    <div style="font-weight:700;font-size:16px;color:#8b6914;margin-bottom:8px;">${L("गहना विवरण", "Jewellery Details")}</div>
    <div style="display:flex;gap:16px;align-items:flex-start;margin-bottom:14px;">
      <table style="flex:1;border-collapse:collapse;">
        ${row(L("गहना / Item", "Item / गहना"), r.itemName)}
        ${row(L("वज़न / Weight", "Weight / वज़न"), `${r.weight} g`)}
      </table>
      ${imgBlock}
    </div>

    <!-- Loan -->
    <div style="font-weight:700;font-size:16px;color:#8b6914;margin-bottom:8px;">${L("ऋण विवरण", "Loan Details")}</div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
      ${row(L("मूल राशि", "Principal"), fmtINR(r.calc.principal))}
      ${row(L("ब्याज प्रकार", "Interest Type"), typeLabel)}
      ${row(L("दर", "Rate"), `${r.calc.rate}% ${ratePeriod}`)}
      ${row(L("अवधि", "Time"), `${r.calc.time} ${timeUnit}`)}
      ${row(L("ब्याज", "Interest"), fmtINR(r.interest))}
      ${row(L("कुल देय", "Total Payable"), fmtINR(r.total))}
      ${r.maturityDate ? row(L("वापसी तिथि", "Maturity Date"), format(new Date(r.maturityDate), "dd MMM yyyy")) : ""}
    </table>

    <!-- Declaration -->
    <div style="font-style:italic;font-size:12px;color:#555;border-left:3px solid #b8860b;padding:8px 12px;background:#fffaf0;margin-bottom:36px;">
      ${L(
        "घोषणा: मैं पुष्टि करता हूँ कि उपरोक्त गहना मेरा है तथा मैंने उसे गिरवी रखकर ऋण लिया है।",
        "Declaration: I confirm the above jewellery belongs to me and is pledged for the loan stated above."
      )}
      <br/>
      ${L(
        "Declaration: I confirm the above jewellery belongs to me and is pledged for the loan stated above.",
        "घोषणा: मैं पुष्टि करता हूँ कि उपरोक्त गहना मेरा है तथा मैंने उसे गिरवी रखकर ऋण लिया है।"
      )}
    </div>

    <!-- Signatures -->
    <div style="display:flex;justify-content:space-between;margin-top:60px;">
      <div style="width:42%;text-align:center;">
        <div style="border-top:1px solid #333;padding-top:6px;font-size:12px;">
          ${L("ग्राहक के हस्ताक्षर", "Customer Signature")}<br/>
          <span style="color:#777;">${L("Customer Signature", "ग्राहक के हस्ताक्षर")}</span>
        </div>
      </div>
      <div style="width:42%;text-align:center;">
        <div style="border-top:1px solid #333;padding-top:6px;font-size:12px;">
          ${L("दुकानदार के हस्ताक्षर", "Shopkeeper Signature")}<br/>
          <span style="color:#777;">${L("Shopkeeper Signature", "दुकानदार के हस्ताक्षर")}</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="position:relative;margin-top:30px;text-align:center;font-size:11px;color:#888;border-top:1px solid #eee;padding-top:8px;">
      ${SHOP_HI} / ${SHOP_EN} • ${ADDR_EN}
    </div>
  </div>`;
}

export async function generateSlipPDF(r: Record, lang: Lang) {
  // Render off-screen HTML so Devanagari renders via the loaded web font
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.background = "#fff";
  container.innerHTML = buildSlipHtml(r, lang);
  document.body.appendChild(container);

  // Ensure fonts are ready before rasterizing
  try {
    // @ts-ignore
    if (document.fonts?.ready) await document.fonts.ready;
  } catch {}

  try {
    const target = container.firstElementChild as HTMLElement;
    const canvas = await html2canvas(target, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pageW = pdf.internal.pageSize.getWidth();   // 210
    const pageH = pdf.internal.pageSize.getHeight();  // 297
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;

    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    if (imgH <= pageH) {
      pdf.addImage(imgData, "JPEG", 0, 0, imgW, imgH);
    } else {
      // multi-page if content overflows
      let heightLeft = imgH;
      let position = 0;
      pdf.addImage(imgData, "JPEG", 0, position, imgW, imgH);
      heightLeft -= pageH;
      while (heightLeft > 0) {
        position = heightLeft - imgH;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgW, imgH);
        heightLeft -= pageH;
      }
    }

    pdf.save(`${r.slipNo}_${r.customerName.replace(/\s+/g, "_")}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
  void dict;
}

export function generateRecordsPDF(records: Record[]) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(184, 134, 11);
  doc.rect(0, 0, W, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`${SHOP_EN} — Records Report`, W / 2, 11, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${format(new Date(), "dd MMM yyyy, hh:mm a")} • Total: ${records.length}`, W / 2, 18, { align: "center" });

  autoTable(doc, {
    startY: 28,
    head: [["Slip No", "Date", "Customer", "Phone", "Item", "Weight", "Principal", "Interest", "Total", "Maturity", "Status"]],
    body: records.map(r => [
      r.slipNo,
      format(new Date(r.createdAt), "dd/MM/yy HH:mm"),
      r.customerName,
      r.phone,
      r.itemName,
      `${r.weight}g`,
      fmtINR(r.calc.principal),
      fmtINR(r.interest),
      fmtINR(r.total),
      r.maturityDate ? format(new Date(r.maturityDate), "dd/MM/yy") : "-",
      r.status,
    ]),
    headStyles: { fillColor: [184, 134, 11], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 8, right: 8 },
  });
  doc.save(`khushi-jewellers-records-${format(new Date(), "yyyyMMdd-HHmm")}.pdf`);
}

export function exportCSV(records: Record[]) {
  const headers = ["Slip No", "Date", "Customer", "Phone", "Address", "Item", "Weight (g)", "Type", "Rate", "Time", "Principal", "Interest", "Total", "Maturity", "Status"];
  const rows = records.map(r => [
    r.slipNo,
    format(new Date(r.createdAt), "yyyy-MM-dd HH:mm"),
    r.customerName,
    r.phone,
    r.address.replace(/\n/g, " "),
    r.itemName,
    r.weight,
    r.calc.type,
    `${r.calc.rate}% ${r.calc.ratePeriod}`,
    `${r.calc.time} ${r.calc.timeUnit}`,
    r.calc.principal,
    r.interest.toFixed(2),
    r.total.toFixed(2),
    r.maturityDate ? format(new Date(r.maturityDate), "yyyy-MM-dd") : "",
    r.status,
  ]);
  const csv = [headers, ...rows].map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `khushi-jewellers-records-${format(new Date(), "yyyyMMdd-HHmm")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
