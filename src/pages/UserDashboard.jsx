import React, { useState } from 'react';
import { Check, Activity, AlertTriangle, Utensils, Clock, CalendarDays } from 'lucide-react';
import Navbar from '../components/Navbar';
import IdeaBoard from '../components/IdeaBoard';
import ProgramSection from '../components/ProgramSection';
import { DATES, DAY_SLOTS } from '../utils/constants';
import { calculateDebt, downloadICS } from '../utils/helpers';

const TABS = [
  { key: 'turni', label: '📅 I Miei Turni' },
  { key: 'idee', label: '💡 Idee' },
  { key: 'programma', label: '📋 Programma' },
];

const UserDashboard = ({
  currentUser, appData, darkMode, setDarkMode,
  onLogout, updateAndSave, updateLocal, isSaving, saveError,
  hasUnsavedChanges, setHasUnsavedChanges, persistToCloud,
}) => {
  const [activeTab, setActiveTab] = useState('turni');
  const { availabilities, ideas, people, schedule } = appData;

  const dm = darkMode;
  const debt = calculateDebt(currentUser, availabilities);

  const card = dm ? 'bg-[#132019] border-[#1e3a2a]' : 'bg-white border-slate-100 shadow-sm';

  // --- Availability toggle ---
  const toggleAvailability = (date, slot) => {
    const userAvail = availabilities[currentUser] || {};
    const dayAvail = userAvail[date] || {};
    const newAvail = {
      ...availabilities,
      [currentUser]: {
        ...userAvail,
        [date]: { ...dayAvail, [slot]: !dayAvail[slot] },
      },
    };
    updateLocal({ availabilities: newAvail });
  };

  const toggleAllDay = (date) => {
    const userAvail = availabilities[currentUser] || {};
    const dayAvail = userAvail[date] || {};
    const allSelected = DAY_SLOTS[date].every(s => dayAvail[s] === true);
    const newDay = {};
    DAY_SLOTS[date].forEach(s => { newDay[s] = !allSelected; });
    const newAvail = { ...availabilities, [currentUser]: { ...userAvail, [date]: newDay } };
    updateLocal({ availabilities: newAvail });
  };

  const handleFinalSave = async () => {
    const userSlots = availabilities[currentUser] || {};
    const count = Object.values(userSlots).flatMap(d => Object.values(d)).filter(Boolean).length;
    
    // Pass user updates to be merged properly backend side without race conditions
    await persistToCloud(null, { type: 'UPDATE_USER_AVAIL', payload: { user: currentUser, avail: userSlots } });
    
    if (count > 0) {
      const { addLog } = await import('../utils/api');
      await addLog(currentUser, `ha confermato la sua presenza (${count} turni selezionati)`);
    }
    setHasUnsavedChanges(false);
    onLogout();
  };

  // --- Ideas handlers ---
  const handleAddIdea = async (text) => {
    const newIdea = { id: Date.now(), text };
    const newIdeas = [...ideas, newIdea];
    await updateAndSave({ ideas: newIdeas }, `ha aggiunto l'idea: "${text}"`, { type: 'ADD_IDEA', payload: { idea: newIdea } });
  };

  const handleDeleteIdea = async (id) => {
    if (!confirm('Vuoi davvero cancellare questa idea?')) return;
    const idea = ideas.find(i => i.id === id);
    const newIdeas = ideas.filter(i => i.id !== id);
    await updateAndSave({ ideas: newIdeas }, `ha eliminato l'idea: "${idea?.text}"`, { type: 'DELETE_IDEA', payload: { id } });
  };

  const handleUpdateIdea = async (editedIdea) => {
    const newIdeas = ideas.map(i => i.id === editedIdea.id ? { ...i, text: editedIdea.text } : i);
    await updateAndSave({ ideas: newIdeas }, `ha modificato un'idea`, { type: 'UPDATE_IDEA', payload: { idea: editedIdea } });
  };

  return (
    <div className={`min-h-screen pb-32 transition-colors duration-300 ${dm ? 'bg-[#0a1a0e] text-white' : 'bg-[#fef5e8] text-[#1a2e1a]'}`}>
      <Navbar currentUser={currentUser} darkMode={dm} setDarkMode={setDarkMode} onLogout={() => {
        if (hasUnsavedChanges && !confirm('Hai modifiche non salvate. Sicuro di voler uscire?')) return;
        onLogout();
      }} />

      <main className="max-w-2xl mx-auto p-4 md:p-6">
        {/* Hero card */}
        <div className="bg-gradient-to-br from-[#c41e3a] to-[#7a1020] p-7 rounded-[2.5rem] text-white flex justify-between items-center shadow-2xl shadow-[#c41e3a]/30 mb-6 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-black uppercase tracking-tight">
              Ciao, <br />{currentUser.split(' ')[0]} 👋
            </h2>
            <p className="opacity-70 text-xs mt-1 font-bold uppercase tracking-widest">Triduo 2026 · Casa Alpina</p>
          </div>
          <div className="text-right bg-white/10 backdrop-blur-md p-4 rounded-[1.5rem] border border-white/20 relative z-10 min-w-[120px]">
            <div className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">Da Versare</div>
            <div className="text-4xl font-black">{debt}€</div>
          </div>
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-[#e8c84b]/20 rounded-full blur-2xl" />
          <div className="absolute top-2 right-2 text-4xl opacity-20">🎄</div>
        </div>

        {/* Tabs */}
        <div className={`flex gap-1 p-1.5 rounded-2xl mb-5 ${dm ? 'bg-[#132019]' : 'bg-slate-100'}`}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === tab.key
                  ? 'bg-[#c41e3a] text-white shadow-md shadow-[#c41e3a]/30'
                  : dm ? 'text-white/40 hover:text-white/70' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* --- TAB: TURNI --- */}
        {activeTab === 'turni' && (
          <div className="space-y-4">
            {/* ICS download */}
            <button
              onClick={() => downloadICS(currentUser, availabilities)}
              className={`w-full p-4 rounded-2xl border flex items-center gap-4 transition-all ${card}`}
            >
              <CalendarDays className="text-[#c41e3a]" size={28} />
              <div className="text-left">
                <div className="font-black uppercase text-sm">Aggiungi al Calendario</div>
                <div className="text-[10px] opacity-50">Scarica i tuoi turni come file .ics</div>
              </div>
            </button>

            {DATES.map(d => {
              const allSelected = DAY_SLOTS[d].every(s => availabilities[currentUser]?.[d]?.[s] === true);
              return (
                <div key={d} className={`p-5 rounded-[2rem] border ${card}`}>
                  <div className="flex items-center justify-between mb-4 border-b pb-3 border-[#1e3a2a]/30">
                    <span className={`font-black text-sm uppercase tracking-widest ${dm ? 'text-emerald-400' : 'text-emerald-700'}`}>{d}</span>
                    <button
                      onClick={() => toggleAllDay(d)}
                      className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                        allSelected
                          ? 'bg-[#c41e3a] text-white shadow-md shadow-[#c41e3a]/30'
                          : dm ? 'bg-[#1e3a2a] text-white/40 hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-red-50'
                      }`}
                    >
                      {allSelected ? <Check size={11} /> : null}
                      {allSelected ? 'Deseleziona tutto' : 'Seleziona tutto'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {DAY_SLOTS[d].map(s => {
                      const active = availabilities[currentUser]?.[d]?.[s];
                      const isMeal = ['Pranzo', 'Cena'].includes(s);
                      return (
                        <button
                          key={s}
                          onClick={() => toggleAvailability(d, s)}
                          className={`relative py-4 rounded-xl font-black uppercase transition-all flex flex-col items-center justify-center border-2 ${
                            active
                              ? 'bg-[#c41e3a] border-[#c41e3a] text-white shadow-lg shadow-[#c41e3a]/30'
                              : dm
                                ? 'border-[#1e3a2a] text-white/30 hover:border-[#2a4a35] hover:text-white/60'
                                : 'border-slate-100 text-slate-400 hover:border-red-200'
                          }`}
                        >
                          <div className="flex items-center gap-1 mb-1">
                            {isMeal ? <Utensils size={14} /> : <Clock size={14} />}
                          </div>
                          <span className="text-[10px] tracking-wide">{s}</span>
                          {isMeal && !active && (
                            <span className="absolute top-1 right-1 text-[8px] bg-emerald-100 text-emerald-600 px-1 rounded font-bold">+5€</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* --- TAB: IDEE --- */}
        {activeTab === 'idee' && (
          <div className={`p-6 rounded-[2rem] border min-h-[400px] ${card}`}>
            <IdeaBoard
              ideas={ideas}
              darkMode={dm}
              onAddIdea={handleAddIdea}
              onDeleteIdea={handleDeleteIdea}
              onUpdateIdea={handleUpdateIdea}
            />
          </div>
        )}

        {/* --- TAB: PROGRAMMA --- */}
        {activeTab === 'programma' && (
          <div className={`p-6 rounded-[2rem] border ${card}`}>
            <ProgramSection
              schedule={schedule}
              darkMode={dm}
              isAdmin={false}
              onUpdate={() => {}}
            />
          </div>
        )}
      </main>

      {/* Save error toast */}
      {saveError && (
        <div className="fixed top-20 left-0 right-0 flex justify-center z-50 pointer-events-none">
          <div className="pointer-events-auto bg-red-500 text-white px-6 py-3 rounded-2xl shadow-2xl font-bold flex items-center gap-2 text-sm animate-bounce">
            <AlertTriangle size={18} /> {saveError}
          </div>
        </div>
      )}

      {/* Bottom save CTA */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 no-print px-4">
        <button
          onClick={handleFinalSave}
          disabled={isSaving}
          className="w-full max-w-sm py-4 rounded-[2rem] font-black text-lg shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-[#c41e3a] to-[#a01830] text-white border-4 border-white/20 backdrop-blur-md shadow-[#c41e3a]/40"
        >
          {isSaving ? <Activity className="animate-spin" /> : <><Check size={24} /> SALVA TUTTO</>}
        </button>
      </div>
    </div>
  );
};

export default UserDashboard;
