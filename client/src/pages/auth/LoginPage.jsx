import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LockKeyhole, Mail } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@urbanfurniture.local');
  return <main className="auth-page"><section className="auth-card"><div className="brand auth-brand"><span className="brand-mark">UF</span><span><b>URBAN</b><strong>FURNITURE</strong></span></div><div className="eyebrow">ACCOUNTING WORKSPACE</div><h1>Welcome back</h1><p>Sign in to continue to your finance workspace.</p><form onSubmit={event => { event.preventDefault(); navigate('/dashboard'); }}><label><span>Email address</span><div className="input-with-icon"><Mail size={16} /><input value={email} onChange={event => setEmail(event.target.value)} type="email" required /></div></label><label><span>Password</span><div className="input-with-icon"><LockKeyhole size={16} /><input type="password" defaultValue="password" required /></div></label><button className="primary-button" type="submit">Sign in</button></form><Link to="/dashboard" className="demo-link">Enter demo workspace</Link></section></main>;
}
