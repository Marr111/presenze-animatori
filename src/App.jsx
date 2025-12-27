import './App.css';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Check, Calendar, Users, LogOut, Search, Printer, Shield,
  Activity, Clock, ChevronRight, CheckCircle2, 
  UserCheck, Lightbulb, Send, Trash2, BarChart3, TrendingUp, Utensils, AlertTriangle, Database, Trash, PieChart as PieIcon
} from 'lucide-react';

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, Radar,
  LineChart, Line
} from 'recharts';

// --- CONFIGURAZIONE COSTANTI ---
const DATES = ['Gio 2 Apr', 'Ven 3 Apr', 'Sab 4 Apr'];
const TIME_SLOTS = ['Mattino', 'Pranzo', 'Pomeriggio', 'Cena', 'Sera', 'Notte'];
const PEOPLE = [
  'Catteo Casetta', 'Laura Casetta', 'Arianna Aloi', 'Aloi Beatrice',
  'Lorenzo Trucco 04', 'Lorenzo Trucco 08', 'Simone Cavaglià', 'Simone Casetta',
  'Gloria Romano', 'Vittoria Pelassa'
].sort();

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#4f46e5'];
const ALL_PERIODS = DATES.flatMap(d => TIME_SLOTS.map(s => ({ date: d, slot: s })));

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [availabilities, setAvailabilities] = useState({});
  const [ideas, setIdeas] = useState([]);
  const [newIdea, setNewIdea] = useState("");
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
    } catch (e) { console.error("Errore:", e); }
  };

  const clearAllData = async () => {
    if (window.confirm("ATTENZIONE: Azione distruttiva. Cancellare tutto?")) {
      setAvailabilities({});
      setIdeas([]);
      await saveData('availabilities_shared', {});
      await saveData('triduo_ideas', []);
    }
  };

  const setTestData = async () => {
    const dummyAvail = {};
    PEOPLE.forEach(p => {
      dummyAvail[p] = {};
      DATES.forEach(d => {
        dummyAvail[p][d] = {};
        TIME_SLOTS.forEach(s => { if (Math.random() > 0.5) dummyAvail[p][d][s] = true; });
      });
    });
    setAvailabilities(dummyAvail);
    await saveData('availabilities_shared', dummyAvail);
  };

  const toggleAvailability = async (date, slot) => {
    if (!currentUser || currentUser === 'Admin') return;
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

  const countTotal = (date, slot) => PEOPLE.filter(p => availabilities[p]?.[date]?.[slot] === true).length;
  const filteredPeople = useMemo(() => PEOPLE.filter(p => p.toLowerCase().includes(searchTerm.toLowerCase())), [searchTerm]);
  const getInitials = (name) => name.split(' ').map(n => n[0]).filter(char => /[a-zA-Z]/.test(char)).join('').toUpperCase();

  // --- LOGICA GRAFICI (8 VISUALIZZAZIONI) ---
  const chartsData = useMemo(() => {
    // 1. Timeline presenze
    const timeline = ALL_PERIODS.map(p => ({
      name: `${p.date.split(' ')[1]} ${p.slot[0]}.`,
      persone: countTotal(p.date, p.slot)
    }));

    // 2. Carico Pasti
    const meals = [
      { name: 'Pranzi', value: DATES.reduce((acc, d) => acc + countTotal(d, 'Pranzo'), 0) },
      { name: 'Cene', value: DATES.reduce((acc, d) => acc + countTotal(d, 'Cena'), 0) }
    ];

    // 3. Impegno Staff (ORDINE ALFABETICO)
    const staffActivity = PEOPLE.map(p => {
      let count = 0;
      DATES.forEach(d => TIME_SLOTS.forEach(s => { if (availabilities[p]?.[d]?.[s]) count++; }));
      return { name: p.split(' ')[0], impegni: count };
    });

    // 4. Copertura Radar
    const radar = TIME_SLOTS.map(s => ({
      subject: s,
      A: DATES.reduce((acc, d) => acc + countTotal(d, s), 0),
      fullMark: PEOPLE.length
    }));

    // 5. Presenze per Giorno
    const dailyTotal = DATES.map(d => ({
      name: d,
      totale: TIME_SLOTS.reduce((acc, s) => acc + countTotal(d, s), 0)
    }));

    // 6. Distribuzione Fasce (Pie)
    const slotDistribution = TIME_SLOTS.map(s => ({
      name: s,
      value: DATES.reduce((acc, d) => acc + countTotal(d, s), 0)
    }));

    // 7. Contributo Idee (ORDINE ALFABETICO)
    const ideasByPerson = PEOPLE.map(p => ({
      name: p.split(' ')[0],
      count: ideas.filter(i => i.author === p).length
    })).filter(d => d.count >= 0);

    // 8. Dettaglio fasce orarie
    const slotAverages = TIME_SLOTS.map(s => ({
      name: s,
      media: parseFloat((DATES.reduce((acc, d) => acc + countTotal(d, s), 0) / DATES.length).toFixed(1))
    }));

    return { timeline, meals, staffActivity, radar, dailyTotal, slotDistribution, ideasByPerson, slotAverages };
  }, [availabilities, ideas]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex flex-col items-center justify-center">
        <div className="text-center mb-10">
           <h1 className="text-4xl font-black text-slate-800 tracking-tight">Triduo 2026</h1>
           <p className="text-slate-500 font-medium italic">ciaooo</p>
        </div>
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <div className="bg-white rounded-[2.5rem] shadow-xl border p-6 flex flex-col h-[500px]">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-indigo-600"><Search size={20}/> Accedi</h2>
            <input type="text" placeholder="Cerca nome..." className="w-full px-4 py-3 bg-slate-50 rounded-2xl mb-4 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {filteredPeople.map(p => (
                <button key={p} onClick={() => setCurrentUser(p)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs group-hover:bg-indigo-600 group-hover:text-white">{getInitials(p)}</div>
                  <span className="font-bold text-slate-700">{p}</span>
                  <ChevronRight className="ml-auto text-slate-300 group-hover:text-indigo-500" />
                </button>
              ))}
            </div>
            <button onClick={() => setCurrentUser('Admin')} className="mt-4 py-3 border-2 border-dashed rounded-2xl text-slate-400 font-bold text-xs"><Shield size={14} className="inline mr-2"/> Admin</button>
          </div>
          <div className="bg-white rounded-[2.5rem] shadow-xl border p-6 flex flex-col h-[500px]">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-amber-500"><Lightbulb size={20}/> Idee</h2>
            <div className="flex gap-2 mb-4">
              <input type="text" placeholder="Nuova idea..." className="flex-1 px-4 py-3 bg-slate-50 rounded-2xl outline-none" value={newIdea} onChange={(e) => setNewIdea(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (() => {
                if (!newIdea.trim()) return;
                const updated = [...ideas, { id: Date.now(), text: newIdea, author: 'Anonimo' }];
                setIdeas(updated); setNewIdea(""); saveData('triduo_ideas', updated);
              })()} />
              <button onClick={() => {
                if (!newIdea.trim()) return;
                const updated = [...ideas, { id: Date.now(), text: newIdea, author: 'Anonimo' }];
                setIdeas(updated); setNewIdea(""); saveData('triduo_ideas', updated);
              }} className="p-3 bg-amber-500 text-white rounded-2xl"><Send size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {ideas.length === 0 ? <div className="h-full flex flex-col items-center justify-center opacity-30 text-xs font-bold uppercase tracking-widest">Nessuna idea</div> : 
                [...ideas].reverse().map(idea => (
                  <div key={idea.id} className="group p-3 bg-slate-50 border rounded-xl">
                    <p className="text-slate-700 font-bold text-sm leading-tight">{idea.text}</p>
                    <div className="mt-2 flex justify-between items-center text-[9px] font-black uppercase text-slate-400">
                      <span>Da: {idea.author}</span>
                      <button onClick={async () => {
                        const updated = ideas.filter(i => i.id !== idea.id);
                        setIdeas(updated); await saveData('triduo_ideas', updated);
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

  const isAdmin = currentUser === 'Admin';
  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <nav className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b px-6 py-4 flex justify-between items-center no-print">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentUser(null)}>
          <Activity className="text-indigo-600" /> <span className="font-black uppercase tracking-widest">Tracker</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">{currentUser}</span>
          <button onClick={() => setCurrentUser(null)} className="p-2 text-rose-500"><LogOut size={20} /></button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 sm:p-8">
        {isAdmin ? (
          <div className="space-y-8">
            <div className="flex flex-wrap gap-2 justify-between items-center no-print">
              <div className="inline-flex bg-slate-200/50 p-1.5 rounded-2xl">
                {['summary', 'caranzano', 'matrix', 'charts', 'data'].map(v => (
                  <button key={v} onClick={() => setTestView(v)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase ${testView === v ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
                    {v === 'summary' ? 'Tabella' : v === 'caranzano' ? 'Pasti' : v === 'matrix' ? 'Foglio' : v === 'charts' ? 'Grafici' : 'Dati'}
                  </button>
                ))}
              </div>
              <button onClick={() => window.print()} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg"><Printer size={18} /> Stampa</button>
            </div>

            {testView === 'charts' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 1. Timeline */}
                <div className="bg-white p-6 rounded-3xl border shadow-sm">
                  <h3 className="font-black text-xs uppercase mb-6 flex items-center gap-2 text-indigo-600"><TrendingUp size={16}/> Trend Affluenza</h3>
                  <AreaChart width={480} height={250} data={chartsData.timeline}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{fontSize: 9}} />
                    <YAxis tick={{fontSize: 10}} />
                    <Tooltip />
                    <Area type="monotone" dataKey="persone" stroke="#6366f1" fill="#6366f122" />
                  </AreaChart>
                </div>
                {/* 2. Pasti */}
                <div className="bg-white p-6 rounded-3xl border shadow-sm">
                  <h3 className="font-black text-xs uppercase mb-6 flex items-center gap-2 text-rose-600"><Utensils size={16}/> Carico Cucina Totale</h3>
                  <PieChart width={480} height={250}>
                    <Pie data={chartsData.meals} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" label>
                      {chartsData.meals.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </div>
                {/* 3. Impegno Staff (ALFABETICO) */}
                <div className="bg-white p-6 rounded-3xl border shadow-sm">
                  <h3 className="font-black text-xs uppercase mb-6 flex items-center gap-2 text-emerald-600"><Users size={16}/> Presenze per Persona</h3>
                  <BarChart width={480} height={250} data={chartsData.staffActivity}>
                    <XAxis dataKey="name" tick={{fontSize: 10}} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="impegni" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </div>
                {/* 4. Radar */}
                <div className="bg-white p-6 rounded-3xl border shadow-sm">
                  <h3 className="font-black text-xs uppercase mb-6 flex items-center gap-2 text-amber-600"><Activity size={16}/> Bilanciamento Fasce</h3>
                  <RadarChart width={480} height={250} cx="50%" cy="50%" outerRadius="80%" data={chartsData.radar}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{fontSize: 9}} />
                    <Radar name="Staff" dataKey="A" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                    <Tooltip />
                  </RadarChart>
                </div>
                {/* 5. Affluenza per Giorno */}
                <div className="bg-white p-6 rounded-3xl border shadow-sm">
                  <h3 className="font-black text-xs uppercase mb-6 flex items-center gap-2 text-cyan-600"><Calendar size={16}/> Affluenza Totale Gionaliera</h3>
                  <BarChart width={480} height={250} data={chartsData.dailyTotal}>
                    <XAxis dataKey="name" tick={{fontSize: 10}} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="totale" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </div>
                {/* 6. Distribuzione Slot */}
                <div className="bg-white p-6 rounded-3xl border shadow-sm">
                  <h3 className="font-black text-xs uppercase mb-6 flex items-center gap-2 text-indigo-400"><PieIcon size={16}/> Distribuzione per Fascia</h3>
                  <PieChart width={480} height={250}>
                    <Pie data={chartsData.slotDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value">
                      {chartsData.slotDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </div>
                {/* 7. Idee per Persona (ALFABETICO) */}
                <div className="bg-white p-6 rounded-3xl border shadow-sm">
                  <h3 className="font-black text-xs uppercase mb-6 flex items-center gap-2 text-purple-600"><Lightbulb size={16}/> Idee inviate per Persona</h3>
                  <BarChart width={480} height={250} data={chartsData.ideasByPerson}>
                    <XAxis dataKey="name" tick={{fontSize: 10}} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </div>
                {/* 8. Media Staff */}
                <div className="bg-white p-6 rounded-3xl border shadow-sm">
                  <h3 className="font-black text-xs uppercase mb-6 flex items-center gap-2 text-slate-600"><UserCheck size={16}/> Media Persone per Fascia</h3>
                  <LineChart width={480} height={250} data={chartsData.slotAverages}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{fontSize: 10}} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="media" stroke="#475569" strokeWidth={3} dot={{r: 6}} />
                  </LineChart>
                </div>
              </div>
            ) : testView === 'data' ? (
              <div className="space-y-12 py-10">
                <div className="bg-white p-10 rounded-[3rem] border-4 border-rose-100 shadow-2xl space-y-8">
                  <div className="flex items-center gap-6 text-rose-600"><AlertTriangle size={64}/><div><h2 className="text-5xl font-black uppercase">Zona Pericolosa</h2><p className="text-xl font-bold opacity-60">Reset Database</p></div></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-rose-50 p-8 rounded-[2rem] border-2 border-rose-200"><h3 className="text-2xl font-black text-rose-700 mb-4">Pulisci Tutto</h3><button onClick={clearAllData} className="w-full bg-rose-600 text-white py-6 rounded-2xl font-black text-xl">ESEGUI WIPE</button></div>
                    <div className="bg-indigo-50 p-8 rounded-[2rem] border-2 border-indigo-200"><h3 className="text-2xl font-black text-indigo-700 mb-4">Dati di Test</h3><button onClick={setTestData} className="w-full bg-indigo-600 text-white py-6 rounded-2xl font-black text-xl">GENERA FAKE</button></div>
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
          <div className="space-y-6">
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
              <button onClick={() => { window.scrollTo(0,0); setCurrentUser(null); }} className="max-w-md w-full bg-slate-900 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3">
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