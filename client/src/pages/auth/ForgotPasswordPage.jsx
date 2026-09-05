import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Mail } from 'lucide-react';

export function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = event => {
    event.preventDefault();
    if (!identifier.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 600);
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
        <h1>Reset password</h1>
        <p>Enter your Login ID or email address to receive password recovery instructions.</p>

        {submitted ? (
          <div>
            <div className="auth-alert success" role="status">
              <Check size={16} />
              <span>Instructions have been sent if an associated account was found.</span>
            </div>
            <div className="auth-footer-nav" style={{ marginTop: '24px' }}>
              <Link to="/login">Back to Sign In</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>
              <span>Login ID or Email Address</span>
              <div className="input-with-icon">
                <Mail size={16} />
                <input
                  type="text"
                  placeholder="Enter your Login ID or Email"
                  value={identifier}
                  onChange={event => setIdentifier(event.target.value)}
                  required
                  disabled={submitting}
                />
              </div>
            </label>

            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? 'Sending instructions...' : 'SEND RESET LINK'}
            </button>
          </form>
        )}

        {!submitted && (
          <div className="auth-footer-nav">
            Remembered your password? <Link to="/login">Sign In</Link>
          </div>
        )}
      </section>
    </main>
  );
}
