/**
 * Analytics Hub - Application Logic
 * Handles UI rendering and event handling
 */

const App = (function() {
  'use strict';

  // DOM References (cached on init)
  let elements = {};

  // State
  let globalSearchTerm = '';
  let reportsSearchTerm = '';
  let showActiveProjectsOnly = true;

  // =====================
  // INITIALIZATION
  // =====================

  function init() {
    cacheElements();
    bindEvents();
    renderAll();
    updateNavCounts();
    setDefaultDate();
  }

  function cacheElements() {
    elements = {
      // Global
      globalSearch: document.getElementById('global-search'),

      // Requests
      requestFormContainer: document.getElementById('request-form-container'),
      toggleRequestFormBtn: document.getElementById('toggle-request-form'),
      newRequestForm: document.getElementById('new-request-form'),
      cancelRequestBtn: document.getElementById('cancel-request'),
      requestQueue: document.getElementById('request-queue'),
      projectSuggestions: document.getElementById('project-suggestions'),

      // In Progress
      progressFormContainer: document.getElementById('progress-form-container'),
      toggleProgressFormBtn: document.getElementById('toggle-progress-form'),
      newProgressForm: document.getElementById('new-progress-form'),
      cancelProgressBtn: document.getElementById('cancel-progress'),
      progressList: document.getElementById('progress-list'),

      // Reports
      reportFormContainer: document.getElementById('report-form-container'),
      toggleReportFormBtn: document.getElementById('toggle-report-form'),
      newReportForm: document.getElementById('new-report-form'),
      cancelReportBtn: document.getElementById('cancel-report'),
      reportsContainer: document.getElementById('reports-container'),
      reportsSearch: document.getElementById('reports-search'),
      activeProjectsToggle: document.getElementById('active-projects-toggle'),

      // Nav counts
      navRequestsCount: document.getElementById('nav-requests-count'),
      navProgressCount: document.getElementById('nav-progress-count'),
      navReportsCount: document.getElementById('nav-reports-count'),

      // Nav links
      navLinks: document.querySelectorAll('.nav-link[data-section]')
    };
  }

  function setDefaultDate() {
    // Set default date for report form to today
    const today = new Date().toISOString().split('T')[0];
    const reportDateInput = document.getElementById('report-date');
    if (reportDateInput) {
      reportDateInput.value = today;
    }
  }

  // =====================
  // EVENT BINDING
  // =====================

  function bindEvents() {
    // Global search
    elements.globalSearch.addEventListener('input', debounce(handleGlobalSearch, 200));

    // Toggle forms
    elements.toggleRequestFormBtn.addEventListener('click', () => toggleForm('request'));
    elements.toggleProgressFormBtn.addEventListener('click', () => toggleForm('progress'));
    elements.toggleReportFormBtn.addEventListener('click', () => toggleForm('report'));

    // Cancel buttons
    elements.cancelRequestBtn.addEventListener('click', () => hideForm('request'));
    elements.cancelProgressBtn.addEventListener('click', () => hideForm('progress'));
    elements.cancelReportBtn.addEventListener('click', () => hideForm('report'));

    // Form submissions
    elements.newRequestForm.addEventListener('submit', handleRequestSubmit);
    elements.newProgressForm.addEventListener('submit', handleProgressSubmit);
    elements.newReportForm.addEventListener('submit', handleReportSubmit);

    // Reports filter
    elements.reportsSearch.addEventListener('input', debounce(handleReportsSearch, 200));
    elements.activeProjectsToggle.addEventListener('change', handleActiveToggle);

    // Nav link highlighting
    elements.navLinks.forEach(link => {
      link.addEventListener('click', handleNavClick);
    });

    // Event delegation for dynamic elements
    elements.requestQueue.addEventListener('click', handleRequestActions);
    elements.progressList.addEventListener('click', handleProgressActions);
    elements.progressList.addEventListener('change', handleStatusChange);
    elements.reportsContainer.addEventListener('click', handleReportActions);
  }

  // =====================
  // RENDERING FUNCTIONS
  // =====================

  function renderAll() {
    renderRequests();
    renderInProgress();
    renderReports();
    updateProjectSuggestions();
  }

  function renderRequests() {
    let requests = DataStore.getRequests();

    if (globalSearchTerm) {
      requests = DataStore.filterBySearchTerm(
        requests,
        globalSearchTerm,
        ['projectName', 'description', 'requester']
      );
    }

    if (requests.length === 0) {
      elements.requestQueue.innerHTML = renderEmptyState('requests');
      return;
    }

    elements.requestQueue.innerHTML = requests.map(renderRequestCard).join('');
  }

  function renderRequestCard(request) {
    const dateFormatted = formatDate(request.dateSubmitted);
    const descriptionTruncated = truncateText(request.description, 120);

    return `
      <article class="request-card kpi-card" data-id="${request.id}" data-urgency="${request.urgency}">
        <div class="card-header">
          <span class="project-name">${escapeHtml(request.projectName)}</span>
          <span class="urgency-badge urgency-${request.urgency}">${capitalize(request.urgency)}</span>
        </div>
        <p class="card-description">${escapeHtml(descriptionTruncated)}</p>
        <div class="card-meta">
          <span class="meta-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            ${escapeHtml(request.requester)}
          </span>
          <span class="meta-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            ${dateFormatted}
          </span>
        </div>
        <div class="card-actions">
          <button class="btn-icon btn-promote" data-action="promote" data-id="${request.id}"
                  aria-label="Move to In Progress" title="Start work on this request">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </button>
          <button class="btn-icon btn-danger" data-action="delete" data-id="${request.id}"
                  aria-label="Delete request" title="Delete this request">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </article>
    `;
  }

  function renderInProgress() {
    let items = DataStore.getInProgressItems();

    if (globalSearchTerm) {
      items = DataStore.filterBySearchTerm(
        items,
        globalSearchTerm,
        ['projectName', 'taskDescription', 'requester']
      );
    }

    if (items.length === 0) {
      elements.progressList.innerHTML = renderEmptyState('in-progress');
      return;
    }

    elements.progressList.innerHTML = items.map(renderProgressCard).join('');
  }

  function renderProgressCard(item) {
    const targetDateFormatted = item.targetCompletionDate
      ? formatDate(item.targetCompletionDate)
      : 'No target';

    const statusLabels = {
      'not-started': 'Not Started',
      'in-progress': 'In Progress',
      'in-review': 'In Review'
    };

    return `
      <article class="progress-card chart-card" data-id="${item.id}">
        <div class="card-header">
          <span class="project-name">${escapeHtml(item.projectName)}</span>
          <span class="target-date">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            ${targetDateFormatted}
          </span>
        </div>
        <p class="card-description">${escapeHtml(item.taskDescription)}</p>
        <div class="card-meta">
          <span class="meta-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            ${escapeHtml(item.requester)}
          </span>
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
          <button class="btn-icon btn-complete" data-action="complete" data-id="${item.id}"
                  aria-label="Mark complete and remove" title="Mark as complete">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </button>
          <button class="btn-icon btn-danger" data-action="delete" data-id="${item.id}"
                  aria-label="Delete item" title="Delete this item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </article>
    `;
  }

  function renderReports() {
    let grouped = DataStore.getReportsGroupedByProject(showActiveProjectsOnly);

    // Apply reports-specific search
    if (reportsSearchTerm) {
      Object.keys(grouped).forEach(project => {
        grouped[project] = DataStore.filterBySearchTerm(
          grouped[project],
          reportsSearchTerm,
          ['title', 'projectName', 'description']
        );
        if (grouped[project].length === 0) {
          delete grouped[project];
        }
      });
    }

    // Apply global search
    if (globalSearchTerm) {
      Object.keys(grouped).forEach(project => {
        grouped[project] = DataStore.filterBySearchTerm(
          grouped[project],
          globalSearchTerm,
          ['title', 'projectName', 'description']
        );
        if (grouped[project].length === 0) {
          delete grouped[project];
        }
      });
    }

    const projectNames = Object.keys(grouped).sort();

    if (projectNames.length === 0) {
      elements.reportsContainer.innerHTML = renderEmptyState('reports');
      return;
    }

    elements.reportsContainer.innerHTML = projectNames.map(project =>
      renderReportGroup(project, grouped[project])
    ).join('');
  }

  function renderReportGroup(projectName, reports) {
    return `
      <div class="report-group" data-project="${escapeHtml(projectName)}">
        <h3 class="report-group-title">${escapeHtml(projectName)}</h3>
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
      <article class="report-card kpi-card" data-id="${report.id}">
        <div class="report-card-header">
          <span class="report-title">${escapeHtml(report.title)}</span>
        </div>
        ${descriptionTruncated ? `<p class="card-description">${escapeHtml(descriptionTruncated)}</p>` : ''}
        <div class="card-meta">
          <span class="meta-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            ${dateFormatted}
          </span>
        </div>
        <div class="card-actions">
          ${report.linkUrl ? `
            <a href="${escapeHtml(report.linkUrl)}" class="btn-link" target="_blank" rel="noopener noreferrer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
              View Report
            </a>
          ` : ''}
          <button class="btn-icon btn-danger" data-action="delete" data-id="${report.id}"
                  aria-label="Delete report" title="Delete this report">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </article>
    `;
  }

  function renderEmptyState(section) {
    const messages = {
      'requests': 'No requests yet. Click "+ New Request" to submit one.',
      'in-progress': 'No items in progress. Promote a request or click "+ Add Item" to add one.',
      'reports': 'No reports found. Try adjusting your filters or add a new report.'
    };
    return `<div class="empty-state">${messages[section]}</div>`;
  }

  // =====================
  // EVENT HANDLERS
  // =====================

  function handleGlobalSearch(e) {
    globalSearchTerm = e.target.value.trim();
    renderAll();
  }

  function handleReportsSearch(e) {
    reportsSearchTerm = e.target.value.trim();
    renderReports();
  }

  function handleActiveToggle(e) {
    showActiveProjectsOnly = e.target.checked;
    renderReports();
  }

  function toggleForm(formType) {
    const containers = {
      request: elements.requestFormContainer,
      progress: elements.progressFormContainer,
      report: elements.reportFormContainer
    };
    const buttons = {
      request: elements.toggleRequestFormBtn,
      progress: elements.toggleProgressFormBtn,
      report: elements.toggleReportFormBtn
    };

    const container = containers[formType];
    const button = buttons[formType];
    const isHidden = container.hidden;

    container.hidden = !isHidden;
    button.setAttribute('aria-expanded', isHidden ? 'true' : 'false');

    if (isHidden) {
      // Focus first input when form opens
      const firstInput = container.querySelector('input, textarea');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 50);
      }
    }
  }

  function hideForm(formType) {
    const containers = {
      request: elements.requestFormContainer,
      progress: elements.progressFormContainer,
      report: elements.reportFormContainer
    };
    const buttons = {
      request: elements.toggleRequestFormBtn,
      progress: elements.toggleProgressFormBtn,
      report: elements.toggleReportFormBtn
    };

    containers[formType].hidden = true;
    buttons[formType].setAttribute('aria-expanded', 'false');
  }

  function handleRequestSubmit(e) {
    e.preventDefault();

    const requestData = {
      projectName: document.getElementById('request-project').value,
      description: document.getElementById('request-description').value,
      requester: document.getElementById('request-requester').value,
      urgency: document.getElementById('request-urgency').value
    };

    DataStore.addRequest(requestData);
    e.target.reset();
    document.getElementById('request-urgency').value = 'medium'; // Reset default
    hideForm('request');
    renderRequests();
    updateNavCounts();
    updateProjectSuggestions();
  }

  function handleProgressSubmit(e) {
    e.preventDefault();

    const itemData = {
      projectName: document.getElementById('progress-project').value,
      taskDescription: document.getElementById('progress-description').value,
      requester: document.getElementById('progress-requester').value,
      status: document.getElementById('progress-status').value,
      targetCompletionDate: document.getElementById('progress-target-date').value || null
    };

    DataStore.addInProgressItem(itemData);
    e.target.reset();
    document.getElementById('progress-status').value = 'in-progress'; // Reset default
    hideForm('progress');
    renderInProgress();
    updateNavCounts();
    updateProjectSuggestions();
  }

  function handleReportSubmit(e) {
    e.preventDefault();

    const reportData = {
      title: document.getElementById('report-title').value,
      projectName: document.getElementById('report-project').value,
      datePublished: document.getElementById('report-date').value,
      description: document.getElementById('report-description').value,
      linkUrl: document.getElementById('report-link').value,
      isActive: document.getElementById('report-active').checked
    };

    DataStore.addReport(reportData);
    e.target.reset();
    document.getElementById('report-active').checked = true; // Reset default
    setDefaultDate();
    hideForm('report');
    renderReports();
    updateNavCounts();
    updateProjectSuggestions();
  }

  function handleRequestActions(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const id = btn.dataset.id;

    if (action === 'delete') {
      if (confirm('Delete this request?')) {
        DataStore.deleteRequest(id);
        renderRequests();
        updateNavCounts();
      }
    } else if (action === 'promote') {
      const request = DataStore.getRequestById(id);
      if (request) {
        DataStore.addInProgressItem({
          projectName: request.projectName,
          taskDescription: request.description,
          requester: request.requester,
          status: 'not-started',
          targetCompletionDate: null
        });
        DataStore.deleteRequest(id);
        renderRequests();
        renderInProgress();
        updateNavCounts();
      }
    }
  }

  function handleProgressActions(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const id = btn.dataset.id;

    if (action === 'delete') {
      if (confirm('Delete this item?')) {
        DataStore.deleteInProgressItem(id);
        renderInProgress();
        updateNavCounts();
      }
    } else if (action === 'complete') {
      DataStore.deleteInProgressItem(id);
      renderInProgress();
      updateNavCounts();
    }
  }

  function handleStatusChange(e) {
    if (!e.target.classList.contains('status-select')) return;

    const id = e.target.dataset.id;
    const newStatus = e.target.value;

    DataStore.updateInProgressStatus(id, newStatus);
  }

  function handleReportActions(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const id = btn.dataset.id;

    if (action === 'delete') {
      if (confirm('Delete this report?')) {
        DataStore.deleteReport(id);
        renderReports();
        updateNavCounts();
      }
    }
  }

  function handleNavClick(e) {
    e.preventDefault();
    elements.navLinks.forEach(link => link.classList.remove('active'));
    e.currentTarget.classList.add('active');

    const section = e.currentTarget.dataset.section;
    const sectionEl = document.getElementById(`${section}-section`);
    if (sectionEl) {
      sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // =====================
  // UTILITY FUNCTIONS
  // =====================

  function updateNavCounts() {
    elements.navRequestsCount.textContent = DataStore.getRequests().length;
    elements.navProgressCount.textContent = DataStore.getInProgressItems().length;
    elements.navReportsCount.textContent = DataStore.getReports().length;
  }

  function updateProjectSuggestions() {
    const projects = DataStore.getUniqueProjects();
    elements.projectSuggestions.innerHTML = projects
      .map(p => `<option value="${escapeHtml(p)}">`)
      .join('');
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

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
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
    init
  };
})();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', App.init);
