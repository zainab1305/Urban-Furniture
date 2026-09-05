import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { AppLayout } from '../components/layout/AppLayout.jsx';
import { LoginPage } from '../pages/auth/LoginPage.jsx';
import { SignupPage } from '../pages/auth/SignupPage.jsx';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage.jsx';
import { RoleDashboardPage } from '../pages/RoleDashboardPage.jsx';
import { PlaceholderPage } from '../pages/PlaceholderPage.jsx';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage.jsx';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage.jsx';
import { AdminOnlyRoute } from '../pages/admin/AdminForbiddenPage.jsx';
import { AccountingOnlyRoute } from '../pages/admin/AdminForbiddenPage.jsx';
import { MasterDataPage } from '../pages/MasterDataPage.jsx';
import { AccountsPage } from '../pages/accounts/AccountsPage.jsx';
import { JournalsPage } from '../pages/journals/JournalsPage.jsx';
import { JournalEntriesPage } from '../pages/journal-entries/JournalEntriesPage.jsx';
import { AnalyticAccountsPage } from '../pages/analytic-accounts/AnalyticAccountsPage.jsx';
import { BudgetsPage } from '../pages/budgets/BudgetsPage.jsx';
import { BudgetReportPage } from '../pages/reports/BudgetReportPage.jsx';
import { PortalRecordsPage } from '../pages/portal/PortalRecordsPage.jsx';
import { PortalPaymentsPage } from '../pages/portal/PortalPaymentsPage.jsx';
import { PurchasesPage } from '../pages/purchases/PurchasesPage.jsx';
import { SalesPage } from '../pages/sales/SalesPage.jsx';

const routes = [
  ['/accounts', 'Chart of Accounts', 'Organize the financial structure for reporting.'],
  ['/analytic-accounts', 'Analytic Accounts', 'Track income and expenses by dimension.'],
  ['/budgets', 'Budgets', 'Plan spending and monitor utilization.'],
  ['/sales', 'Sales', 'Prepare the sales workflow foundation.'],
  ['/sales/orders', 'Sales Orders', 'Sales order workspace placeholder.'],
  ['/sales/invoices', 'Sales Invoices', 'Customer invoice workspace placeholder.'],
  ['/payments', 'Payments', 'Record incoming and outgoing payments.'],
  ['/reports/profit-loss', 'Profit & Loss', 'Review revenue and expense reporting.'],
  ['/reports/balance-sheet', 'Balance Sheet', 'Review assets, liabilities and capital.'],
  ['/reports/budget', 'Budget Report', 'Compare planned and actual spending.'],
  ['/reports/ledger', 'Ledger', 'Review account movements over time.']
];

function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f5f7f6' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            className="loading-spinner"
            style={{
              width: 28,
              height: 28,
              borderTopColor: 'var(--green)',
              borderColor: 'rgba(35, 140, 106, 0.2)'
            }}
          />
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--muted)' }}>
            Loading ERP workspace...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f5f7f6' }}>
        <div
          className="loading-spinner"
          style={{
            width: 28,
            height: 28,
            borderTopColor: 'var(--green)',
            borderColor: 'rgba(35, 140, 106, 0.2)'
          }}
        />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes (accessible only when unauthenticated) */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicOnlyRoute>
            <SignupPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicOnlyRoute>
            <ForgotPasswordPage />
          </PublicOnlyRoute>
        }
      />

      {/* Protected ERP routes (authenticated users only) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<RoleDashboardPage />} />
          <Route element={<AccountingOnlyRoute />}>
            <Route path="/contacts" element={<MasterDataPage kind="contacts" />} />
            <Route path="/products" element={<MasterDataPage kind="products" />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/journals" element={<JournalsPage />} />
            <Route path="/journal-entries" element={<JournalEntriesPage />} />
            <Route path="/analytic-accounts" element={<AnalyticAccountsPage />} />
            <Route path="/budgets" element={<BudgetsPage />} />
            <Route path="/reports/budget" element={<BudgetReportPage />} />
            <Route path="/purchases" element={<PurchasesPage />} />
            <Route path="/purchases/orders" element={<PurchasesPage section="orders" />} />
            <Route path="/purchases/bills" element={<PurchasesPage section="bills" />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/sales/orders" element={<SalesPage section="orders" />} />
            <Route path="/sales/invoices" element={<SalesPage section="invoices" />} />
          </Route>
          <Route path="/portal/invoices" element={<PortalOnlyRoute><PortalRecordsPage kind="invoices" /></PortalOnlyRoute>} />
          <Route path="/portal/bills" element={<PortalOnlyRoute><PortalRecordsPage kind="bills" /></PortalOnlyRoute>} />
          <Route path="/portal/payments" element={<PortalOnlyRoute><PortalPaymentsPage /></PortalOnlyRoute>} />
          <Route element={<AdminOnlyRoute />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Route>
          <Route element={<AccountingOnlyRoute />}>
            {routes.filter(([path]) => !['/analytic-accounts', '/budgets', '/reports/budget', '/sales', '/sales/orders', '/sales/invoices'].includes(path)).map(([path, title, description]) => <Route key={path} path={path} element={<PlaceholderPage title={title} description={description} />} />)}
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function PortalOnlyRoute({ children }) {
  const { user } = useAuth();
  return user?.role === 'CONTACT' ? children : <Navigate to="/dashboard" replace />;
}
