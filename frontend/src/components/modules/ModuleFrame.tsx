import type { ReactNode } from 'react';

interface Props {
  title: string;
  icon: string;
  onBack: () => void;
  children: ReactNode;
}

// ─── Fullscreen module frame: header with back button + scrollable body ──────
export function ModuleFrame({ title, icon, onBack, children }: Props) {
  return (
    <div className="module-full">
      <div className="module-head">
        <button className="back-btn" onClick={onBack}>
          › بازگشت به داشبورد
        </button>
        <h2>
          <span className="module-icon">{icon}</span> {title}
        </h2>
      </div>
      <div className="module-body">{children}</div>
    </div>
  );
}
