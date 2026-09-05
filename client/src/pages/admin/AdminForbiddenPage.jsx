import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
export function AdminOnlyRoute({ children }) { const { user } = useAuth(); return user?.role === 'ADMIN' ? (children || <Outlet />) : <Navigate to="/dashboard" replace />; }
export function AccountingOnlyRoute({ children }) { const { user } = useAuth(); return ['ADMIN', 'ACCOUNTANT'].includes(user?.role) ? (children || <Outlet />) : <Navigate to="/dashboard" replace />; }
