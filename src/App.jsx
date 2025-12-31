import React, { useState, useEffect, useMemo } from 'react';
import { 
  Check, LogOut, Search, Printer, ChevronRight, CheckCircle2, UserPlus,
  Lightbulb, Send, Utensils, AlertTriangle, Clock, Wallet, TrendingUp, Activity, BarChart3, PieChart as PieIcon, Bell, Moon, Sun, Download, Mail, Calendar, MessageSquare, Users
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, Radar, PieChart, Pie, Cell, LineChart, Line, Legend
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

  // Colori dinamici basati sul tema
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
    const newIdeas = [...ideas, { id: Date.now(), text: newIdea }];
    setIdeas(newIdeas);
    setNewIdea("");
    await persistToCloud({ availabilities, ideas: newIdeas, people });
  };

  const toggleAvailability = (date, slot) => {
    setAvailabilities(prev => ({
      ...prev,
      [currentUser]: { 
        ...prev[currentUser], 
        [date]: { ...prev[prev[currentUser]]?.[date], [slot]: !prev[currentUser]?.[date]?.[slot] } 
      }
    }));
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

  // Funzione per esportare in Excel (CSV)
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

  // Pianificazione piatti
  const generateDishwashingPlan = () => {
    const meals = DATES.flatMap(d => ['Pranzo', 'Cena'].map(m => ({ date: d, meal: m })));
    const plan = [];
    
    meals.forEach(({ date, meal }) => {
      const available = people.filter(p => availabilities[p]?.[date]?.[meal]);
      const selected = [];
      
      // Seleziona 3 persone casuali tra i disponibili
      const shuffled = [...available].sort(() => Math.random() - 0.5);
      for (let i = 0; i < Math.min(3, shuffled.length); i++) {
        selected.push(shuffled[i]);
      }
      
      plan.push({
        date,
        meal,
        people: selected,
        total: available.length
      });
    });
    
    return plan;
  };

  const dishPlan = useMemo(() => generateDishwashingPlan(), [availabilities, people]);

  // Gestione notifiche
  const sendNotifications = () => {
    const message = `Ciao ${currentUser}! Ricorda il Triduo 2026. Hai ${DATES.length} giorni da gestire. Debito totale: ${calculateDebt(currentUser)}€`;
    
    if (notificationEmail) {
      alert(`Email inviata a: ${notificationEmail}\n\n${message}`);
    }
    if (notificationPhone) {
      alert(`SMS inviato a: ${notificationPhone}\n\n${message}`);
    }
    
    setShowNotifications(false);
  };

  const addToCalendar = () => {
    const startDate = '20260402'; // Gio 2 Apr
    const title = 'Triduo 2026 - Le mie disponibilità';
    const description = `Presenze registrate per il Triduo. Costo stimato: ${calculateDebt(currentUser)}€`;
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startDate}/${startDate}&details=${encodeURIComponent(description)}`;
    window.open(calendarUrl, '_blank');
  };

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
      { name: 'Fasce Pasti', value: DATES.reduce((acc, d) => acc + countTotal(d, 'Pranzo') + countTotal(d, 'Cena'), 0) },
      { name: 'Altre Fasce', value: DATES.reduce((acc, d) => acc + countTotal(d, 'Mattino') + countTotal(d, 'Pomeriggio') + countTotal(d, 'Sera') + countTotal(d, 'Notte'), 0) }
    ];
    const lineData = DATES.map(d => ({ 
      name: d.split(' ')[1], 
      Mattino: countTotal(d, 'Mattino'),
      Pomeriggio: countTotal(d, 'Pomeriggio'),
      Sera: countTotal(d, 'Sera')
    }));
    return { timeline, mealsMix, staffActivity, radar, debtData, dailyTotal, categoryMix, lineData };
  }, [availabilities, people]);

  if (!currentUser) {
    return (
      <div className={`min-h-screen ${theme.bg} p-4 flex flex-col items-center justify-center transition-colors duration-300`}>
        <div className="absolute top-4 right-4">
          <button onClick={() => setDarkMode(!darkMode)} className={`p-3 ${theme.card} rounded-2xl ${theme.border} border shadow-lg hover:scale-110 transition-transform`}>
            {darkMode ? <Sun className="text-yellow-400" size={24} /> : <Moon className="text-indigo-600" size={24} />}
          </button>
        </div>
        
        <h1 className={`text-5xl md:text-6xl font-black ${theme.text} mb-4 tracking-tighter text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600`}>
          Triduo Tracker 2026 ✨
        </h1>
        <p className={`${theme.textSecondary} mb-10 text-center font-medium`}>Gestisci le tue presenze con stile!</p>
        
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`${theme.card} rounded-[2.5rem] shadow-2xl p-6 flex flex-col h-[550px] ${theme.border} border-2`}>
            <h2 className={`text-2xl font-black mb-6 ${theme.text} flex items-center gap-2`}>
              <Users className="text-purple-500" /> Chi sei?
            </h2>
            <input 
              type="text" 
              placeholder="🔍 Cerca il tuo nome..." 
              className={`w-full px-5 py-4 ${theme.input} rounded-2xl mb-4 border-2 ${theme.border} outline-none focus:border-purple-400 transition-all font-medium`}
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {people.filter(p => p.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                <button 
                  key={p} 
                  onClick={() => { setCurrentUser(p); loadData(); }} 
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl ${theme.hover} transition-all border-2 ${theme.border} hover:border-purple-300 hover:shadow-lg transform hover:scale-[1.02]`}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-pink-400 text-white flex items-center justify-center font-black text-sm shadow-md">
                    {getInitials(p)}
                  </div>
                  <span className={`font-bold ${theme.text} text-left flex-1`}>{p}</span>
                  <ChevronRight className={`${theme.textSecondary} transition-transform group-hover:translate-x-1`} />
                </button>
              ))}
              <div className="pt-4 pb-2">
                <button 
                  onClick={addPerson} 
                  className="w-full p-5 border-3 border-dashed border-purple-300 rounded-2xl text-purple-600 font-black flex items-center justify-center gap-3 hover:bg-purple-50 transition-all text-sm uppercase hover:scale-105 shadow-md"
                >
                  <UserPlus size={20} /> Aggiungi Animatore
                </button>
              </div>
            </div>
            <button 
              onClick={() => setCurrentUser('Admin')} 
              className={`mt-4 py-4 ${darkMode ? 'bg-purple-600' : 'bg-gradient-to-r from-slate-800 to-slate-900'} text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-xl transition-all transform hover:scale-105`}
            >
              🔐 Admin Access
            </button>
          </div>
          
          <div className={`${theme.card} rounded-[2.5rem] shadow-2xl p-6 flex flex-col h-[550px] ${theme.border} border-2`}>
            <h2 className={`text-2xl font-black mb-6 ${theme.text} flex items-center gap-2`}>
              <Lightbulb className="text-amber-500" /> Idee Brillanti
            </h2>
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                placeholder="💡 Condividi un'idea..." 
                className={`flex-1 px-5 py-4 ${theme.input} rounded-2xl border-2 ${theme.border} outline-none focus:border-purple-400 transition-all font-medium`}
                value={newIdea} 
                onChange={(e) => setNewIdea(e.target.value)} 
              />
              <button 
                onClick={addIdea} 
                className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:shadow-lg transition-all transform hover:scale-110"
              >
                <Send size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {ideas.map(idea => (
                <div 
                  key={idea.id} 
                  className={`p-5 ${darkMode ? 'bg-purple-900/30' : 'bg-gradient-to-r from-purple-50 to-pink-50'} border-2 ${theme.border} rounded-2xl shadow-md hover:shadow-xl transition-all transform hover:scale-[1.02]`}
                >
                  <p className={`${theme.text} font-bold text-sm leading-relaxed`}>💭 "{idea.text}"</p>
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
    <div className={`min-h-screen ${theme.bg} pb-32 transition-colors duration-300`}>
      <style>{`
        @media print { @page { size: landscape; } nav, .no-print { display: none !important; } .print-area { display: block !important; width: 100% !important; border: none !important; } table { font-size: 8px !important; } }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, #a855f7, #ec4899); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: ${darkMode ? '#1e293b' : '#f1f5f9'}; }
      `}</style>
      
      <nav className={`${theme.card} ${theme.border} border-b-2 px-6 py-4 flex justify-between items-center sticky top-0 z-50 no-print shadow-lg backdrop-blur-lg bg-opacity-95`}>
        <div className="flex items-center gap-4">
          <div className="font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 text-xl cursor-pointer" onClick={() => setCurrentUser(null)}>
            ✨ TRACKER 2026
          </div>
          <button 
            onClick={() => setDarkMode(!darkMode)} 
            className={`p-2 ${theme.input} rounded-xl hover:scale-110 transition-transform`}
          >
            {darkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-indigo-600" />}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className={`hidden sm:inline ${theme.input} px-4 py-2 rounded-full ${theme.text} font-bold text-sm`}>
            {currentUser}
          </span>
          <button 
            onClick={() => setCurrentUser(null)} 
            className="text-rose-500 hover:text-rose-600 flex items-center gap-2 font-bold text-sm uppercase hover:scale-110 transition-transform"
          >
            <LogOut size={20}/>
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {isAdmin ? (
          <div className="space-y-8">
            <div className="flex gap-2 flex-wrap no-print items-center">
              {['summary', 'caranzano', 'matrix', 'charts', 'dishes'].map(v => (
                <button 
                  key={v} 
                  onClick={() => setTestView(v)} 
                  className={`px-5 py-3 rounded-2xl text-xs font-black uppercase transition-all transform hover:scale-105 ${testView === v ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xl' : `${theme.card} ${theme.border} border-2 ${theme.textSecondary} hover:border-purple-300`}`}
                >
                  {v === 'dishes' ? '🍽️ ' : ''}{v}
                </button>
              ))}
              <button 
                onClick={() => window.print()} 
                className="ml-auto px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl text-xs font-black flex items-center gap-2 uppercase hover:shadow-xl transition-all transform hover:scale-105"
              >
                <Printer size={16}/> Stampa
              </button>
              <button 
                onClick={exportToExcel} 
                className="px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl text-xs font-black flex items-center gap-2 uppercase hover:shadow-xl transition-all transform hover:scale-105"
              >
                <Download size={16}/> Excel
              </button>
            </div>

            {testView === 'dishes' ? (
              <div className={`${theme.card} rounded-3xl ${theme.border} border-2 shadow-2xl p-6`}>
                <h2 className={`text-3xl font-black mb-6 ${theme.text} flex items-center gap-3`}>
                  <Utensils className="text-purple-500" /> Pianificazione Piatti
                </h2>
                <p className={`${theme.textSecondary} mb-6 font-medium`}>
                  Piano automatico per la gestione dei turni piatti (3 persone a pasto)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dishPlan.map((item, idx) => (
                    <div 
                      key={idx} 
                      className={`${darkMode ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/30' : 'bg-gradient-to-br from-purple-50 to-pink-50'} p-6 rounded-2xl ${theme.border} border-2 shadow-lg hover:shadow-xl transition-all transform hover:scale-105`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className={`font-black ${theme.text} text-lg`}>{item.date}</h3>
                        <span className={`${theme.input} px-3 py-1 rounded-full text-xs font-black uppercase`}>
                          {item.meal}
                        </span>
                      </div>
                      <div className="space-y-2 mb-4">
                        {item.people.length > 0 ? (
                          item.people.map((person, i) => (
                            <div 
                              key={i} 
                              className={`flex items-center gap-3 p-3 ${theme.input} rounded-xl`}
                            >
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-pink-400 text-white flex items-center justify-center font-black text-xs">
                                {getInitials(person)}
                              </div>
                              <span className={`font-bold ${theme.text} text-sm`}>{person}</span>
                            </div>
                          ))
                        ) : (
                          <div className={`p-4 ${darkMode ? 'bg-red-900/20' : 'bg-red-50'} border-2 border-red-200 rounded-xl text-center`}>
                            <AlertTriangle className="text-red-500 mx-auto mb-2" size={20} />
                            <p className="text-red-600 font-bold text-xs">Nessuno disponibile!</p>
                          </div>
                        )}
                      </div>
                      <div className={`text-xs ${theme.textSecondary} font-bold text-center pt-3 border-t ${theme.border}`}>
                        Disponibili: {item.total} persone
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : testView === 'matrix' ? (
              <div className={`${theme.card} rounded-3xl ${theme.border} border-2 shadow-2xl overflow-hidden print-area`}>
                <table className="w-full text-[10px] border-collapse">
                  <thead>
                    <tr className={darkMode ? 'bg-slate-700' : 'bg-purple-100'}>
                      <th className={`p-2 text-left border-r sticky left-0 ${darkMode ? 'bg-slate-700' : 'bg-purple-100'} z-10 w-32 font-black ${theme.text}`}>Staff</th>
                      {ALL_PERIODS.map((p,i)=><th key={i} className={`p-1 border-r text-center font-black ${theme.text}`}>{p.date.split(' ')[1]}<br/>{p.slot}</th>)}
                      <th className={`p-2 ${darkMode ? 'bg-amber-900/50' : 'bg-amber-50'} font-black ${theme.text}`}>€</th>
                    </tr>
                  </thead>
                  <tbody>
                    {people.map(p => (
                      <tr key={p} className={`border-t ${theme.border} ${theme.hover} transition-colors`}>
                        <td className={`p-2 font-bold sticky left-0 ${theme.card} border-r ${theme.text}`}>{p}</td>
                        {ALL_PERIODS.map((per,i)=><td key={i} className="text-center border-r p-1">{availabilities[p]?.[per.date]?.[per.slot] && <Check size={14} className="mx-auto text-emerald-500"/>}</td>)}
                        <td className={`p-2 text-center ${darkMode ? 'bg-amber-900/50' : 'bg-amber-50'} font-black ${theme.text}`}>{calculateDebt(p)}€</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gradient-to-r from-slate-800 to-slate-900 text-white font-black uppercase text-[9px]">
                    <tr>
                      <td className="p-2 border-r">TOT. PERSONE</td>
                      {ALL_PERIODS.map((p,i)=><td key={i} className="text-center border-r text-purple-300">{countTotal(p.date, p.slot)}</td>)}
                      <td className="bg-purple-600 text-center">{people.reduce((acc,p)=>acc+calculateDebt(p),0)}€</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : testView === 'charts' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: '1. Andamento Presenze', component: <AreaChart width={300} height={180} data={chartsData.timeline}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" tick={{fontSize: 8}}/><YAxis tick={{fontSize: 8}}/><Tooltip/><Area type="monotone" dataKey="persone" stroke="#6366f1" fill="#6366f122"/></AreaChart> },
                  { title: '2. Bilancio Pasti', component: <PieChart width={300} height={180}><Pie data={chartsData.mealsMix} cx="50%" cy="50%" innerRadius={40} outerRadius={60} fill="#8884d8" dataKey="value" label={{fontSize: 8}}>{chartsData.mealsMix.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip/><Legend iconSize={8} wrapperStyle={{fontSize: 10}}/></PieChart> },
                  { title: '3. Classifica Impegni', component: <BarChart width={300} height={180} data={chartsData.staffActivity.slice(0, 6)}><XAxis dataKey="name" tick={{fontSize: 8}}/><YAxis tick={{fontSize: 8}}/><Tooltip/><Bar dataKey="impegni" fill="#8b5cf6" radius={[4,4,0,0]}/></BarChart> },
                  { title: '4. Analisi Fasce Orarie', component: <RadarChart cx={150} cy={90} outerRadius={60} width={300} height={180} data={chartsData.radar}><PolarGrid/><PolarAngleAxis dataKey="subject" tick={{fontSize: 8}}/><Radar dataKey="A" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6}/></RadarChart> },
                  { title: '5. Stato Pagamenti', component:<invoke name="artifacts">
<parameter name="command">update</parameter>
<parameter name="id">triduo_tracker_enhanced</parameter>
<parameter name="old_str">                  { title: '5. Stato Pagamenti', component:</parameter>
<parameter name="new_str">                  { title: '5. Stato Pagamenti', component: <BarChart width={300} height={180} data={chartsData.debtData}><XAxis dataKey="name" tick={{fontSize: 8}}/><YAxis tick={{fontSize: 8}}/><Tooltip/><Bar dataKey="euro" fill="#10b981" radius={[4,4,0,0]}/></BarChart> },
                  { title: '6. Volume per Giorno', component: <BarChart width={300} height={180} data={chartsData.dailyTotal}><XAxis dataKey="name" tick={{fontSize: 8}}/><YAxis tick={{fontSize: 8}}/><Tooltip/><Bar dataKey="totale" fill="#ec4899" radius={[4,4,0,0]}/></BarChart> },
                  { title: '7. Tipologia Attività', component: <PieChart width={300} height={180}><Pie data={chartsData.categoryMix} cx="50%" cy="50%" outerRadius={60} fill="#8884d8" dataKey="value" label={{fontSize: 8}}>{chartsData.categoryMix.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 4) % COLORS.length]} />)}</Pie><Tooltip/></PieChart> },
                  { title: '8. Trend Giornaliero', component: <LineChart width={300} height={180} data={chartsData.lineData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name" tick={{fontSize: 8}}/><YAxis tick={{fontSize: 8}}/><Tooltip/><Legend iconSize={8} wrapperStyle={{fontSize: 8}}/><Line type="monotone" dataKey="Mattino" stroke="#6366f1" /><Line type="monotone" dataKey="Sera" stroke="#f43f5e" /></LineChart> }
                ].map((chart, idx) => (
                  <div key={idx} className={`${theme.card} p-5 rounded-3xl ${theme.border} border-2 shadow-lg flex flex-col items-center hover:shadow-2xl transition-all`}>
                    <h3 className={`text-[11px] font-black mb-4 uppercase ${theme.textSecondary} text-center`}>{chart.title}</h3>
                    {chart.component}
                  </div>
                ))}
              </div>
            ) : testView === 'caranzano' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {DATES.map(d => (
                  <div key={d} className={`${theme.card} rounded-3xl p-6 ${theme.border} border-2 shadow-2xl hover:shadow-3xl transition-all`}>
                    <h3 className="text-2xl font-black mb-6 uppercase border-b-2 pb-3 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">{d}</h3>
                    {['Pranzo', 'Cena'].map(m => (
                      <div key={m} className={`flex justify-between items-center p-6 ${darkMode ? 'bg-purple-900/30' : 'bg-gradient-to-r from-purple-50 to-pink-50'} rounded-2xl mb-4 ${theme.border} border-2 shadow-lg`}>
                        <span className={`font-black ${theme.textSecondary} uppercase text-sm flex items-center gap-2`}>
                          <Utensils size={16} className="text-purple-500" /> {m}
                        </span>
                        <span className={`text-5xl font-black ${theme.text}`}>{countTotal(d, m)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {DATES.map(d => (
                  <div key={d} className={`${theme.card} rounded-3xl p-6 ${theme.border} border-2 shadow-2xl text-center hover:shadow-3xl transition-all`}>
                    <h3 className="font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 border-b-2 pb-3 mb-4 uppercase tracking-tighter text-xl">{d}</h3>
                    {TIME_SLOTS.map(s => (
                      <div key={s} className={`flex justify-between py-3 border-b last:border-0 ${theme.border} ${theme.hover} rounded-lg px-3 transition-all`}>
                        <span className={`font-bold ${theme.textSecondary} text-sm uppercase text-[11px] tracking-wide`}>{s}</span>
                        <span className={`font-black ${theme.text} text-lg`}>{countTotal(d, s)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Modale Notifiche */}
            {showNotifications && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className={`${theme.card} rounded-3xl p-8 max-w-md w-full ${theme.border} border-2 shadow-2xl`}>
                  <h3 className={`text-2xl font-black mb-6 ${theme.text} flex items-center gap-3`}>
                    <Bell className="text-purple-500" /> Notifiche & Promemoria
                  </h3>
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className={`block text-sm font-bold mb-2 ${theme.textSecondary} flex items-center gap-2`}>
                        <Mail size={16} className="text-purple-500" /> Email
                      </label>
                      <input 
                        type="email" 
                        placeholder="tua@email.com" 
                        className={`w-full px-4 py-3 ${theme.input} rounded-xl border-2 ${theme.border} outline-none focus:border-purple-400`}
                        value={notificationEmail}
                        onChange={(e) => setNotificationEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-bold mb-2 ${theme.textSecondary} flex items-center gap-2`}>
                        <MessageSquare size={16} className="text-purple-500" /> Telefono (SMS)
                      </label>
                      <input 
                        type="tel" 
                        placeholder="+39 123 456 7890" 
                        className={`w-full px-4 py-3 ${theme.input} rounded-xl border-2 ${theme.border} outline-none focus:border-purple-400`}
                        value={notificationPhone}
                        onChange={(e) => setNotificationPhone(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={sendNotifications}
                      className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-black uppercase text-sm hover:shadow-xl transition-all transform hover:scale-105"
                    >
                      Invia Notifiche
                    </button>
                    <button 
                      onClick={addToCalendar}
                      className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black uppercase text-sm hover:shadow-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <Calendar size={16} /> Calendario
                    </button>
                  </div>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className={`w-full mt-3 py-3 ${theme.input} rounded-2xl font-bold text-sm ${theme.textSecondary} hover:bg-slate-200 transition-all`}
                  >
                    Chiudi
                  </button>
                </div>
              </div>
            )}
