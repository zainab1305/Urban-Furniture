import { useEffect, useState } from 'react';
import { Users, UserRound, Package, ShoppingCart, FileText, Receipt, TrendingUp, RefreshCw } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { StatCard } from '../../components/ui/StatCard.jsx';
import { api } from '../../services/api.js';

const cards = [
  ['Total Users', 'totalUsers', Users, 'green'],
  ['Customers', 'totalCustomers', UserRound, 'blue'],
  ['Vendors', 'totalVendors', ShoppingCart, 'orange'],
  ['Products', 'totalProducts', Package, 'teal'],
  ['Sales', 'sales', TrendingUp, 'green'],
  ['Purchases', 'purchases', Receipt, 'red'],
  ['Pending Invoices', 'pendingInvoices', FileText, 'orange'],
  ['Pending Bills', 'pendingBills', Receipt, 'blue']
];

const money = value => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true); setError('');
    try { const response = await api.get('/admin/dashboard'); setData(response.data.data); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Unable to load dashboard data.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  return <>
    <PageHeader eyebrow="ADMINISTRATION / DASHBOARD" title="Admin dashboard" description="Live operating totals from your Urban Furniture database." action={<button className="secondary-button" onClick={load} disabled={loading}><RefreshCw size={15} /> Refresh</button>} />
    {error && <div className="auth-alert error">{error}</div>}
    {loading ? <section className="surface admin-loading">Loading live dashboard data...</section> : <div className="stat-grid admin-stat-grid">{cards.map(([label, key, Icon, tone]) => <div className="admin-stat-wrap" key={key}><StatCard label={label} value={key === 'sales' || key === 'purchases' ? money(data?.[key]) : (data?.[key] ?? 0).toLocaleString()} note="From PostgreSQL" tone={tone} /><Icon className="admin-stat-icon" size={17} /></div>)}</div>}
    <section className="surface admin-note"><div><div className="eyebrow">DATA INTEGRITY</div><h2>Administration is connected to the live system</h2><p>Counts and financial totals are calculated by the backend from users, contacts, products, invoices and bills. No dashboard values are embedded in the client.</p></div><span className="admin-check">✓ Live</span></section>
  </>;
}
