import { NavLink } from 'react-router-dom';
import { BarChart3, BookOpen, Boxes, BriefcaseBusiness, Calculator, ChartNoAxesCombined, CircleDollarSign, FileBarChart, FileText, LayoutDashboard, Receipt, Settings2, ShoppingCart, Users, WalletCards } from 'lucide-react';

const groups = [
  { label: 'Dashboard', items: [['/dashboard', 'Dashboard', LayoutDashboard]] },
  { label: 'Master data', items: [['/contacts', 'Contacts', Users], ['/products', 'Products', Boxes], ['/accounts', 'Chart of Accounts', Calculator], ['/journals', 'Journals', BookOpen], ['/analytic-accounts', 'Analytic Accounts', ChartNoAxesCombined], ['/budgets', 'Budgets', BriefcaseBusiness]] },
  { label: 'Transactions', items: [['/sales', 'Sales', ShoppingCart], ['/purchases', 'Purchases', Receipt], ['/payments', 'Payments', WalletCards], ['/journal-entries', 'Journal Entries', FileText]] },
  { label: 'Reports', items: [['/reports/profit-loss', 'Profit & Loss', FileBarChart], ['/reports/balance-sheet', 'Balance Sheet', BarChart3], ['/reports/budget', 'Budget Report', CircleDollarSign], ['/reports/ledger', 'Ledger', BookOpen]] }
];

export function Sidebar() {
  return <aside className="sidebar">
    <div className="brand"><span className="brand-mark">UF</span><span><b>URBAN</b><strong>FURNITURE</strong></span></div>
    <div className="workspace-label">ACCOUNTING WORKSPACE</div>
    <nav>{groups.map(group => <section className="nav-group" key={group.label}><div className="nav-label">{group.label}</div>{group.items.map(([to, label, Icon]) => <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Icon size={17} strokeWidth={1.8} /><span>{label}</span></NavLink>)}</section>)}</nav>
    <div className="sidebar-footer"><div className="help-card"><Settings2 size={16} /><span><b>Workspace setup</b><small>Foundation mode</small></span></div><div className="sidebar-user"><span className="avatar">NS</span><span><b>Nisha Shah</b><small>Administrator</small></span></div></div>
  </aside>;
}
