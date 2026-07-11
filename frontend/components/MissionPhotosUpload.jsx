'use client';

import { useRef, useState } from 'react';
import { uploadImage } from '../lib/cloudinary';

const MAX_PHOTOS = 5;

export default function MissionPhotosUpload({ photos, onChange }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onFileChange(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setError('');

    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      setError(`Maximum ${MAX_PHOTOS} photos.`);
      e.target.value = '';
      return;
    }

    setBusy(true);
    try {
      const urls = await Promise.all(files.slice(0, room).map(uploadImage));
      onChange([...photos, ...urls]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  function removePhoto(url) {
    onChange(photos.filter((p) => p !== url));
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {photos.map((url) => (
          <div key={url} className="group relative aspect-square overflow-hidden rounded-md border border-slate-200">
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(url)}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink/70 text-xs text-white opacity-0 transition group-hover:opacity-100"
              aria-label="Supprimer la photo"
            >
              ×
            </button>
          </div>
        ))}
        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex aspect-square items-center justify-center rounded-md border border-dashed border-slate-300 text-xs text-slate-400 hover:border-moss hover:text-moss disabled:opacity-60"
          >
            {busy ? '…' : '+ Ajouter'}
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={onFileChange} />
      <p className="mt-1 text-xs text-slate-400">{photos.length}/{MAX_PHOTOS} photos</p>
      {error && <p className="mt-1 text-xs text-clay">{error}</p>}
    </div>
  );
}
