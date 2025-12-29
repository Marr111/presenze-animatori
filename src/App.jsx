import './App.css';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Check, Calendar, Users, LogOut, Search, Printer, Shield,
  Activity, Clock, ChevronRight, CheckCircle2, UserPlus,
  UserCheck, Lightbulb, Send, Trash2, BarChart3, TrendingUp, Utensils, AlertTriangle, Database, Trash, PieChart as PieIcon, Wallet
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer
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
      if (!currentUser) loadData(); // Auto-sync solo se non si sta modificando
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
    if (!currentUser || currentUser === 'Admin') return;
    const updated = {
      ...availabilities,
      [currentUser]: { 
        ...availabilities[currentUser], 
        [date]: { ...availabilities[currentUser]?.[date], [slot]: !availabilities[currentUser]?.[date]?.[slot] } 
      }
    };
    setAvailabilities(updated);
  };

  const clearAndFillRandom = async () => {
    if (window.confirm("Resettare e generare dati casuali?")) {
      const randomAvail = {};
      people.forEach(p => {
        randomAvail[p] = {};
        DATES.forEach(d => {
          randomAvail[p][d] = {};
          TIME_SLOTS.forEach(s => { if (Math.random() > 0.7) randomAvail[p][d][s] = true; });
        });
      });
      setAvailabilities(randomAvail);
      await persistToCloud({ availabilities: randomAvail, ideas: [], people });
    }
  };

  // --- UTILITY ---
  const getInitials = (name) => {
    if (name === 'Vittoria Pelassa') return "VP (VICE)";
    if (name.includes('Lorenzo Trucco')) return "LT (TENENTE)";
    return name.split(' ').filter(word => isNaN(word)).map(n => n[0]).join('').toUpperCase();
  };

  const countTotal = (date, slot) => people.filter(p => availabilities[p]?.[date]?.[slot] === true).length;

  const calculateDebt = (person) => {
    let meals = 0;
    DATES.forEach(d => {
      if (availabilities[person]?.[d]?.['Pranzo']) meals++;
      if (availabilities[person]?.[d]?.['Cena']) meals++;
    });
    return meals * MEAL_PRICE;
  };

  const filteredPeople = useMemo(() => people.filter(p => p.toLowerCase().includes(searchTerm.toLowerCase())), [searchTerm, people]);

  const chartsData = useMemo(() => {
    const timeline = ALL_PERIODS.map(p => ({ name: `${p.date.split(' ')[1]} ${p.slot[0]}.`, persone: countTotal(p.date, p.slot) }));
    const meals = [
      { name: 'Pranzi', value: DATES.reduce((acc, d) => acc + countTotal(d, 'Pranzo'), 0) },
      { name: 'Cene', value: DATES.reduce((acc, d) => acc + countTotal(d, 'Cena'), 0) }
    ];
    const staffActivity = people.map(p => {
      let count = 0;
      DATES.forEach(d => TIME_SLOTS.forEach(s => { if (availabilities[p]?.[d]?.[s]) count++; }));
      return { name: p.split(' ')[0], impegni: count };
    });
    const radar = TIME_SLOTS.map(s => ({ subject: s, A: DATES.reduce((acc, d) => acc + countTotal(d, s), 0) }));
    const debtData = people.map(p => ({ name: p.split(' ')[0], euro: calculateDebt(p) })).filter(d => d.euro > 0);
    return { timeline, meals, staffActivity, radar, debtData };
  }, [availabilities, people]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 flex flex-col items-center justify-center">
        <h1 className="text-4xl font-black text-slate-800 mb-10">Triduo Tracker 2026</h1>
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-[2.5rem] shadow-xl p-6 flex flex-col h-[550px] border">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2"><UserCheck /> Accedi</h2>
            <input type="text" placeholder="Cerca il tuo nome..." className="w-full px-4 py-3 bg-slate-50 rounded-2xl mb-4 border outline-none focus:border-indigo-400" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <div className="flex-1 overflow-y-auto space-y-1">
              {filteredPeople.map(p => (
                <button key={p} onClick={() => { setCurrentUser(p); loadData(); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 transition-all group">
                  <div className="w-12 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-[10px]">{getInitials(p)}</div>
                  <span className="font-bold text-slate-700">{p}</span>
                  <ChevronRight className="ml-auto w-4 h-4 text-slate-300" />
                </button>
              ))}
              {filteredPeople.length === 0 && (
                <button onClick={addPerson} className="w-full p-6 border-2 border-dashed rounded-3xl text-indigo-500 font-bold hover:bg-indigo-50">Non trovi il tuo nome? Aggiungilo qui</button>
              )}
            </div>
            <button onClick={() => setCurrentUser('Admin')} className="mt-4 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Admin Access</button>
          </div>
          
          <div className="bg-white rounded-[2.5rem] shadow-xl p-6 flex flex-col h-[550px] border">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2"><Lightbulb className="text-amber-500"/> Idee</h2>
            <div className="flex gap-2 mb-4">
              <input type="text" placeholder="Nuova idea..." className="flex-1 px-4 py-3 bg-slate-50 rounded-2xl border outline-none" value={newIdea} onChange={(e) => setNewIdea(e.target.value)} onKeyPress={(e)=>e.key==='Enter'&&addIdea()}/>
              <button onClick={addIdea} className="p-3 bg-amber-500 text-white rounded-2xl"><Send size={18} /></button>
            </div>
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
      <style>{`
        @media print {
          @page { size: landscape; }
          nav, .no-print { display: none !important; }
          .print-area { display: block !important; width: 100% !important; border: none !important; }
          table { font-size: 9px !important; }
        }
      `}</style>
      
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-50 no-print">
        <div className="font-black text-indigo-600 text-xl cursor-pointer" onClick={() => setCurrentUser(null)}>TRACKER 2026</div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] font-black text-slate-400 uppercase">Utente</div>
            <div className="text-sm font-bold">{currentUser}</div>
          </div>
          <button onClick={() => setCurrentUser(null)} className="p-2 bg-rose-50 text-rose-500 rounded-xl"><LogOut size={20}/></button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {isAdmin ? (
          <div className="space-y-6">
            <div className="flex gap-2 flex-wrap no-print">
              {['summary', 'caranzano', 'matrix', 'charts', 'data'].map(v => (
                <button key={v} onClick={() => setTestView(v)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase ${testView === v ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-400'}`}>{v}</button>
              ))}
              <button onClick={() => window.print()} className="ml-auto px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase flex items-center gap-2"><Printer size={16}/> Stampa</button>
            </div>

            {testView === 'matrix' ? (
              <div className="bg-white rounded-3xl border shadow-xl overflow-hidden print-area">
                <table className="w-full text-[10px] border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="p-2 text-left border-r sticky left-0 bg-slate-50 z-10 w-32">Staff</th>
                      {ALL_PERIODS.map((p,i)=><th key={i} className="p-1 border-r text-center font-black">{p.date.split(' ')[1]}<br/>{p.slot}</th>)}
                      <th className="p-2 bg-amber-50">EURO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {people.map(p => (
                      <tr key={p} className="border-t">
                        <td className="p-2 font-bold sticky left-0 bg-white border-r">{p}</td>
                        {ALL_PERIODS.map((per,i)=><td key={i} className="text-center border-r p-1">{availabilities[p]?.[per.date]?.[per.slot] && <Check size={14} className="mx-auto text-emerald-500"/>}</td>)}
                        <td className="p-2 text-center bg-amber-50 font-black">{calculateDebt(p)}€</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-900 text-white font-black">
                    <tr>
                      <td className="p-2 border-r">PRESENTI</td>
                      {ALL_PERIODS.map((p,i)=><td key={i} className="text-center border-r">{countTotal(p.date, p.slot)}</td>)}
                      <td className="bg-indigo-600">{people.reduce((acc,p)=>acc+calculateDebt(p),0)}€</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : testView === 'charts' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border h-[300px]">
                  <h3 className="text-xs font-black uppercase mb-4">Affluenza Timeline</h3>
                  <ResponsiveContainer><AreaChart data={chartsData.timeline}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><Tooltip/><Area type="monotone" dataKey="persone" stroke="#6366f1" fill="#6366f122"/></AreaChart></ResponsiveContainer>
                </div>
                <div className="bg-white p-6 rounded-3xl border h-[300px]">
                  <h3 className="text-xs font-black uppercase mb-4">Impegni Staff</h3>
                  <ResponsiveContainer><BarChart data={chartsData.staffActivity}><XAxis dataKey="name"/><YAxis/><Tooltip/><Bar dataKey="impegni" fill="#10b981" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer>
                </div>
                <div className="bg-white p-6 rounded-3xl border h-[300px]">
                  <h3 className="text-xs font-black uppercase mb-4">Radar Copertura</h3>
                  <ResponsiveContainer><RadarChart data={chartsData.radar}><PolarGrid/><PolarAngleAxis dataKey="subject"/><Radar dataKey="A" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6}/></RadarChart></ResponsiveContainer>
                </div>
                <div className="bg-white p-6 rounded-3xl border h-[300px]">
                  <h3 className="text-xs font-black uppercase mb-4">Debiti Personali (€)</h3>
                  <ResponsiveContainer><BarChart data={chartsData.debtData}><XAxis dataKey="name"/><YAxis/><Tooltip/><Bar dataKey="euro" fill="#f43f5e" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer>
                </div>
              </div>
            ) : testView === 'caranzano' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {DATES.map(d => (
                    <div key={d} className="bg-white rounded-[2rem] p-6 border shadow-sm">
                      <h3 className="text-xl font-black text-slate-800 border-b pb-4 mb-4 uppercase">{d}</h3>
                      {['Pranzo', 'Cena'].map(meal => (
                        <div key={meal} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl mb-2">
                          <span className="font-bold text-slate-600">{meal} (5€)</span>
                          <span className="text-3xl font-black text-indigo-600">{countTotal(d, meal)}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
            ) : testView === 'data' ? (
              <div className="bg-white p-10 rounded-[3rem] border shadow-2xl text-center max-w-lg mx-auto">
                <AlertTriangle size={64} className="mx-auto text-rose-600 mb-4" />
                <h2 className="text-2xl font-black mb-6 uppercase">Controllo Dati</h2>
                <div className="space-y-4">
                  <button onClick={clearAndFillRandom} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase">Genera Test Casuale</button>
                  <button onClick={() => {if(window.confirm("Sicuro?")) persistToCloud({availabilities:{}, ideas:[], people:INITIAL_PEOPLE})}} className="w-full bg-rose-600 text-white py-4 rounded-2xl font-black uppercase">Reset Totale Cloud</button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {DATES.map(d => (
                  <div key={d} className="bg-white rounded-3xl p-6 border shadow-sm">
                    <h3 className="font-black text-indigo-600 border-b pb-2 mb-4 uppercase">{d}</h3>
                    {TIME_SLOTS.map(s => (
                      <div key={s} className="flex justify-between py-2 border-b border-slate-50 last:border-0">
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
              <div>
                <h2 className="text-2xl font-black uppercase">Ciao, {currentUser}</h2>
                <p className="opacity-80">Gestisci le tue disponibilità per il Triduo</p>
              </div>
              <div className="text-right bg-white/20 p-4 rounded-2xl border border-white/30">
                <div className="text-[10px] font-black uppercase opacity-60">Totale Pasti</div>
                <div className="text-3xl font-black">{calculateDebt(currentUser)}€</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {DATES.map(d => (
                <div key={d} className="bg-white p-6 rounded-3xl border shadow-sm">
                  <div className="font-black mb-4 text-center border-b pb-2 text-indigo-600 uppercase tracking-widest">{d}</div>
                  <div className="space-y-2">
                    {TIME_SLOTS.map(s => {
                      const active = availabilities[currentUser]?.[d]?.[s];
                      const isMeal = ['Pranzo', 'Cena'].includes(s);
                      return (
                        <button key={s} onClick={() => toggleAvailability(d, s)} className={`w-full py-4 rounded-2xl font-black uppercase transition-all flex items-center justify-between px-4 border-2 ${active ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-300'}`}>
                          <div className="flex items-center gap-2">{isMeal ? <Utensils size={16}/> : <Clock size={16}/>} {s}</div>
                          {active ? <CheckCircle2 size={20}/> : (isMeal ? <span className="text-[9px]">5€</span> : null)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="fixed bottom-6 left-0 right-0 p-4 flex justify-center z-50">
              <button onClick={handleFinalSave} disabled={isSaving} className="w-full max-w-md bg-slate-900 text-white py-6 rounded-3xl font-black text-xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">
                {isSaving ? "SALVATAGGIO IN CORSO..." : "SALVA E TORNA ALLA HOME"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;