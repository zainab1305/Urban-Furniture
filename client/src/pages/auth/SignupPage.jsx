import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  User,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { checkLoginIdApi } from '../../services/api.js';

export function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [loginId, setLoginId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loginIdAvailability, setLoginIdAvailability] = useState(null); // null | 'checking' | 'available' | 'taken'
  const [generalError, setGeneralError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Password rules validation logic
  const passwordRules = useMemo(() => {
    return {
      hasMinLength: password.length > 8,
      hasLowerCase: /[a-z]/.test(password),
      hasUpperCase: /[A-Z]/.test(password),
      hasSpecialChar: /[^A-Za-z0-9]/.test(password)
    };
  }, [password]);

  const isPasswordValid =
    passwordRules.hasMinLength &&
    passwordRules.hasLowerCase &&
    passwordRules.hasUpperCase &&
    passwordRules.hasSpecialChar;

  // Real-time check for Login ID on blur
  const handleLoginIdBlur = async () => {
    const trimmed = loginId.trim();
    if (!trimmed || trimmed.length < 6 || trimmed.length > 12 || /\s/.test(trimmed)) {
      setLoginIdAvailability(null);
      return;
    }

    try {
      setLoginIdAvailability('checking');
      const res = await checkLoginIdApi(trimmed);
      if (res.available) {
        setLoginIdAvailability('available');
        setFieldErrors(prev => ({ ...prev, loginId: null }));
      } else {
        setLoginIdAvailability('taken');
        setFieldErrors(prev => ({ ...prev, loginId: 'Login ID already exists.' }));
      }
    } catch {
      setLoginIdAvailability(null);
    }
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setGeneralError('');
    setSuccessMessage('');
    const errors = {};

    const trimmedLoginId = loginId.trim();
    const trimmedEmail = email.trim().toLowerCase();

    // 1. Login ID exists
    if (!trimmedLoginId) {
      errors.loginId = 'Please enter your Login ID.';
    } else if (trimmedLoginId.length < 6 || trimmedLoginId.length > 12) {
      // 2. Login ID length
      errors.loginId = 'Login ID must be between 6 and 12 characters.';
    } else if (/\s/.test(trimmedLoginId)) {
      // 3. Login ID allowed characters (no spaces)
      errors.loginId = 'Login ID cannot contain spaces.';
    } else if (!/^[a-zA-Z0-9_]{6,12}$/.test(trimmedLoginId)) {
      errors.loginId = 'Login ID can only contain letters, numbers, and underscores.';
    }

    // 4. Email exists & 5. Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) {
      errors.email = 'Please enter a valid email address.';
    } else if (!emailRegex.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address.';
    }

    // 6. Password exists & 7. Password strength
    if (!password) {
      errors.password = 'Please enter your password.';
    } else if (!isPasswordValid) {
      errors.password =
        'Password must be more than 8 characters, and contain at least one lowercase letter, one uppercase letter, and one special character.';
    }

    // 8. Confirm password exists & 9. Password confirmation matches
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      // Display first error message in top banner as well for clear visibility
      const firstError = Object.values(errors)[0];
      setGeneralError(firstError);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      // Steps 10-14: Server validates uniqueness, hashes password, creates user in PostgreSQL
      const response = await signup({
        loginId: trimmedLoginId,
        email: trimmedEmail,
        password,
        confirmPassword
      });

      setSuccessMessage('Account created successfully.');

      // Wait briefly so user sees the success state then redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard', {
          replace: true,
          state: { message: 'Account created successfully.' }
        });
      }, 1000);
    } catch (error) {
      const serverMessage = error.response?.data?.message || 'Something went wrong. Please try again.';
      if (serverMessage === 'Login ID already exists.') {
        setFieldErrors(prev => ({ ...prev, loginId: 'Login ID already exists.' }));
        setLoginIdAvailability('taken');
      } else if (serverMessage === 'An account with this email already exists.') {
        setFieldErrors(prev => ({ ...prev, email: 'An account with this email already exists.' }));
      }
      setGeneralError(serverMessage);
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
        <h1>Create account</h1>
        <p>Register for your Urban Furniture ERP workspace.</p>

        {generalError && (
          <div className="auth-alert error" role="alert">
            <AlertCircle size={16} />
            <span>{generalError}</span>
          </div>
        )}

        {successMessage && (
          <div className="auth-alert success" role="status">
            <Check size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* 1. Login ID */}
          <label>
            <span>Login ID</span>
            <div
              className={`input-with-icon ${fieldErrors.loginId ? 'has-error' : loginIdAvailability === 'available' ? 'is-valid' : ''
                }`}
            >
              <User size={16} />
              <input
                id="signup-login-id"
                type="text"
                autoComplete="username"
                placeholder="Enter Login ID"
                value={loginId}
                onChange={event => {
                  setLoginId(event.target.value);
                  setLoginIdAvailability(null);
                  if (fieldErrors.loginId) {
                    setFieldErrors(prev => ({ ...prev, loginId: null }));
                  }
                }}
                onBlur={handleLoginIdBlur}
                disabled={submitting}
              />
              {loginIdAvailability === 'available' && (
                <span title="Login ID available" style={{ color: 'var(--green)' }}>
                  <Check size={15} />
                </span>
              )}
            </div>
            {fieldErrors.loginId && <div className="auth-field-error">{fieldErrors.loginId}</div>}
          </label>

          {/* 2. Email ID */}
          <label>
            <span>Email ID</span>
            <div className={`input-with-icon ${fieldErrors.email ? 'has-error' : ''}`}>
              <Mail size={16} />
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                placeholder="Enter Email ID"
                value={email}
                onChange={event => {
                  setEmail(event.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors(prev => ({ ...prev, email: null }));
                  }
                }}
                disabled={submitting}
              />
            </div>
            {fieldErrors.email && <div className="auth-field-error">{fieldErrors.email}</div>}
          </label>

          {/* 3. Password */}
          <label>
            <span>Password</span>
            <div className={`input-with-icon ${fieldErrors.password ? 'has-error' : ''}`}>
              <LockKeyhole size={16} />
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Enter Password"
                value={password}
                onChange={event => {
                  setPassword(event.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors(prev => ({ ...prev, password: null }));
                  }
                }}
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
            {fieldErrors.password && <div className="auth-field-error">{fieldErrors.password}</div>}

            {/* Live Password Rules Checklist */}
            <div className="password-rules">
              <div className="password-rules-title">Password must:</div>
              <ul className="password-rules-list">
                <li className={`password-rule-item ${passwordRules.hasLowerCase ? 'valid' : ''}`}>
                  {passwordRules.hasLowerCase ? <Check size={12} /> : <X size={12} />}
                  <span>contain at least one lowercase letter</span>
                </li>
                <li className={`password-rule-item ${passwordRules.hasUpperCase ? 'valid' : ''}`}>
                  {passwordRules.hasUpperCase ? <Check size={12} /> : <X size={12} />}
                  <span>contain at least one uppercase letter</span>
                </li>
                <li className={`password-rule-item ${passwordRules.hasSpecialChar ? 'valid' : ''}`}>
                  {passwordRules.hasSpecialChar ? <Check size={12} /> : <X size={12} />}
                  <span>contain at least one special character</span>
                </li>
                <li className={`password-rule-item ${passwordRules.hasMinLength ? 'valid' : ''}`}>
                  {passwordRules.hasMinLength ? <Check size={12} /> : <X size={12} />}
                  <span>contain more than 8 characters</span>
                </li>
              </ul>
            </div>
          </label>

          {/* 4. Re-enter Password */}
          <label>
            <span>Re-enter Password</span>
            <div className={`input-with-icon ${fieldErrors.confirmPassword ? 'has-error' : ''}`}>
              <LockKeyhole size={16} />
              <input
                id="signup-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Re-enter Password"
                value={confirmPassword}
                onChange={event => {
                  setConfirmPassword(event.target.value);
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors(prev => ({ ...prev, confirmPassword: null }));
                  }
                }}
                disabled={submitting}
              />
              <button
                type="button"
                className="input-icon-btn"
                onClick={() => setShowConfirmPassword(prev => !prev)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <div className="auth-field-error">{fieldErrors.confirmPassword}</div>
            )}
          </label>

          <div className="auth-links-row">
            <Link to="/forgot-password">Forgot Password?</Link>
          </div>

          <button
            className="primary-button"
            type="submit"
            disabled={submitting}
            id="signup-btn"
          >
            {submitting ? (
              <>
                <span className="loading-spinner" />
                <span>Creating account...</span>
              </>
            ) : (
              'SIGN UP'
            )}
          </button>
        </form>

        <div className="auth-footer-nav">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </section>
    </main>
  );
}
