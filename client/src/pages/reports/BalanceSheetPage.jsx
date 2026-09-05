import { useEffect, useState } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { api } from '../../services/api.js';

const currentYear = new Date().getFullYear();
const money = value => `Rs. ${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const total = rows => rows.reduce((sum, row) => sum + Number(row.balance || 0), 0);
const numberValue = value => Number(value || 0);

function buildBalanceSheetFromResources(year, accounts, entries) {
  const end = new Date(Date.UTC(year + 1, 0, 1));
  const movementByAccount = {};
  let retainedEarnings = 0;

  entries
    .filter(entry => entry.status === 'POSTED' && new Date(entry.date) < end)
    .forEach(entry => {
      entry.items.forEach(item => {
        const debit = numberValue(item.debit);
        const credit = numberValue(item.credit);
        const account = item.account || accounts.find(record => record.id === item.accountId);
        const movement = movementByAccount[item.accountId] || { debit: 0, credit: 0 };
        movement.debit += debit;
        movement.credit += credit;
        movementByAccount[item.accountId] = movement;

        if (account?.type === 'INCOME') retainedEarnings += credit - debit;
        if (account?.type === 'EXPENSE') retainedEarnings -= debit - credit;
      });
    });

  const rows = accounts
    .filter(account => account.isActive !== false && ['ASSET', 'LIABILITY', 'CAPITAL'].includes(account.type))
    .map(account => {
      const movement = movementByAccount[account.id] || { debit: 0, credit: 0 };
      const balance = numberValue(account.openingBalance) + (account.type === 'ASSET' ? movement.debit - movement.credit : movement.credit - movement.debit);
      return { id: account.id, code: account.code, name: account.name, type: account.type, balance };
    });

  const assets = rows.filter(row => row.type === 'ASSET');
  const liabilities = rows.filter(row => row.type === 'LIABILITY');
  const capital = rows.filter(row => row.type === 'CAPITAL');
  if (Math.abs(retainedEarnings) > 0.005) {
    capital.push({ id: 'retained-earnings', code: 'P&L', name: 'Retained Earnings', type: 'CAPITAL', balance: retainedEarnings });
  }

  return {
    year,
    asOfDate: new Date(end.getTime() - 1).toISOString(),
    assets,
    liabilities,
    capital,
    totals: {
      assets: total(assets),
      liabilities: total(liabilities) + total(capital)
    }
  };
}

async function loadBalanceSheet(year) {
  try {
    const response = await api.get('/reports/balance-sheet', { params: { year } });
    return response.data.data;
  } catch (requestError) {
    if (requestError.response?.status !== 404) throw requestError;
    const [accountResponse, entryResponse] = await Promise.all([
      api.get('/accounts', { params: { status: 'ACTIVE' } }),
      api.get('/journal-entries', { params: { status: 'POSTED' } })
    ]);
    return buildBalanceSheetFromResources(year, accountResponse.data.data || [], entryResponse.data.data || []);
  }
}

export function BalanceSheetPage() {
  const [year, setYear] = useState(currentYear);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    loadBalanceSheet(year).then(data => active && setReport(data)).catch(requestError => active && setError(requestError.response?.data?.message || (requestError.request ? 'The API is reachable, but the Balance Sheet route was not found on this server.' : 'Unable to load Balance Sheet report.'))).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [year]);

  const goBack = () => window.history.back();
  const liabilities = [...(report?.liabilities || []), ...(report?.capital || [])];
  const assetRows = report?.assets || [];
  const assetTotal = Number(report?.totals?.assets ?? total(assetRows));
  const liabilityTotal = Number(report?.totals?.liabilities ?? total(liabilities));
  const rows = (items, empty) => items.length ? items.map(row => <div className="balance-sheet-row" key={row.id}><span>{row.name}</span><strong>{money(row.balance)}</strong></div>) : <div className="balance-sheet-empty">{empty}</div>;

  return <div className="balance-sheet-page">
    <h1 className="balance-sheet-title">Balance Sheet</h1>
    <p className="balance-sheet-subtitle">Showing Company's assets and liabilities{report?.asOfDate ? ` as of ${new Date(report.asOfDate).toLocaleDateString('en-IN')}` : ''}.</p>
    <div className="balance-sheet-toolbar report-print-hidden"><button className="report-print-button" onClick={() => window.print()}><Printer size={17} /> Print</button><select aria-label="Report year" value={year} onChange={event => setYear(Number(event.target.value))}>{[currentYear - 1, currentYear, currentYear + 1].map(option => <option key={option} value={option}>{option}</option>)}</select><button className="report-back-button" onClick={goBack}><ArrowLeft size={17} /> Back</button></div>
    {loading ? <div className="balance-sheet-state">Loading report...</div> : error ? <div className="balance-sheet-state report-error">{error}</div> : <>
      <div className="balance-sheet-report"><section className="balance-sheet-side"><h2>Assets</h2>{rows(assetRows, 'No asset balances')}</section><section className="balance-sheet-side"><h2>Liabilities</h2>{rows(liabilities, 'No liability balances')}</section><div className="balance-sheet-total"><span>Total Assets</span><strong>{money(assetTotal)}</strong></div><div className="balance-sheet-total"><span>Total Liabilities</span><strong>{money(liabilityTotal)}</strong></div></div>
      <div className="balance-sheet-legend"><b>Account classification</b><span>Bank - Account type Asset</span><span>Cash - Account type Asset</span><span>Debtors - Account type Asset</span><span>Creditors - Account type Liability</span><span>Capital - Account type Capital</span></div>
    </>}
  </div>;
}
