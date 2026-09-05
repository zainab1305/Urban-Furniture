import { Link } from 'react-router-dom';
import { Contact, PackagePlus, ReceiptText, ShoppingCart } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const actions = [
  ['/contacts', 'Add contact', Contact, 'Create a customer or vendor'],
  ['/products', 'Add product', PackagePlus, 'Add an item to your catalogue'],
  ['/sales', 'New sale', ReceiptText, 'Start a sales transaction'],
  ['/purchases', 'New purchase', ShoppingCart, 'Start a purchase transaction']
];

export function DashboardPage() {
  const { user } = useAuth();
  return <>
    <PageHeader eyebrow="WORKSPACE / DASHBOARD" title={`Welcome, ${user?.name || user?.loginId || 'there'}`} description="Your workspace is ready for live records." />
    <section className="creation-grid">{actions.map(([to, label, Icon, description]) => <Link className="creation-card" to={to} key={to}><span className="creation-icon"><Icon size={18} /></span><span><b>{label}</b><small>{description}</small></span><strong>+</strong></Link>)}</section>
    <section className="surface clean-dashboard"><EmptyState title="No activity yet" description="Create your first contact or product to begin building your accounting records." /></section>
  </>;
}
