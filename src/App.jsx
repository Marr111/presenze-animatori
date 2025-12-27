import './App.css';
import React, { useState, useEffect, useMemo } from 'react';
// Importazione icone
import { 
  Check, Calendar, Users, LogOut, Search, Printer, Shield,
  Activity, Clock, ChevronRight, CheckCircle2, 
  UserCheck, Lightbulb, Send, Trash2, BarChart3, TrendingUp, Utensils, AlertTriangle, Database, Trash
} from 'lucide-react';

// Importazione componenti Recharts - Rimosso ResponsiveContainer per stabilità
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';

// --- CONFIGURAZIONE COSTANTI ---
const DATES = ['Gio 2 Apr', 'Ven 3 Apr', 'Sab 4 Apr'];
const TIME_SLOTS = ['Mattino', 'Pranzo', 'Pomeriggio', 'Cena', 'Sera', 'Notte'];
const PEOPLE = [
  'Catteo Casetta', 'Laura Casetta', 'Arianna Aloi', 'Aloi Beatrice',
  'Lorenzo Trucco 04', 'Lorenzo Trucco 08', 'Simone Cavaglià', 'Simone Casetta',
  'Gloria Romano', 'Vittoria Pelassa'
].sort();

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4'];
const ALL_PERIODS = DATES.flatMap(d => TIME_SLOTS.map(s => ({ date: d, slot: s })));

