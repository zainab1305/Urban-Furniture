import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { AppLayout } from '../components/layout/AppLayout.jsx';
import { LoginPage } from '../pages/auth/LoginPage.jsx';
import { SignupPage } from '../pages/auth/SignupPage.jsx';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage.jsx';
import { DashboardPage } from '../pages/dashboard/DashboardPage.jsx';
import { PlaceholderPage } from '../pages/PlaceholderPage.jsx';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage.jsx';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage.jsx';
import { AdminOnlyRoute } from '../pages/admin/AdminForbiddenPage.jsx';
import { MasterDataPage } from '../pages/MasterDataPage.jsx';

const routes = [
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
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/contacts" element={<MasterDataPage kind="contacts" />} />
          <Route path="/products" element={<MasterDataPage kind="products" />} />
          <Route element={<AdminOnlyRoute />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Route>
          {routes.map(([path, title, description]) => (
            <Route
              key={path}
              path={path}
              element={<PlaceholderPage title={title} description={description} />}
            />
          ))}
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
