/* ==========================================================================
   360WAVING — main.js  (loaded on every page)
   1. Helpers (DOM builder, data loader, toast messages)
   2. Mobile navigation toggle
   3. Scroll-reveal animations + back-to-top button
   4. Shopping cart (localStorage) + cart modal
   ========================================================================== */

(function () {
  'use strict';

  // Tells the CSS that JavaScript is running (used for progressive enhancement)
  document.documentElement.classList.add('js');

  /* ------------------------------------------------------------------------
     1. HELPERS
     ------------------------------------------------------------------------ */

  /**
   * Tiny DOM builder. Builds elements with createElement/textContent only, so
   * data (product names, user input...) can never be injected as HTML.
   * h('p', { class: 'x' }, 'Hello', otherNode)
   */
  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([key, value]) => {
      if (value === false || value === null || value === undefined) return;
      if (key === 'class') el.className = value;
      else if (key === 'text') el.textContent = value;
      else if (key.startsWith('on') && typeof value === 'function') {
        el.addEventListener(key.slice(2).toLowerCase(), value);
      } else el.setAttribute(key, value === true ? '' : value);
    });
    children.flat().forEach((child) => {
      if (child === null || child === undefined || child === false) return;
      el.append(child.nodeType ? child : document.createTextNode(String(child)));
    });
    return el;
  }

  /** Formats a number as South African Rand, e.g. 250 -> "R250" */
  const money = (n) => 'R' + Number(n).toFixed(Number.isInteger(n) ? 0 : 2);

  /**
   * Loads a JSON data set asynchronously with fetch() (dynamic content).
   * If the request fails (for example the page was opened straight from the
   * file system) it falls back to the copy in js/data-fallback.js.
   */
  async function loadData(name) {
    try {
      const response = await fetch('data/' + name + '.json', { cache: 'no-cache' });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return await response.json();
    } catch (error) {
      const fallback = window.__WAVING_DATA__ && window.__WAVING_DATA__[name];
      if (fallback) return fallback;
      throw error;
    }
  }

  /** Small pop-up message (announced to screen readers via aria-live) */
  let toastTimer;
  function toast(message) {
    let box = document.getElementById('toast');
    if (!box) {
      box = h('div', { id: 'toast', class: 'toast', role: 'status', 'aria-live': 'polite' });
      document.body.append(box);
    }
    box.textContent = message;
    box.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => box.classList.remove('show'), 2600);
  }

  // Share helpers with the other scripts
  const DELIVERY_FEE = 80; // flat delivery fee per order (Rand)
  window.Waving = { h, money, loadData, toast, DELIVERY_FEE };

  /* ------------------------------------------------------------------------
     2. MOBILE NAVIGATION
     ------------------------------------------------------------------------ */
  const nav = document.querySelector('nav');
  const navToggle = document.querySelector('.nav-toggle');
  if (nav && navToggle) {
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.focus();
      }
    });
  }

  /* ------------------------------------------------------------------------
     3. SCROLL REVEAL + BACK TO TOP + FOOTER YEAR
     ------------------------------------------------------------------------ */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let revealObserver = null;

  if ('IntersectionObserver' in window && !reduceMotion) {
    revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
  }

  /** Registers elements for the fade-up animation (also used for dynamic cards) */
  function reveal(elements) {
    elements.forEach((el, index) => {
      el.classList.add('reveal');
      el.style.setProperty('--reveal-delay', Math.min(index, 6) * 70 + 'ms');
      if (revealObserver) revealObserver.observe(el);
      else el.classList.add('is-visible');
    });
  }
  window.Waving.reveal = reveal;
  reveal(document.querySelectorAll('[data-reveal]'));

  const topButton = h('button', { class: 'back-to-top', type: 'button', 'aria-label': 'Back to top', text: '↑' });
  topButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
  document.body.append(topButton);
  window.addEventListener('scroll', () => {
    topButton.classList.toggle('show', window.scrollY > 500);
  }, { passive: true });

  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ------------------------------------------------------------------------
     4. SHOPPING CART
     Stored in localStorage as [{ id, name, price, image, alt, qty }]
     ------------------------------------------------------------------------ */
  const CART_KEY = 'waving-cart-v1';
  const WHATSAPP_NUMBER = '27762481717'; // same number as the Contact page

  function readCart() {
    try {
      const data = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return []; // storage blocked or corrupted: start with an empty cart
    }
  }
  function writeCart(items) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch (e) { /* ignore */ }
  }

  let cart = readCart();
  const cartCountEls = document.querySelectorAll('.cart-count');
  let cartDialog = null;

  const cartTotal = () => cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartQty = () => cart.reduce((sum, item) => sum + item.qty, 0);

  function updateBadge() {
    cartCountEls.forEach((el) => {
      el.textContent = cartQty();
      el.classList.remove('bump');
      void el.offsetWidth; // restart the CSS animation
      el.classList.add('bump');
    });
  }

  function save() {
    writeCart(cart);
    updateBadge();
    if (cartDialog && cartDialog.open) renderCart();
  }

  const Cart = {
    add(product) {
      const found = cart.find((item) => item.id === product.id);
      if (found) found.qty = Math.min(found.qty + 1, 99);
      else cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, alt: product.alt, qty: 1 });
      save();
      toast(product.name + ' added to cart');
    },
    setQty(id, qty) {
      const item = cart.find((i) => i.id === id);
      if (!item) return;
      item.qty = Math.max(1, Math.min(99, qty));
      save();
    },
    remove(id) {
      cart = cart.filter((item) => item.id !== id);
      save();
    },
    clear() { cart = []; save(); },
    open() { openCart(); }
  };
  window.Waving.Cart = Cart;

  /** Builds the WhatsApp order message from the cart */
  function whatsappLink() {
    const lines = cart.map((i) => `• ${i.qty} x ${i.name} (${money(i.price)} each)`);
    const text = ['Hi 360WAVING, I would like to order:', ...lines, `Subtotal: ${money(cartTotal())}`, `Delivery: ${money(DELIVERY_FEE)}`, `Total: ${money(cartTotal() + DELIVERY_FEE)}`, 'Please confirm availability and delivery.'].join('\n');
    return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text);
  }

  function renderCart() {
    const body = cartDialog.querySelector('.cart-body');
    body.replaceChildren();

    if (cart.length === 0) {
      body.append(
        h('p', { class: 'cart-empty' }, 'Your cart is empty.'),
        h('a', { class: 'btn', href: 'products.html' }, 'Browse products')
      );
      return;
    }

    const list = h('ul', { class: 'cart-list' });
    cart.forEach((item) => {
      const qtyInput = h('input', {
        type: 'number', min: '1', max: '99', value: String(item.qty),
        'aria-label': 'Quantity of ' + item.name, class: 'qty-input'
      });
      qtyInput.addEventListener('change', () => Cart.setQty(item.id, parseInt(qtyInput.value, 10) || 1));

      list.append(h('li', { class: 'cart-item' },
        h('img', { src: item.image, alt: item.alt, width: '64', height: '64', loading: 'lazy' }),
        h('div', { class: 'cart-item-info' },
          h('strong', {}, item.name),
          h('span', {}, money(item.price) + ' each')
        ),
        qtyInput,
        h('span', { class: 'cart-line-total' }, money(item.price * item.qty)),
        h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Remove ' + item.name, onclick: () => Cart.remove(item.id) }, '✕')
      ));
    });

    body.append(
      list,
      h('p', { class: 'cart-sub' }, 'Subtotal: ', money(cartTotal())),
      h('p', { class: 'cart-sub' }, 'Delivery (flat fee): ', money(DELIVERY_FEE)),
      h('p', { class: 'cart-total' }, 'Total: ', h('strong', {}, money(cartTotal() + DELIVERY_FEE))),
      h('p', { class: 'cart-note' }, 'Durban same-day delivery available, 2-5 business days nationwide.'),
      h('div', { class: 'cart-actions' },
        h('a', { class: 'btn', href: whatsappLink(), target: '_blank', rel: 'noopener noreferrer' }, 'Order on WhatsApp'),
        h('a', { class: 'btn btn-outline', href: 'enquiry.html' }, 'Ask a question first'),
        h('button', { type: 'button', class: 'btn btn-ghost', onclick: () => { Cart.clear(); toast('Cart cleared'); } }, 'Clear cart')
      )
    );
  }

  function openCart() {
    if (!cartDialog) {
      cartDialog = h('dialog', { class: 'modal', id: 'cart-dialog', 'aria-labelledby': 'cart-title' },
        h('div', { class: 'modal-head' },
          h('h2', { id: 'cart-title' }, 'Your cart'),
          h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Close cart', onclick: () => cartDialog.close() }, '✕')
        ),
        h('div', { class: 'cart-body' })
      );
      // Click on the dark backdrop closes the modal
      cartDialog.addEventListener('click', (e) => { if (e.target === cartDialog) cartDialog.close(); });
      document.body.append(cartDialog);
    }
    renderCart();
    if (typeof cartDialog.showModal === 'function') cartDialog.showModal();
    else cartDialog.setAttribute('open', '');
  }

  document.querySelectorAll('.cart-btn').forEach((btn) => btn.addEventListener('click', openCart));

  // Keep several open tabs in sync
  window.addEventListener('storage', (e) => {
    if (e.key === CART_KEY) { cart = readCart(); updateBadge(); if (cartDialog && cartDialog.open) renderCart(); }
  });

  cartCountEls.forEach((el) => { el.textContent = cartQty(); });
})();
