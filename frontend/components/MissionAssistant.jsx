'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { uploadImage } from '../lib/cloudinary';

// "Assistant IA" : the person describes their need in their own words (and
// can snap a few photos), the assistant asks one or two questions, fills the
// mission from the catalog's fields and it's published after sign-in. The
// whole exchange is mirrored to sessionStorage so the login round-trip
// loses nothing.
const STORAGE_KEY = 'jobber:assistant';
const MAX_PHOTOS = 5;
const EXAMPLES = [
  "J'ai besoin de quelqu'un pour tailler ma haie, elle fait 2 mètres de haut.",
  'Ma voiture fait un bruit de claquement quand je freine.',
  'Grand ménage de mon appartement de 60 m² avant un état des lieux.',
];

function loadState(key) {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(sessionStorage.getItem(key) || 'null'); } catch { return null; }
}

function inDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// Props let a white-label boutique reuse it as-is: `scope.categorySlugs`
// keeps the assistant within what the boutique sells.
export default function MissionAssistant({
  scope,
  compact = false,
  loginPath = '/auth/login?redirect=/assistant',
  missionPathPrefix = '/missions/',
  storageKey = STORAGE_KEY,
  uploadFolder = 'jobber/missions',
}) {
  const router = useRouter();
  const { user, token } = useAuth();
  const [restored, setRestored] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [draft, setDraft] = useState(null);
  const [status, setStatus] = useState('question');
  const [quickReplies, setQuickReplies] = useState([]);
  const [location, setLocation] = useState(null);
  const [edits, setEdits] = useState({});
  const [input, setInput] = useState('');
  const [pendingPhotos, setPendingPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [listening, setListening] = useState(false);
  const [canDictate, setCanDictate] = useState(false);
  const fileRef = useRef(null);
  const endRef = useRef(null);
  const recognitionRef = useRef(null);

  // Voice input via the browser's Web Speech API (Chrome, Edge, Safari):
  // the transcript lands in the same text box, so it goes through exactly
  // the same pipeline as typing. Hidden where the API doesn't exist.
  useEffect(() => {
    setCanDictate(typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition));
    return () => recognitionRef.current?.abort();
  }, []);

  function toggleDictation() {
    if (listening) { recognitionRef.current?.stop(); return; }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;
    const recognition = new Recognition();
    recognition.lang = 'fr-FR';
    recognition.interimResults = true;
    recognition.continuous = true;
    const before = input ? `${input.trim()} ` : '';
    recognition.onresult = (e) => {
      const transcript = Array.from(e.results).map((r) => r[0].transcript).join('');
      setInput(before + transcript);
    };
    recognition.onerror = (e) => {
      if (e.error === 'not-allowed') setError("Autorisez l'accès au micro pour dicter votre message.");
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setError('');
    setListening(true);
    recognition.start();
  }

  // Restored after mount (not in the initial state) so the server-rendered
  // HTML and the first client render match.
  useEffect(() => {
    const saved = loadState(storageKey);
    if (saved) {
      setConversation(saved.conversation || []);
      setDraft(saved.draft || null);
      setStatus(saved.status || 'question');
      setQuickReplies(saved.quickReplies || []);
      setLocation(saved.location || null);
      setEdits(saved.edits || {});
    }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ conversation, draft, status, quickReplies, location, edits }));
    } catch { /* private mode: the flow still works, it just won't survive a reload */ }
  }, [restored, conversation, draft, status, quickReplies, location, edits]);

  useEffect(() => {
    if (conversation.length) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [conversation.length, thinking, status]);

  const photoCount = conversation.reduce((n, t) => n + (t.photos?.length || 0), 0) + pendingPhotos.length;
  const allPhotos = conversation.flatMap((t) => t.photos || []);

  async function send(text) {
    const message = (text ?? input).trim();
    if ((!message && !pendingPhotos.length) || thinking) return;
    recognitionRef.current?.stop();
    const next = [...conversation, { role: 'user', text: message, photos: pendingPhotos }];
    setConversation(next);
    setInput('');
    setPendingPhotos([]);
    setQuickReplies([]);
    setError('');
    setThinking(true);
    try {
      const res = await api.assistantTurn({ conversation: next, scope, location: location || undefined }, token);
      setConversation([...next, { role: 'assistant', text: res.reply }]);
      setStatus(res.status);
      setQuickReplies(res.quickReplies || []);
      if (res.draft) { setDraft(res.draft); setEdits({}); }
    } catch (err) {
      // Drop the failed turn so the conversation stays valid (it must end on
      // a user message) and put the text back for a retry.
      setConversation(conversation);
      setInput(message);
      setPendingPhotos(next[next.length - 1].photos);
      setError(err.message);
    } finally {
      setThinking(false);
    }
  }

  async function onPhotos(e) {
    const files = Array.from(e.target.files || []).slice(0, MAX_PHOTOS - photoCount);
    e.target.value = '';
    if (!files.length) return;
    setUploading(true);
    setError('');
    try {
      const urls = await Promise.all(files.map((f) => uploadImage(f, uploadFolder)));
      setPendingPhotos((p) => [...p, ...urls]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  function locate() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError("Impossible d'obtenir votre position : indiquez votre adresse dans le message."),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  function reset() {
    setConversation([]); setDraft(null); setStatus('question'); setQuickReplies([]);
    setEdits({}); setPendingPhotos([]); setInput(''); setError('');
  }

  const field = (key, fallback) => (edits[key] !== undefined ? edits[key] : fallback);
  const final = draft && {
    ...draft,
    title: field('title', draft.title),
    description: field('description', draft.description),
    address: field('address', draft.address),
    desiredDate: field('desiredDate', draft.desiredDate || inDays(2)),
    desiredTime: field('desiredTime', '09:00'),
  };

  async function publish() {
    if (!user) { router.push(loginPath); return; }
    setPublishing(true);
    setError('');
    try {
      const [y, m, d] = final.desiredDate.split('-').map(Number);
      const [hh, mm] = final.desiredTime.split(':').map(Number);
      const { mission } = await api.createMission({
        categoryId: final.categoryId,
        serviceId: final.serviceId || undefined,
        title: final.title,
        description: final.description,
        address: final.address,
        photos: allPhotos,
        desiredDate: new Date(y, m - 1, d, hh, mm).toISOString(),
        datesFlexible: !draft.desiredDate && edits.desiredDate === undefined,
        estimatedHours: final.estimatedHours,
        isUrgent: final.isUrgent,
        details: final.details,
      }, token);
      try { sessionStorage.removeItem(storageKey); } catch { /* ignore */ }
      router.push(`${missionPathPrefix}${mission.id}`);
    } catch (err) {
      setError(err.message);
      setPublishing(false);
    }
  }

  const started = conversation.length > 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-moss-light px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-moss text-sm font-bold text-white">IA</span>
          <div>
            <div className="font-display text-sm font-semibold text-ink">Assistant mission</div>
            <div className="text-xs text-slate-600">Décrivez votre besoin, je m'occupe du reste.</div>
          </div>
        </div>
        {started && (
          <button type="button" onClick={reset} className="text-xs font-medium text-moss hover:underline">Recommencer</button>
        )}
      </div>

      <div className={`space-y-3 overflow-y-auto px-5 py-4 ${compact ? 'max-h-80' : 'max-h-[28rem]'}`}>
        {!started && (
          <div>
            <p className="text-sm text-ink">Bonjour ! De quoi avez-vous besoin ? Écrivez-le simplement, ajoutez une photo si ça aide.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button key={ex} type="button" onClick={() => setInput(ex)} className="rounded-full border border-slate-200 px-3 py-1.5 text-left text-xs text-slate-600 hover:border-moss hover:text-moss">
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}
        {conversation.map((turn, i) => (
          <div key={i} className={`flex ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${turn.role === 'user' ? 'bg-moss text-white' : 'bg-paper text-ink'}`}>
              {turn.photos?.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {turn.photos.map((url) => <img key={url} src={url} alt="" className="h-16 w-16 rounded-md object-cover" />)}
                </div>
              )}
              {turn.text && <p className="whitespace-pre-line">{turn.text}</p>}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-paper px-4 py-2.5 text-sm text-slate-400">L'assistant prépare votre mission…</div>
          </div>
        )}

        {final && status === 'ready' && (
          <div className="rounded-xl border border-moss/30 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-moss">
              {final.categoryName}{final.serviceName ? ` · ${final.serviceName}` : ''}
            </div>
            <input
              value={final.title || ''}
              onChange={(e) => setEdits((x) => ({ ...x, title: e.target.value }))}
              className="mt-1 w-full rounded-md border border-transparent px-1 py-0.5 font-display text-base font-semibold text-ink hover:border-slate-200 focus:border-moss focus:outline-none"
            />
            <textarea
              value={final.description || ''}
              onChange={(e) => setEdits((x) => ({ ...x, description: e.target.value }))}
              rows={4}
              className="mt-1 w-full resize-none rounded-md border border-transparent px-1 py-0.5 text-sm text-slate-600 hover:border-slate-200 focus:border-moss focus:outline-none"
            />
            {final.detailsDisplay?.length > 0 && (
              <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                {final.detailsDisplay.map((d) => (
                  <div key={d.label} className="flex justify-between gap-2 border-b border-slate-100 py-1">
                    <dt className="text-slate-400">{d.label}</dt>
                    <dd className="text-right font-medium text-ink">{d.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {final.estimate && (
              <div className="mt-3 rounded-lg bg-ochre-light p-3 text-sm">
                <div className="text-xs font-semibold uppercase tracking-wide text-ochre-dark">Estimation IA</div>
                {final.estimate.diagnostic && <p className="mt-1 text-ink">{final.estimate.diagnostic}</p>}
                {final.estimate.causes.length > 0 && (
                  <ul className="mt-1 list-inside list-disc text-slate-600">
                    {final.estimate.causes.map((c) => <li key={c}>{c}</li>)}
                  </ul>
                )}
                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
                  {final.estimate.priceMin && (
                    <div>
                      <span className="text-slate-400">Fourchette de prix </span>
                      <span className="font-semibold text-ink">
                        {final.estimate.priceMin === final.estimate.priceMax ? `~${final.estimate.priceMin} €` : `${final.estimate.priceMin} – ${final.estimate.priceMax} €`}
                      </span>
                    </div>
                  )}
                  {final.estimate.duration && (
                    <div><span className="text-slate-400">Durée </span><span className="font-semibold text-ink">{final.estimate.duration}</span></div>
                  )}
                </div>
                {final.estimate.advice && <p className="mt-1 italic text-slate-600">💡 {final.estimate.advice}</p>}
                <p className="mt-1 text-xs text-slate-400">Estimation indicative : les jobbers vous feront leur propre offre.</p>
              </div>
            )}
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <label className="sm:col-span-3">
                <span className="text-xs font-medium text-slate-400">Adresse</span>
                <input
                  value={final.address || ''}
                  onChange={(e) => setEdits((x) => ({ ...x, address: e.target.value }))}
                  className="mt-0.5 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-moss focus:outline-none"
                />
              </label>
              <label>
                <span className="text-xs font-medium text-slate-400">Date souhaitée</span>
                <input
                  type="date"
                  value={final.desiredDate}
                  min={inDays(0)}
                  onChange={(e) => setEdits((x) => ({ ...x, desiredDate: e.target.value }))}
                  className="mt-0.5 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-moss focus:outline-none"
                />
              </label>
              <label>
                <span className="text-xs font-medium text-slate-400">Heure</span>
                <input
                  type="time"
                  value={final.desiredTime}
                  onChange={(e) => setEdits((x) => ({ ...x, desiredTime: e.target.value }))}
                  className="mt-0.5 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-moss focus:outline-none"
                />
              </label>
              <div>
                <span className="text-xs font-medium text-slate-400">Durée estimée</span>
                <div className="mt-0.5 px-1 py-2 text-sm font-medium text-ink">{final.estimatedHours} h</div>
              </div>
            </div>
            <button
              type="button"
              onClick={publish}
              disabled={publishing || !final.title || !final.description || !final.address}
              className="mt-4 w-full rounded-md bg-moss px-5 py-3 font-medium text-white hover:bg-moss-dark disabled:opacity-60"
            >
              {publishing ? 'Publication…' : user ? 'Publier ma mission' : 'Me connecter et publier'}
            </button>
            {!user && <p className="mt-2 text-center text-xs text-slate-400">Votre mission est gardée pendant la connexion.</p>}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {status !== 'ready' && quickReplies.length > 0 && !thinking && (
        <div className="flex flex-wrap gap-2 px-5 pb-2">
          {quickReplies.map((q) => (
            <button key={q} type="button" onClick={() => send(q)} className="rounded-full border border-moss px-3 py-1.5 text-xs font-medium text-moss hover:bg-moss-light">
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="border-t border-slate-200 px-4 py-3">
        {pendingPhotos.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {pendingPhotos.map((url) => (
              <button key={url} type="button" onClick={() => setPendingPhotos((p) => p.filter((u) => u !== url))} className="relative" aria-label="Retirer la photo">
                <img src={url} alt="" className="h-14 w-14 rounded-md object-cover" />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-ink text-[10px] text-white">×</span>
              </button>
            ))}
          </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || photoCount >= MAX_PHOTOS}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-lg text-slate-600 hover:border-moss disabled:opacity-50"
            aria-label="Ajouter des photos"
            title="Ajouter des photos"
          >
            {uploading ? '…' : '📷'}
          </button>
          <button
            type="button"
            onClick={locate}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-lg hover:border-moss ${location ? 'border-moss bg-moss-light' : 'border-slate-200'}`}
            aria-label="Utiliser ma position"
            title={location ? 'Position détectée' : 'Utiliser ma position'}
          >
            📍
          </button>
          {canDictate && (
            <button
              type="button"
              onClick={toggleDictation}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-lg hover:border-moss ${listening ? 'animate-pulse border-moss bg-moss text-white' : 'border-slate-200'}`}
              aria-label={listening ? 'Arrêter la dictée' : 'Dicter mon message'}
              title={listening ? 'Arrêter la dictée' : 'Dicter mon message'}
            >
              🎤
            </button>
          )}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            rows={1}
            maxLength={2000}
            placeholder={listening ? 'Je vous écoute…' : started ? 'Votre réponse…' : "Ex. : j'ai besoin de quelqu'un pour tailler ma haie"}
            className="max-h-32 min-h-[2.5rem] flex-1 resize-none rounded-2xl border border-slate-200 px-4 py-2 text-sm focus:border-moss focus:outline-none"
          />
          <button
            type="submit"
            disabled={thinking || (!input.trim() && !pendingPhotos.length)}
            className="h-10 shrink-0 rounded-full bg-moss px-4 text-sm font-medium text-white hover:bg-moss-dark disabled:opacity-50"
          >
            Envoyer
          </button>
        </form>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onPhotos} />
        {error && <p className="mt-2 text-xs text-clay">{error}</p>}
      </div>
    </div>
  );
}
