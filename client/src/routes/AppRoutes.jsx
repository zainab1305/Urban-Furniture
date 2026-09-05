import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout.jsx';
import { LoginPage } from '../pages/auth/LoginPage.jsx';
import { DashboardPage } from '../pages/dashboard/DashboardPage.jsx';
import { PlaceholderPage } from '../pages/PlaceholderPage.jsx';

const routes = [
  ['/contacts', 'Contacts', 'Manage customers, vendors and business relationships.'],
  ['/products', 'Products', 'Maintain your product catalogue and pricing.'],
  ['/accounts', 'Chart of Accounts', 'Organize the financial structure for reporting.'],
  ['/journals', 'Journals', 'Set up the journals used for business transactions.'],
  ['/analytic-accounts', 'Analytic Accounts', 'Track income and expenses by dimension.'],
  ['/budgets', 'Budgets', 'Plan spending and monitor utilization.'],
  ['/sales', 'Sales', 'Prepare the sales workflow foundation.'],
  ['/sales/orders', 'Sales Orders', 'Sales order workspace placeholder.'],
  ['/sales/invoices', 'Sales Invoices', 'Customer invoice workspace placeholder.'],
  ['/purchases', 'Purchases', 'Prepare the purchase workflow foundation.'],
  ['/purchases/orders', 'Purchase Orders', 'Purchase order workspace placeholder.'],
  ['/purchases/bills', 'Vendor Bills', 'Vendor bill workspace placeholder.'],
  ['/payments', 'Payments', 'Record incoming and outgoing payments.'],
  ['/journal-entries', 'Journal Entries', 'Review double-entry records.'],
  ['/reports/profit-loss', 'Profit & Loss', 'Review revenue and expense reporting.'],
  ['/reports/balance-sheet', 'Balance Sheet', 'Review assets, liabilities and capital.'],
  ['/reports/budget', 'Budget Report', 'Compare planned and actual spending.'],
  ['/reports/ledger', 'Ledger', 'Review account movements over time.']
];

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        {routes.map(([path, title, description]) => (
          <Route key={path} path={path} element={<PlaceholderPage title={title} description={description} />} />
        ))}
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
