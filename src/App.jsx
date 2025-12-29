import './App.css';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Check, LogOut, Search, Printer, ChevronRight, CheckCircle2, UserPlus,
  Lightbulb, Send, Utensils, AlertTriangle, Clock, Wallet, TrendingUp
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, ResponsiveContainer
} from 'recharts';

const DATES = ['Gio 2 Apr', 'Ven 3 Apr', 'Sab 4 Apr'];
const TIME_SLOTS = ['Mattino', 'Pranzo', 'Pomeriggio', 'Cena', 'Sera', 'Notte'];
const MEAL_PRICE = 5;
const INITIAL_PEOPLE = ['Catteo Casetta', 'Laura Casetta', 'Arianna Aloi', 'Aloi Beatrice', 'Lorenzo Trucco 04', 'Lorenzo Trucco 08', 'Simone Cavaglià', 'Simone Casetta', 'Gloria Romano', 'Vittoria Pelassa'].sort();

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

  const loadData = async () => {
    try {
      const response = await fetch('/api/get-data');
      const result = await response.json();
      if (result) {
        setAvailabilities(result.availabilities || {});
        setIdeas(result.ideas || []);
        if (result.people && result.people.length > 0) setPeople(result.people);
      }
    } catch (e) { console.error("Errore caricamento"); }
  };

  // Carica i dati all'avvio e ogni 10 secondi, ma solo se NON siamo loggati (per non sovrascrivere)
  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (!currentUser) loadData();
    }, 10000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const persistToCloud = async (overrideData = null) => {
    setIsSaving(true);
    const dataToSend = overrideData || { availabilities, ideas, people };
    try {
      await fetch('/api/save-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: dataToSend }),
      });
    } catch (e) { alert("Errore nel salvataggio!"); }
    setIsSaving(false);
  };

  const handleFinalSave = async () => {
    await persistToCloud();
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

  // UTILITY
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
  const countTotal = (date, slot) => people.filter(p => availabilities[p]?.[date]?.[slot] === true).length;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 flex flex-col items-center justify-center">
        <h1 className="text-4xl font-black text-indigo-900 mb-10">Triduo 2026</h1>
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-[2.5rem] shadow-xl p-6 flex flex-col h-[550px] border">
            <h2 className="text-xl font-black mb-6">Accedi</h2>
            <input type="text" placeholder="Cerca nome..." className="w-full px-4 py-3 bg-slate-50 rounded-2xl mb-4 border outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <div className="flex-1 overflow-y-auto space-y-1">
              {filteredPeople.map(p => (
                <button key={p} onClick={() => { setCurrentUser(p); loadData(); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 transition-all">
                  <div className="w-12 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-[10px]">{getInitials(p)}</div>
                  <span className="font-bold text-slate-700">{p}</span>
                  <ChevronRight className="ml-auto w-4 h-4 text-slate-300" />
                </button>
              ))}
              {filteredPeople.length === 0 && (
                <button onClick={addPerson} className="w-full p-6 border-2 border-dashed rounded-2xl text-indigo-500 font-bold">Non trovi il tuo nome? Aggiungilo</button>
              )}
            </div>
            <button onClick={() => setCurrentUser('Admin')} className="mt-4 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase">Admin</button>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-xl p-6 flex flex-col h-[550px] border">
            <h2 className="text-xl font-black mb-6">Idee</h2>
            <div className="flex gap-2 mb-4">
              <input type="text" placeholder="Nuova idea..." className="flex-1 px-4 py-3 bg-slate-50 rounded-2xl border outline-none" value={newIdea} onChange={(e) => setNewIdea(e.target.value)} />
              <button onClick={addIdea} className="p-3 bg-indigo-600 text-white rounded-2xl"><Send size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {ideas.map(idea => (
                <div key={idea.id} className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <p className="text-slate-700 font-bold text-sm">"{idea.text}"</p>
                  <div className="text-[10px] font-black text-indigo-400 uppercase">— {idea.author}</div>
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
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="font-black text-indigo-600 text-xl" onClick={() => setCurrentUser(null)}>TRACKER 2026</div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold">{currentUser}</span>
          <button onClick={() => setCurrentUser(null)} className="text-rose-500"><LogOut /></button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4">
        {isAdmin ? (
          <div className="space-y-6">
            <div className="flex gap-2 flex-wrap no-print">
              {['summary', 'matrix', 'charts'].map(v => (
                <button key={v} onClick={() => setTestView(v)} className={`px-6 py-2 rounded-xl text-xs font-black uppercase ${testView === v ? 'bg-indigo-600 text-white' : 'bg-white border'}`}>{v}</button>
              ))}
              <button onClick={() => window.print()} className="ml-auto px-6 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase flex items-center gap-2"><Printer size={16}/> Stampa Matrix</button>
            </div>

            {testView === 'matrix' ? (
              <div className="bg-white rounded-3xl border shadow-xl overflow-hidden print-area">
                <table className="w-full text-[10px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="p-2 text-left border-r sticky left-0 bg-slate-100 w-32">Staff</th>
                      {ALL_PERIODS.map((p,i)=><th key={i} className="p-1 border-r text-center font-black">{p.date.split(' ')[1]}<br/>{p.slot}</th>)}
                      <th className="p-2 text-center bg-amber-50">EURO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {people.map(p => (
                      <tr key={p} className="border-b">
                        <td className="p-2 font-bold sticky left-0 bg-white border-r">{p}</td>
                        {ALL_PERIODS.map((per,i)=><td key={i} className="text-center border-r">{availabilities[p]?.[per.date]?.[per.slot] && <Check size={14} className="mx-auto text-emerald-500"/>}</td>)}
                        <td className="p-2 text-center bg-amber-50 font-black">{calculateDebt(p)}€</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-indigo-900 text-white font-black">
                    <tr>
                      <td className="p-2 border-r">TOT. PERSONE</td>
                      {ALL_PERIODS.map((p,i)=><td key={i} className="text-center border-r">{countTotal(p.date, p.slot)}</td>)}
                      <td>{people.reduce((acc,p)=>acc+calculateDebt(p),0)}€</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : testView === 'charts' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px]">
                <div className="bg-white p-6 rounded-3xl border"><h3 className="font-black mb-4">AFFLUENZA</h3>
                  <ResponsiveContainer><AreaChart data={ALL_PERIODS.map(p=>({name: p.slot[0], val: countTotal(p.date, p.slot)}))}><Area dataKey="val" fill="#6366f1"/></AreaChart></ResponsiveContainer>
                </div>
                <div className="bg-white p-6 rounded-3xl border"><h3 className="font-black mb-4">DEBITI (€)</h3>
                  <ResponsiveContainer><BarChart data={people.map(p=>({name: p.split(' ')[0], val: calculateDebt(p)}))}><XAxis dataKey="name"/><Bar dataKey="val" fill="#10b981"/></BarChart></ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {DATES.map(d => (
                  <div key={d} className="bg-white p-6 rounded-3xl border shadow-sm">
                    <h3 className="text-xl font-black mb-4 uppercase text-indigo-600 border-b pb-2">{d}</h3>
                    {TIME_SLOTS.map(s => (
                      <div key={s} className="flex justify-between p-3 bg-slate-50 rounded-xl mb-2">
                        <span className="font-bold">{s}</span>
                        <span className="text-2xl font-black">{countTotal(d, s)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white flex justify-between items-center shadow-xl">
              <div><h2 className="text-2xl font-black uppercase">Ciao, {currentUser}</h2><p>Le tue presenze per il Triduo</p></div>
              <div className="text-right"><div className="text-[10px] font-black uppercase opacity-60">Da pagare</div><div className="text-3xl font-black">{calculateDebt(currentUser)}€</div></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {DATES.map(d => (
                <div key={d} className="bg-white p-6 rounded-3xl border shadow-sm">
                  <div className="font-black mb-4 text-center border-b pb-2 text-indigo-600">{d}</div>
                  <div className="space-y-2">
                    {TIME_SLOTS.map(s => {
                      const active = availabilities[currentUser]?.[d]?.[s];
                      return (
                        <button key={s} onClick={() => toggleAvailability(d, s)} className={`w-full py-4 rounded-2xl font-black uppercase transition-all flex items-center justify-center gap-2 border-2 ${active ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-white border-slate-100 text-slate-300'}`}>
                          {['Pranzo','Cena'].includes(s) ? <Utensils size={16}/> : <Clock size={16}/>} {s} {active && <CheckCircle2 size={18}/>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="fixed bottom-6 left-0 right-0 p-4 flex justify-center z-50">
              <button onClick={handleFinalSave} disabled={isSaving} className="w-full max-w-md bg-slate-900 text-white py-6 rounded-3xl font-black text-xl shadow-2xl hover:scale-105 active:scale-95 transition-all">
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