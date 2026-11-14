import { Lead, LeadStage, LeadSource, DealershipBranch } from "@/types/lead";

/**
 * Format channel/source key to human-readable label
 */
export function formatLeadSource(source: LeadSource): string {
  switch (source) {
    case "website_form":
      return "Website Form";
    case "vehicle_request":
      return "Vehicle Request";
    case "whatsapp":
      return "Direct WhatsApp";
    case "phone":
      return "Phone Call";
    case "walk_in":
      return "Showroom Walk-in";
    default:
      return source;
  }
}

/**
 * Format stage key to human-readable label
 */
export function formatLeadStage(stage: LeadStage): string {
  switch (stage) {
    case "new":
      return "New Enquiry";
    case "contacted":
      return "Contacted";
    case "viewing":
      return "Viewing / Test Drive";
    case "negotiating":
      return "Negotiating";
    case "won":
      return "Won (Sold)";
    case "lost":
      return "Closed Lost";
    default:
      return stage;
  }
}

/**
 * Format branch to human-readable label
 */
export function formatLeadBranch(branch: DealershipBranch): string {
  switch (branch) {
    case "polonnaruwa":
      return "Kaduruwela Main Showroom";
    case "trincomalee":
      return "Trincomalee Branch";
    default:
      return branch;
  }
}

/**
 * Helper to escape CSV cell value according to RFC 4180
 */
function escapeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""';
  const stringValue = String(value);
  // If string contains quotes, commas, newlines, or carriage returns, wrap in quotes and double quotes
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return `"${stringValue}"`;
}

/**
 * Format phone number for Excel so leading 0 isn't stripped
 */
function formatPhoneForExcel(phone: string): string {
  const clean = phone.trim();
  // Using formula notation ="077..." instructs Excel to strictly treat it as string
  if (clean.startsWith("0")) {
    return `="${clean}"`;
  }
  return `"${clean}"`;
}

/**
 * EXCEL / CSV EXPORT
 * Exports lead records to an RFC-4180 UTF-8 CSV with BOM for direct Excel compatibility.
 */
