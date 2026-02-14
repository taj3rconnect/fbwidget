import {
  consoleErrors, networkFailures, apiResponseTimes, pendingRequests,
  navigationPath, clickTrail, rageClicks, featureUsage, sessionStart,
} from './trackers';

export async function collectEnvInfo() {
  const nav = navigator;
  const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

  const envInfo = {
    userAgent: nav.userAgent,
    platform: nav.platform || '',
    language: nav.language || '',
    languages: (nav.languages || []).join(', '),
    cookiesEnabled: nav.cookieEnabled,
    doNotTrack: nav.doNotTrack,
    online: nav.onLine,
    screenWidth: screen.width,
    screenHeight: screen.height,
    screenAvailWidth: screen.availWidth,
    screenAvailHeight: screen.availHeight,
    screenColorDepth: screen.colorDepth,
    screenPixelDepth: screen.pixelDepth,
    windowInnerWidth: window.innerWidth,
    windowInnerHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio,
    maxTouchPoints: nav.maxTouchPoints || 0,
    hardwareConcurrency: nav.hardwareConcurrency || 'unknown',
    deviceMemory: nav.deviceMemory ? `${nav.deviceMemory} GB` : 'unknown',
    connectionType: conn ? conn.effectiveType || conn.type || 'unknown' : 'unknown',
    connectionDownlink: conn ? `${conn.downlink} Mbps` : 'unknown',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: `UTC${new Date().getTimezoneOffset() > 0 ? '-' : '+'}${Math.abs(new Date().getTimezoneOffset() / 60)}`,
    vendor: nav.vendor || '',
    pdfViewerEnabled: nav.pdfViewerEnabled ?? 'unknown',
    webdriver: nav.webdriver || false,
  };

  // GPU info
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      if (dbg) {
        envInfo.gpuVendor = gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL);
        envInfo.gpuRenderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
      }
    }
  } catch (_) {}

  // Performance timing
  try {
    const navEntry = performance.getEntriesByType('navigation')[0];
    if (navEntry) {
      envInfo.pageLoadTime = `${Math.round(navEntry.loadEventEnd - navEntry.startTime)} ms`;
      envInfo.domContentLoaded = `${Math.round(navEntry.domContentLoadedEventEnd - navEntry.startTime)} ms`;
      envInfo.timeToInteractive = `${Math.round(navEntry.domInteractive - navEntry.startTime)} ms`;
      envInfo.dnsLookup = `${Math.round(navEntry.domainLookupEnd - navEntry.domainLookupStart)} ms`;
      envInfo.tcpConnect = `${Math.round(navEntry.connectEnd - navEntry.connectStart)} ms`;
      envInfo.serverResponse = `${Math.round(navEntry.responseStart - navEntry.requestStart)} ms`;
    }
    const paintEntries = performance.getEntriesByType('paint');
    const fp = paintEntries.find(e => e.name === 'first-paint');
    const fcp = paintEntries.find(e => e.name === 'first-contentful-paint');
    if (fp) envInfo.firstPaint = `${Math.round(fp.startTime)} ms`;
    if (fcp) envInfo.firstContentfulPaint = `${Math.round(fcp.startTime)} ms`;
  } catch (_) {}

  // Console errors
  envInfo.consoleErrors = [...consoleErrors];

  // Network failures
  envInfo.networkFailures = [...networkFailures];

  // Memory usage (Chrome only)
  try {
    if (performance.memory) {
      envInfo.memoryUsed = `${Math.round(performance.memory.usedJSHeapSize / 1048576)} MB`;
      envInfo.memoryTotal = `${Math.round(performance.memory.totalJSHeapSize / 1048576)} MB`;
      envInfo.memoryLimit = `${Math.round(performance.memory.jsHeapSizeLimit / 1048576)} MB`;
    }
  } catch (_) {}

  // Session duration
  envInfo.sessionDuration = `${Math.round((Date.now() - sessionStart) / 1000)} seconds`;

  // Navigation path
  envInfo.navigationPath = [...navigationPath];

  // Click trail
  envInfo.clickTrail = [...clickTrail];

  // Rage clicks
  envInfo.rageClicks = [...rageClicks];

  // Local/session storage size
  try {
    let lsSize = 0, ssSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      lsSize += (key.length + (localStorage.getItem(key) || '').length) * 2;
    }
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      ssSize += (key.length + (sessionStorage.getItem(key) || '').length) * 2;
    }
    envInfo.localStorageSize = `${Math.round(lsSize / 1024)} KB`;
    envInfo.sessionStorageSize = `${Math.round(ssSize / 1024)} KB`;
  } catch (_) {}

  // Service worker status
  try {
    if ('serviceWorker' in nav) {
      const reg = await nav.serviceWorker.getRegistration();
      envInfo.serviceWorker = reg ? {
        active: !!reg.active,
        scope: reg.scope,
        state: reg.active?.state || 'none',
      } : 'not registered';
      const cacheNames = await caches.keys();
      envInfo.cacheNames = cacheNames.length > 0 ? cacheNames : 'none';
    } else {
      envInfo.serviceWorker = 'not supported';
    }
  } catch (_) { envInfo.serviceWorker = 'error checking'; }

  // API response times
  envInfo.apiResponseTimes = [...apiResponseTimes];
  if (apiResponseTimes.length > 0) {
    const avg = apiResponseTimes.reduce((sum, r) => sum + parseInt(r.duration), 0) / apiResponseTimes.length;
    envInfo.avgApiResponseTime = `${Math.round(avg)} ms`;
  }

  // Pending requests
  envInfo.pendingRequests = Array.from(pendingRequests.values());

  // Storage quota
  try {
    if (nav.storage && nav.storage.estimate) {
      const est = await nav.storage.estimate();
      envInfo.storageQuota = `${Math.round((est.quota || 0) / 1048576)} MB`;
      envInfo.storageUsage = `${Math.round((est.usage || 0) / 1048576)} MB`;
    }
  } catch (_) {}

  // Form abandonment detection
  try {
    const forms = document.querySelectorAll('form:not([data-fbwidget])');
    const inputs = document.querySelectorAll('input:not([data-fbwidget] input), textarea:not([data-fbwidget] textarea)');
    const filledInputs = [];
    inputs.forEach((inp) => {
      if (inp.closest('[data-fbwidget]')) return;
      if (inp.value && inp.value.trim() && inp.type !== 'hidden' && inp.type !== 'submit') {
        filledInputs.push({ type: inp.type || 'text', name: inp.name || inp.placeholder || 'unnamed', hasValue: true });
      }
    });
    if (filledInputs.length > 0) {
      envInfo.formAbandonment = { formsOnPage: forms.length, filledInputs };
    }
  } catch (_) {}

  // Feature usage
  if (featureUsage.length > 0) {
    envInfo.featureUsage = [...featureUsage];
  }

  // Browser extensions detection
  try {
    const detected = [];
    if (document.getElementById('adblock-test') === null) {
      const testDiv = document.createElement('div');
      testDiv.id = 'adblock-test';
      testDiv.className = 'ad ads adsbox ad-placement';
      testDiv.style.cssText = 'position:absolute;top:-9999px;left:-9999px;width:1px;height:1px;';
      document.body.appendChild(testDiv);
      setTimeout(() => {
        if (testDiv.offsetHeight === 0 || getComputedStyle(testDiv).display === 'none') {
          detected.push('Ad Blocker');
        }
        testDiv.remove();
      }, 100);
    }
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) detected.push('React DevTools');
    if (window.__VUE_DEVTOOLS_GLOBAL_HOOK__) detected.push('Vue DevTools');
    if (document.querySelector('[data-grammarly-shadow-root]')) detected.push('Grammarly');
    if (document.querySelector('#lastpass-notification-container')) detected.push('LastPass');
    if (document.querySelector('[data-1password-extension]')) detected.push('1Password');
    envInfo.extensionsDetected = detected.length > 0 ? detected : 'none detected';
  } catch (_) {}

  return envInfo;
}