const App = () => {
  // --- STATO ---
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [availabilities, setAvailabilities] = useState({});
  const [ideas, setIdeas] = useState([]);
  const [newIdea, setNewIdea] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [testView, setTestView] = useState('summary'); 
  const [isLoading, setIsLoading] = useState(false);

  // --- CARICAMENTO DATI ---
  useEffect(() => {
    const loadData = async () => {
      if (isLoading) return;
      setIsLoading(true);
      try {
        let data;
        if (window.storage) {
          const resAvail = await window.storage.get('availabilities_shared', true);
          const resIdeas = await window.storage.get('triduo_ideas', true);
          setAvailabilities(resAvail?.value ? JSON.parse(resAvail.value) : {});
          setIdeas(resIdeas?.value ? JSON.parse(resIdeas.value) : []);
        } else {
          const savedAvail = localStorage.getItem('availabilities_shared');
          const savedIdeas = localStorage.getItem('triduo_ideas');
          setAvailabilities(savedAvail ? JSON.parse(savedAvail) : {});
          setIdeas(savedIdeas ? JSON.parse(savedIdeas) : []);
        }
      } catch (e) { console.error("Errore:", e); } finally { setIsLoading(false); }
    };
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const saveData = async (key, newData) => {
    try {
      if (window.storage) await window.storage.set(key, JSON.stringify(newData), true);
      else localStorage.setItem(key, JSON.stringify(newData));
    } catch (e) { console.error("Errore salvataggio:", e); }
  };

  // --- FUNZIONI RESET / TEST DATA (NUOVE) ---
  const clearAllData = async () => {
    if (window.confirm("ATTENZIONE: Questa azione cancellerà DEFINITIVAMENTE tutte le presenze e tutte le idee. Sei sicuro?")) {
      setAvailabilities({});
      setIdeas([]);
      await saveData('availabilities_shared', {});
      await saveData('triduo_ideas', []);
      alert("Database svuotato con successo.");
    }
  };

  const setTestData = async () => {
    if (window.confirm("Questa azione sostituirà i dati attuali con dei dati di prova. Procedere?")) {
      const dummyAvail = {};
      PEOPLE.forEach(p => {
        dummyAvail[p] = {};
        DATES.forEach(d => {
          dummyAvail[p][d] = {};
          TIME_SLOTS.forEach(s => {
            if (Math.random() > 0.6) dummyAvail[p][d][s] = true;
          });
        });
      });
      const dummyIdeas = [{ id: 1, text: "Esempio di idea per il triduo", author: "Sistema" }];
      setAvailabilities(dummyAvail);
      setIdeas(dummyIdeas);
      await saveData('availabilities_shared', dummyAvail);
      await saveData('triduo_ideas', dummyIdeas);
      alert("Dati di test inseriti.");
    }
  };

  // --- LOGICA DISPONIBILITÀ ---
  const toggleAvailability = async (date, slot) => {
    if (!currentUser || currentUser === 'Admin' || isLoading) return;
    const current = availabilities[currentUser]?.[date]?.[slot];
    const newValue = current === true ? null : true;
    const updated = {
      ...availabilities,
      [currentUser]: { ...availabilities[currentUser], [date]: { ...availabilities[currentUser]?.[date], [slot]: newValue } }
    };
    setAvailabilities(updated);
    await saveData('availabilities_shared', updated);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  // --- UTILITY ---
  const countTotal = (date, slot) => PEOPLE.filter(p => availabilities[p]?.[date]?.[slot] === true).length;
  const filteredPeople = useMemo(() => PEOPLE.filter(p => p.toLowerCase().includes(searchTerm.toLowerCase())), [searchTerm]);
  const getInitials = (name) => name.split(' ').map(n => n[0]).filter(char => /[a-zA-Z]/.test(char)).join('').toUpperCase();

  // --- DATI GRAFICI ---
  const chartsData = useMemo(() => {
    const timeline = ALL_PERIODS.map(p => ({
      name: `${p.date.split(' ')[1]} ${p.slot[0]}.`,
      persone: countTotal(p.date, p.slot)
    }));
    const meals = [
      { name: 'Pranzi', value: DATES.reduce((acc, d) => acc + countTotal(d, 'Pranzo'), 0) },
      { name: 'Cene', value: DATES.reduce((acc, d) => acc + countTotal(d, 'Cena'), 0) }
    ];
    const topStaff = PEOPLE.map(p => {
      let count = 0;
      DATES.forEach(d => TIME_SLOTS.forEach(s => { if (availabilities[p]?.[d]?.[s]) count++; }));
      return { name: p.split(' ')[0], impegni: count };
    }).sort((a,b) => b.impegni - a.impegni).slice(0, 8);
    return { timeline, meals, topStaff };
  }, [availabilities]);

  // --- LOGIN VIEW ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex flex-col items-center justify-center">
        <div className="text-center space-y-2 mb-10">
           <div className="inline-flex p-3 bg-indigo-600 rounded-2xl shadow-lg text-white"><Users size={28} /></div>
           <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none text-center">Triduo pasquale 2026</h1>
           <p className="text-slate-500 font-medium italic">ciaooo</p>
        </div>
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-6 flex flex-col h-[550px]">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2"><Search size={20} className="text-indigo-600"/> Accedi</h2>
            <input type="text" placeholder="Cerca il tuo nome..." className="w-full px-4 py-3 bg-slate-50 rounded-2xl mb-4 outline-none focus:ring-2 focus:ring-indigo-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {filteredPeople.map(p => (
                <button key={p} onClick={() => setCurrentUser(p)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs group-hover:bg-indigo-600 group-hover:text-white">{getInitials(p)}</div>
                  <span className="font-bold text-slate-700">{p}</span>
                  <ChevronRight className="ml-auto text-slate-300 group-hover:text-indigo-500" />
                </button>
              ))}
            </div>
            <button onClick={() => setCurrentUser('Admin')} className="mt-4 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 font-bold text-xs"><Shield size={14} /> Pannello Admin</button>
          </div>
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-6 flex flex-col h-[550px]">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2"><Lightbulb size={20} className="text-amber-500"/> Idee Triduo</h2>
            <div className="flex gap-2 mb-4">
              <input type="text" placeholder="Scrivi un'idea..." className="flex-1 px-4 py-3 bg-slate-50 rounded-2xl outline-none" value={newIdea} onChange={(e) => setNewIdea(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (() => {
                if (!newIdea.trim()) return;
                const updatedIdeas = [...ideas, { id: Date.now(), text: newIdea, author: 'Anonimo' }];
                setIdeas(updatedIdeas);
                setNewIdea("");
                saveData('triduo_ideas', updatedIdeas);
              })()} />
              <button onClick={() => {
                if (!newIdea.trim()) return;
                const updatedIdeas = [...ideas, { id: Date.now(), text: newIdea, author: 'Anonimo' }];
                setIdeas(updatedIdeas);
                setNewIdea("");
                saveData('triduo_ideas', updatedIdeas);
              }} className="p-3 bg-amber-500 text-white rounded-2xl hover:bg-amber-600"><Send size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {ideas.length === 0 ? <div className="h-full flex flex-col items-center justify-center opacity-30 text-xs font-bold uppercase tracking-widest">Nessuna idea</div> : 
                [...ideas].reverse().map(idea => (
                  <div key={idea.id} className="group p-3 bg-slate-50 border rounded-xl hover:border-amber-200">
                    <p className="text-slate-700 font-bold text-sm leading-tight">{idea.text}</p>
                    <div className="mt-2 flex justify-between items-center text-[9px] font-black uppercase text-slate-400">
                      <span>Da: {idea.author}</span>
                      <button onClick={async () => {
                        const updated = ideas.filter(i => i.id !== idea.id);
                        setIdeas(updated);
                        await saveData('triduo_ideas', updated);
                      }} className="text-slate-300 hover:text-rose-500"><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- VISTA MAIN ---
  const isAdmin = currentUser === 'Admin';
  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <nav className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b px-6 py-4 flex justify-between items-center no-print">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentUser(null)}>
          <Activity className="text-indigo-600" /> <span className="font-black">TRACKER 2026</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">{currentUser}</span>
          <button onClick={() => setCurrentUser(null)} className="p-2 text-rose-500"><LogOut size={20} /></button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 sm:p-8">
        {isAdmin ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-wrap gap-2 justify-between items-center no-print">
              <div className="inline-flex bg-slate-200/50 p-1.5 rounded-2xl">
                {['summary', 'caranzano', 'matrix', 'charts', 'data'].map(v => (
                  <button key={v} onClick={() => setTestView(v)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase ${testView === v ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    {v === 'summary' ? 'Tabella' : v === 'caranzano' ? 'Pasti' : v === 'matrix' ? 'Foglio' : v === 'charts' ? 'Grafici' : 'Dati'}
                  </button>
                ))}
              </div>
              <button onClick={() => window.print()} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-100"><Printer size={18} /> Stampa</button>
            </div>

            {testView === 'charts' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Timeline */}
                <div className="bg-white p-6 rounded-3xl border shadow-sm">
                  <h3 className="font-black text-xs uppercase mb-6 flex items-center gap-2 text-indigo-600"><TrendingUp size={16}/> Affluenza</h3>
                  <AreaChart width={450} height={250} data={chartsData.timeline} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{fontSize: 10}} />
                    <YAxis tick={{fontSize: 10}} />
                    <Tooltip />
                    <Area type="monotone" dataKey="persone" stroke="#6366f1" fill="#6366f122" />
                  </AreaChart>
                </div>
                {/* Pasti */}
                <div className="bg-white p-6 rounded-3xl border shadow-sm">
                  <h3 className="font-black text-xs uppercase mb-6 flex items-center gap-2 text-rose-600"><Utensils size={16}/> Carico Cucina</h3>
                  <PieChart width={450} height={250}>
                    <Pie data={chartsData.meals} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {chartsData.meals.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </div>
                {/* Staff */}
                <div className="bg-white p-6 rounded-3xl border shadow-sm col-span-1 md:col-span-2">
                  <h3 className="font-black text-xs uppercase mb-6 flex items-center gap-2 text-emerald-600"><Users size={16}/> Classifica Staff (Slot Coperti)</h3>
                  <BarChart width={900} height={300} data={chartsData.topStaff} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{fontSize: 10}} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="impegni" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </div>
              </div>
            ) : testView === 'data' ? (
              /* SEZIONE GESTIONE DATI */
              <div className="space-y-12 py-10">
                <div className="bg-white p-10 rounded-[3rem] border-4 border-rose-100 shadow-2xl space-y-8">
                  <div className="flex items-center gap-6 text-rose-600">
                    <AlertTriangle size={64} strokeWidth={3} />
                    <div>
                      <h2 className="text-5xl font-black uppercase tracking-tighter">Zona Pericolosa</h2>
                      <p className="text-xl font-bold opacity-60 italic">Gestione distruttiva del database</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* PULSANTE RESET TOTALE */}
                    <div className="bg-rose-50 p-8 rounded-[2rem] border-2 border-rose-200 space-y-6">
                      <div className="flex items-center gap-3 text-rose-700">
                        <Trash size={32} />
                        <h3 className="text-2xl font-black uppercase">Pulisci Tutto</h3>
                      </div>
                      <p className="text-rose-900 font-bold leading-tight">
                        CANCELLA DEFINITIVAMENTE TUTTE LE DISPONIBILITÀ E LE IDEE. 
                        QUESTA AZIONE NON PUÒ ESSERE ANNULLATA.
                      </p>
                      <button 
                        onClick={clearAllData}
                        className="w-full bg-rose-600 hover:bg-rose-700 text-white py-6 rounded-2xl font-black text-xl shadow-xl shadow-rose-200 transition-all active:scale-95"
                      >
                        ESEGUI WIPE DATABASE
                      </button>
                    </div>

                    {/* PULSANTE TEST DATA */}
                    <div className="bg-indigo-50 p-8 rounded-[2rem] border-2 border-indigo-200 space-y-6">
                      <div className="flex items-center gap-3 text-indigo-700">
                        <Database size={32} />
                        <h3 className="text-2xl font-black uppercase">Dati di Test</h3>
                      </div>
                      <p className="text-indigo-900 font-bold leading-tight">
                        SOVRASCRIVI I DATI ATTUALI CON VALORI CASUALI GENERATI DAL SISTEMA. 
                        UTILE PER CONTROLLARE I GRAFICI.
                      </p>
                      <button 
                        onClick={setTestData}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 rounded-2xl font-black text-xl shadow-xl shadow-indigo-200 transition-all active:scale-95"
                      >
                        GENERA DATI FAKE
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : testView === 'matrix' ? (
              <div className="bg-white rounded-3xl border shadow-xl overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50"><tr><th className="p-3 text-left sticky left-0 bg-white border-r">Persona</th>{ALL_PERIODS.map((p,i)=><th key={i} className="p-2 border-b min-w-[50px]"><div className="font-bold">{p.date.split(' ')[1]}</div><div>{p.slot[0]}</div></th>)}</tr></thead>
                  <tbody>{PEOPLE.map(person => <tr key={person} className="border-b hover:bg-slate-50"><td className="p-3 font-bold sticky left-0 bg-white border-r">{person}</td>{ALL_PERIODS.map((p,i)=><td key={i} className="text-center">{availabilities[person]?.[p.date]?.[p.slot] && <Check size={14} className="mx-auto text-emerald-500"/>}</td>)}</tr>)}</tbody>
                </table>
              </div>
            ) : testView === 'caranzano' ? (
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {DATES.map(d => (
                   <div key={d} className="bg-white rounded-[2rem] p-6 border shadow-sm">
                     <h3 className="text-xl font-black text-slate-800 border-b pb-4 mb-4 uppercase">{d}</h3>
                     {['Pranzo', 'Cena'].map(meal => (
                       <div key={meal} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl mb-2">
                         <span className="font-bold text-slate-600">{meal}</span>
                         <span className="text-3xl font-black text-indigo-600">{countTotal(d, meal)}</span>
                       </div>
                     ))}
                   </div>
                 ))}
               </div>
            ) : (
              <div className="bg-white rounded-3xl border p-6 overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="text-slate-400 text-xs uppercase font-black"><th className="text-left p-3">Fascia</th>{DATES.map(d=><th key={d}>{d}</th>)}</tr></thead>
                  <tbody>{TIME_SLOTS.map(s=><tr key={s} className="border-t"><td>{s}</td>{DATES.map(d=><td key={d} className="text-center font-black text-indigo-600"><UserCheck size={14} className="inline mr-1"/>{countTotal(d,s)}</td>)}</tr>)}</tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* VISTA UTENTE */
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Le tue disponibilità</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {DATES.map(d => (
                <div key={d} className="bg-white rounded-[2.5rem] p-6 border shadow-sm">
                  <div className="flex items-center gap-2 border-b pb-3 mb-4"><Calendar className="text-indigo-600" /><span className="font-black uppercase">{d}</span></div>
                  <div className="grid grid-cols-2 gap-2">
                    {TIME_SLOTS.map(s => {
                      const val = availabilities[currentUser]?.[d]?.[s];
                      return (
                        <button key={s} onClick={() => toggleAvailability(d, s)} className={`h-16 rounded-2xl flex flex-col items-center justify-center border-2 transition-all ${val ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                          {val ? <Check size={18}/> : <Clock size={14} className="opacity-20"/>}
                          <span className="text-[9px] font-black uppercase tracking-tight">{s}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-lg border-t flex justify-center z-50 no-print">
              <button onClick={() => { window.scrollTo(0,0); setCurrentUser(null); }} className="max-w-md w-full bg-slate-900 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all">
                <CheckCircle2 className="text-emerald-400" /> SALVA ED ESCI
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;