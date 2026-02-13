/**
 * Analytics Hub - Application Shell
 * Orchestrates sidebar navigation, zone tab switching,
 * home dashboard, and client management views.
 */

const App = (function() {
  'use strict';

  // Cached DOM references
  let elements = {};

  // Client search filter for sidebar
  let clientSearchTerm = '';

  // =====================
  // INITIALIZATION
  // =====================

  function init() {
    DataStore.runMigration();
    cacheElements();
    AppRouter.init(render);
    bindEvents();
    render();
  }

  function cacheElements() {
    elements = {
      globalSearch: document.getElementById('global-search'),
      clientSearch: document.getElementById('client-search'),
      divisionTree: document.getElementById('division-tree'),
      mainContent: document.getElementById('main-content'),
      pageTitle: document.getElementById('page-title'),
      pageSubtitle: document.getElementById('page-subtitle'),
      projectSuggestions: document.getElementById('project-suggestions')
    };
  }

  // =====================
  // EVENT BINDING
  // =====================

  function bindEvents() {
    // Global search
    elements.globalSearch.addEventListener('input', debounce((e) => {
      AppRouter.setGlobalSearch(e.target.value.trim());
    }, 200));

    // Client search in sidebar
    elements.clientSearch.addEventListener('input', debounce((e) => {
      clientSearchTerm = e.target.value.trim().toLowerCase();
      renderSidebar();
    }, 200));

    // Sidebar navigation (event delegation)
    elements.divisionTree.addEventListener('click', handleSidebarClick);

    // Logo click goes home
    document.querySelector('.logo-block').addEventListener('click', (e) => {
      e.preventDefault();
      AppRouter.goHome();
    });
    document.querySelector('.logo-block').style.cursor = 'pointer';

    // Manage clients link
    const manageClientsLink = document.querySelector('[data-action="manage-clients"]');
    if (manageClientsLink) {
      manageClientsLink.addEventListener('click', (e) => {
        e.preventDefault();
        AppRouter.navigate('manage-clients');
      });
    }
  }

  function handleSidebarClick(e) {
    e.preventDefault();

    const divisionLink = e.target.closest('[data-division-id]');
    if (divisionLink) {
      AppRouter.toggleDivision(divisionLink.dataset.divisionId);
      return;
    }

    const clientLink = e.target.closest('[data-client-id]');
    if (clientLink) {
      AppRouter.selectClient(clientLink.dataset.clientId);
      return;
    }
  }

  // =====================
  // MASTER RENDER
  // =====================

  function render() {
    renderSidebar();
    renderMainContent();
    updateProjectSuggestions();
  }

  // =====================
  // SIDEBAR RENDERING
  // =====================

  function renderSidebar() {
    const divisions = DataStore.getDivisions();
    const state = AppRouter.getState();

    let html = '<div class="nav-list">';

    divisions.forEach(div => {
      let clients = DataStore.getClientsByDivision(div.id);

      // Filter clients by search term
      if (clientSearchTerm) {
        clients = clients.filter(c => c.name.toLowerCase().includes(clientSearchTerm));
      }

      const isExpanded = state.expandedDivisions.includes(div.id);
      const allClients = DataStore.getClientsByDivision(div.id);

      html += `
        <div class="nav-group ${isExpanded ? 'expanded' : ''}">
          <a href="#" class="nav-link nav-division" data-division-id="${div.id}">
            <span class="nav-expand-icon">${isExpanded ? '&#9660;' : '&#9654;'}</span>
            <span class="nav-division-name">${escapeHtml(div.name)}</span>
            <span class="pill">${allClients.length}</span>
          </a>
          <div class="nav-children" ${isExpanded ? '' : 'hidden'}>
            ${clients.length > 0 ? clients.map(c => `
              <a href="#" class="nav-link nav-client ${state.selectedClientId === c.id ? 'active' : ''}"
                 data-client-id="${c.id}">
                <span>${escapeHtml(c.name)}</span>
              </a>
            `).join('') : `
              <div class="nav-empty">No clients yet</div>
            `}
          </div>
        </div>
      `;
    });

    html += '</div>';
    elements.divisionTree.innerHTML = html;
  }

  // =====================
  // MAIN CONTENT RENDERING
  // =====================

  function renderMainContent() {
    const state = AppRouter.getState();

    switch (state.currentView) {
      case 'home':
        renderHomeDashboard();
        break;
      case 'client':
        renderClientView(state.selectedClientId, state.activeZone);
        break;
      case 'manage-clients':
        renderClientManager();
        break;
      default:
        renderHomeDashboard();
    }
  }

  // =====================
  // HOME DASHBOARD
  // =====================

  function renderHomeDashboard() {
    elements.pageTitle.textContent = 'Analytics Hub';
    elements.pageSubtitle.textContent = '';

    const divisions = DataStore.getDivisions();
    const unassignedRequests = DataStore.getUnassignedRequests();
    const unassignedProgress = DataStore.getUnassignedInProgress();
    const unassignedReports = DataStore.getUnassignedReports();
    const totalUnassigned = unassignedRequests.length + unassignedProgress.length + unassignedReports.length;

    let divisionCardsHtml = divisions.map(div => {
      const clients = DataStore.getClientsByDivision(div.id);
      return `
        <div class="kpi-card division-summary-card" data-division-id="${div.id}">
          <div class="kpi-value">${clients.length}</div>
          <div class="kpi-label">${escapeHtml(div.name)}</div>
          <div class="kpi-unit">client${clients.length !== 1 ? 's' : ''}</div>
          ${clients.length > 0 ? `
            <div class="division-client-list">
              ${clients.slice(0, 5).map(c => `
                <a href="#" class="division-client-link" data-client-id="${c.id}">${escapeHtml(c.name)}</a>
              `).join('')}
              ${clients.length > 5 ? `<span class="division-more">+${clients.length - 5} more</span>` : ''}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    let unassignedHtml = '';
    if (totalUnassigned > 0) {
      unassignedHtml = `
        <div class="home-section">
          <h2 class="section-title">Unassigned Items</h2>
          <p class="section-description">These items were created before the division/client structure. Assign them to a client to organize them.</p>
          <div class="unassigned-summary">
            ${unassignedRequests.length > 0 ? `<span class="unassigned-item">Requests: <strong>${unassignedRequests.length}</strong></span>` : ''}
            ${unassignedProgress.length > 0 ? `<span class="unassigned-item">In Progress: <strong>${unassignedProgress.length}</strong></span>` : ''}
            ${unassignedReports.length > 0 ? `<span class="unassigned-item">Reports: <strong>${unassignedReports.length}</strong></span>` : ''}
          </div>
        </div>
      `;
    }

    elements.mainContent.innerHTML = `
      <div class="home-dashboard">
        <div class="home-section">
          <h2 class="section-title">Divisions</h2>
          <div class="kpi-grid">
            ${divisionCardsHtml}
          </div>
        </div>
        ${unassignedHtml}
        <div class="home-section">
          <div class="home-welcome">
            <p>Select a client from the sidebar to view their reports, dashboards, and oversight items. Use <strong>Manage Clients</strong> to add new clients.</p>
          </div>
        </div>
      </div>
    `;

    // Bind client links within division cards
    elements.mainContent.querySelectorAll('[data-client-id]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        AppRouter.selectClient(link.dataset.clientId);
      });
    });

    // Bind division card clicks to expand
    elements.mainContent.querySelectorAll('.division-summary-card').forEach(card => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        if (e.target.closest('[data-client-id]')) return; // Don't fire on client links
        const divId = card.dataset.divisionId;
        const state = AppRouter.getState();
        if (!state.expandedDivisions.includes(divId)) {
          AppRouter.toggleDivision(divId);
        }
      });
    });
  }

  // =====================
  // CLIENT VIEW (ZONE TABS)
  // =====================

  function renderClientView(clientId, activeZone) {
    const client = DataStore.getClientById(clientId);
    if (!client) {
      AppRouter.goHome();
      return;
    }

    const division = DataStore.getDivisionById(client.divisionId);

    elements.pageTitle.textContent = client.name;
    elements.pageSubtitle.textContent = division ? division.name : '';

    elements.mainContent.innerHTML = `
      <div class="client-view">
        <div class="zone-tabs" role="tablist">
          <button class="zone-tab ${activeZone === 1 ? 'active' : ''}" data-zone="1" role="tab"
                  aria-selected="${activeZone === 1}">Reports & Documents</button>
          <button class="zone-tab ${activeZone === 2 ? 'active' : ''}" data-zone="2" role="tab"
                  aria-selected="${activeZone === 2}">Performance Monitoring</button>
          <button class="zone-tab ${activeZone === 3 ? 'active' : ''}" data-zone="3" role="tab"
                  aria-selected="${activeZone === 3}">Controls & Oversight</button>
        </div>
        <div class="zone-content" id="zone-content" role="tabpanel">
        </div>
      </div>
    `;

    // Bind zone tab clicks
    elements.mainContent.querySelectorAll('.zone-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        AppRouter.setActiveZone(parseInt(tab.dataset.zone, 10));
      });
    });

    // Render active zone
    const zoneContent = document.getElementById('zone-content');
    switch (activeZone) {
      case 1:
        ZoneRenderer.renderZone1(zoneContent, clientId);
        break;
      case 2:
        ZoneRenderer.renderZone2(zoneContent, clientId);
        break;
      case 3:
        ZoneRenderer.renderZone3(zoneContent, clientId);
        break;
    }
  }

  // =====================
  // CLIENT MANAGER
  // =====================

  function renderClientManager() {
    elements.pageTitle.textContent = 'Manage Clients';
    elements.pageSubtitle.textContent = '';

    const divisions = DataStore.getDivisions();

    let html = `<div class="client-manager">`;

    html += `
      <div class="section-header">
        <h2 class="section-title">Add New Client</h2>
      </div>
      <form id="add-client-form" class="chart-card form-card" style="margin-bottom: 28px;">
        <div class="form-row">
          <div class="form-group">
            <label for="new-client-name">Client Name</label>
            <input type="text" id="new-client-name" name="name" placeholder="Enter client name..." required>
          </div>
          <div class="form-group">
            <label for="new-client-division">Division</label>
            <select id="new-client-division" name="divisionId" required>
              ${divisions.map(d => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-primary">Add Client</button>
        </div>
      </form>
    `;

    // List clients grouped by division
    divisions.forEach(div => {
      const clients = DataStore.getClientsByDivision(div.id);
      html += `
        <div class="client-manager-section">
          <h3 class="report-group-title">${escapeHtml(div.name)}</h3>
          ${clients.length > 0 ? `
            <div class="client-list">
              ${clients.map(c => `
                <div class="client-list-item chart-card">
                  <div class="client-list-info">
                    <span class="client-list-name">${escapeHtml(c.name)}</span>
                    <span class="client-list-date">Added ${formatDate(c.dateCreated)}</span>
                  </div>
                  <div class="client-list-actions">
                    <button class="btn-link" data-action="view-client" data-client-id="${c.id}">
                      View
                    </button>
                    <button class="btn-icon btn-danger" data-action="delete-client" data-client-id="${c.id}"
                            aria-label="Delete client" title="Delete this client">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="empty-state">No clients in this division yet.</div>
          `}
        </div>
      `;
    });

    html += `</div>`;
    elements.mainContent.innerHTML = html;

    // Bind add client form
    const addForm = document.getElementById('add-client-form');
    if (addForm) {
      addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('new-client-name').value;
        const divisionId = document.getElementById('new-client-division').value;
        DataStore.addClient({ name, divisionId });
        renderClientManager();
        renderSidebar();
      });
    }

    // Bind client actions
    elements.mainContent.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      if (btn.dataset.action === 'view-client') {
        e.preventDefault();
        AppRouter.selectClient(btn.dataset.clientId);
      } else if (btn.dataset.action === 'delete-client') {
        const clientId = btn.dataset.clientId;
        const client = DataStore.getClientById(clientId);
        if (client && confirm(`Delete client "${client.name}"? This won't delete associated items, but they will become unassigned.`)) {
          DataStore.deleteClient(clientId);
          renderClientManager();
          renderSidebar();
        }
      }
    });
  }

  // =====================
  // UTILITY FUNCTIONS
  // =====================

  function updateProjectSuggestions() {
    const projects = DataStore.getUniqueProjects();
    if (elements.projectSuggestions) {
      elements.projectSuggestions.innerHTML = projects
        .map(p => `<option value="${escapeHtml(p)}">`)
        .join('');
    }
  }

  function formatDate(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // =====================
  // PUBLIC API
  // =====================
  return {
    init,
    render
  };
})();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', App.init);
