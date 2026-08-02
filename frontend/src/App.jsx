import { useEffect, useState } from 'react';
import { api } from './api.js';
import { startDevToolsDetector } from './disableDevTools.js';
import Login from './components/Login.jsx';
import Gate from './components/Gate.jsx';
import MessageBoard from './components/MessageBoard.jsx';

const TOKEN_KEY = 'smb_token';
const DECOY_TITLE = 'Site not found · GitHub Pages';
const REAL_TITLE = 'Secure Message Board';

export default function App() {
  // If a session token is already saved, don't show the decoy at all —
  // stay blank for the instant it takes to validate it, then go straight
  // to the board. Only visitors with no saved token (the common case for
  // a first-time/unauthorized visitor) get the decoy immediately, with no
  // blank/loading flash before it appears.
  const [view, setView] = useState(() =>
    localStorage.getItem(TOKEN_KEY) ? 'checking' : 'gate'
  ); // checking | gate | blocked | login | board
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.title = view === 'login' || view === 'board' ? REAL_TITLE : DECOY_TITLE;
  }, [view]);

  useEffect(() => {
    // If DevTools is detected open, fall back to the decoy — except while
    // a lockout is already showing, which must stay non-interactive.
    return startDevToolsDetector(() => {
      setView((prev) => (prev === 'blocked' ? prev : 'gate'));
    });
  }, []);

  async function init() {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (savedToken) {
      try {
        const res = await api.getMessages(savedToken);
        if (res.success) {
          setToken(savedToken);
          setMessages(res.messages);
          setView('board');
          return;
        }
      } catch {
        // Network error validating the session — fall through and treat
        // this visit like an unauthenticated one below.
      }
      localStorage.removeItem(TOKEN_KEY);
    }

    try {
      const statusRes = await api.status();
      if (statusRes.locked) {
        setView('blocked');
        return;
      }
    } catch {
      // If the status check fails (e.g. offline), fall through to the decoy.
    }

    setView('gate');
  }

  function handleReveal() {
    // Already have a valid session (e.g. DevTools closed after triggering
    // the decoy fallback) — go straight back to the board, not the login
    // form.
    setView(token ? 'board' : 'login');
  }

  async function handleLogin(password) {
    setError('');
    try {
      const res = await api.login(password);
      if (res.success) {
        localStorage.setItem(TOKEN_KEY, res.token);
        setToken(res.token);
        const msgRes = await api.getMessages(res.token);
        setMessages(msgRes.success ? msgRes.messages : []);
        setView('board');
      } else if (res.locked) {
        setView('blocked');
      } else {
        setError('Incorrect password. Please try again.');
      }
    } catch (err) {
      console.error('Login request failed:', err);
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'Could not reach the server. Please try again.'
      );
    }
  }

  function handleSessionExpired() {
    localStorage.removeItem(TOKEN_KEY);
    setToken('');
    setMessages([]);
    setError('Session expired. Please log in again.');
    setView('login');
  }

  async function handlePost(text) {
    const res = await api.postMessage(token, text);
    if (res.success) {
      setMessages((prev) => [res.message, ...prev]);
    } else if (res.message === 'Unauthorized') {
      handleSessionExpired();
    }
  }

  async function handleClear() {
    const res = await api.clearMessages(token);
    if (res.success) {
      setMessages([]);
    } else if (res.message === 'Unauthorized') {
      handleSessionExpired();
    }
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken('');
    setMessages([]);
    setView('gate');
  }

  if (view === 'checking') return null;
  if (view === 'gate') return <Gate interactive onReveal={handleReveal} />;
  if (view === 'blocked') return <Gate interactive={false} />;
  if (view === 'board') {
    return (
      <MessageBoard
        messages={messages}
        onPost={handlePost}
        onClear={handleClear}
        onLogout={handleLogout}
      />
    );
  }
  return <Login onSubmit={handleLogin} error={error} />;
}
