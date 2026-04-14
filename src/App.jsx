import './App.css';
import React, { useState, useEffect, useCallback } from 'react';
import Login from './pages/Login';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { loadData, saveData, addLog } from './utils/api';
import { INITIAL_PEOPLE } from './utils/constants';

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [appData, setAppData] = useState({
    availabilities: {},
    ideas: [],
    people: INITIAL_PEOPLE,
    schedule: [],
    dishAssignments: {},
    paidUsers: [],
  });
  const [darkMode, setDarkMode] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // --- Data loading ---
  const fetchData = useCallback(async () => {
    try {
      const result = await loadData();
      if (result) {
        setAppData(prev => ({
          availabilities:  result.availabilities  || {},
          ideas:           result.ideas           || [],
          people:          result.people?.length > 0 ? result.people : prev.people,
          schedule:        result.schedule        || [],
          dishAssignments: result.dishAssignments || {},
          paidUsers:       result.paidUsers       || [],
        }));
      }
    } catch { /* ignore in local dev */ }
  }, []);

  // Load on user change
  useEffect(() => { fetchData(); }, [currentUser, fetchData]);

  // Polling: only when no user or admin (not while editing)
  useEffect(() => {
    if (currentUser && currentUser !== 'Admin') return;
    const interval = setInterval(() => {
      if (!hasUnsavedChanges) fetchData();
    }, 10000);
    return () => clearInterval(interval);
  }, [currentUser, hasUnsavedChanges, fetchData]);

  // Unsaved changes warning on page close
  useEffect(() => {
    const handle = (e) => {
      if (hasUnsavedChanges) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handle);
    return () => window.removeEventListener('beforeunload', handle);
  }, [hasUnsavedChanges]);

  // Dark mode class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // --- Cloud persistence ---
  const persistToCloud = useCallback(async (data, actionObj) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const response = await saveData(data, actionObj);
      if (response && response.success && response.data) {
         setAppData(prev => ({
           availabilities:  response.data.availabilities  || {},
           ideas:           response.data.ideas           || [],
           people:          response.data.people?.length > 0 ? response.data.people : prev.people,
           schedule:        response.data.schedule        || [],
           dishAssignments: response.data.dishAssignments || {},
           paidUsers:       response.data.paidUsers       || [],
         }));
      }
    } catch {
      setSaveError('Salvataggio fallito. Riprova.');
      setTimeout(() => setSaveError(null), 5000);
    }
    setIsSaving(false);
  }, []);

  // Merge partial update into state and save
  const updateAndSave = useCallback(async (partialData, logAction, actionObj) => {
    if (actionObj) {
      // Per le azioni parziali con delta backend-side
      setAppData(prev => ({ ...prev, ...partialData })); // Aggiornamento UI ottimistico
      await persistToCloud(null, actionObj);
    } else {
      // Full save state - usato solitamente dall'admin
      const merged = { ...appData, ...partialData };
      setAppData(merged);
      await persistToCloud(merged);
    }
    if (logAction && currentUser) {
      await addLog(currentUser, logAction);
    }
  }, [appData, persistToCloud, currentUser]);

  const updateLocal = useCallback((partialData) => {
    setAppData(prev => ({ ...prev, ...partialData }));
    setHasUnsavedChanges(true);
  }, []);

  // --- Navigation ---
  const handleLogin = (name) => {
    setCurrentUser(name);
    setHasUnsavedChanges(false);
  };

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    setHasUnsavedChanges(false);
  }, []);

  // --- Routing ---
  if (!currentUser) {
    return (
      <Login
        appData={appData}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onLogin={handleLogin}
        updateAndSave={updateAndSave}
      />
    );
  }

  if (currentUser === 'Admin') {
    return (
      <AdminDashboard
        appData={appData}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onLogout={handleLogout}
        updateAndSave={updateAndSave}
        persistToCloud={persistToCloud}
        isSaving={isSaving}
        saveError={saveError}
      />
    );
  }

  return (
    <UserDashboard
      currentUser={currentUser}
      appData={appData}
      darkMode={darkMode}
      setDarkMode={setDarkMode}
      onLogout={handleLogout}
      updateAndSave={updateAndSave}
      updateLocal={updateLocal}
      persistToCloud={persistToCloud}
      isSaving={isSaving}
      saveError={saveError}
      hasUnsavedChanges={hasUnsavedChanges}
      setHasUnsavedChanges={setHasUnsavedChanges}
    />
  );
};

export default App;
