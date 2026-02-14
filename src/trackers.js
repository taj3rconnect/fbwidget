// Background trackers — module-level singletons that persist across React renders

export const consoleErrors = [];
export const networkFailures = [];
export const apiResponseTimes = [];
export const pendingRequests = new Map();
export const navigationPath = [{ url: window.location.href, timestamp: new Date().toISOString() }];
export const clickTrail = [];
export const rageClicks = [];
export const featureUsage = [];
export const stateChanges = [];
export const resourceFailures = [];
export const sessionStart = Date.now();
export let maxScrollDepth = { percent: 0, pixels: 0, pageHeight: 0 };
export let idleTime = { totalMs: 0, idleCount: 0 };
export let visibility = { hiddenCount: 0, totalHiddenMs: 0 };

let _initialized = false;

export function getSelector(el) {
  if (!el || el === document.body) return 'body';
  const parts = [];
  let current = el;
  for (let i = 0; i < 3 && current && current !== document.body; i++) {
    let s = current.tagName?.toLowerCase() || '';
    if (current.id) s += `#${current.id}`;
    else if (current.className && typeof current.className === 'string') {
      const cls = current.className.trim().split(/\s+/).slice(0, 2).join('.');
      if (cls) s += `.${cls}`;
    }
    parts.unshift(s);
    current = current.parentElement;
  }
  return parts.join(' > ');
}

