import { useEffect, useState } from 'react';
import { Archive, Edit3, Plus, Search, X } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { api } from '../../services/api.js';

const emptyForm = { name: '', type: 'ASSET' };
const typeLabels = { ASSET: 'Asset', LIABILITY: 'Liability', EXPENSE: 'Expense', INCOME: 'Income', CAPITAL: 'Capital' };

export function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [filters, setFilters] = useState({ search: '', type: 'ALL', status: 'ACTIVE' });
  const [form, setForm] = useState(emptyForm);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const response = await api.get('/accounts', { params: filters });
      setAccounts(response.data.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
  }, [filters.search, filters.type, filters.status]);

  const open = account => {
    setModal(account ? { type: 'edit', account } : { type: 'create' });
    setForm(account ? { name: account.name, type: account.type } : emptyForm);
    setError('');
  };

  const save = async event => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (modal.type === 'create') await api.post('/accounts', form);
      else await api.patch(`/accounts/${modal.account.id}`, form);
      setModal(null);
      setNotice('Account saved successfully.');
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save account.');
    } finally {
      setSaving(false);
    }
  };

  const archive = async account => {
    if (!window.confirm(`Archive ${account.name}?`)) return;
    try {
      await api.delete(`/accounts/${account.id}`);
      setNotice('Account archived.');
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to archive account.');
    }
  };

  return <>
    <PageHeader eyebrow="MASTER DATA / CHART OF ACCOUNTS" title="Chart of Accounts" description="Manage the ledger accounts used to classify every financial transaction." action={<button className="primary-button" onClick={() => open()}><Plus size={16} /> New account</button>} />
    {notice && <div className="auth-alert success">{notice}<button onClick={() => setNotice('')}><X size={14} /></button></div>}
    {error && <div className="auth-alert error">{error}</div>}
    <section className="surface users-card">
      <div className="admin-toolbar">
        <label className="table-search"><Search size={15} /><input value={filters.search} onChange={event => setFilters({ ...filters, search: event.target.value })} placeholder="Search accounts" /></label>
        <select value={filters.type} onChange={event => setFilters({ ...filters, type: event.target.value })}><option value="ALL">All types</option>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <select value={filters.status} onChange={event => setFilters({ ...filters, status: event.target.value })}><option value="ACTIVE">Active</option><option value="ALL">All status</option><option value="INACTIVE">Archived</option></select>
      </div>
      {loading ? <div className="empty-table">Loading accounts...</div> : !accounts.length ? <div className="empty-table">No accounts found.</div> : <div className="table-wrap"><table><thead><tr><th>ACCOUNT NAME</th><th>TYPE</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>{accounts.map(account => <tr key={account.id}><td><b>{account.name}</b></td><td>{typeLabels[account.type]}</td><td>{account.isActive ? 'Active' : 'Archived'}</td><td><div className="user-actions"><button title="Edit" onClick={() => open(account)}><Edit3 size={14} /></button><button title="Archive" onClick={() => archive(account)}><Archive size={14} /></button></div></td></tr>)}</tbody></table></div>}
    </section>
    {modal && <div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true"><button className="modal-close" onClick={() => setModal(null)} aria-label="Close"><X size={17} /></button><div className="eyebrow">CHART OF ACCOUNTS</div><h2>{modal.type === 'create' ? 'New account' : 'Edit account'}</h2><p>Assign a name and accounting classification.</p><form onSubmit={save}><label>Account Name<input name="name" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} required /></label><label>Type<select name="type" value={form.type} onChange={event => setForm({ ...form, type: event.target.value })}>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModal(null)}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? 'Saving...' : 'Save account'}</button></div></form></section></div>}
  </>;
}