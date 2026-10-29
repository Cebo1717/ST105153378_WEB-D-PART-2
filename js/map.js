/* ==========================================================================
   360WAVING — map.js  (about.html + contact.html)
   Interactive Leaflet map (OpenStreetMap tiles) centred on Durban:
   - gold marker for the 360WAVING base with a popup
   - circle showing the same-day delivery area
   - Contact page: "Show my distance" button using the Geolocation API
   ========================================================================== */

(function () {
  'use strict';

  const mapEl = document.getElementById('map');
  if (!mapEl) return;

  // Leaflet failed to load (CDN blocked / offline): show a plain OpenStreetMap embed of Durban instead
  if (typeof window.L === 'undefined') {
    mapEl.classList.add('map-failed');
    const frame = document.createElement('iframe');
    frame.title = 'Map of Durban, KwaZulu-Natal (OpenStreetMap)';
    frame.loading = 'lazy';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.src = 'https://www.openstreetmap.org/export/embed.html?bbox=30.85%2C-29.98%2C31.20%2C-29.74&layer=mapnik&marker=-29.8587%2C31.0218';
    mapEl.replaceChildren(frame);
    return;
  }

  const L = window.L;
  const HQ = [-29.8587, 31.0218]; // Durban, KwaZulu-Natal (approximate base)

  const map = L.map(mapEl, { scrollWheelZoom: false }).setView(HQ, 10);

  const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>';

  // Primary: CARTO dark tiles (dark map matches the black and gold brand and also loads when the page is opened from a file)
  const darkTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd', maxZoom: 19, attribution
  }).addTo(map);

  // Backup: if several tiles fail to load, switch automatically to standard OpenStreetMap tiles
  let tileErrors = 0;
  darkTiles.on('tileerror', () => {
    tileErrors += 1;
    if (tileErrors === 4) {
      map.removeLayer(darkTiles);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution }).addTo(map);
    }
  });

  // The map must recalculate its size if the layout changes after it was created
  window.addEventListener('load', () => map.invalidateSize());
  window.addEventListener('resize', () => map.invalidateSize());
  setTimeout(() => map.invalidateSize(), 400);

  // Custom gold marker (no external marker images needed)
  const goldIcon = L.divIcon({ className: 'gold-pin', html: '<span><b>360</b></span>', iconSize: [44, 44], iconAnchor: [22, 44], popupAnchor: [0, -40] });

  L.marker(HQ, { icon: goldIcon, title: '360WAVING - Durban', alt: '360WAVING base in Durban' })
    .addTo(map)
    .bindPopup('<strong>360WAVING</strong><br>Durban, KwaZulu-Natal<br>Mon-Sat 9AM-6PM<br>Nationwide delivery')
    .openPopup();

  L.circle(HQ, { radius: 15000, color: '#d4af37', weight: 2, fillColor: '#d4af37', fillOpacity: 0.08 })
    .addTo(map)
    .bindTooltip('Durban same-day delivery area (approx.)', { sticky: true });

  // Scroll-zoom only after the visitor clicks the map (so the page can still scroll)
  map.on('click', () => map.scrollWheelZoom.enable());
  map.on('mouseout', () => map.scrollWheelZoom.disable());

  /* ---------- Contact page: distance from the visitor ---------- */
  const distanceBtn = document.getElementById('locate-btn');
  const result = document.getElementById('distance-result');
  if (distanceBtn && result) {
    let userMarker = null;

    // Haversine formula: distance between two lat/lng points in km
    function distanceKm(a, b) {
      const rad = (d) => (d * Math.PI) / 180;
      const dLat = rad(b[0] - a[0]);
      const dLng = rad(b[1] - a[1]);
      const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
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
          const me = [pos.coords.latitude, pos.coords.longitude];
          const km = distanceKm(me, HQ);
          if (userMarker) userMarker.remove();
          userMarker = L.marker(me, { title: 'You are here' }).addTo(map).bindPopup('You are here').openPopup();
          map.fitBounds(L.latLngBounds([me, HQ]).pad(0.3));
          result.textContent = km <= 15
            ? `You are about ${km.toFixed(1)} km from us - inside our Durban same-day delivery area.`
            : `You are about ${Math.round(km)} km from our Durban base. We deliver nationwide in 2-5 business days.`;
        },
        () => { result.textContent = 'We could not get your location (permission denied or unavailable). You can still use the map above.'; },
        { enableHighAccuracy: false, timeout: 10000 }
      );
    });
  }
})();
