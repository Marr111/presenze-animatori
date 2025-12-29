import './App.css';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Check, Calendar, Users, LogOut, Search, Printer, Shield,
  Activity, Clock, ChevronRight, CheckCircle2, UserPlus,
  UserCheck, Lightbulb, Send, Trash2, BarChart3, TrendingUp, Utensils, AlertTriangle, Database, Trash, PieChart as PieIcon, Wallet
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, Radar, LineChart, Line, ResponsiveContainer
} from 'recharts';

const DATES = ['Gio 2 Apr', 'Ven 3 Apr', 'Sab 4 Apr'];
const TIME_SLOTS = ['Mattino', 'Pranzo', 'Pomeriggio', 'Cena', 'Sera', 'Notte'];
const MEAL_PRICE = 5;

const INITIAL_PEOPLE = [
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
  const [people, setPeople] = useState(INITIAL_PEOPLE);
  const [newIdea, setNewIdea] = useState("");
  const [testView, setTestView] = useState('summary');

  // --- LOGICA SINCRONIZZAZIONE ---
  const loadData = async () => {
    try {
      const response = await fetch('/api/get-data');
      const result = await response.json();
      setAvailabilities(result.availabilities || {});
      setIdeas(result.ideas || []);
      if (result.people && result.people.length > 0) setPeople(result.people);
    } catch (e) { console.error("Errore caricamento dati"); }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateDatabase = async (updatedAvail, updatedIdeas, updatedPeople) => {
    try {
      await fetch('/api/save-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            key: 'master_sync', 
            data: { 
                availabilities: updatedAvail || availabilities, 
                ideas: updatedIdeas || ideas,
                people: updatedPeople || people
            } 
        }),
      });
    } catch (e) { console.error("Errore salvataggio"); }
  };

  // --- GESTIONE AZIONI ---
  const addPerson = async () => {
    const name = prompt("Inserisci il tuo nome e cognome:");
    if (name && !people.includes(name)) {
      const updatedPeople = [...people, name].sort();
      setPeople(updatedPeople);
      await updateDatabase(null, null, updatedPeople);
      setCurrentUser(name);
    }
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
    await updateDatabase(updated, null, null);
  };

  const addIdea = async () => {
    if (!newIdea.trim()) return;
    const updated = [...ideas, { id: Date.now(), text: newIdea, author: currentUser || 'Anonimo' }];
    setIdeas(updated);
    setNewIdea("");
    await updateDatabase(null, updated, null);
  };

  const clearAndFillRandom = async () => {
    if (window.confirm("Vuoi resettare e generare dati casuali di test?")) {
      const randomAvail = {};
      people.forEach(p => {
        randomAvail[p] = {};
        DATES.forEach(d => {
          randomAvail[p][d] = {};
          TIME_SLOTS.forEach(s => {
            if (Math.random() > 0.7) randomAvail[p][d][s] = true;
          });
        });
      });
      setAvailabilities(randomAvail);
      await updateDatabase(randomAvail, [], people);
    }
  };

  // --- UTILITY ---
  const countTotal = (date, slot) => people.filter(p => availabilities[p]?.[date]?.[slot] === true).length;
  
  const getInitials = (name) => {
    if (name === 'Vittoria Pelassa') return "VP (VICE)";
    if (name.includes('Lorenzo Trucco')) return "LT (TENENTE)";
    return name.split(' ').filter(word => isNaN(word)).map(n => n[0]).join('').toUpperCase();
  };

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
    const debtData = people.map(p => ({ name: p.split(' ')[0], euro: calculateDebt(p) })).filter(d => d.euro > 0);
    return { timeline, debtData };
  }, [availabilities, people]);

  // --- RENDERING ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 flex flex-col items-center justify-center">
        <style>{`@media print { .no-print { display: none; } }`}</style>
        <h1 className="text-4xl font-black text-indigo-900 mb-10">Triduo Tracker 2026</h1>
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
          <div className="bg-white rounded-[2.5rem] shadow-xl p-6 flex flex-col h-[600px] border border-slate-200">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2"><UserCheck /> Accedi</h2>
            <div className="relative mb-4">
               <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
               <input type="text" placeholder="Cerca il tuo nome..." className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-2xl outline-none border focus:border-indigo-400 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 pr-2">
              {filteredPeople.map(p => (
                <button key={p} onClick={() => setCurrentUser(p)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 transition-all group">
                  <div className="w-12 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-[10px] leading-none px-1 text-center">{getInitials(p)}</div>
                  <span className="font-bold text-slate-700">{p}</span>
                  <ChevronRight className="ml-auto w-4 h-4 text-slate-300 group-hover:text-indigo-500" />
                </button>
              ))}
              {filteredPeople.length === 0 && (
                <button onClick={addPerson} className="w-full p-8 border-2 border-dashed rounded-3xl text-indigo-500 hover:bg-indigo-50 transition-all flex flex-col items-center gap-2">
                    <UserPlus />
                    <span className="font-black text-sm text-center">Non trovi il tuo nome?<br/>Inseriscilo qui</span>
                </button>
              )}
            </div>
            <button onClick={() => setCurrentUser('Admin')} className="mt-4 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800">Area Admin</button>
          </div>
          
          <div className="bg-white rounded-[2.5rem] shadow-xl p-6 flex flex-col h-[600px] border border-slate-200">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2"><Lightbulb className="text-amber-500"/> Idee Staff</h2>
            <div className="flex gap-2 mb-4">
              <input type="text" placeholder="Scrivi un'idea..." className="flex-1 px-4 py-3 bg-slate-50 rounded-2xl outline-none border" value={newIdea} onChange={(e) => setNewIdea(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addIdea()} />
              <button onClick={addIdea} className="p-4 bg-indigo-600 text-white rounded-2xl hover:scale-105 transition-transform"><Send size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3">
              {ideas.map(idea => (
                <div key={idea.id} className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                  <p className="text-slate-800 font-bold text-sm leading-tight italic">"{idea.text}"</p>
                  <div className="mt-2 text-[10px] font-black uppercase text-indigo-400 tracking-tighter">— {idea.author}</div>
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
          @page { size: landscape; margin: 1cm; }
          body { background: white; }
          nav, .no-print, .admin-nav { display: none !important; }
          .print-area { display: block !important; width: 100% !important; border: none !important; box-shadow: none !important; }
          table { font-size: 10px !important; }
          th, td { border: 1px solid #ddd !important; }
        }
      `}</style>
      
      <nav className="bg-white/80 backdrop-blur-xl border-b px-6 py-4 flex justify-between items-center sticky top-0 z-50 no-print">
        <div className="font-black text-indigo-600 tracking-tighter text-xl" onClick={() => setCurrentUser(null)}>TRIDUO 2026</div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
             <span className="text-[10px] font-black text-slate-400 uppercase">Utente Attivo</span>
             <span className="text-sm font-bold text-slate-800">{currentUser}</span>
          </div>
          <button onClick={() => setCurrentUser(null)} className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-all"><LogOut size={20}/></button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {isAdmin ? (
          <div className="space-y-6">
            <div className="flex gap-2 flex-wrap admin-nav no-print">
              {['summary', 'matrix', 'charts', 'data'].map(v => (
                <button key={v} onClick={() => setTestView(v)} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${testView === v ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 hover:bg-slate-100'}`}>{v}</button>
              ))}
              <button onClick={() => window.print()} className="ml-auto px-6 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase flex items-center gap-2"><Printer size={16}/> Stampa Matrix</button>
            </div>

            {testView === 'matrix' ? (
              <div className="bg-white rounded-3xl border shadow-2xl overflow-hidden print-area">
                <div className="p-6 border-b bg-slate-50 flex justify-between items-center no-print">
                   <h2 className="font-black text-slate-800 uppercase">Tabella Master Presenze</h2>
                   <div className="text-xs font-bold text-indigo-600 flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full"><Wallet size={14}/> Ogni pasto (Pranzo/Cena) = 5.00€</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="p-4 text-left border-b border-r sticky left-0 bg-slate-100 z-10 w-40">Staff</th>
                        {ALL_PERIODS.map((p,i)=><th key={i} className="p-2 border-b border-r text-center font-black leading-none bg-slate-50">{p.date.split(' ')[1]}<br/><span className="text-indigo-500">{p.slot}</span></th>)}
                        <th className="p-4 text-center border-b bg-amber-50 font-black text-amber-700">TOTALE €</th>
                      </tr>
                    </thead>
                    <tbody>
                      {people.map(person => (
                        <tr key={person} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-bold border-b border-r sticky left-0 bg-white z-10">{person}</td>
                          {ALL_PERIODS.map((p,i)=>(
                            <td key={i} className={`text-center border-b border-r p-1 ${availabilities[person]?.[p.date]?.[p.slot] ? 'bg-emerald-50' : ''}`}>
                               {availabilities[person]?.[p.date]?.[p.slot] && <Check size={16} className="mx-auto text-emerald-500"/>}
                            </td>
                          ))}
                          <td className="p-3 text-center border-b bg-amber-50 font-black text-amber-700 text-sm">
                            {calculateDebt(person)}€
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-indigo-900 text-white">
                      <tr>
                        <td className="p-4 font-black uppercase border-r">Persone Presenti</td>
                        {ALL_PERIODS.map((p,i)=>(
                          <td key={i} className="text-center font-black text-sm border-r">{countTotal(p.date, p.slot)}</td>
                        ))}
                        <td className="bg-indigo-950 p-4 text-center font-black text-sm">
                          {people.reduce((acc, p) => acc + calculateDebt(p), 0)}€
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : testView === 'charts' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-white p-6 rounded-[2.5rem] border shadow-sm h-[400px]">
                    <h3 className="font-black text-slate-800 uppercase mb-6 flex items-center gap-2"><TrendingUp className="text-indigo-500"/> Affluenza Triduo</h3>
                    <ResponsiveContainer width="100%" height="85%">
                        <AreaChart data={chartsData.timeline}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                           <XAxis dataKey="name" tick={{fontSize: 10}}/>
                           <YAxis hide/>
                           <Tooltip />
                           <Area type="monotone" dataKey="persone" stroke="#6366f1" fill="#6366f133" strokeWidth={4}/>
                        </AreaChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="bg-white p-6 rounded-[2.5rem] border shadow-sm h-[400px]">
                    <h3 className="font-black text-slate-800 uppercase mb-6 flex items-center gap-2"><Wallet className="text-emerald-500"/> Debiti Individuali (€)</h3>
                    <ResponsiveContainer width="100%" height="85%">
                        <BarChart data={chartsData.debtData}>
                           <XAxis dataKey="name" tick={{fontSize: 10}}/>
                           <YAxis />
                           <Tooltip />
                           <Bar dataKey="euro" fill="#10b981" radius={[10, 10, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                 </div>
              </div>
            ) : testView === 'data' ? (
              <div className="bg-white p-12 rounded-[3.5rem] border-8 border-rose-50 shadow-2xl text-center max-w-2xl mx-auto">
                <AlertTriangle size={80} className="mx-auto text-rose-500 mb-6" />
                <h2 className="text-3xl font-black text-slate-800 mb-4 uppercase tracking-tighter">Pannello di Controllo</h2>
                <p className="text-slate-500 mb-10 font-medium">Il reset cancellerà tutte le disponibilità ma manterrà la lista dello staff.</p>
                <div className="flex flex-col gap-4">
                    <button onClick={clearAndFillRandom} className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black text-xl shadow-xl hover:bg-indigo-700 transition-all">GENERA TEST RANDOM</button>
                    <button onClick={() => {if(window.confirm("Sicuro?")) updateDatabase({}, [], INITIAL_PEOPLE)}} className="w-full bg-rose-600 text-white py-5 rounded-3xl font-black text-xl shadow-xl hover:bg-rose-700 transition-all">RESET TOTALE DATABASE</button>
                </div>
              </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {DATES.map(d => (
                    <div key={d} className="bg-white rounded-[2.5rem] p-8 border shadow-sm">
                      <h3 className="text-2xl font-black text-indigo-900 border-b-4 border-indigo-50 pb-4 mb-6 uppercase tracking-tighter">{d}</h3>
                      {TIME_SLOTS.map(slot => (
                        <div key={slot} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl mb-2 hover:bg-indigo-50 transition-colors">
                          <span className={`font-bold ${['Pranzo','Cena'].includes(slot) ? 'text-indigo-600' : 'text-slate-500'}`}>{slot}</span>
                          <div className="flex items-center gap-3">
                             <span className="text-xs font-black text-slate-300 uppercase">Presenti</span>
                             <span className="text-3xl font-black text-slate-800">{countTotal(d, slot)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
            )}
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-2xl">
                <div>
                   <h2 className="text-3xl font-black uppercase tracking-tighter">Ciao, {currentUser}!</h2>
                   <p className="text-indigo-100 font-medium">Seleziona i momenti in cui ci sarai.</p>
                </div>
                <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-white/30 flex items-center gap-4">
                   <div className="bg-white text-indigo-600 p-3 rounded-xl"><Wallet /></div>
                   <div>
                      <div className="text-[10px] font-black uppercase opacity-60">Il tuo totale</div>
                      <div className="text-2xl font-black">{calculateDebt(currentUser)}€ <span className="text-xs opacity-80 font-bold">(5€/pasto)</span></div>
                   </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {DATES.map(d => (
                <div key={d} className="bg-white p-8 rounded-[2.5rem] border shadow-xl">
                  <div className="font-black mb-6 uppercase border-b-2 pb-4 text-indigo-600 text-center tracking-widest text-lg">{d}</div>
                  <div className="grid grid-cols-1 gap-3">
                    {TIME_SLOTS.map(s => {
                      const isSelected = availabilities[currentUser]?.[d]?.[s];
                      const isMeal = ['Pranzo', 'Cena'].includes(s);
                      return (
                        <button key={s} onClick={() => toggleAvailability(d, s)} className={`group relative h-16 rounded-2xl border-2 font-black uppercase transition-all flex items-center px-6 gap-4 ${isSelected ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg scale-[1.02]' : 'bg-white text-slate-300 border-slate-100 hover:border-indigo-200 hover:text-indigo-400'}`}>
                          <div className={`p-2 rounded-lg ${isSelected ? 'bg-white/20' : 'bg-slate-50'}`}>
                             {isMeal ? <Utensils size={18}/> : <Clock size={18}/>}
                          </div>
                          <span className="flex-1 text-left">{s}</span>
                          {isSelected && <CheckCircle2 size={24} />}
                          {isMeal && !isSelected && <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-md text-slate-400">5€</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="fixed bottom-8 left-0 right-0 p-4 flex justify-center z-50 no-print">
              <button onClick={() => { window.scrollTo(0,0); setCurrentUser(null); }} className="w-full max-w-md bg-slate-900 text-white py-6 rounded-3xl font-black text-xl shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-4">SALVA E TORNA ALLA HOME <Check size={28}/></button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;