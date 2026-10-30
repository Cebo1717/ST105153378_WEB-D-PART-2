/* ==========================================================================
   360WAVING — map.js  (about.html + contact.html)
   OpenStreetMap embedded map of the Durban base (no API key, works on any host).
   - Drag to move, + / - buttons to zoom, green pin on Durban
   - Contact page: "How far am I from you?" uses the Geolocation API and the
     Haversine formula, then links to OpenStreetMap directions.
   ========================================================================== */

(function () {
  'use strict';

  const mapEl = document.getElementById('map');
  if (!mapEl) return;

  const HQ = { lat: -29.8587, lng: 31.0218 }; // Durban, KwaZulu-Natal (approximate base)

  /* ---------- The map: OpenStreetMap embed with a pin on Durban ---------- */
  const frame = document.createElement('iframe');
  frame.title = 'Map showing 360WAVING in Durban, KwaZulu-Natal';
  frame.loading = 'lazy';
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  // bbox = west, south, east, north (wide view of Durban and surroundings)
  frame.src = 'https://www.openstreetmap.org/export/embed.html?bbox=30.45%2C-30.10%2C31.55%2C-29.55&layer=mapnik&marker=' + HQ.lat + '%2C' + HQ.lng;
  mapEl.replaceChildren(frame);

  /* ---------- Contact page: "How far am I from you?" ---------- */
  const distanceBtn = document.getElementById('locate-btn');
  const result = document.getElementById('distance-result');
  if (!distanceBtn || !result) return;

  // Haversine formula: distance between two lat/lng points in km
  function distanceKm(a, b) {
    const rad = (d) => (d * Math.PI) / 180;
    const dLat = rad(b.lat - a.lat);
    const dLng = rad(b.lng - a.lng);
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }

  distanceBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      result.textContent = 'Your browser does not support location. Please use the map instead.';
      return;
    }
    result.textContent = 'Finding your location...';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const me = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const km = distanceKm(me, HQ);
        result.textContent = km <= 15
          ? `You are about ${km.toFixed(1)} km from us - inside our Durban same-day delivery area. `
          : `You are about ${Math.round(km)} km from our Durban base. We deliver nationwide in 2-5 business days. `;
        const link = document.createElement('a');
        link.href = `https://www.openstreetmap.org/directions?from=${me.lat}%2C${me.lng}&to=${HQ.lat}%2C${HQ.lng}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'Get directions';
        result.append(link);
      },
      () => { result.textContent = 'We could not get your location (permission denied or unavailable). You can still use the map above.'; },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  });
})();
