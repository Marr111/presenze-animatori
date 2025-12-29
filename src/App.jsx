import './App.css';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Check, LogOut, Search, Printer, ChevronRight, CheckCircle2, UserPlus,
  Lightbulb, Send, Utensils, AlertTriangle, Clock, Wallet, TrendingUp, Activity
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';

const DATES = ['Gio 2 Apr', 'Ven 3 Apr', 'Sab 4 Apr'];
const TIME_SLOTS = ['Mattino', 'Pranzo', 'Pomeriggio', 'Cena', 'Sera', 'Notte'];
const MEAL_PRICE = 5;
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
        [date]: { ...prev[currentUser]?.[date], [slot]: !prev[currentUser]?.[date]?.[slot] } 
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

  const chartsData = useMemo(() => {
    const timeline = ALL_PERIODS.map(p => ({ name: `${p.date.split(' ')[1]} ${p.slot[0]}.`, persone: countTotal(p.date, p.slot) }));
    const debtData = people.map(p => ({ name: p.split(' ')[0], euro: calculateDebt(p) })).filter(d => d.euro > 0);
    const radar = TIME_SLOTS.map(s => ({ subject: s, A: DATES.reduce((acc, d) => acc + countTotal(d, s), 0) }));
    return { timeline, debtData, radar };
  }, [availabilities, people]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 flex flex-col items-center justify-center">
        <h1 className="text-4xl font-black text-slate-800 mb-10 tracking-tighter text-center">Triduo Tracker 2026</h1>
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-[2.5rem] shadow-xl p-6 flex flex-col h-[550px] border">
            <h2 className="text-xl font-black mb-6">Chi sei?</h2>
            <input type="text" placeholder="Cerca il tuo nome..." className="w-full px-4 py-3 bg-slate-50 rounded-2xl mb-4 border outline-none focus:border-indigo-400" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            
            <div className="flex-1 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
              {people.filter(p => p.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                <button key={p} onClick={() => { setCurrentUser(p); loadData(); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xs">{getInitials(p)}</div>
                  <span className="font-bold text-slate-700">{p}</span>
                  <ChevronRight className="ml-auto w-4 h-4 text-slate-300" />
                </button>
              ))}
              <div className="pt-4 pb-2">
                <button onClick={addPerson} className="w-full p-4 border-2 border-dashed border-indigo-200 rounded-2xl text-indigo-500 font-black flex items-center justify-center gap-2 hover:bg-indigo-50 transition-all text-sm uppercase">
                  <UserPlus size={18} /> Aggiungi nuovo nome
                </button>
              </div>
            </div>
            <button onClick={() => setCurrentUser('Admin')} className="mt-4 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-colors">Admin Access</button>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-xl p-6 flex flex-col h-[550px] border">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2"><Lightbulb className="text-amber-500" /> Idee e Note</h2>
            <div className="flex gap-2 mb-4">
              <input type="text" placeholder="Scrivi un'idea..." className="flex-1 px-4 py-3 bg-slate-50 rounded-2xl border outline-none focus:border-indigo-400" value={newIdea} onChange={(e) => setNewIdea(e.target.value)} />
              <button onClick={addIdea} className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-colors"><Send size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {ideas.map(idea => (
                <div key={idea.id} className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl shadow-sm">
                  <p className="text-slate-700 font-bold text-sm leading-tight italic">"{idea.text}"</p>
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
        @media print { @page { size: landscape; } nav, .no-print { display: none !important; } .print-area { display: block !important; width: 100% !important; border: none !important; } table { font-size: 8px !important; } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
      
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-50 no-print">
        <div className="font-black text-indigo-600 text-xl cursor-pointer" onClick={() => setCurrentUser(null)}>TRACKER 2026</div>
        <button onClick={() => setCurrentUser(null)} className="text-rose-500 flex items-center gap-2 font-bold text-sm uppercase">
          <span className="hidden sm:inline bg-slate-100 px-3 py-1 rounded-full text-slate-600 mr-2">{currentUser}</span> 
          <LogOut size={20}/>
        </button>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {isAdmin ? (
          <div className="space-y-6">
            <div className="flex gap-2 flex-wrap no-print items-center">
              {['summary', 'caranzano', 'matrix', 'charts'].map(v => (
                <button key={v} onClick={() => setTestView(v)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${testView === v ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border text-slate-400 hover:bg-slate-50'}`}>{v}</button>
              ))}
              <button onClick={() => window.print()} className="ml-auto px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-2 uppercase hover:bg-emerald-600 shadow-md"><Printer size={16}/> Stampa Matrix</button>
            </div>

            {testView === 'matrix' ? (
              <div className="bg-white rounded-3xl border shadow-xl overflow-hidden print-area">
                <table className="w-full text-[10px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="p-2 text-left border-r sticky left-0 bg-slate-100 z-10 w-32">Staff</th>
                      {ALL_PERIODS.map((p,i)=><th key={i} className="p-1 border-r text-center font-black">{p.date.split(' ')[1]}<br/>{p.slot}</th>)}
                      <th className="p-2 bg-amber-50">€</th>
                    </tr>
                  </thead>
                  <tbody>
                    {people.map(p => (
                      <tr key={p} className="border-t hover:bg-slate-50 transition-colors">
                        <td className="p-2 font-bold sticky left-0 bg-white border-r">{p}</td>
                        {ALL_PERIODS.map((per,i)=><td key={i} className="text-center border-r p-1">{availabilities[p]?.[per.date]?.[per.slot] && <Check size={14} className="mx-auto text-emerald-500"/>}</td>)}
                        <td className="p-2 text-center bg-amber-50 font-black">{calculateDebt(p)}€</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-900 text-white font-black uppercase text-[9px]">
                    <tr>
                      <td className="p-2 border-r">TOT. PERSONE</td>
                      {ALL_PERIODS.map((p,i)=><td key={i} className="text-center border-r text-indigo-300">{countTotal(p.date, p.slot)}</td>)}
                      <td className="bg-indigo-600 text-center">{people.reduce((acc,p)=>acc+calculateDebt(p),0)}€</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : testView === 'charts' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="bg-white p-6 rounded-3xl border flex flex-col items-center shadow-sm">
                  <h3 className="text-xs font-black mb-6 uppercase tracking-widest text-slate-400">Affluenza</h3>
                  <AreaChart width={450} height={250} data={chartsData.timeline}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name"/><YAxis/><Tooltip/><Area type="monotone" dataKey="persone" stroke="#6366f1" strokeWidth={3} fill="#6366f122"/>
                  </AreaChart>
                </div>
                <div className="bg-white p-6 rounded-3xl border flex flex-col items-center shadow-sm">
                  <h3 className="text-xs font-black mb-6 uppercase tracking-widest text-slate-400">Debiti (€)</h3>
                  <BarChart width={450} height={250} data={chartsData.debtData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name"/><YAxis/><Tooltip/><Bar dataKey="euro" fill="#10b981" radius={[5,5,0,0]}/>
                  </BarChart>
                </div>
              </div>
            ) : testView === 'caranzano' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {DATES.map(d => (
                  <div key={d} className="bg-white rounded-3xl p-6 border shadow-sm">
                    <h3 className="text-xl font-black mb-6 uppercase border-b pb-2 text-indigo-600">{d}</h3>
                    {['Pranzo', 'Cena'].map(m => (
                      <div key={m} className="flex justify-between items-center p-5 bg-slate-50 rounded-[1.5rem] mb-3 border border-slate-100 shadow-inner">
                        <span className="font-black text-slate-500 uppercase text-xs">{m}</span>
                        <span className="text-4xl font-black text-slate-800">{countTotal(d, m)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {DATES.map(d => (
                  <div key={d} className="bg-white rounded-3xl p-6 border shadow-sm">
                    <h3 className="font-black text-indigo-600 border-b pb-2 mb-4 uppercase text-center tracking-tighter">{d}</h3>
                    {TIME_SLOTS.map(s => (
                      <div key={s} className="flex justify-between py-2 border-b last:border-0 border-slate-50">
                        <span className="font-bold text-slate-500 text-sm uppercase text-[10px] tracking-wide">{s}</span>
                        <span className="font-black text-slate-800">{countTotal(d, s)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* BOX COSTI AGGIORNATO COME DA RICHIESTA */}
            <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white flex justify-between items-center shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-2xl font-black uppercase">Ciao, {currentUser}</h2>
                <p className="opacity-80 font-medium tracking-tight">Inserisci le tue disponibilità per il Triduo</p>
              </div>
              <div className="text-right bg-white/10 backdrop-blur-md p-6 rounded-[2rem] border border-white/20 relative z-10 shadow-lg min-w-[140px]">
                <div className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">Costo Totale</div>
                <div className="text-4xl font-black">{calculateDebt(currentUser)}€</div>
                <div className="text-[9px] font-bold uppercase opacity-80 mt-1">({MEAL_PRICE}€ a pasto)</div>
              </div>
              <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-white/5 rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {DATES.map(d => (
                <div key={d} className="bg-white p-6 rounded-[2rem] border shadow-sm">
                  <div className="font-black mb-6 text-center border-b pb-3 text-indigo-600 uppercase tracking-widest text-sm">{d}</div>
                  <div className="space-y-2">
                    {TIME_SLOTS.map(s => {
                      const active = availabilities[currentUser]?.[d]?.[s];
                      return (
                        <button key={s} onClick={() => toggleAvailability(d, s)} className={`w-full py-5 rounded-[1.2rem] font-black uppercase transition-all flex items-center justify-between px-5 border-2 ${active ? 'bg-emerald-500 border-emerald-400 text-white shadow-md' : 'bg-white border-slate-100 text-slate-300 hover:border-slate-200'}`}>
                          <div className="flex items-center gap-3 text-xs tracking-tight">{['Pranzo','Cena'].includes(s) ? <Utensils size={14}/> : <Clock size={14}/>} {s}</div>
                          {active && <CheckCircle2 size={20}/>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="fixed bottom-6 left-0 right-0 p-4 flex justify-center z-50 no-print">
              <button onClick={handleFinalSave} disabled={isSaving} className="w-full max-w-md bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xl shadow-2xl hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-3 border-4 border-white/10">
                {isSaving ? (
                  <> <Activity className="animate-spin" /> SALVATAGGIO... </>
                ) : (
                  <> SALVA E TORNA ALLA HOME </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;