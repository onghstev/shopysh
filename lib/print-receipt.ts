/**
 * Opens an isolated print popup window containing a single receipt.
 * Works in any page — just pass the receipt data and business profile.
 */

const fmtN = (n: number) =>
  n.toLocaleString('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 });

export interface ReceiptLine {
  description: string;
  qty?: number;
  unitPrice?: number;
  amount: number;
}

export interface ReceiptData {
  receiptNumber: string;          // e.g. "RCT-2026-0001" or order number
  date: string | Date;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  paymentMethod?: string;
  lines: ReceiptLine[];
  subtotal?: number;              // if omitted, summed from lines
  discount?: number;
  tax?: number;
  total: number;
  notes?: string;
  type?: 'RECEIPT' | 'PAYMENT';  // default RECEIPT
}

export interface BizProfile {
  businessName?: string;
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
}

export function printReceipt(data: ReceiptData, biz?: BizProfile | null) {
  const bizName    = biz?.businessName || biz?.name || '';
  const bizAddress = biz?.address
    ? biz.address
    : [biz?.city, biz?.state, biz?.country].filter(Boolean).join(', ');
  const bizPhone   = biz?.phone  || '';
  const bizEmail   = biz?.email  || '';

  const receiptDate = new Date(data.date).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const receiptTime = new Date(data.date).toLocaleTimeString('en-NG', {
    hour: '2-digit', minute: '2-digit',
  });

  const subtotal = data.subtotal ?? data.lines.reduce((s, l) => s + l.amount, 0);
  const discount = data.discount ?? 0;
  const tax      = data.tax      ?? 0;
  const heading  = (data.type ?? 'RECEIPT') === 'PAYMENT' ? 'PAYMENT VOUCHER' : 'RECEIPT';
  const payMethod = data.paymentMethod?.replace(/_/g, ' ') || '';

  const linesHtml = data.lines.map(l => {
    const hasQty = l.qty != null && l.unitPrice != null;
    return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6">${l.description}</td>
        ${hasQty ? `<td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;text-align:center">${l.qty}</td>
                    <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;text-align:right;font-family:monospace">${fmtN(l.unitPrice!)}</td>` : ''}
        <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;text-align:right;font-family:monospace">${fmtN(l.amount)}</td>
      </tr>`;
  }).join('');

  const hasQtyCols = data.lines.some(l => l.qty != null);
  const colCount   = hasQtyCols ? 4 : 2;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${heading} ${data.receiptNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a1a; padding: 40px; max-width: 680px; margin: 0 auto; }
    .header  { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .heading { font-size: 30px; font-weight: 900; color: hsl(168,84%,26%); letter-spacing: -0.5px; }
    .sub     { font-size: 14px; font-weight: 700; color: #555; margin-top: 3px; }
    .biz     { text-align: right; }
    .biz-name{ font-weight: 800; font-size: 15px; }
    .biz-sub { font-size: 12px; color: #6b7280; line-height: 1.5; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 16px 0; }
    .meta    { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .meta-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; font-weight: 700; margin-bottom: 4px; }
    .meta-val   { font-size: 13px; font-weight: 600; }
    .meta-sub   { font-size: 11px; color: #6b7280; }
    table { width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; }
    thead tr { background: #f9fafb; }
    th { padding: 9px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 700; border-bottom: 1px solid #e5e7eb; text-align: left; }
    th:not(:first-child) { text-align: right; }
    .totals { margin-top: 12px; }
    .total-row { display: flex; justify-content: space-between; font-size: 12px; color: #6b7280; padding: 3px 0; }
    .total-row.grand { font-size: 16px; font-weight: 800; color: hsl(168,84%,26%); border-top: 2px solid #e5e7eb; padding-top: 8px; margin-top: 4px; }
    .footer { margin-top: 28px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #9ca3af; line-height: 1.8; }
    .stamp  { display: inline-block; border: 2px solid hsl(168,84%,26%); color: hsl(168,84%,26%); border-radius: 6px; padding: 4px 14px; font-size: 13px; font-weight: 800; letter-spacing: 2px; margin-bottom: 8px; }
    @media print { body { padding: 24px; } }
  </style>
</head>
<body>

  <div class="header">
    <div>
      <div class="heading">${heading}</div>
      <div class="sub">${data.receiptNumber}</div>
    </div>
    <div class="biz">
      ${bizName    ? `<div class="biz-name">${bizName}</div>` : ''}
      ${bizAddress ? `<div class="biz-sub">${bizAddress}</div>` : ''}
      ${bizPhone   ? `<div class="biz-sub">Tel: ${bizPhone}</div>` : ''}
      ${bizEmail   ? `<div class="biz-sub">${bizEmail}</div>` : ''}
    </div>
  </div>

  <hr/>

  <div class="meta">
    <div>
      <div class="meta-label">Received From</div>
      ${data.customerName  ? `<div class="meta-val">${data.customerName}</div>` : '<div class="meta-val" style="color:#9ca3af;font-style:italic">Walk-in / Sundry</div>'}
      ${data.customerPhone ? `<div class="meta-sub">${data.customerPhone}</div>` : ''}
      ${data.customerEmail ? `<div class="meta-sub">${data.customerEmail}</div>` : ''}
    </div>
    <div style="text-align:right">
      <div class="meta-label">Date &amp; Time</div>
      <div class="meta-val">${receiptDate}</div>
      <div class="meta-sub">${receiptTime}</div>
      ${payMethod ? `<div class="meta-sub" style="margin-top:4px">Payment: <strong>${payMethod}</strong></div>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        ${hasQtyCols ? '<th style="text-align:center">Qty</th><th>Unit Price</th>' : ''}
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>${linesHtml}</tbody>
  </table>

  <div class="totals">
    ${subtotal !== data.total ? `<div class="total-row"><span>Subtotal</span><span style="font-family:monospace">${fmtN(subtotal)}</span></div>` : ''}
    ${discount > 0 ? `<div class="total-row"><span>Discount</span><span style="font-family:monospace;color:#16a34a">-${fmtN(discount)}</span></div>` : ''}
    ${tax > 0      ? `<div class="total-row"><span>Tax</span><span style="font-family:monospace">${fmtN(tax)}</span></div>` : ''}
    <div class="total-row grand"><span>Total Received</span><span style="font-family:monospace">${fmtN(data.total)}</span></div>
  </div>

  ${data.notes ? `<p style="margin-top:16px;font-size:12px;color:#6b7280;background:#f9fafb;padding:10px 12px;border-radius:6px">${data.notes}</p>` : ''}

  <div class="footer">
    <div class="stamp">PAID</div>
    <p>Thank you for your payment.</p>
    <p>Please keep this receipt for your records.</p>
  </div>

  <script>window.onload = function(){ window.print(); }</script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=720,height=900');
  if (win) { win.document.write(html); win.document.close(); }
}
