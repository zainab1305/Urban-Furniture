import { useEffect, useState } from 'react';
import { CreditCard, FileText, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { api } from '../../services/api.js';

const money = value => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export function PortalDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => {
    setLoading(true); setError('');
    try { const response = await api.get('/portal/dashboard'); setData(response.data.data); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Unable to load your portal.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const invoices = data?.invoices || [];
  const invoiceDues = invoices.reduce((sum, invoice) => sum + invoice.outstanding, 0);
  return <>
    <PageHeader eyebrow="MY PORTAL / DASHBOARD" title="My financial activity" description="View your invoices, payments and outstanding dues." action={<button className="secondary-button" onClick={load} disabled={loading}><RefreshCw size={15} /> Refresh</button>} />
    {error && <div className="auth-alert error">{error}</div>}
    {loading ? <section className="surface empty-table">Loading your records...</section> : <div className="portal-dashboard-body">
      <div className="stat-grid portal-stat-grid"><article className="stat-card"><span className="stat-label">My invoices</span><strong>{invoices.length}</strong><small>Customer invoices</small></article><article className="stat-card"><span className="stat-label">Invoice dues</span><strong>{money(invoiceDues)}</strong><small>Outstanding</small></article></div>
      <div className="portal-grid portal-single-grid"><section className="surface portal-list"><div className="section-heading"><div><div className="eyebrow">MY INVOICES</div><h2>Invoices</h2></div><Link to="/portal/invoices">View all</Link></div>{invoices.length ? invoices.slice(0, 5).map(invoice => <div className="portal-row" key={invoice.id}><FileText size={16} /><div><b>{invoice.invoiceNumber}</b><small>{new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</small></div><strong>{money(invoice.outstanding)}</strong><span className={`status-pill ${invoice.outstanding ? 'inactive' : 'active'}`}><i />{invoice.outstanding ? 'Unpaid' : 'Paid'}</span></div>) : <div className="empty-table">No invoices found.</div>}</section></div>
      <Link className="portal-pay-card" to="/portal/payments"><CreditCard size={18} /><span><b>Make a payment</b><small>Pay an outstanding invoice</small></span><strong>→</strong></Link>
    </div>}
  </>;
}
