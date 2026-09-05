import { useAuth } from '../context/AuthContext.jsx';
import { DashboardPage } from './dashboard/DashboardPage.jsx';
import { PortalDashboardPage } from './portal/PortalDashboardPage.jsx';

export function RoleDashboardPage() {
  const { user } = useAuth();
  return user?.role === 'CONTACT' ? <PortalDashboardPage /> : <DashboardPage />;
}