export function exportLeadsToExcel(leads: Lead[], filename?: string): void {
  if (typeof window === "undefined") return;

  const exportDate = new Date();
  const dateStamp = exportDate.toISOString().slice(0, 10);
  const targetFilename = filename || `rs-enterprises-leads-${dateStamp}.csv`;

  // CSV Columns Header
  const headers = [
    "Lead ID",
    "Customer Name",
    "Phone Number",
    "Email",
    "Source Channel",
    "Dealership Branch",
    "Stage",
    "Vehicle of Interest",
    "Customer Notes / Request",
    "Assigned Staff",
    "Follow-up Date",
    "Lost Reason",
    "Created Date",
    "Last Updated",
    "Total Notes Logged",
    "Latest Note",
  ];

  const rows: string[] = [headers.map((h) => `"${h}"`).join(",")];

  leads.forEach((lead) => {
    const latestNote = lead.notes && lead.notes.length > 0 ? lead.notes[lead.notes.length - 1] : null;
    const latestNoteSummary = latestNote
      ? `[${latestNote.author} - ${new Date(latestNote.time).toLocaleDateString()}]: ${latestNote.text}`
      : "";

    const row = [
      escapeCsvCell(lead.id),
      escapeCsvCell(lead.name),
      formatPhoneForExcel(lead.phone),
      escapeCsvCell(lead.email || "N/A"),
      escapeCsvCell(formatLeadSource(lead.source)),
      escapeCsvCell(formatLeadBranch(lead.branch)),
      escapeCsvCell(formatLeadStage(lead.stage)),
      escapeCsvCell(lead.vehicleTitle || "General Showroom Inquiry"),
      escapeCsvCell(lead.requestDetails || ""),
      escapeCsvCell(lead.assignedTo || "Unassigned"),
      escapeCsvCell(lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString() : "None"),
      escapeCsvCell(lead.lostReason || ""),
      escapeCsvCell(lead.createdAt ? new Date(lead.createdAt).toLocaleString() : ""),
      escapeCsvCell(lead.updatedAt ? new Date(lead.updatedAt).toLocaleString() : ""),
      escapeCsvCell(lead.notes?.length || 0),
      escapeCsvCell(latestNoteSummary),
    ];

    rows.push(row.join(","));
  });

  // \uFEFF is the UTF-8 Byte Order Mark (BOM).
  // Without this, Microsoft Excel assumes ANSI / Windows-1252 and will corrupt Unicode text.
  const csvContent = "\uFEFF" + rows.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = targetFilename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Helper to escape HTML characters in strings for PDF report
 */
function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * EXECUTIVE PIPELINE PDF REPORT EXPORT
 * Generates an executive, beautifully formatted printable report in a new print window.
 */
export function exportLeadsToPDF(
  leads: Lead[],
  options?: { title?: string; filterSummary?: string }
): void {
  if (typeof window === "undefined") return;

  const now = new Date();
  const formattedDate = now.toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Calculate Metrics
  const total = leads.length;
  const newCount = leads.filter((l) => l.stage === "new").length;
  const contactedCount = leads.filter((l) => l.stage === "contacted").length;
  const viewingCount = leads.filter((l) => l.stage === "viewing").length;
  const negotiatingCount = leads.filter((l) => l.stage === "negotiating").length;
  const wonCount = leads.filter((l) => l.stage === "won").length;
  const lostCount = leads.filter((l) => l.stage === "lost").length;
  const activeCount = contactedCount + viewingCount + negotiatingCount;
  const closedCount = wonCount + lostCount;
  const winRate = closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : 0;

  const reportTitle = options?.title || "EXECUTIVE CRM LEAD DOSSIER & PIPELINE REPORT";
  const filterSummary = options?.filterSummary || `All Leads (${total} Records)`;

  const tableRowsHtml = leads
    .map((lead, index) => {
      const stageStyle =
        lead.stage === "won"
          ? "background: #0f3e28; color: #34d399; border-color: #059669;"
          : lead.stage === "lost"
          ? "background: #361717; color: #f87171; border-color: #dc2626;"
          : lead.stage === "viewing"
          ? "background: #112845; color: #60a5fa; border-color: #2563eb;"
          : lead.stage === "negotiating"
          ? "background: #2d1c4d; color: #c084fc; border-color: #7c3aed;"
          : lead.stage === "contacted"
          ? "background: #1e293b; color: #94a3b8; border-color: #475569;"
          : "background: #3b2808; color: #fbbf24; border-color: #d97706;";

      const latestNote = lead.notes && lead.notes.length > 0 ? lead.notes[lead.notes.length - 1] : null;

      return `
        <tr>
          <td style="text-align: center; color: #888; font-family: monospace; font-size: 11px;">${index + 1}</td>
          <td>
            <div style="font-weight: 600; color: #111;">${escapeHtml(lead.name)}</div>
            <div style="font-size: 11px; color: #666; font-family: monospace;">${escapeHtml(lead.id)}</div>
          </td>
          <td>
            <div style="font-family: monospace; font-weight: 500; color: #111;">${escapeHtml(lead.phone)}</div>
            ${lead.email ? `<div style="font-size: 10px; color: #777;">${escapeHtml(lead.email)}</div>` : ""}
          </td>
          <td style="font-size: 11px;">
            <div>${escapeHtml(formatLeadSource(lead.source))}</div>
            <div style="font-size: 10px; color: #666;">${escapeHtml(formatLeadBranch(lead.branch))}</div>
          </td>
          <td>
            <div style="font-weight: 500; color: #111;">${escapeHtml(lead.vehicleTitle || "General Enquiry")}</div>
            ${
              lead.requestDetails
                ? `<div style="font-size: 10px; color: #555; font-style: italic; max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">&ldquo;${escapeHtml(lead.requestDetails)}&rdquo;</div>`
                : ""
            }
          </td>
          <td style="text-align: center;">
            <span style="display: inline-block; padding: 3px 8px; border-radius: 3px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid; ${stageStyle}">
              ${escapeHtml(formatLeadStage(lead.stage))}
            </span>
          </td>
          <td style="font-size: 11px;">
            <div>${escapeHtml(lead.assignedTo || "Unassigned")}</div>
          </td>
          <td style="font-size: 11px; font-family: monospace; text-align: center;">
            ${
              lead.followUpDate
                ? `<span style="color: #b45309; font-weight: 600;">${escapeHtml(new Date(lead.followUpDate).toLocaleDateString())}</span>`
                : `<span style="color: #aaa;">—</span>`
            }
          </td>
          <td style="font-size: 10px; color: #444; max-width: 200px;">
            ${
              latestNote
                ? `<div style="line-height: 1.3;"><strong>${escapeHtml(latestNote.author)}:</strong> ${escapeHtml(latestNote.text)}</div>`
                : `<span style="color: #bbb; font-style: italic;">No notes</span>`
            }
          </td>
        </tr>
      `;
    })
    .join("");

  const printHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>${escapeHtml(reportTitle)} - RS Enterprises</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 8mm 10mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #1a1a1a;
          background: #ffffff;
          margin: 0;
          padding: 0;
          font-size: 12px;
          line-height: 1.4;
        }

        /* Top Action Bar (hidden when printing) */
        .no-print {
          background: #0d0f12;
          color: #ffffff;
          padding: 12px 24px;
          display: flex;
          align-items: center;
          justify-between: space-between;
          border-bottom: 2px solid #d4af37;
          position: sticky;
          top: 0;
          z-index: 9999;
        }
        .no-print .title {
          font-family: Georgia, serif;
          font-size: 14px;
          letter-spacing: 1px;
          color: #d4af37;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .no-print .controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .btn {
          padding: 8px 18px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          border-radius: 2px;
          cursor: pointer;
          border: none;
          transition: all 0.15s ease;
        }
        .btn-gold {
          background: #d4af37;
          color: #060709;
        }
        .btn-gold:hover {
          background: #e6c555;
        }
        .btn-outline {
          background: transparent;
          color: #ccc;
          border: 1px solid #444;
        }
        .btn-outline:hover {
          color: #fff;
          border-color: #888;
        }

        @media print {
          .no-print {
            display: none !important;
          }
          body {
            padding: 0;
          }
        }

        .report-container {
          padding: 20px 24px;
          max-width: 100%;
        }

        /* Dealership Letterhead */
        .letterhead {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 16px;
          border-bottom: 2px solid #060709;
          margin-bottom: 16px;
        }
        .brand-badge {
          font-size: 9px;
          font-family: monospace;
          letter-spacing: 2px;
          color: #8c7324;
          text-transform: uppercase;
          margin-bottom: 4px;
          font-weight: 700;
        }
        .brand-name {
          font-family: "Cinzel", Georgia, serif;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 1.5px;
          color: #060709;
          margin: 0;
          line-height: 1.1;
        }
        .brand-tagline {
          font-size: 11px;
          color: #555;
          margin-top: 3px;
          letter-spacing: 0.5px;
        }
        .meta-col {
          text-align: right;
          font-size: 10px;
          color: #444;
          line-height: 1.5;
        }
        .meta-col strong {
          color: #111;
        }

        /* Document Title Ribbon */
        .doc-ribbon {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f7f7f8;
          border-left: 4px solid #d4af37;
          border-right: 1px solid #e5e7eb;
          border-top: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
          padding: 8px 14px;
          margin-bottom: 14px;
        }
        .doc-title {
          font-family: Georgia, serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.8px;
          color: #111;
          text-transform: uppercase;
        }
        .doc-filter {
          font-size: 10px;
          color: #666;
          font-family: monospace;
        }

        /* KPI Cards Grid */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 10px;
          margin-bottom: 16px;
        }
        .kpi-card {
          background: #fafafa;
          border: 1px solid #e2e4e8;
          border-radius: 2px;
          padding: 8px 10px;
          text-align: center;
        }
        .kpi-label {
          font-size: 9px;
          font-family: monospace;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #666;
          margin-bottom: 2px;
        }
        .kpi-value {
          font-family: Georgia, serif;
          font-size: 20px;
          font-weight: 700;
          color: #111;
          line-height: 1.1;
        }
        .kpi-highlight {
          border-top: 2px solid #d4af37;
        }

        /* Data Ledger Table */
        table.ledger {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        table.ledger th {
          background: #060709;
          color: #ffffff;
          padding: 7px 8px;
          text-align: left;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          border: 1px solid #060709;
        }
        table.ledger td {
          padding: 7px 8px;
          border: 1px solid #e2e4e8;
          vertical-align: middle;
        }
        table.ledger tbody tr:nth-child(even) {
          background-color: #f9fafb;
        }

        /* Footer */
        .footer {
          margin-top: 20px;
          padding-top: 10px;
          border-top: 1px solid #ddd;
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #888;
        }
      </style>
    </head>
    <body>
      <div class="no-print">
        <div class="title">
          <span>&#9733;</span> RS ENTERPRISES &mdash; CRM REPORT EXPORT SYSTEM
        </div>
        <div class="controls">
          <span style="font-size: 11px; color: #aaa;">Tip: In print preview, select <strong>&ldquo;Save as PDF&rdquo;</strong> to download</span>
          <button class="btn btn-gold" onclick="window.print()">&#128424; Print / Save as PDF</button>
          <button class="btn btn-outline" onclick="window.close()">Close Window</button>
        </div>
      </div>

      <div class="report-container">
        <!-- Letterhead -->
        <div class="letterhead">
          <div>
            <div class="brand-badge">Official Showroom Ledger &bull; Sri Lanka</div>
            <h1 class="brand-name">RS ENTERPRISES (PVT) LTD</h1>
            <div class="brand-tagline">Direct Japanese Automobile Importers &bull; Kaduruwela Main Showroom &bull; Trincomalee Branch</div>
          </div>
          <div class="meta-col">
            <div><strong>Business Reg:</strong> TH/DS/ACCT/BR/38/2018</div>
            <div><strong>Direct Inquiries:</strong> +94 77 758 7919 / 027 222 2345</div>
            <div><strong>Generated:</strong> ${escapeHtml(formattedDate)} at ${escapeHtml(formattedTime)}</div>
            <div><strong>System:</strong> RS Prestige CRM Admin Console</div>
          </div>
        </div>

        <!-- Ribbon -->
        <div class="doc-ribbon">
          <div class="doc-title">${escapeHtml(reportTitle)}</div>
          <div class="doc-filter">Scope: ${escapeHtml(filterSummary)}</div>
        </div>

        <!-- KPI Cards -->
        <div class="kpi-grid">
          <div class="kpi-card kpi-highlight">
            <div class="kpi-label">Total Leads</div>
            <div class="kpi-value">${total}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">New Enquiries</div>
            <div class="kpi-value" style="color: #b45309;">${newCount}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Active Deals</div>
            <div class="kpi-value" style="color: #2563eb;">${activeCount}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Won (Delivered)</div>
            <div class="kpi-value" style="color: #059669;">${wonCount}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Lost</div>
            <div class="kpi-value" style="color: #dc2626;">${lostCount}</div>
          </div>
          <div class="kpi-card kpi-highlight">
            <div class="kpi-label">Win Ratio</div>
            <div class="kpi-value" style="color: #d4af37;">${winRate}%</div>
          </div>
        </div>

        <!-- Leads Ledger Table -->
        <table class="ledger">
          <thead>
            <tr>
              <th style="width: 25px; text-align: center;">#</th>
              <th style="width: 140px;">Customer Name</th>
              <th style="width: 110px;">Contact Number</th>
              <th style="width: 120px;">Channel &amp; Branch</th>
              <th>Vehicle of Interest</th>
              <th style="width: 95px; text-align: center;">Stage</th>
              <th style="width: 90px;">Assigned</th>
              <th style="width: 75px; text-align: center;">Follow-up</th>
              <th style="width: 160px;">Latest Activity</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml || `<tr><td colspan="9" style="text-align: center; padding: 20px; color: #888;">No leads matched the current filter.</td></tr>`}
          </tbody>
        </table>

        <!-- Footer -->
        <div class="footer">
          <div>RS Enterprises (Pvt) Ltd &bull; Confidential Internal Executive Record &bull; Authorized Personnel Only</div>
          <div>Page 1 of 1 &bull; End of Dossier</div>
        </div>
      </div>

      <script>
        // Auto trigger print dialog shortly after render
        window.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => {
            window.print();
          }, 350);
        });
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
  } else {
    alert("Please allow pop-ups for this website to open the printable PDF report.");
  }
}

