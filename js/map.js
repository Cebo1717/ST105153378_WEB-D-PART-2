/* ==========================================================================
   360WAVING — map.js  (about.html + contact.html)
   Google Maps for the Durban base.

   TWO MODES (automatic):
   1. GOOGLE_MAPS_API_KEY is empty  -> Google's free embedded map (no key needed):
      drag, zoom, switch to satellite, open in Google Maps.
   2. GOOGLE_MAPS_API_KEY is filled -> full Google Maps JavaScript API:
      custom marker, info window, 15 km same-day delivery circle,
      and "How far am I from you?" drops a marker for the visitor.

   Both modes: the contact page "How far am I from you?" button uses the
   Geolocation API + Haversine formula and links to Google Maps directions.
   ========================================================================== */

(function () {
  'use strict';

  /* Paste your Google Maps JavaScript API key between the quotes to switch on mode 2.
     (Google Cloud Console > APIs > "Maps JavaScript API" > Credentials > restrict the key to your website.) */
  const GOOGLE_MAPS_API_KEY = '';

  const mapEl = document.getElementById('map');
  if (!mapEl) return;

  const HQ = { lat: -29.8587, lng: 31.0218 }; // Durban, KwaZulu-Natal (approximate base)
  const DELIVERY_RADIUS_M = 15000;            // Durban same-day delivery area

  /* ---------- Shared: "How far am I from you?" (contact page) ---------- */
  const distanceBtn = document.getElementById('locate-btn');
  const result = document.getElementById('distance-result');
  let onUserLocation = null; // mode 2 adds a marker through this hook

  // Haversine formula: distance between two lat/lng points in km
  function distanceKm(a, b) {
    const rad = (d) => (d * Math.PI) / 180;
    const dLat = rad(b.lat - a.lat);
    const dLng = rad(b.lng - a.lng);
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }

  if (distanceBtn && result) {
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
          link.href = `https://www.google.com/maps/dir/?api=1&origin=${me.lat},${me.lng}&destination=${HQ.lat},${HQ.lng}`;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.textContent = 'Get directions on Google Maps';
          result.append(link);
          if (onUserLocation) onUserLocation(me);
        },
        () => { result.textContent = 'We could not get your location (permission denied or unavailable). You can still use the map above.'; },
        { enableHighAccuracy: false, timeout: 10000 }
      );
    });
  }

  /* ---------- Mode 1: free embedded Google map (no API key) ---------- */
  function showEmbed() {
    const frame = document.createElement('iframe');
    frame.title = 'Google Map showing 360WAVING in Durban, KwaZulu-Natal';
    frame.loading = 'lazy';
    frame.referrerPolicy = 'no-referrer-when-downgrade';
    frame.allowFullscreen = true;
    frame.src = `https://maps.google.com/maps?q=${HQ.lat},${HQ.lng}&z=11&output=embed`;
    mapEl.replaceChildren(frame);
  }

  /* ---------- Mode 2: Google Maps JavaScript API (needs a key) ---------- */
  function initApiMap() {
    const g = window.google.maps;
    const map = new g.Map(mapEl, {
      center: HQ, zoom: 10, mapTypeControl: true, streetViewControl: false, fullscreenControl: true,
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#1b1b1b' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#b8b8b8' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#1b1b1b' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0b0b0b' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#333333' }] },
        { featureType: 'poi', stylers: [{ visibility: 'off' }] }
      ]
    });

    const marker = new g.Marker({ position: HQ, map, title: '360WAVING - Durban' });
    const info = new g.InfoWindow({
      content: '<div style="color:#111;font-family:sans-serif"><strong>360WAVING</strong><br>Durban, KwaZulu-Natal<br>Mon-Sat 9AM-6PM<br>Nationwide delivery</div>'
    });
    info.open({ map, anchor: marker });
    marker.addListener('click', () => info.open({ map, anchor: marker }));

    new g.Circle({ map, center: HQ, radius: DELIVERY_RADIUS_M, strokeColor: '#d4af37', strokeWeight: 2, fillColor: '#d4af37', fillOpacity: 0.1 });

    let userMarker = null;
    onUserLocation = (me) => {
      if (userMarker) userMarker.setMap(null);
      userMarker = new g.Marker({ position: me, map, title: 'You are here' });
      const bounds = new g.LatLngBounds();
      bounds.extend(me); bounds.extend(HQ);
      map.fitBounds(bounds);
    };
  }

  if (GOOGLE_MAPS_API_KEY) {
    window.initWavingMap = initApiMap;
    const script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(GOOGLE_MAPS_API_KEY) + '&callback=initWavingMap&loading=async';
    script.async = true;
    script.onerror = showEmbed; // key rejected or blocked: still show a map
    document.head.append(script);
    window.gm_authFailure = showEmbed; // invalid key / billing not enabled: fall back to the free embed
  } else {
    showEmbed();
  }
})();
