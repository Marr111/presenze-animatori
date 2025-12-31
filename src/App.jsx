import React, { useState, useEffect, useMemo } from 'react';
import { 
  Check, LogOut, Search, Printer, ChevronRight, CheckCircle2, UserPlus,
  Lightbulb, Send, Utensils, AlertTriangle, Clock, Wallet, TrendingUp, Activity, 
  BarChart3, PieChart as PieIcon, Bell, Moon, Sun, Download, Mail, Calendar, 
  MessageSquare, Users
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, 
  RadarChart, PolarGrid, PolarAngleAxis, Radar, PieChart, Pie, Cell, LineChart, Line, Legend, ResponsiveContainer
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
  const [darkMode, setDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState("");
  const [notificationPhone, setNotificationPhone] = useState("");

  const theme = {
    bg: darkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50',
    card: darkMode ? 'bg-slate-800' : 'bg-white',
    text: darkMode ? 'text-white' : 'text-slate-800',
    textSecondary: darkMode ? 'text-slate-300' : 'text-slate-600',
    border: darkMode ? 'border-slate-700' : 'border-purple-100',
    hover: darkMode ? 'hover:bg-slate-700' : 'hover:bg-purple-50',
    input: darkMode ? 'bg-slate-700 text-white' : 'bg-slate-50',
    accent: darkMode ? 'bg-purple-600' : 'bg-gradient-to-r from-purple-500 to-pink-500'
  };

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

  const toggleAvailability = (date, slot) => {
    setAvailabilities(prev => {
      const userAvail = prev[currentUser] || {};
      const dateAvail = userAvail[date] || {};
      return {
        ...prev,
        [currentUser]: {
          ...userAvail,
          [date]: {
            ...dateAvail,
            [slot]: !dateAvail[slot]
          }
        }
      };
    });
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
    const newIdeas = [...ideas, { id: Date.now(), text: newIdea }];
    setIdeas(newIdeas);
    setNewIdea("");
    await persistToCloud({ availabilities, ideas: newIdeas, people });
  };

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

  const exportToExcel = () => {
    let csv = 'Staff,' + ALL_PERIODS.map(p => `${p.date} ${p.slot}`).join(',') + ',Totale Euro\n';
    people.forEach(p => {
      csv += p + ',';
      csv += ALL_PERIODS.map(per => availabilities[p]?.[per.date]?.[per.slot] ? 'X' : '').join(',');
      csv += ',' + calculateDebt(p) + '€\n';
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'triduo-tracker-2026.csv';
    a.click();
  };

  const dishPlan = useMemo(() => {
    return DATES.flatMap(d => ['Pranzo', 'Cena'].map(m => {
      const available = people.filter(p => availabilities[p]?.[d]?.[m]);
      const shuffled = [...available].sort(() => Math.random() - 0.5);
      return {
        date: d,
        meal: m,
        people: shuffled.slice(0, 3),
        total: available.length
      };
    }));
  }, [availabilities, people]);

  const chartsData = useMemo(() => {
    const timeline = ALL_PERIODS.map(p => ({ name: `${p.date.split(' ')[1]} ${p.slot[0]}.`, persone: countTotal(p.date, p.slot) }));
    const mealsMix = [
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
    const dailyTotal = DATES.map(d => ({ name: d, totale: TIME_SLOTS.reduce((acc, s) => acc + countTotal(d, s), 0) }));
    const categoryMix = [
      { name: 'Pasti', value: DATES.reduce((acc, d) => acc + countTotal(d, 'Pranzo') + countTotal(d, 'Cena'), 0) },
      { name: 'Altro', value: DATES.reduce((acc, d) => acc + countTotal(d, 'Mattino') + countTotal(d, 'Pomeriggio') + countTotal(d, 'Sera') + countTotal(d, 'Notte'), 0) }
    ];
    const lineData = DATES.map(d => ({ 
      name: d.split(' ')[1], 
      Mattino: countTotal(d, 'Mattino'),
      Pomeriggio: countTotal(d, 'Pomeriggio'),
      Sera: countTotal(d, 'Sera')
    }));
    return { timeline, mealsMix, staffActivity, radar, debtData, dailyTotal, categoryMix, lineData };
  }, [availabilities, people]);

  // LOGIN VIEW
  if (!currentUser) {
    return (
      <div className={`min-h-screen ${theme.bg} p-4 flex flex-col items-center justify-center transition-colors duration-300`}>
        <div className="absolute top-4 right-4">
          <button onClick={() => setDarkMode(!darkMode)} className={`p-3 ${theme.card} rounded-2xl border shadow-lg`}>
            {darkMode ? <Sun className="text-yellow-400" size={24} /> : <Moon className="text-indigo-600" size={24} />}
          </button>
        </div>
        <h1 className={`text-4xl md:text-6xl font-black ${theme.text} mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600`}>
          Triduo Tracker 2026 ✨
        </h1>
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`${theme.card} rounded-[2rem] shadow-xl p-6 flex flex-col h-[500px] border-2 ${theme.border}`}>
            <h2 className={`text-xl font-bold mb-4 ${theme.text}`}>Chi sei?</h2>
            <input 
              type="text" placeholder="Cerca nome..." 
              className={`w-full p-3 rounded-xl mb-4 border ${theme.input}`}
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
              {people.filter(p => p.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                <button key={p} onClick={() => setCurrentUser(p)} className={`w-full flex items-center gap-3 p-3 rounded-xl border ${theme.hover} ${theme.border}`}>
                  <div className="w-10 h-10 rounded-lg bg-purple-500 text-white flex items-center justify-center font-bold text-xs">{getInitials(p)}</div>
                  <span className={`font-medium ${theme.text}`}>{p}</span>
                </button>
              ))}
            </div>
            <button onClick={addPerson} className="mt-4 p-3 border-2 border-dashed border-purple-400 rounded-xl text-purple-600 font-bold text-sm">
              + AGGIUNGI ANIMATORE
            </button>
            <button onClick={() => setCurrentUser('Admin')} className="mt-2 p-3 bg-slate-800 text-white rounded-xl font-bold text-xs">🔐 ADMIN ACCESS</button>
          </div>
          <div className={`${theme.card} rounded-[2rem] shadow-xl p-6 flex flex-col h-[500px] border-2 ${theme.border}`}>
            <h2 className={`text-xl font-bold mb-4 ${theme.text}`}>Idee Brillanti</h2>
            <div className="flex gap-2 mb-4">
              <input value={newIdea} onChange={(e) => setNewIdea(e.target.value)} className={`flex-1 p-3 rounded-xl border ${theme.input}`} placeholder="Idea..." />
              <button onClick={addIdea} className="p-3 bg-purple-500 text-white rounded-xl"><Send size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
              {ideas.map(idea => (
                <div key={idea.id} className={`p-3 rounded-xl border ${theme.border} bg-purple-50/50`}>
                  <p className="text-sm font-medium">" {idea.text} "</p>
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
    <div className={`min-h-screen ${theme.bg} pb-20`}>
      <nav className={`${theme.card} border-b px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-md`}>
        <div className="font-black text-purple-600 text-xl" onClick={() => setCurrentUser(null)}>✨ TRACKER 2026</div>
        <div className="flex items-center gap-4">
          <span className={`px-4 py-2 rounded-full ${theme.input} font-bold text-sm`}>{currentUser}</span>
          <button onClick={() => setCurrentUser(null)} className="text-rose-500"><LogOut/></button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {isAdmin ? (
          <div className="space-y-6">
            <div className="flex gap-2 flex-wrap">
              {['summary', 'matrix', 'charts', 'dishes'].map(v => (
                <button key={v} onClick={() => setTestView(v)} className={`px-4 py-2 rounded-xl font-bold text-xs uppercase ${testView === v ? 'bg-purple-600 text-white' : 'bg-white border'}`}>
                  {v}
                </button>
              ))}
              <button onClick={() => window.print()} className="ml-auto px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold text-xs uppercase">Stampa</button>
              <button onClick={exportToExcel} className="px-4 py-2 bg-blue-500 text-white rounded-xl font-bold text-xs uppercase">Excel</button>
            </div>

            {testView === 'matrix' && (
              <div className={`${theme.card} rounded-2xl border shadow-xl overflow-x-auto`}>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="p-3 text-left sticky left-0 bg-slate-100">Staff</th>
                      {ALL_PERIODS.map((p, i) => <th key={i} className="p-2 border-l">{p.date}<br/>{p.slot}</th>)}
                      <th className="p-2 border-l">€</th>
                    </tr>
                  </thead>
                  <tbody>
                    {people.map(p => (
                      <tr key={p} className="border-t">
                        <td className="p-3 font-bold sticky left-0 bg-white">{p}</td>
                        {ALL_PERIODS.map((per, i) => (
                          <td key={i} className="p-2 text-center border-l">
                            {availabilities[p]?.[per.date]?.[per.slot] && <Check size={14} className="mx-auto text-emerald-500" />}
                          </td>
                        ))}
                        <td className="p-2 text-center border-l font-bold">{calculateDebt(p)}€</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {testView === 'dishes' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {dishPlan.map((item, idx) => (
                  <div key={idx} className={`${theme.card} p-4 rounded-2xl border shadow-md`}>
                    <div className="flex justify-between font-bold mb-3 border-b pb-2">
                      <span>{item.date}</span>
                      <span className="text-purple-600">{item.meal}</span>
                    </div>
                    {item.people.map((p, i) => <div key={i} className="text-sm py-1">🍽️ {p}</div>)}
                    <div className="mt-2 pt-2 border-t text-[10px] text-slate-400">Totale disponibili: {item.total}</div>
                  </div>
                ))}
              </div>
            )}

            {testView === 'charts' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className={`${theme.card} p-4 rounded-2xl border h-64`}>
                    <h3 className="text-xs font-bold mb-4 uppercase">Presenze Timeline</h3>
                    <ResponsiveContainer width="100%" height="90%">
                      <AreaChart data={chartsData.timeline}>
                        <XAxis dataKey="name" tick={{fontSize: 8}}/>
                        <Tooltip />
                        <Area type="monotone" dataKey="persone" stroke="#8884d8" fill="#8884d8" />
                      </AreaChart>
                    </ResponsiveContainer>
                 </div>
                 <div className={`${theme.card} p-4 rounded-2xl border h-64`}>
                    <h3 className="text-xs font-bold mb-4 uppercase">Debiti Totali</h3>
                    <ResponsiveContainer width="100%" height="90%">
                      <BarChart data={chartsData.debtData}>
                        <XAxis dataKey="name" tick={{fontSize: 8}}/>
                        <Tooltip />
                        <Bar dataKey="euro" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                 </div>
              </div>
            )}

            {testView === 'summary' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {DATES.map(d => (
                  <div key={d} className={`${theme.card} p-6 rounded-2xl border shadow-lg`}>
                    <h3 className="font-black text-xl mb-4 text-purple-600 border-b pb-2">{d}</h3>
                    {TIME_SLOTS.map(s => (
                      <div key={s} className="flex justify-between py-2 border-b last:border-0">
                        <span className="text-sm font-medium uppercase">{s}</span>
                        <span className="font-bold text-lg">{countTotal(d, s)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-6">
             <div className={`${theme.card} p-6 rounded-3xl border-2 ${theme.border} shadow-xl`}>
                <h2 className="text-2xl font-black mb-4">Ciao {currentUser}! 👋</h2>
                <p className="text-sm text-slate-500 mb-6">Seleziona i momenti in cui sarai presente. Il sistema calcolerà automaticamente i costi dei pasti.</p>
                
                <div className="space-y-8">
                  {DATES.map(d => (
                    <div key={d}>
                      <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                        <Calendar size={18} className="text-purple-500"/> {d}
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {TIME_SLOTS.map(s => {
                          const active = availabilities[currentUser]?.[d]?.[s];
                          return (
                            <button
                              key={s}
                              onClick={() => toggleAvailability(d, s)}
                              className={`p-3 rounded-2xl border-2 transition-all font-bold text-xs uppercase flex flex-col items-center gap-1 ${
                                active ? 'bg-purple-600 border-purple-600 text-white shadow-lg scale-105' : 'bg-white border-slate-100 text-slate-400'
                              }`}
                            >
                              {s === 'Pranzo' || s === 'Cena' ? <Utensils size={14}/> : <Clock size={14}/>}
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-4 bg-amber-50 rounded-2xl border-2 border-amber-100 flex justify-between items-center">
                   <div>
                      <p className="text-[10px] font-black uppercase text-amber-600">Totale Contributo Pasti</p>
                      <p className="text-2xl font-black text-amber-700">{calculateDebt(currentUser)}€</p>
                   </div>
                   <Wallet className="text-amber-500" size={32} />
                </div>

                <button 
                  onClick={() => { persistToCloud({availabilities, ideas, people}); alert("Dati salvati con successo!"); }}
                  className="w-full mt-6 p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl"
                >
                  Salva Disponibilità
                </button>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
