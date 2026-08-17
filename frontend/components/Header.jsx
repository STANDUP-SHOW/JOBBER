'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Logo from './Logo';
import Wordmark from './Wordmark';
import SubscriptionBadge from './SubscriptionBadge';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api';

function timeAgo(dateStr) {
  const hours = Math.floor((Date.now() - new Date(dateStr).getTime()) / (60 * 60 * 1000));
  if (hours < 1) return "à l'instant";
  if (hours < 24) return `il y a ${hours} h`;
  return `il y a ${Math.floor(hours / 24)} j`;
}

function BellIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 8a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

export default function Header() {
  const { user, token } = useAuth();
  const [jobberTier, setJobberTier] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function loadNotifications() {
    if (!token) return;
    api.notifications(token)
      .then(({ notifications, unreadCount }) => { setNotifications(notifications); setUnreadCount(unreadCount); })
      .catch(() => {});
  }

  useEffect(() => {
    loadNotifications();
    if (!token) return;
    const id = setInterval(loadNotifications, 60000);
    return () => clearInterval(id);
  }, [token]);

  function openNotifPanel() {
    const opening = !notifOpen;
    setNotifOpen(opening);
    if (opening && unreadCount > 0) {
      api.markAllNotificationsRead(token).then(() => setUnreadCount(0)).catch(() => {});
    }
  }

  // The "carte jobber" tier shown here is always the JOBBER-family
  // subscription — distinct from a Manager/Entreprise plan the same
  // account might also hold, which isn't shown in this slot.
  useEffect(() => {
    if (!token) { setJobberTier(null); return; }
    api.getSubscription(token)
      .then(({ jobberSubscription }) => setJobberTier(jobberSubscription?.plan || null))
      .catch(() => setJobberTier(null));
  }, [token]);

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-[38.4px] w-[38.4px]" />
          <Wordmark className="h-[28.8px]" />
        </Link>

        {user && (
          <div className="flex items-center gap-4">
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={openNotifPanel}
                aria-label="Notifications"
                className="relative text-slate-400 hover:text-ink"
              >
                <BellIcon className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-clay px-1 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full z-[1300] mt-2 w-80 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                  <h3 className="text-sm font-semibold text-ink">Notifications</h3>
                  {notifications.length === 0 ? (
                    <p className="mt-3 text-center text-sm text-slate-400">Aucune notification pour le moment.</p>
                  ) : (
                    <div className="mt-2 max-h-80 space-y-1 overflow-y-auto">
                      {notifications.map((n) => (
                        <Link
                          key={n.id}
                          href={n.link || '/account/notifications'}
                          onClick={() => setNotifOpen(false)}
                          className={`block rounded-md px-2 py-2 hover:bg-slate-50 ${!n.read ? 'bg-moss-light/40' : ''}`}
                        >
                          <div className="text-sm font-medium text-ink">{n.title}</div>
                          <div className="text-xs text-slate-500">{n.body}</div>
                          <div className="mt-0.5 text-[11px] text-slate-400">{timeAgo(n.createdAt)}</div>
                        </Link>
                      ))}
                    </div>
                  )}
                  <Link
                    href="/account/notifications"
                    onClick={() => setNotifOpen(false)}
                    className="mt-3 block border-t border-slate-100 pt-2 text-center text-sm font-medium text-moss hover:underline"
                  >
                    Gérer mes notifications
                  </Link>
                </div>
              )}
            </div>
            <Link href="/account" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-moss-light font-display text-sm text-moss-dark">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  user.firstName?.[0]
                )}
              </span>
              <span className="hidden sm:block">
                <span className="block text-sm font-medium leading-tight text-ink">{user.firstName}</span>
                {jobberTier && <SubscriptionBadge plan={jobberTier} size="sm" />}
              </span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
