import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Message } from '../../types';
import { formatJalaliDay, formatTime } from '../../utils/format';
import { detectMedia, isEmojiOnly } from '../../utils/media';
import { SMS_TEMPLATES } from '../../utils/smsTemplates';
import { listSms, addSms } from '../../utils/smsOutbox';
import { ModuleFrame } from './ModuleFrame';

interface Props {
  messages: Message[];
  contactName: string;
  shopName?: string;
  contactPhone?: string;
  contactId: string;
  onBack: () => void;
}

type Tab = 'instagram' | 'sms';

// ─── Chat module (fullscreen): two tabs + composer + suggestions ──────────────
export function ChatModule({ messages, contactName, shopName, contactPhone, contactId, onBack }: Props) {
  const [tab, setTab] = useState<Tab>('instagram');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [smsVersion, setSmsVersion] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, tab, smsVersion]);

  const shop = shopName || contactName;
  const canSend = !!contactPhone && draft.trim().length > 0 && !sending;

  const smsChrono = useMemo(() => {
    void smsVersion;
    return listSms(contactId);
  }, [contactId, smsVersion]);

  function applyTemplate(body: string) {
    setDraft(body.replace(/\{shop\}/g, shop));
    setNotice(null);
  }

  async function send() {
    if (!canSend || !contactPhone) return;
    setSending(true);
    setNotice(null);
    try {
      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: contactPhone, text: draft.trim() }),
      });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && j.ok) {
        addSms({
          to: contactPhone,
          contactId,
          text: draft.trim(),
          sentAt: nowLocal(),
          status: 'sent',
        });
        setDraft('');
        setSmsVersion((v) => v + 1);
        setNotice({ kind: 'ok', text: 'پیامک ارسال شد ✓' });
        setTimeout(() => setNotice(null), 5000);
      } else {
        setNotice({ kind: 'err', text: 'ارسال نشد: ' + (j.error ?? `خطای ${res.status}`) });
      }
    } catch (e) {
      setNotice({ kind: 'err', text: 'ارتباط با سرویس ارسال برقرار نشد: ' + String(e).slice(0, 120) });
    } finally {
      setSending(false);
    }
  }

  let lastDay = '';
  const igRows: ReactNode[] = [];
  messages.forEach((m, i) => {
    const day = m.at.slice(0, 10);
    if (day !== lastDay) {
      lastDay = day;
      igRows.push(
        <div className="day-sep" key={`d-${day}-${i}`}>
          <span>{formatJalaliDay(m.at)}</span>
        </div>,
      );
    }
    const out = m.direction === 'outbound';
    const emojiOnly = isEmojiOnly(m.text);
    igRows.push(
      <div className={`bubble-row ${out ? 'out' : 'in'}`} key={m.messageId || i}>
        {!out && <div className="bubble-avatar">{initial(contactName)}</div>}
        <div className={`bubble ${emojiOnly ? 'emoji-bubble' : ''}`}>
          <BubbleContent text={m.text} />
          <div className="bubble-meta">
            <span className="bubble-time">{formatTime(m.at)}</span>
            <span className="bubble-channel">{channelFa(m.channel)}</span>
          </div>
        </div>
        {out && <div className="bubble-avatar us">پ</div>}
      </div>,
    );
  });

  const smsRows: ReactNode[] = [];
  let lastSmsDay = '';
  smsChrono.forEach((s, i) => {
    const day = s.sentAt.slice(0, 10);
    if (day !== lastSmsDay) {
      lastSmsDay = day;
      smsRows.push(
        <div className="day-sep" key={`sd-${day}-${i}`}>
          <span>{formatJalaliDay(day)}</span>
        </div>,
      );
    }
    smsRows.push(
      <div className="bubble-row out" key={s.id}>
        <div className="bubble sms-bubble">
          <div className="bubble-text" dir="auto">{s.text}</div>
          <div className="bubble-meta">
            <span className="bubble-time">{formatTime(s.sentAt)}</span>
            <span className="sms-status">✓</span>
          </div>
        </div>
        <div className="bubble-avatar us">پ</div>
      </div>,
    );
  });

  return (
    <ModuleFrame title="گفت‌وگوها" icon="💬" onBack={onBack}>
      <div className="chat-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={tab === 'instagram'}
          className={`chat-tab ${tab === 'instagram' ? 'active' : ''}`}
          onClick={() => setTab('instagram')}
        >
          📷 دایرکت اینستاگرام
        </button>
        <button
          role="tab"
          aria-selected={tab === 'sms'}
          className={`chat-tab ${tab === 'sms' ? 'active' : ''}`}
          onClick={() => setTab('sms')}
        >
          📱 پیامک <span className="tab-count">{smsChrono.length}</span>
        </button>
      </div>

      {notice && (
        <div className={notice.kind === 'ok' ? 'sms-notice' : 'sms-notice err'}>{notice.text}</div>
      )}

      <div className="chat-scroll module-chat-scroll" ref={scrollRef} dir="rtl">
        {tab === 'instagram' &&
          (igRows.length === 0 ? <div className="chat-empty">گفتگویی ثبت نشده است</div> : igRows)}
        {tab === 'sms' &&
          (smsRows.length === 0 ? (
            <div className="chat-empty">هنوز پیامکی ارسال نشده — پایین بنویس یا از پیشنهادها انتخاب کن</div>
          ) : (
            smsRows
          ))}
      </div>

      {tab === 'sms' && (
        <div className="sms-inputbar">
          <div className="sms-suggestions">
            {SMS_TEMPLATES.map((t) => (
              <button key={t.id} className="sms-tpl" onClick={() => applyTemplate(t.body)}>
                {t.title}
              </button>
            ))}
          </div>
          <div className="sms-inputrow">
            <textarea
              className="sms-input"
              value={draft}
              rows={1}
              placeholder={contactPhone ? 'متن پیامک…' : 'برای این غرفه‌دار شماره‌ای ثبت نشده'}
              disabled={!contactPhone}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <button className="sms-send" disabled={!canSend} onClick={() => void send()} title="ارسال">
              {sending ? '…' : '➤'}
            </button>
          </div>
        </div>
      )}
    </ModuleFrame>
  );
}

function nowLocal(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function BubbleContent({ text }: { text: string }) {
  const media = detectMedia(text);
  if (media) {
    switch (media.kind) {
      case 'image':
        return (
          <a href={media.url} target="_blank" rel="noopener noreferrer">
            <img className="media-img" src={media.url} alt="تصویر" loading="lazy" />
          </a>
        );
      case 'video':
        return <video className="media-video" src={media.url} controls preload="metadata" />;
      case 'voice':
      case 'audio':
        return (
          <div className="media-audio">
            <span className="media-badge">🎙 پیام صوتی</span>
            <audio src={media.url} controls preload="metadata" />
          </div>
        );
      case 'file':
        return (
          <a className="media-file" href={media.url} target="_blank" rel="noopener noreferrer">
            📎 دانلود فایل
          </a>
        );
      default:
        return (
          <div className="media-card">
            <span className="media-icon">📎</span>
            <span>رسانه (تصویر/فیلم/ویس) — لینک در فاز API</span>
          </div>
        );
    }
  }
  return <div className="bubble-text" dir="auto">{text}</div>;
}

function initial(name: string): string {
  return (name || '?').replace('@', '').slice(0, 1).toUpperCase();
}

function channelFa(c: string): string {
  switch (c) {
    case 'instagram_dm_web': return 'وب';
    case 'instagram_dm': return 'اینستاگرام';
    case 'sms': return 'پیامک';
    case 'phone_call': return 'تماس';
    default: return c;
  }
}
