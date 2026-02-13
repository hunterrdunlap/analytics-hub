/**
 * Analytics Hub - Data Layer
 * Handles localStorage operations for all entities:
 * divisions, projects, requests, in-progress items, reports,
 * documents, dashboard links, and control items.
 */

const DataStore = (function() {
  'use strict';

  const SCHEMA_VERSION = 2;

  const KEYS = {
    REQUESTS: 'analyticsHub_requests',
    IN_PROGRESS: 'analyticsHub_inProgress',
    REPORTS: 'analyticsHub_reports',
    PROJECTS: 'analyticsHub_projects',
    DOCUMENTS: 'analyticsHub_documents',
    DASHBOARD_LINKS: 'analyticsHub_dashboardLinks',
    CONTROL_ITEMS: 'analyticsHub_controlItems',
    SCHEMA_VERSION: 'analyticsHub_schemaVersion'
  };

  // Hardcoded divisions (read-only)
  const DIVISIONS = [
    { id: 'div-reinsurance', name: 'Reinsurance', sortOrder: 0 },
    { id: 'div-real-estate', name: 'Real Estate', sortOrder: 1 },
    { id: 'div-structured-finance', name: 'Structured Finance', sortOrder: 2 }
  ];

  // =====================
  // UTILITIES
  // =====================

  function generateId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  function getData(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error(`Error reading ${key}:`, e);
      return [];
    }
  }

  function saveData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error(`Error saving ${key}:`, e);
      return false;
    }
  }

  // =====================
  // MIGRATION
  // =====================

  function runMigration() {
    const currentVersion = parseInt(localStorage.getItem(KEYS.SCHEMA_VERSION) || '0', 10);

    if (currentVersion < 1) {
      // Migrate existing entities: add divisionId and projectId
      [KEYS.REQUESTS, KEYS.IN_PROGRESS, KEYS.REPORTS].forEach(key => {
        const items = getData(key);
        items.forEach(item => {
          if (item.divisionId === undefined) item.divisionId = null;
          if (item.clientId !== undefined) {
            item.projectId = item.clientId;
            delete item.clientId;
          }
          if (item.projectId === undefined) item.projectId = null;
        });
        saveData(key, items);
      });

      // Add category to existing reports
      const reports = getData(KEYS.REPORTS);
      reports.forEach(report => {
        if (report.category === undefined) report.category = 'recurring';
      });
      saveData(KEYS.REPORTS, reports);

      // Migrate old clients key to projects key
      const oldClientsData = localStorage.getItem('analyticsHub_clients');
      if (oldClientsData !== null && localStorage.getItem(KEYS.PROJECTS) === null) {
        localStorage.setItem(KEYS.PROJECTS, oldClientsData);
        localStorage.removeItem('analyticsHub_clients');
      }

      // Initialize new collections if they don't exist
      if (localStorage.getItem(KEYS.PROJECTS) === null) {
        saveData(KEYS.PROJECTS, []);
      }
      if (localStorage.getItem(KEYS.DOCUMENTS) === null) {
        saveData(KEYS.DOCUMENTS, []);
      }
      if (localStorage.getItem(KEYS.DASHBOARD_LINKS) === null) {
        saveData(KEYS.DASHBOARD_LINKS, []);
      }
      if (localStorage.getItem(KEYS.CONTROL_ITEMS) === null) {
        saveData(KEYS.CONTROL_ITEMS, []);
      }

      localStorage.setItem(KEYS.SCHEMA_VERSION, '1');
    }

    if (currentVersion < 2) {
      // Migrate clientId → projectId across all entity collections
      [KEYS.REQUESTS, KEYS.IN_PROGRESS, KEYS.REPORTS, KEYS.DOCUMENTS,
       KEYS.DASHBOARD_LINKS, KEYS.CONTROL_ITEMS].forEach(key => {
        const items = getData(key);
        let changed = false;
        items.forEach(item => {
          if (item.clientId !== undefined) {
            item.projectId = item.clientId;
            delete item.clientId;
            changed = true;
          }
        });
        if (changed) saveData(key, items);
      });

      // Migrate old clients localStorage key to projects
      const oldClientsData = localStorage.getItem('analyticsHub_clients');
      if (oldClientsData !== null) {
        const existing = localStorage.getItem(KEYS.PROJECTS);
        if (!existing || existing === '[]') {
          localStorage.setItem(KEYS.PROJECTS, oldClientsData);
        }
        localStorage.removeItem('analyticsHub_clients');
      }

      localStorage.setItem(KEYS.SCHEMA_VERSION, '2');
    }
  }

  // =====================
  // DIVISIONS (read-only)
  // =====================

  function getDivisions() {
    return [...DIVISIONS];
  }

  function getDivisionById(id) {
    return DIVISIONS.find(d => d.id === id) || null;
  }

  // =====================
  // PROJECTS
  // =====================

  function getProjects() {
    return getData(KEYS.PROJECTS);
  }

  function getProjectsByDivision(divisionId) {
    return getData(KEYS.PROJECTS)
      .filter(p => p.divisionId === divisionId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  function getProjectById(id) {
    return getData(KEYS.PROJECTS).find(p => p.id === id) || null;
  }

  function addProject(projectData) {
    const projects = getData(KEYS.PROJECTS);
    const newProject = {
      id: generateId('proj'),
      name: projectData.name.trim(),
      divisionId: projectData.divisionId,
      isActive: true,
      dateCreated: new Date().toISOString()
    };
    projects.push(newProject);
    saveData(KEYS.PROJECTS, projects);
    return newProject;
  }

  function updateProject(id, updates) {
    const projects = getData(KEYS.PROJECTS);
    const project = projects.find(p => p.id === id);
    if (project) {
      Object.assign(project, updates);
      saveData(KEYS.PROJECTS, projects);
      return project;
    }
    return null;
  }

  function deleteProject(id) {
    const projects = getData(KEYS.PROJECTS).filter(p => p.id !== id);
    return saveData(KEYS.PROJECTS, projects);
  }

  // =====================
  // REQUESTS
  // =====================

  function sortRequestsByUrgencyAndDate(requests) {
    const urgencyOrder = { high: 0, medium: 1, low: 2 };
    return requests.sort((a, b) => {
      const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      return new Date(b.dateSubmitted) - new Date(a.dateSubmitted);
    });
  }

  function getRequests() {
    return sortRequestsByUrgencyAndDate(getData(KEYS.REQUESTS));
  }

  function getRequestsByProject(projectId) {
    const requests = getData(KEYS.REQUESTS).filter(r => r.projectId === projectId);
    return sortRequestsByUrgencyAndDate(requests);
  }

  function getUnassignedRequests() {
    const requests = getData(KEYS.REQUESTS).filter(r => !r.projectId);
    return sortRequestsByUrgencyAndDate(requests);
  }

  function addRequest(requestData) {
    const requests = getData(KEYS.REQUESTS);
    const newRequest = {
      id: generateId('req'),
      description: requestData.description.trim(),
      requester: requestData.requester.trim(),
      urgency: requestData.urgency,
      divisionId: requestData.divisionId || null,
      projectId: requestData.projectId || null,
      dateSubmitted: new Date().toISOString()
    };
    requests.push(newRequest);
    saveData(KEYS.REQUESTS, requests);
    return newRequest;
  }

  function updateRequest(id, updates) {
    const requests = getData(KEYS.REQUESTS);
    const req = requests.find(r => r.id === id);
    if (req) {
      Object.assign(req, updates);
      saveData(KEYS.REQUESTS, requests);
      return req;
    }
    return null;
  }

  function deleteRequest(id) {
    const requests = getData(KEYS.REQUESTS).filter(r => r.id !== id);
    return saveData(KEYS.REQUESTS, requests);
  }

  function getRequestById(id) {
    const requests = getData(KEYS.REQUESTS);
    return requests.find(r => r.id === id) || null;
  }

  // =====================
  // IN PROGRESS
  // =====================

  function getInProgressItems() {
    return getData(KEYS.IN_PROGRESS);
  }

  function getInProgressByProject(projectId) {
    return getData(KEYS.IN_PROGRESS).filter(i => i.projectId === projectId);
  }

  function getUnassignedInProgress() {
    return getData(KEYS.IN_PROGRESS).filter(i => !i.projectId);
  }

  function addInProgressItem(itemData) {
    const items = getData(KEYS.IN_PROGRESS);
    const newItem = {
      id: generateId('prog'),
      taskDescription: itemData.taskDescription.trim(),
      requester: itemData.requester.trim(),
      status: itemData.status || 'not-started',
      targetCompletionDate: itemData.targetCompletionDate || null,
      divisionId: itemData.divisionId || null,
      projectId: itemData.projectId || null,
      dateCreated: new Date().toISOString()
    };
    items.push(newItem);
    saveData(KEYS.IN_PROGRESS, items);
    return newItem;
  }

  function getInProgressById(id) {
    return getData(KEYS.IN_PROGRESS).find(i => i.id === id) || null;
  }

  function updateInProgressItem(id, updates) {
    const items = getData(KEYS.IN_PROGRESS);
    const item = items.find(i => i.id === id);
    if (item) {
      Object.assign(item, updates);
      saveData(KEYS.IN_PROGRESS, items);
      return item;
    }
    return null;
  }

  function updateInProgressStatus(id, newStatus) {
    const items = getData(KEYS.IN_PROGRESS);
    const item = items.find(i => i.id === id);
    if (item) {
      item.status = newStatus;
      saveData(KEYS.IN_PROGRESS, items);
      return item;
    }
    return null;
  }

  function deleteInProgressItem(id) {
    const items = getData(KEYS.IN_PROGRESS).filter(i => i.id !== id);
    return saveData(KEYS.IN_PROGRESS, items);
  }

  // =====================
  // REPORTS
  // =====================

  function getReports() {
    return getData(KEYS.REPORTS);
  }

  function getReportsByProject(projectId, activeOnly = false) {
    let reports = getData(KEYS.REPORTS).filter(r => r.projectId === projectId);
    if (activeOnly) reports = reports.filter(r => r.isActive);
    reports.sort((a, b) => new Date(b.datePublished) - new Date(a.datePublished));
    return reports;
  }

  function getUnassignedReports() {
    return getData(KEYS.REPORTS).filter(r => !r.projectId);
  }

  function addReport(reportData) {
    const reports = getData(KEYS.REPORTS);
    const newReport = {
      id: generateId('rpt'),
      title: reportData.title.trim(),
      datePublished: reportData.datePublished,
      description: (reportData.description || '').trim(),
      linkUrl: (reportData.linkUrl || '').trim(),
      isActive: reportData.isActive !== false,
      divisionId: reportData.divisionId || null,
      projectId: reportData.projectId || null,
      category: reportData.category || 'recurring'
    };
    reports.push(newReport);
    saveData(KEYS.REPORTS, reports);
    return newReport;
  }

  function updateReport(id, updates) {
    const reports = getData(KEYS.REPORTS);
    const report = reports.find(r => r.id === id);
    if (report) {
      Object.assign(report, updates);
      saveData(KEYS.REPORTS, reports);
      return report;
    }
    return null;
  }

  function getReportById(id) {
    return getData(KEYS.REPORTS).find(r => r.id === id) || null;
  }

  function deleteReport(id) {
    const reports = getData(KEYS.REPORTS).filter(r => r.id !== id);
    return saveData(KEYS.REPORTS, reports);
  }

  // =====================
  // DOCUMENTS (Zone 1)
  // =====================

  function getDocuments(projectId, category) {
    let docs = getData(KEYS.DOCUMENTS).filter(d => d.projectId === projectId);
    if (category) docs = docs.filter(d => d.category === category);
    docs.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
    return docs;
  }

  function addDocument(docData) {
    const docs = getData(KEYS.DOCUMENTS);
    const newDoc = {
      id: generateId('doc'),
      projectId: docData.projectId,
      category: docData.category,
      title: docData.title.trim(),
      description: (docData.description || '').trim(),
      linkUrl: (docData.linkUrl || '').trim(),
      source: docData.source || 'manual',
      dateAdded: new Date().toISOString(),
      datePublished: docData.datePublished || null
    };
    docs.push(newDoc);
    saveData(KEYS.DOCUMENTS, docs);
    return newDoc;
  }

  function updateDocument(id, updates) {
    const docs = getData(KEYS.DOCUMENTS);
    const doc = docs.find(d => d.id === id);
    if (doc) {
      Object.assign(doc, updates);
      saveData(KEYS.DOCUMENTS, docs);
      return doc;
    }
    return null;
  }

  function deleteDocument(id) {
    const docs = getData(KEYS.DOCUMENTS).filter(d => d.id !== id);
    return saveData(KEYS.DOCUMENTS, docs);
  }

  function getDocumentById(id) {
    return getData(KEYS.DOCUMENTS).find(d => d.id === id) || null;
  }

  // =====================
  // DASHBOARD LINKS (Zone 2)
  // =====================

  function getDashboardLinks(projectId, type) {
    let links = getData(KEYS.DASHBOARD_LINKS).filter(l => l.projectId === projectId);
    if (type) links = links.filter(l => l.type === type);
    links.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
    return links;
  }

  function addDashboardLink(linkData) {
    const links = getData(KEYS.DASHBOARD_LINKS);
    const newLink = {
      id: generateId('dash'),
      projectId: linkData.projectId,
      title: linkData.title.trim(),
      url: (linkData.url || '').trim(),
      type: linkData.type || 'performance',
      description: (linkData.description || '').trim(),
      dateAdded: new Date().toISOString()
    };
    links.push(newLink);
    saveData(KEYS.DASHBOARD_LINKS, links);
    return newLink;
  }

  function updateDashboardLink(id, updates) {
    const links = getData(KEYS.DASHBOARD_LINKS);
    const link = links.find(l => l.id === id);
    if (link) {
      Object.assign(link, updates);
      saveData(KEYS.DASHBOARD_LINKS, links);
      return link;
    }
    return null;
  }

  function deleteDashboardLink(id) {
    const links = getData(KEYS.DASHBOARD_LINKS).filter(l => l.id !== id);
    return saveData(KEYS.DASHBOARD_LINKS, links);
  }

  function getDashboardLinkById(id) {
    return getData(KEYS.DASHBOARD_LINKS).find(l => l.id === id) || null;
  }

  // =====================
  // CONTROL ITEMS (Zone 3)
  // =====================

  function getControlItems(projectId) {
    return getData(KEYS.CONTROL_ITEMS)
      .filter(c => c.projectId === projectId)
      .sort((a, b) => {
        const statusOrder = { overdue: 0, upcoming: 1, current: 2 };
        return (statusOrder[a.status] || 2) - (statusOrder[b.status] || 2);
      });
  }

  function addControlItem(itemData) {
    const items = getData(KEYS.CONTROL_ITEMS);
    const newItem = {
      id: generateId('ctrl'),
      projectId: itemData.projectId,
      title: itemData.title.trim(),
      description: (itemData.description || '').trim(),
      assignee: (itemData.assignee || '').trim(),
      frequency: itemData.frequency || 'monthly',
      lastCompleted: itemData.lastCompleted || null,
      nextDue: itemData.nextDue || null,
      status: itemData.status || 'current',
      dateCreated: new Date().toISOString()
    };
    items.push(newItem);
    saveData(KEYS.CONTROL_ITEMS, items);
    return newItem;
  }

  function getControlItemById(id) {
    return getData(KEYS.CONTROL_ITEMS).find(i => i.id === id) || null;
  }

  function updateControlItem(id, updates) {
    const items = getData(KEYS.CONTROL_ITEMS);
    const item = items.find(i => i.id === id);
    if (item) {
      Object.assign(item, updates);
      saveData(KEYS.CONTROL_ITEMS, items);
      return item;
    }
    return null;
  }

  function deleteControlItem(id) {
    const items = getData(KEYS.CONTROL_ITEMS).filter(i => i.id !== id);
    return saveData(KEYS.CONTROL_ITEMS, items);
  }

  // =====================
  // CROSS-CUTTING UTILITIES
  // =====================

  function filterBySearchTerm(items, searchTerm, fields) {
    if (!searchTerm) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(item =>
      fields.some(field =>
        item[field] && item[field].toLowerCase().includes(term)
      )
    );
  }

  // =====================
  // PUBLIC API
  // =====================
  return {
    // Migration
    runMigration,

    // Divisions (read-only)
    getDivisions,
    getDivisionById,

    // Projects
    getProjects,
    getProjectsByDivision,
    getProjectById,
    addProject,
    updateProject,
    deleteProject,

    // Requests
    getRequests,
    getRequestsByProject,
    getUnassignedRequests,
    addRequest,
    updateRequest,
    deleteRequest,
    getRequestById,

    // In Progress
    getInProgressItems,
    getInProgressByProject,
    getInProgressById,
    getUnassignedInProgress,
    addInProgressItem,
    updateInProgressItem,
    updateInProgressStatus,
    deleteInProgressItem,

    // Reports
    getReports,
    getReportsByProject,
    getReportById,
    getUnassignedReports,
    addReport,
    updateReport,
    deleteReport,

    // Documents (Zone 1)
    getDocuments,
    getDocumentById,
    addDocument,
    updateDocument,
    deleteDocument,

    // Dashboard Links (Zone 2)
    getDashboardLinks,
    getDashboardLinkById,
    addDashboardLink,
    updateDashboardLink,
    deleteDashboardLink,

    // Control Items (Zone 3)
    getControlItems,
    getControlItemById,
    addControlItem,
    updateControlItem,
    deleteControlItem,

    // Utilities
    filterBySearchTerm,
    generateId,
    getData,
    saveData
  };
})();
