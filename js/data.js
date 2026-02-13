/**
 * Analytics Hub - Data Layer
 * Handles localStorage operations for all entities:
 * divisions, clients, requests, in-progress items, reports,
 * documents, dashboard links, and control items.
 */

const DataStore = (function() {
  'use strict';

  const SCHEMA_VERSION = 1;

  const KEYS = {
    REQUESTS: 'analyticsHub_requests',
    IN_PROGRESS: 'analyticsHub_inProgress',
    REPORTS: 'analyticsHub_reports',
    CLIENTS: 'analyticsHub_clients',
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
      // Migrate existing entities: add divisionId and clientId
      [KEYS.REQUESTS, KEYS.IN_PROGRESS, KEYS.REPORTS].forEach(key => {
        const items = getData(key);
        items.forEach(item => {
          if (item.divisionId === undefined) item.divisionId = null;
          if (item.clientId === undefined) item.clientId = null;
        });
        saveData(key, items);
      });

      // Add category to existing reports
      const reports = getData(KEYS.REPORTS);
      reports.forEach(report => {
        if (report.category === undefined) report.category = 'recurring';
      });
      saveData(KEYS.REPORTS, reports);

      // Initialize new collections if they don't exist
      if (localStorage.getItem(KEYS.CLIENTS) === null) {
        saveData(KEYS.CLIENTS, []);
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
  // CLIENTS
  // =====================

  function getClients() {
    return getData(KEYS.CLIENTS);
  }

  function getClientsByDivision(divisionId) {
    return getData(KEYS.CLIENTS)
      .filter(c => c.divisionId === divisionId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  function getClientById(id) {
    return getData(KEYS.CLIENTS).find(c => c.id === id) || null;
  }

  function addClient(clientData) {
    const clients = getData(KEYS.CLIENTS);
    const newClient = {
      id: generateId('cli'),
      name: clientData.name.trim(),
      divisionId: clientData.divisionId,
      isActive: true,
      dateCreated: new Date().toISOString()
    };
    clients.push(newClient);
    saveData(KEYS.CLIENTS, clients);
    return newClient;
  }

  function updateClient(id, updates) {
    const clients = getData(KEYS.CLIENTS);
    const client = clients.find(c => c.id === id);
    if (client) {
      Object.assign(client, updates);
      saveData(KEYS.CLIENTS, clients);
      return client;
    }
    return null;
  }

  function deleteClient(id) {
    const clients = getData(KEYS.CLIENTS).filter(c => c.id !== id);
    return saveData(KEYS.CLIENTS, clients);
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

  function getRequestsByClient(clientId) {
    const requests = getData(KEYS.REQUESTS).filter(r => r.clientId === clientId);
    return sortRequestsByUrgencyAndDate(requests);
  }

  function getUnassignedRequests() {
    const requests = getData(KEYS.REQUESTS).filter(r => !r.clientId);
    return sortRequestsByUrgencyAndDate(requests);
  }

  function addRequest(requestData) {
    const requests = getData(KEYS.REQUESTS);
    const newRequest = {
      id: generateId('req'),
      projectName: requestData.projectName.trim(),
      description: requestData.description.trim(),
      requester: requestData.requester.trim(),
      urgency: requestData.urgency,
      divisionId: requestData.divisionId || null,
      clientId: requestData.clientId || null,
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

  function getInProgressByClient(clientId) {
    return getData(KEYS.IN_PROGRESS).filter(i => i.clientId === clientId);
  }

  function getUnassignedInProgress() {
    return getData(KEYS.IN_PROGRESS).filter(i => !i.clientId);
  }

  function addInProgressItem(itemData) {
    const items = getData(KEYS.IN_PROGRESS);
    const newItem = {
      id: generateId('prog'),
      projectName: itemData.projectName.trim(),
      taskDescription: itemData.taskDescription.trim(),
      requester: itemData.requester.trim(),
      status: itemData.status || 'not-started',
      targetCompletionDate: itemData.targetCompletionDate || null,
      divisionId: itemData.divisionId || null,
      clientId: itemData.clientId || null,
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

  function getReportsByClient(clientId, activeOnly = false) {
    let reports = getData(KEYS.REPORTS).filter(r => r.clientId === clientId);
    if (activeOnly) reports = reports.filter(r => r.isActive);
    reports.sort((a, b) => new Date(b.datePublished) - new Date(a.datePublished));
    return reports;
  }

  function getUnassignedReports() {
    return getData(KEYS.REPORTS).filter(r => !r.clientId);
  }

  function addReport(reportData) {
    const reports = getData(KEYS.REPORTS);
    const newReport = {
      id: generateId('rpt'),
      title: reportData.title.trim(),
      projectName: reportData.projectName.trim(),
      datePublished: reportData.datePublished,
      description: (reportData.description || '').trim(),
      linkUrl: (reportData.linkUrl || '').trim(),
      isActive: reportData.isActive !== false,
      divisionId: reportData.divisionId || null,
      clientId: reportData.clientId || null,
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

  function getReportsGroupedByProject(activeOnly = false, clientId = null) {
    let reports = getData(KEYS.REPORTS);

    if (clientId) {
      reports = reports.filter(r => r.clientId === clientId);
    }

    if (activeOnly) {
      reports = reports.filter(r => r.isActive);
    }

    reports.sort((a, b) => new Date(b.datePublished) - new Date(a.datePublished));

    const grouped = {};
    reports.forEach(report => {
      if (!grouped[report.projectName]) {
        grouped[report.projectName] = [];
      }
      grouped[report.projectName].push(report);
    });

    return grouped;
  }

  // =====================
  // DOCUMENTS (Zone 1)
  // =====================

  function getDocuments(clientId, category) {
    let docs = getData(KEYS.DOCUMENTS).filter(d => d.clientId === clientId);
    if (category) docs = docs.filter(d => d.category === category);
    docs.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
    return docs;
  }

  function addDocument(docData) {
    const docs = getData(KEYS.DOCUMENTS);
    const newDoc = {
      id: generateId('doc'),
      clientId: docData.clientId,
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

  function getDashboardLinks(clientId, type) {
    let links = getData(KEYS.DASHBOARD_LINKS).filter(l => l.clientId === clientId);
    if (type) links = links.filter(l => l.type === type);
    links.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
    return links;
  }

  function addDashboardLink(linkData) {
    const links = getData(KEYS.DASHBOARD_LINKS);
    const newLink = {
      id: generateId('dash'),
      clientId: linkData.clientId,
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

  function getControlItems(clientId) {
    return getData(KEYS.CONTROL_ITEMS)
      .filter(c => c.clientId === clientId)
      .sort((a, b) => {
        const statusOrder = { overdue: 0, upcoming: 1, current: 2 };
        return (statusOrder[a.status] || 2) - (statusOrder[b.status] || 2);
      });
  }

  function addControlItem(itemData) {
    const items = getData(KEYS.CONTROL_ITEMS);
    const newItem = {
      id: generateId('ctrl'),
      clientId: itemData.clientId,
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

  function getUniqueProjects() {
    const requests = getData(KEYS.REQUESTS);
    const inProgress = getData(KEYS.IN_PROGRESS);
    const reports = getData(KEYS.REPORTS);

    const projects = new Set();
    [...requests, ...inProgress, ...reports].forEach(item => {
      if (item.projectName) projects.add(item.projectName);
    });

    return Array.from(projects).sort();
  }

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

    // Clients
    getClients,
    getClientsByDivision,
    getClientById,
    addClient,
    updateClient,
    deleteClient,

    // Requests
    getRequests,
    getRequestsByClient,
    getUnassignedRequests,
    addRequest,
    updateRequest,
    deleteRequest,
    getRequestById,

    // In Progress
    getInProgressItems,
    getInProgressByClient,
    getInProgressById,
    getUnassignedInProgress,
    addInProgressItem,
    updateInProgressItem,
    updateInProgressStatus,
    deleteInProgressItem,

    // Reports
    getReports,
    getReportsByClient,
    getReportById,
    getUnassignedReports,
    addReport,
    updateReport,
    deleteReport,
    getReportsGroupedByProject,

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
    getUniqueProjects,
    filterBySearchTerm,
    generateId,
    getData,
    saveData
  };
})();