/**
 * INDIVIDUAL CUSTOMER LEAD DOSSIER PDF EXPORT
 * For printing or saving a comprehensive single lead dossier before viewing or client meeting.
 */
export function exportSingleLeadToPDF(lead: Lead): void {
  if (typeof window === "undefined") return;

  const now = new Date();
  const formattedDate = now.toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const notesHtml =
    lead.notes && lead.notes.length > 0
      ? lead.notes
          .map(
            (n) => `
          <div style="padding: 10px 12px; background: #fafafa; border: 1px solid #e5e7eb; border-radius: 2px; margin-bottom: 8px;">
            <div style="font-size: 12px; color: #111; line-height: 1.4;">${escapeHtml(n.text)}</div>
            <div style="display: flex; justify-content: space-between; font-size: 10px; font-family: monospace; color: #777; margin-top: 6px; padding-top: 4px; border-top: 1px dashed #e5e7eb;">
              <span>Logged by ${escapeHtml(n.author)}</span>
              <span>${escapeHtml(new Date(n.time).toLocaleString())}</span>
            </div>
          </div>
        `
          )
          .join("")
      : `<p style="font-size: 11px; color: #888; font-style: italic;">No communication notes recorded yet.</p>`;

  const printHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Lead Dossier - ${escapeHtml(lead.name)} - RS Enterprises</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 14mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #1a1a1a;
          background: #ffffff;
          margin: 0;
          padding: 0;
          font-size: 12px;
          line-height: 1.5;
        }
        .no-print {
          background: #0d0f12;
          color: #ffffff;
          padding: 12px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 2px solid #d4af37;
          position: sticky;
          top: 0;
          z-index: 9999;
        }
        .btn {
          padding: 8px 18px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          border-radius: 2px;
          cursor: pointer;
          border: none;
        }
        .btn-gold {
          background: #d4af37;
          color: #060709;
        }
        .btn-outline {
          background: transparent;
          color: #ccc;
          border: 1px solid #444;
        }
        @media print {
          .no-print { display: none !important; }
        }
        .container {
          padding: 24px 30px;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          display: flex;
          justify-content: space-between;
          border-bottom: 2px solid #060709;
          padding-bottom: 14px;
          margin-bottom: 20px;
        }
        .section-title {
          font-family: Georgia, serif;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #060709;
          border-bottom: 1px solid #d4af37;
          padding-bottom: 4px;
          margin: 18px 0 10px 0;
          font-weight: 700;
        }
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .info-cell {
          background: #fbfbfb;
          border: 1px solid #e5e7eb;
          padding: 8px 12px;
          border-radius: 2px;
        }
        .info-label {
          font-size: 9px;
          font-family: monospace;
          text-transform: uppercase;
          color: #777;
          letter-spacing: 0.5px;
        }
        .info-value {
          font-size: 13px;
          font-weight: 600;
          color: #111;
          margin-top: 2px;
        }
      </style>
    </head>
    <body>
      <div class="no-print">
        <div style="color: #d4af37; font-family: Georgia, serif; font-size: 13px; letter-spacing: 1px;">
          RS ENTERPRISES &bull; INDIVIDUAL LEAD DOSSIER
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-gold" onclick="window.print()">Print / Save as PDF</button>
          <button class="btn btn-outline" onclick="window.close()">Close</button>
        </div>
      </div>

      <div class="container">
        <div class="header">
          <div>
            <div style="font-size: 9px; font-family: monospace; letter-spacing: 1.5px; color: #8c7324; text-transform: uppercase;">
              Showroom Client Profile Sheet
            </div>
            <h1 style="font-family: 'Cinzel', Georgia, serif; font-size: 22px; margin: 4px 0 0 0; color: #060709;">
              RS ENTERPRISES (PVT) LTD
            </h1>
            <div style="font-size: 10px; color: #666;">Kaduruwela &bull; Trincomalee &bull; Reg: TH/DS/ACCT/BR/38/2018</div>
          </div>
          <div style="text-align: right; font-size: 10px; color: #555;">
            <div><strong>Ref:</strong> ${escapeHtml(lead.id)}</div>
            <div><strong>Date:</strong> ${escapeHtml(formattedDate)}</div>
            <div><strong>Status:</strong> <span style="font-weight: 700; color: #b45309; text-transform: uppercase;">${escapeHtml(formatLeadStage(lead.stage))}</span></div>
          </div>
        </div>

        <div class="section-title">Customer Information</div>
        <div class="grid-2">
          <div class="info-cell">
            <div class="info-label">Customer Name</div>
            <div class="info-value">${escapeHtml(lead.name)}</div>
          </div>
          <div class="info-cell">
            <div class="info-label">Primary Telephone</div>
            <div class="info-value" style="font-family: monospace;">${escapeHtml(lead.phone)}</div>
          </div>
          <div class="info-cell">
            <div class="info-label">Email Address</div>
            <div class="info-value">${escapeHtml(lead.email || "Not Provided")}</div>
          </div>
          <div class="info-cell">
            <div class="info-label">Inquiry Channel</div>
            <div class="info-value">${escapeHtml(formatLeadSource(lead.source))}</div>
          </div>
        </div>

        <div class="section-title">Vehicle &amp; Dealership Routing</div>
        <div class="grid-2">
          <div class="info-cell" style="grid-column: span 2;">
            <div class="info-label">Vehicle of Interest</div>
            <div class="info-value" style="font-family: Georgia, serif; font-size: 16px; color: #060709;">
              ${escapeHtml(lead.vehicleTitle || "General Showroom Consultation")}
            </div>
          </div>
          <div class="info-cell">
            <div class="info-label">Assigned Branch</div>
            <div class="info-value">${escapeHtml(formatLeadBranch(lead.branch))}</div>
          </div>
          <div class="info-cell">
            <div class="info-label">Assigned Sales Executive</div>
            <div class="info-value">${escapeHtml(lead.assignedTo || "Unassigned")}</div>
          </div>
          <div class="info-cell">
            <div class="info-label">Scheduled Follow-up</div>
            <div class="info-value" style="font-family: monospace; color: #b45309;">
              ${lead.followUpDate ? escapeHtml(new Date(lead.followUpDate).toLocaleDateString()) : "None Scheduled"}
            </div>
          </div>
          <div class="info-cell">
            <div class="info-label">First Contact Date</div>
            <div class="info-value" style="font-family: monospace;">
              ${lead.createdAt ? escapeHtml(new Date(lead.createdAt).toLocaleDateString()) : "Recent"}
            </div>
          </div>
        </div>

        ${
          lead.requestDetails
            ? `
          <div class="section-title">Original Client Message / Specifications</div>
          <div style="background: #fafafa; border: 1px solid #e5e7eb; padding: 12px 14px; border-radius: 2px; font-style: italic; color: #333; line-height: 1.5;">
            &ldquo;${escapeHtml(lead.requestDetails)}&rdquo;
          </div>
        `
            : ""
        }

        <div class="section-title">Conversation &amp; Viewing Activity Log (${lead.notes?.length || 0})</div>
        <div>
          ${notesHtml}
        </div>

        <div style="margin-top: 40px; padding-top: 15px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 10px; color: #666;">
          <div>Sales Officer Signature: __________________________</div>
          <div>Director Approval: __________________________</div>
        </div>
      </div>

      <script>
        window.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => { window.print(); }, 350);
        });
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
  } else {
    alert("Please allow pop-ups for this website to open the printable PDF report.");
  }
}

