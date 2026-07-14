'use client';

import { useEffect, useRef } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { GOOGLE_MAPS_LIBRARIES } from '../lib/googleMapsLibraries';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Plain text input that becomes a Google Places address autocomplete once the
// Maps script has loaded — falls back to a normal input if there's no API key
// or the script hasn't loaded yet, so it's always safe to render.
export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Rue, ville',
  required,
  className = 'mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss',
}) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    id: 'jobber-google-maps',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'fr' },
      fields: ['formatted_address', 'geometry'],
      types: ['address'],
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      const address = place.formatted_address || inputRef.current.value;
      onChange?.(address);
      onSelect?.({
        address,
        lat: place.geometry?.location?.lat(),
        lng: place.geometry?.location?.lng(),
      });
    });

    autocompleteRef.current = autocomplete;
  }, [isLoaded]);

  return (
    <input
      ref={inputRef}
      type="text"
      required={required}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className={className}
      autoComplete="off"
    />
  );
}
