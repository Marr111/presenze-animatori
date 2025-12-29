import './App.css';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Check, LogOut, Search, Printer, ChevronRight, CheckCircle2, UserPlus,
  Lightbulb, Send, Utensils, AlertTriangle, Clock, Wallet, TrendingUp, BarChart3
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';

const DATES = ['Gio 2 Apr', 'Ven 3 Apr', 'Sab 4 Apr'];
const TIME_SLOTS = ['Mattino', 'Pranzo', 'Pomeriggio', 'Cena', 'Sera', 'Notte'];
const MEAL_PRICE = 5;
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#4f46e5'];

const INITIAL_PEOPLE = [
  'Catteo Casetta', 'Laura Casetta', 'Arianna Aloi', 'Aloi Beatrice',
  'Lorenzo Trucco 04', 'Lorenzo Trucco 08', 'Simone Cavaglià', 'Simone Casetta',
  'Gloria Romano', 'Vittoria Pelassa'
].sort();

const ALL_PERIODS = DATES.flatMap(d => TIME_SLOTS.map(s => ({ date: d, slot: s })));

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [availabilities, setAvailabilities] = useState({});
  const [ideas, setIdeas] = useState([]);
  const [people, setPeople] = useState(INITIAL_PEOPLE);
  const [newIdea, setNewIdea] = useState("");
  const [testView, setTestView] = useState('summary');
  const [isSaving, setIsSaving] = useState(false);

  // --- SINCRONIZZAZIONE ---
  const loadData = async () => {
    try {
      const response = await fetch('/api/get-data');
      const result = await response.json();
      if (result) {
        setAvailabilities(result.availabilities || {});
        setIdeas(result.ideas || []);
        if (result.people && result.people.length > 0) setPeople(result.people);
      }
    } catch (e) { console.error("Errore sync"); }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (!currentUser) loadData();
    }, 10000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const persistToCloud = async (updatedData) => {
    setIsSaving(true);
    try {
      await fetch('/api/save-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: updatedData }),
      });
    } catch (e) { console.error("Errore salvataggio"); }
    setIsSaving(false);
  };

  // --- AZIONI ---
  const handleFinalSave = async () => {
    await persistToCloud({ availabilities, ideas, people });
    setCurrentUser(null);
    setSearchTerm("");
  };

  const addPerson = async () => {
    const name = prompt("Inserisci Nome e Cognome:");
    if (name && !people.includes(name)) {
      const newPeople = [...people, name].sort();
      setPeople(newPeople);
      await persistToCloud({ availabilities, ideas, people: newPeople });
      setCurrentUser(name);
    }
  };

  const addIdea = async () => {
    if (!newIdea.trim()) return;
    const newIdeas = [...ideas, { id: Date.now(), text: newIdea, author: currentUser || 'Anonimo' }];
    setIdeas(newIdeas);
    setNewIdea("");
    await persistToCloud({ availabilities, ideas: newIdeas, people });
  };

  const toggleAvailability = (date, slot) => {
    const updated = {
      ...availabilities,
      [currentUser]: { 
        ...availabilities[currentUser], 
        [date]: { ...availabilities[currentUser]?.[date], [slot]: !availabilities[currentUser]?.[date]?.[slot] } 
      }
    };
    setAvailabilities(updated);
  };

  // --- UTILITY ---
  const getInitials = (name) => name.split(' ').filter(w => isNaN(w)).map(n => n[0]).join('').toUpperCase();
  const countTotal = (date, slot) => people.filter(p => availabilities[p]?.[date]?.[slot] === true).length;
  const calculateDebt = (person) => {
    let meals = 0;
    DATES.forEach(d => {
      if (availabilities[person]?.[d]?.['Pranzo']) meals++;
      if (availabilities[person]?.[d]?.['Cena']) meals++;
    });
    return meals * MEAL_PRICE;
  };

  const chartsData = useMemo(() => {
    const timeline = ALL_PERIODS.map(p => ({ name: `${p.date.split(' ')[1]} ${p.slot[0]}.`, persone: countTotal(p.date, p.slot) }));
    const debtData = people.map(p => ({ name: p.split(' ')[0], euro: calculateDebt(p) })).filter(d => d.euro > 0);
    const radar = TIME_SLOTS.map(s => ({ subject: s, A: DATES.reduce((acc, d) => acc + countTotal(d, s), 0) }));
    return { timeline, debtData, radar };
  }, [availabilities, people]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 flex flex-col items-center justify-center">
        <h1 className="text-4xl font-black text-slate-800 mb-10 tracking-tighter">Triduo Tracker</h1>
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-[2.5rem] shadow-xl p-6 flex flex-col h-[550px] border">
            <h2 className="text-xl font-black mb-6">Accedi</h2>
            <input type="text" placeholder="Cerca nome..." className="w-full px-4 py-3 bg-slate-50 rounded-2xl mb-4 border outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <div className="flex-1 overflow-y-auto space-y-1">
              {people.filter(p => p.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                <button key={p} onClick={() => { setCurrentUser(p); loadData(); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 transition-all">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xs">{getInitials(p)}</div>
                  <span className="font-bold text-slate-700">{p}</span>
                  <ChevronRight className="ml-auto w-4 h-4 text-slate-300" />
                </button>
              ))}
              {searchTerm && !people.some(p => p.toLowerCase().includes(searchTerm.toLowerCase())) && (
                <button onClick={addPerson} className="w-full p-6 border-2 border-dashed rounded-2xl text-indigo-500 font-bold mt-2">"Non trovi il tuo nome? Inseriscilo"</button>
              )}
            </div>
            <button onClick={() => setCurrentUser('Admin')} className="mt-4 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Admin</button>
          </div>
          <div className="bg-white rounded-[2.5rem] shadow-xl p-6 flex flex-col h-[550px] border">
            <h2 className="text-xl font-black mb-6">Idee</h2>
            <div className="flex-1 overflow-y-auto space-y-3">
              {ideas.map(idea => (
                <div key={idea.id} className="p-3 bg-slate-50 border rounded-xl">
                  <p className="text-slate-700 font-bold text-sm leading-tight">"{idea.text}"</p>
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
      <style>{`@media print { @page { size: landscape; } nav, .no-print { display: none !important; } .print-area { display: block !important; width: 100% !important; border: none !important; } table { font-size: 8px !important; } }`}</style>
      
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-50 no-print">
        <div className="font-black text-indigo-600 text-xl cursor-pointer" onClick={() => setCurrentUser(null)}>TRACKER 2026</div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold uppercase">{currentUser}</span>
          <button onClick={() => setCurrentUser(null)} className="text-rose-500"><LogOut size={20}/></button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {isAdmin ? (
          <div className="space-y-6">
            <div className="flex gap-2 flex-wrap no-print">
              {['summary', 'caranzano', 'matrix', 'charts'].map(v => (
                <button key={v} onClick={() => setTestView(v)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase ${testView === v ? 'bg-indigo-600 text-white' : 'bg-white border'}`}>{v}</button>
              ))}
              <button onClick={() => window.print()} className="ml-auto px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase flex items-center gap-2"><Printer size={16}/> Stampa Matrix</button>
            </div>

            {testView === 'matrix' ? (
              <div className="bg-white rounded-3xl border shadow-xl overflow-hidden print-area">
                <table className="w-full text-[10px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="p-2 text-left border-r sticky left-0 bg-slate-100 z-10 w-32">Staff</th>
                      {ALL_PERIODS.map((p,i)=><th key={i} className="p-1 border-r text-center font-black">{p.date.split(' ')[1]}<br/>{p.slot}</th>)}
                      <th className="p-2 bg-amber-50">EURO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {people.map(p => (
                      <tr key={p} className="border-t">
                        <td className="p-2 font-bold sticky left-0 bg-white border-r">{p}</td>
                        {ALL_PERIODS.map((per,i)=><td key={i} className="text-center border-r">{availabilities[p]?.[per.date]?.[per.slot] && <Check size={14} className="mx-auto text-emerald-500"/>}</td>)}
                        <td className="p-2 text-center bg-amber-50 font-black">{calculateDebt(p)}€</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-900 text-white font-black">
                    <tr>
                      <td className="p-2 border-r">PRESENTI</td>
                      {ALL_PERIODS.map((p,i)=><td key={i} className="text-center border-r">{countTotal(p.date, p.slot)}</td>)}
                      <td>{people.reduce((acc,p)=>acc+calculateDebt(p),0)}€</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : testView === 'charts' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[700px]">
                <div className="bg-white p-6 rounded-3xl border flex flex-col">
                  <h3 className="text-xs font-black mb-4 uppercase">Affluenza</h3>
                  <div className="flex-1"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartsData.timeline}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><Tooltip/><Area type="monotone" dataKey="persone" stroke="#6366f1" fill="#6366f122"/></AreaChart></ResponsiveContainer></div>
                </div>
                <div className="bg-white p-6 rounded-3xl border flex flex-col">
                  <h3 className="text-xs font-black mb-4 uppercase">Debiti Individuali (€)</h3>
                  <div className="flex-1"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartsData.debtData}><XAxis dataKey="name"/><YAxis/><Tooltip/><Bar dataKey="euro" fill="#10b981" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div>
                </div>
                <div className="bg-white p-6 rounded-3xl border flex flex-col col-span-1 md:col-span-2">
                  <h3 className="text-xs font-black mb-4 uppercase text-center">Copertura Fasce Orarie</h3>
                  <div className="flex-1 h-[300px]"><ResponsiveContainer width="100%" height="100%"><RadarChart data={chartsData.radar}><PolarGrid/><PolarAngleAxis dataKey="subject"/><Radar dataKey="A" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6}/></RadarChart></ResponsiveContainer></div>
                </div>
              </div>
            ) : testView === 'caranzano' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {DATES.map(d => (
                  <div key={d} className="bg-white rounded-3xl p-6 border shadow-sm">
                    <h3 className="text-xl font-black mb-4 uppercase border-b pb-2">{d}</h3>
                    {['Pranzo', 'Cena'].map(m => (
                      <div key={m} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl mb-2">
                        <span className="font-bold">{m}</span>
                        <span className="text-3xl font-black text-indigo-600">{countTotal(d, m)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {DATES.map(d => (
                  <div key={d} className="bg-white rounded-3xl p-6 border shadow-sm text-center">
                    <h3 className="font-black text-indigo-600 border-b pb-2 mb-4 uppercase">{d}</h3>
                    {TIME_SLOTS.map(s => (
                      <div key={s} className="flex justify-between py-2 border-b last:border-0">
                        <span className="font-bold text-slate-600">{s}</span>
                        <span className="font-black">{countTotal(d, s)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white flex justify-between items-center shadow-xl">
              <div><h2 className="text-2xl font-black uppercase">Ciao, {currentUser}</h2><p className="opacity-80 font-medium">Seleziona quando ci sarai</p></div>
              <div className="text-right"><div className="text-[10px] font-black uppercase opacity-60">Totale Pasti</div><div className="text-3xl font-black">{calculateDebt(currentUser)}€</div></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {DATES.map(d => (
                <div key={d} className="bg-white p-6 rounded-3xl border shadow-sm">
                  <div className="font-black mb-4 text-center border-b pb-2 text-indigo-600 uppercase tracking-widest">{d}</div>
                  <div className="space-y-2">
                    {TIME_SLOTS.map(s => {
                      const active = availabilities[currentUser]?.[d]?.[s];
                      return (
                        <button key={s} onClick={() => toggleAvailability(d, s)} className={`w-full py-4 rounded-2xl font-black uppercase transition-all flex items-center justify-between px-4 border-2 ${active ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-300'}`}>
                          <div className="flex items-center gap-2">{['Pranzo','Cena'].includes(s) ? <Utensils size={16}/> : <Clock size={16}/>} {s}</div>
                          {active && <CheckCircle2 size={20}/>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="fixed bottom-6 left-0 right-0 p-4 flex justify-center z-50">
              <button onClick={handleFinalSave} disabled={isSaving} className="w-full max-w-md bg-slate-900 text-white py-6 rounded-3xl font-black text-xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">
                {isSaving ? "SALVATAGGIO..." : "SALVA E TORNA ALLA HOME"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;