export function initTrackers() {
  if (_initialized) return;
  _initialized = true;

  // Console error/warn capture
  const origError = console.error;
  const origWarn = console.warn;
  console.error = (...args) => {
    consoleErrors.push({ level: 'error', message: args.map(String).join(' ').slice(0, 200), timestamp: new Date().toISOString() });
    if (consoleErrors.length > 10) consoleErrors.shift();
    origError.apply(console, args);
  };
  console.warn = (...args) => {
    consoleErrors.push({ level: 'warn', message: args.map(String).join(' ').slice(0, 200), timestamp: new Date().toISOString() });
    if (consoleErrors.length > 10) consoleErrors.shift();
    origWarn.apply(console, args);
  };

  // Fetch interceptor — tracks network failures, response times, pending requests
  const origFetch = window.fetch;
  window.fetch = async (...args) => {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
    const method = args[1]?.method || 'GET';
    const reqId = Math.random().toString(36).slice(2);
    const start = performance.now();
    pendingRequests.set(reqId, { url: url.slice(0, 100), method, startTime: new Date().toISOString() });
    try {
      const res = await origFetch.apply(window, args);
      const duration = Math.round(performance.now() - start);
      pendingRequests.delete(reqId);
      apiResponseTimes.push({ url: url.slice(0, 100), method, status: res.status, duration: `${duration} ms` });
      if (apiResponseTimes.length > 20) apiResponseTimes.shift();
      if (res.status >= 400) {
        networkFailures.push({ url: url.slice(0, 100), status: res.status, method, timestamp: new Date().toISOString() });
        if (networkFailures.length > 10) networkFailures.shift();
      }
      return res;
    } catch (err) {
      pendingRequests.delete(reqId);
      networkFailures.push({ url: url.slice(0, 100), status: 'NETWORK_ERROR', method, timestamp: new Date().toISOString() });
      if (networkFailures.length > 10) networkFailures.shift();
      throw err;
    }
  };

  // Navigation path tracking (pushState / replaceState / popstate)
  const origPushState = history.pushState;
  const origReplaceState = history.replaceState;
  const trackNav = () => {
    navigationPath.push({ url: window.location.href, timestamp: new Date().toISOString() });
    if (navigationPath.length > 10) navigationPath.shift();
  };
  history.pushState = function (...args) { origPushState.apply(this, args); trackNav(); };
  history.replaceState = function (...args) { origReplaceState.apply(this, args); trackNav(); };
  window.addEventListener('popstate', trackNav);

  // Click trail + rage click detection (3+ clicks same element within 1s)
  let lastTarget = '';
  let lastTime = 0;
  let rapidCount = 0;
  document.addEventListener('click', (e) => {
    const selector = getSelector(e.target);
    const text = (e.target.textContent || '').trim().slice(0, 50);
    clickTrail.push({ element: selector, text, timestamp: new Date().toISOString() });
    if (clickTrail.length > 10) clickTrail.shift();

    const now = Date.now();
    if (selector === lastTarget && now - lastTime < 1000) {
      rapidCount++;
      if (rapidCount >= 3) {
        rageClicks.push({ element: selector, clicks: rapidCount, timestamp: new Date().toISOString() });
        if (rageClicks.length > 5) rageClicks.shift();
        rapidCount = 0;
      }
    } else {
      rapidCount = 1;
    }
    lastTarget = selector;
    lastTime = now;
  }, true);

  // Feature usage tracker — apps call window.__fbwidget_trackFeature(name)
  window.__fbwidget_trackFeature = (name) => {
    featureUsage.push({ feature: name, timestamp: new Date().toISOString() });
    if (featureUsage.length > 20) featureUsage.shift();
  };

  // State change tracker — apps call window.__fbwidget_trackState(label, snapshot)
  window.__fbwidget_trackState = (label, snapshot) => {
    let data;
    try { data = typeof snapshot === 'string' ? snapshot.slice(0, 500) : JSON.stringify(snapshot).slice(0, 500); }
    catch (_) { data = String(snapshot).slice(0, 500); }
    stateChanges.push({ label, data, timestamp: new Date().toISOString() });
    if (stateChanges.length > 5) stateChanges.shift();
  };

  // Scroll depth tracking (throttled)
  let _scrollTick = false;
  window.addEventListener('scroll', () => {
    if (_scrollTick) return;
    _scrollTick = true;
    requestAnimationFrame(() => {
      const scrollY = window.scrollY || window.pageYOffset;
      const pageH = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) - window.innerHeight;
      const pct = pageH > 0 ? Math.round((scrollY / pageH) * 100) : 0;
      if (pct > maxScrollDepth.percent) {
        maxScrollDepth.percent = pct;
        maxScrollDepth.pixels = Math.round(scrollY);
        maxScrollDepth.pageHeight = Math.round(pageH + window.innerHeight);
      }
      _scrollTick = false;
    });
  }, { passive: true });

  // Idle time detection (inactive >30s = idle)
  let _lastActivity = Date.now();
  let _idleStart = null;
  const IDLE_THRESHOLD = 30000;
  const resetActivity = () => {
    const now = Date.now();
    if (_idleStart) {
      idleTime.totalMs += now - _idleStart;
      _idleStart = null;
    }
    _lastActivity = now;
  };
  ['mousemove', 'keypress', 'scroll', 'click', 'touchstart'].forEach(evt =>
    window.addEventListener(evt, resetActivity, { passive: true })
  );
  setInterval(() => {
    if (Date.now() - _lastActivity >= IDLE_THRESHOLD && !_idleStart) {
      _idleStart = Date.now();
      idleTime.idleCount++;
    }
  }, 5000);

  // Page visibility tracking
  let _hiddenAt = null;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      _hiddenAt = Date.now();
      visibility.hiddenCount++;
    } else if (_hiddenAt) {
      visibility.totalHiddenMs += Date.now() - _hiddenAt;
      _hiddenAt = null;
    }
  });

  // Resource loading failures (images, scripts, stylesheets)
  window.addEventListener('error', (e) => {
    const el = e.target;
    if (el && (el.tagName === 'IMG' || el.tagName === 'SCRIPT' || el.tagName === 'LINK')) {
      resourceFailures.push({
        tagName: el.tagName.toLowerCase(),
        src: (el.src || el.href || '').slice(0, 150),
        timestamp: new Date().toISOString(),
      });
      if (resourceFailures.length > 10) resourceFailures.shift();
    }
  }, true);
}
