import { useEffect, useState } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { api } from '../../services/api.js';

const currentYear = new Date().getFullYear();
const money = value => `Rs. ${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
export function ProfitLossPage() {
  const [year, setYear] = useState(currentYear);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api.get('/reports/profit-loss', { params: { year } })
      .then(response => active && setReport(response.data.data))
      .catch(requestError => active && setError(requestError.response?.data?.message || 'Unable to load Profit and Loss report.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [year]);

  const goBack = () => window.history.back();

  return <div className="profit-loss-page">
    <h1 className="profit-loss-title">Profit and Loss Report</h1>
    <div className="profit-loss-toolbar report-print-hidden">
      <button className="report-print-button" onClick={() => window.print()}><Printer size={17} /> Print</button>
      <select aria-label="Report year" value={year} onChange={event => setYear(Number(event.target.value))}>{[currentYear - 1, currentYear, currentYear + 1].map(option => <option key={option} value={option}>{option}</option>)}</select>
      <button className="report-back-button" onClick={goBack}><ArrowLeft size={17} /> Back</button>
    </div>
    <div className="profit-loss-layout">
    <section className="profit-loss-report">
      {loading ? <div className="profit-loss-state">Loading report...</div> : error ? <div className="profit-loss-state report-error">{error}</div> : <div className="profit-loss-table">
        <div className="profit-loss-row report-balance"><span>Balance</span></div>
        <div className="profit-loss-row"><span>Income</span><strong>{money(report?.income)}</strong></div>
        <div className="profit-loss-row"><span>Income from Sales</span><strong>{money(report?.incomeFromSales)}</strong></div>
        <div className="profit-loss-spacer" />
        <div className="profit-loss-row"><span>Expenses</span><strong>{money(report?.expenses)}</strong></div>
        <div className="profit-loss-row"><span>Purchase Expense</span><strong>{money(report?.purchaseExpense)}</strong></div>
        <div className="profit-loss-row"><span>Other Expense</span><strong>{money(report?.otherExpense)}</strong></div>
        <div className="profit-loss-spacer small" />
        <div className="profit-loss-row report-net"><span>Net Income</span><strong>{money(report?.netIncome)}</strong></div>
      </div>}
    </section>
    </div>
  </div>;
}