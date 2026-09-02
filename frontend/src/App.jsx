import React, { useEffect, useState, useCallback } from 'react';
import api, { auth } from './api';
import AuthForm from './AuthForm';
import './App.css';

function App() {
  const [email, setEmail] = useState(auth.getEmail());
  const [originalUrl, setOriginalUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [limit, setLimit] = useState(50);
  const [copiedCode, setCopiedCode] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [qrCodes, setQrCodes] = useState({}); 
  const [loadingQrId, setLoadingQrId] = useState('');

  const isLoggedIn = Boolean(email);

  const handleLinkClick = async () => {
  setTimeout(() => {
    fetchHistory();
  }, 500);
  };

  const fetchHistory = useCallback(async () => {
    try {
      const res = await api.get('/urls');
      console.log(res.data.urls);
      setHistory(res.data.urls);
      setLimit(res.data.limit);
    } catch (err) {
      console.log(err)
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) fetchHistory();
  }, [isLoggedIn, fetchHistory]);

  const handleAuthenticated = (newEmail) => {
    setEmail(newEmail);
  };

  const handleLogout = () => {
    auth.clearSession();
    setEmail(null);
    setHistory([]);
    setResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!originalUrl.trim()) {
      setError('Paste a link to shorten it.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/shorten', {
        originalUrl: originalUrl.trim(),
        customCode: customCode.trim() || undefined,
      });
      setResult(res.data);
      setOriginalUrl('');
      setCustomCode('');
      fetchHistory();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (shortUrl, code) => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(''), 1500);
    } catch (err) {
      // Clipboard API may be unavailable — fail quietly
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await api.delete(`/urls/${id}`);
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete that link.');
    } finally {
      setDeletingId('');
    }
  };

  const handleToggleQr = async (id) => {
    if (qrCodes[id]) {
      // Already loaded — just hide it again
      setQrCodes((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }

    setLoadingQrId(id);
    try {
      const res = await api.get(`/urls/${id}/qr`);
      setQrCodes((prev) => ({ ...prev, [id]: res.data.qrCode }));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not generate a QR code.');
    } finally {
      setLoadingQrId('');
    }
  };

  const handleDownloadQr = (dataUrl, code) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${code}-qr.png`;
    link.click();
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Delete all your short links? This can\'t be undone.')) return;
    try {
      await api.delete('/urls');
      setHistory([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not clear history.');
    }
  };

  return (
    <div className="page">
      <header className="masthead">
        <span className="mark">✂︎</span>
        <div>
          <h1>Snip</h1>
          <p className="tagline">Long links, cut down to size.</p>
        </div>
        {isLoggedIn && (
          <button className="logout-btn" onClick={handleLogout}>
            Log out
          </button>
        )}
      </header>

      {!isLoggedIn ? (
        <AuthForm onAuthenticated={handleAuthenticated} />
      ) : (
        <>
          <form className="ticket" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="originalUrl">Link to shorten</label>
              <input
                id="originalUrl"
                type="text"
                placeholder="https://example.com/a/very/long/path?with=params"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="customCode">Custom code (optional)</label>
              <input
                id="customCode"
                type="text"
                placeholder="my-link"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? 'Cutting…' : 'Shorten'}
            </button>

            {error && <p className="error">{error}</p>}
          </form>

          {result && (
            <div className="result">
              <div className="perforation" aria-hidden="true" />
              <p className="result-label">Your short link</p>
              <div className="result-row">
                <a
                  className="short-url"
                  href={result.shortUrl}
                  target="_blank"
                  rel="noreferrer"
                  onMouseDown={handleLinkClick}
                >
                  {result.shortUrl}
                </a>
                <button
                  className="copy-btn"
                  onClick={() => handleCopy(result.shortUrl, result.shortCode)}
                >
                  {copiedCode === result.shortCode ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="original-url" title={result.originalUrl}>
                {result.originalUrl}
              </p>
              {result.qrCode && (
                <div className="qr-block">
                  <img src={result.qrCode} alt={`QR code for ${result.shortUrl}`} width="120" height="120" />
                  <button
                    className="copy-btn"
                    onClick={() => handleDownloadQr(result.qrCode, result.shortCode)}>
                    Download QR
                  </button>
                </div>
              )}
            </div>
          )}

          <section className="history">
            <div className="history-header">
              <h2>Recent links</h2>
              <div className="history-actions">
                <span className="quota">{history.length} / {limit} used</span>
                {history.length > 0 && (
                  <button className="clear-btn" onClick={handleClearHistory}>
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {history.length === 0 ? (
              <p className="empty-state">No links yet — shorten your first one above.</p>
            ) : (
              <ul>
                {history.map((item) => (
                  <li key={item.id}>
                    <div className="history-main">
                      <a href={item.shortUrl} target="_blank" rel="noreferrer" onMouseDown={handleLinkClick}>
                        {item.shortUrl.replace(/^https?:\/\//, '')}
                      </a>
                      <div className="history-right">
                        <span className="clicks">{item.clicks} clicks</span>
                        <button
                          className="qr-btn"
                          onClick={() => handleToggleQr(item.id)}
                          disabled={loadingQrId === item.id}
                        >
                          {loadingQrId === item.id ? '…' : qrCodes[item.id] ? 'Hide QR' : 'Show QR'}
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          aria-label="Delete this link"
                        >
                          {deletingId === item.id ? '…' : 'Delete'}
                        </button>
                      </div>
                    </div>
                    <p className="history-original" title={item.originalUrl}>
                      {item.originalUrl}
                    </p>
                    {qrCodes[item.id] && (
                      <div className="qr-block">
                        <img src={qrCodes[item.id]} alt={`QR code for ${item.shortUrl}`} width="100" height="100" />
                        <button
                          className="copy-btn"
                          onClick={() => handleDownloadQr(qrCodes[item.id], item.shortCode)}
                        >
                          Download QR
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default App;
