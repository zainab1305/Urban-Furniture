import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { api } from '../../services/api.js';

const money = value => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
export function PortalPaymentsPage() {
  const [payments, setPayments] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => { api.get('/portal/payments').then(response => setPayments(response.data.data)).catch(requestError => setError(requestError.response?.data?.message || 'Unable to load payments.')).finally(() => setLoading(false)); }, []);
  return <><PageHeader eyebrow="MY PORTAL / PAYMENTS" title="My payments" description="Review payments associated with your own Contact account." />{error && <div className="auth-alert error">{error}</div>}<section className="surface users-card">{loading ? <div className="empty-table">Loading payments...</div> : !payments.length ? <div className="empty-table">No payments found.</div> : <div className="table-wrap"><table><thead><tr><th>PAYMENT</th><th>DATE</th><th>METHOD</th><th>AMOUNT</th><th>STATUS</th></tr></thead><tbody>{payments.map(payment => <tr key={payment.id}><td><b className="ref">{payment.paymentNumber}</b></td><td>{new Date(payment.paymentDate).toLocaleDateString('en-IN')}</td><td>{payment.method}</td><td><b>{money(payment.amount)}</b></td><td><span className="status-pill active"><i />{payment.status}</span></td></tr>)}</tbody></table></div>}</section></>;
}
