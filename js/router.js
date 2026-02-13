/**
 * Analytics Hub - State Router
 * Manages application navigation state and triggers re-renders
 */

const AppRouter = (function() {
  'use strict';

  let state = {
    currentView: 'home', // 'home' | 'client' | 'manage-clients'
    selectedDivisionId: null,
    selectedClientId: null,
    activeZone: 1, // 1, 2, or 3
    expandedDivisions: [],
    globalSearchTerm: '',
    reportsSearchTerm: '',
    showActiveProjectsOnly: true
  };

  let renderCallback = null;

  function init(callback) {
    renderCallback = callback;
  }

  function getState() {
    return { ...state };
  }

  function navigate(view, params) {
    state.currentView = view;
    if (params) {
      Object.assign(state, params);
    }
    triggerRender();
  }

  function selectClient(clientId) {
    const client = DataStore.getClientById(clientId);
    if (!client) return;

    state.currentView = 'client';
    state.selectedClientId = clientId;
    state.selectedDivisionId = client.divisionId;
    state.activeZone = 1;
    state.reportsSearchTerm = '';

    // Auto-expand the parent division
    if (!state.expandedDivisions.includes(client.divisionId)) {
      state.expandedDivisions.push(client.divisionId);
    }

    triggerRender();
  }

  function setActiveZone(zoneNumber) {
    state.activeZone = zoneNumber;
    state.reportsSearchTerm = '';
    triggerRender();
  }

  function toggleDivision(divisionId) {
    const idx = state.expandedDivisions.indexOf(divisionId);
    if (idx === -1) {
      state.expandedDivisions.push(divisionId);
    } else {
      state.expandedDivisions.splice(idx, 1);
    }
    triggerRender();
  }

  function setGlobalSearch(term) {
    state.globalSearchTerm = term;
    triggerRender();
  }

  function setReportsSearch(term) {
    state.reportsSearchTerm = term;
    triggerRender();
  }

  function setActiveProjectsOnly(value) {
    state.showActiveProjectsOnly = value;
    triggerRender();
  }

  function goHome() {
    state.currentView = 'home';
    state.selectedClientId = null;
    state.selectedDivisionId = null;
    state.activeZone = 1;
    state.globalSearchTerm = '';
    state.reportsSearchTerm = '';
    triggerRender();
  }

  function triggerRender() {
    if (renderCallback) renderCallback();
  }

  return {
    init,
    getState,
    navigate,
    selectClient,
    setActiveZone,
    toggleDivision,
    setGlobalSearch,
    setReportsSearch,
    setActiveProjectsOnly,
    goHome
  };
})();
