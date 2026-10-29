/* ==========================================================================
   360WAVING — products.js  (products.html only)
   - Loads products from data/products.json (dynamic content)
   - Live search + category filter + sort
   - Quick-view modal, Add to cart
   ========================================================================== */

(function () {
  'use strict';

  const { h, money, loadData, reveal, Cart } = window.Waving;

  const grid = document.getElementById('product-grid');
  if (!grid) return;

  const searchInput = document.getElementById('product-search');
  const categorySelect = document.getElementById('product-category');
  const sortSelect = document.getElementById('product-sort');
  const resetButton = document.getElementById('product-reset');
  const countEl = document.getElementById('results-count');

  let products = [];

  const CATEGORY_LABELS = {
    durags: 'Durags', caps: 'Wave caps', brushes: 'Brushes', pomades: 'Pomades',
    oils: 'Oils', shampoos: 'Shampoos', kits: 'Kits'
  };

  /* ---------- Rendering ---------- */

  function productCard(p) {
    const quickView = h('button', { type: 'button', class: 'btn btn-outline btn-small' }, 'Quick view');
    quickView.addEventListener('click', () => openQuickView(p));

    const add = h('button', { type: 'button', class: 'btn btn-small' }, 'Add to cart');
    add.addEventListener('click', () => Cart.add(p));

    return h('li', { class: 'product-card', 'data-id': p.id },
      h('h3', {}, p.name, ' ', h('span', { class: 'price' }, money(p.price))),
      h('p', { class: 'variants' }, p.variants),
      h('img', { src: p.thumb, srcset: p.thumb + ' 480w, ' + p.image + ' ' + p.width + 'w', sizes: '(max-width: 600px) 90vw, (max-width: 900px) 45vw, 340px', alt: p.alt, width: p.width, height: p.height, loading: 'lazy' }),
      h('p', {}, p.short),
      h('div', { class: 'card-actions' }, add, quickView)
    );
  }

  function render(list) {
    grid.replaceChildren();
    list.forEach((p) => grid.append(productCard(p)));
    reveal(grid.querySelectorAll('.product-card'));

    countEl.textContent = list.length === 0
      ? 'No products match your search.'
      : `Showing ${list.length} of ${products.length} product${products.length === 1 ? '' : 's'}`;

    if (list.length === 0) {
      grid.append(h('li', { class: 'no-results' },
        h('p', {}, 'Nothing found. Try a different word like "brush", "durag" or "kit", or reset the filters.')
      ));
    }
  }

  /* ---------- Search / filter / sort ---------- */

  function applyFilters() {
    const query = searchInput.value.trim().toLowerCase();
    const category = categorySelect.value;
    const sort = sortSelect.value;

    let list = products.filter((p) => {
      const haystack = [p.name, p.variants, p.short, p.long, CATEGORY_LABELS[p.category], ...p.tags].join(' ').toLowerCase();
      const matchesQuery = query === '' || query.split(/\s+/).every((word) => haystack.includes(word));
      const matchesCategory = category === 'all' || p.category === category;
      return matchesQuery && matchesCategory;
    });

    const sorters = {
      'price-asc': (a, b) => a.price - b.price,
      'price-desc': (a, b) => b.price - a.price,
      'name-asc': (a, b) => a.name.localeCompare(b.name),
      'default': () => 0
    };
    list = list.slice().sort(sorters[sort] || sorters.default);
    render(list);
  }

  let debounce;
  searchInput.addEventListener('input', () => { clearTimeout(debounce); debounce = setTimeout(applyFilters, 150); });
  categorySelect.addEventListener('change', applyFilters);
  sortSelect.addEventListener('change', applyFilters);
  resetButton.addEventListener('click', () => {
    searchInput.value = '';
    categorySelect.value = 'all';
    sortSelect.value = 'default';
    applyFilters();
    searchInput.focus();
  });
  // Pressing Enter in the search box should not reload the page
  searchInput.closest('form').addEventListener('submit', (e) => { e.preventDefault(); applyFilters(); });

  /* ---------- Quick-view modal ---------- */

  let dialog = null;
  function openQuickView(p) {
    if (!dialog) {
      dialog = h('dialog', { class: 'modal modal-wide', id: 'quickview', 'aria-labelledby': 'qv-title' });
      dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
      document.body.append(dialog);
    }
    const add = h('button', { type: 'button', class: 'btn' }, 'Add to cart');
    add.addEventListener('click', () => { Cart.add(p); dialog.close(); });

    dialog.replaceChildren(
      h('div', { class: 'modal-head' },
        h('h2', { id: 'qv-title' }, p.name),
        h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Close quick view', onclick: () => dialog.close() }, '✕')
      ),
      h('div', { class: 'quickview' },
        h('img', { src: p.image, srcset: p.thumb + ' 480w, ' + p.image + ' ' + p.width + 'w', sizes: '(max-width: 700px) 85vw, 320px', alt: p.alt, width: p.width, height: p.height }),
        h('div', {},
          h('p', { class: 'price-large' }, money(p.price)),
          h('p', { class: 'variants' }, p.variants),
          h('p', {}, p.long),
          h('p', { class: 'cart-note' }, 'Category: ' + CATEGORY_LABELS[p.category] + ' · Nationwide delivery'),
          h('div', { class: 'card-actions' }, add,
            h('a', { class: 'btn btn-outline', href: 'enquiry.html' }, 'Ask about this product'))
        )
      )
    );
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  /* ---------- Start ---------- */
  loadData('products')
    .then((data) => {
      products = data;
      // Allow links such as products.html?category=kits
      const wanted = new URLSearchParams(location.search).get('category');
      if (wanted && CATEGORY_LABELS[wanted]) categorySelect.value = wanted;
      applyFilters();
    })
    .catch(() => {
      countEl.textContent = '';
      grid.replaceChildren(h('li', { class: 'no-results' },
        h('p', {}, 'Sorry, the products could not be loaded. Please refresh the page or contact us on WhatsApp +27762481717.')));
    });
})();
