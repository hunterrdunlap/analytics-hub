/**
 * Analytics Hub - Application Shell
 * Orchestrates sidebar navigation, zone tab switching,
 * home dashboard, and project management views.
 */

const App = (function() {
  'use strict';

  // Cached DOM references
  let elements = {};

  // Project search filter for sidebar
  let projectSearchTerm = '';

  // =====================
  // INITIALIZATION
  // =====================

  function init() {
    DataStore.runMigration();
    cacheElements();
    cacheModalElements();
    AppRouter.init(render);
    bindEvents();
    bindModalEvents();
    render();
  }

  function cacheElements() {
    elements = {
      globalSearch: document.getElementById('global-search'),
      projectSearch: document.getElementById('project-search'),
      divisionTree: document.getElementById('division-tree'),
      mainContent: document.getElementById('main-content'),
      pageTitle: document.getElementById('page-title'),
      pageSubtitle: document.getElementById('page-subtitle')
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

    // Project search in sidebar
    elements.projectSearch.addEventListener('input', debounce((e) => {
      projectSearchTerm = e.target.value.trim().toLowerCase();
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

    // Manage projects link
    const manageProjectsLink = document.querySelector('[data-action="manage-projects"]');
    if (manageProjectsLink) {
      manageProjectsLink.addEventListener('click', (e) => {
        e.preventDefault();
        AppRouter.navigate('manage-projects');
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

    const projectLink = e.target.closest('[data-project-id]');
    if (projectLink) {
      AppRouter.selectProject(projectLink.dataset.projectId);
      return;
    }
  }

  // =====================
  // MASTER RENDER
  // =====================

  function render() {
    renderSidebar();
    renderMainContent();
  }

  // =====================
  // SIDEBAR RENDERING
  // =====================

  function renderSidebar() {
    const divisions = DataStore.getDivisions();
    const state = AppRouter.getState();

    let html = '<div class="nav-list">';

    divisions.forEach(div => {
      let projects = DataStore.getProjectsByDivision(div.id);

      // Filter projects by search term
      if (projectSearchTerm) {
        projects = projects.filter(p => p.name.toLowerCase().includes(projectSearchTerm));
      }

      const isExpanded = state.expandedDivisions.includes(div.id);
      const allProjects = DataStore.getProjectsByDivision(div.id);

      html += `
        <div class="nav-group ${isExpanded ? 'expanded' : ''}">
          <a href="#" class="nav-link nav-division" data-division-id="${div.id}">
            <span class="nav-expand-icon">${isExpanded ? '&#9660;' : '&#9654;'}</span>
            <span class="nav-division-name">${escapeHtml(div.name)}</span>
            <span class="pill">${allProjects.length}</span>
          </a>
          <div class="nav-children" ${isExpanded ? '' : 'hidden'}>
            ${projects.length > 0 ? projects.map(p => `
              <a href="#" class="nav-link nav-project ${state.selectedProjectId === p.id ? 'active' : ''}"
                 data-project-id="${p.id}">
                <span>${escapeHtml(p.name)}</span>
              </a>
            `).join('') : `
              <div class="nav-empty">No projects yet</div>
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
      case 'project':
        renderProjectView(state.selectedProjectId, state.activeZone);
        break;
      case 'manage-projects':
        renderProjectManager();
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
      const projects = DataStore.getProjectsByDivision(div.id);
      return `
        <div class="kpi-card division-summary-card" data-division-id="${div.id}">
          <div class="kpi-value">${projects.length}</div>
          <div class="kpi-label">${escapeHtml(div.name)}</div>
          <div class="kpi-unit">project${projects.length !== 1 ? 's' : ''}</div>
          ${projects.length > 0 ? `
            <div class="division-project-list">
              ${projects.slice(0, 5).map(p => `
                <a href="#" class="division-project-link" data-project-id="${p.id}">${escapeHtml(p.name)}</a>
              `).join('')}
              ${projects.length > 5 ? `<span class="division-more">+${projects.length - 5} more</span>` : ''}
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
          <p class="section-description">These items were created before the division/project structure. Assign them to a project to organize them.</p>
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
            <p>Select a project from the sidebar to view reports, dashboards, and oversight items. Use <strong>Manage Projects</strong> to add new projects.</p>
          </div>
        </div>
      </div>
    `;

    // Bind project links within division cards
    elements.mainContent.querySelectorAll('[data-project-id]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        AppRouter.selectProject(link.dataset.projectId);
      });
    });

    // Bind division card clicks to expand
    elements.mainContent.querySelectorAll('.division-summary-card').forEach(card => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        if (e.target.closest('[data-project-id]')) return; // Don't fire on project links
        const divId = card.dataset.divisionId;
        const state = AppRouter.getState();
        if (!state.expandedDivisions.includes(divId)) {
          AppRouter.toggleDivision(divId);
        }
      });
    });
  }

  // =====================
  // PROJECT VIEW (ZONE TABS)
  // =====================

  function renderProjectView(projectId, activeZone) {
    const project = DataStore.getProjectById(projectId);
    if (!project) {
      AppRouter.goHome();
      return;
    }

    const division = DataStore.getDivisionById(project.divisionId);

    elements.pageTitle.textContent = project.name;
    elements.pageSubtitle.textContent = division ? division.name : '';

    elements.mainContent.innerHTML = `
      <div class="project-view">
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
        ZoneRenderer.renderZone1(zoneContent, projectId);
        break;
      case 2:
        ZoneRenderer.renderZone2(zoneContent, projectId);
        break;
      case 3:
        ZoneRenderer.renderZone3(zoneContent, projectId);
        break;
    }
  }

  // =====================
  // PROJECT MANAGER
  // =====================

  function renderProjectManager() {
    elements.pageTitle.textContent = 'Manage Projects';
    elements.pageSubtitle.textContent = '';

    const divisions = DataStore.getDivisions();

    let html = `<div class="project-manager">`;

    html += `
      <div class="section-header">
        <h2 class="section-title">Add New Project</h2>
      </div>
      <form id="add-project-form" class="chart-card form-card" style="margin-bottom: 28px;">
        <div class="form-row">
          <div class="form-group">
            <label for="new-project-name">Project Name</label>
            <input type="text" id="new-project-name" name="name" placeholder="Enter project name..." required>
          </div>
          <div class="form-group">
            <label for="new-project-division">Division</label>
            <select id="new-project-division" name="divisionId" required>
              ${divisions.map(d => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn-primary">Add Project</button>
        </div>
      </form>
    `;

    // List projects grouped by division
    divisions.forEach(div => {
      const projects = DataStore.getProjectsByDivision(div.id);
      html += `
        <div class="project-manager-section">
          <h3 class="report-group-title">${escapeHtml(div.name)}</h3>
          ${projects.length > 0 ? `
            <div class="project-list">
              ${projects.map(p => `
                <div class="project-list-item chart-card">
                  <div class="project-list-info">
                    <span class="project-list-name">${escapeHtml(p.name)}</span>
                    <span class="project-list-date">Added ${formatDate(p.dateCreated)}</span>
                  </div>
                  <div class="project-list-actions">
                    <button class="btn-link" data-action="view-project" data-project-id="${p.id}">
                      View
                    </button>
                    <button class="btn-icon btn-danger" data-action="delete-project" data-project-id="${p.id}"
                            aria-label="Delete project" title="Delete this project">
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
            <div class="empty-state">No projects in this division yet.</div>
          `}
        </div>
      `;
    });

    html += `</div>`;
    elements.mainContent.innerHTML = html;

    // Bind add project form
    const addForm = document.getElementById('add-project-form');
    if (addForm) {
      addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('new-project-name').value;
        const divisionId = document.getElementById('new-project-division').value;
        DataStore.addProject({ name, divisionId });
        renderProjectManager();
        renderSidebar();
      });
    }

    // Bind project actions
    elements.mainContent.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      if (btn.dataset.action === 'view-project') {
        e.preventDefault();
        AppRouter.selectProject(btn.dataset.projectId);
      } else if (btn.dataset.action === 'delete-project') {
        const projectId = btn.dataset.projectId;
        const project = DataStore.getProjectById(projectId);
        if (project && confirm(`Delete project "${project.name}"? This won't delete associated items, but they will become unassigned.`)) {
          DataStore.deleteProject(projectId);
          renderProjectManager();
          renderSidebar();
        }
      }
    });
  }

  // =====================
  // UTILITY FUNCTIONS
  // =====================

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
  // DETAIL MODAL
  // =====================

  let modalState = { entityType: null, entityId: null, projectId: null };

  function cacheModalElements() {
    elements.modalOverlay = document.getElementById('modal-overlay');
    elements.modal = document.getElementById('modal');
    elements.modalHeader = document.getElementById('modal-header');
    elements.modalBody = document.getElementById('modal-body');
    elements.modalFooter = document.getElementById('modal-footer');
  }

  function bindModalEvents() {
    // Close on overlay click
    elements.modalOverlay.addEventListener('click', (e) => {
      if (e.target === elements.modalOverlay) closeModal();
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !elements.modalOverlay.hidden) {
        closeModal();
      }
    });
  }

  function openModal(entityType, entityId, projectId) {
    const entity = getEntityById(entityType, entityId);
    if (!entity) return;

    modalState = { entityType, entityId, projectId };
    cacheModalElements();

    const config = getModalConfig(entityType);

    elements.modalHeader.innerHTML = `
      <h2 class="modal-title">${escapeHtml(config.title)}</h2>
      <button class="modal-close-btn" id="modal-close-btn" aria-label="Close">&times;</button>
    `;

    elements.modalBody.innerHTML = renderModalForm(entityType, entity, config);

    elements.modalFooter.innerHTML = `
      <div class="modal-footer-left">
        <button class="btn-danger-text" id="modal-delete-btn">Delete</button>
      </div>
      <div class="modal-footer-right">
        <button class="btn-secondary" id="modal-cancel-btn">Cancel</button>
        <button class="btn-primary" id="modal-save-btn">Save Changes</button>
      </div>
    `;

    elements.modalOverlay.hidden = false;
    document.body.style.overflow = 'hidden';

    // Bind modal buttons
    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
    document.getElementById('modal-save-btn').addEventListener('click', saveModal);
    document.getElementById('modal-delete-btn').addEventListener('click', deleteFromModal);

    // Focus first input
    const firstInput = elements.modalBody.querySelector('input, textarea, select');
    if (firstInput) setTimeout(() => firstInput.focus(), 50);
  }

  function closeModal() {
    if (elements.modalOverlay) {
      elements.modalOverlay.hidden = true;
      document.body.style.overflow = '';
    }
    modalState = { entityType: null, entityId: null, projectId: null };
  }

  function saveModal() {
    const { entityType, entityId } = modalState;
    const updates = readModalForm(entityType);
    if (!updates) return;

    const updateFn = {
      document: DataStore.updateDocument,
      report: DataStore.updateReport,
      dashboard: DataStore.updateDashboardLink,
      control: DataStore.updateControlItem,
      request: DataStore.updateRequest,
      progress: DataStore.updateInProgressItem
    }[entityType];

    if (updateFn) {
      updateFn(entityId, updates);
    }

    closeModal();
    render();
  }

  function deleteFromModal() {
    const { entityType, entityId } = modalState;
    const labels = {
      document: 'document', report: 'report', dashboard: 'dashboard link',
      control: 'control item', request: 'request', progress: 'in-progress item'
    };
    if (!confirm(`Delete this ${labels[entityType] || 'item'}?`)) return;

    const deleteFn = {
      document: DataStore.deleteDocument,
      report: DataStore.deleteReport,
      dashboard: DataStore.deleteDashboardLink,
      control: DataStore.deleteControlItem,
      request: DataStore.deleteRequest,
      progress: DataStore.deleteInProgressItem
    }[entityType];

    if (deleteFn) {
      deleteFn(entityId);
    }

    closeModal();
    render();
  }

  function getEntityById(entityType, entityId) {
    const getterFn = {
      document: DataStore.getDocumentById,
      report: DataStore.getReportById,
      dashboard: DataStore.getDashboardLinkById,
      control: DataStore.getControlItemById,
      request: DataStore.getRequestById,
      progress: DataStore.getInProgressById
    }[entityType];
    return getterFn ? getterFn(entityId) : null;
  }

  function getModalConfig(entityType) {
    const configs = {
      document: {
        title: 'Document Details',
        fields: [
          { key: 'title', label: 'Title', type: 'text', required: true },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'linkUrl', label: 'Link URL', type: 'url' },
          { key: 'category', label: 'Category', type: 'select', options: [
            { value: 'legal', label: 'Legal Document' },
            { value: 'pricing', label: 'Original Pricing Model' },
            { value: 'recurring', label: 'Recurring Report' }
          ]},
          { key: 'source', label: 'Source', type: 'select', options: [
            { value: 'manual', label: 'Manual Upload' },
            { value: 'client-email', label: 'Client Email' },
            { value: 'nelnet-created', label: 'Nelnet Created' }
          ]}
        ]
      },
      report: {
        title: 'Report Details',
        fields: [
          { key: 'title', label: 'Report Title', type: 'text', required: true },
          { key: 'datePublished', label: 'Date Published', type: 'date' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'linkUrl', label: 'Link URL', type: 'url' },
          { key: 'source', label: 'Source', type: 'select', options: [
            { value: 'nelnet-created', label: 'Nelnet Created' },
            { value: 'client-email', label: 'Client Email' },
            { value: 'manual', label: 'Manual' }
          ]},
          { key: 'isActive', label: 'Active', type: 'checkbox' }
        ]
      },
      dashboard: {
        title: 'Dashboard Link Details',
        fields: [
          { key: 'title', label: 'Title', type: 'text', required: true },
          { key: 'url', label: 'Dashboard URL', type: 'url' },
          { key: 'type', label: 'Type', type: 'select', options: [
            { value: 'performance', label: 'Performance Dashboard' },
            { value: 'valuation', label: 'Valuation Support' },
            { value: 'impairment', label: 'Impairment Support' }
          ]},
          { key: 'description', label: 'Description', type: 'textarea' }
        ]
      },
      control: {
        title: 'Control Item Details',
        fields: [
          { key: 'title', label: 'Control Title', type: 'text', required: true },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'assignee', label: 'Assignee', type: 'text' },
          { key: 'frequency', label: 'Frequency', type: 'select', options: [
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
            { value: 'quarterly', label: 'Quarterly' },
            { value: 'annually', label: 'Annually' },
            { value: 'ad-hoc', label: 'Ad-Hoc' }
          ]},
          { key: 'nextDue', label: 'Next Due Date', type: 'date' },
          { key: 'status', label: 'Status', type: 'select', options: [
            { value: 'current', label: 'Current' },
            { value: 'upcoming', label: 'Upcoming' },
            { value: 'overdue', label: 'Overdue' }
          ]}
        ]
      },
      request: {
        title: 'Request Details',
        fields: [
          { key: 'description', label: 'Description', type: 'textarea', required: true },
          { key: 'requester', label: 'Requester', type: 'text', required: true },
          { key: 'urgency', label: 'Urgency', type: 'select', options: [
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' }
          ]}
        ]
      },
      progress: {
        title: 'In-Progress Item Details',
        fields: [
          { key: 'taskDescription', label: 'Task Description', type: 'textarea', required: true },
          { key: 'requester', label: 'Requester', type: 'text', required: true },
          { key: 'status', label: 'Status', type: 'select', options: [
            { value: 'not-started', label: 'Not Started' },
            { value: 'in-progress', label: 'In Progress' },
            { value: 'in-review', label: 'In Review' }
          ]},
          { key: 'targetCompletionDate', label: 'Target Completion Date', type: 'date' }
        ]
      }
    };
    return configs[entityType] || { title: 'Details', fields: [] };
  }

  function renderModalForm(entityType, entity, config) {
    return config.fields.map(field => {
      const value = entity[field.key] != null ? entity[field.key] : '';
      const id = `modal-field-${field.key}`;
      const req = field.required ? 'required' : '';

      if (field.type === 'textarea') {
        return `
          <div class="form-group">
            <label for="${id}">${escapeHtml(field.label)}</label>
            <textarea id="${id}" name="${field.key}" rows="3" ${req}>${escapeHtml(String(value))}</textarea>
          </div>`;
      }

      if (field.type === 'select') {
        const options = field.options.map(opt =>
          `<option value="${opt.value}" ${value === opt.value ? 'selected' : ''}>${escapeHtml(opt.label)}</option>`
        ).join('');
        return `
          <div class="form-group">
            <label for="${id}">${escapeHtml(field.label)}</label>
            <select id="${id}" name="${field.key}" ${req}>${options}</select>
          </div>`;
      }

      if (field.type === 'checkbox') {
        return `
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="${id}" name="${field.key}" ${value ? 'checked' : ''}>
              <span>${escapeHtml(field.label)}</span>
            </label>
          </div>`;
      }

      return `
        <div class="form-group">
          <label for="${id}">${escapeHtml(field.label)}</label>
          <input type="${field.type}" id="${id}" name="${field.key}" value="${escapeHtml(String(value))}" ${req}>
        </div>`;
    }).join('');
  }

  function readModalForm(entityType) {
    const config = getModalConfig(entityType);
    const updates = {};
    config.fields.forEach(field => {
      const el = document.getElementById(`modal-field-${field.key}`);
      if (!el) return;
      if (field.type === 'checkbox') {
        updates[field.key] = el.checked;
      } else {
        updates[field.key] = el.value;
      }
    });
    return updates;
  }

  // =====================
  // PUBLIC API
  // =====================
  return {
    init,
    render,
    openModal
  };
})();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', App.init);
