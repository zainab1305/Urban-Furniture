const escapeHtml = value => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const money = value => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export function printDocument({ kind, number, partyLabel, partyName, date, dueDate, lines, subtotal, tax, total, paid = 0, status }) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return false;

  const rows = lines.map(line => `<tr><td>${escapeHtml(line.product)}</td><td>${escapeHtml(line.quantity)}</td><td>${money(line.unitPrice)}</td><td>${money(line.total)}</td></tr>`).join('');
  printWindow.document.open();
  printWindow.document.write(`<!doctype html><html><head><title>${escapeHtml(number)}</title><style>
*{box-sizing:border-box}body{margin:0;padding:42px;color:#202b31;font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}main{max-width:780px;margin:auto}.top{display:flex;justify-content:space-between;border-bottom:2px solid #e57938;padding-bottom:24px}.brand{font-size:22px;font-weight:800;letter-spacing:2px}.label{color:#7a878d;font-size:11px;text-transform:uppercase;letter-spacing:1px}.number{color:#e57938;font-size:20px;font-weight:700;margin-top:6px}.meta{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin:28px 0}.meta b{display:block;margin-top:6px;font-size:14px}table{width:100%;border-collapse:collapse;margin-top:18px}th{text-align:left;background:#f5f7f6;color:#6e7b81;font-size:10px;letter-spacing:1px;padding:11px}td{border-bottom:1px solid #e4e9e7;padding:13px 11px}td:nth-child(n+2),th:nth-child(n+2){text-align:right}.totals{margin:22px 0 0 auto;width:280px}.totals div{display:flex;justify-content:space-between;padding:7px 0;color:#6e7b81}.totals .grand{border-top:2px solid #202b31;color:#202b31;font-size:17px;font-weight:700;margin-top:6px;padding-top:12px}.status{display:inline-block;background:#eaf7f1;color:#238c6a;border-radius:4px;padding:5px 8px;font-weight:700;font-size:11px}.footer{border-top:1px solid #e4e9e7;margin-top:42px;padding-top:16px;color:#8b979b;font-size:11px}@media print{body{padding:0}}
</style></head><body><main><div class="top"><div><div class="brand">URBAN FURNITURE</div><div class="label">${escapeHtml(kind)}</div></div><div style="text-align:right"><div class="label">Document number</div><div class="number">${escapeHtml(number)}</div><span class="status">${escapeHtml(status)}</span></div></div><div class="meta"><div><div class="label">${escapeHtml(partyLabel)}</div><b>${escapeHtml(partyName)}</b></div><div><div class="label">Document date</div><b>${escapeHtml(date)}</b></div><div><div class="label">Due date</div><b>${escapeHtml(dueDate || '—')}</b></div></div><table><thead><tr><th>PRODUCT</th><th>QTY</th><th>UNIT PRICE</th><th>TOTAL</th></tr></thead><tbody>${rows}</tbody></table><div class="totals"><div><span>Subtotal</span><b>${money(subtotal)}</b></div><div><span>Tax</span><b>${money(tax)}</b></div><div><span>Paid</span><b>${money(paid)}</b></div><div class="grand"><span>Amount due</span><b>${money(Number(total) - Number(paid))}</b></div></div><div class="footer">Generated from Urban Furniture ERP · ${new Date().toLocaleDateString('en-IN')}</div></main></body></html>`);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 300);
  return true;
}