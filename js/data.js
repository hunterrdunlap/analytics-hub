/**
 * Analytics Hub - Data Layer
 * Handles localStorage operations for requests, in-progress items, and reports
 */

const DataStore = (function() {
  'use strict';

  const KEYS = {
    REQUESTS: 'analyticsHub_requests',
    IN_PROGRESS: 'analyticsHub_inProgress',
    REPORTS: 'analyticsHub_reports'
  };

  // =====================
  // UTILITIES
  // =====================

  /**
   * Generate a unique ID with optional prefix
   */
  function generateId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get data from localStorage
   */
  function getData(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error(`Error reading ${key}:`, e);
      return [];
    }
  }

  /**
   * Save data to localStorage
   */
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
  // REQUESTS
  // =====================

  /**
   * Get all requests, sorted by urgency (high first) then date (newest first)
   */
  function getRequests() {
    return sortRequestsByUrgencyAndDate(getData(KEYS.REQUESTS));
  }

  /**
   * Add a new request
   */
  function addRequest(requestData) {
    const requests = getData(KEYS.REQUESTS);
    const newRequest = {
      id: generateId('req'),
      projectName: requestData.projectName.trim(),
      description: requestData.description.trim(),
      requester: requestData.requester.trim(),
      urgency: requestData.urgency,
      dateSubmitted: new Date().toISOString()
    };
    requests.push(newRequest);
    saveData(KEYS.REQUESTS, requests);
    return newRequest;
  }

  /**
   * Delete a request by ID
   */
  function deleteRequest(id) {
    const requests = getData(KEYS.REQUESTS).filter(r => r.id !== id);
    return saveData(KEYS.REQUESTS, requests);
  }

  /**
   * Get a single request by ID
   */
  function getRequestById(id) {
    const requests = getData(KEYS.REQUESTS);
    return requests.find(r => r.id === id) || null;
  }

  /**
   * Sort requests by urgency (high > medium > low) then by date (newest first)
   */
  function sortRequestsByUrgencyAndDate(requests) {
    const urgencyOrder = { high: 0, medium: 1, low: 2 };
    return requests.sort((a, b) => {
      const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      return new Date(b.dateSubmitted) - new Date(a.dateSubmitted);
    });
  }

  // =====================
  // IN PROGRESS
  // =====================

  /**
   * Get all in-progress items
   */
  function getInProgressItems() {
    return getData(KEYS.IN_PROGRESS);
  }

  /**
   * Add a new in-progress item
   */
  function addInProgressItem(itemData) {
    const items = getData(KEYS.IN_PROGRESS);
    const newItem = {
      id: generateId('prog'),
      projectName: itemData.projectName.trim(),
      taskDescription: itemData.taskDescription.trim(),
      requester: itemData.requester.trim(),
      status: itemData.status || 'not-started',
      targetCompletionDate: itemData.targetCompletionDate || null,
      dateCreated: new Date().toISOString()
    };
    items.push(newItem);
    saveData(KEYS.IN_PROGRESS, items);
    return newItem;
  }

  /**
   * Update the status of an in-progress item
   */
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

  /**
   * Delete an in-progress item by ID
   */
  function deleteInProgressItem(id) {
    const items = getData(KEYS.IN_PROGRESS).filter(i => i.id !== id);
    return saveData(KEYS.IN_PROGRESS, items);
  }

  // =====================
  // REPORTS
  // =====================

  /**
   * Get all reports
   */
  function getReports() {
    return getData(KEYS.REPORTS);
  }

  /**
   * Add a new report
   */
  function addReport(reportData) {
    const reports = getData(KEYS.REPORTS);
    const newReport = {
      id: generateId('rpt'),
      title: reportData.title.trim(),
      projectName: reportData.projectName.trim(),
      datePublished: reportData.datePublished,
      description: (reportData.description || '').trim(),
      linkUrl: (reportData.linkUrl || '').trim(),
      isActive: reportData.isActive !== false
    };
    reports.push(newReport);
    saveData(KEYS.REPORTS, reports);
    return newReport;
  }

  /**
   * Delete a report by ID
   */
  function deleteReport(id) {
    const reports = getData(KEYS.REPORTS).filter(r => r.id !== id);
    return saveData(KEYS.REPORTS, reports);
  }

  /**
   * Get reports grouped by project name
   * @param {boolean} activeOnly - If true, only return reports from active projects
   * @returns {Object} Object with project names as keys and arrays of reports as values
   */
  function getReportsGroupedByProject(activeOnly = false) {
    let reports = getData(KEYS.REPORTS);

    if (activeOnly) {
      reports = reports.filter(r => r.isActive);
    }

    // Sort by date (newest first) within each group
    reports.sort((a, b) => new Date(b.datePublished) - new Date(a.datePublished));

    // Group by project
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
  // CROSS-CUTTING UTILITIES
  // =====================

  /**
   * Get unique project names from all data sources
   */
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

  /**
   * Filter items by search term across specified fields
   */
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
    // Requests
    getRequests,
    addRequest,
    deleteRequest,
    getRequestById,

    // In Progress
    getInProgressItems,
    addInProgressItem,
    updateInProgressStatus,
    deleteInProgressItem,

    // Reports
    getReports,
    addReport,
    deleteReport,
    getReportsGroupedByProject,

    // Utilities
    getUniqueProjects,
    filterBySearchTerm
  };
})();
