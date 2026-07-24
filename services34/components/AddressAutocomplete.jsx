'use client';

import { useEffect, useRef } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { GOOGLE_MAPS_LIBRARIES } from '../lib/googleMapsLibraries';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Rue, ville',
  required,
  className = 'mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand',
}) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    id: 'services34-google-maps',
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
