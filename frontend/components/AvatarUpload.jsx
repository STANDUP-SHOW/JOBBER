'use client';

import { useRef, useState } from 'react';
import { uploadImage } from '../lib/cloudinary';

function PencilIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export default function AvatarUpload({ avatarUrl, firstName, onUploaded }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      const url = await uploadImage(file, 'jobber/avatars');
      await onUploaded(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <div className="flex h-40 w-40 shrink-0 items-center justify-center overflow-hidden rounded-full bg-moss-light text-5xl font-semibold text-moss-dark">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Photo de profil" className="h-full w-full object-cover" />
          ) : (
            <span>{firstName?.[0]?.toUpperCase() || '?'}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          aria-label="Changer la photo de profil"
          className="absolute -bottom-1 left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border-4 border-paper bg-moss text-white shadow hover:bg-moss-dark disabled:opacity-60"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="mt-2 text-sm font-medium text-moss hover:underline disabled:opacity-60"
      >
        {busy ? 'Envoi…' : 'Changer la photo'}
      </button>
      {error && <p className="text-xs text-clay">{error}</p>}
    </div>
  );
}
