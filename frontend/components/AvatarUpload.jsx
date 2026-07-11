'use client';

import { useRef, useState } from 'react';
import { uploadImage } from '../lib/cloudinary';

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
      const url = await uploadImage(file);
      await onUploaded(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-moss-light text-2xl font-semibold text-moss-dark disabled:opacity-60"
        aria-label="Changer la photo de profil"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="Photo de profil" className="h-full w-full object-cover" />
        ) : (
          <span>{firstName?.[0]?.toUpperCase() || '?'}</span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-ink/50 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
          {busy ? '…' : 'Modifier'}
        </span>
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="text-sm font-medium text-moss hover:underline disabled:opacity-60"
        >
          {busy ? 'Envoi…' : 'Changer la photo'}
        </button>
        {error && <p className="mt-1 text-xs text-clay">{error}</p>}
      </div>
    </div>
  );
}
