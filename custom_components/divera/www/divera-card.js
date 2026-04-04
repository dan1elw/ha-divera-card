/**
 * DIVERA 24/7 Alarm Dashboard Card for Home Assistant
 * 
 * A comprehensive Lovelace card showing:
 * - Active alarm status with priority indicator
 * - Alarm details (title, address, message, timestamp)
 * - Embedded map with alarm location
 * - Vehicle status overview (FMS)
 * - Personal availability status
 * 
 * Prerequisites:
 * - dan1elw/ha-divera-card HACS integration installed & configured
 * - REST sensors for vehicle status (see setup guide)
 * 
 * Installation:
 * 1. Copy this file to /config/www/divera-alarm-card.js
 * 2. Add resource in HA: /local/divera-alarm-card.js (JavaScript Module)
 * 3. Add card via YAML (see setup guide)
 */

class DiveraAlarmCard extends HTMLElement {
  set hass(hass) {
    this._hass = hass;
    if (!this._initialized) {
      this._initialize();
      this._initialized = true;
    }
    this._updateCard();
  }

  setConfig(config) {
    this._config = {
      // Entity IDs — adjust to match your integration's entity naming
      alarm_entity: config.alarm_entity || 'sensor.divera_last_alarm',
      alarm_id_entity: config.alarm_id_entity || 'sensor.divera_last_alarm_id',
      status_entity: config.status_entity || 'sensor.divera_status',
      vehicle_entities: config.vehicle_entities || [],
      // Display options
      title: config.title || 'DIVERA 24/7',
      unit_name: config.unit_name || 'Feuerwehr',
      show_map: config.show_map !== false,
      show_vehicles: config.show_vehicles !== false,
      show_status: config.show_status !== false,
      map_zoom: config.map_zoom || 15,
      map_provider: config.map_provider || 'osm', // 'osm' or 'google'
      // Theming
      theme: config.theme || 'dark', // 'dark' or 'light'
    };
  }

  getCardSize() {
    return 8;
  }

  _initialize() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        ${this._getStyles()}
      </style>
      <div class="divera-card" id="card-root">
        <div class="card-loading">
          <div class="spinner"></div>
          <span>Verbindung zu DIVERA 24/7...</span>
        </div>
      </div>
    `;
  }

  _getStyles() {
    const isDark = this._config.theme === 'dark';
    return `
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;600&display=swap');

      :host {
        --dv-bg: ${isDark ? '#0f1419' : '#f8f9fb'};
        --dv-surface: ${isDark ? '#1a2029' : '#ffffff'};
        --dv-surface-raised: ${isDark ? '#222a35' : '#f0f2f5'};
        --dv-text: ${isDark ? '#e8ecf1' : '#1a2029'};
        --dv-text-muted: ${isDark ? '#7a8a9e' : '#6b7a8d'};
        --dv-border: ${isDark ? '#2a3444' : '#e0e4ea'};
        --dv-red: #e53935;
        --dv-red-glow: ${isDark ? 'rgba(229, 57, 53, 0.25)' : 'rgba(229, 57, 53, 0.12)'};
        --dv-orange: #fb8c00;
        --dv-green: #43a047;
        --dv-blue: #1e88e5;
        --dv-yellow: #fdd835;
        --dv-grey: #78909c;
        --dv-fms1: #43a047;
        --dv-fms2: #43a047;
        --dv-fms3: #fb8c00;
        --dv-fms4: #e53935;
        --dv-fms5: #1e88e5;
        --dv-fms6: #78909c;
        --dv-radius: 12px;
        --dv-font: 'DM Sans', sans-serif;
        --dv-mono: 'JetBrains Mono', monospace;
      }

      * { box-sizing: border-box; margin: 0; padding: 0; }

      .divera-card {
        font-family: var(--dv-font);
        background: var(--dv-bg);
        color: var(--dv-text);
        border-radius: var(--dv-radius);
        overflow: hidden;
        border: 1px solid var(--dv-border);
      }

