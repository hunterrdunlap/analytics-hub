/**
 * Analytics Hub - Zone Renderers
 * Renders Zone 1 (Reports & Documents), Zone 2 (Performance Monitoring),
 * and Zone 3 (Controls & Oversight) content for a selected client.
 */

const ZoneRenderer = (function() {
  'use strict';

  // =====================
  // SHARED UTILITIES
  // =====================

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
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

  function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function renderEmptyState(message) {
    return `<div class="empty-state">${escapeHtml(message)}</div>`;
  }

  // SVG icon helpers
  const icons = {
    user: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
    calendar: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
    clock: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
    play: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>',
    check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    trash: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
    externalLink: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>',
    search: '<svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>'
  };

  // =====================
  // ZONE 1: REPORTS & DOCUMENTS
  // =====================

  function renderZone1(container, clientId) {
    const state = AppRouter.getState();
    const legalDocs = DataStore.getDocuments(clientId, 'legal');
    const pricingDocs = DataStore.getDocuments(clientId, 'pricing');
    const recurringDocs = DataStore.getDocuments(clientId, 'recurring');
    let reports = DataStore.getReportsByClient(clientId, state.showActiveProjectsOnly);

    // Apply reports search
    if (state.reportsSearchTerm) {
      reports = DataStore.filterBySearchTerm(reports, state.reportsSearchTerm, ['title', 'projectName', 'description']);
    }
    if (state.globalSearchTerm) {
      reports = DataStore.filterBySearchTerm(reports, state.globalSearchTerm, ['title', 'projectName', 'description']);
    }

    // Group reports by project
    const grouped = {};
    reports.forEach(report => {
      if (!grouped[report.projectName]) grouped[report.projectName] = [];
      grouped[report.projectName].push(report);
    });
    const projectNames = Object.keys(grouped).sort();

    container.innerHTML = `
      <div class="zone-layout">
        <div class="section-header">
          <h2 class="section-title">Reports & Documents</h2>
          <div class="section-controls">
            <button class="toggle-form-btn" id="toggle-document-form" aria-expanded="false">+ Add Document</button>
            <button class="toggle-form-btn" id="toggle-report-form" aria-expanded="false">+ Add Report</button>
          </div>
        </div>

        <!-- Add Document Form -->
        <div class="form-container" id="document-form-container" hidden>
          <form id="new-document-form" class="chart-card form-card">
            <h3 class="form-title">Add Document</h3>
            <div class="form-row">
              <div class="form-group">
                <label for="doc-title">Title</label>
                <input type="text" id="doc-title" name="title" placeholder="Document title..." required>
              </div>
              <div class="form-group">
                <label for="doc-category">Category</label>
                <select id="doc-category" name="category" required>
                  <option value="legal">Legal Document</option>
                  <option value="pricing">Original Pricing Model</option>
                  <option value="recurring">Recurring Report</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label for="doc-description">Description</label>
              <textarea id="doc-description" name="description" rows="2" placeholder="Brief description..."></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="doc-link">Link URL</label>
                <input type="url" id="doc-link" name="linkUrl" placeholder="https://...">
              </div>
              <div class="form-group">
                <label for="doc-source">Source</label>
                <select id="doc-source" name="source">
                  <option value="manual">Manual Upload</option>
                  <option value="client-email">Client Email</option>
                  <option value="nelnet-created">Nelnet Created</option>
                </select>
              </div>
            </div>
            <div class="form-actions">
              <button type="button" class="btn-secondary" data-cancel="document">Cancel</button>
              <button type="submit" class="btn-primary">Add Document</button>
            </div>
          </form>
        </div>

        <!-- Add Report Form -->
        <div class="form-container" id="report-form-container" hidden>
          <form id="new-report-form" class="chart-card form-card">
            <h3 class="form-title">Add New Report</h3>
            <div class="form-group">
              <label for="report-title">Report Title</label>
              <input type="text" id="report-title" name="title" placeholder="e.g., Monthly Revenue Report - January 2026" required>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="report-project">Project Name</label>
                <input type="text" id="report-project" name="projectName" list="project-suggestions" placeholder="Enter or select project..." required>
              </div>
              <div class="form-group">
                <label for="report-date">Date Published</label>
                <input type="date" id="report-date" name="datePublished" required>
              </div>
            </div>
            <div class="form-group">
              <label for="report-description">Description</label>
              <textarea id="report-description" name="description" rows="2" placeholder="Brief summary of the report..."></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="report-link">Link URL</label>
                <input type="url" id="report-link" name="linkUrl" placeholder="https://...">
              </div>
              <div class="form-group">
                <label for="report-source">Source</label>
                <select id="report-source" name="source">
                  <option value="nelnet-created">Nelnet Created</option>
                  <option value="client-email">Client Email</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" id="report-active" name="isActive" checked>
                <span>Active project</span>
              </label>
            </div>
            <div class="form-actions">
              <button type="button" class="btn-secondary" data-cancel="report">Cancel</button>
              <button type="submit" class="btn-primary">Add Report</button>
            </div>
          </form>
        </div>

        <!-- Legal Documents -->
        <div class="doc-section">
          <h3 class="report-group-title">Legal Documents</h3>
          <div class="report-grid">
            ${legalDocs.length > 0 ? legalDocs.map(renderDocumentCard).join('') : renderEmptyState('No legal documents yet. Add one above.')}
          </div>
        </div>

        <!-- Original Pricing Model -->
        <div class="doc-section">
          <h3 class="report-group-title">Original Pricing Model</h3>
          <div class="report-grid">
            ${pricingDocs.length > 0 ? pricingDocs.map(renderDocumentCard).join('') : renderEmptyState('No pricing documents yet. Add one above.')}
          </div>
        </div>

        <!-- Recurring Reporting -->
        <div class="doc-section">
          <h3 class="report-group-title">Recurring Reporting</h3>
          <div class="section-controls" style="margin-bottom: 16px;">
            <label class="toggle-label">
              <input type="checkbox" id="active-projects-toggle" ${state.showActiveProjectsOnly ? 'checked' : ''}>
              <span class="toggle-switch"></span>
              <span class="toggle-text">Active only</span>
            </label>
            <div class="search-container search-small">
              ${icons.search}
              <input type="search" id="reports-search" class="search-input" placeholder="Filter reports..." value="${escapeHtml(state.reportsSearchTerm)}">
            </div>
          </div>

          ${recurringDocs.length > 0 ? `
            <div class="report-grid" style="margin-bottom: 20px;">
              ${recurringDocs.map(renderDocumentCard).join('')}
            </div>
          ` : ''}

          <div class="reports-container" id="reports-container">
            ${projectNames.length > 0
              ? projectNames.map(project => renderReportGroup(project, grouped[project])).join('')
              : (recurringDocs.length === 0 ? renderEmptyState('No recurring reports yet. Add a report or document above.') : '')}
          </div>
        </div>
      </div>
    `;

    // Set default date
    const reportDateInput = document.getElementById('report-date');
    if (reportDateInput && !reportDateInput.value) {
      reportDateInput.value = new Date().toISOString().split('T')[0];
    }

    bindZone1Events(container, clientId);
  }

  function renderDocumentCard(doc) {
    const sourceLabels = { 'client-email': 'Client Email', 'nelnet-created': 'Nelnet Created', 'manual': 'Manual' };
    const sourceLabel = sourceLabels[doc.source] || doc.source;

    return `
      <article class="report-card kpi-card" data-id="${doc.id}" data-type="document" data-entity-type="document" data-entity-id="${doc.id}">
        <div class="report-card-header">
          <span class="report-title">${escapeHtml(doc.title)}</span>
        </div>
        ${doc.description ? `<p class="card-description">${escapeHtml(truncateText(doc.description, 100))}</p>` : ''}
        <div class="card-meta">
          <span class="meta-item">
            ${icons.calendar}
            ${formatDate(doc.dateAdded)}
          </span>
          <span class="source-badge source-${doc.source}">${escapeHtml(sourceLabel)}</span>
        </div>
        <div class="card-actions">
          ${doc.linkUrl ? `
            <a href="${escapeHtml(doc.linkUrl)}" class="btn-link" target="_blank" rel="noopener noreferrer">
              ${icons.externalLink}
              View Document
            </a>
          ` : ''}
          <button class="btn-icon btn-danger" data-action="delete-document" data-id="${doc.id}"
                  aria-label="Delete document" title="Delete this document">
            ${icons.trash}
          </button>
        </div>
      </article>
    `;
  }

  function renderReportGroup(projectName, reports) {
    return `
      <div class="report-group" data-project="${escapeHtml(projectName)}">
        <h4 class="report-subgroup-title">${escapeHtml(projectName)}</h4>
        <div class="report-grid">
          ${reports.map(renderReportCard).join('')}
        </div>
      </div>
    `;
  }

  function renderReportCard(report) {
    const dateFormatted = formatDate(report.datePublished);
    const descriptionTruncated = truncateText(report.description, 100);

    return `
      <article class="report-card kpi-card" data-id="${report.id}" data-type="report" data-entity-type="report" data-entity-id="${report.id}">
        <div class="report-card-header">
          <span class="report-title">${escapeHtml(report.title)}</span>
        </div>
        ${descriptionTruncated ? `<p class="card-description">${escapeHtml(descriptionTruncated)}</p>` : ''}
        <div class="card-meta">
          <span class="meta-item">
            ${icons.calendar}
            ${dateFormatted}
          </span>
        </div>
        <div class="card-actions">
          ${report.linkUrl ? `
            <a href="${escapeHtml(report.linkUrl)}" class="btn-link" target="_blank" rel="noopener noreferrer">
              ${icons.externalLink}
              View Report
            </a>
          ` : ''}
          <button class="btn-icon btn-danger" data-action="delete-report" data-id="${report.id}"
                  aria-label="Delete report" title="Delete this report">
            ${icons.trash}
          </button>
        </div>
      </article>
    `;
  }

  function bindZone1Events(container, clientId) {
    // Toggle forms
    const toggleDocBtn = container.querySelector('#toggle-document-form');
    const toggleRptBtn = container.querySelector('#toggle-report-form');
    const docFormContainer = container.querySelector('#document-form-container');
    const rptFormContainer = container.querySelector('#report-form-container');

    if (toggleDocBtn) {
      toggleDocBtn.addEventListener('click', () => {
        docFormContainer.hidden = !docFormContainer.hidden;
        toggleDocBtn.setAttribute('aria-expanded', !docFormContainer.hidden);
        if (!docFormContainer.hidden) {
          const firstInput = docFormContainer.querySelector('input');
          if (firstInput) setTimeout(() => firstInput.focus(), 50);
        }
      });
    }

    if (toggleRptBtn) {
      toggleRptBtn.addEventListener('click', () => {
        rptFormContainer.hidden = !rptFormContainer.hidden;
        toggleRptBtn.setAttribute('aria-expanded', !rptFormContainer.hidden);
        if (!rptFormContainer.hidden) {
          const firstInput = rptFormContainer.querySelector('input');
          if (firstInput) setTimeout(() => firstInput.focus(), 50);
        }
      });
    }

    // Cancel buttons
    container.querySelectorAll('[data-cancel]').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.cancel;
        if (type === 'document') { docFormContainer.hidden = true; toggleDocBtn.setAttribute('aria-expanded', 'false'); }
        if (type === 'report') { rptFormContainer.hidden = true; toggleRptBtn.setAttribute('aria-expanded', 'false'); }
      });
    });

    // Document form submit
    const docForm = container.querySelector('#new-document-form');
    if (docForm) {
      docForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const client = DataStore.getClientById(clientId);
        DataStore.addDocument({
          clientId: clientId,
          category: document.getElementById('doc-category').value,
          title: document.getElementById('doc-title').value,
          description: document.getElementById('doc-description').value,
          linkUrl: document.getElementById('doc-link').value,
          source: document.getElementById('doc-source').value
        });
        renderZone1(container, clientId);
      });
    }

    // Report form submit
    const rptForm = container.querySelector('#new-report-form');
    if (rptForm) {
      rptForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const client = DataStore.getClientById(clientId);
        DataStore.addReport({
          clientId: clientId,
          divisionId: client ? client.divisionId : null,
          title: document.getElementById('report-title').value,
          projectName: document.getElementById('report-project').value,
          datePublished: document.getElementById('report-date').value,
          description: document.getElementById('report-description').value,
          linkUrl: document.getElementById('report-link').value,
          isActive: document.getElementById('report-active').checked,
          category: 'recurring'
        });
        renderZone1(container, clientId);
      });
    }

    // Active toggle
    const activeToggle = container.querySelector('#active-projects-toggle');
    if (activeToggle) {
      activeToggle.addEventListener('change', (e) => {
        AppRouter.setActiveProjectsOnly(e.target.checked);
      });
    }

    // Reports search
    const reportsSearch = container.querySelector('#reports-search');
    if (reportsSearch) {
      reportsSearch.addEventListener('input', debounce((e) => {
        AppRouter.setReportsSearch(e.target.value.trim());
      }, 200));
    }

    // Delete actions and card click (event delegation)
    container.addEventListener('click', (e) => {
      // Handle action buttons first
      const btn = e.target.closest('[data-action]');
      if (btn) {
        const action = btn.dataset.action;
        const id = btn.dataset.id;

        if (action === 'delete-document') {
          if (confirm('Delete this document?')) {
            DataStore.deleteDocument(id);
            renderZone1(container, clientId);
          }
        } else if (action === 'delete-report') {
          if (confirm('Delete this report?')) {
            DataStore.deleteReport(id);
            renderZone1(container, clientId);
          }
        }
        return;
      }

      // Skip links and interactive elements
      if (e.target.closest('a') || e.target.closest('select') || e.target.closest('button')) return;

      // Open modal on card click
      const card = e.target.closest('[data-entity-type]');
      if (card) {
        App.openModal(card.dataset.entityType, card.dataset.entityId, clientId);
      }
    });
  }

  // =====================
  // ZONE 2: PERFORMANCE MONITORING
  // =====================

  function renderZone2(container, clientId) {
    const perfLinks = DataStore.getDashboardLinks(clientId, 'performance');
    const valLinks = DataStore.getDashboardLinks(clientId).filter(l => l.type === 'valuation' || l.type === 'impairment');

    container.innerHTML = `
      <div class="zone-layout">
        <div class="section-header">
          <h2 class="section-title">Performance Monitoring</h2>
          <button class="toggle-form-btn" id="toggle-dashboard-form" aria-expanded="false">+ Add Dashboard Link</button>
        </div>

        <!-- Add Dashboard Link Form -->
        <div class="form-container" id="dashboard-form-container" hidden>
          <form id="new-dashboard-form" class="chart-card form-card">
            <h3 class="form-title">Add Dashboard Link</h3>
            <div class="form-row">
              <div class="form-group">
                <label for="dash-title">Title</label>
                <input type="text" id="dash-title" name="title" placeholder="Dashboard name..." required>
              </div>
              <div class="form-group">
                <label for="dash-type">Type</label>
                <select id="dash-type" name="type" required>
                  <option value="performance">Performance Dashboard</option>
                  <option value="valuation">Valuation Support</option>
                  <option value="impairment">Impairment Support</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label for="dash-url">Dashboard URL</label>
              <input type="url" id="dash-url" name="url" placeholder="https://..." required>
            </div>
            <div class="form-group">
              <label for="dash-description">Description</label>
              <textarea id="dash-description" name="description" rows="2" placeholder="Brief description of this dashboard..."></textarea>
            </div>
            <div class="form-actions">
              <button type="button" class="btn-secondary" data-cancel="dashboard">Cancel</button>
              <button type="submit" class="btn-primary">Add Dashboard Link</button>
            </div>
          </form>
        </div>

        <!-- Performance Dashboards -->
        <div class="doc-section">
          <h3 class="report-group-title">Performance Dashboards</h3>
          <div class="report-grid">
            ${perfLinks.length > 0 ? perfLinks.map(renderDashboardCard).join('') : renderEmptyState('No performance dashboards linked yet.')}
          </div>
        </div>

        <!-- Valuation & Impairment Support -->
        <div class="doc-section">
          <h3 class="report-group-title">Valuation & Impairment Support</h3>
          <div class="report-grid">
            ${valLinks.length > 0 ? valLinks.map(renderDashboardCard).join('') : renderEmptyState('No valuation or impairment documents yet.')}
          </div>
        </div>
      </div>
    `;

    bindZone2Events(container, clientId);
  }

  function renderDashboardCard(link) {
    const typeLabels = { performance: 'Performance', valuation: 'Valuation', impairment: 'Impairment' };
    const typeLabel = typeLabels[link.type] || link.type;

    return `
      <article class="report-card kpi-card dashboard-card" data-id="${link.id}" data-entity-type="dashboard" data-entity-id="${link.id}">
        <div class="card-header">
          <span class="project-name">${escapeHtml(link.title)}</span>
          <span class="type-badge type-${link.type}">${escapeHtml(typeLabel)}</span>
        </div>
        ${link.description ? `<p class="card-description">${escapeHtml(truncateText(link.description, 120))}</p>` : ''}
        <div class="card-meta">
          <span class="meta-item">
            ${icons.calendar}
            Added ${formatDate(link.dateAdded)}
          </span>
        </div>
        <div class="card-actions">
          ${link.url ? `
            <a href="${escapeHtml(link.url)}" class="btn-link" target="_blank" rel="noopener noreferrer">
              ${icons.externalLink}
              Open Dashboard
            </a>
          ` : ''}
          <button class="btn-icon btn-danger" data-action="delete-dashboard" data-id="${link.id}"
                  aria-label="Delete dashboard link" title="Delete this dashboard link">
            ${icons.trash}
          </button>
        </div>
      </article>
    `;
  }

  function bindZone2Events(container, clientId) {
    const toggleBtn = container.querySelector('#toggle-dashboard-form');
    const formContainer = container.querySelector('#dashboard-form-container');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        formContainer.hidden = !formContainer.hidden;
        toggleBtn.setAttribute('aria-expanded', !formContainer.hidden);
        if (!formContainer.hidden) {
          const firstInput = formContainer.querySelector('input');
          if (firstInput) setTimeout(() => firstInput.focus(), 50);
        }
      });
    }

    // Cancel
    container.querySelectorAll('[data-cancel]').forEach(btn => {
      btn.addEventListener('click', () => {
        formContainer.hidden = true;
        toggleBtn.setAttribute('aria-expanded', 'false');
      });
    });

    // Form submit
    const form = container.querySelector('#new-dashboard-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        DataStore.addDashboardLink({
          clientId: clientId,
          title: document.getElementById('dash-title').value,
          url: document.getElementById('dash-url').value,
          type: document.getElementById('dash-type').value,
          description: document.getElementById('dash-description').value
        });
        renderZone2(container, clientId);
      });
    }

    // Delete actions and card click
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action="delete-dashboard"]');
      if (btn) {
        if (confirm('Delete this dashboard link?')) {
          DataStore.deleteDashboardLink(btn.dataset.id);
          renderZone2(container, clientId);
        }
        return;
      }

      // Skip links and interactive elements
      if (e.target.closest('a') || e.target.closest('select') || e.target.closest('button')) return;

      // Open modal on card click
      const card = e.target.closest('[data-entity-type]');
      if (card) {
        App.openModal(card.dataset.entityType, card.dataset.entityId, clientId);
      }
    });
  }

  // =====================
  // ZONE 3: CONTROLS & OVERSIGHT
  // =====================

  function renderZone3(container, clientId) {
    const state = AppRouter.getState();
    const controls = DataStore.getControlItems(clientId);
    let requests = DataStore.getRequestsByClient(clientId);
    let inProgress = DataStore.getInProgressByClient(clientId);

    // Apply global search
    if (state.globalSearchTerm) {
      requests = DataStore.filterBySearchTerm(requests, state.globalSearchTerm, ['projectName', 'description', 'requester']);
      inProgress = DataStore.filterBySearchTerm(inProgress, state.globalSearchTerm, ['projectName', 'taskDescription', 'requester']);
    }

    container.innerHTML = `
      <div class="zone-layout zone3-layout">

        <!-- Recurring Controls Section -->
        <section class="hub-section">
          <div class="section-header">
            <h2 class="section-title">Recurring Controls & Oversight</h2>
            <button class="toggle-form-btn" id="toggle-control-form" aria-expanded="false">+ Add Control Item</button>
          </div>

          <div class="form-container" id="control-form-container" hidden>
            <form id="new-control-form" class="chart-card form-card">
              <h3 class="form-title">Add Control Item</h3>
              <div class="form-group">
                <label for="ctrl-title">Control Title</label>
                <input type="text" id="ctrl-title" name="title" placeholder="e.g., Monthly NAV Reconciliation" required>
              </div>
              <div class="form-group">
                <label for="ctrl-description">Description</label>
                <textarea id="ctrl-description" name="description" rows="2" placeholder="What needs to be done..."></textarea>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="ctrl-assignee">Assignee</label>
                  <input type="text" id="ctrl-assignee" name="assignee" placeholder="Person responsible">
                </div>
                <div class="form-group">
                  <label for="ctrl-frequency">Frequency</label>
                  <select id="ctrl-frequency" name="frequency" required>
                    <option value="weekly">Weekly</option>
                    <option value="monthly" selected>Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annually">Annually</option>
                    <option value="ad-hoc">Ad-Hoc</option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="ctrl-next-due">Next Due Date</label>
                  <input type="date" id="ctrl-next-due" name="nextDue">
                </div>
                <div class="form-group">
                  <label for="ctrl-status">Status</label>
                  <select id="ctrl-status" name="status" required>
                    <option value="current" selected>Current</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>
              <div class="form-actions">
                <button type="button" class="btn-secondary" data-cancel="control">Cancel</button>
                <button type="submit" class="btn-primary">Add Control Item</button>
              </div>
            </form>
          </div>

          <div class="control-list" id="control-list">
            ${controls.length > 0 ? controls.map(renderControlCard).join('') : renderEmptyState('No control items defined yet. Add one above.')}
          </div>
        </section>

        <!-- Requests Section (client-scoped) -->
        <section class="hub-section">
          <div class="section-header">
            <h2 class="section-title">Requests</h2>
            <span class="pill">${requests.length}</span>
            <button class="toggle-form-btn" id="toggle-request-form" aria-expanded="false">+ New Request</button>
          </div>

          <div class="form-container" id="request-form-container" hidden>
            <form id="new-request-form" class="chart-card form-card">
              <h3 class="form-title">Submit New Request</h3>
              <div class="form-group">
                <label for="request-project">Project Name</label>
                <input type="text" id="request-project" name="projectName" list="project-suggestions" placeholder="Enter or select project..." required>
              </div>
              <div class="form-group">
                <label for="request-description">Description</label>
                <textarea id="request-description" name="description" rows="3" placeholder="Describe what you need..." required></textarea>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="request-requester">Requester Name</label>
                  <input type="text" id="request-requester" name="requester" placeholder="Your name" required>
                </div>
                <div class="form-group">
                  <label for="request-urgency">Urgency</label>
                  <select id="request-urgency" name="urgency" required>
                    <option value="low">Low</option>
                    <option value="medium" selected>Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div class="form-actions">
                <button type="button" class="btn-secondary" data-cancel="request">Cancel</button>
                <button type="submit" class="btn-primary">Submit Request</button>
              </div>
            </form>
          </div>

          <div class="request-queue" id="request-queue">
            ${requests.length > 0 ? requests.map(renderRequestCard).join('') : renderEmptyState('No requests for this client.')}
          </div>
        </section>

        <!-- In Progress Section (client-scoped) -->
        <section class="hub-section">
          <div class="section-header">
            <h2 class="section-title">In Progress</h2>
            <span class="pill">${inProgress.length}</span>
            <button class="toggle-form-btn" id="toggle-progress-form" aria-expanded="false">+ Add Item</button>
          </div>

          <div class="form-container" id="progress-form-container" hidden>
            <form id="new-progress-form" class="chart-card form-card">
              <h3 class="form-title">Add In Progress Item</h3>
              <div class="form-group">
                <label for="progress-project">Project Name</label>
                <input type="text" id="progress-project" name="projectName" list="project-suggestions" placeholder="Enter or select project..." required>
              </div>
              <div class="form-group">
                <label for="progress-description">Task Description</label>
                <textarea id="progress-description" name="taskDescription" rows="2" placeholder="What are you working on..." required></textarea>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="progress-requester">Requester</label>
                  <input type="text" id="progress-requester" name="requester" placeholder="Who requested this" required>
                </div>
                <div class="form-group">
                  <label for="progress-status">Status</label>
                  <select id="progress-status" name="status" required>
                    <option value="not-started">Not Started</option>
                    <option value="in-progress" selected>In Progress</option>
                    <option value="in-review">In Review</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label for="progress-target-date">Target Completion Date</label>
                <input type="date" id="progress-target-date" name="targetCompletionDate">
              </div>
              <div class="form-actions">
                <button type="button" class="btn-secondary" data-cancel="progress">Cancel</button>
                <button type="submit" class="btn-primary">Add Item</button>
              </div>
            </form>
          </div>

          <div class="progress-list" id="progress-list">
            ${inProgress.length > 0 ? inProgress.map(renderProgressCard).join('') : renderEmptyState('No items in progress for this client.')}
          </div>
        </section>
      </div>
    `;

    bindZone3Events(container, clientId);
  }

  function renderControlCard(item) {
    const frequencyLabels = { weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly', annually: 'Annually', 'ad-hoc': 'Ad-Hoc' };
    const statusLabels = { current: 'Current', overdue: 'Overdue', upcoming: 'Upcoming' };

    return `
      <article class="control-card chart-card" data-id="${item.id}" data-entity-type="control" data-entity-id="${item.id}">
        <div class="card-header">
          <span class="project-name">${escapeHtml(item.title)}</span>
          <div class="control-badges">
            <span class="frequency-badge">${escapeHtml(frequencyLabels[item.frequency] || item.frequency)}</span>
            <span class="control-status-badge control-status-${item.status}">${escapeHtml(statusLabels[item.status] || item.status)}</span>
          </div>
        </div>
        ${item.description ? `<p class="card-description">${escapeHtml(truncateText(item.description, 150))}</p>` : ''}
        <div class="card-meta">
          ${item.assignee ? `<span class="meta-item">${icons.user} ${escapeHtml(item.assignee)}</span>` : ''}
          ${item.nextDue ? `<span class="meta-item">${icons.clock} Due: ${formatDate(item.nextDue)}</span>` : ''}
          ${item.lastCompleted ? `<span class="meta-item">${icons.check} Last: ${formatDate(item.lastCompleted)}</span>` : ''}
        </div>
        <div class="card-actions">
          <button class="btn-icon btn-complete" data-action="complete-control" data-id="${item.id}"
                  aria-label="Mark as completed" title="Mark as completed">
            ${icons.check}
          </button>
          <button class="btn-icon btn-danger" data-action="delete-control" data-id="${item.id}"
                  aria-label="Delete control item" title="Delete this control item">
            ${icons.trash}
          </button>
        </div>
      </article>
    `;
  }

  function renderRequestCard(request) {
    const dateFormatted = formatDate(request.dateSubmitted);
    const descriptionTruncated = truncateText(request.description, 120);

    return `
      <article class="request-card kpi-card" data-id="${request.id}" data-urgency="${request.urgency}" data-entity-type="request" data-entity-id="${request.id}">
        <div class="card-header">
          <span class="project-name">${escapeHtml(request.projectName)}</span>
          <span class="urgency-badge urgency-${request.urgency}">${capitalize(request.urgency)}</span>
        </div>
        <p class="card-description">${escapeHtml(descriptionTruncated)}</p>
        <div class="card-meta">
          <span class="meta-item">${icons.user} ${escapeHtml(request.requester)}</span>
          <span class="meta-item">${icons.calendar} ${dateFormatted}</span>
        </div>
        <div class="card-actions">
          <button class="btn-icon btn-promote" data-action="promote" data-id="${request.id}"
                  aria-label="Move to In Progress" title="Start work on this request">
            ${icons.play}
          </button>
          <button class="btn-icon btn-danger" data-action="delete-request" data-id="${request.id}"
                  aria-label="Delete request" title="Delete this request">
            ${icons.trash}
          </button>
        </div>
      </article>
    `;
  }

  function renderProgressCard(item) {
    const targetDateFormatted = item.targetCompletionDate
      ? formatDate(item.targetCompletionDate)
      : 'No target';

    return `
      <article class="progress-card chart-card" data-id="${item.id}" data-entity-type="progress" data-entity-id="${item.id}">
        <div class="card-header">
          <span class="project-name">${escapeHtml(item.projectName)}</span>
          <span class="target-date">${icons.clock} ${targetDateFormatted}</span>
        </div>
        <p class="card-description">${escapeHtml(item.taskDescription)}</p>
        <div class="card-meta">
          <span class="meta-item">${icons.user} ${escapeHtml(item.requester)}</span>
        </div>
        <div class="status-control">
          <label class="status-label" for="status-${item.id}">Status:</label>
          <select class="status-select" id="status-${item.id}" data-id="${item.id}">
            <option value="not-started" ${item.status === 'not-started' ? 'selected' : ''}>Not Started</option>
            <option value="in-progress" ${item.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
            <option value="in-review" ${item.status === 'in-review' ? 'selected' : ''}>In Review</option>
          </select>
        </div>
        <div class="card-actions">
          <button class="btn-icon btn-complete" data-action="complete-progress" data-id="${item.id}"
                  aria-label="Mark complete and remove" title="Mark as complete">
            ${icons.check}
          </button>
          <button class="btn-icon btn-danger" data-action="delete-progress" data-id="${item.id}"
                  aria-label="Delete item" title="Delete this item">
            ${icons.trash}
          </button>
        </div>
      </article>
    `;
  }

  function bindZone3Events(container, clientId) {
    // Toggle form helpers
    function setupToggle(toggleId, containerId) {
      const btn = container.querySelector('#' + toggleId);
      const fc = container.querySelector('#' + containerId);
      if (btn && fc) {
        btn.addEventListener('click', () => {
          fc.hidden = !fc.hidden;
          btn.setAttribute('aria-expanded', !fc.hidden);
          if (!fc.hidden) {
            const firstInput = fc.querySelector('input, textarea');
            if (firstInput) setTimeout(() => firstInput.focus(), 50);
          }
        });
      }
    }

    setupToggle('toggle-control-form', 'control-form-container');
    setupToggle('toggle-request-form', 'request-form-container');
    setupToggle('toggle-progress-form', 'progress-form-container');

    // Cancel buttons
    container.querySelectorAll('[data-cancel]').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.cancel;
        const fcMap = {
          control: 'control-form-container',
          request: 'request-form-container',
          progress: 'progress-form-container'
        };
        const fc = container.querySelector('#' + fcMap[type]);
        if (fc) fc.hidden = true;
      });
    });

    // Control form submit
    const controlForm = container.querySelector('#new-control-form');
    if (controlForm) {
      controlForm.addEventListener('submit', (e) => {
        e.preventDefault();
        DataStore.addControlItem({
          clientId: clientId,
          title: document.getElementById('ctrl-title').value,
          description: document.getElementById('ctrl-description').value,
          assignee: document.getElementById('ctrl-assignee').value,
          frequency: document.getElementById('ctrl-frequency').value,
          nextDue: document.getElementById('ctrl-next-due').value || null,
          status: document.getElementById('ctrl-status').value
        });
        renderZone3(container, clientId);
      });
    }

    // Request form submit
    const requestForm = container.querySelector('#new-request-form');
    if (requestForm) {
      requestForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const client = DataStore.getClientById(clientId);
        DataStore.addRequest({
          clientId: clientId,
          divisionId: client ? client.divisionId : null,
          projectName: document.getElementById('request-project').value,
          description: document.getElementById('request-description').value,
          requester: document.getElementById('request-requester').value,
          urgency: document.getElementById('request-urgency').value
        });
        renderZone3(container, clientId);
      });
    }

    // Progress form submit
    const progressForm = container.querySelector('#new-progress-form');
    if (progressForm) {
      progressForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const client = DataStore.getClientById(clientId);
        DataStore.addInProgressItem({
          clientId: clientId,
          divisionId: client ? client.divisionId : null,
          projectName: document.getElementById('progress-project').value,
          taskDescription: document.getElementById('progress-description').value,
          requester: document.getElementById('progress-requester').value,
          status: document.getElementById('progress-status').value,
          targetCompletionDate: document.getElementById('progress-target-date').value || null
        });
        renderZone3(container, clientId);
      });
    }

    // Status change (event delegation)
    container.addEventListener('change', (e) => {
      if (!e.target.classList.contains('status-select')) return;
      DataStore.updateInProgressStatus(e.target.dataset.id, e.target.value);
    });

    // Action buttons and card click (event delegation)
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (btn) {
        const action = btn.dataset.action;
        const id = btn.dataset.id;

        switch (action) {
          case 'delete-control':
            if (confirm('Delete this control item?')) {
              DataStore.deleteControlItem(id);
              renderZone3(container, clientId);
            }
            break;
          case 'complete-control':
            DataStore.updateControlItem(id, {
              lastCompleted: new Date().toISOString(),
              status: 'current'
            });
            renderZone3(container, clientId);
            break;
          case 'delete-request':
            if (confirm('Delete this request?')) {
              DataStore.deleteRequest(id);
              renderZone3(container, clientId);
            }
            break;
          case 'promote':
            const request = DataStore.getRequestById(id);
            if (request) {
              DataStore.addInProgressItem({
                projectName: request.projectName,
                taskDescription: request.description,
                requester: request.requester,
                status: 'not-started',
                targetCompletionDate: null,
                clientId: clientId,
                divisionId: request.divisionId
              });
              DataStore.deleteRequest(id);
              renderZone3(container, clientId);
            }
            break;
          case 'delete-progress':
            if (confirm('Delete this item?')) {
              DataStore.deleteInProgressItem(id);
              renderZone3(container, clientId);
            }
            break;
          case 'complete-progress':
            DataStore.deleteInProgressItem(id);
            renderZone3(container, clientId);
            break;
        }
        return;
      }

      // Skip links, selects, and buttons
      if (e.target.closest('a') || e.target.closest('select') || e.target.closest('button')) return;

      // Open modal on card click
      const card = e.target.closest('[data-entity-type]');
      if (card) {
        App.openModal(card.dataset.entityType, card.dataset.entityId, clientId);
      }
    });
  }

  // =====================
  // SHARED DEBOUNCE
  // =====================

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
    renderZone1,
    renderZone2,
    renderZone3
  };
})();
