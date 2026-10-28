/* ==========================================================================
   360WAVING — ui.js
   Interactive elements, each activated only if its markup exists on the page:
   1. Accordion   [data-accordion]   (FAQ)
   2. Tabs        [data-tabs]        (About)
   3. Lightbox    [data-gallery]     (Gallery + home page)
   4. Wave tips   #tips-list         (home page, loaded dynamically)
   ========================================================================== */

(function () {
  'use strict';

  const { h, loadData, reveal } = window.Waving;

  /* ------------------------------------------------------------------------
     1. ACCORDION  (button + region pattern, keyboard accessible)
     ------------------------------------------------------------------------ */
  document.querySelectorAll('[data-accordion]').forEach((accordion) => {
    const items = Array.from(accordion.querySelectorAll('.accordion-item'));
    const triggers = items.map((item) => item.querySelector('.accordion-trigger'));

    function setOpen(item, open) {
      const trigger = item.querySelector('.accordion-trigger');
      const panel = item.querySelector('.accordion-panel');
      trigger.setAttribute('aria-expanded', String(open));
      item.classList.toggle('open', open);
      // max-height animation: measure the real height of the content
      panel.style.maxHeight = open ? panel.scrollHeight + 'px' : '0px';
    }

    items.forEach((item) => {
      const trigger = item.querySelector('.accordion-trigger');
      setOpen(item, false);
      trigger.addEventListener('click', () => {
        setOpen(item, trigger.getAttribute('aria-expanded') !== 'true');
      });
    });

    // Arrow keys / Home / End move between questions
    accordion.addEventListener('keydown', (e) => {
      const index = triggers.indexOf(document.activeElement);
      if (index === -1) return;
      let next = null;
      if (e.key === 'ArrowDown') next = (index + 1) % triggers.length;
      if (e.key === 'ArrowUp') next = (index - 1 + triggers.length) % triggers.length;
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = triggers.length - 1;
      if (next !== null) { e.preventDefault(); triggers[next].focus(); }
    });

    // Expand all / collapse all buttons
    document.querySelectorAll('[data-accordion-all]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const open = btn.dataset.accordionAll === 'open';
        items.filter((i) => !i.hidden).forEach((i) => setOpen(i, open));
      });
    });

    // Live FAQ search: hides questions that do not match what was typed
    const search = document.getElementById('faq-search');
    const status = document.getElementById('faq-status');
    if (search) {
      search.addEventListener('input', () => {
        const query = search.value.trim().toLowerCase();
        let visible = 0;
        items.forEach((item) => {
          const match = query === '' || item.textContent.toLowerCase().includes(query);
          item.hidden = !match;
          if (match) visible++;
          if (match && query !== '') setOpen(item, true);
          if (query === '') setOpen(item, false);
        });
        if (status) {
          status.textContent = query === ''
            ? ''
            : visible === 0 ? 'No questions match your search.' : `${visible} question${visible === 1 ? '' : 's'} found.`;
        }
      });
      search.closest('form').addEventListener('submit', (e) => e.preventDefault());
    }

    // Open a question directly from the URL, e.g. faq.html#delivery
    const fromHash = items.find((i) => i.id && '#' + i.id === location.hash);
    if (fromHash) setOpen(fromHash, true);
  });

  /* ------------------------------------------------------------------------
     2. TABS
     ------------------------------------------------------------------------ */
  document.querySelectorAll('[data-tabs]').forEach((tabs) => {
    const tabButtons = Array.from(tabs.querySelectorAll('[role="tab"]'));
    const panels = tabButtons.map((t) => document.getElementById(t.getAttribute('aria-controls')));

    function select(index, focus) {
      tabButtons.forEach((tab, i) => {
        const active = i === index;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        panels[i].hidden = !active;
        if (active) panels[i].classList.add('tab-enter');
      });
      if (focus) tabButtons[index].focus();
    }

    tabButtons.forEach((tab, i) => {
      tab.addEventListener('click', () => select(i, false));
      tab.addEventListener('keydown', (e) => {
        let next = null;
        if (e.key === 'ArrowRight') next = (i + 1) % tabButtons.length;
        if (e.key === 'ArrowLeft') next = (i - 1 + tabButtons.length) % tabButtons.length;
        if (e.key === 'Home') next = 0;
        if (e.key === 'End') next = tabButtons.length - 1;
        if (next !== null) { e.preventDefault(); select(next, true); }
      });
    });
    select(0, false);
  });

  /* ------------------------------------------------------------------------
     3. LIGHTBOX GALLERY
     Any <a data-lightbox href="large-image"> inside [data-gallery] opens a
     full-size viewer with previous / next / close and keyboard support.
     ------------------------------------------------------------------------ */
  const galleries = document.querySelectorAll('[data-gallery]');
  if (galleries.length) {
    let links = [];
    let current = 0;
    let lastFocus = null;

    const img = h('img', { alt: '' });
    const caption = h('p', { class: 'lightbox-caption' });
    const counter = h('p', { class: 'lightbox-counter', 'aria-live': 'polite' });
    const closeBtn = h('button', { type: 'button', class: 'icon-btn lightbox-close', 'aria-label': 'Close image viewer' }, '✕');
    const prevBtn = h('button', { type: 'button', class: 'icon-btn lightbox-nav lightbox-prev', 'aria-label': 'Previous image' }, '‹');
    const nextBtn = h('button', { type: 'button', class: 'icon-btn lightbox-nav lightbox-next', 'aria-label': 'Next image' }, '›');
    const dialog = h('dialog', { class: 'lightbox', 'aria-label': 'Image viewer' },
      closeBtn, prevBtn, nextBtn,
      h('figure', {}, img, h('figcaption', {}, caption, counter))
    );
    document.body.append(dialog);

    function show(index) {
      current = (index + links.length) % links.length;
      const link = links[current];
      const thumb = link.querySelector('img');
      img.classList.remove('lightbox-in');
      img.src = link.getAttribute('href');
      img.alt = thumb ? thumb.alt : '';
      caption.textContent = link.dataset.caption || (thumb ? thumb.alt : '');
      counter.textContent = `Image ${current + 1} of ${links.length}`;
      void img.offsetWidth;
      img.classList.add('lightbox-in');
    }

    function open(group, index) {
      links = Array.from(group.querySelectorAll('a[data-lightbox]'));
      lastFocus = document.activeElement;
      show(index);
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      closeBtn.focus();
    }

    galleries.forEach((group) => {
      group.addEventListener('click', (e) => {
        const link = e.target.closest('a[data-lightbox]');
        if (!link) return;
        e.preventDefault(); // without JS the link simply opens the image
        open(group, Array.from(group.querySelectorAll('a[data-lightbox]')).indexOf(link));
      });
    });

    closeBtn.addEventListener('click', () => dialog.close());
    prevBtn.addEventListener('click', () => show(current - 1));
    nextBtn.addEventListener('click', () => show(current + 1));
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => { if (lastFocus) lastFocus.focus(); });
    dialog.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
    });

    // Simple swipe support on touch screens
    let startX = null;
    dialog.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    dialog.addEventListener('touchend', (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
      startX = null;
    });
  }

  /* ------------------------------------------------------------------------
     4. WAVE TIPS - posts loaded dynamically, "Load more" button
     ------------------------------------------------------------------------ */
  const tipsList = document.getElementById('tips-list');
  if (tipsList) {
    const moreBtn = document.getElementById('tips-more');
    const status = document.getElementById('tips-status');
    const PAGE_SIZE = 3;
    let tips = [];
    let shown = 0;

    const dateFormat = new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });

    function renderMore() {
      const batch = tips.slice(shown, shown + PAGE_SIZE);
      const cards = batch.map((tip) =>
        h('article', { class: 'tip-card' },
          h('p', { class: 'tip-meta' }, tip.topic + ' · ', h('time', { datetime: tip.date }, dateFormat.format(new Date(tip.date)))),
          h('h3', {}, tip.title),
          h('p', {}, tip.body)
        )
      );
      cards.forEach((c) => tipsList.append(c));
      reveal(cards);
      shown += batch.length;
      status.textContent = `Showing ${shown} of ${tips.length} tips`;
      if (shown >= tips.length) { moreBtn.hidden = true; }
    }

    loadData('tips')
      .then((data) => {
        // newest first
        tips = data.slice().sort((a, b) => b.date.localeCompare(a.date));
        tipsList.replaceChildren();
        renderMore();
        moreBtn.hidden = shown >= tips.length;
        moreBtn.addEventListener('click', renderMore);
      })
      .catch(() => {
        tipsList.replaceChildren(h('p', {}, 'Wave tips could not be loaded right now. Please try again later.'));
        moreBtn.hidden = true;
      });
  }
})();
