import './App.css';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Check, LogOut, Printer, ChevronRight, CheckCircle2, UserPlus,
  Lightbulb, Send, Utensils, AlertTriangle, Clock, Activity, 
  PieChart as PieIcon, Moon, Sun, Bell, Download, Calendar, Sparkles, CalendarDays,
  Trash2, Database, Skull, Settings, X
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, RadarChart, 
  PolarGrid, PolarAngleAxis, Radar, PieChart, Pie, Cell, LineChart, Line, Legend, ResponsiveContainer
} from 'recharts';

// --- CONFIGURAZIONE COSTANTI ---
const DATES = ['Gio 2 Apr', 'Ven 3 Apr', 'Sab 4 Apr'];
const TIME_SLOTS = ['Mattino', 'Pranzo', 'Pomeriggio', 'Cena', 'Sera', 'Notte'];
const MEAL_PRICE = 5;
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#4f46e5'];

const DATE_MAP = {
  'Gio 2 Apr': '20260402',
  'Ven 3 Apr': '20260403',
  'Sab 4 Apr': '20260404'
};

const TIME_MAP = {
  'Mattino':    { start: '090000', end: '120000' },
  'Pranzo':     { start: '120000', end: '143000' },
  'Pomeriggio': { start: '143000', end: '190000' },
  'Cena':       { start: '190000', end: '213000' },
  'Sera':       { start: '213000', end: '235900' },
  'Notte':      { start: '000000', end: '080000' }
};

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
  const [visibleChartsCount, setVisibleChartsCount] = useState(0);

  // --- SINCRONIZZAZIONE DATI ---
  const loadData = async () => {
    try {
      const response = await fetch('/api/get-data');
      if (response.ok) {
        const result = await response.json();
        if (result) {
          setAvailabilities(result.availabilities || {});
          setIdeas(result.ideas || []);
          if (result.people && result.people.length > 0) setPeople(result.people);
        }
      }
    } catch (e) { 
      // Ignora errori in locale
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (!currentUser) loadData(); 
    }, 10000);
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Caricamento Grafici Waterfall
  useEffect(() => {
    if (testView === 'charts') {
      setVisibleChartsCount(0);
      const interval = setInterval(() => {
        setVisibleChartsCount(prev => {
          if (prev < 8) return prev + 1;
          clearInterval(interval);
          return prev;
        });
      }, 300);
      return () => clearInterval(interval);
    }
  }, [testView]);

  // --- SALVATAGGIO ---
  const persistToCloud = async (updatedData) => {
    setIsSaving(true);
    try {
      await fetch('/api/save-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: updatedData }),
      });
    } catch (e) { console.error("Errore salvataggio", e); }
    setIsSaving(false);
  };

  const handleFinalSave = async () => {
    await persistToCloud({ availabilities, ideas, people });
    setCurrentUser(null);
    setSearchTerm("");
  };

  // --- AZIONI DATABASE (TEST & RESET) ---
  const handleResetData = async () => {
    if (confirm("ATTENZIONE ESTREMA:\n\nStai per cancellare TUTTI i dati (presenze e idee) definitivamente.\nQuesta azione non è reversibile.\n\nSei sicuro di voler procedere?")) {
      const emptyData = { availabilities: {}, ideas: [], people: INITIAL_PEOPLE };
      setAvailabilities({});
      setIdeas([]);
      setPeople(INITIAL_PEOPLE);
      await persistToCloud(emptyData);
      alert("Database resettato con successo.");
    }
  };

  const handleGenerateRandomData = async () => {
    if (confirm("Questa azione SOVRASCRIVERÀ le selezioni attuali con dati casuali per testare i grafici.\n\nVuoi continuare?")) {
      const newAvail = {};
      people.forEach(person => {
        newAvail[person] = {};
        DATES.forEach(d => {
          newAvail[person][d] = {};
          TIME_SLOTS.forEach(s => {
            if (Math.random() > 0.7) {
              newAvail[person][d][s] = true;
            }
          });
        });
      });
      setAvailabilities(newAvail);
      await persistToCloud({ availabilities: newAvail, ideas, people });
      alert("Dati di test generati!");
    }
  };

  // --- AZIONI UTENTE ---
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

  // --- NUOVA FUNZIONE: CANCELLA IDEA ---
  const deleteIdea = async (id) => {
    if (confirm("Vuoi davvero cancellare questa idea?")) {
      const updatedIdeas = ideas.filter(idea => idea.id !== id);
      setIdeas(updatedIdeas);
      await persistToCloud({ availabilities, ideas: updatedIdeas, people });
    }
  };

  const toggleAvailability = (date, slot) => {
    setAvailabilities(prev => {
      const userAvail = prev[currentUser] || {};
      const dayAvail = userAvail[date] || {};
      return {
        ...prev,
        [currentUser]: { 
          ...userAvail, 
          [date]: { ...dayAvail, [slot]: !dayAvail[slot] } 
        }
      };
    });
  };

  // --- EXPORT & CALENDAR ---
  const downloadICS = () => {
    let icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//TriduoTracker//IT\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n`;
    const userSlots = availabilities[currentUser] || {};
    let eventCount = 0;
    Object.keys(userSlots).forEach(dateLabel => {
      const slots = userSlots[dateLabel];
      if (!slots) return;
      Object.keys(slots).forEach(slotName => {
        if (slots[slotName]) {
          const dateStr = DATE_MAP[dateLabel];
          const timeData = TIME_MAP[slotName];
          if (dateStr && timeData) {
            eventCount++;
            icsContent += `BEGIN:VEVENT\nSUMMARY:Triduo 2026 - Turno ${slotName}\nDTSTART:${dateStr}T${timeData.start}\nDTEND:${dateStr}T${timeData.end}\nDESCRIPTION:Turno confermato per ${currentUser}.\nLOCATION:Casa Alpina\nSTATUS:CONFIRMED\nEND:VEVENT\n`;
          }
        }
      });
    });
    icsContent += `END:VCALENDAR`;
    if (eventCount === 0) { alert("Nessun turno selezionato!"); return; }
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `Triduo_${currentUser.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click(); document.body.removeChild(link);
  };

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Nome," + ALL_PERIODS.map(p => `${p.date} ${p.slot}`).join(",") + ",Totale Debito\n";
    people.forEach(p => {
      let row = `${p},`;
      row += ALL_PERIODS.map(per => availabilities[p]?.[per.date]?.[per.slot] ? "X" : "").join(",");
      row += `,${calculateDebt(p)}€`;
      csvContent += row + "\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri; link.download = "triduo_report.csv";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  // --- CALCOLI ---
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

  const dishwasherSchedule = useMemo(() => {
    const schedule = [];
    const washCounts = {};
    people.forEach(p => washCounts[p] = 0);
    DATES.forEach(date => {
      ['Pranzo', 'Cena'].forEach(slot => {
        const presentPeople = people.filter(p => availabilities[p]?.[date]?.[slot]);
        const sortedCandidates = [...presentPeople].sort((a, b) => {
          const countDiff = washCounts[a] - washCounts[b];
          if (countDiff !== 0) return countDiff;
          return 0.5 - Math.random();
        });
        const crew = sortedCandidates.slice(0, 3);
        crew.forEach(p => washCounts[p]++);
        schedule.push({ date, slot, crew, totalPresent: presentPeople.length });
      });
    });
    return schedule;
  }, [people, availabilities]);

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

  const themeClasses = darkMode ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-800";
  const cardClasses = darkMode ? "bg-slate-800 border-slate-700 shadow-xl shadow-black/20" : "bg-white border-slate-200 shadow-xl shadow-slate-200/50";
  
  const chartDefinitions = [
    { title: "1. Andamento Presenze", chart: <AreaChart data={chartsData.timeline}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" tick={{fontSize: 8}}/><YAxis tick={{fontSize: 8}}/><Tooltip/><Area type="monotone" dataKey="persone" stroke="#6366f1" fill="#6366f122"/></AreaChart> },
    { title: "2. Bilancio Pasti", chart: <PieChart><Pie data={chartsData.mealsMix} cx="50%" cy="50%" innerRadius={40} outerRadius={60} fill="#8884d8" dataKey="value" label={{fontSize: 8}}>{chartsData.mealsMix.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip/><Legend iconSize={8} wrapperStyle={{fontSize: 10}}/></PieChart> },
    { title: "3. Classifica Impegni", chart: <BarChart data={chartsData.staffActivity.slice(0, 6)}><XAxis dataKey="name" tick={{fontSize: 8}}/><YAxis tick={{fontSize: 8}}/><Tooltip/><Bar dataKey="impegni" fill="#8b5cf6" radius={[4,4,0,0]}/></BarChart> },
    { title: "4. Analisi Fasce Orarie", chart: <RadarChart cx="50%" cy="50%" outerRadius="60%" data={chartsData.radar}><PolarGrid/><PolarAngleAxis dataKey="subject" tick={{fontSize: 8}}/><Radar dataKey="A" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6}/></RadarChart> },
    { title: "5. Stato Pagamenti", chart: <BarChart data={chartsData.debtData}><XAxis dataKey="name" tick={{fontSize: 8}}/><YAxis tick={{fontSize: 8}}/><Tooltip/><Bar dataKey="euro" fill="#10b981" radius={[4,4,0,0]}/></BarChart> },
    { title: "6. Volume per Giorno", chart: <BarChart data={chartsData.dailyTotal}><XAxis dataKey="name" tick={{fontSize: 8}}/><YAxis tick={{fontSize: 8}}/><Tooltip/><Bar dataKey="totale" fill="#ec4899" radius={[4,4,0,0]}/></BarChart> },
    { title: "7. Tipologia Attività", chart: <PieChart><Pie data={chartsData.categoryMix} cx="50%" cy="50%" outerRadius={60} fill="#8884d8" dataKey="value" label={{fontSize: 8}}>{chartsData.categoryMix.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 4) % COLORS.length]} />)}</Pie><Tooltip/></PieChart> },
    { title: "8. Trend Giornaliero", chart: <LineChart data={chartsData.lineData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name" tick={{fontSize: 8}}/><YAxis tick={{fontSize: 8}}/><Tooltip/><Legend iconSize={8} wrapperStyle={{fontSize: 8}}/><Line type="monotone" dataKey="Mattino" stroke="#6366f1" /><Line type="monotone" dataKey="Sera" stroke="#f43f5e" /></LineChart> }
  ];

  if (!currentUser) {
    return (
      <div className={`min-h-screen p-4 flex flex-col items-center justify-center transition-colors duration-300 ${themeClasses}`}>
        <div className="absolute top-4 right-4">
          <button onClick={() => setDarkMode(!darkMode)} className="p-3 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 transition-all">
            {darkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-fuchsia-500 mb-10 tracking-tighter text-center">Triduo Tracker</h1>
        
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`${cardClasses} rounded-[2.5rem] p-6 flex flex-col h-[500px] md:h-[550px] border relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -z-0"></div>
            <h2 className="text-2xl font-black mb-6 z-10">Chi sei?</h2>
            <div className="relative z-10">
               <input type="text" placeholder="Cerca il tuo nome..." className={`w-full px-4 py-3 rounded-2xl mb-4 border outline-none focus:ring-2 ring-indigo-400 transition-all ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-200'}`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar z-10">
              {people.filter(p => p.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                <button key={p} onClick={() => { setCurrentUser(p); loadData(); }} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border ${darkMode ? 'hover:bg-indigo-500/20 border-transparent hover:border-indigo-500/50' : 'hover:bg-indigo-50 border-transparent hover:border-indigo-100'}`}>
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-black text-xs shadow-lg">{getInitials(p)}</div>
                  <span className="font-bold text-lg">{p}</span>
                  <ChevronRight className="ml-auto w-5 h-5 opacity-50" />
                </button>
              ))}
              <div className="pt-4 pb-2">
                <button onClick={addPerson} className={`w-full p-4 border-2 border-dashed rounded-2xl font-black flex items-center justify-center gap-2 transition-all text-sm uppercase ${darkMode ? 'border-slate-600 text-slate-400 hover:bg-slate-700' : 'border-indigo-200 text-indigo-500 hover:bg-indigo-50'}`}>
                  <UserPlus size={18} /> Aggiungi nuovo nome
                </button>
              </div>
            </div>
            <button onClick={() => setCurrentUser('Admin')} className="mt-4 py-3 bg-slate-900 dark:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-80 transition-opacity z-10">Admin Access</button>
          </div>

          <div className={`${cardClasses} rounded-[2.5rem] p-6 flex flex-col h-[500px] md:h-[550px] border relative overflow-hidden`}>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-fuchsia-500/10 rounded-full blur-3xl -z-0"></div>
            <h2 className="text-2xl font-black mb-6 flex items-center gap-2 z-10"><Lightbulb className="text-amber-500" /> Idee</h2>
            <div className="flex gap-2 mb-4 z-10">
              <input type="text" placeholder="Nuova idea..." className={`flex-1 px-4 py-3 rounded-2xl border outline-none ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-200'}`} value={newIdea} onChange={(e) => setNewIdea(e.target.value)} />
              <button onClick={addIdea} className="p-3 bg-indigo-600 text-white rounded-2xl hover:scale-105 transition-transform"><Send size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar z-10">
              {ideas.map(idea => (
                <div key={idea.id} className={`p-4 rounded-2xl shadow-sm border flex justify-between items-center group ${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-indigo-50 border-indigo-100'}`}>
                  <p className="font-bold text-sm leading-tight italic opacity-90">"{idea.text}"</p>
                  <button onClick={() => deleteIdea(idea.id)} className="ml-2 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1" title="Cancella">
                    <Trash2 size={16} />
                  </button>
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
    <div className={`min-h-screen pb-32 transition-colors duration-300 ${themeClasses}`}>
      <style>{`
        @media print { 
          @page { size: landscape; } 
          nav, .no-print { display: none !important; } 
          .print-area { display: block !important; width: 100% !important; border: none !important; } 
          table { font-size: 8px !important; } 
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; }
        * {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif !important;
        }
        svg text {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        }
        .recharts-wrapper {
          margin: 0 auto !important;
        }
        .recharts-surface {
          overflow: visible !important;
        }
      `}</style>
      
      <nav className={`border-b px-6 py-4 flex justify-between items-center sticky top-0 z-50 no-print backdrop-blur-md ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
        <div className="font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-xl cursor-pointer" onClick={() => setCurrentUser(null)}>TRACKER 2026</div>
        <div className="flex items-center gap-4">
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={() => setCurrentUser(null)} className="text-rose-500 flex items-center gap-2 font-bold text-sm uppercase hover:bg-rose-50 dark:hover:bg-rose-900/20 px-3 py-2 rounded-xl transition-all">
            <span className="hidden sm:inline opacity-70 mr-1">{currentUser}</span> 
            <LogOut size={20}/>
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {isAdmin ? (
          <div className="space-y-8">
            <div className="flex gap-2 flex-wrap no-print items-center bg-slate-100 dark:bg-slate-800 p-2 rounded-2xl">
              {['summary', 'caranzano', 'matrix', 'charts', 'dishes', 'database'].map(v => (
                <button key={v} onClick={() => setTestView(v)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${testView === v ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-white dark:hover:bg-slate-700'}`}>{v === 'dishes' ? 'Turni Piatti' : v}</button>
              ))}
              <div className="ml-auto flex gap-2">
                 <button onClick={exportToCSV} className="px-4 py-2 bg-blue-500 text-white rounded-xl text-xs font-black flex items-center gap-2 uppercase hover:bg-blue-600 shadow-md transition-transform active:scale-95"><Download size={16}/> CSV</button>
                 <button onClick={() => window.print()} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-2 uppercase hover:bg-emerald-600 shadow-md transition-transform active:scale-95"><Printer size={16}/> Stampa</button>
              </div>
            </div>

            {/* SEZIONE DATABASE (NUOVA TAB) */}
            {testView === 'database' && (
              <div className="max-w-3xl mx-auto space-y-6">
                 <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900 p-6 rounded-3xl flex items-start gap-4">
                    <div className="bg-amber-100 dark:bg-amber-900 p-3 rounded-2xl text-amber-600 dark:text-amber-300">
                      <Settings size={32}/>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-amber-700 dark:text-amber-400 mb-2">Pannello di Controllo</h3>
                      <p className="text-sm opacity-80 leading-relaxed">Da qui puoi gestire le operazioni delicate sul database. Queste operazioni influenzano tutti gli utenti e non possono essere annullate facilmente. Procedi con cautela.</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button onClick={handleGenerateRandomData} className="group relative overflow-hidden bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-all text-left shadow-lg hover:shadow-indigo-500/20">
                       <div className="flex items-center gap-3 mb-4 text-indigo-500">
                          <Database size={24}/>
                          <span className="font-black uppercase tracking-widest text-xs">Test Mode</span>
                       </div>
                       <h4 className="text-lg font-bold mb-2">Genera Dati Random</h4>
                       <p className="text-xs opacity-60">Riempie il calendario con dati casuali per testare grafici e statistiche. Sovrascrive i dati esistenti.</p>
                       <div className="absolute bottom-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500 font-black text-xs uppercase flex items-center gap-1">Esegui <ChevronRight size={14}/></div>
                    </button>

                    <button onClick={handleResetData} className="group relative overflow-hidden bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 hover:border-red-500 transition-all text-left shadow-lg hover:shadow-red-500/20">
                       <div className="flex items-center gap-3 mb-4 text-red-500">
                          <Skull size={24}/>
                          <span className="font-black uppercase tracking-widest text-xs">Danger Zone</span>
                       </div>
                       <h4 className="text-lg font-bold mb-2">Reset Totale</h4>
                       <p className="text-xs opacity-60">Cancella ogni singola presenza, idea e dato inserito. Riporta l'app allo stato iniziale vuoto.</p>
                       <div className="absolute bottom-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 font-black text-xs uppercase flex items-center gap-1">Distruggi Tutto <Trash2 size={14}/></div>
                    </button>
                 </div>
              </div>
            )}

            {testView === 'matrix' ? (
              <div className={`rounded-3xl border shadow-xl overflow-hidden print-area ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
                <div className="overflow-x-auto">
                <table className="w-full text-[10px] border-collapse">
                  <thead>
                    <tr className={darkMode ? 'bg-slate-900 text-slate-300' : 'bg-slate-100 text-slate-600'}>
                      <th className={`p-3 text-left border-r sticky left-0 z-10 w-32 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>Staff</th>
                      {ALL_PERIODS.map((p,i)=><th key={i} className={`p-2 border-r text-center font-black ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>{p.date.split(' ')[1]}<br/><span className="text-[9px] opacity-70">{p.slot}</span></th>)}
                      <th className="p-3 bg-amber-500/10 text-amber-600">€</th>
                    </tr>
                  </thead>
                  <tbody className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
                    {people.map(p => (
                      <tr key={p} className={`border-t transition-colors ${darkMode ? 'border-slate-700 hover:bg-slate-700' : 'border-slate-100 hover:bg-slate-50'}`}>
                        <td className={`p-2 font-bold sticky left-0 border-r ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>{p}</td>
                        {ALL_PERIODS.map((per,i)=><td key={i} className={`text-center border-r p-1 ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>{availabilities[p]?.[per.date]?.[per.slot] && <Check size={14} className="mx-auto text-emerald-500"/>}</td>)}
                        <td className="p-2 text-center bg-amber-500/5 font-black text-amber-500">{calculateDebt(p)}€</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-indigo-900 text-white font-black uppercase text-[9px]">
                    <tr>
                      <td className="p-3 border-r border-indigo-800">TOT. PRESENZE</td>
                      {ALL_PERIODS.map((p,i)=><td key={i} className="text-center border-r border-indigo-800 text-indigo-300">{countTotal(p.date, p.slot)}</td>)}
                      <td className="bg-indigo-600 text-center">{people.reduce((acc,p)=>acc+calculateDebt(p),0)}€</td>
                    </tr>
                  </tfoot>
                </table>
                </div>
              </div>
            ) : testView === 'charts' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {chartDefinitions.map((c, i) => (
                  <div key={i} className={`${cardClasses} p-4 rounded-3xl border flex flex-col items-center justify-center`} style={{ minHeight: 350 }}>
                    <h3 className="text-[10px] font-black mb-2 uppercase opacity-50 tracking-widest">{c.title}</h3>
                    <div style={{ width: '100%', height: 300 }}>
                      {i <= visibleChartsCount ? (
                        <ResponsiveContainer width="100%" height={300}>
                          {c.chart}
                        </ResponsiveContainer>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center animate-pulse bg-slate-100 dark:bg-slate-700 rounded-2xl">
                          <span className="text-xs font-bold opacity-30">Caricamento...</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : testView === 'dishes' ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {dishwasherSchedule.map((item, idx) => (
                   <div key={idx} className={`${cardClasses} p-6 rounded-3xl border relative overflow-hidden`}>
                      <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={40}/></div>
                      <h3 className="font-black text-lg mb-1">{item.date}</h3>
                      <span className="inline-block px-2 py-1 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 text-xs font-bold uppercase mb-4">{item.slot}</span>
                      
                      {item.crew.length < 3 && (
                         <div className="mb-3 flex items-center gap-2 text-amber-500 text-xs font-bold bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
                            <AlertTriangle size={14} /> Pochi presenti ({item.totalPresent})
                         </div>
                      )}

                      <div className="space-y-2">
                        <div className="text-[10px] uppercase font-bold opacity-50 tracking-widest">Squadra lavaggio</div>
                        {item.crew.map(p => (
                          <div key={p} className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 text-white flex items-center justify-center text-[9px] font-black">{getInitials(p)}</div>
                             <span className="font-bold text-sm">{p}</span>
                          </div>
                        ))}
                         {item.crew.length === 0 && <span className="text-sm italic opacity-50">Nessuno disponibile</span>}
                      </div>
                   </div>
                 ))}
               </div>
            ) : testView === 'caranzano' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {DATES.map(d => (
                  <div key={d} className={`${cardClasses} rounded-3xl p-6 border`}>
                    <h3 className="text-xl font-black mb-6 uppercase border-b pb-2 border-indigo-100 text-indigo-500">{d}</h3>
                    {['Pranzo', 'Cena'].map(m => (
                      <div key={m} className={`flex justify-between items-center p-5 rounded-[1.5rem] mb-3 shadow-inner ${darkMode ? 'bg-slate-900' : 'bg-slate-50 border border-slate-100'}`}>
                        <span className="font-black opacity-50 uppercase text-xs">{m}</span>
                        <span className="text-4xl font-black">{countTotal(d, m)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : testView === 'summary' && (
              // SUMMARY VIEW
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {DATES.map(d => (
                  <div key={d} className={`${cardClasses} rounded-3xl p-6 border text-center`}>
                    <h3 className="font-black text-indigo-500 border-b pb-2 mb-4 uppercase text-center tracking-tighter border-indigo-100/20">{d}</h3>
                    {TIME_SLOTS.map(s => (
                      <div key={s} className={`flex justify-between py-2 border-b last:border-0 ${darkMode ? 'border-slate-700' : 'border-slate-50'}`}>
                        <span className="font-bold opacity-60 text-[10px] uppercase tracking-wide">{s}</span>
                        <span className="font-black">{countTotal(d, s)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 max-w-md mx-auto">
            {/* BOX COSTI RIEPILOGO */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[2.5rem] text-white flex justify-between items-center shadow-2xl relative overflow-hidden transform transition-all hover:scale-[1.01]">
              <div className="relative z-10">
                <h2 className="text-2xl font-black uppercase tracking-tight">Ciao, <br/>{currentUser.split(' ')[0]}</h2>
                <p className="opacity-80 font-medium text-xs mt-1">Triduo 2026</p>
              </div>
              <div className="text-right bg-white/10 backdrop-blur-md p-4 rounded-[2rem] border border-white/20 relative z-10 shadow-lg min-w-[120px]">
                <div className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">Da Versare</div>
                <div className="text-3xl font-black">{calculateDebt(currentUser)}€</div>
              </div>
              <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute bottom-[-20px] left-[-20px] w-32 h-32 bg-fuchsia-500/20 rounded-full blur-2xl"></div>
            </div>

             {/* NOTIFICHE & CALENDARIO UNIFICATI */}
             <div className="grid grid-cols-1 gap-3">
                 <button onClick={downloadICS} className={`p-4 rounded-2xl border flex items-center justify-center gap-4 transition-all ${darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-slate-100 hover:bg-slate-50'} shadow-sm`}>
                    <CalendarDays className="text-fuchsia-500" size={28}/>
                    <div className="text-left">
                       <div className="font-black uppercase text-sm">Aggiungi al Calendario</div>
                       <div className="text-[10px] opacity-60">Scarica i tuoi turni e importali (Google/Apple)</div>
                    </div>
                 </button>
             </div>

            <div className="space-y-4">
              {DATES.map(d => (
                <div key={d} className={`${cardClasses} p-5 rounded-[2rem] border`}>
                  <div className="font-black mb-4 text-center border-b pb-3 border-slate-100 dark:border-slate-700 text-indigo-500 uppercase tracking-widest text-sm">{d}</div>
                  <div className="grid grid-cols-2 gap-3">
                    {TIME_SLOTS.map(s => {
                      const active = availabilities[currentUser]?.[d]?.[s];
                      const isMeal = ['Pranzo', 'Cena'].includes(s);
                      return (
                        <button key={s} onClick={() => toggleAvailability(d, s)} className={`relative py-4 rounded-xl font-black uppercase transition-all flex flex-col items-center justify-center border-2 ${active ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/30' : `bg-transparent ${darkMode ? 'border-slate-700 text-slate-400 hover:border-slate-600' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}`}>
                          <div className="flex items-center gap-1 mb-1">
                             {isMeal ? <Utensils size={14}/> : <Clock size={14}/>}
                             {active && <CheckCircle2 size={14}/>}
                          </div>
                          <span className="text-[10px] tracking-wide">{s}</span>
                          {isMeal && !active && <span className="absolute top-1 right-1 text-[8px] bg-emerald-100 text-emerald-600 px-1 rounded font-bold">+5€</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="fixed bottom-6 left-0 right-0 p-4 flex justify-center z-50 no-print pointer-events-none">
              <button onClick={handleFinalSave} disabled={isSaving} className="pointer-events-auto w-full max-w-xs bg-slate-900 dark:bg-white dark:text-black text-white py-4 rounded-[2rem] font-black text-lg shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 border-4 border-white/20 dark:border-black/10 backdrop-blur-md">
                {isSaving ? <Activity className="animate-spin" /> : <><Check size={24}/> SALVA TUTTO</>}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
