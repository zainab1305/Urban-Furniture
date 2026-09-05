import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  Boxes,
  BriefcaseBusiness,
  Calculator,
  ChartNoAxesCombined,
  CircleDollarSign,
  FileBarChart,
  FileText,
  LayoutDashboard,
  Receipt,
  Settings2,
  ShoppingCart,
  Users,
  WalletCards
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const groups = [
  { label: 'Dashboard', items: [['/dashboard', 'Dashboard', LayoutDashboard]] },
  {
    label: 'Master data',
    items: [
      ['/contacts', 'Contacts', Users],
      ['/products', 'Products', Boxes],
      ['/accounts', 'Chart of Accounts', Calculator],
      ['/journals', 'Journals', BookOpen],
      ['/analytic-accounts', 'Analytic Accounts', ChartNoAxesCombined],
      ['/budgets', 'Budgets', BriefcaseBusiness]
    ]
  },
  {
    label: 'Transactions',
    items: [
      ['/sales', 'Sales', ShoppingCart],
      ['/purchases', 'Purchases', Receipt],
      ['/payments', 'Payments', WalletCards],
      ['/journal-entries', 'Journal Entries', FileText]
    ]
  },
  {
    label: 'Reports',
    items: [
      ['/reports/profit-loss', 'Profit & Loss', FileBarChart],
      ['/reports/balance-sheet', 'Balance Sheet', BarChart3],
      ['/reports/budget', 'Budget Report', CircleDollarSign],
      ['/reports/ledger', 'Ledger', BookOpen]
    ]
  }
];

export function Sidebar() {
  const { user } = useAuth();

  const initials = (user?.name || user?.loginId || 'UF')
    .split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const roleLabel =
    user?.role === 'ADMIN'
      ? 'Administrator'
      : user?.role === 'ACCOUNTANT'
      ? 'Accountant'
      : 'Contact Workspace';

  const adminGroups = user?.role === 'ADMIN' ? [{ label: 'Administration', items: [['/admin/dashboard', 'Admin Dashboard', LayoutDashboard], ['/admin/users', 'User Management', Users]] }] : [];
  const portalGroups = user?.role === 'CONTACT' ? [{ label: 'My portal', items: [['/dashboard', 'My Dashboard', LayoutDashboard], ['/portal/invoices', 'My Invoices', FileText], ['/portal/bills', 'My Bills', Receipt], ['/portal/payments', 'My Payments', WalletCards]] }] : [];
  const visibleGroups = user?.role === 'CONTACT' ? portalGroups : [...adminGroups, ...groups];

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">UF</span>
        <span>
          <b>URBAN</b>
          <strong>FURNITURE</strong>
        </span>
      </div>
      <div className="workspace-label">ACCOUNTING WORKSPACE</div>
      <nav>
        {visibleGroups.map(group => (
          <section className="nav-group" key={group.label}>
            <div className="nav-label">{group.label}</div>
            {group.items.map(([to, label, Icon]) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={17} strokeWidth={1.8} />
                <span>{label}</span>
              </NavLink>
            ))}
          </section>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="help-card">
          <Settings2 size={16} />
          <span>
            <b>Workspace setup</b>
            
          </span>
        </div>
        <div className="sidebar-user">
          <span className="avatar">{initials}</span>
          <span>
            <b>{user?.name || user?.loginId || 'User'}</b>
            <small>{roleLabel}</small>
          </span>
        </div>
      </div>
    </aside>
  );
}
