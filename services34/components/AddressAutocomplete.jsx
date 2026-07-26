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
  // The Google listener below is attached once and never re-attached (see
  // the autocompleteRef guard), so it must never close over onChange/onSelect
  // directly — that would freeze them at whatever the form looked like the
  // moment the Places script finished loading. Reading through refs instead
  // means the listener always calls whichever onChange/onSelect is current,
  // so selecting a suggestion merges into the form's latest state instead of
  // overwriting everything back to that first render's (empty) values.
  const onChangeRef = useRef(onChange);
  const onSelectRef = useRef(onSelect);
  onChangeRef.current = onChange;
  onSelectRef.current = onSelect;

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
      onChangeRef.current?.(address);
      onSelectRef.current?.({
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
      // The browser's native "Enter submits the form" behavior fires even
      // when Enter is pressed to accept a Places suggestion, submitting the
      // whole form prematurely — block it here so only the button submits.
      onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
      className={className}
      autoComplete="off"
    />
  );
}
