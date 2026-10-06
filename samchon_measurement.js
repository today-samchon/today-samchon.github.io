/* Same-origin, opt-in telemetry. No redirect, external pixels, visitor IDs or affiliate fetches. */
(function () {
  const script = document.currentScript;
  if (!script || script.dataset.enabled !== 'true') return;
  const endpoint = '/events';
  const code = script.dataset.code || '';
  const params = new URLSearchParams(location.search);
  const channel = ['youtube', 'instagram', 'threads'].includes(params.get('channel')) ? params.get('channel') : 'unknown';
  const entry = params.get('entry') === 'code' ? 'code' : (channel === 'unknown' ? 'unknown' : 'tagged');
  function send(kind, provider) {
    try {
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      const event_id = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
      const body = JSON.stringify({event_id, kind, code: kind === 'page_view' ? '' : code, provider: provider || '', channel, entry});
      if (navigator.sendBeacon) {
        navigator.sendBeacon(endpoint, new Blob([body], {type: 'application/json'}));
      } else if (typeof fetch === 'function') {
        fetch(endpoint, {method: 'POST', headers: {'Content-Type': 'application/json'}, body, keepalive: true, credentials: 'omit'}).catch(() => {});
      }
    } catch (_) {} // Telemetry failures never affect navigation.
  }
  send(code ? 'product_view' : 'page_view');
  document.addEventListener('click', e => {
    const a = e.target.closest('a.buy');
    if (!a || !a.hasAttribute('href') || e.defaultPrevented) return;
    const expires = Date.parse(a.dataset.expires), checked = Date.parse(a.dataset.checked), stock = Date.parse(a.dataset.stock);
    if (![expires, checked, stock].every(Number.isFinite) || Date.now() >= expires || Date.now() < checked || Date.now() < stock || Date.now() - checked > 86400000 || Date.now() - stock > 86400000) return;
    send('outbound', a.dataset.provider);
  });
})();
