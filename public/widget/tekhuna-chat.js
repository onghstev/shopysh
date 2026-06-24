/**
 * Shopysh — Embeddable Chat Widget
 * Usage: <script src="https://YOUR_DOMAIN/widget/tekhuna-chat.js" data-tenant-id="YOUR_TENANT_ID"></script>
 */
(function() {
  'use strict';

  // Prevent double-initialization
  if (window.__tekhunaWidget) return;
  window.__tekhunaWidget = true;

  // Get config from script tag
  var scriptTag = document.currentScript || (function() {
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].src && scripts[i].src.indexOf('tekhuna-chat.js') !== -1) return scripts[i];
    }
    return null;
  })();

  if (!scriptTag) { console.error('Tekhuna Chat: Script tag not found'); return; }

  var tenantId = scriptTag.getAttribute('data-tenant-id');
  if (!tenantId) { console.error('Tekhuna Chat: data-tenant-id is required'); return; }

  var baseUrl = scriptTag.src.replace(/\/widget\/tekhuna-chat\.js.*$/, '');
  var API = baseUrl + '/api/widget/' + tenantId;

  // State
  var state = {
    open: false,
    sessionId: localStorage.getItem('tekhuna_session_' + tenantId) || null,
    conversationId: null,
    messages: [],
    config: null,
    loading: true,
    sending: false,
    lastTimestamp: null
  };

  // ===== STYLES =====
  var STYLES = `
    #tk-widget-container * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    #tk-chat-btn {
      position: fixed; bottom: 24px; right: 24px; z-index: 999999;
      width: 60px; height: 60px; border-radius: 50%; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 24px rgba(0,0,0,0.2); transition: transform 0.2s, box-shadow 0.2s;
    }
    #tk-chat-btn:hover { transform: scale(1.08); box-shadow: 0 6px 32px rgba(0,0,0,0.25); }
    #tk-chat-btn svg { width: 28px; height: 28px; fill: white; }
    #tk-chat-btn .tk-close-icon { display: none; }
    #tk-chat-btn.tk-open .tk-chat-icon { display: none; }
    #tk-chat-btn.tk-open .tk-close-icon { display: block; }
    #tk-chat-window {
      position: fixed; bottom: 96px; right: 24px; z-index: 999998;
      width: 380px; max-width: calc(100vw - 32px); height: 520px; max-height: calc(100vh - 140px);
      border-radius: 16px; overflow: hidden;
      box-shadow: 0 8px 48px rgba(0,0,0,0.18); display: none; flex-direction: column;
      background: #ffffff;
    }
    #tk-chat-window.tk-open { display: flex; animation: tkSlideUp 0.25s ease-out; }
    @keyframes tkSlideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    #tk-chat-header {
      padding: 16px 20px; display: flex; align-items: center; gap: 12px; flex-shrink: 0;
    }
    #tk-chat-header .tk-avatar {
      width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.2); font-size: 18px; color: white; flex-shrink: 0;
    }
    #tk-chat-header .tk-avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
    #tk-chat-header .tk-info { flex: 1; }
    #tk-chat-header .tk-name { font-size: 15px; font-weight: 600; color: white; }
    #tk-chat-header .tk-status { font-size: 12px; color: rgba(255,255,255,0.8); display: flex; align-items: center; gap: 4px; }
    #tk-chat-header .tk-dot { width: 6px; height: 6px; border-radius: 50%; background: #4ade80; }
    #tk-chat-msgs {
      flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 8px;
      background: #f8fafc;
    }
    #tk-chat-msgs::-webkit-scrollbar { width: 4px; }
    #tk-chat-msgs::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
    .tk-msg {
      max-width: 82%; padding: 10px 14px; border-radius: 16px; font-size: 14px;
      line-height: 1.5; word-wrap: break-word; white-space: pre-wrap;
    }
    .tk-msg.tk-in {
      align-self: flex-end; border-bottom-right-radius: 4px;
      background: var(--tk-primary, #16a34a); color: white;
    }
    .tk-msg.tk-out {
      align-self: flex-start; border-bottom-left-radius: 4px;
      background: white; color: #1e293b; border: 1px solid #e2e8f0;
    }
    .tk-msg .tk-time { font-size: 10px; opacity: 0.6; margin-top: 4px; text-align: right; }
    .tk-msg.tk-out .tk-sender { font-size: 11px; font-weight: 600; margin-bottom: 2px; color: var(--tk-primary, #16a34a); }
    .tk-typing { align-self: flex-start; display: flex; gap: 4px; padding: 12px 16px; background: white; border-radius: 16px; border: 1px solid #e2e8f0; }
    .tk-typing span { width: 6px; height: 6px; background: #94a3b8; border-radius: 50%; animation: tkBounce 1.4s infinite ease-in-out; }
    .tk-typing span:nth-child(2) { animation-delay: 0.2s; }
    .tk-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes tkBounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
    #tk-chat-input-area {
      padding: 12px 16px; display: flex; gap: 8px; align-items: center;
      border-top: 1px solid #e2e8f0; background: white; flex-shrink: 0;
    }
    #tk-chat-input {
      flex: 1; border: 1px solid #e2e8f0; border-radius: 24px; padding: 10px 16px;
      font-size: 14px; outline: none; resize: none; height: 40px; line-height: 20px;
      transition: border-color 0.2s;
    }
    #tk-chat-input:focus { border-color: var(--tk-primary, #16a34a); }
    #tk-chat-input::placeholder { color: #94a3b8; }
    #tk-send-btn {
      width: 40px; height: 40px; border-radius: 50%; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      transition: opacity 0.2s;
    }
    #tk-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    #tk-send-btn svg { width: 18px; height: 18px; fill: white; }
    #tk-powered {
      text-align: center; padding: 6px; font-size: 10px; color: #94a3b8; background: white;
      border-top: 1px solid #f1f5f9;
    }
    #tk-powered a { color: #64748b; text-decoration: none; font-weight: 500; }
    @media (max-width: 480px) {
      #tk-chat-window { bottom: 0; right: 0; width: 100vw; height: 100vh; max-height: 100vh; border-radius: 0; }
      #tk-chat-btn { bottom: 16px; right: 16px; width: 56px; height: 56px; }
    }
  `;

  // ===== BUILD DOM =====
  function buildWidget() {
    var container = document.createElement('div');
    container.id = 'tk-widget-container';

    // Style tag
    var styleEl = document.createElement('style');
    styleEl.textContent = STYLES;
    container.appendChild(styleEl);

    // Chat window
    var win = document.createElement('div');
    win.id = 'tk-chat-window';
    win.innerHTML = [
      '<div id="tk-chat-header">',
      '  <div class="tk-avatar"><span>💬</span></div>',
      '  <div class="tk-info">',
      '    <div class="tk-name">Loading...</div>',
      '    <div class="tk-status"><span class="tk-dot"></span> Online</div>',
      '  </div>',
      '</div>',
      '<div id="tk-chat-msgs"></div>',
      '<div id="tk-chat-input-area">',
      '  <input id="tk-chat-input" type="text" placeholder="Type your message..." autocomplete="off" />',
      '  <button id="tk-send-btn" disabled>',
      '    <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>',
      '  </button>',
      '</div>',
      '<div id="tk-powered">Powered by <a href="#">Shopysh</a></div>',
    ].join('');
    container.appendChild(win);

    // Float button
    var btn = document.createElement('button');
    btn.id = 'tk-chat-btn';
    btn.innerHTML = [
      '<svg class="tk-chat-icon" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>',
      '<svg class="tk-close-icon" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
    ].join('');
    container.appendChild(btn);

    document.body.appendChild(container);
    return { container: container, window: win, button: btn };
  }

  // ===== API CALLS =====
  function apiCall(endpoint, options) {
    options = options || {};
    var url = API + endpoint;
    var fetchOptions = {
      method: options.method || 'GET',
      headers: { 'Content-Type': 'application/json' }
    };
    if (options.body) fetchOptions.body = JSON.stringify(options.body);
    return fetch(url, fetchOptions).then(function(r) { return r.json(); });
  }

  function loadConfig() {
    return apiCall('/config');
  }

  function createSession() {
    return apiCall('/session', { method: 'POST', body: { sessionId: state.sessionId } });
  }

  function sendMessage(text) {
    return apiCall('/messages', { method: 'POST', body: { sessionId: state.sessionId, text: text } });
  }

  function pollMessages() {
    var params = '?sessionId=' + encodeURIComponent(state.sessionId);
    if (state.lastTimestamp) params += '&after=' + encodeURIComponent(state.lastTimestamp);
    return apiCall('/messages' + params);
  }

  // ===== RENDERING =====
  function renderMessages() {
    var container = document.getElementById('tk-chat-msgs');
    if (!container) return;
    container.innerHTML = '';
    state.messages.forEach(function(msg) {
      var div = document.createElement('div');
      var isInbound = msg.direction === 'inbound';
      div.className = 'tk-msg ' + (isInbound ? 'tk-in' : 'tk-out');

      var html = '';
      if (!isInbound && msg.senderType === 'ai') {
        html += '<div class="tk-sender">' + (state.config ? state.config.assistantName : 'AI') + '</div>';
      } else if (!isInbound && msg.senderType === 'agent') {
        html += '<div class="tk-sender">' + (state.config ? state.config.businessName : 'Agent') + '</div>';
      }
      html += '<div>' + escapeHtml(msg.text || '') + '</div>';
      html += '<div class="tk-time">' + formatTime(msg.timestamp) + '</div>';
      div.innerHTML = html;
      container.appendChild(div);
    });
    container.scrollTop = container.scrollHeight;
  }

  function showTyping() {
    var container = document.getElementById('tk-chat-msgs');
    var typing = document.createElement('div');
    typing.className = 'tk-typing';
    typing.id = 'tk-typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    container.appendChild(typing);
    container.scrollTop = container.scrollHeight;
  }

  function hideTyping() {
    var el = document.getElementById('tk-typing');
    if (el) el.remove();
  }

  function applyConfig(config) {
    state.config = config;
    var primary = config.primaryColor || '#16a34a';
    document.documentElement.style.setProperty('--tk-primary', primary);
    var btn = document.getElementById('tk-chat-btn');
    if (btn) btn.style.backgroundColor = primary;
    var sendBtn = document.getElementById('tk-send-btn');
    if (sendBtn) sendBtn.style.backgroundColor = primary;
    var header = document.getElementById('tk-chat-header');
    if (header) header.style.background = 'linear-gradient(135deg, ' + primary + ', ' + adjustColor(primary, -20) + ')';
    var nameEl = header && header.querySelector('.tk-name');
    if (nameEl) nameEl.textContent = config.widgetTitle || config.businessName;
    var avatarEl = header && header.querySelector('.tk-avatar');
    if (avatarEl && config.logoUrl) {
      avatarEl.innerHTML = '<img src="' + config.logoUrl + '" alt="" />';
    }
  }

  // ===== HELPERS =====
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function formatTime(ts) {
    if (!ts) return '';
    var d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function adjustColor(hex, amount) {
    hex = hex.replace('#', '');
    var r = Math.max(0, Math.min(255, parseInt(hex.substring(0,2), 16) + amount));
    var g = Math.max(0, Math.min(255, parseInt(hex.substring(2,4), 16) + amount));
    var b = Math.max(0, Math.min(255, parseInt(hex.substring(4,6), 16) + amount));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // ===== INIT =====
  function init() {
    var els = buildWidget();

    // Toggle chat
    els.button.addEventListener('click', function() {
      state.open = !state.open;
      els.window.classList.toggle('tk-open', state.open);
      els.button.classList.toggle('tk-open', state.open);
      if (state.open && !state.conversationId) {
        initSession();
      }
      if (state.open) {
        setTimeout(function() {
          var input = document.getElementById('tk-chat-input');
          if (input) input.focus();
        }, 300);
      }
    });

    // Send message
    var input = document.getElementById('tk-chat-input');
    var sendBtn = document.getElementById('tk-send-btn');

    input.addEventListener('input', function() {
      sendBtn.disabled = !input.value.trim() || state.sending;
    });

    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey && input.value.trim() && !state.sending) {
        e.preventDefault();
        handleSend();
      }
    });

    sendBtn.addEventListener('click', function() {
      if (input.value.trim() && !state.sending) handleSend();
    });

    // Load config
    loadConfig().then(function(config) {
      if (config.error) { console.error('Tekhuna Chat:', config.error); return; }
      applyConfig(config);
      state.loading = false;
    }).catch(function(e) { console.error('Tekhuna Chat config error:', e); });
  }

  function initSession() {
    createSession().then(function(data) {
      if (data.error) { console.error('Tekhuna Chat session error:', data.error); return; }
      state.sessionId = data.sessionId;
      state.conversationId = data.conversationId;
      state.messages = data.messages || [];
      localStorage.setItem('tekhuna_session_' + tenantId, data.sessionId);
      if (state.messages.length > 0) {
        state.lastTimestamp = state.messages[state.messages.length - 1].timestamp;
      }
      renderMessages();
      startPolling();
    });
  }

  function handleSend() {
    var input = document.getElementById('tk-chat-input');
    var text = input.value.trim();
    if (!text) return;

    state.sending = true;
    input.value = '';
    document.getElementById('tk-send-btn').disabled = true;

    // Optimistic: show message immediately
    var tempMsg = { id: 'temp-' + Date.now(), direction: 'inbound', senderType: 'customer', text: text, timestamp: new Date().toISOString() };
    state.messages.push(tempMsg);
    renderMessages();
    showTyping();

    sendMessage(text).then(function(data) {
      hideTyping();
      state.sending = false;

      if (data.error) {
        console.error('Send error:', data.error);
        return;
      }

      // Replace temp message with real one
      var idx = state.messages.findIndex(function(m) { return m.id === tempMsg.id; });
      if (idx !== -1 && data.message) {
        state.messages[idx] = data.message;
      }

      // Add AI reply if present
      if (data.aiReply) {
        state.messages.push(data.aiReply);
        state.lastTimestamp = data.aiReply.timestamp;
      } else if (data.message) {
        state.lastTimestamp = data.message.timestamp;
      }

      renderMessages();
    }).catch(function(e) {
      hideTyping();
      state.sending = false;
      console.error('Send error:', e);
    });
  }

  // Poll for new messages (agent replies)
  var pollInterval = null;
  function startPolling() {
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(function() {
      if (!state.open || !state.sessionId) return;
      pollMessages().then(function(data) {
        if (!data.messages || data.messages.length === 0) return;
        var newMsgs = data.messages.filter(function(m) {
          return !state.messages.some(function(existing) { return existing.id === m.id; });
        });
        if (newMsgs.length > 0) {
          state.messages = state.messages.concat(newMsgs);
          state.lastTimestamp = newMsgs[newMsgs.length - 1].timestamp;
          renderMessages();
        }
      }).catch(function() { /* silent */ });
    }, 3000); // Poll every 3 seconds
  }

  // Launch when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
