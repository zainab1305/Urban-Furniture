import { useEffect, useState } from 'react';
import { Edit3, Plus, Search, X } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { api } from '../../services/api.js';

const statuses = { DRAFT: 'Draft', CONFIRMED: 'Confirmed', REVISED: 'Revised', CANCELLED: 'Cancelled' };
const emptyForm = { name: '', periodStart: '', periodEnd: '', amount: '', responsiblePerson: '', revisedWith: '', analyticAccountId: '' };
const money = value => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export function BudgetsPage() {
  const [budgets, setBudgets] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: 'ALL' });
  const [form, setForm] = useState(emptyForm);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [budgetResponse, analyticResponse, contactResponse] = await Promise.all([
        api.get('/budgets', { params: filters }),
        api.get('/analytic-accounts'),
        api.get('/contacts', { params: { status: 'ACTIVE' } })
      ]);
      setBudgets(budgetResponse.data.data);
      setAnalytics(analyticResponse.data.data);
      setContacts(contactResponse.data.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load budgets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
  }, [filters.search, filters.status]);

  const open = budget => {
    setModal(budget ? { type: 'edit', budget } : { type: 'create' });
    setForm(budget ? {
      name: budget.name,
      periodStart: budget.periodStart.slice(0, 10),
      periodEnd: budget.periodEnd.slice(0, 10),
      amount: budget.amount,
      responsiblePerson: budget.responsiblePerson || '',
      revisedWith: budget.revisedWith || '',
      analyticAccountId: budget.analyticAccountId
    } : { ...emptyForm, analyticAccountId: analytics[0]?.id || '' });
    setError('');
  };

  const update = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));

  const save = async event => {
    event.preventDefault();
    setError('');
    try {
      if (modal.type === 'create') await api.post('/budgets', form);
      else await api.patch(`/budgets/${modal.budget.id}`, form);
      setModal(null);
      setNotice('Budget saved successfully.');
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save budget.');
    }
  };

  const changeStatus = async (budget, status) => {
    try {
      await api.patch(`/budgets/${budget.id}/status`, { status });
      setNotice(`Budget moved to ${statuses[status].toLowerCase()}.`);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update budget status.');
    }
  };

  return <>
    <PageHeader eyebrow="MASTER DATA / BUDGETS" title="Budgets" description="Set planned amounts and monitor performance by analytic account." action={<button className="primary-button" onClick={() => open()}><Plus size={16} /> New budget</button>} />
    {notice && <div className="auth-alert success">{notice}<button onClick={() => setNotice('')}><X size={14} /></button></div>}
    {error && <div className="auth-alert error">{error}</div>}
    <section className="surface users-card">
      <div className="admin-toolbar"><label className="table-search"><Search size={15} /><input value={filters.search} onChange={event => setFilters({ ...filters, search: event.target.value })} placeholder="Search budgets" /></label><select value={filters.status} onChange={event => setFilters({ ...filters, status: event.target.value })}><option value="ALL">All stages</option>{Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      {loading ? <div className="empty-table">Loading budgets...</div> : !budgets.length ? <div className="empty-table">No budgets found.</div> : <div className="table-wrap"><table><thead><tr><th>BUDGET</th><th>PERIOD</th><th>ANALYTIC</th><th>PLANNED</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>{budgets.map(budget => <tr key={budget.id}><td><b>{budget.name}</b><small className="table-subtitle">{budget.responsiblePerson || 'No responsible person'}</small></td><td>{new Date(budget.periodStart).toLocaleDateString('en-IN')} - {new Date(budget.periodEnd).toLocaleDateString('en-IN')}</td><td>{budget.analyticAccount.name}</td><td>{money(budget.amount)}</td><td><span className={`status-pill ${budget.status === 'CONFIRMED' ? 'active' : budget.status === 'CANCELLED' ? 'inactive' : ''}`}><i />{statuses[budget.status]}</span></td><td><div className="user-actions"><button title="Edit" onClick={() => open(budget)}><Edit3 size={14} /></button><select value={budget.status} onChange={event => changeStatus(budget, event.target.value)} aria-label={`Change status for ${budget.name}`}>{Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div></td></tr>)}</tbody></table></div>}
    </section>
    {modal && <div className="modal-backdrop"><section className="modal budget-modal" role="dialog" aria-modal="true" aria-labelledby="budget-modal-title"><button className="modal-close" onClick={() => setModal(null)} aria-label="Close"><X size={17} /></button><div className="eyebrow">BUDGET / FORM VIEW</div><h2 id="budget-modal-title">{modal.type === 'create' ? 'New budget' : 'Edit budget'}</h2><p>Define the budget period, analytic marker and committed amount.</p><form onSubmit={save}><div className="budget-modal-grid"><label>Budget Name<input name="name" value={form.name} onChange={update} placeholder="e.g. January 2026" required /></label><label>Revised With<input name="revisedWith" value={form.revisedWith} onChange={update} placeholder="Original budget or revised budget" /></label><label>Budget Period / Start Date<input type="date" name="periodStart" value={form.periodStart} onChange={update} required /></label><label>Budget Period / End Date<input type="date" name="periodEnd" value={form.periodEnd} onChange={update} required /></label><label>Analytic Account<select name="analyticAccountId" value={form.analyticAccountId} onChange={update} required><option value="">Select analytic account</option>{analytics.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label><label>Type<input value={analytics.find(account => account.id === form.analyticAccountId)?.type === 'INCOME' ? 'Income' : form.analyticAccountId ? 'Expenses' : ''} readOnly placeholder="Selected from analytic account" /></label><label>Committed Amount<input type="number" min="0" step="0.01" name="amount" value={form.amount} onChange={update} placeholder="0.00" required /></label><label>Responsible Person<select name="responsiblePerson" value={form.responsiblePerson} onChange={update}><option value="">Select from contacts</option>{contacts.map(contact => <option key={contact.id} value={contact.name}>{contact.name}</option>)}</select></label></div><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModal(null)}>Cancel</button><button className="primary-button">Save budget</button></div></form></section></div>}
  </>;
}
