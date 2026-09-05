import { useEffect, useState } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { api } from '../../services/api.js';

const currentYear = new Date().getFullYear();
const money = value => `Rs. ${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const total = rows => rows.reduce((sum, row) => sum + row.balance, 0);

export function BalanceSheetPage() {
  const [year, setYear] = useState(currentYear);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    api.get('/reports/balance-sheet', { params: { year }}).then(response => active && setReport(response.data.data)).catch(requestError => active && setError(requestError.response?.data?.message || (requestError.request ? 'The report server is unavailable. Check that the API is running.' : 'Unable to load Balance Sheet report.'))).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [year]);

  const goBack = () => window.history.back();
  const liabilities = [...(report?.liabilities || []), ...(report?.capital || [])];
  const rows = (items, empty) => items.length ? items.map(row => <div className="balance-sheet-row" key={row.id}><span>{row.name}</span><strong>{money(row.balance)}</strong></div>) : <div className="balance-sheet-empty">{empty}</div>;

  return <div className="balance-sheet-page">
    <h1 className="balance-sheet-title">Balance Sheet</h1>
    <p className="balance-sheet-subtitle">Showing Company's assets and liabilities.</p>
    <div className="balance-sheet-toolbar report-print-hidden"><button className="report-print-button" onClick={() => window.print()}><Printer size={17} /> Print</button><select aria-label="Report year" value={year} onChange={event => setYear(Number(event.target.value))}>{[currentYear - 1, currentYear, currentYear + 1].map(option => <option key={option} value={option}>{option}</option>)}</select><button className="report-back-button" onClick={goBack}><ArrowLeft size={17} /> Back</button></div>
    {loading ? <div className="balance-sheet-state">Loading report...</div> : error ? <div className="balance-sheet-state report-error">{error}</div> : <>
      <div className="balance-sheet-report"><section className="balance-sheet-side"><h2>Assets</h2>{rows(report.assets, 'No asset balances')}</section><section className="balance-sheet-side"><h2>Liabilities &amp; Capital</h2>{rows(liabilities, 'No liability or capital balances')}</section><div className="balance-sheet-total"><span>Total Assets</span><strong>{money(total(report.assets))}</strong></div><div className="balance-sheet-total"><span>Total Liabilities &amp; Capital</span><strong>{money(total(liabilities))}</strong></div></div>
      <div className="balance-sheet-legend"><b>Account classification</b><span>Bank - Account type Asset</span><span>Cash - Account type Asset</span><span>Debtors - Account type Asset</span><span>Creditors - Account type Liability</span><span>Capital - Account type Capital</span></div>
    </>}
  </div>;
}