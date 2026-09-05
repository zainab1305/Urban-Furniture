import { useEffect, useState } from 'react';
import { Archive, Edit3, Plus, Search, X } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { api, getAssetUrl } from '../services/api.js';

const contactEmpty = { name: '', type: 'CUSTOMER', email: '', mobile: '', address: '', city: '', state: '', pincode: '', profileImage: '' };
const productEmpty = { sku: '', name: '', type: 'GOODS', category: '', salesPrice: '', purchasePrice: '', stockQuantity: '', taxRate: '' };

export function MasterDataPage({ kind }) {
  const isContact = kind === 'contacts';
  const [records, setRecords] = useState([]);
  const [filters, setFilters] = useState({ search: '', type: 'ALL', status: 'ALL' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(isContact ? contactEmpty : productEmpty);

  const load = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/${kind}`, { params: filters });
      setRecords(response.data.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || `Unable to load ${kind}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
  }, [kind, filters.search, filters.type, filters.status]);

  const open = record => {
    setModal(record ? { type: 'edit', record } : { type: 'create' });
    setForm(record ? (isContact ? { ...contactEmpty, ...record, profileImagePreview: record.profileImage || '' } : { ...productEmpty, ...record, category: record.category?.name || '' }) : (isContact ? contactEmpty : productEmpty));
    setError('');
  };

  const save = async event => {
    event.preventDefault();
    setError('');
    try {
      const payload = isContact ? new FormData() : form;
      if (isContact) {
        Object.entries(form).forEach(([name, value]) => {
          if (name !== 'profileImage' && name !== 'profileImagePreview' && value !== undefined && value !== null) payload.append(name, value);
        });
        if (form.profileImage instanceof File) payload.append('profileImage', form.profileImage);
      }
      if (modal.type === 'create') await api.post(`/${kind}`, payload);
      else await api.patch(`/${kind}/${modal.record.id}`, payload);
      setModal(null);
      setNotice(`${isContact ? 'Contact' : 'Product'} saved successfully.`);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save record.');
    }
  };

  const archive = async record => {
    if (!window.confirm(`Archive ${record.name}?`)) return;
    try {
      await api.delete(`/${kind}/${record.id}`);
      setNotice(`${isContact ? 'Contact' : 'Product'} archived.`);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to archive record.');
    }
  };

  const update = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  const updateImage = event => {
    const file = event.target.files?.[0];
    if (!file) return;
    setForm(current => ({ ...current, profileImage: file, profileImagePreview: URL.createObjectURL(file) }));
  };

  const contactFields = [['name', 'Contact name'], ['email', 'Email'], ['mobile', 'Phone'], ['address', 'Address'], ['city', 'City'], ['state', 'State'], ['pincode', 'Pincode']];
  const productFields = [['sku', 'SKU'], ['name', 'Product name'], ['category', 'Category'], ['salesPrice', 'Sales price'], ['purchasePrice', 'Purchase price'], ['stockQuantity', 'Stock quantity'], ['taxRate', 'Tax rate']];
  const typeOptions = isContact ? [['CUSTOMER', 'Customer'], ['VENDOR', 'Vendor'], ['BOTH', 'Both']] : [['GOODS', 'Goods'], ['SERVICE', 'Services'], ['COMBO', 'Combo']];
  const recordCards = records.map(record => <article className={`master-card ${isContact ? 'contact-card' : 'product-card'}`} key={record.id}>
    {isContact && (record.profileImage ? <img className="master-card-avatar" src={getAssetUrl(record.profileImage)} alt="" /> : <div className="master-card-avatar master-card-avatar-fallback">{record.name?.slice(0, 1).toUpperCase()}</div>)}
    <div className="master-card-content"><div className="master-card-heading"><b>{record.name}</b><span className={`status-pill ${record.isActive ? 'active' : 'inactive'}`}><i />{record.isActive ? 'Active' : 'Archived'}</span></div>
      {isContact ? <><span>{record.email || 'No email'}</span><span>{record.mobile || 'No phone'}</span><small>{record.city || record.state || 'Contact'}</small></> : <><span>{record.sku}</span><span>{record.type} | {record.category?.name || 'Uncategorized'}</span><small>Sales {Number(record.salesPrice).toLocaleString('en-IN')} | Stock {record.stockQuantity}</small></>}
    </div><div className="master-card-actions"><button onClick={() => open(record)} title="Edit"><Edit3 size={14} /></button><button onClick={() => archive(record)} title="Archive"><Archive size={14} /></button></div>
  </article>);

  return <>
    <PageHeader eyebrow={`MASTER DATA / ${kind.toUpperCase()}`} title={isContact ? 'Contacts' : 'Products'} description={isContact ? 'Manage customers, vendors and business relationships.' : 'Manage products, prices and inventory.'} action={<button className="primary-button" onClick={() => open()}><Plus size={16} /> Add {isContact ? 'contact' : 'product'}</button>} />
    {notice && <div className="auth-alert success">{notice}<button onClick={() => setNotice('')}><X size={14} /></button></div>}
    {error && <div className="auth-alert error">{error}</div>}
    <section className="surface users-card">
      <div className="admin-toolbar"><label className="table-search"><Search size={15} /><input value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} placeholder={`Search ${isContact ? 'contacts' : 'products'}`} /></label><select value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}>{(isContact ? [['ALL', 'All types'], ['CUSTOMER', 'Customers'], ['VENDOR', 'Vendors'], ['BOTH', 'Both']] : [['ALL', 'All types'], ['GOODS', 'Goods'], ['SERVICE', 'Services'], ['COMBO', 'Combo']]).map(option => <option key={option[0]} value={option[0]}>{option[1]}</option>)}</select><select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}><option value="ALL">All status</option><option value="ACTIVE">Active</option><option value="INACTIVE">Archived</option></select></div>
      {loading ? <div className="empty-table">Loading records...</div> : !records.length ? <div className="empty-table">No records found.</div> : <div className="master-card-grid">{recordCards}</div>}
    </section>
    {modal && <div className="modal-backdrop"><section className={`modal admin-user-modal ${isContact ? 'contact-modal' : ''}`}><button className="modal-close" onClick={() => setModal(null)}><X size={17} /></button><div className="eyebrow">{isContact ? 'CONTACT' : 'PRODUCT'} MANAGEMENT</div><h2>{modal.type === 'create' ? `Add ${isContact ? 'contact' : 'product'}` : `Edit ${isContact ? 'contact' : 'product'}`}</h2><form onSubmit={save}>{isContact ? <><div className="contact-fields">{contactFields.map(([name, label]) => <label key={name}>{label}<input name={name} value={form[name] ?? ''} onChange={update} required={name === 'name'} /></label>)}</div><label className="contact-image-upload"><span>Upload image</span><input type="file" accept="image/*" onChange={updateImage} /><span className="image-upload-box">{(form.profileImagePreview || (typeof form.profileImage === 'string' && form.profileImage)) ? <img src={form.profileImagePreview || getAssetUrl(form.profileImage)} alt="Contact preview" /> : 'Upload Image'}</span></label></> : <>{productFields.map(([name, label]) => <label key={name}>{label}<input name={name} value={form[name] ?? ''} onChange={update} required={name === 'name' || name === 'sku'} /></label>)}</>}<label>Type<select name="type" value={form.type} onChange={update}>{typeOptions.map(option => <option key={option[0]} value={option[0]}>{option[1]}</option>)}</select></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModal(null)}>Cancel</button><button className="primary-button">Save</button></div></form></section></div>}
  </>;
}