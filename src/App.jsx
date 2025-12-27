import './App.css';
import React, { useState, useEffect, useMemo } from 'react';
// Importazione icone completa
import { 
  Check, Calendar, Users, LogOut, Search, Printer, Shield,
  Activity, Clock, ChevronRight, CheckCircle2, 
  UserCheck, Lightbulb, Send, Trash2, BarChart3, TrendingUp, Utensils, AlertTriangle, Database, Trash, PieChart as PieIcon
} from 'lucide-react';

// Importazione componenti Recharts
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
      } catch (e) { console.error("Errore caricamento:", e); } finally { setIsLoading(false); }
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

  // --- GESTIONE IDEE ---
  const addIdea = async () => {
    if (!newIdea.trim()) return;
    const updated = [...ideas, { id: Date.now(), text: newIdea, author: currentUser || 'Anonimo' }];
    setIdeas(updated);
    setNewIdea("");
    await saveData('triduo_ideas', updated);
  };

  const deleteIdea = async (id) => {
    const updated = ideas.filter(i => i.id !== id);
    setIdeas(updated);
    await saveData('triduo_ideas', updated);
  };

  // --- GESTIONE DISPONIBILITÀ ---
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

  // --- RESET E DATI TEST ---
  const clearAllData = async () => {
    if (window.confirm("ATTENZIONE: Azione definitiva. Cancellare tutto?")) {
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

  // --- UTILITY ---
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

    // 3. Impegno Staff (ALFABETICO)
    const staffActivity = PEOPLE.map(p => {
      let count = 0;
      DATES.forEach(d => TIME_SLOTS.forEach(s => { if (availabilities[p]?.[d]?.[s]) count++; }));
      return { name: p.split(' ')[0], impegni: count };
    });

    // 4. Copertura Radar
    const radar = TIME_SLOTS.map(s => ({
      subject: s,
      A: DATES.reduce((acc, d) => acc + countTotal(d, s), 0)
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

    // 7. Idee per Persona (ALFABETICO)
    const ideasByPerson = PEOPLE.map(p => ({
      name: p.split(' ')[0],
      count: ideas.filter(i => i.author === p).length
    }));

    // 8. Media Staff per fascia
    const slotAverages = TIME_SLOTS.map(s => ({
      name: s,
      media: parseFloat((DATES.reduce((acc, d) => acc + countTotal(d, s), 0) / DATES.length).toFixed(1))
    }));

    return { timeline, meals, staffActivity, radar, dailyTotal, slotDistribution, ideasByPerson, slotAverages };
  }, [availabilities, ideas]);

  // --- VISTA LOGIN ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex flex-col items-center justify-center">
        <div className="text-center mb-10">
           <h1 className="text-4xl font-black text-slate-800 tracking-tight">Triduo pasquale 2026</h1>
           <p className="text-slate-500 font-medium italic">ciaooo</p>
        </div>
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <div className="bg-white rounded-[2.5rem] shadow-xl border p-6 flex flex-col h-[550px]">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-indigo-600"><Search size={20}/> Accedi</h2>
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
            <button onClick={() => setCurrentUser('Admin')} className="mt-4 py-3 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 font-bold text-xs">Admin</button>
          </div>
          <div className="bg-white rounded-[2.5rem] shadow-xl border p-6 flex flex-col h-[550px]">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-amber-500"><Lightbulb size={20}/> Idee Triduo</h2>
            <div className="flex gap-2 mb-4">
              <input type="text" placeholder="Scrivi un'idea..." className="flex-1 px-4 py-3 bg-slate-50 rounded-2xl outline-none" value={newIdea} onChange={(e) => setNewIdea(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addIdea()} />
              <button onClick={addIdea} className="p-3 bg-amber-500 text-white rounded-2xl"><Send size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {ideas.length === 0 ? <div className="h-full flex flex-col items-center justify-center opacity-30 text-xs font-bold uppercase tracking-widest">Nessuna idea</div> : 
                [...ideas].reverse().map(idea => (
                  <div key={idea.id} className="group p-3 bg-slate-50 border rounded-xl relative">
                    <p className="text-slate-700 font-bold text-sm leading-tight">{idea.text}</p>
                    <div className="mt-2 flex justify-between items-center text-[9px] font-black uppercase text-slate-400">
                      <span>Da: {idea.author}</span>
                      <button onClick={() => deleteIdea(idea.id)} className="text-slate-300 hover:text-rose-500"><Trash2 size={12}/></button>
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
        <div className="font-black text-indigo-600 cursor-pointer" onClick={() => setCurrentUser(null)}>TRACKER 2026</div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase">{currentUser}</span>
          <button onClick={() => setCurrentUser(null)} className="text-rose-500"><LogOut size={20}/></button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 sm:p-8">
        {isAdmin ? (
          <div className="space-y-6">
            <div className="flex gap-2 no-print flex-wrap">
              {['summary', 'caranzano', 'matrix', 'charts', 'data'].map(v => (
                <button key={v} onClick={() => setTestView(v)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase ${testView === v ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>{v}</button>
              ))}
              <button onClick={() => window.print()} className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 text-xs ml-auto shadow-lg"><Printer size={14} /> Stampa</button>
            </div>

            {testView === 'charts' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 1. Timeline */}
                <div className="bg-white p-6 rounded-3xl border shadow-sm h-[320px]">
                  <h3 className="text-xs font-black uppercase mb-4 text-indigo-600 flex items-center gap-2"><TrendingUp size={14}/> Affluenza</h3>
                  <AreaChart width={480} height={230} data={chartsData.timeline}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" tick={{fontSize: 9}}/><YAxis/><Tooltip/><Area type="monotone" dataKey="persone" stroke="#6366f1" fill="#6366f122"/></AreaChart>
                </div>
                {/* 2. Pasti */}
                <div className="bg-white p-6 rounded-3xl border shadow-sm h-[320px]">
                  <h3 className="text-xs font-black uppercase mb-4 text-rose-600 flex items-center gap-2"><Utensils size={14}/> Carico Pasti</h3>
                  <PieChart width={480} height={230}><Pie data={chartsData.meals} cx="50%" cy="50%" outerRadius={70} dataKey="value" label>{chartsData.meals.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}</Pie><Tooltip/></PieChart>
                </div>
                {/* 3. Impegno Staff */}
                <div className="bg-white p-6 rounded-3xl border shadow-sm h-[320px]">
                  <h3 className="text-xs font-black uppercase mb-4 text-emerald-600 flex items-center gap-2"><Users size={14}/> Presenze per Persona</h3>
                  <BarChart width={480} height={230} data={chartsData.staffActivity}><XAxis dataKey="name" tick={{fontSize: 9}}/><YAxis/><Tooltip/><Bar dataKey="impegni" fill="#10b981" radius={[4,4,0,0]}/></BarChart>
                </div>
                {/* 4. Radar */}
                <div className="bg-white p-6 rounded-3xl border shadow-sm h-[320px]">
                  <h3 className="text-xs font-black uppercase mb-4 text-amber-600 flex items-center gap-2"><Activity size={14}/> Radar Copertura</h3>
                  <RadarChart width={480} height={230} cx="50%" cy="50%" outerRadius="70%" data={chartsData.radar}><PolarGrid/><PolarAngleAxis dataKey="subject" tick={{fontSize: 9}}/><Radar dataKey="A" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6}/></RadarChart>
                </div>
                {/* 5. Gionaliera */}
                <div className="bg-white p-6 rounded-3xl border shadow-sm h-[320px]">
                  <h3 className="text-xs font-black uppercase mb-4 text-cyan-600 flex items-center gap-2"><Calendar size={14}/> Totale per Giorno</h3>
                  <BarChart width={480} height={230} data={chartsData.dailyTotal}><XAxis dataKey="name" tick={{fontSize: 9}}/><YAxis/><Tooltip/><Bar dataKey="totale" fill="#06b6d4" radius={[4,4,0,0]}/></BarChart>
                </div>
                {/* 6. Distribuzione Fasce */}
                <div className="bg-white p-6 rounded-3xl border shadow-sm h-[320px]">
                  <h3 className="text-xs font-black uppercase mb-4 text-indigo-400 flex items-center gap-2"><PieIcon size={14}/> Distribuzione Fasce</h3>
                  <PieChart width={480} height={230}><Pie data={chartsData.slotDistribution} cx="50%" cy="50%" outerRadius={70} dataKey="value">{chartsData.slotDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}</Pie><Tooltip/><Legend/></PieChart>
                </div>
                {/* 7. Idee */}
                <div className="bg-white p-6 rounded-3xl border shadow-sm h-[320px]">
                  <h3 className="text-xs font-black uppercase mb-4 text-purple-600 flex items-center gap-2"><Lightbulb size={14}/> Idee per Persona</h3>
                  <BarChart width={480} height={230} data={chartsData.ideasByPerson}><XAxis dataKey="name" tick={{fontSize: 9}}/><YAxis/><Tooltip/><Bar dataKey="count" fill="#8b5cf6" radius={[4,4,0,0]}/></BarChart>
                </div>
                {/* 8. Media Staff */}
                <div className="bg-white p-6 rounded-3xl border shadow-sm h-[320px]">
                  <h3 className="text-xs font-black uppercase mb-4 text-slate-600 flex items-center gap-2"><UserCheck size={14}/> Media Staff per Fascia</h3>
                  <LineChart width={480} height={230} data={chartsData.slotAverages}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name" tick={{fontSize: 9}}/><YAxis/><Tooltip/><Line type="monotone" dataKey="media" stroke="#475569" strokeWidth={3} dot={{r: 5}}/></LineChart>
                </div>
              </div>
            ) : testView === 'data' ? (
              <div className="space-y-12 py-10">
                <div className="bg-white p-10 rounded-[3rem] border-4 border-rose-100 shadow-2xl space-y-8">
                  <div className="flex items-center gap-6 text-rose-600">
                    <AlertTriangle size={64} strokeWidth={3} />
                    <div>
                      <h2 className="text-4xl font-black uppercase leading-tight">Non toccare se non si sa cosa si sta facendo</h2>
                      <p className="text-xl font-bold opacity-60">Reset Database</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-rose-50 p-8 rounded-[2rem] border-2 border-rose-200">
                      <h3 className="text-2xl font-black text-rose-700 mb-4 uppercase">Pulisci Tutto</h3>
                      <button onClick={clearAllData} className="w-full bg-rose-600 text-white py-6 rounded-2xl font-black text-xl">ESEGUI WIPE</button>
                    </div>
                    <div className="bg-indigo-50 p-8 rounded-[2rem] border-2 border-indigo-200">
                      <h3 className="text-2xl font-black text-indigo-700 mb-4 uppercase">Dati di Test</h3>
                      <button onClick={setTestData} className="w-full bg-indigo-600 text-white py-6 rounded-2xl font-black text-xl">GENERA FAKE</button>
                    </div>
                  </div>
                </div>
              </div>
            ) : testView === 'matrix' ? (
              <div className="bg-white rounded-3xl border overflow-x-auto shadow-sm">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50"><tr><th className="p-3 text-left sticky left-0 bg-white border-r">Persona</th>{ALL_PERIODS.map((p,i)=><th key={i} className="p-2 border-b min-w-[50px] font-bold">{p.date.split(' ')[1]} {p.slot[0]}</th>)}</tr></thead>
                  <tbody>{PEOPLE.map(person => <tr key={person} className="border-b hover:bg-slate-50"><td className="p-3 font-bold sticky left-0 bg-white border-r">{person}</td>{ALL_PERIODS.map((p,i)=><td key={i} className="text-center">{availabilities[person]?.[p.date]?.[p.slot] && <Check size={14} className="mx-auto text-emerald-500"/>}</td>)}</tr>)}</tbody>
                </table>
              </div>
            ) : testView === 'caranzano' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {DATES.map(d => (
                  <div key={d} className="bg-white rounded-3xl p-6 border shadow-sm">
                    <h3 className="font-black border-b pb-2 mb-4 uppercase text-slate-400">{d}</h3>
                    {['Pranzo', 'Cena'].map(m => (
                      <div key={m} className="flex justify-between p-3 bg-slate-50 rounded-xl mb-2">
                        <span className="font-bold">{m}</span><span className="font-black text-indigo-600 text-xl">{countTotal(d, m)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border p-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-xs uppercase text-slate-400 font-black"><th className="text-left p-2">Fascia</th>{DATES.map(d=><th key={d}>{d}</th>)}</tr></thead>
                  <tbody>{TIME_SLOTS.map(s=><tr key={s} className="border-t"><td>{s}</td>{DATES.map(d=><td key={d} className="text-center font-black">{countTotal(d,s)}</td>)}</tr>)}</tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-black uppercase">Le tue disponibilità</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {DATES.map(d => (
                <div key={d} className="bg-white p-6 rounded-3xl border shadow-sm">
                  <div className="font-black mb-4 uppercase border-b pb-2 text-indigo-600">{d}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {TIME_SLOTS.map(s => {
                      const val = availabilities[currentUser]?.[d]?.[s];
                      return (
                        <button key={s} onClick={() => toggleAvailability(d, s)} className={`h-12 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${val ? 'bg-emerald-500 border-emerald-400 text-white' : 'text-slate-300 border-slate-50'}`}>{s}</button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 border-t flex justify-center z-50">
              <button onClick={() => { window.scrollTo(0,0); setCurrentUser(null); }} className="w-full max-w-md bg-slate-900 text-white py-4 rounded-2xl font-black shadow-lg">SALVA E ESCI</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;