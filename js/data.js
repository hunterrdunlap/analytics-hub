/**
 * Analytics Hub - Data Layer
 * Async API-backed data operations for all entities:
 * divisions, projects, requests, in-progress items, reports,
 * documents, dashboard links, and control items.
 */

const DataStore = (function() {
  'use strict';

  // =====================
  // DIVISIONS (read-only)
  // =====================

  async function getDivisions() {
    return ApiClient.get('/api/divisions');
  }

  async function getDivisionById(id) {
    const divisions = await getDivisions();
    return divisions.find(d => d.id === id) || null;
  }

  // =====================
  // PROJECTS
  // =====================

  async function getProjects() {
    return ApiClient.get('/api/projects');
  }

  async function getProjectsByDivision(divisionId) {
    return ApiClient.get('/api/projects?divisionId=' + encodeURIComponent(divisionId));
  }

  async function getProjectById(id) {
    return ApiClient.get('/api/projects/' + encodeURIComponent(id));
  }

  async function addProject(projectData) {
    return ApiClient.post('/api/projects', projectData);
  }

  async function updateProject(id, updates) {
    return ApiClient.put('/api/projects/' + encodeURIComponent(id), updates);
  }

  async function deleteProject(id) {
    return ApiClient.delete('/api/projects/' + encodeURIComponent(id));
  }

  // =====================
  // REQUESTS
  // =====================

  async function getRequests() {
    return ApiClient.get('/api/requests');
  }

  async function getRequestsByProject(projectId) {
    return ApiClient.get('/api/requests?projectId=' + encodeURIComponent(projectId));
  }

  async function getUnassignedRequests() {
    return ApiClient.get('/api/requests?unassigned=true');
  }

  async function addRequest(requestData) {
    return ApiClient.post('/api/requests', requestData);
  }

  async function updateRequest(id, updates) {
    return ApiClient.put('/api/requests/' + encodeURIComponent(id), updates);
  }

  async function deleteRequest(id) {
    return ApiClient.delete('/api/requests/' + encodeURIComponent(id));
  }

  async function getRequestById(id) {
    return ApiClient.get('/api/requests/' + encodeURIComponent(id));
  }

  // =====================
  // IN PROGRESS
  // =====================

  async function getInProgressItems() {
    return ApiClient.get('/api/in-progress');
  }

  async function getInProgressByProject(projectId) {
    return ApiClient.get('/api/in-progress?projectId=' + encodeURIComponent(projectId));
  }

  async function getUnassignedInProgress() {
    return ApiClient.get('/api/in-progress?unassigned=true');
  }

  async function addInProgressItem(itemData) {
    return ApiClient.post('/api/in-progress', itemData);
  }

  async function getInProgressById(id) {
    return ApiClient.get('/api/in-progress/' + encodeURIComponent(id));
  }

  async function updateInProgressItem(id, updates) {
    return ApiClient.put('/api/in-progress/' + encodeURIComponent(id), updates);
  }

  async function updateInProgressStatus(id, newStatus) {
    return ApiClient.put('/api/in-progress/' + encodeURIComponent(id), { status: newStatus });
  }

  async function deleteInProgressItem(id) {
    return ApiClient.delete('/api/in-progress/' + encodeURIComponent(id));
  }

  // =====================
  // REPORTS
  // =====================

  async function getReports() {
    return ApiClient.get('/api/reports');
  }

  async function getReportsByProject(projectId, activeOnly = false) {
    let url = '/api/reports?projectId=' + encodeURIComponent(projectId);
    if (activeOnly) url += '&activeOnly=true';
    return ApiClient.get(url);
  }

  async function getUnassignedReports() {
    return ApiClient.get('/api/reports?unassigned=true');
  }

  async function addReport(reportData) {
    return ApiClient.post('/api/reports', reportData);
  }

  async function updateReport(id, updates) {
    return ApiClient.put('/api/reports/' + encodeURIComponent(id), updates);
  }

  async function getReportById(id) {
    return ApiClient.get('/api/reports/' + encodeURIComponent(id));
  }

  async function deleteReport(id) {
    return ApiClient.delete('/api/reports/' + encodeURIComponent(id));
  }

  // =====================
  // DOCUMENTS (Zone 1)
  // =====================

  async function getDocuments(projectId, category) {
    let url = '/api/documents?projectId=' + encodeURIComponent(projectId);
    if (category) url += '&category=' + encodeURIComponent(category);
    return ApiClient.get(url);
  }

  async function addDocument(docData) {
    return ApiClient.post('/api/documents', docData);
  }

  async function updateDocument(id, updates) {
    return ApiClient.put('/api/documents/' + encodeURIComponent(id), updates);
  }

  async function deleteDocument(id) {
    return ApiClient.delete('/api/documents/' + encodeURIComponent(id));
  }

  async function getDocumentById(id) {
    return ApiClient.get('/api/documents/' + encodeURIComponent(id));
  }

  // =====================
  // DASHBOARD LINKS (Zone 2)
  // =====================

  async function getDashboardLinks(projectId, type) {
    let url = '/api/dashboard-links?projectId=' + encodeURIComponent(projectId);
    if (type) url += '&type=' + encodeURIComponent(type);
    return ApiClient.get(url);
  }

  async function addDashboardLink(linkData) {
    return ApiClient.post('/api/dashboard-links', linkData);
  }

  async function updateDashboardLink(id, updates) {
    return ApiClient.put('/api/dashboard-links/' + encodeURIComponent(id), updates);
  }

  async function deleteDashboardLink(id) {
    return ApiClient.delete('/api/dashboard-links/' + encodeURIComponent(id));
  }

  async function getDashboardLinkById(id) {
    return ApiClient.get('/api/dashboard-links/' + encodeURIComponent(id));
  }

  // =====================
  // CONTROL ITEMS (Zone 3)
  // =====================

  async function getControlItems(projectId) {
    return ApiClient.get('/api/control-items?projectId=' + encodeURIComponent(projectId));
  }

  async function addControlItem(itemData) {
    return ApiClient.post('/api/control-items', itemData);
  }

  async function getControlItemById(id) {
    return ApiClient.get('/api/control-items/' + encodeURIComponent(id));
  }

  async function updateControlItem(id, updates) {
    return ApiClient.put('/api/control-items/' + encodeURIComponent(id), updates);
  }

  async function deleteControlItem(id) {
    return ApiClient.delete('/api/control-items/' + encodeURIComponent(id));
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
    filterBySearchTerm
  };
})();
