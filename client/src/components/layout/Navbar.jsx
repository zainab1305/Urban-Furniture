import { Bell, Search, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export function Navbar() {
  const location = useLocation();
  const label = location.pathname === '/dashboard' ? 'Dashboard' : location.pathname.split('/').filter(Boolean).pop()?.replaceAll('-', ' ') || 'Dashboard';
  return <header className="navbar"><button className="mobile-menu" aria-label="Open navigation"><Menu size={20} /></button><div className="breadcrumbs"><span>Urban Furniture</span><b>/</b><strong>{label.replace(/\b\w/g, letter => letter.toUpperCase())}</strong></div><div className="navbar-actions"><label className="search"><Search size={15} /><input placeholder="Search anything..." /></label><button className="icon-button" aria-label="Notifications"><Bell size={18} /><i /></button><div className="profile"><span className="avatar">NS</span><span><b>Nisha Shah</b><small>Administrator</small></span></div></div></header>;
}