      /* --- Header --- */
      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid var(--dv-border);
        background: var(--dv-surface);
      }
      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .header-logo {
        width: 36px; height: 36px;
        background: linear-gradient(135deg, var(--dv-red), #c62828);
        border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        font-weight: 700; font-size: 14px; color: #fff;
        letter-spacing: -0.5px;
        flex-shrink: 0;
      }
      .header-title {
        font-size: 15px; font-weight: 700; letter-spacing: 0.3px;
      }
      .header-unit {
        font-size: 12px; color: var(--dv-text-muted); margin-top: 1px;
      }
      .header-status-badge {
        font-size: 11px; font-weight: 600;
        padding: 4px 10px;
        border-radius: 20px;
        letter-spacing: 0.5px;
        text-transform: uppercase;
      }
      .badge-alarm {
        background: var(--dv-red-glow);
        color: var(--dv-red);
        animation: pulse-badge 2s ease-in-out infinite;
      }
      .badge-idle {
        background: ${isDark ? 'rgba(67, 160, 71, 0.15)' : 'rgba(67, 160, 71, 0.1)'};
        color: var(--dv-green);
      }
      @keyframes pulse-badge {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }

      /* --- Alarm Section --- */
      .alarm-section {
        padding: 0;
      }
      .alarm-active {
        background: linear-gradient(135deg,
          ${isDark ? 'rgba(229, 57, 53, 0.08)' : 'rgba(229, 57, 53, 0.04)'},
          ${isDark ? 'rgba(229, 57, 53, 0.02)' : 'transparent'}
        );
        border-left: 4px solid var(--dv-red);
        padding: 16px 20px;
      }
      .alarm-active.priority-high {
        border-left-color: var(--dv-red);
      }
      .alarm-active.priority-low {
        border-left-color: var(--dv-orange);
      }
      .alarm-inactive {
        padding: 24px 20px;
        text-align: center;
        color: var(--dv-text-muted);
      }
      .alarm-inactive .idle-icon {
        font-size: 32px;
        margin-bottom: 8px;
        opacity: 0.5;
      }
      .alarm-inactive .idle-text {
        font-size: 14px;
        font-weight: 500;
      }
      .alarm-priority-tag {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 8px;
        color: var(--dv-red);
      }
      .alarm-priority-tag .dot {
        width: 7px; height: 7px;
        border-radius: 50%;
        background: var(--dv-red);
        animation: blink 1s step-end infinite;
      }
      @keyframes blink {
        50% { opacity: 0; }
      }
      .alarm-title {
        font-size: 20px;
        font-weight: 700;
        line-height: 1.3;
        margin-bottom: 10px;
        letter-spacing: -0.3px;
      }
      .alarm-message {
        font-size: 13px;
        color: var(--dv-text-muted);
        line-height: 1.5;
        margin-bottom: 12px;
      }
      .alarm-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        font-size: 12px;
        color: var(--dv-text-muted);
      }
      .alarm-meta-item {
        display: flex;
        align-items: center;
        gap: 5px;
      }
      .alarm-meta-item svg {
        width: 14px; height: 14px;
        opacity: 0.6;
        flex-shrink: 0;
      }
      .alarm-meta-item .meta-label {
        font-weight: 600;
        color: var(--dv-text);
      }

      /* --- Map --- */
      .map-section {
        border-top: 1px solid var(--dv-border);
        height: 200px;
        position: relative;
        background: var(--dv-surface-raised);
      }
      .map-section iframe {
        width: 100%; height: 100%; border: none;
      }
      .map-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--dv-text-muted);
        font-size: 13px;
        gap: 8px;
      }

      /* --- Section Title --- */
      .section-title {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1.2px;
        color: var(--dv-text-muted);
        padding: 14px 20px 8px;
        border-top: 1px solid var(--dv-border);
      }

      /* --- Vehicle Grid --- */
      .vehicle-grid {
        padding: 8px 16px 16px;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 8px;
      }
      .vehicle-item {
        background: var(--dv-surface);
        border: 1px solid var(--dv-border);
        border-radius: 8px;
        padding: 10px 12px;
        display: flex;
        align-items: center;
        gap: 10px;
        transition: border-color 0.2s;
      }
      .vehicle-item:hover {
        border-color: var(--dv-text-muted);
      }
      .vehicle-status-dot {
        width: 10px; height: 10px;
        border-radius: 50%;
        flex-shrink: 0;
        box-shadow: 0 0 6px currentColor;
      }
      .fms-1 { color: var(--dv-fms1); background: var(--dv-fms1); }
      .fms-2 { color: var(--dv-fms2); background: var(--dv-fms2); }
      .fms-3 { color: var(--dv-fms3); background: var(--dv-fms3); }
      .fms-4 { color: var(--dv-fms4); background: var(--dv-fms4); }
      .fms-5 { color: var(--dv-fms5); background: var(--dv-fms5); }
      .fms-6 { color: var(--dv-fms6); background: var(--dv-fms6); }

      .vehicle-info {
        min-width: 0;
      }
      .vehicle-name {
        font-size: 13px; font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .vehicle-fms-label {
        font-size: 11px;
        color: var(--dv-text-muted);
        font-family: var(--dv-mono);
      }

      /* --- Availability --- */
      .availability-section {
        padding: 8px 16px 16px;
      }
      .availability-bar {
        display: flex;
        align-items: center;
        gap: 12px;
        background: var(--dv-surface);
        border: 1px solid var(--dv-border);
        border-radius: 8px;
        padding: 12px 16px;
      }
      .availability-icon {
        width: 36px; height: 36px;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 18px;
        flex-shrink: 0;
      }
      .avail-on-duty {
        background: rgba(67, 160, 71, 0.15);
        color: var(--dv-green);
      }
      .avail-off-duty {
        background: rgba(120, 144, 156, 0.15);
        color: var(--dv-grey);
      }
      .avail-not-available {
        background: rgba(229, 57, 53, 0.15);
        color: var(--dv-red);
      }
      .availability-details {
        flex: 1; min-width: 0;
      }
      .availability-label {
        font-size: 13px; font-weight: 600;
      }
      .availability-sublabel {
        font-size: 11px; color: var(--dv-text-muted);
      }

      /* --- Footer --- */
      .card-footer {
        padding: 10px 20px;
        border-top: 1px solid var(--dv-border);
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 11px;
        color: var(--dv-text-muted);
        font-family: var(--dv-mono);
      }

      /* --- Loading --- */
      .card-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px 20px;
        gap: 12px;
        color: var(--dv-text-muted);
        font-size: 13px;
      }
      .spinner {
        width: 24px; height: 24px;
        border: 2.5px solid var(--dv-border);
        border-top-color: var(--dv-red);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin { to { transform: rotate(360deg); } }

      /* --- Responsive --- */
      @media (max-width: 400px) {
        .vehicle-grid {
          grid-template-columns: 1fr;
        }
        .alarm-meta {
          flex-direction: column;
          gap: 6px;
        }
      }
    `;
  }

  _updateCard() {
    if (!this._hass || !this._config) return;

    const root = this.shadowRoot.getElementById('card-root');
    if (!root) return;

    const alarm = this._getAlarmData();
    const vehicles = this._getVehicleData();
    const status = this._getStatusData();

    root.innerHTML = `
      ${this._renderHeader(alarm)}
      ${this._renderAlarm(alarm)}
      ${this._config.show_map ? this._renderMap(alarm) : ''}
      ${this._config.show_vehicles && vehicles.length ? this._renderVehicles(vehicles) : ''}
      ${this._config.show_status ? this._renderAvailability(status) : ''}
      ${this._renderFooter()}
    `;
  }

  _getAlarmData() {
    const cfg = this._config;
    const hass = this._hass;
    const alarmState = hass.states[cfg.alarm_entity];

    if (!alarmState || alarmState.state === 'unavailable' || alarmState.state === 'unknown') {
      return { active: false };
    }

    const attrs = alarmState.attributes || {};
    const state = alarmState.state;

    // The fwmarcel integration exposes alarm data as sensor attributes
    const isActive = state !== '' && state !== 'idle' && state !== 'unavailable'
      && state !== 'unknown' && state !== 'None' && !attrs.closed;

    return {
      active: isActive,
      title: attrs.title || state || '',
      text: attrs.text || attrs.message || '',
      address: attrs.address || '',
      lat: attrs.lat || attrs.latitude || null,
      lng: attrs.lng || attrs.longitude || null,
      priority: attrs.priority !== undefined ? attrs.priority : true,
      closed: attrs.closed || false,
      timestamp: attrs.date || attrs.ts_create || attrs.timestamp || null,
      id: attrs.id || attrs.foreign_id || '',
      groups: attrs.groups || attrs.group || [],
    };
  }

  _getVehicleData() {
    const entities = this._config.vehicle_entities;
    if (!entities.length) return [];

    return entities.map(entityId => {
      const state = this._hass.states[entityId];
      if (!state) return null;
      const attrs = state.attributes || {};
      return {
        name: attrs.shortname || attrs.friendly_name || entityId,
        fullname: attrs.fullname || attrs.Fahrzeug || '',
        fms: attrs.fmsstatus || this._fmsFromState(state.state),
        fmsLabel: state.state || 'unbekannt',
        note: attrs.fmsstatus_note || attrs.Notiz || '',
      };
    }).filter(Boolean);
  }

  _fmsFromState(stateStr) {
    const map = {
      'funkfrei': 1, 'auf wache': 2, 'einsatz übernommen': 3,
      'einsatzstelle an': 4, 'sprechwunsch': 5, 'nicht einsatzbereit': 6
    };
    return map[(stateStr || '').toLowerCase()] || 0;
  }

  _getStatusData() {
    const entity = this._config.status_entity;
    const state = this._hass.states[entity];
    if (!state) return { available: false, label: 'Unbekannt', id: 0 };

    const statusId = parseInt(state.state, 10);
    const statusMap = {
      1: { label: 'Auf Wache', icon: '🟢', cls: 'avail-on-duty' },
      2: { label: 'Verfügbar', icon: '🟢', cls: 'avail-on-duty' },
      3: { label: 'Nicht verfügbar', icon: '🔴', cls: 'avail-not-available' },
      4: { label: 'Bedingt verfügbar', icon: '🟡', cls: 'avail-off-duty' },
      0: { label: 'Nicht gesetzt', icon: '⚪', cls: 'avail-off-duty' },
    };

    const s = statusMap[statusId] || statusMap[0];
    return { ...s, id: statusId, raw: state.state };
  }

  _renderHeader(alarm) {
    return `
      <div class="card-header">
        <div class="header-left">
          <div class="header-logo">D</div>
          <div>
            <div class="header-title">${this._config.title}</div>
            <div class="header-unit">${this._config.unit_name}</div>
          </div>
        </div>
        <div class="header-status-badge ${alarm.active ? 'badge-alarm' : 'badge-idle'}">
          ${alarm.active ? '⚠ Alarm' : '✓ Bereit'}
        </div>
      </div>
    `;
  }

  _renderAlarm(alarm) {
    if (!alarm.active) {
      return `
        <div class="alarm-section">
          <div class="alarm-inactive">
            <div class="idle-icon">🛡️</div>
            <div class="idle-text">Kein aktiver Einsatz</div>
          </div>
        </div>
      `;
    }

    const priorityClass = alarm.priority ? 'priority-high' : 'priority-low';
    const priorityLabel = alarm.priority ? 'Sonderrechte' : 'Ohne Sonderrechte';
    const timeStr = alarm.timestamp ? this._formatTime(alarm.timestamp) : '';

    return `
      <div class="alarm-section">
        <div class="alarm-active ${priorityClass}">
          <div class="alarm-priority-tag">
            <span class="dot"></span>
            ${alarm.priority ? 'Alarm — Sonderrechte' : 'Alarm'}
          </div>
          <div class="alarm-title">${this._escapeHtml(alarm.title)}</div>
          ${alarm.text ? `<div class="alarm-message">${this._escapeHtml(alarm.text)}</div>` : ''}
          <div class="alarm-meta">
            ${alarm.address ? `
              <div class="alarm-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span class="meta-label">${this._escapeHtml(alarm.address)}</span>
              </div>
            ` : ''}
            ${timeStr ? `
              <div class="alarm-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                <span>${timeStr}</span>
              </div>
            ` : ''}
            ${alarm.id ? `
              <div class="alarm-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v16H4z"/><path d="M9 9h6M9 13h4"/></svg>
                <span style="font-family:var(--dv-mono)">#${this._escapeHtml(String(alarm.id))}</span>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  _renderMap(alarm) {
    if (!alarm.active || !alarm.lat || !alarm.lng) {
      return `
        <div class="map-section">
          <div class="map-placeholder">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Kein Einsatzort verfügbar
          </div>
        </div>
      `;
    }

    const zoom = this._config.map_zoom;
    const lat = alarm.lat;
    const lng = alarm.lng;

    // OpenStreetMap embed
    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.008},${lat-0.005},${lng+0.008},${lat+0.005}&layer=mapnik&marker=${lat},${lng}`;

    return `
      <div class="map-section">
        <iframe
          src="${mapUrl}"
          loading="lazy"
          referrerpolicy="no-referrer"
          title="Einsatzort"
        ></iframe>
      </div>
    `;
  }

  _renderVehicles(vehicles) {
    const fmsLabels = {
      1: 'S1 · frei Funk',
      2: 'S2 · auf Wache',
      3: 'S3 · Einsatz',
      4: 'S4 · am Einsatzort',
      5: 'S5 · Sprechwunsch',
      6: 'S6 · nicht einsatzbereit',
    };

    const items = vehicles.map(v => {
      const fms = v.fms || 0;
      const label = fmsLabels[fms] || `S${fms}`;
      return `
        <div class="vehicle-item" title="${this._escapeHtml(v.fullname)}${v.note ? ' — ' + this._escapeHtml(v.note) : ''}">
          <div class="vehicle-status-dot fms-${fms}"></div>
          <div class="vehicle-info">
            <div class="vehicle-name">${this._escapeHtml(v.name)}</div>
            <div class="vehicle-fms-label">${label}</div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="section-title">Fahrzeuge</div>
      <div class="vehicle-grid">${items}</div>
    `;
  }

  _renderAvailability(status) {
    return `
      <div class="section-title">Eigener Status</div>
      <div class="availability-section">
        <div class="availability-bar">
          <div class="availability-icon ${status.cls}">${status.icon}</div>
          <div class="availability-details">
            <div class="availability-label">${status.label}</div>
            <div class="availability-sublabel">Status ${status.id}</div>
          </div>
        </div>
      </div>
    `;
  }

  _renderFooter() {
    const now = new Date();
    const ts = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return `
      <div class="card-footer">
        <span>DIVERA 24/7</span>
        <span>Aktualisiert ${ts}</span>
      </div>
    `;
  }

  // --- Utilities ---
  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  _formatTime(ts) {
    try {
      let date;
      if (typeof ts === 'number') {
        // Unix timestamp (seconds or ms)
        date = new Date(ts > 1e12 ? ts : ts * 1000);
      } else {
        date = new Date(ts);
      }
      if (isNaN(date.getTime())) return '';
      return date.toLocaleString('de-DE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return ''; }
  }
}

customElements.define('divera-alarm-card', DiveraAlarmCard);

// Register card in HA's custom card picker
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'divera-alarm-card',
  name: 'DIVERA 24/7 Alarm',
  description: 'Alarm-Dashboard für Freiwillige Feuerwehr mit Divera 24/7',
  preview: true,
});
