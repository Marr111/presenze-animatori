import './App.css';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Check, Calendar, Users, LogOut, Search, Printer, Shield,
  BarChart3, Activity, Clock, ChevronRight,
  Utensils, CheckCircle2, UserCheck
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell 
} from 'recharts';

// CONFIGURAZIONE
const DATES = ['Gio 2 Apr', 'Ven 3 Apr', 'Sab 4 Apr'];
const TIME_SLOTS = ['Mattino', 'Pranzo', 'Pomeriggio', 'Cena', 'Sera', 'Notte'];
const PEOPLE = [
  'Catteo Casetta', 'Laura Casetta', 'Arianna Aloi', 'Aloi Beatrice',
  'Lorenzo Trucco 04', 'Lorenzo Trucco 08', 'Simone Cavaglià', 'Simone Casetta',
  'Gloria Romano', 'Vittoria Pelassa'
].sort();

// Tutte le combinazioni data-slot per le colonne della tabella nomi
const ALL_PERIODS = DATES.flatMap(d => TIME_SLOTS.map(s => ({ date: d, slot: s })));

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [availabilities, setAvailabilities] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [testView, setTestView] = useState('summary'); 
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (isLoading) return;
      setIsLoading(true);
      try {
        let data;
        if (window.storage) {
          const result = await window.storage.get('availabilities_v2', true);
          data = result?.value ? JSON.parse(result.value) : {};
        } else {
          const saved = localStorage.getItem('availabilities_shared');
          data = saved ? JSON.parse(saved) : {};
        }
        setAvailabilities(data);
      } catch (e) {
        console.error("Errore caricamento:", e);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const saveData = async (newData) => {
    try {
      if (window.storage) {
        await window.storage.set('availabilities_v2', JSON.stringify(newData), true);
      } else {
        localStorage.setItem('availabilities_shared', JSON.stringify(newData));
      }
    } catch (e) {
      console.error("Errore salvataggio:", e);
    }
  };

  const handlePrint = () => { window.print(); };

  const toggleAvailability = async (date, slot) => {
    if (!currentUser || currentUser === 'Admin' || isLoading) return;
    const current = availabilities[currentUser]?.[date]?.[slot];
    const newValue = current === true ? null : true;
    const updated = {
      ...availabilities,
      [currentUser]: {
        ...availabilities[currentUser],
        [date]: { ...availabilities[currentUser]?.[date], [slot]: newValue }
      }
    };
    setAvailabilities(updated);
    await saveData(updated);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const countTotal = (date, slot) => 
    PEOPLE.filter(p => availabilities[p]?.[date]?.[slot] === true).length;

  const filteredPeople = useMemo(() => 
    PEOPLE.filter(p => p.toLowerCase().includes(searchTerm.toLowerCase())),
    [searchTerm]
  );

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  // LOGIN VIEW
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4">
          <div className="text-center space-y-2 mb-8">
             <div className="inline-flex p-4 bg-indigo-600 rounded-3xl shadow-lg shadow-indigo-200 mb-2">
                <Users className="w-8 h-8 text-white" />
             </div>
             <h1 className="text-3xl font-black text-slate-800 tracking-tight">Staff Portal</h1>
             <p className="text-slate-500 font-medium">Seleziona il tuo nome per iniziare</p>
          </div>
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cerca nome..."
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {filteredPeople.map(p => (
                <button key={p} onClick={() => { setCurrentUser(p); setSearchTerm(""); }}
                  className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-indigo-50 transition-all group border border-transparent hover:border-indigo-100">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    {getInitials(p)}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-bold text-slate-700 group-hover:text-indigo-700">{p}</span>
                    {p === 'Vittoria Pelassa' && <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Vicepresidente</span>}
                  </div>
                  <ChevronRight className="ml-auto w-5 h-5 text-slate-300 group-hover:text-indigo-500" />
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* PULSANTE ADMIN NASCOSTO */}
        <button 
          onClick={() => setCurrentUser('Admin')}
          className="mt-8 flex items-center gap-2 text-slate-300 hover:text-indigo-400 transition-colors text-sm font-bold"
        >
          <Shield size={16} /> Grafici tabelle infografiche
        </button>
      </div>
    );
  }

  const isAdmin = currentUser === 'Admin';

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <style>
        {`
          @media print {
            nav, button, .no-print, .fixed { display: none !important; }
            body { background: white !important; padding: 0 !important; }
            .print-container { display: block !important; width: 100% !important; }
            table { border-collapse: collapse !important; width: 100% !important; font-size: 10px !important; }
            th, td { border: 1px solid #000 !important; padding: 4px !important; }
            .matrix-cell { background: transparent !important; color: black !important; }
            .print-only { display: block !important; }
          }
          .print-only { display: none; }
        `}
      </style>

      <nav className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4 no-print">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-md">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-slate-800 tracking-tight text-lg uppercase">Tracker 2026</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-slate-600 leading-none">{currentUser}</span>
                {currentUser === 'Vittoria Pelassa' && <span className="text-[9px] font-bold text-indigo-500 uppercase">Vicepresidente</span>}
            </div>
            <button onClick={() => setCurrentUser(null)} className="p-2 bg-white shadow-sm rounded-xl text-rose-500 border border-slate-100">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8">
        {isAdmin ? (
          <div className="print-container">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 no-print">
              <div className="inline-flex bg-slate-200/50 p-1.5 rounded-2xl border border-slate-200 flex-wrap justify-center">
                {[
                  { id: 'summary', label: 'Riepilogo' },
                  { id: 'caranzano', label: 'Pasti' },
                  { id: 'matrix', label: 'Matrice Nomi' }
                ].map((v) => (
                  <button key={v.id} onClick={() => setTestView(v.id)}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all uppercase ${testView === v.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
                    {v.label}
                  </button>
                ))}
              </div>
              <button onClick={handlePrint} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all">
                <Printer size={20} /> Stampa Questa Vista
              </button>
            </div>

            {testView === 'matrix' ? (
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden print:shadow-none print:border-none">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="p-3 text-left border-r bg-white sticky left-0 z-10">Persona</th>
                        {ALL_PERIODS.map((p, i) => (
                          <th key={i} className={`p-2 text-center text-[10px] min-w-[60px] border-b ${p.slot === 'Mattino' ? 'border-l-2 border-l-slate-300' : ''}`}>
                            <div className="font-bold">{p.date.split(' ')[1]} {p.date.split(' ')[2]}</div>
                            <div className="text-slate-400 font-medium uppercase">{p.slot}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {PEOPLE.map(person => (
                        <tr key={person} className="hover:bg-slate-50">
                          <td className="p-3 font-bold border-r bg-white sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                            {person}
                          </td>
                          {ALL_PERIODS.map((p, i) => {
                            const isPresent = availabilities[person]?.[p.date]?.[p.slot] === true;
                            return (
                              <td key={i} className={`p-2 text-center border-b ${p.slot === 'Mattino' ? 'border-l-2 border-l-slate-300' : ''}`}>
                                {isPresent ? (
                                  <div className="flex justify-center"><Check size={18} className="text-emerald-500" /></div>
                                ) : (
                                  <span className="text-slate-100">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : testView === 'caranzano' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {DATES.map(d => (
                  <div key={d} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
                    <h3 className="text-xl font-black text-slate-800 border-b pb-4 mb-4">{d}</h3>
                    <div className="space-y-4">
                      {['Pranzo', 'Cena'].map(meal => (
                        <div key={meal} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                          <span className="font-bold text-slate-600">{meal}</span>
                          <span className="text-3xl font-black text-indigo-600">{countTotal(d, meal)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="p-4 text-left font-black text-slate-400 uppercase text-xs">Fascia Oraria</th>
                      {DATES.map(d => <th key={d} className="p-4 text-center font-black text-slate-400 uppercase text-xs">{d}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {TIME_SLOTS.map(s => (
                      <tr key={s} className="border-t border-slate-50">
                        <td className="p-4 font-black text-slate-700">{s}</td>
                        {DATES.map(d => (
                          <td key={d} className="p-4 text-center">
                            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl font-black">
                                <UserCheck size={16} /> {countTotal(d, s)}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* USER VIEW */
          <div className="space-y-6">
            <div className="px-2">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Le tue disponibilità</h2>
              <p className="text-slate-500 font-medium italic">Clicca sulle fasce orarie in cui sarai presente</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {DATES.map(d => (
                <div key={d} className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                    <div className="p-2 bg-indigo-50 rounded-xl"><Calendar className="w-5 h-5 text-indigo-600" /></div>
                    <span className="text-xl font-black text-slate-800">{d}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {TIME_SLOTS.map(s => {
                      const val = availabilities[currentUser]?.[d]?.[s];
                      return (
                        <button key={s} onClick={() => toggleAvailability(d, s)}
                          className={`group h-20 rounded-2xl flex flex-col items-center justify-center transition-all border-2 active:scale-95 ${
                            val === true ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-100' :
                            'bg-slate-50 border-slate-100 text-slate-400'
                          }`}>
                          {val === true ? <Check className="w-6 h-6 mb-1" /> : <Clock className="w-5 h-5 mb-1 opacity-20" />}
                          <span className="text-[10px] font-black uppercase tracking-tighter">{s}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-lg border-t border-slate-200 flex justify-center z-50 no-print">
              <button onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setCurrentUser(null); }}
                className="max-w-md w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95"
              >
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                HO FINITO / ESCI
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;