import { useEffect, useMemo, useRef, useState } from 'react';
import type { Contact } from '../types';

interface Props {
  contacts: Contact[];
  activeId: string | null;
  onSelect: (contact: Contact) => void;
}

// ─── Header: brand + search + seller identity + theme toggle ──────────────────
export function Header({ contacts, activeId, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem('parda-theme') === 'dark');
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const active = useMemo(
    () => contacts.find((c) => c.contactId === activeId) ?? null,
    [contacts, activeId],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return contacts
      .filter((c) =>
        [c.igUsername, c.shopName, c.phone, c.contactId].join(' ').toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [contacts, query]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('parda-theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <header className="header">
      <div className="brand">
        <div className="brand-logo">پ</div>
        <div>
          <div className="brand-name">پردا CRM</div>
          <div className="brand-sub">میز غرفه‌داران</div>
        </div>
      </div>

      <div className="search-box" ref={boxRef}>
        <span className="search-icon">⌕</span>
        <input
          ref={inputRef}
          className="search-input"
          placeholder="جستجو (نام، آیدی، فروشگاه، شماره)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        {open && results.length > 0 && (
          <ul className="search-results">
            {results.map((c) => (
              <li key={c.contactId}>
                <button
                  type="button"
                  className={c.contactId === activeId ? 'active' : ''}
                  onClick={() => {
                    onSelect(c);
                    setQuery('');
                    setOpen(false);
                    inputRef.current?.blur();
                  }}
                >
                  <span className="sr-name">{c.igUsername || c.shopName || c.contactId}</span>
                  <span className="sr-meta">
                    {c.shopName && <span>{c.shopName}</span>}
                    {c.phone && <span dir="ltr">{c.phone}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {open && query.trim() && results.length === 0 && (
          <div className="search-empty">غرفه‌داری پیدا نشد</div>
        )}
      </div>

      <div className="header-profile">
        {active ? (
          <>
            <div className="hp-avatar">
              {(active.igUsername || active.shopName || '?').replace('@', '').slice(0, 1).toUpperCase()}
            </div>
            <div className="hp-text">
              <div className="hp-name">{active.shopName || active.igUsername}</div>
              <div className="hp-meta">
                {active.igUsername && <span dir="ltr">@{active.igUsername}</span>}
                {active.phone && <span dir="ltr">{active.phone}</span>}
              </div>
            </div>
            <div className="hp-flag" title="وضعیت اتصال اینستاگرام">
              {active.pageConnected ? (
                <span className="flag flag-on">🔗</span>
              ) : (
                <span className="flag flag-off">⚠︎</span>
              )}
            </div>
          </>
        ) : (
          <div className="hp-text">
            <div className="hp-name">غرفه‌داری انتخاب نشده</div>
          </div>
        )}

        <button
          className="theme-toggle"
          onClick={() => setDark(!dark)}
          title={dark ? 'حالت روشن' : 'حالت شب'}
          aria-label="تغییر تم"
        >
          {dark ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
}
