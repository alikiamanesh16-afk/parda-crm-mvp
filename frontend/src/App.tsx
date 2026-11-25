import { useEffect, useMemo, useState } from 'react';
import type { Contact, ContactDetail } from './types';
import { getDataSource } from './data/DataSource';
import { Header } from './components/Header';
import { ContactList } from './components/ContactList';
import { SellerDashboard } from './components/SellerDashboard';
import { StatusModule } from './components/modules/StatusModule';
import { ChatModule } from './components/modules/ChatModule';
import { SummaryModule } from './components/modules/SummaryModule';
import { IssuesModule } from './components/modules/IssuesModule';
import { HistoryModule } from './components/modules/HistoryModule';
import { OrdersModule } from './components/modules/OrdersModule';
import { markSeenModule } from './utils/notifications';
import './index.css';

export type ModuleId =
  | 'status'
  | 'chat'
  | 'summary'
  | 'issues'
  | 'history'
  | 'orders';

// ─── Flow: open app → fullscreen contact list (rows) → pick a seller →
// dashboard (info + modules) → "switch seller" hides dashboard, shows list.

export default function App() {
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [detail, setDetail] = useState<ContactDetail | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [openModule, setOpenModule] = useState<ModuleId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDataSource()
      .listContacts()
      .then((list) => {
        setContacts(list);
        setLoading(false);
      })
      .catch((e) => {
        setError(String(e));
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!activeId) {
      setDetail(null);
      return;
    }
    setDetail(null);
    getDataSource()
      .getContactDetail(activeId)
      .then(setDetail)
      .catch((e) => setError(String(e)));
  }, [activeId]);

  const activeContact = detail?.contact ?? null;

  // ─── Notification badges ─────────────────────────────────────────────────────
  const badges = useMemo(() => {
    const b: Record<string, number> = {};
    if (!detail || !activeContact) return b;

    const lastMessageAt = detail.messages.at(-1)?.at ?? null;
    const lastEventAt = detail.events.at(-1)?.at ?? null;
    const lastOrderAt =
      detail.events
        .filter((e) => e.eventType === 'order_paid')
        .reduce<string | null>((acc, e) => (!acc || e.at > acc ? e.at : acc), null) ?? null;

    const seen = (module: string): number => {
      const raw = localStorage.getItem('parda-crm:seen:v1');
      try {
        const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
        const t = map[`${activeContact.contactId}:${module}`];
        return t ? new Date(t).getTime() : 0;
      } catch {
        return 0;
      }
    };
    const ts = (at: string | null): number => (at ? new Date(at.replace(' ', 'T')).getTime() : 0);

    const lastMsg = ts(lastMessageAt);
    const lastEv = ts(lastEventAt);
    const lastOrd = ts(lastOrderAt);
    const everOpened = (m: string): boolean => seen(m) > 0;

    if (everOpened('chat') && lastMsg > seen('chat')) b.chat = Math.min(detail.messages.length, 99);
    if (everOpened('history') && lastEv > seen('history')) b.history = 1;
    if (everOpened('status') && lastOrd > seen('status')) b.status = 1;
    if (everOpened('orders') && lastOrd > seen('orders')) b.orders = 1;
    const issues = activeContact.openIssues.split('\n').filter((l) => l.trim()).length;
    const lastIssuesSeen = seen('issues-count');
    if (issues > 0 && lastIssuesSeen > 0 && issues > lastIssuesSeen) b.issues = issues - lastIssuesSeen;
    return b;
  }, [detail, activeContact]);

  function open(m: ModuleId) {
    setOpenModule(m);
    if (activeContact) {
      markSeenModule(activeContact.contactId, m);
      if (m === 'issues') {
        const count = activeContact.openIssues.split('\n').filter((l) => l.trim()).length;
        const raw = localStorage.getItem('parda-crm:seen:v1');
        const map = raw ? JSON.parse(raw) : {};
        map[`${activeContact.contactId}:issues-count`] = count;
        localStorage.setItem('parda-crm:seen:v1', JSON.stringify(map));
      }
    }
  }

  function selectSeller(c: Contact) {
    setActiveId(c.contactId);
    setDashboardOpen(true);
    setOpenModule(null);
  }

  function backToList() {
    setDashboardOpen(false);
    setOpenModule(null);
  }

  return (
    <div className="app" dir="rtl">
      <Header
        contacts={contacts ?? []}
        activeId={activeId}
        onSelect={selectSeller}
      />

      {error && <div className="fatal">خطا در بارگذاری داده‌ها: {error}</div>}
      {loading && <div className="fatal">در حال بارگذاری…</div>}
      {!loading && !error && contacts && contacts.length === 0 && (
        <div className="fatal">هیچ غرفه‌داری در داده‌ها نیست</div>
      )}

      {contacts && contacts.length > 0 && (
        <main className="shell-full">
          {!dashboardOpen || !activeContact ? (
            <ContactList contacts={contacts} onPick={selectSeller} />
          ) : (
            <SellerDashboard contact={activeContact} badges={badges} onOpen={open} onSwitch={backToList}>
              {openModule && detail && (
                <>
                  {openModule === 'status' && (
                    <StatusModule contact={activeContact} events={detail.events} onBack={() => setOpenModule(null)} />
                  )}
                  {openModule === 'chat' && (
                    <ChatModule
                      messages={detail.messages}
                      contactName={activeContact.igUsername || activeContact.shopName || activeContact.contactId}
                      shopName={activeContact.shopName}
                      contactPhone={activeContact.phone}
                      contactId={activeContact.contactId}
                      onBack={() => setOpenModule(null)}
                    />
                  )}
                  {openModule === 'summary' && (
                    <SummaryModule contact={activeContact} onBack={() => setOpenModule(null)} />
                  )}
                  {openModule === 'issues' && (
                    <IssuesModule contact={activeContact} onBack={() => setOpenModule(null)} />
                  )}
                  {openModule === 'history' && (
                    <HistoryModule
                      contactId={activeContact.contactId}
                      history={detail.history}
                      events={detail.events}
                      onBack={() => setOpenModule(null)}
                    />
                  )}
                  {openModule === 'orders' && (
                    <OrdersModule detail={detail} onBack={() => setOpenModule(null)} />
                  )}
                </>
              )}
            </SellerDashboard>
          )}
        </main>
      )}
    </div>
  );
}
