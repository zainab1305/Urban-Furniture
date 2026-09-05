import { Bell, LogOut, Menu, Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const label =
    location.pathname === '/dashboard'
      ? 'Dashboard'
      : location.pathname.split('/').filter(Boolean).pop()?.replaceAll('-', ' ') || 'Dashboard';

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

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="navbar">
      <button className="mobile-menu" aria-label="Open navigation">
        <Menu size={20} />
      </button>

      <div className="breadcrumbs">
        <span>Urban Furniture</span>
        <b>/</b>
        <strong>{label.replace(/\b\w/g, letter => letter.toUpperCase())}</strong>
      </div>

      <div className="navbar-actions">
        <label className="search">
          <Search size={15} />
          <input placeholder="Search anything..." />
        </label>

        <button className="icon-button" aria-label="Notifications">
          <Bell size={18} />
          <i />
        </button>

        <div className="profile">
          <span className="avatar">{initials}</span>
          <span>
            <b>{user?.name || user?.loginId || 'User'}</b>
            <small>{roleLabel}</small>
          </span>
        </div>

        <button
          className="link-button"
          onClick={handleLogout}
          title="Sign out of ERP"
          style={{ cursor: 'pointer', color: 'var(--red)', display: 'inline-flex', alignItems: 'center', gap: 5 }}
        >
          <LogOut size={15} />
          <span style={{ fontSize: 11, fontWeight: 500 }}>Sign out</span>
        </button>
      </div>
    </header>
  );
}
