import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, LockKeyhole, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(location.state?.error || '');
  const [successMessage, setSuccessMessage] = useState(location.state?.message || '');

  const handleSubmit = async event => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Step 1: Check that Login ID is not empty
    if (!loginId || !loginId.trim()) {
      setErrorMessage('Please enter your Login ID.');
      return;
    }

    // Step 2: Check that Password is not empty
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      // Step 3 & 4: Authenticate with PostgreSQL User table via Prisma
      const response = await login(loginId.trim(), password);
      const loggedInUser = response?.data?.user;
      const roleHome = loggedInUser?.role === 'ADMIN'
        ? '/admin/dashboard'
        : loggedInUser?.role === 'CONTACT'
        ? '/dashboard'
        : '/dashboard';
      const redirectPath = location.state?.from?.pathname || roleHome;
      navigate(redirectPath, { replace: true });
    } catch (error) {
      const serverMessage = error.response?.data?.message;
      if (serverMessage === 'Invalid Login Id or Password') {
        setErrorMessage('Invalid Login Id or Password');
      } else if (serverMessage) {
        setErrorMessage(serverMessage);
      } else {
        setErrorMessage('Invalid Login Id or Password');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand auth-brand">
          <span className="brand-mark">UF</span>
          <span>
            <b>URBAN</b>
            <strong>FURNITURE</strong>
          </span>
        </div>

        <div className="eyebrow">ACCOUNTING WORKSPACE</div>
        <h1>Sign in</h1>
        <p>Sign in to continue to your ERP workspace.</p>

        {errorMessage && (
          <div className="auth-alert error" role="alert">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="auth-alert success" role="status">
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <label>
            <span>Login ID</span>
            <div className={`input-with-icon ${errorMessage && !loginId.trim() ? 'has-error' : ''}`}>
              <User size={16} />
              <input
                id="login-id"
                type="text"
                autoComplete="username"
                placeholder="Enter Login ID"
                value={loginId}
                onChange={event => setLoginId(event.target.value)}
                disabled={submitting}
              />
            </div>
          </label>

          <label>
            <span>Password</span>
            <div className={`input-with-icon ${errorMessage && !password ? 'has-error' : ''}`}>
              <LockKeyhole size={16} />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter Password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                disabled={submitting}
              />
              <button
                type="button"
                className="input-icon-btn"
                onClick={() => setShowPassword(prev => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <div className="auth-links-row">
            <Link to="/forgot-password">Forgot Password?</Link>
          </div>

          <button
            className="primary-button"
            type="submit"
            disabled={submitting}
            id="signin-btn"
          >
            {submitting ? (
              <>
                <span className="loading-spinner" />
                <span>Signing in...</span>
              </>
            ) : (
              'SIGN IN'
            )}
          </button>
        </form>

        <div className="auth-footer-nav">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </div>
      </section>
    </main>
  );
}
