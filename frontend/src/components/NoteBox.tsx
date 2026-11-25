import { useState } from 'react';
import { getNote, setNote } from '../utils/notes';
import { renderMarkdown } from '../utils/markdown';

interface Props {
  contactId: string;
  itemKey: string;
  onChange?: () => void;
}

// ─── Per-item user note: add/edit inline, rendered as markdown ────────────────
export function NoteBox({ contactId, itemKey, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const saved = getNote(contactId, itemKey);

  if (editing) {
    return (
      <div className="notebox editing">
        <textarea
          className="notebox-input"
          value={draft}
          autoFocus
          placeholder="یادداشت… (پشتیبانی از **پررنگ**، *ایتالیک*، `کد`، [لینک](url)، لیست با -)"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              setNote(contactId, itemKey, draft);
              setEditing(false);
              onChange?.();
            }
          }}
        />
        <div className="notebox-actions">
          <button
            className="btn btn-primary"
            onClick={() => {
              setNote(contactId, itemKey, draft);
              setEditing(false);
              onChange?.();
            }}
          >
            ذخیره
          </button>
          <button className="btn" onClick={() => { setDraft(''); setEditing(false); }}>
            انصراف
          </button>
          <span className="notebox-hint">Ctrl+Enter برای ذخیره</span>
        </div>
      </div>
    );
  }

  if (!saved) {
    return (
      <button className="notebox-add" onClick={() => { setDraft(''); setEditing(true); }}>
        ＋ یادداشت
      </button>
    );
  }

  return (
    <div className="notebox">
      <div className="notebox-render markdown" dangerouslySetInnerHTML={{ __html: renderMarkdown(saved) }} />
      <div className="notebox-actions">
        <button className="notebox-edit" onClick={() => { setDraft(saved); setEditing(true); }}>✎ ویرایش</button>
        <button className="notebox-del" onClick={() => { setNote(contactId, itemKey, ''); onChange?.(); }}>🗑 حذف</button>
      </div>
    </div>
  );
}
