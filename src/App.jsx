import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import './App.css';

// ─── CONFIG ─────────────────────────────────────────────────────────────────
const GAS_URL =
  'https://script.google.com/macros/s/AKfycbz7kW9twNTTsjRywwreARdfdpDFndIwYd2KPUenF7Yp3XhsIQH613qslACjCFxti2JiJw/exec';
const OHMORI_GROUP = ['Mrs. GREEN APPLE', 'Siip', '大森元貴'];

// ─── UTILS ───────────────────────────────────────────────────────────────────
const fetchJSONP = (url) =>
  new Promise((resolve, reject) => {
    const cbName = `cb_${Date.now()}_${Math.floor(Math.random() * 99999)}`;
    const script = document.createElement('script');
    window[cbName] = (data) => {
      resolve(data);
      delete window[cbName];
      script.remove();
    };
    script.src = `${url}&callback=${cbName}`;
    script.onerror = reject;
    document.body.appendChild(script);
  });

const sanitize = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
};

const fyShuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const fmtTime = (ms) => {
  const s = Math.floor((ms % 60000) / 1000);
  const m = Math.floor((ms % 3600000) / 60000);
  const h = Math.floor(ms / 3600000);
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

// ─── ICONS (inline SVG) ──────────────────────────────────────────────────────
const Icon = {
  Music:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  List:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  Log:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  Play:    () => <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  Stop:    () => <svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>,
  Mic:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
  Bell:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  X:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Search:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Shuffle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/></svg>,
  Trash:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  Copy:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  Img:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  Up:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>,
  Menu:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  Msg:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Sync:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  Link:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  Plus:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Star:    () => <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Twitter: () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
};

// ─── TOAST ───────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  return (
    <div className={`toast ${toast.show ? 'show' : ''} toast--${toast.type}`}>
      {toast.msg}
    </div>
  );
}

