import React, { useState } from 'react';
import api, { auth } from './api';

function AuthForm({ onAuthenticated }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isSignup = mode === 'signup';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please fill in both fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(`/auth/${isSignup ? 'signup' : 'login'}`, {
        email: email.trim(),
        password,
      });
      auth.setSession(res.data.token, res.data.email);
      onAuthenticated(res.data.email);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ticket">
      <div className="auth-tabs">
        <button
          type="button"
          className={mode === 'login' ? 'auth-tab active' : 'auth-tab'}
          onClick={() => { setMode('login'); setError(''); }}
        >
          Log in
        </button>
        <button
          type="button"
          className={mode === 'signup' ? 'auth-tab active' : 'auth-tab'}
          onClick={() => { setMode('signup'); setError(''); }}
        >
          Sign up
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder={isSignup ? 'At least 6 characters' : '••••••••'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Please wait…' : isSignup ? 'Create account' : 'Log in'}
        </button>

        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}

export default AuthForm;
