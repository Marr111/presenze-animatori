import React, { useState } from 'react';
import { ChevronRight, UserPlus, Trash2, Sun, Moon, Github, MessageSquareWarning } from 'lucide-react';
import { getInitials, hasFilledIn } from '../utils/helpers';
import IssueModal from '../components/IssueModal';

const Login = ({ appData, darkMode, setDarkMode, onLogin, updateAndSave }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteMode, setDeleteMode] = useState(false);
  const [showIssue, setShowIssue] = useState(false);

  const { people, availabilities } = appData;

  const addPerson = async () => {
    const name = prompt('Inserisci Nome e Cognome:');
    if (!name || !name.trim()) return;
    if (people.includes(name.trim())) {
      alert(`"${name}" è già presente nella lista.`);
      return;
    }
    const newPeople = [...people, name.trim()].sort();
    await updateAndSave({ people: newPeople }, `${name.trim()} si è registrato`);
    onLogin(name.trim());
  };

  const deletePerson = async (name) => {
    if (!confirm(`Sei sicuro di voler eliminare "${name}"?\nVerranno cancellate anche tutte le sue presenze.`)) return;
    const newPeople = people.filter(p => p !== name);
    const newAvail = { ...availabilities };
    delete newAvail[name];
    await updateAndSave({ people: newPeople, availabilities: newAvail }, `Admin ha eliminato l'utente ${name}`);
  };

  const dm = darkMode;

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-300 relative overflow-hidden ${
      dm ? 'bg-[#0a1a0e] text-white' : 'bg-[#fef5e8] text-[#1a2e1a]'
    }`}>

      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full bg-[#c41e3a]/10 blur-[120px]" />
        <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full bg-[#2d7a4e]/10 blur-[120px]" />
      </div>

      {/* Dark mode toggle */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setDarkMode(!dm)}
          className={`p-3 rounded-full transition-all ${dm ? 'bg-amber-900/20 hover:bg-amber-900/40 text-amber-300' : 'bg-amber-100 hover:bg-amber-200 text-amber-600'}`}
        >
          {dm ? <Sun size={22} /> : <Moon size={22} />}
        </button>
      </div>

      {/* Logo */}
      <div className="text-center mb-8 relative z-10">
        <div className="text-6xl mb-3 drop-shadow-lg">🎄</div>
        <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#c41e3a] via-[#e8c84b] to-[#2d7a4e] tracking-tighter">
          Triduo Tracker
        </h1>
        <p className={`text-sm font-bold mt-2 tracking-widest uppercase ${dm ? 'text-emerald-400/50' : 'text-emerald-700/50'}`}>
          ✦ Natale 2026 ✦
        </p>
      </div>

      {/* Main card */}
      <div className={`max-w-md w-full rounded-[2.5rem] p-6 border relative z-10 ${
        dm ? 'bg-[#132019]/80 border-[#1e3a2a] backdrop-blur-md' : 'bg-white/90 border-[#e0c9a8] shadow-2xl shadow-[#c41e3a]/10 backdrop-blur-md'
      }`}>

        {/* Card header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-black">Chi sei? 👋</h2>
          <button
            onClick={() => setDeleteMode(d => !d)}
            className={`p-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
              deleteMode
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                : dm
                  ? 'bg-[#1e3a2a] text-red-400 hover:bg-red-500/20'
                  : 'bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500'
            }`}
          >
            <Trash2 size={13} />
            {deleteMode ? 'Annulla' : 'Elimina'}
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Cerca il tuo nome..."
          className={`w-full px-4 py-3 rounded-2xl mb-4 border outline-none focus:ring-2 ring-[#c41e3a]/40 transition-all ${
            dm ? 'bg-[#0a1a0e] border-[#1e3a2a] text-white placeholder-white/30' : 'bg-slate-50 border-slate-200 placeholder-slate-400'
          }`}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />

        {/* People list */}
        <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
          {people.filter(p => p.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
            <div key={p} className={`flex items-center gap-3 p-2 rounded-xl transition-all ${
              deleteMode ? (dm ? 'bg-red-500/5 border border-red-900/30' : 'bg-red-50 border border-red-100') : 'border border-transparent'
            }`}>
              <button
                onClick={() => !deleteMode && onLogin(p)}
                disabled={deleteMode}
                className={`flex-1 flex items-center gap-3 p-2 rounded-xl transition-all ${
                  !deleteMode ? (dm ? 'hover:bg-[#1e3a2a]' : 'hover:bg-red-50/80') : ''
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#c41e3a] to-[#2d7a4e] text-white flex items-center justify-center font-black text-xs shadow-lg shadow-[#c41e3a]/20 flex-shrink-0">
                  {getInitials(p)}
                </div>
                <span className={`font-bold text-lg ${
                  deleteMode ? 'opacity-50' : hasFilledIn(p, availabilities) ? 'text-emerald-500' : ''
                }`}>{p}</span>
              </button>
              {deleteMode ? (
                <button onClick={() => deletePerson(p)} className="ml-auto p-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors shadow-md">
                  <Trash2 size={15} />
                </button>
              ) : (
                <ChevronRight className="ml-auto w-5 h-5 opacity-30 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Add new */}
        <div className="mt-3 pt-3 border-t border-dashed border-[#1e3a2a]/50">
          <button
            onClick={addPerson}
            className={`w-full p-4 border-2 border-dashed rounded-2xl font-black flex items-center justify-center gap-2 transition-all text-sm uppercase ${
              dm
                ? 'border-[#1e3a2a] text-emerald-400/60 hover:bg-[#1e3a2a] hover:text-emerald-300'
                : 'border-red-200 text-red-500/70 hover:bg-red-50 hover:border-red-400'
            }`}
          >
            <UserPlus size={18} /> Aggiungi nuovo nome
          </button>
        </div>

        {/* Admin */}
        <button
          onClick={() => onLogin('Admin')}
          className={`w-full mt-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
            dm ? 'text-white/20 hover:text-white/50 hover:bg-white/5' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-50'
          }`}
        >
          Admin Access
        </button>
      </div>

      {/* Footer */}
      <div className="mt-8 flex items-center gap-4 relative z-10">
        <a
          href="https://github.com/Marr111/presenze-animatori"
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm transition-all ${
            dm ? 'bg-[#132019] text-white/50 hover:text-white border border-[#1e3a2a]' : 'bg-white text-slate-500 hover:text-slate-800 border border-slate-200 shadow-sm'
          }`}
        >
          <Github size={16} /> GitHub
        </a>
        <button
          onClick={() => setShowIssue(true)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm transition-all ${
            dm ? 'bg-[#132019] text-white/50 hover:text-white border border-[#1e3a2a]' : 'bg-white text-slate-500 hover:text-slate-800 border border-slate-200 shadow-sm'
          }`}
        >
          <MessageSquareWarning size={16} /> Segnala
        </button>
      </div>

      {showIssue && <IssueModal darkMode={dm} onClose={() => setShowIssue(false)} />}
    </div>
  );
};

export default Login;