// ─── MODAL WRAPPER ───────────────────────────────────────────────────────────
function Modal({ show, onClose, title, children, size = 'md', keyboardSafe = false }) {
  useEffect(() => {
    if (show) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [show]);

  if (!show) return null;
  return (
    <div className={`modal-backdrop ${keyboardSafe ? 'modal-backdrop--top' : ''}`} onClick={onClose}>
      <div className={`modal-panel modal-panel--${size}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="icon-btn" onClick={onClose}><Icon.X /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

// ─── SONG CARD ───────────────────────────────────────────────────────────────
function SongCard({ song, onClick, badge, dim }) {
  const isRecent = song.lastSung && song.lastSung !== '1900-01-01' &&
    (new Date() - new Date(song.lastSung)) < 7 * 24 * 3600 * 1000;

  return (
    <button
      className={`song-card ${dim ? 'song-card--dim' : ''} ${isRecent ? 'song-card--recent' : ''}`}
      onClick={onClick}
    >
      <div className="song-card__inner">
        <div className="song-card__info">
          <span className="song-card__name">{song.name || '無名'}</span>
          <span className="song-card__artist">{song.artist || '不明'}</span>
        </div>
        <div className="song-card__meta">
          {song.lastSung && song.lastSung !== '1900-01-01' && (
            <span className="song-card__date">{song.lastSung}</span>
          )}
          {badge && <span className="song-card__badge">{badge}</span>}
          {isRecent && <span className="song-card__dot" title="最近歌った曲" />}
        </div>
      </div>
    </button>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  // ── state ──────────────────────────────────────────────────────────────────
  const [isAdmin, setIsAdmin]       = useState(() => localStorage.getItem('isAdminLoggedIn') === 'true');
  const [songs, setSongs]           = useState(() => { try { return JSON.parse(localStorage.getItem('cachedSongs') || '[]'); } catch { return []; } });
  const [isLoading, setIsLoading]   = useState(false);
  const [toast, setToast]           = useState({ msg: '', type: 'success', show: false });

  const [newSong, setNewSong]       = useState('');
  const [newArtist, setNewArtist]   = useState('');
  const [newStatus, setNewStatus]   = useState('フル');
  const [newType, setNewType]       = useState([]);

  const [setlist, setSetlist]       = useState(() => { try { return JSON.parse(localStorage.getItem('planned_setlist') || '[]'); } catch { return []; } });
  const [currentView, setCurrentView] = useState('music');
  const [currentTab, setCurrentTab] = useState('すべて');
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType]     = useState('artist');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'login' | 'confirmReq' | 'confirmSing' | 'request' | 'msgDetail' | 'msg' | 'addSong' | 'random'
  const [selectedSong, setSelectedSong] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [requests, setRequests]     = useState([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [random20, setRandom20]     = useState([]);
  const [logText, setLogText]       = useState(() => localStorage.getItem('setlist_backup') || '');
  const [sessionStats, setSessionStats] = useState({ count: 0, start: null }); // sung this session

  // timer
  const [isRunning, setIsRunning]   = useState(false);
  const [startTime, setStartTime]   = useState(null);
  const [timerDisplay, setTimerDisplay] = useState('00:00');
  const startTimeRef                = useRef(null);
  const isRunningRef                = useRef(false);

  const adminPassRef                = useRef(null);
  const chatRef                     = useRef(null);
  const songListRef                 = useRef(null);

  // iOS Safari: テキスト入力でズームした後、フォーカスが残ったまま閉じると
  // 画面が「少しズームされた状態」で固定されることがあるため、閉じる前にblurする
  const closeModal = useCallback((next = null) => {
    try {
      document.activeElement?.blur?.();
    } catch {
      // ignore
    }
    setActiveModal(next);
  }, []);

  // ── toast ──────────────────────────────────────────────────────────────────
  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type, show: true });
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 2800);
  }, []);

  // ── GAS call ───────────────────────────────────────────────────────────────
  const callGAS = useCallback(async (params, loading = false) => {
    if (loading) setIsLoading(true);
    const adminActions = ['verifyAuth','addSong','deleteRequest','startFromExternal','clearExternalStart','updateDate','checkExternalStart','getRequests'];
    if (adminActions.includes(params.action)) {
      params.password = sessionStorage.getItem('adminPassword') || '';
    }
    try {
      return await fetchJSONP(`${GAS_URL}?${new URLSearchParams(params)}`);
    } catch (e) {
      console.error(e);
      if (loading) showToast('通信エラーが発生しました', 'error');
      return null;
    } finally {
      if (loading) setIsLoading(false);
    }
  }, [showToast]);

  // ── fetch songs ────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (force = false) => {
    setIsLoading(true);
    try {
      const params = { action: 'getSongs', _t: Date.now() };
      if (force) params.refresh = 'true';
      const data = await callGAS(params);
      if (Array.isArray(data)) {
        setSongs(data);
        localStorage.setItem('cachedSongs', JSON.stringify(data));
        if (force) showToast('最新データに同期しました', 'success');
      } else {
        if (force) showToast('データ取得に失敗しました', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [callGAS, showToast]);

  // ── sync / requests polling ────────────────────────────────────────────────
  const syncWithServer = useCallback(async () => {
    const res = await callGAS({ action: 'checkExternalStart' });
    const serverStart = res?.startTime ? parseInt(res.startTime, 10) : null;

    // サーバ側が停止状態なら端末側も停止
    if (!serverStart) {
      if (isRunningRef.current || startTimeRef.current) {
        isRunningRef.current = false;
        startTimeRef.current = null;
        setIsRunning(false);
        setStartTime(null);
        setTimerDisplay('00:00');
      }
      return;
    }

    // サーバ側が開始状態なら同期
    if (startTimeRef.current !== serverStart) {
      startTimeRef.current = serverStart;
      setStartTime(serverStart);
    }
    if (!isRunningRef.current) {
      isRunningRef.current = true;
      setIsRunning(true);
    }

    // 配信中かつサーバーにログがある時だけ同期（空文字で上書きしない）
    const logRes = await callGAS({ action: 'getLog' });
    if (logRes && logRes.log) {
      setLogText(decodeURIComponent(logRes.log));
    }
  }, [callGAS]);

  const checkRequests = useCallback(async () => {
    const reqs = await callGAS({ action: 'getRequests' });
    if (reqs && !reqs.error) setRequests(reqs);
  }, [callGAS]);

  // ── effects ────────────────────────────────────────────────────────────────
  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    localStorage.setItem('planned_setlist', JSON.stringify(setlist));
  }, [setlist]);

  useEffect(() => {
    // 配信状態（開始/停止）は全端末で同期したいので常時ポーリング
    // マウント時に即実行 → ログイン後すぐタイマーが反映される
    syncWithServer();
    const syncI = setInterval(syncWithServer, 3000);
    return () => clearInterval(syncI);
  }, [syncWithServer]);

  useEffect(() => {
    // リクエスト一覧は管理者だけポーリング
    let reqI;
    if (isAdmin) reqI = setInterval(checkRequests, 4000);
    return () => clearInterval(reqI);
  }, [isAdmin, checkRequests]);

  // timer
  useEffect(() => {
    let t;
    if (isRunning && startTime) {
      t = setInterval(() => {
        setTimerDisplay(fmtTime(Math.max(0, Date.now() - startTime)));
      }, 500);
    }
    return () => clearInterval(t);
  }, [isRunning, startTime]);

  // bounce prevention
  useEffect(() => {
    let lastY = null;
    const onMove = (e) => {
      const el = e.target instanceof Element ? e.target : e.target?.parentElement;
      const scrollable = el?.closest('#songListScroll') || el?.closest('#tabContainer') || el?.closest('.modal-body') || el?.closest('.view--log') || el?.closest('.view--setlist') || el?.closest('.random-list') || el?.closest('.log-area');
      if (!scrollable) { e.preventDefault(); return; }
      if (el?.closest('#songListScroll') && e.touches?.[0]) {
        const sl = el.closest('#songListScroll');
        const dy = lastY == null ? 0 : e.touches[0].clientY - lastY;
        lastY = e.touches[0].clientY;
        if ((sl.scrollTop <= 0 && dy > 0) || (sl.scrollTop + sl.clientHeight >= sl.scrollHeight - 1 && dy < 0)) {
          e.preventDefault();
        }
      }
    };
    const onStart = (e) => { if (e.touches?.[0]) lastY = e.touches[0].clientY; };
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchstart', onStart, { passive: true });
    return () => {
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchstart', onStart);
    };
  }, []);

  // ── memos ──────────────────────────────────────────────────────────────────
  const { tabs, filteredSongs } = useMemo(() => {
    let base = [...songs];
    if (selectedType !== 'all') base = base.filter((s) => String(s.type).includes(selectedType));

    const counts = {};
    let ohmoriTotal = 0;
    base.forEach((s) => {
      const a = s.artist || '不明';
      if (OHMORI_GROUP.includes(a)) ohmoriTotal++;
      else counts[a] = (counts[a] || 0) + 1;
    });

    const major = Object.keys(counts).filter((a) => counts[a] >= 10).sort();
    const tabs = [{ id: 'すべて', label: `すべて (${base.length})` }];
    if (ohmoriTotal > 0) tabs.push({ id: '大森元貴曲', label: `大森元貴曲 (${ohmoriTotal})` });
    major.forEach((n) => tabs.push({ id: n, label: `${n} (${counts[n]})` }));

    let f = base;
    if (currentTab === '大森元貴曲') f = f.filter((s) => OHMORI_GROUP.includes(s.artist || ''));
    else if (currentTab !== 'すべて') f = f.filter((s) => (s.artist || '') === currentTab);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      f = f.filter((s) => (s.name || '').toLowerCase().includes(q) || (s.artist || '').toLowerCase().includes(q));
    }

    f.sort((a, b) => {
      if (sortType === 'name') return (a.name || '').localeCompare(b.name || '', 'ja');
      if (sortType === 'date') return new Date(b.lastSung || '1900-01-01') - new Date(a.lastSung || '1900-01-01');
      return (a.artist || '').localeCompare(b.artist || '', 'ja');
    });

    return { tabs, filteredSongs: f };
  }, [songs, selectedType, currentTab, searchQuery, sortType]);

  const songCount   = songs.length;
  const reqCount    = requests.length;
  const msgCount    = requests.filter((r) => r.artist === ' MESSAGE').length;
  const songReqCount = requests.filter((r) => r.artist !== ' MESSAGE').length;

  // ── handlers ───────────────────────────────────────────────────────────────
  const handleSongTap = (song, isFromRequest = false, requestId = null) => {
    let target = { ...song };
    if (isFromRequest) {
      const master = songs.find((s) => s.name === song.name && s.artist === song.artist);
      target = master ? { ...master, isFromRequest, requestId } : { ...song, isFromRequest, requestId };
    }
    setSelectedSong(target);
    setActiveModal(isAdmin ? 'confirmSing' : 'confirmReq');
  };

  const executeLogin = async () => {
    const pass = adminPassRef.current?.value;
    if (!pass) return;
    sessionStorage.setItem('adminPassword', pass);
    const res = await callGAS({ action: 'verifyAuth' }, true);
    if (res?.success) {
      setIsAdmin(true);
      localStorage.setItem('isAdminLoggedIn', 'true');
      closeModal(null);
      showToast('ログインしました', 'success');
      syncWithServer();
    } else {
      sessionStorage.removeItem('adminPassword');
      showToast('パスワードが違います', 'error');
      if (adminPassRef.current) adminPassRef.current.value = '';
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.setItem('isAdminLoggedIn', 'false');
    sessionStorage.removeItem('adminPassword');
    setIsMenuOpen(false);
    setCurrentView('music');
    // ログアウト後に曲リストを再取得して確実に表示
    fetchData();
    showToast('ログアウトしました', 'info');
  };

  const toggleStream = async () => {
    if (!isRunning) {
      const res = await callGAS({ action: 'startFromExternal' }, true);
      if (res?.startTime) {
        const st = parseInt(res.startTime, 10);
        startTimeRef.current = st;
        setStartTime(st);
        setIsRunning(true);
        isRunningRef.current = true;
        setSessionStats({ count: 0, start: st });
        showToast('配信を開始しました！', 'success');
      }
    } else {
      if (!window.confirm('配信を終了しますか？')) return;
      setIsRunning(false);
      isRunningRef.current = false;
      startTimeRef.current = null;
      setStartTime(null);
      setTimerDisplay('00:00');
      await callGAS({ action: 'clearExternalStart' });
      localStorage.removeItem('setlist_backup');
      setLogText('');
      setSessionStats({ count: 0, start: null });
      showToast('配信を終了しました', 'info');
    }
    setIsMenuOpen(false);
  };

  const executeSing = async () => {
    if (!isRunning) { showToast('先にSTARTを押してください', 'error'); return; }
    const line = `${timerDisplay}  ${selectedSong.name || '無名'}\n`;
    const next = logText + line;
    setLogText(next);
    localStorage.setItem('setlist_backup', next);
    setSessionStats((p) => ({ ...p, count: p.count + 1 }));
    showToast(`♪ ${selectedSong.name} を記録しました`, 'success');

    if (selectedSong.id) {
      await callGAS({ action: 'updateDate', id: selectedSong.id });
      setSongs((prev) => prev.map((s) => s.id === selectedSong.id ? { ...s, lastSung: new Date().toISOString().slice(0, 10) } : s));
    }
    if (selectedSong.isFromRequest && selectedSong.requestId) {
      await callGAS({ action: 'deleteRequest', id: selectedSong.requestId });
      checkRequests();
    }
    closeModal(null);
  };

  const addToSetlist = () => {
    if (!selectedSong) return;
    setSetlist((p) => [...p, { ...selectedSong, instanceId: Date.now() }]);
    showToast('セトリに追加しました', 'success');
    closeModal(null);
  };

  const removeFromSetlist = (id) => setSetlist((p) => p.filter((s) => s.instanceId !== id));

  const sendRequest = async () => {
    await callGAS({ action: 'sendRequest', name: selectedSong.name, artist: selectedSong.artist });
    showToast('リクエストを送りました！', 'success');
    closeModal(null);
  };

  const handleAddSong = async () => {
    if (!newSong.trim()) { showToast('曲名を入力してください', 'error'); return; }
    const res = await callGAS({ action: 'addSong', name: newSong, artist: newArtist, status: newStatus, type: newType.join(',') }, true);
    if (res?.status === 'success') {
      showToast(`「${newSong}」を追加しました`, 'success');
      setNewSong(''); setNewArtist(''); setNewStatus('フル'); setNewType([]);
      closeModal(null);
      fetchData(true);
    } else {
      showToast('追加に失敗しました', 'error');
    }
  };

  const deleteRequest = async (id) => {
    await callGAS({ action: 'deleteRequest', id });
    checkRequests();
  };

  const sendMessage = async () => {
    const msg = chatRef.current?.value?.trim();
    if (!msg) return;
    await callGAS({ action: 'sendRequest', name: sanitize(msg), artist: ' MESSAGE' });
    showToast('メッセージを送信しました！', 'success');
    closeModal(null);
  };

  const downloadSetlistImage = () => {
    if (!logText.trim()) { showToast('ログが空です', 'error'); return; }
    const lines = logText.trim().split('\n').filter(Boolean);
    const maxNum = lines.length;
    const numDigits = String(maxNum).length;

    const entries = lines.map((l, i) => {
      const songName = l.replace(/^\d+:\d+(:\d+)?\s+/, '').trim();
      const matched = songs.find((s) => s.name === songName);
      return {
        numStr: String(i + 1).padStart(numDigits, ' ') + '.',
        name: songName,
        artist: matched?.artist || '',
      };
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const COL_SIZE  = 20;  // 1列あたりの最大曲数
    const PAD       = 60;
    const FS        = 28;
    const FSA       = 15;
    const LINE_PAD  = 12;  // エントリ上下の余白
    const TITLE_H   = 90;
    const COL_GAP   = 50;

    const numCols = Math.ceil(entries.length / COL_SIZE);

    // テキスト折り返しヘルパー（最大幅を超えたら次の行へ）
    const wrapText = (text, maxWidth, font) => {
      ctx.font = font;
      const words = text.split('');  // 日本語は1文字ずつ分割
      const lines = [];
      let current = '';
      for (const ch of words) {
        const test = current + ch;
        if (ctx.measureText(test).width > maxWidth && current !== '') {
          lines.push(current);
          current = ch;
        } else {
          current = test;
        }
      }
      if (current) lines.push(current);
      return lines;
    };

    // canvas幅を確定してから列幅を計算
    canvas.width = 1720;
    const colW   = (canvas.width - PAD * 2 - COL_GAP * (numCols - 1)) / numCols;

    // 番号列幅を実測
    ctx.font = `${FS}px monospace`;
    const numColW  = ctx.measureText(String(maxNum) + '.  ').width;
    const textMaxW = colW - numColW;

    // 各エントリの折り返し行数・高さを事前計算
    const nameFont   = `${FS}px monospace`;
    const artistFont = `${FSA}px monospace`;
    const computed = entries.map(({ numStr, name, artist }) => {
      const nameLines   = wrapText(name, textMaxW, nameFont);
      const artistLines = artist ? wrapText(artist, textMaxW, artistFont) : [];
      const totalH = LINE_PAD
        + nameLines.length * (FS + 6)
        + (artistLines.length > 0 ? artistLines.length * (FSA + 4) + 4 : 0)
        + LINE_PAD;
      return { numStr, name, artist, nameLines, artistLines, totalH };
    });

    // 列ごとの合計高さを求めてキャンバス高さを決定
    const colHeights = Array.from({ length: numCols }, (_, c) =>
      computed.slice(c * COL_SIZE, (c + 1) * COL_SIZE).reduce((s, e) => s + e.totalH, 0)
    );
    const maxColH = Math.max(...colHeights);

    canvas.height = TITLE_H + PAD / 2 + maxColH + PAD;

    // 背景
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // タイトル
    ctx.font      = `bold 40px monospace`;
    ctx.fillStyle = '#c97d2a';
    ctx.fillText('SET LIST', PAD, 58);

    // タイトル下区切り線
    ctx.strokeStyle = '#2e2e3e';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(PAD, TITLE_H - 10);
    ctx.lineTo(canvas.width - PAD, TITLE_H - 10);
    ctx.stroke();

    // 列区切り線
    for (let c = 1; c < numCols; c++) {
      const lineX = PAD + colW * c + COL_GAP * (c - 1) + COL_GAP / 2;
      ctx.strokeStyle = '#2e2e3e';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(lineX, TITLE_H);
      ctx.lineTo(lineX, canvas.height - PAD / 2);
      ctx.stroke();
    }

    // 各列ごとにエントリを描画
    for (let c = 0; c < numCols; c++) {
      const colX      = PAD + c * (colW + COL_GAP);
      const colItems  = computed.slice(c * COL_SIZE, (c + 1) * COL_SIZE);
      let   curY      = TITLE_H + PAD / 2;

      colItems.forEach(({ numStr, nameLines, artistLines, totalH }) => {
        const textStartY = curY + LINE_PAD;

        // 番号（最初の行に揃える）
        ctx.font      = nameFont;
        ctx.fillStyle = '#4e4e70';
        ctx.fillText(numStr, colX, textStartY + FS);

        // 曲名（折り返し）
        ctx.font      = nameFont;
        ctx.fillStyle = '#e8e8e8';
        nameLines.forEach((line, li) => {
          ctx.fillText(line, colX + numColW, textStartY + FS + li * (FS + 6));
        });

        // アーティスト名（折り返し）
        if (artistLines.length > 0) {
          const artistStartY = textStartY + nameLines.length * (FS + 6) + 4;
          ctx.font      = artistFont;
          ctx.fillStyle = '#6868a0';
          artistLines.forEach((line, li) => {
            ctx.fillText(line, colX + numColW, artistStartY + FSA + li * (FSA + 4));
          });
        }

        curY += totalH;
      });
    }

    const a    = document.createElement('a');
    a.download = `Setlist_${new Date().toISOString().slice(0, 10)}.png`;
    a.href     = canvas.toDataURL('image/png');
    a.click();
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="app">
      {/* Loading overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <span>LOADING</span>
        </div>
      )}

      <Toast toast={toast} />

      {/* ── Header ── */}
      <header className="header">
        <div className="header__inner">
          {/* Left: logo or timer */}
          <div className="header__left">
            {isAdmin ? (
              <div className={`timer ${isRunning ? 'timer--running' : ''}`}>
                <span className="timer__label">{isRunning ? '● LIVE' : '○ OFF'}</span>
                <span className="timer__value">{timerDisplay}</span>
                {isRunning && sessionStats.count > 0 && (
                  <span className="timer__sub">{sessionStats.count}曲</span>
                )}
              </div>
            ) : (
              <div className="logo">
                <span className="logo__main">HanamiYa</span>
                <span className="logo__sub">曲をタップしてリクエスト</span>
              </div>
            )}
          </div>

          {/* Right: actions */}
          <div className="header__right">
            {isAdmin && (
              <button
                className={`icon-btn icon-btn--badge ${reqCount > 0 ? 'icon-btn--alert' : ''}`}
                onClick={() => setActiveModal('request')}
                data-badge={reqCount > 0 ? reqCount : undefined}
                aria-label="リクエスト"
              >
                <Icon.Bell />
              </button>
            )}
            <button className="icon-btn" onClick={() => setIsMenuOpen(true)} aria-label="メニュー">
              <Icon.Menu />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="main">

        {/* ═══ MUSIC VIEW ═══ */}
        {currentView === 'music' && (
          <div className="view view--music">
            {/* Sticky controls */}
            <div className="sticky-bar">
            {/* Artist tabs */}
              <div className="artist-tabs" id="tabContainer">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={`artist-tab ${currentTab === tab.id ? 'active' : ''}`}
                    onClick={() => setCurrentTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {/* Search + Sort */}
              <div className="search-row">
                <div className="search-input-wrap">
                  <span className="search-icon"><Icon.Search /></span>
                  <input
                    className="search-input"
                    type="text"
                    placeholder="曲名・アーティスト..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button className="search-clear" onClick={() => setSearchQuery('')}>
                      <Icon.X />
                    </button>
                  )}
                </div>
                <select
                  className="sort-select"
                  value={sortType}
                  onChange={(e) => setSortType(e.target.value)}
                >
                  <option value="artist">アーティスト順</option>
                  <option value="name">曲名順</option>
                  <option value="date">直近歌った順</option>
                </select>
              </div>
              <div className="result-count">{filteredSongs.length} 曲</div>
            </div>

            {/* Song list */}
            <div
              id="songListScroll"
              ref={songListRef}
              className="song-list"
              onScroll={(e) => setShowScrollTop(e.target.scrollTop > 100)}
            >
              {filteredSongs.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">♪</span>
                  <p>見つかりませんでした</p>
                </div>
              ) : (
                filteredSongs.map((s, i) => (
                  <SongCard key={s.id || i} song={s} onClick={() => handleSongTap(s)} />
                ))
              )}
            </div>
          </div>
        )}

        {/* ═══ SETLIST VIEW ═══ */}
        {currentView === 'setlist' && isAdmin && (
          <div className="view view--setlist">
            <div className="panel">
              <div className="panel__header">
                <span className="panel__title">セットリスト</span>
                <span className="panel__count">{setlist.length}曲</span>
                {setlist.length > 0 && (
                  <button className="text-btn text-btn--danger" onClick={() => { if (window.confirm('セトリを全削除しますか？')) setSetlist([]); }}>
                    全削除
                  </button>
                )}
              </div>

              {setlist.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">♩</span>
                  <p>曲が追加されていません</p>
                  <button className="outline-btn" onClick={() => setCurrentView('music')}>曲を選ぶ</button>
                </div>
              ) : (
                <div className="setlist-items">
                  {setlist.map((s, i) => (
                    <div key={s.instanceId} className="setlist-item">
                      <span className="setlist-item__num">{i + 1}</span>
                      <div className="setlist-item__info" onClick={() => handleSongTap(s)}>
                        <span className="setlist-item__name">{s.name}</span>
                        <span className="setlist-item__artist">{s.artist}</span>
                      </div>
                      <button className="icon-btn icon-btn--danger" onClick={() => removeFromSetlist(s.instanceId)}>
                        <Icon.Trash />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ LOG VIEW ═══ */}
        {currentView === 'log' && isAdmin && (
          <div className="view view--log">

            {/* Session stats */}
            {isRunning && (
              <div className="stats-bar">
                <div className="stat">
                  <span className="stat__val">{sessionStats.count}</span>
                  <span className="stat__lbl">歌った曲数</span>
                </div>
                <div className="stat">
                  <span className="stat__val">{timerDisplay}</span>
                  <span className="stat__lbl">経過時間</span>
                </div>
                <div className="stat">
                  <span className="stat__val">{songCount}</span>
                  <span className="stat__lbl">総曲数</span>
                </div>
              </div>
            )}

            {/* Random picks */}
            {random20.length > 0 && (
              <div className="panel panel--accent">
                <div className="panel__header">
                  <span className="panel__title">ランダム20選</span>
                  <button className="icon-btn" onClick={() => setRandom20([])}><Icon.X /></button>
                </div>
                <div className="random-list">
                  {random20.map((s, i) => (
                    <button key={i} className="random-item" onClick={() => handleSongTap(s)}>
                      <span className="random-item__num">{i + 1}</span>
                      <div className="random-item__info">
                        <span className="random-item__name">{s.name}</span>
                        <span className="random-item__artist">{s.artist}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Log panel */}
            <div className="panel">
              <div className="panel__header">
                <span className="panel__title">配信ログ</span>
                <div className="panel__actions">
                  <button className="icon-btn" title="コピー" onClick={() => { navigator.clipboard.writeText(logText); showToast('コピーしました', 'success'); }}><Icon.Copy /></button>
                  <button className="icon-btn" title="画像保存" onClick={downloadSetlistImage}><Icon.Img /></button>
                  <button className="icon-btn" title="ランダム20選" onClick={() => setRandom20(fyShuffle(songs).slice(0, 20))}><Icon.Shuffle /></button>
                </div>
              </div>
              <textarea
                className="log-area"
                value={logText}
                readOnly
                placeholder="START を押すとここにログが溜まります"
              />
            </div>

            {/* Sync */}
            <button className="action-btn action-btn--secondary" onClick={() => fetchData(true)}>
              <Icon.Sync /> 最新データに同期
            </button>

            {/* Add song shortcut */}
            <button className="action-btn action-btn--primary" onClick={() => setActiveModal('addSong')}>
              <Icon.Plus /> 新曲を追加
            </button>
          </div>
        )}
      </main>

      {/* ── Bottom nav ── */}
      <nav className="bottom-nav">
        {isAdmin ? (
          <>
            <button className={`nav-btn ${currentView === 'music' ? 'active' : ''}`} onClick={() => setCurrentView('music')}>
              <span className="nav-btn__icon"><Icon.Music /></span>
              <span className="nav-btn__label">曲選択</span>
            </button>
            <button className={`nav-btn ${currentView === 'setlist' ? 'active' : ''}`} onClick={() => setCurrentView('setlist')}>
              <span className="nav-btn__icon"><Icon.List /></span>
              <span className="nav-btn__label">セトリ{setlist.length > 0 && <span className="nav-badge">{setlist.length}</span>}</span>
            </button>
            <button className={`nav-btn ${currentView === 'log' ? 'active' : ''}`} onClick={() => setCurrentView('log')}>
              <span className="nav-btn__icon"><Icon.Log /></span>
              <span className="nav-btn__label">ログ/追加</span>
            </button>
          </>
        ) : (
          <>
            {['all','弾き語り','カラオケ'].map((t) => (
              <button key={t} className={`nav-btn ${selectedType === t ? 'active' : ''}`} onClick={() => setSelectedType(t)}>
                <span className="nav-btn__label">{t === 'all' ? 'すべて' : t}</span>
              </button>
            ))}
          </>
        )}
      </nav>

      {/* ── Floating buttons ── */}
      {showScrollTop && (
        <button className="fab fab--top" onClick={() => songListRef.current?.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="トップへ">
          <Icon.Up />
        </button>
      )}
      {!isAdmin && (
        <button className="fab fab--msg" onClick={() => setActiveModal('msg')} aria-label="メッセージ">
          <Icon.Msg />
        </button>
      )}

      {/* ── Side menu ── */}
      {isMenuOpen && <div className="overlay" onClick={() => setIsMenuOpen(false)} />}
      <aside className={`side-menu ${isMenuOpen ? 'open' : ''}`}>
        <div className="side-menu__header">
          <span className="side-menu__title">MENU</span>
          <button className="icon-btn" onClick={() => setIsMenuOpen(false)}><Icon.X /></button>
        </div>
        <div className="side-menu__body">
          <a href="https://x.com/0nomiya" target="_blank" rel="noopener noreferrer" className="menu-link" onClick={() => setIsMenuOpen(false)}>
            <Icon.Twitter /> X (Twitter)
          </a>
          <a href="https://nana-music.com/users/10383824" target="_blank" rel="noopener noreferrer" className="menu-link" onClick={() => setIsMenuOpen(false)}>
            <Icon.Music /> nana-music
          </a>
          {isAdmin && (
            <button
              className={`menu-link menu-link--stream ${isRunning ? 'menu-link--danger' : 'menu-link--go'}`}
              onClick={toggleStream}
            >
              {isRunning ? <><Icon.Stop /> 配信終了 (STOP)</> : <><Icon.Play /> 配信開始 (START)</>}
            </button>
          )}
        </div>
        <div className="side-menu__footer">
          <button
            className={`menu-link ${isAdmin ? 'menu-link--danger' : ''}`}
            onClick={() => { isAdmin ? handleLogout() : (setActiveModal('login'), setIsMenuOpen(false)); }}
          >
            {isAdmin ? 'ログアウト' : 'ログイン'}
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════════════════════════════════ */}

      {/* Login */}
      <Modal show={activeModal === 'login'} onClose={() => closeModal(null)} title="ADMIN LOGIN" size="sm" keyboardSafe>
        <div className="form-group">
          <input
            ref={adminPassRef}
            type="password"
            className="text-input text-input--center"
            placeholder="PASSWORD"
            inputMode="numeric"
            onKeyDown={(e) => e.key === 'Enter' && executeLogin()}
            autoFocus
          />
        </div>
        <button className="action-btn action-btn--primary" onClick={executeLogin}>
          ログイン
        </button>
      </Modal>

      {/* Confirm Request (guest) */}
      <Modal show={activeModal === 'confirmReq' && !!selectedSong} onClose={() => closeModal(null)} title="リクエスト" size="sm">
        {selectedSong && (
          <>
            <div className="confirm-song">
              <p className="confirm-song__name">{selectedSong.name}</p>
              <p className="confirm-song__artist">{selectedSong.artist}</p>
            </div>
            <p className="confirm-lead">この曲をリクエストしますか？</p>
            <div className="btn-row">
              <button className="action-btn action-btn--ghost" onClick={() => closeModal(null)}>やめる</button>
              <button className="action-btn action-btn--primary" onClick={sendRequest}>リクエスト！</button>
            </div>
          </>
        )}
      </Modal>

      {/* Confirm Sing (admin) */}
      <Modal show={activeModal === 'confirmSing' && !!selectedSong} onClose={() => closeModal(null)} title="曲を歌う" size="md">
        {selectedSong && (
          <>
            <div className="confirm-song">
              <p className="confirm-song__name">{selectedSong.name}</p>
              <p className="confirm-song__artist">{selectedSong.artist}</p>
            </div>

            {/* Chord links */}
            {(selectedSong.ufret || selectedSong.chordwiki || selectedSong.linne) && (
              <div className="chord-links">
                <p className="chord-links__label"><Icon.Link /> コード譜</p>
                {selectedSong.ufret && (
                  <a href={selectedSong.ufret} target="_blank" rel="noopener noreferrer" className="chord-link chord-link--primary">
                    U-FRET を開く
                  </a>
                )}
                {selectedSong.chordwiki && (
                  <a href={selectedSong.chordwiki} target="_blank" rel="noopener noreferrer" className="chord-link chord-link--blue">
                    Chordwiki を開く
                  </a>
                )}
                {selectedSong.linne && (
                  <a href={selectedSong.linne} target="_blank" rel="noopener noreferrer" className="chord-link chord-link--orange">
                    リンネのコードブック
                  </a>
                )}
              </div>
            )}

            <div className="btn-row btn-row--3">
              <button className="action-btn action-btn--ghost" onClick={() => closeModal(null)}>やめる</button>
              <button className="action-btn action-btn--secondary" onClick={addToSetlist}>セトリ追加</button>
              <button className="action-btn action-btn--primary" onClick={executeSing}><Icon.Mic /> 歌う！</button>
            </div>
          </>
        )}
      </Modal>

      {/* Requests */}
      <Modal show={activeModal === 'request'} onClose={() => closeModal(null)} title="リクエスト / メッセージ" size="lg">
        <div className="request-sections">
          <section className="request-section">
            <h4 className="request-section__title"><Icon.Music /> 曲リクエスト <span className="badge">{songReqCount}</span></h4>
            {songReqCount === 0 ? (
              <p className="empty-inline">リクエストはありません</p>
            ) : (
              requests.filter((r) => r.artist !== ' MESSAGE').map((req, i) => (
                <div key={i} className="request-item" onClick={() => handleSongTap({ name: req.name, artist: req.artist }, true, req.id)}>
                  <div className="request-item__info">
                    <span className="request-item__name">{req.name}</span>
                    <span className="request-item__artist">{req.artist}</span>
                  </div>
                  <button className="icon-btn icon-btn--danger" onClick={(e) => { e.stopPropagation(); deleteRequest(req.id); }}>
                    <Icon.Trash />
                  </button>
                </div>
              ))
            )}
          </section>
          <section className="request-section">
            <h4 className="request-section__title"><Icon.Msg /> メッセージ <span className="badge badge--accent">{msgCount}</span></h4>
            {msgCount === 0 ? (
              <p className="empty-inline">メッセージはありません</p>
            ) : (
              requests.filter((r) => r.artist === ' MESSAGE').map((req, i) => (
                <div key={i} className="request-item request-item--msg" onClick={() => { setSelectedMessage(req); setActiveModal('msgDetail'); }}>
                  <div className="request-item__info">
                    <span className="request-item__preview">{req.name}</span>
                  </div>
                  <button className="icon-btn icon-btn--danger" onClick={(e) => { e.stopPropagation(); deleteRequest(req.id); }}>
                    <Icon.Trash />
                  </button>
                </div>
              ))
            )}
          </section>
        </div>
      </Modal>

      {/* Message detail */}
      <Modal show={activeModal === 'msgDetail' && !!selectedMessage} onClose={() => closeModal('request')} title="メッセージ" size="md">
        {selectedMessage && (
          <>
            <div className="msg-body">{selectedMessage.name}</div>
            <button className="action-btn action-btn--ghost" onClick={() => closeModal('request')}>← 戻る</button>
          </>
        )}
      </Modal>

      {/* Send message (guest) */}
      <Modal show={activeModal === 'msg'} onClose={() => closeModal(null)} title="メッセージを送る" size="md">
        <textarea ref={chatRef} className="textarea" placeholder="配信者へのメッセージを入力..." rows={5} />
        <button className="action-btn action-btn--primary" onClick={sendMessage}>
          <Icon.Msg /> 送信する
        </button>
      </Modal>

      {/* Add song (admin) */}
      <Modal show={activeModal === 'addSong'} onClose={() => closeModal(null)} title="新曲をNotionへ追加" size="md">
        <div className="form-group">
          <label className="form-label">曲名</label>
          <input className="text-input" type="text" placeholder="曲名を入力" value={newSong} onChange={(e) => setNewSong(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">アーティスト</label>
          <input className="text-input" type="text" placeholder="アーティスト名" value={newArtist} onChange={(e) => setNewArtist(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">完成度</label>
          <select className="text-input" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
            <option value="フル">フル</option>
            <option value="ワンコーラス">ワンコーラス</option>
            <option value="２番まで">２番まで</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">カテゴリ（複数選択可）</label>
          <div className="type-toggle-group">
            {['カラオケ', '弾き語り'].map((t) => (
              <button
                key={t}
                type="button"
                className={`type-toggle ${newType.includes(t) ? 'type-toggle--active' : ''}`}
                onClick={() => setNewType((prev) =>
                  prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <button className="action-btn action-btn--primary" onClick={handleAddSong}>
          <Icon.Plus /> Notionに追加
        </button>
      </Modal>
    </div>
  );
}
