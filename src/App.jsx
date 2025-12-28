import './App.css';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Check, Calendar, Users, LogOut, Search, Printer, Shield,
  Activity, Clock, ChevronRight, CheckCircle2, 
  UserCheck, Lightbulb, Send, Trash2, BarChart3, TrendingUp, Utensils, AlertTriangle, Database, Trash, PieChart as PieIcon
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, Radar, LineChart, Line
} from 'recharts';

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
  const [testView, setTestView] = useState('summary'); 

  // --- LOGICA SINCRONIZZAZIONE ---
  const loadData = async () => {
    try {
      const response = await fetch('/api/get-data');
      const result = await response.json();
      setAvailabilities(result.availabilities || {});
      setIdeas(result.ideas || []);
    } catch (e) { console.error("Database non connesso"); }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const saveData = async (key, newData) => {
    try {
      await fetch('/api/save-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, data: newData }),
      });
    } catch (e) { console.error("Errore salvataggio cloud"); }
  };

  // --- GESTIONE AZIONI ---
  const addIdea = async () => {
    if (!newIdea.trim()) return;
    const updated = [...ideas, { id: Date.now(), text: newIdea, author: currentUser || 'Anonimo' }];
    setIdeas(updated);
    setNewIdea("");
    await saveData('triduo_ideas', updated);
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
  };

  const clearAllData = async () => {
    if (window.confirm("Cancellare TUTTO?")) {
      setAvailabilities({}); setIdeas([]);
      await saveData('availabilities_shared', {});
      await saveData('triduo_ideas', []);
    }
  };

  // --- UTILITY GRAFICHE ---
  const countTotal = (date, slot) => PEOPLE.filter(p => availabilities[p]?.[date]?.[slot] === true).length;
  
  // INIZIALI PULITE (LT invece di LT0)
  const getInitials = (name) => {
    return name.split(' ')
      .filter(word => isNaN(word)) 
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const filteredPeople = useMemo(() => PEOPLE.filter(p => p.toLowerCase().includes(searchTerm.toLowerCase())), [searchTerm]);

  const chartsData = useMemo(() => {
    const timeline = ALL_PERIODS.map(p => ({ name: `${p.date.split(' ')[1]} ${p.slot[0]}.`, persone: countTotal(p.date, p.slot) }));
    const meals = [{ name: 'Pranzi', value: DATES.reduce((acc, d) => acc + countTotal(d, 'Pranzo'), 0) }, { name: 'Cene', value: DATES.reduce((acc, d) => acc + countTotal(d, 'Cena'), 0) }];
    const staffActivity = PEOPLE.map(p => {
      let count = 0;
      DATES.forEach(d => TIME_SLOTS.forEach(s => { if (availabilities[p]?.[d]?.[s]) count++; }));
      return { name: p.split(' ')[0], impegni: count };
    });
    const radar = TIME_SLOTS.map(s => ({ subject: s, A: DATES.reduce((acc, d) => acc + countTotal(d, s), 0) }));
    return { timeline, meals, staffActivity, radar };
  }, [availabilities]);

  // --- RENDERING ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex flex-col items-center justify-center">
        <h1 className="text-4xl font-black text-slate-800 mb-10">Triduo 2026</h1>
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-[2.5rem] shadow-xl p-6 flex flex-col h-[550px]">
            <h2 className="text-xl font-black mb-6">Accedi</h2>
            <input type="text" placeholder="Cerca nome..." className="w-full px-4 py-3 bg-slate-50 rounded-2xl mb-4 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <div className="flex-1 overflow-y-auto space-y-1">
              {filteredPeople.map(p => (
                <button key={p} onClick={() => setCurrentUser(p)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 transition-all">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">{getInitials(p)}</div>
                  <span className="font-bold text-slate-700">{p}</span>
                  <ChevronRight className="ml-auto w-4 h-4 text-slate-300" />
                </button>
              ))}
            </div>
            <button onClick={() => setCurrentUser('Admin')} className="mt-4 py-3 border-2 border-dashed rounded-2xl text-slate-400 font-bold text-xs">Admin</button>
          </div>
          <div className="bg-white rounded-[2.5rem] shadow-xl p-6 flex flex-col h-[550px]">
            <h2 className="text-xl font-black mb-6">Idee</h2>
            <div className="flex gap-2 mb-4">
              <input type="text" placeholder="Nuova idea..." className="flex-1 px-4 py-3 bg-slate-50 rounded-2xl outline-none" value={newIdea} onChange={(e) => setNewIdea(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addIdea()} />
              <button onClick={addIdea} className="p-3 bg-amber-500 text-white rounded-2xl"><Send size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3">
              {ideas.map(idea => (
                <div key={idea.id} className="p-3 bg-slate-50 border rounded-xl relative group">
                  <p className="text-slate-700 font-bold text-sm leading-tight">{idea.text}</p>
                  <div className="mt-2 text-[9px] font-black uppercase text-slate-400">Da: {idea.author}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = currentUser === 'Admin';
  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <nav className="bg-white/70 backdrop-blur-xl border-b px-6 py-4 flex justify-between items-center">
        <div className="font-black text-indigo-600 cursor-pointer" onClick={() => setCurrentUser(null)}>TRACKER 2026</div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase">{currentUser}</span>
          <button onClick={() => setCurrentUser(null)} className="text-rose-500"><LogOut size={20}/></button>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto p-4 sm:p-8">
        {isAdmin ? (
          <div className="space-y-6">
            <div className="flex gap-2 flex-wrap">
              {['summary', 'caranzano', 'matrix', 'charts', 'data'].map(v => (
                <button key={v} onClick={() => setTestView(v)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase ${testView === v ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>{v}</button>
              ))}
            </div>
            {testView === 'charts' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-3xl border shadow-sm h-[300px]"><h3 className="text-xs font-black uppercase mb-4">Affluenza</h3><AreaChart width={450} height={200} data={chartsData.timeline}><XAxis dataKey="name"/><YAxis/><Tooltip/><Area type="monotone" dataKey="persone" stroke="#6366f1" fill="#6366f122"/></AreaChart></div>
                <div className="bg-white p-6 rounded-3xl border shadow-sm h-[300px]"><h3 className="text-xs font-black uppercase mb-4">Pasti</h3><PieChart width={450} height={200}><Pie data={chartsData.meals} cx="50%" cy="50%" outerRadius={70} dataKey="value" label>{chartsData.meals.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}</Pie><Tooltip/></PieChart></div>
                <div className="bg-white p-6 rounded-3xl border shadow-sm h-[300px]"><h3 className="text-xs font-black uppercase mb-4">Staff</h3><BarChart width={450} height={200} data={chartsData.staffActivity}><XAxis dataKey="name"/><YAxis/><Tooltip/><Bar dataKey="impegni" fill="#10b981" radius={[4,4,0,0]}/></BarChart></div>
                <div className="bg-white p-6 rounded-3xl border shadow-sm h-[300px]"><h3 className="text-xs font-black uppercase mb-4">Radar</h3><RadarChart width={450} height={200} cx="50%" cy="50%" outerRadius="70%" data={chartsData.radar}><PolarGrid/><PolarAngleAxis dataKey="subject"/><Radar dataKey="A" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6}/></RadarChart></div>
              </div>
            ) : testView === 'data' ? (
              <div className="bg-white p-10 rounded-[3rem] border-4 border-rose-100 shadow-2xl text-center">
                <AlertTriangle size={64} className="mx-auto text-rose-600 mb-4" />
                <h2 className="text-2xl font-black mb-10">NON TOCCARE SE NON SAI COSA FAI</h2>
                <button onClick={clearAllData} className="w-full bg-rose-600 text-white py-6 rounded-2xl font-black text-xl">RESET DATI CLOUD</button>
              </div>
            ) : testView === 'matrix' ? (
              <div className="bg-white rounded-3xl border overflow-x-auto shadow-sm">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50"><tr><th className="p-3 text-left sticky left-0 bg-white border-r">Persona</th>{ALL_PERIODS.map((p,i)=><th key={i} className="p-2 border-b min-w-[50px] font-bold">{p.date.split(' ')[1]} {p.slot[0]}</th>)}</tr></thead>
                  <tbody>{PEOPLE.map(person => <tr key={person} className="border-b"><td className="p-3 font-bold sticky left-0 bg-white border-r">{person}</td>{ALL_PERIODS.map((p,i)=><td key={i} className="text-center">{availabilities[person]?.[p.date]?.[p.slot] && <Check size={14} className="mx-auto text-emerald-500"/>}</td>)}</tr>)}</tbody>
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
              <div className="bg-white rounded-3xl border p-6"><table className="w-full text-sm"><thead><tr className="text-xs uppercase text-slate-400 font-black"><th className="text-left p-2">Fascia</th>{DATES.map(d=><th key={d}>{d}</th>)}</tr></thead><tbody>{TIME_SLOTS.map(s=><tr key={s} className="border-t"><td>{s}</td>{DATES.map(d=><td key={d} className="text-center font-black">{countTotal(d,s)}</td>)}</tr>)}</tbody></table></div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-black uppercase">Disponibilità</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {DATES.map(d => (
                <div key={d} className="bg-white p-6 rounded-3xl border shadow-sm">
                  <div className="font-black mb-4 uppercase border-b pb-2 text-indigo-600 text-center">{d}</div>
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
              <button onClick={() => { window.scrollTo(0,0); setCurrentUser(null); }} className="w-full max-w-md bg-slate-900 text-white py-4 rounded-2xl font-black">SALVA E ESCI</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;