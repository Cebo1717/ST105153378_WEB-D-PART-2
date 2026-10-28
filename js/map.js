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

  // Leaflet failed to load (offline / blocked): the <noscript>-style fallback link stays visible
  if (typeof window.L === 'undefined') {
    mapEl.classList.add('map-failed');
    mapEl.textContent = 'The interactive map could not be loaded. Open Durban on OpenStreetMap using the link below.';
    return;
  }

  const L = window.L;
  const HQ = [-29.8587, 31.0218]; // Durban, KwaZulu-Natal (approximate base)

  const map = L.map(mapEl, { scrollWheelZoom: false }).setView(HQ, 11);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
  }).addTo(map);

  // Custom gold marker (no external marker images needed)
  const goldIcon = L.divIcon({ className: 'gold-pin', html: '<span>360</span>', iconSize: [44, 44], iconAnchor: [22, 44], popupAnchor: [0, -40] });

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
