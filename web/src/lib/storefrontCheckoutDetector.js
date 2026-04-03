function getStorefrontCheckoutDetectorScript() {
  return `
      function readScriptQueryParam(key) {
        try {
          var scriptSrc = (s && s.src) || '';
          if (!scriptSrc) return '';
          var parsed = new URL(scriptSrc, location.origin);
          return String(parsed.searchParams.get(key) || '').trim();
        } catch (e) {
          return '';
        }
      }
      function normalizeBaseUrl(value, fallback) {
        var chosen = String(value || fallback || '').trim();
        if (!chosen) return '';
        return chosen.replace(/\\/+$/, '');
      }
      var SIGNAL_BASE = (s && s.getAttribute('data-signal-base')) || (location.origin || '');
      var EVENT_BASE = normalizeBaseUrl((s && s.getAttribute('data-event-base')) || readScriptQueryParam('event_base'), 'https://cart-agent-api.onrender.com');
      var SHOP_DOMAIN = (s && s.getAttribute('data-shop-domain')) || readScriptQueryParam('shop') || location.hostname || '';
      var VALIDATION_MODE = (s && s.getAttribute('data-validation-mode')) || '';
      var checkoutStartSent = false;
      var lastRiskReason = '';
      var idleTimer = null;
      var cartToken = null;
      var interceptShown = false;
      var interceptSessionKey = 'abando_intercept_seen_v1';
      var interceptNode = null;
      var interceptDebugBadge = null;
      var lastSignalEvent = 'pending';
      var latestDecisionPayload = null;
      var sessionMarkerKey = 'abando_session_marker_v1';
      var storefrontProofKey = 'abando_storefront_proof_v1';
      var eventDedupeKey = 'abando_storefront_event_dedupe_v1';
      try {
        var pathParts = String(location.pathname || '').split('/');
        var checkoutIndex = pathParts.indexOf('checkouts');
        if (checkoutIndex >= 0 && pathParts[checkoutIndex + 1]) {
          cartToken = pathParts[checkoutIndex + 1];
        }
      } catch (e) {}
      function isValidationMode() {
        return VALIDATION_MODE === 'local';
      }
      function isProofMode() {
        try {
          var params = new URLSearchParams(location.search || '');
          return params.get('abando_proof') === '1' || readScriptQueryParam('proof') === '1';
        } catch (e) {
          return readScriptQueryParam('proof') === '1';
        }
      }
      function readValidationParams() {
        try {
          return new URLSearchParams(location.search || '');
        } catch (e) {
          return null;
        }
      }
      function readValidationIdleMs() {
        if (!isValidationMode()) return 45000;
        var params = readValidationParams();
        if (!params) return 45000;
        var raw = Number(params.get('abando_idle_ms') || 0);
        if (!raw || raw < 250) return 45000;
        return raw;
      }
      function getSessionMarker() {
        try {
          if (!window.sessionStorage) return 'session-' + Math.random().toString(36).slice(2, 10);
          var existing = sessionStorage.getItem(sessionMarkerKey);
          if (existing) return existing;
          var created = 'session-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
          sessionStorage.setItem(sessionMarkerKey, created);
          return created;
        } catch (e) {
          return 'session-' + Math.random().toString(36).slice(2, 10);
        }
      }
      function detectDeviceType() {
        try {
          var ua = String((navigator && navigator.userAgent) || '').toLowerCase();
          if (/ipad|tablet/.test(ua)) return 'tablet';
          if (/mobi|iphone|android/.test(ua)) return 'mobile';
          if (ua) return 'desktop';
        } catch (e) {}
        return 'unknown';
      }
      function updateStorefrontProof(patch) {
        var next = patch || {};
        try {
          if (window.sessionStorage) {
            var current = sessionStorage.getItem(storefrontProofKey);
            var parsed = current ? JSON.parse(current) : {};
            var merged = {};
            for (var key in parsed) merged[key] = parsed[key];
            for (var nextKey in next) merged[nextKey] = next[nextKey];
            sessionStorage.setItem(storefrontProofKey, JSON.stringify(merged));
          }
        } catch (e) {}
        try {
          if (document.body) {
            if (next.scriptLoaded) setBodyMarker('abando-proof-script', String(next.scriptLoaded));
            if (next.shop) setBodyMarker('abando-proof-shop', String(next.shop));
            if (next.eventBase) setBodyMarker('abando-proof-event-base', String(next.eventBase));
            if (next.lastAttemptedEvent) setBodyMarker('abando-proof-last-event', String(next.lastAttemptedEvent));
            if (next.lastPostStatus) setBodyMarker('abando-proof-post-status', String(next.lastPostStatus));
            if (next.lastPostTimestamp) setBodyMarker('abando-proof-post-ts', String(next.lastPostTimestamp));
          }
        } catch (e) {}
      }
      function logProof(label, detail) {
        if (!isValidationMode() && !isProofMode()) return;
        try {
          console.info('[abando-storefront-proof]', label, detail || '');
        } catch (e) {}
      }
      function shouldSendEventNow(eventType, stage, extra) {
        var key = [getSessionMarker(), eventType, stage, String((extra && extra.reason) || ''), String(location.pathname || '/')].join('|');
        try {
          var now = Date.now();
          var raw = window.sessionStorage ? sessionStorage.getItem(eventDedupeKey) : '';
          var parsed = raw ? JSON.parse(raw) : {};
          var previous = Number(parsed[key] || 0);
          if (previous && now - previous < 15000) {
            updateStorefrontProof({
              lastAttemptedEvent: eventType,
              lastPostStatus: 'deduped',
              lastPostTimestamp: new Date().toISOString()
            });
            logProof('event_deduped', key);
            return false;
          }
          parsed[key] = now;
          var cutoff = now - 5 * 60 * 1000;
          for (var dedupeKey in parsed) {
            if (Number(parsed[dedupeKey] || 0) < cutoff) {
              delete parsed[dedupeKey];
            }
          }
          if (window.sessionStorage) {
            sessionStorage.setItem(eventDedupeKey, JSON.stringify(parsed));
          }
        } catch (e) {}
        return true;
      }
      function buildNormalizedCheckoutEvent(eventType, stage, extra) {
        extra = extra || {};
        return {
          shop: SHOP_DOMAIN || null,
          session_id: getSessionMarker(),
          timestamp: new Date().toISOString(),
          event_type: eventType,
          stage: stage,
          device_type: detectDeviceType(),
          order_id: extra.orderId || null,
          amount: typeof extra.amount === 'number' ? extra.amount : null,
          source: 'live_storefront',
          metadata: {
            path: location.pathname || '/',
            reason: extra.reason || null,
            cartToken: cartToken || null,
            storefrontHost: location.hostname || null,
            signalBase: SIGNAL_BASE || null,
            validationMode: isValidationMode(),
            emittedBy: 'abando.js'
          }
        };
      }
      function sendNormalizedCheckoutEvent(eventType, stage, extra) {
        if (!SHOP_DOMAIN || !EVENT_BASE) {
          updateStorefrontProof({
            lastAttemptedEvent: eventType,
            lastPostStatus: 'missing_context',
            lastPostTimestamp: new Date().toISOString()
          });
          logProof('event_context_missing', eventType);
          return false;
        }
        if (!shouldSendEventNow(eventType, stage, extra)) return false;
        try {
          var payload = JSON.stringify(buildNormalizedCheckoutEvent(eventType, stage, extra));
          var url = EVENT_BASE + '/api/checkout-events';
          updateStorefrontProof({
            lastAttemptedEvent: eventType,
            lastPostStatus: 'attempted',
            lastPostTimestamp: new Date().toISOString()
          });
          logProof('event_post_attempted', payload);
          if (navigator.sendBeacon && !isValidationMode() && !isProofMode()) {
            var blob = new Blob([payload], { type: 'application/json' });
            navigator.sendBeacon(url, blob);
            updateStorefrontProof({
              lastAttemptedEvent: eventType,
              lastPostStatus: 'queued',
              lastPostTimestamp: new Date().toISOString()
            });
            return true;
          }
          fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: { 'content-type': 'application/json' },
            keepalive: true,
            body: payload
          }).then(function(response) {
            updateStorefrontProof({
              lastAttemptedEvent: eventType,
              lastPostStatus: response.ok ? 'succeeded' : 'failed',
              lastPostTimestamp: new Date().toISOString()
            });
            logProof(response.ok ? 'event_post_succeeded' : 'event_post_failed', response.status);
            return response;
          }).catch(function(error){
            updateStorefrontProof({
              lastAttemptedEvent: eventType,
              lastPostStatus: 'failed',
              lastPostTimestamp: new Date().toISOString()
            });
            logProof('event_post_failed', error && error.message ? error.message : 'fetch_error');
          });
          return true;
        } catch (e) {
          updateStorefrontProof({
            lastAttemptedEvent: eventType,
            lastPostStatus: 'failed',
            lastPostTimestamp: new Date().toISOString()
          });
          logProof('event_post_failed', e && e.message ? e.message : 'exception');
          return false;
        }
      }
      function readValidationCartValueCents() {
        if (!isValidationMode()) return 0;
        var params = readValidationParams();
        if (!params) return 0;
        var raw = Number(params.get('cart_value_cents') || 0);
        return raw > 0 ? raw : 0;
      }
      function setBodyMarker(key, value) {
        try {
          if (!document.body) return;
          document.body.setAttribute('data-' + key, value);
        } catch (e) {}
      }
      function clearBodyMarker(key) {
        try {
          if (!document.body) return;
          document.body.removeAttribute('data-' + key);
        } catch (e) {}
      }
      function ensureDebugBadge() {
        if (!isValidationMode()) return null;
        if (interceptDebugBadge) return interceptDebugBadge;
        var badge = document.createElement('div');
        badge.setAttribute('data-abando-intercept-debug', 'ready');
        badge.style.position = 'fixed';
        badge.style.top = '14px';
        badge.style.left = '14px';
        badge.style.zIndex = '2147483647';
        badge.style.background = 'rgba(15,23,42,.92)';
        badge.style.color = '#e2e8f0';
        badge.style.border = '1px solid rgba(56,189,248,.28)';
        badge.style.borderRadius = '14px';
        badge.style.padding = '10px 12px';
        badge.style.fontFamily = 'system-ui,-apple-system,Segoe UI,Roboto,sans-serif';
        badge.style.fontSize = '12px';
        badge.style.lineHeight = '1.45';
        badge.style.boxShadow = '0 18px 48px rgba(2,6,23,.28)';
        badge.style.maxWidth = '320px';

        var label = document.createElement('div');
        label.textContent = 'Abando local intercept validation';
        label.style.fontWeight = '800';
        label.style.marginBottom = '6px';

        var state = document.createElement('div');
        state.setAttribute('data-abando-intercept-debug-state', 'pending');
        state.textContent = 'State: pending';
        state.style.color = '#cbd5e1';

        var signalState = document.createElement('div');
        signalState.setAttribute('data-abando-signal-debug-state', 'pending');
        signalState.textContent = 'Signals: pending';
        signalState.style.color = '#94a3b8';
        signalState.style.marginTop = '4px';

        var buttonRow = document.createElement('div');
        buttonRow.style.display = 'flex';
        buttonRow.style.gap = '8px';
        buttonRow.style.marginTop = '8px';

        var resetButton = document.createElement('button');
        resetButton.type = 'button';
        resetButton.textContent = 'Reset intercept';
        resetButton.style.border = '1px solid rgba(148,163,184,.3)';
        resetButton.style.background = 'transparent';
        resetButton.style.color = '#e2e8f0';
        resetButton.style.borderRadius = '10px';
        resetButton.style.padding = '6px 10px';
        resetButton.style.cursor = 'pointer';
        resetButton.addEventListener('click', function() {
          resetValidationSession();
          updateDebugBadge('reset', 'Session suppression cleared');
        });

        buttonRow.appendChild(resetButton);
        badge.appendChild(label);
        badge.appendChild(state);
        badge.appendChild(signalState);
        badge.appendChild(buttonRow);
        interceptDebugBadge = badge;
        return interceptDebugBadge;
      }
      function updateDebugBadge(state, detail) {
        if (!isValidationMode()) return;
        var badge = ensureDebugBadge();
        if (!badge) return;
        if (!badge.parentNode && document.body) {
          document.body.appendChild(badge);
        }
        badge.setAttribute('data-abando-intercept-debug', state || 'pending');
        var stateNode = badge.querySelector('[data-abando-intercept-debug-state]');
        if (stateNode) {
          stateNode.textContent = 'State: ' + String(state || 'pending') + (detail ? ' · ' + detail : '');
        }
        var signalNode = badge.querySelector('[data-abando-signal-debug-state]');
        if (signalNode) {
          signalNode.textContent = 'Signals: ' + String(lastSignalEvent || 'pending');
        }
        try {
          console.info('[abando-storefront]', state || 'pending', detail || '');
        } catch (e) {}
      }
      function recordSignalDebug(label, detail) {
        lastSignalEvent = label + (detail ? ':' + detail : '');
        setBodyMarker('abando-signal-state', label);
        if (detail) {
          setBodyMarker('abando-signal-detail', detail);
        }
        var badge = ensureDebugBadge();
        if (badge && !badge.parentNode && document.body) {
          document.body.appendChild(badge);
        }
        if (badge) {
          var signalNode = badge.querySelector('[data-abando-signal-debug-state]');
          if (signalNode) {
            signalNode.textContent = 'Signals: ' + lastSignalEvent;
          }
        }
        try {
          console.info('[abando-signal]', label, detail || '');
        } catch (e) {}
      }
      function resetValidationSession() {
        interceptShown = false;
        lastRiskReason = '';
        try {
          if (window.sessionStorage) {
            sessionStorage.removeItem(interceptSessionKey);
          }
        } catch (e) {}
        if (interceptNode) {
          interceptNode.style.display = 'none';
          interceptNode.setAttribute('data-abando-intercept', 'hidden');
        }
        clearBodyMarker('abando-intercept-state');
        clearBodyMarker('abando-intercept-action');
        clearBodyMarker('abando-intercept-decision');
        clearBodyMarker('abando-checkout-start-event-id');
        clearBodyMarker('abando-checkout-risk-event-id');
        clearBodyMarker('abando-decision-id');
        clearBodyMarker('abando-checkout-risk-decision');
        clearBodyMarker('abando-checkout-risk-reason');
        latestDecisionPayload = null;
      }
      function readForcedDecision() {
        if (!isValidationMode()) return null;
        var params = readValidationParams();
        if (!params) return null;
        var forced = String(params.get('abando_intercept') || '').trim().toLowerCase();
        if (!forced) return null;
        if (forced !== 'show_intercept' && forced !== 'log_only' && forced !== 'no_action') {
          return null;
        }
        return {
          decision: forced,
          ruleId: 'DEV_VALIDATION',
          reason: 'validation_override_' + forced
        };
      }
      function isCheckoutLikePath() {
        try {
          var p = String(location.pathname || '').toLowerCase();
          return p.indexOf('/checkouts/') >= 0 || p === '/checkout' || p.indexOf('/checkout/') >= 0;
        } catch (e) {
          return false;
        }
      }
      function signalPayload(reason) {
        return {
          shopDomain: SHOP_DOMAIN || null,
          cartToken: cartToken || null,
          path: location.pathname || '/',
          ts: new Date().toISOString(),
          reason: reason || null,
          sessionMarker: getSessionMarker(),
          validationMode: isValidationMode()
        };
      }
      function updateDecisionOutcome(decisionPayload, outcome) {
        if (!decisionPayload || !decisionPayload.decisionId) return;
        try {
          fetch(SIGNAL_BASE + '/signal/decision-outcome', {
            method: 'POST',
            mode: 'cors',
            headers: { 'content-type': 'application/json' },
            keepalive: true,
            body: JSON.stringify({
              decisionId: decisionPayload.decisionId,
              outcome: outcome,
              outcomeTimestamp: new Date().toISOString(),
              sessionMarker: getSessionMarker()
            })
          }).catch(function(){});
        } catch (e) {}
      }
      function logManualOverrideDecision(decisionPayload) {
        try {
          return fetch(SIGNAL_BASE + '/signal/decision-log', {
            method: 'POST',
            mode: 'cors',
            headers: { 'content-type': 'application/json' },
            keepalive: true,
            body: JSON.stringify({
              shopDomain: SHOP_DOMAIN || null,
              cartToken: cartToken || null,
              trigger: 'manual_override',
              decision: decisionPayload.decision,
              decisionReason: decisionPayload.reason,
              interventionType: decisionPayload.decision === 'show_intercept' ? 'checkout_exit_intercept' : 'none',
              decisionTimestamp: new Date().toISOString(),
              cartValueCents: readValidationCartValueCents(),
              sessionMarker: getSessionMarker(),
              validationMode: isValidationMode()
            })
          }).then(function(response) {
            return response.json().catch(function(){ return {}; });
          }).then(function(body) {
            if (body && body.decisionId) {
              decisionPayload.decisionId = body.decisionId;
              latestDecisionPayload = decisionPayload;
              setBodyMarker('abando-decision-id', body.decisionId);
            }
            return body;
          }).catch(function(){ return null; });
        } catch (e) {
          return Promise.resolve(null);
        }
      }
      function canShowIntercept() {
        try {
          if (interceptShown) return false;
          if (!window.sessionStorage) return true;
          return !sessionStorage.getItem(interceptSessionKey);
        } catch (e) {
          return !interceptShown;
        }
      }
      function markInterceptSeen(action) {
        interceptShown = true;
        try {
          if (window.sessionStorage) {
            sessionStorage.setItem(interceptSessionKey, action || 'seen');
          }
        } catch (e) {}
        setBodyMarker('abando-intercept-action', action || 'seen');
      }
      function trackIntercept(eventName, extra) {
        try {
          fetch(SIGNAL_BASE + '/abando-ping', {
            method: 'POST',
            mode: 'cors',
            headers: { 'content-type': 'application/json' },
            keepalive: true,
            body: JSON.stringify({
              event: eventName,
              shopDomain: SHOP_DOMAIN || null,
              cartToken: cartToken || null,
              path: location.pathname || '/',
              ts: Date.now(),
              extra: extra || null
            })
          }).catch(function(){});
        } catch (e) {}
      }
      function closeIntercept(action) {
        if (!interceptNode) return;
        interceptNode.style.display = 'none';
        interceptNode.setAttribute('data-abando-intercept', 'hidden');
        setBodyMarker('abando-intercept-state', 'hidden');
        markInterceptSeen(action || 'closed');
        updateDecisionOutcome(latestDecisionPayload, action || 'unknown');
        updateDebugBadge(action || 'closed', 'Intercept hidden');
      }
      function ensureIntercept() {
        if (interceptNode) return interceptNode;
        var wrap = document.createElement('div');
        wrap.setAttribute('data-abando-intercept', 'hidden');
        wrap.style.position = 'fixed';
        wrap.style.left = '0';
        wrap.style.right = '0';
        wrap.style.bottom = '20px';
        wrap.style.zIndex = '2147483647';
        wrap.style.display = 'none';
        wrap.style.pointerEvents = 'none';

        var card = document.createElement('div');
        card.setAttribute('data-abando-intercept-card', 'true');
        card.style.width = 'min(460px, calc(100vw - 24px))';
        card.style.margin = '0 auto';
        card.style.background = 'linear-gradient(180deg, rgba(2,6,23,.96), rgba(15,23,42,.98))';
        card.style.border = '1px solid rgba(56,189,248,.25)';
        card.style.borderRadius = '18px';
        card.style.padding = '18px';
        card.style.boxShadow = '0 24px 70px rgba(2,6,23,.45)';
        card.style.color = '#e2e8f0';
        card.style.fontFamily = 'system-ui,-apple-system,Segoe UI,Roboto,sans-serif';
        card.style.pointerEvents = 'auto';

        var headline = document.createElement('div');
        headline.textContent = 'Wait — before you go';
        headline.style.fontSize = '22px';
        headline.style.fontWeight = '800';
        headline.style.letterSpacing = '-0.02em';

        var body = document.createElement('div');
        body.textContent = 'Complete checkout now and save your order.';
        body.style.marginTop = '8px';
        body.style.fontSize = '15px';
        body.style.lineHeight = '1.5';
        body.style.color = '#cbd5e1';

        var actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '10px';
        actions.style.marginTop = '16px';

        var primary = document.createElement('button');
        primary.type = 'button';
        primary.textContent = 'Continue checkout';
        primary.setAttribute('data-abando-intercept-action', 'continue');
        primary.style.flex = '1';
        primary.style.minHeight = '44px';
        primary.style.border = '0';
        primary.style.borderRadius = '12px';
        primary.style.background = '#38bdf8';
        primary.style.color = '#082f49';
        primary.style.fontWeight = '800';
        primary.style.cursor = 'pointer';

        var secondary = document.createElement('button');
        secondary.type = 'button';
        secondary.textContent = 'Dismiss';
        secondary.setAttribute('data-abando-intercept-action', 'dismiss');
        secondary.style.flex = '1';
        secondary.style.minHeight = '44px';
        secondary.style.border = '1px solid #334155';
        secondary.style.borderRadius = '12px';
        secondary.style.background = 'transparent';
        secondary.style.color = '#e2e8f0';
        secondary.style.fontWeight = '700';
        secondary.style.cursor = 'pointer';

        primary.addEventListener('click', function() {
          trackIntercept('intercept_continued', { decision: 'show_intercept' });
          closeIntercept('continued');
          setBodyMarker('abando-intercept-action', 'continued');
          try { window.focus(); } catch (e) {}
        });

        secondary.addEventListener('click', function() {
          trackIntercept('intercept_dismissed', { decision: 'show_intercept' });
          closeIntercept('dismissed');
          setBodyMarker('abando-intercept-action', 'dismissed');
        });

        actions.appendChild(primary);
        actions.appendChild(secondary);
        card.appendChild(headline);
        card.appendChild(body);
        card.appendChild(actions);
        wrap.appendChild(card);
        interceptNode = wrap;
        return interceptNode;
      }
      function showIntercept(decisionPayload) {
        if (!canShowIntercept() || !isCheckoutLikePath()) {
          updateDecisionOutcome(decisionPayload, 'not_shown');
          return;
        }
        latestDecisionPayload = decisionPayload || null;
        markInterceptSeen('shown');
        var node = ensureIntercept();
        if (!node.parentNode) {
          document.body.appendChild(node);
        }
        node.style.display = 'block';
        node.setAttribute('data-abando-intercept', 'visible');
        setBodyMarker('abando-intercept-state', 'visible');
        setBodyMarker('abando-intercept-decision', (decisionPayload && decisionPayload.decision) || 'show_intercept');
        if (decisionPayload && decisionPayload.decisionId) {
          setBodyMarker('abando-decision-id', decisionPayload.decisionId);
        }
        updateDecisionOutcome(decisionPayload, 'shown');
        updateDebugBadge('shown', (decisionPayload && decisionPayload.reason) || 'show_intercept');
        trackIntercept('intercept_shown', {
          decision: decisionPayload && decisionPayload.decision,
          reason: decisionPayload && decisionPayload.reason
        });
      }
      function sendSignal(url, payload, opts) {
        opts = opts || {};
        var signalLabel = url.indexOf('/signal/checkout-start') >= 0 ? 'checkout-start' : url.indexOf('/signal/checkout-risk') >= 0 ? 'checkout-risk' : 'signal';
        try {
          var body = JSON.stringify(payload);
          if (!opts.expectResponse && navigator.sendBeacon) {
            recordSignalDebug(signalLabel, payload.reason || 'beacon');
            return navigator.sendBeacon(url, body);
          }
          var request = fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: { 'content-type': 'application/json' },
            keepalive: true,
            body: body
          });
          if (!opts.expectResponse) {
            recordSignalDebug(signalLabel, payload.reason || 'fire-and-forget');
            request.catch(function(){});
            return true;
          }
          return request.then(function(response) {
            recordSignalDebug(signalLabel, payload.reason || 'response');
            return response.json().catch(function(){ return {}; });
          }).catch(function(){
            return null;
          });
        } catch (e) {
          return opts.expectResponse ? Promise.resolve(null) : false;
        }
      }
      function sendCheckoutStart() {
        if (checkoutStartSent || !isCheckoutLikePath()) return;
        checkoutStartSent = true;
        sendNormalizedCheckoutEvent('checkout_started', 'checkout');
        var response = sendSignal(SIGNAL_BASE + '/signal/checkout-start', signalPayload(null), {
          expectResponse: isValidationMode()
        });
        setBodyMarker('abando-checkout-start', 'sent');
        if (isValidationMode() && response && typeof response.then === 'function') {
          response.then(function(body) {
            if (body && body.eventId) {
              setBodyMarker('abando-checkout-start-event-id', body.eventId);
            }
          }).catch(function(){});
        }
      }
      function sendCheckoutRisk(reason, opts) {
        opts = opts || {};
        if (!checkoutStartSent || !isCheckoutLikePath()) return;
        if (lastRiskReason === reason) return;
        lastRiskReason = reason;
        sendNormalizedCheckoutEvent('checkout_abandon', 'checkout', { reason: reason });
        var response = sendSignal(SIGNAL_BASE + '/signal/checkout-risk', signalPayload(reason), {
          expectResponse: !!opts.expectResponse
        });
        if (opts.expectResponse && response && typeof response.then === 'function') {
          response.then(function(body) {
            if (body && body.eventId) {
              setBodyMarker('abando-checkout-risk-event-id', body.eventId);
            }
            if (body && body.decisionId) {
              setBodyMarker('abando-decision-id', body.decisionId);
            }
            if (body && body.decision) {
              setBodyMarker('abando-checkout-risk-decision', body.decision);
            }
            if (body && body.reason) {
              setBodyMarker('abando-checkout-risk-reason', body.reason);
            }
            if (body) {
              latestDecisionPayload = body;
            }
            if (body && body.decision === 'show_intercept') {
              showIntercept(body);
            } else if (body && body.decisionId) {
              updateDecisionOutcome(body, 'not_shown');
            }
          }).catch(function(){});
        }
      }
      function armIdleRisk() {
        if (idleTimer) window.clearTimeout(idleTimer);
        var idleMs = readValidationIdleMs();
        idleTimer = window.setTimeout(function() {
          sendCheckoutRisk('idle_45s', { expectResponse: true });
        }, idleMs);
      }
      try {
        setBodyMarker('abando-artifact', 'loaded');
        updateStorefrontProof({
          scriptLoaded: 'loaded',
          shop: SHOP_DOMAIN || 'missing',
          eventBase: EVENT_BASE || 'missing',
          lastPostStatus: 'idle'
        });
        logProof('runtime_loaded', JSON.stringify({ shop: SHOP_DOMAIN || null, eventBase: EVENT_BASE || null }));
        try { console.info('[abando-storefront] artifact_loaded', location.pathname || '/'); } catch (e) {}
        if (isValidationMode()) {
          if (document.body) {
            ensureDebugBadge();
          } else {
            document.addEventListener('DOMContentLoaded', function() {
              ensureDebugBadge();
            });
          }
          var params = readValidationParams();
          if (params && params.get('abando_reset_intercept') === '1') {
            resetValidationSession();
            updateDebugBadge('reset', 'Session suppression cleared from query');
          }
        }
        if (isCheckoutLikePath()) {
          sendCheckoutStart();
          var forcedDecision = readForcedDecision();
          if (forcedDecision) {
            updateDebugBadge(forcedDecision.decision, forcedDecision.reason);
            logManualOverrideDecision(forcedDecision).then(function() {
              if (forcedDecision.decision === 'show_intercept') {
                window.setTimeout(function() {
                  showIntercept(forcedDecision);
                }, 120);
              } else if (forcedDecision.decisionId) {
                updateDecisionOutcome(forcedDecision, 'not_shown');
              }
            });
          }
          armIdleRisk();
        }
        document.addEventListener('visibilitychange', function() {
          if (document.visibilityState === 'hidden') sendCheckoutRisk('visibility_hidden');
          else if (isCheckoutLikePath()) armIdleRisk();
        });
        window.addEventListener('pagehide', function() { sendCheckoutRisk('pagehide'); });
        window.addEventListener('beforeunload', function() { sendCheckoutRisk('beforeunload'); });
        ['pointerdown','keydown','scroll','touchstart'].forEach(function(evt) {
          window.addEventListener(evt, function() {
            if (isCheckoutLikePath()) armIdleRisk();
          }, { passive: true });
        });
      } catch (e) {}
  `;
}

export { getStorefrontCheckoutDetectorScript };
