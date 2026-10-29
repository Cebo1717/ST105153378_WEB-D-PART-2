/* ==========================================================================
   360WAVING — forms.js  (enquiry.html + contact.html)
   1. Client-side validation (HTML5 attributes + JavaScript, with custom
      error messages shown next to each field)
   2. AJAX submission with fetch() - no page reload
   3. Enquiry: instant response about cost / availability
   4. Contact: validated data is compiled into an e-mail the visitor can send
   ========================================================================== */

(function () {
  'use strict';

  const { h, money, loadData, DELIVERY_FEE } = window.Waving;

  /* The e-mail address that receives messages. Change it here ONCE. */
  const RECIPIENT_EMAIL = '360waving@gmail.com';
  /* AJAX endpoint (FormSubmit relays the form data to RECIPIENT_EMAIL). */
  const AJAX_ENDPOINT = 'https://formsubmit.co/ajax/' + RECIPIENT_EMAIL;

  /* ------------------------------------------------------------------------
     1. VALIDATION
     ------------------------------------------------------------------------ */
  const NAME_RE = /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ' -]{1,59}$/;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  // South African numbers: 0821234567 or +27821234567 (spaces/dashes allowed)
  const PHONE_RE = /^(\+27|0)[1-9][0-9]{8}$/;

  /** Returns an error message for a field, or '' when it is valid. */
  function messageFor(field) {
    const label = field.dataset.label || 'This field';
    const value = field.value.trim();

    if (field.type === 'checkbox') return field.required && !field.checked ? field.dataset.error || 'Please tick this box to continue.' : '';

    if (field.type === 'radio') {
      const group = field.form.querySelectorAll('input[name="' + field.name + '"]');
      return field.required && !Array.from(group).some((r) => r.checked) ? 'Please choose one option.' : '';
    }

    if (field.required && value === '') {
      return field.tagName === 'SELECT' ? 'Please choose an option.' : label + ' is required.';
    }
    if (value === '') return '';

    if (field.name === 'name' && !NAME_RE.test(value)) return 'Use letters, spaces, apostrophes or hyphens only (2-60 characters).';
    if (field.type === 'email' && !EMAIL_RE.test(value)) return 'Enter a valid e-mail address, e.g. name@example.com.';
    if (field.type === 'tel' && !PHONE_RE.test(value.replace(/[\s-]/g, ''))) return 'Enter a South African number such as 076 248 1717 or +27 76 248 1717.';
    if (field.type === 'number') {
      const n = Number(value);
      if (!Number.isInteger(n)) return 'Enter a whole number.';
      if (field.min !== '' && n < Number(field.min)) return 'The minimum is ' + field.min + '.';
      if (field.max !== '' && n > Number(field.max)) return 'The maximum is ' + field.max + '.';
    }
    if (field.type === 'date') {
      const chosen = new Date(value + 'T00:00:00');
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (isNaN(chosen)) return 'Enter a valid date.';
      if (chosen < today) return 'Please choose today or a future date.';
    }
    if (field.minLength > 0 && value.length < field.minLength) return label + ' must be at least ' + field.minLength + ' characters (you typed ' + value.length + ').';
    if (field.maxLength > 0 && value.length > field.maxLength) return label + ' must be at most ' + field.maxLength + ' characters.';
    return '';
  }

  /** Shows or clears the error text under a field */
  function showError(field, message) {
    const holder = field.closest('.field') || field.parentElement;
    const errorEl = holder.querySelector('.field-error');
    if (!errorEl) return;
    errorEl.textContent = message;
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
    holder.classList.toggle('has-error', Boolean(message));
    holder.classList.toggle('is-valid', !message && (field.value.trim() !== '' || field.checked));
  }

  function validateField(field) {
    const message = messageFor(field);
    showError(field, message);
    return message === '';
  }

  /** Validates the whole form; focuses the first invalid field; returns true if all valid. */
  function validateForm(form) {
    const fields = Array.from(form.querySelectorAll('input, select, textarea')).filter((f) => !f.disabled && f.type !== 'hidden' && f.name !== '_honey');
    let firstBad = null;
    const checkedRadios = new Set();
    fields.forEach((f) => {
      if (f.type === 'radio') { if (checkedRadios.has(f.name)) return; checkedRadios.add(f.name); }
      if (!validateField(f) && !firstBad) firstBad = f;
    });
    const summary = form.querySelector('.form-summary');
    if (firstBad) {
      summary.textContent = 'Please fix the highlighted fields and try again.';
      summary.hidden = false;
      firstBad.focus();
      return false;
    }
    summary.hidden = true;
    return true;
  }

  /** Live feedback: validate on blur, then on every keystroke once touched */
  function attachLiveValidation(form) {
    form.setAttribute('novalidate', ''); // we show our own messages instead of the browser bubbles
    form.querySelectorAll('input, select, textarea').forEach((field) => {
      if (field.type === 'hidden' || field.name === '_honey') return;
      field.addEventListener('blur', () => { field.dataset.touched = '1'; validateField(field); });
      // Re-check while typing once the field was visited OR is currently showing an error,
      // so the error disappears as soon as it is fixed (not later on blur, which shifts the layout under the next click)
      const live = () => {
        const holder = field.closest('.field') || field.parentElement;
        if (field.dataset.touched || holder.classList.contains('has-error')) validateField(field);
      };
      field.addEventListener('input', live);
      field.addEventListener('change', () => { field.dataset.touched = '1'; validateField(field); });
    });
    // Character counters
    form.querySelectorAll('textarea[maxlength]').forEach((ta) => {
      const counter = form.querySelector('[data-counter-for="' + ta.id + '"]');
      if (!counter) return;
      const update = () => { counter.textContent = ta.value.length + ' / ' + ta.maxLength + ' characters'; };
      ta.addEventListener('input', update); update();
    });
  }

  /* ------------------------------------------------------------------------
     2. AJAX SUBMISSION
     ------------------------------------------------------------------------ */
  async function sendAjax(form, extra) {
    const data = new FormData(form);
    Object.entries(extra || {}).forEach(([k, v]) => data.set(k, v));
    data.set('_captcha', 'false');
    data.set('_template', 'table');
    const response = await fetch(AJAX_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const json = await response.json();
    if (json.success === false || json.success === 'false') throw new Error(json.message || 'Not delivered');
    return json;
  }

  function setBusy(form, busy) {
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = busy;
    btn.classList.toggle('is-loading', busy);
    btn.dataset.originalText = btn.dataset.originalText || btn.textContent;
    btn.textContent = busy ? 'Sending...' : btn.dataset.originalText;
  }

  const clean = (s) => s.replace(/\s+/g, ' ').trim();
  const values = (form) => Object.fromEntries(new FormData(form).entries());

  /* ------------------------------------------------------------------------
     3. ENQUIRY FORM  (enquiry.html)
     ------------------------------------------------------------------------ */
  const enquiryForm = document.getElementById('enquiry-form');
  if (enquiryForm) {
    attachLiveValidation(enquiryForm);

    const typeSelect = document.getElementById('enquiry-type');
    const productSelect = document.getElementById('enquiry-product');
    const qtyInput = document.getElementById('enquiry-qty');
    const areaSelect = document.getElementById('enquiry-area');
    const dateInput = document.getElementById('enquiry-date');
    const productFields = enquiryForm.querySelectorAll('[data-for="product"]');
    const response = document.getElementById('enquiry-response');
    let products = [];

    // Earliest selectable date = today
    const now = new Date();
    dateInput.min = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

    loadData('products').then((list) => {
      products = list;
      list.forEach((p) => productSelect.append(h('option', { value: p.id }, p.name + ' (' + money(p.price) + ')')));
      const wanted = new URLSearchParams(location.search).get('product');
      if (wanted && list.some((p) => p.id === wanted)) productSelect.value = wanted;
    }).catch(() => { /* the select simply stays empty; the message box still works */ });

    // Show product fields only for product / bulk enquiries
    function syncType() {
      const needsProduct = ['product', 'bulk'].includes(typeSelect.value);
      productFields.forEach((el) => { el.hidden = !needsProduct; });
      productSelect.required = needsProduct;
      qtyInput.required = needsProduct;
      areaSelect.required = needsProduct;
      if (!needsProduct) { [productSelect, qtyInput, areaSelect].forEach((f) => showError(f, '')); }
    }
    typeSelect.addEventListener('change', syncType);
    syncType();

    /* Builds the on-screen answer for the visitor (cost / availability / next steps) */
    function buildResponse(v) {
      const name = clean(v.name).split(' ')[0];
      const box = h('div', { class: 'response-box', tabindex: '-1' });
      box.append(h('h3', {}, 'Thanks ' + name + ' - here is your response'));

      if (v.type === 'product' || v.type === 'bulk') {
        const p = products.find((x) => x.id === v.product);
        const qty = parseInt(v.quantity, 10);
        // Example bulk tiers for barbershops/salons - edit to match the real price list.
        const discount = v.type === 'bulk' ? (qty >= 25 ? 0.15 : qty >= 10 ? 0.1 : 0) : 0;
        const subtotal = p.price * qty;
        const goods = subtotal * (1 - discount);
        const total = goods + DELIVERY_FEE;

        box.append(h('table', { class: 'quote' },
          h('tbody', {},
            h('tr', {}, h('th', { scope: 'row' }, 'Product'), h('td', {}, p.name + ' (' + p.variants + ')')),
            h('tr', {}, h('th', { scope: 'row' }, 'Price each'), h('td', {}, money(p.price))),
            h('tr', {}, h('th', { scope: 'row' }, 'Quantity'), h('td', {}, String(qty))),
            discount > 0 ? h('tr', {}, h('th', { scope: 'row' }, 'Bulk discount'), h('td', {}, Math.round(discount * 100) + '% off')) : null,
            h('tr', {}, h('th', { scope: 'row' }, 'Delivery (flat fee)'), h('td', {}, money(DELIVERY_FEE))),
            h('tr', { class: 'quote-total' }, h('th', { scope: 'row' }, 'Estimated total'), h('td', {}, money(total) + ' (incl. delivery)')),
            h('tr', {}, h('th', { scope: 'row' }, 'Availability'), h('td', {}, 'In stock - ships within 1-2 business days'))
          )));
        const area = { durban: 'Durban same-day delivery is available.', kzn: 'Delivery to the rest of KwaZulu-Natal takes about 2-3 business days.', sa: 'Nationwide delivery takes 2-5 business days.' }[v.area] || '';
        box.append(h('p', {}, area + ' Delivery is a flat R80 per order.'));
        if (v.type === 'bulk' && discount === 0) box.append(h('p', {}, 'Order 10 or more of one product to unlock our barbershop and salon bulk discount.'));
      } else if (v.type === 'sponsor') {
        box.append(h('p', {}, 'We love backing wave culture. We will e-mail you our sponsorship pack (what we offer, audience and next steps) within 2 business days.'));
      } else if (v.type === 'volunteer') {
        box.append(h('p', {}, 'Thank you for offering your time. We will contact you within 2 business days about upcoming community wave tutorials and how you can help.'));
      }

      const how = v.contact === 'whatsapp' ? 'on WhatsApp' : 'by e-mail';
      box.append(h('p', {}, 'We will reply ' + how + ' using the details you gave us.'));
      return box;
    }

    enquiryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateForm(enquiryForm)) return;

      const v = values(enquiryForm);
      if (v._honey) return; // hidden spam trap was filled in by a bot
      response.replaceChildren(buildResponse(v));
      response.hidden = false;

      const status = h('p', { class: 'send-status', role: 'status' }, 'Sending your enquiry to our team...');
      response.firstChild.append(status);
      response.firstChild.focus();
      setBusy(enquiryForm, true);

      try {
        await sendAjax(enquiryForm, { _subject: '360WAVING enquiry: ' + v.type + ' - ' + clean(v.name) });
        status.textContent = '✔ Your enquiry was sent to our team.';
        status.classList.add('ok');
        enquiryForm.reset();
        enquiryForm.querySelectorAll('.is-valid').forEach((el) => el.classList.remove('is-valid'));
        enquiryForm.querySelectorAll('[data-touched]').forEach((el) => delete el.dataset.touched);
        syncType();
      } catch (err) {
        status.classList.add('fail');
        status.replaceChildren('We could not send this online right now. Please message us on WhatsApp ',
          h('a', { href: 'https://wa.me/27762481717', target: '_blank', rel: 'noopener noreferrer' }, '+27 76 248 1717'),
          ' or e-mail ', h('a', { href: 'mailto:' + RECIPIENT_EMAIL }, RECIPIENT_EMAIL), '.');
      } finally {
        setBusy(enquiryForm, false);
      }
    });
  }

  /* ------------------------------------------------------------------------
     4. CONTACT FORM  (contact.html)
     ------------------------------------------------------------------------ */
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    attachLiveValidation(contactForm);
    const output = document.getElementById('email-output');

    const TYPE_LABELS = { general: 'General message', order: 'Order or delivery tracking', bulk: 'Bulk order', feedback: 'Feedback', media: 'Media / collaboration' };

    /** Compiles the validated form into an e-mail (recipient is RECIPIENT_EMAIL) */
    function compileEmail(v) {
      const subject = '[360WAVING website] ' + (TYPE_LABELS[v.type] || 'Message') + ': ' + clean(v.subject);
      const body = [
        'Hi 360WAVING team,',
        '',
        v.message.trim(),
        '',
        '--- Contact details ---',
        'Name: ' + clean(v.name),
        'E-mail: ' + v.email.trim(),
        'Phone: ' + v.phone.replace(/\s+/g, ' ').trim(),
        'Message type: ' + (TYPE_LABELS[v.type] || v.type),
        'Preferred reply: ' + (v.reply === 'phone' ? 'Phone / WhatsApp' : 'E-mail')
      ].join('\n');
      return { to: RECIPIENT_EMAIL, subject, body };
    }

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateForm(contactForm)) return;
      const v = values(contactForm);
      if (v._honey) return;

      const mail = compileEmail(v);
      const mailto = 'mailto:' + mail.to + '?subject=' + encodeURIComponent(mail.subject) + '&body=' + encodeURIComponent(mail.body);

      const copyBtn = h('button', { type: 'button', class: 'btn btn-outline' }, 'Copy e-mail text');
      copyBtn.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText('To: ' + mail.to + '\nSubject: ' + mail.subject + '\n\n' + mail.body); window.Waving.toast('E-mail text copied'); }
        catch (err) { window.Waving.toast('Copy is not available - select the text instead'); }
      });
      const status = h('p', { class: 'send-status', role: 'status' }, 'Sending your message to our team...');

      output.replaceChildren(
        h('div', { class: 'response-box', tabindex: '-1' },
          h('h3', {}, 'Your e-mail is ready'),
          status,
          h('dl', { class: 'email-preview' },
            h('dt', {}, 'To'), h('dd', {}, mail.to),
            h('dt', {}, 'Subject'), h('dd', {}, mail.subject),
            h('dt', {}, 'Message'), h('dd', { class: 'email-body' }, mail.body)
          ),
          h('div', { class: 'card-actions' },
            h('a', { class: 'btn', href: mailto }, 'Send with my e-mail app'),
            copyBtn)
        )
      );
      output.hidden = false;
      output.firstChild.focus();
      setBusy(contactForm, true);

      try {
        await sendAjax(contactForm, { _subject: mail.subject });
        status.textContent = '✔ Your message was also sent to our team automatically.';
        status.classList.add('ok');
      } catch (err) {
        status.textContent = 'Automatic sending is unavailable right now - please use "Send with my e-mail app" below.';
        status.classList.add('fail');
      } finally {
        setBusy(contactForm, false);
      }
    });
  }
})();
