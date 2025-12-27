import './App.css';
import React, { useState, useEffect, useMemo } from 'react';
// Importazione icone: AGGIUNTO 'Utensils' per evitare l'errore in console
import { 
  Check, Calendar, Users, LogOut, Search, Printer, Shield,
  Activity, Clock, ChevronRight, CheckCircle2, 
  UserCheck, Lightbulb, Send, Trash2, BarChart3, PieChart as PieIcon, TrendingUp, Utensils
} from 'lucide-react';

// Importazione componenti Recharts per i grafici
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';

// --- CONFIGURAZIONE COSTANTI ---
const DATES = ['Gio 2 Apr', 'Ven 3 Apr', 'Sab 4 Apr'];
const TIME_SLOTS = ['Mattino', 'Pranzo', 'Pomeriggio', 'Cena', 'Sera', 'Notte'];
const PEOPLE = [
  'Catteo Casetta', 'Laura Casetta', 'Arianna Aloi', 'Aloi Beatrice',
  'Lorenzo Trucco 04', 'Lorenzo Trucco 08', 'Simone Cavaglià', 'Simone Casetta',
  'Gloria Romano', 'Vittoria Pelassa'
].sort();

// Colori per i grafici
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4'];

// Lista piatta di tutti i turni (Data + Slot) per calcoli e matrice
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

  // --- CARICAMENTO DATI (DB SIMULATO) ---
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

  // --- SALVATAGGIO ---
  const saveData = async (key, newData) => {
    try {
      if (window.storage) await window.storage.set(key, JSON.stringify(newData), true);
      else localStorage.setItem(key, JSON.stringify(newData));
    } catch (e) { console.error("Errore salvataggio:", e); }
  };

  // --- LOGICA IDEE ---
  const addIdea = async () => {
    if (!newIdea.trim()) return;
    const updatedIdeas = [...ideas, { id: Date.now(), text: newIdea, author: currentUser || 'Anonimo' }];
    setIdeas(updatedIdeas);
    setNewIdea("");
    await saveData('triduo_ideas', updatedIdeas);
  };

  const deleteIdea = async (id) => {
    const updatedIdeas = ideas.filter(i => i.id !== id);
    setIdeas(updatedIdeas);
    await saveData('triduo_ideas', updatedIdeas);
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
  
  // Iniziali pulite (No numeri, es: Lorenzo 04 -> LT)
  const getInitials = (name) => name.split(' ').map(n => n[0]).filter(char => /[a-zA-Z]/.test(char)).join('').toUpperCase();

  // --- DATI PER I 7 GRAFICI ---
  const charts = useMemo(() => {
    const timelineData = ALL_PERIODS.map(p => ({
      name: `${p.date.split(' ')[1]} ${p.slot[0]}.`,
      persone: countTotal(p.date, p.slot)
    }));

    const mealData = [
      { name: 'Pranzi', value: DATES.reduce((acc, d) => acc + countTotal(d, 'Pranzo'), 0) },
      { name: 'Cene', value: DATES.reduce((acc, d) => acc + countTotal(d, 'Cena'), 0) }
    ];

    const commitmentData = PEOPLE.map(p => {
      let count = 0;
      DATES.forEach(d => TIME_SLOTS.forEach(s => { if (availabilities[p]?.[d]?.[s]) count++; }));
      return { name: p.split(' ')[0], impegni: count };
    });

    const slotCoverage = TIME_SLOTS.map(s => ({
      slot: s,
      media: parseFloat((DATES.reduce((acc, d) => acc + countTotal(d, s), 0) / DATES.length).toFixed(1))
    }));

    const ideaStats = PEOPLE.map(p => ({
      name: p.split(' ')[0],
      contributi: ideas.filter(i => i.author === p).length
    })).filter(d => d.contributi > 0);

    return { timelineData, mealData, commitmentData, slotCoverage, ideaStats };
  }, [availabilities, ideas]);

  // --- VISTA LOGIN & IDEE ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex flex-col items-center justify-center">
        <div className="text-center space-y-2 mb-10">
           <div className="inline-flex p-3 bg-indigo-600 rounded-2xl shadow-lg text-white"><Users size={28} /></div>
           <h1 className="text-4xl font-black text-slate-800 tracking-tight">Triduo 2026</h1>
           <p className="text-slate-500 font-medium">Gestione Staff</p>
        </div>

        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-6 flex flex-col h-[550px]">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2"><Search size={20} className="text-indigo-600"/> Accedi</h2>
            <input type="text" placeholder="Cerca nome..." className="w-full px-4 py-3 bg-slate-50 rounded-2xl mb-4 outline-none focus:ring-2 focus:ring-indigo-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
            <h2 className="text-xl font-black mb-6 flex items-center gap-2"><Lightbulb size={20} className="text-amber-500"/> Idee</h2>
            <div className="flex gap-2 mb-4">
              <input type="text" placeholder="Nuova idea..." className="flex-1 px-4 py-3 bg-slate-50 rounded-2xl outline-none" value={newIdea} onChange={(e) => setNewIdea(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addIdea()} />
              <button onClick={addIdea} className="p-3 bg-amber-500 text-white rounded-2xl"><Send size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {ideas.length === 0 ? <div className="h-full flex flex-col items-center justify-center opacity-30 text-xs font-bold uppercase tracking-widest">Nessuna idea</div> : 
                [...ideas].reverse().map(idea => (
                  <div key={idea.id} className="group p-3 bg-slate-50 border rounded-xl hover:border-amber-200">
                    <p className="text-slate-700 font-bold text-sm">{idea.text}</p>
                    <div className="mt-2 flex justify-between items-center text-[9px] font-black uppercase text-slate-400">
                      <span>Da: {idea.author}</span>
                      <button onClick={() => deleteIdea(idea.id)} className="text-slate-300 hover:text-rose-500"><Trash2 size={12} /></button>
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

  // --- VISTA MAIN (USER/ADMIN) ---
  const isAdmin = currentUser === 'Admin';
  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <nav className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentUser(null)}>
          <Activity className="text-indigo-600" /> <span className="font-black">TRACKER 2026</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-600">{currentUser}</span>
          <button onClick={() => setCurrentUser(null)} className="p-2 text-rose-500"><LogOut size={20} /></button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 sm:p-8">
        {isAdmin ? (
          <div className="space-y-8">
            <div className="flex flex-wrap gap-2 justify-between items-center">
              <div className="inline-flex bg-slate-200/50 p-1.5 rounded-2xl">
                {['summary', 'caranzano', 'matrix', 'charts'].map(v => (
                  <button key={v} onClick={() => setTestView(v)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase ${testView === v ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>{v}</button>
                ))}
              </div>
              <button onClick={() => window.print()} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2"><Printer size={18} /> Stampa</button>
            </div>

            {testView === 'charts' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Timeline */}
                <div className="bg-white p-6 rounded-3xl border h-[350px]">
                  <h3 className="font-black text-sm uppercase mb-4 flex items-center gap-2 text-indigo-600"><TrendingUp size={16}/> Affluenza nel Tempo</h3>
                  <ResponsiveContainer><AreaChart data={charts.timelineData}><XAxis dataKey="name" tick={{fontSize: 9}}/><YAxis hide/><Tooltip/><Area type="monotone" dataKey="persone" stroke="#6366f1" fill="#6366f122" strokeWidth={3}/></AreaChart></ResponsiveContainer>
                </div>
                {/* 2. Cucina */}
                <div className="bg-white p-6 rounded-3xl border h-[350px]">
                  <h3 className="font-black text-sm uppercase mb-4 flex items-center gap-2 text-rose-600"><Utensils size={16}/> Carico Pasti</h3>
                  <ResponsiveContainer><PieChart><Pie data={charts.mealData} innerRadius={60} outerRadius={80} dataKey="value" label>{charts.mealData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}</Pie><Tooltip/><Legend/></PieChart></ResponsiveContainer>
                </div>
                {/* 3. Impegno individuale */}
                <div className="bg-white p-6 rounded-3xl border h-[350px]">
                  <h3 className="font-black text-sm uppercase mb-4 flex items-center gap-2 text-emerald-600"><Users size={16}/> Impegno Individuale</h3>
                  <ResponsiveContainer><BarChart data={charts.commitmentData} layout="vertical"><XAxis type="number" hide/><YAxis dataKey="name" type="category" tick={{fontSize: 10}} width={70}/><Tooltip/><Bar dataKey="impegni" fill="#10b981" radius={[0, 4, 4, 0]}/></BarChart></ResponsiveContainer>
                </div>
                {/* 4. Radar Fasce Orarie */}
                <div className="bg-white p-6 rounded-3xl border h-[350px]">
                  <h3 className="font-black text-sm uppercase mb-4 flex items-center gap-2 text-amber-600"><Activity size={16}/> Copertura Fasce</h3>
                  <ResponsiveContainer><RadarChart data={charts.slotCoverage}><PolarGrid /><PolarAngleAxis dataKey="slot" /><Radar dataKey="media" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.5}/><Tooltip/></RadarChart></ResponsiveContainer>
                </div>
                {/* 5. Contributi Idee */}
                <div className="bg-white p-6 rounded-3xl border h-[350px]">
                  <h3 className="font-black text-sm uppercase mb-4 flex items-center gap-2 text-purple-600"><Lightbulb size={16}/> Coinvolgimento Idee</h3>
                  <ResponsiveContainer><PieChart><Pie data={charts.ideaStats} dataKey="contributi" outerRadius={80} label>{charts.ideaStats.map((_, i) => <Cell key={i} fill={COLORS[(i+2) % COLORS.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer>
                </div>
                {/* 6. Heatmap Picchi */}
                <div className="bg-white p-6 rounded-3xl border h-[350px]">
                  <h3 className="font-black text-sm uppercase mb-4 flex items-center gap-2 text-cyan-600"><BarChart3 size={16}/> Analisi Sotto-Staff</h3>
                  <ResponsiveContainer><BarChart data={charts.timelineData}><XAxis dataKey="name" tick={{fontSize: 9}}/><YAxis/><Tooltip/><Bar dataKey="persone">{charts.timelineData.map((entry, i) => <Cell key={i} fill={entry.persone < 4 ? '#ef4444' : '#06b6d4'}/>)}</Bar></BarChart></ResponsiveContainer>
                </div>
              </div>
            ) : testView === 'matrix' ? (
              <div className="bg-white rounded-3xl border shadow-xl overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50"><tr><th className="p-3 text-left sticky left-0 bg-white border-r">Persona</th>{ALL_PERIODS.map((p,i)=><th key={i} className="p-2 border-b"><div className="font-bold">{p.date.split(' ')[1]}</div><div>{p.slot[0]}</div></th>)}</tr></thead>
                  <tbody>{PEOPLE.map(person => <tr key={person} className="border-b"><td className="p-3 font-bold sticky left-0 bg-white border-r">{person}</td>{ALL_PERIODS.map((p,i)=><td key={i} className="text-center">{availabilities[person]?.[p.date]?.[p.slot] && <Check size={14} className="mx-auto text-emerald-500"/>}</td>)}</tr>)}</tbody>
                </table>
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
            <h2 className="text-3xl font-black text-slate-800">Le tue disponibilità</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {DATES.map(d => (
                <div key={d} className="bg-white rounded-[2.5rem] p-6 border shadow-sm">
                  <div className="flex items-center gap-2 border-b pb-3 mb-4"><Calendar className="text-indigo-600" /><span className="font-black">{d}</span></div>
                  <div className="grid grid-cols-2 gap-2">
                    {TIME_SLOTS.map(s => {
                      const val = availabilities[currentUser]?.[d]?.[s];
                      return (
                        <button key={s} onClick={() => toggleAvailability(d, s)} className={`h-16 rounded-2xl flex flex-col items-center justify-center border-2 transition-all ${val ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                          {val ? <Check size={18}/> : <Clock size={14} className="opacity-20"/>}
                          <span className="text-[9px] font-black uppercase">{s}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-lg border-t flex justify-center z-50">
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