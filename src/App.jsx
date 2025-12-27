import './App.css';
import React, { useState, useEffect, useMemo } from 'react';
// Importazione icone da lucide-react per un'interfaccia moderna
import { 
  Check, Calendar, Users, LogOut, Search, Printer, Shield,
  Activity, Clock, ChevronRight, CheckCircle2, 
  UserCheck, Lightbulb, Send, Trash2
} from 'lucide-react';

// --- CONFIGURAZIONE COSTANTI ---
const DATES = ['Gio 2 Apr', 'Ven 3 Apr', 'Sab 4 Apr'];
const TIME_SLOTS = ['Mattino', 'Pranzo', 'Pomeriggio', 'Cena', 'Sera', 'Notte'];
const PEOPLE = [
  'Catteo Casetta', 'Laura Casetta', 'Arianna Aloi', 'Aloi Beatrice',
  'Lorenzo Trucco 04', 'Lorenzo Trucco 08', 'Simone Cavaglià', 'Simone Casetta',
  'Gloria Romano', 'Vittoria Pelassa'
].sort();

// Crea una lista piatta di tutti i turni possibili (usata per la Matrice Admin)
const ALL_PERIODS = DATES.flatMap(d => TIME_SLOTS.map(s => ({ date: d, slot: s })));

const App = () => {
  // --- STATO DELL'APPLICAZIONE ---
  const [currentUser, setCurrentUser] = useState(null); // Utente loggato (o 'Admin')
  const [searchTerm, setSearchTerm] = useState("");     // Testo nella barra di ricerca nomi
  const [availabilities, setAvailabilities] = useState({}); // Oggetto con tutte le presenze
  const [ideas, setIdeas] = useState([]);               // Array delle idee per il triduo
  const [newIdea, setNewIdea] = useState("");           // Testo della nuova idea in input
  const [showSuccess, setShowSuccess] = useState(false); // Feedback visivo salvataggio
  const [testView, setTestView] = useState('summary');  // Tab attiva nel pannello Admin
  const [isLoading, setIsLoading] = useState(false);    // Stato caricamento per evitare loop

  // --- EFFETTI (LOAD DATA) ---
  // Carica i dati all'avvio e imposta un refresh automatico ogni 5 secondi
  useEffect(() => {
    const loadData = async () => {
      if (isLoading) return;
      setIsLoading(true);
      try {
        let data;
        // Supporto per window.storage (ambiente Replit/WebContainer) o LocalStorage standard
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
      } catch (e) {
        console.error("Errore caricamento:", e);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  // --- LOGICA DI SALVATAGGIO ---
  const saveData = async (key, newData) => {
    try {
      if (window.storage) {
        await window.storage.set(key, JSON.stringify(newData), true);
      } else {
        localStorage.setItem(key, JSON.stringify(newData));
      }
    } catch (e) { console.error("Errore salvataggio:", e); }
  };

  // --- GESTIONE IDEE ---
  const addIdea = async () => {
    if (!newIdea.trim()) return;
    const updatedIdeas = [...ideas, { 
      id: Date.now(), 
      text: newIdea, 
      author: currentUser || 'Anonimo' 
    }];
    setIdeas(updatedIdeas);
    setNewIdea("");
    await saveData('triduo_ideas', updatedIdeas);
  };

  const deleteIdea = async (id) => {
    const updatedIdeas = ideas.filter(i => i.id !== id);
    setIdeas(updatedIdeas);
    await saveData('triduo_ideas', updatedIdeas);
  };

  // --- GESTIONE DISPONIBILITÀ ---
  // Alterna lo stato tra presente (true) e nullo (null)
  const toggleAvailability = async (date, slot) => {
    if (!currentUser || currentUser === 'Admin' || isLoading) return;
    const current = availabilities[currentUser]?.[date]?.[slot];
    const newValue = current === true ? null : true;
    
    // Aggiornamento immutabile dell'oggetto delle disponibilità
    const updated = {
      ...availabilities,
      [currentUser]: { 
        ...availabilities[currentUser], 
        [date]: { ...availabilities[currentUser]?.[date], [slot]: newValue } 
      }
    };
    setAvailabilities(updated);
    await saveData('availabilities_shared', updated);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000); // Nasconde il feedback dopo 2 secondi
  };

  // --- HELPER FUNCTIONS ---
  // Conta quante persone sono presenti in un determinato slot
  const countTotal = (date, slot) => PEOPLE.filter(p => availabilities[p]?.[date]?.[slot] === true).length;
  
  // Filtra i nomi in base alla ricerca (case-insensitive)
  const filteredPeople = useMemo(() => 
    PEOPLE.filter(p => p.toLowerCase().includes(searchTerm.toLowerCase())), 
    [searchTerm]
  );
  
  // Genera le iniziali (es: "Mario Rossi" -> "MR")
  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  // --- VISTA DI LOGIN E BACHECA IDEE ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex flex-col items-center justify-center">
        {/* Header Principale */}
        <div className="text-center space-y-2 mb-10">
           <div className="inline-flex p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100 mb-2 text-white">
              <Users size={28} />
           </div>
           <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none">Staff Portal</h1>
           <p className="text-slate-500 font-medium">Benvenuti al Triduo 2026</p>
        </div>

        {/* Layout a due colonne (Login e Idee) */}
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          
          {/* BOX LOGIN: Selezione utente */}
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-6 flex flex-col h-[550px]">
            <div className="flex items-center gap-3 mb-6">
               <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Search size={20} />
               </div>
               <h2 className="text-xl font-black text-slate-800">Accedi</h2>
            </div>
            
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Cerca il tuo nome..." className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium outline-none text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {filteredPeople.map(p => (
                <button key={p} onClick={() => setCurrentUser(p)} className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-indigo-50 transition-all group border border-transparent hover:border-indigo-100">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    {getInitials(p)}
                  </div>
                  <span className="font-bold text-slate-700 text-sm">{p}</span>
                  <ChevronRight className="ml-auto w-4 h-4 text-slate-300 group-hover:text-indigo-500" />
                </button>
              ))}
            </div>

            {/* Accesso al Pannello Admin */}
            <button onClick={() => setCurrentUser('Admin')} className="mt-4 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all font-bold text-xs">
              <Shield size={14} /> Pannello Admin
            </button>
          </div>

          {/* BOX IDEE: Bacheca suggerimenti */}
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-6 flex flex-col h-[550px]">
            <div className="flex items-center gap-3 mb-6">
               <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <Lightbulb size={20} />
               </div>
               <h2 className="text-xl font-black text-slate-800">Idee Triduo</h2>
            </div>

            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                placeholder="Nuova idea..." 
                className="flex-1 px-4 py-3.5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-amber-500 font-medium outline-none text-sm"
                value={newIdea}
                onChange={(e) => setNewIdea(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addIdea()}
              />
              <button onClick={addIdea} className="p-3.5 bg-amber-500 text-white rounded-2xl hover:bg-amber-600 transition-all">
                <Send size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {ideas.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-2 opacity-50">
                  <Lightbulb size={32} />
                  <p className="text-xs font-bold uppercase tracking-widest">Nessun suggerimento</p>
                </div>
              ) : (
                [...ideas].reverse().map(idea => (
                  <div key={idea.id} className="group p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white hover:border-amber-200 transition-all">
                    <p className="text-slate-700 font-bold text-sm leading-tight">{idea.text}</p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Da: {idea.author}</span>
                      <button onClick={() => deleteIdea(idea.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    );
  }

  // --- INTERFACCIA APP PRINCIPALE (DOPO LOGIN) ---
  const isAdmin = currentUser === 'Admin';
  
  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Definizione stili CSS per la stampa */}
      <style>
        {`@media print { nav, button, .no-print, .fixed { display: none !important; } body { background: white !important; } table { border-collapse: collapse !important; width: 100% !important; } th, td { border: 1px solid #000 !important; padding: 4px !important; } }`}
      </style>

      {/* Navbar superiore */}
      <nav className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4 no-print">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3" onClick={() => setCurrentUser(null)} style={{cursor: 'pointer'}}>
            <div className="p-2 bg-indigo-600 rounded-xl"><Activity className="w-5 h-5 text-white" /></div>
            <span className="font-black text-slate-800 text-lg uppercase">Tracker 2026</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-slate-600">{currentUser}</span>
            <button onClick={() => setCurrentUser(null)} className="p-2 bg-white shadow-sm rounded-xl text-rose-500 border border-slate-100"><LogOut size={20} /></button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 sm:p-8">
        {isAdmin ? (
          /* --- SEZIONE AMMINISTRATORE --- */
          <div className="space-y-6">
            <div className="flex justify-between items-center no-print">
              {/* Menu navigazione Admin */}
              <div className="inline-flex bg-slate-200/50 p-1.5 rounded-2xl">
                {['summary', 'caranzano', 'matrix'].map(v => (
                  <button key={v} onClick={() => setTestView(v)} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all uppercase ${testView === v ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
                    {v === 'summary' ? 'Tabella' : v === 'caranzano' ? 'Pasti' : 'Matrice'}
                  </button>
                ))}
              </div>
              <button onClick={() => window.print()} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-100"><Printer size={20} /> Stampa</button>
            </div>

            {/* Sotto-vista: Matrice dei Nomi (Chi c'è quando) */}
            {testView === 'matrix' ? (
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-slate-50"><th className="p-3 text-left border-r sticky left-0 bg-white">Persona</th>{ALL_PERIODS.map((p,i)=>(<th key={i} className={`p-2 text-center text-[10px] min-w-[60px] border-b ${p.slot==='Mattino'?'border-l-2':''}`}><div className="font-bold">{p.date.split(' ')[1]}</div><div className="text-slate-400">{p.slot}</div></th>))}</tr></thead>
                  <tbody>{PEOPLE.map(person => (<tr key={person} className="hover:bg-slate-50"><td className="p-3 font-bold border-r sticky left-0 bg-white">{person}</td>{ALL_PERIODS.map((p,i)=>(<td key={i} className={`p-2 text-center border-b ${p.slot==='Mattino'?'border-l-2':''}`}>{availabilities[person]?.[p.date]?.[p.slot] === true ? <Check size={16} className="mx-auto text-emerald-500" /> : <span className="text-slate-100">-</span>}</td>))}</tr>))}</tbody>
                </table>
              </div>
            ) : testView === 'caranzano' ? (
               /* Sotto-vista: Conteggio Pasti per cucina */
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {DATES.map(d => (
                 <div key={d} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
                   <h3 className="text-xl font-black text-slate-800 border-b pb-4 mb-4">{d}</h3>
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
              /* Sotto-vista: Tabella riassuntiva numerica */
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden p-6">
                <table className="w-full">
                  <thead><tr className="bg-slate-50"><th className="p-4 text-left font-black">Fascia</th>{DATES.map(d=><th key={d} className="p-4 text-center font-black">{d}</th>)}</tr></thead>
                  <tbody>{TIME_SLOTS.map(s=>(<tr key={s} className="border-t"><td>{s}</td>{DATES.map(d=><td key={d} className="text-center font-black text-indigo-600"><UserCheck className="inline mr-1" size={16}/>{countTotal(d,s)}</td>)}</tr>))}</tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* --- SEZIONE UTENTE (CALENDARIO PERSONALE) --- */
          <div className="space-y-6">
            <div className="px-2">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Le tue disponibilità</h2>
              <p className="text-slate-500 font-medium italic">Seleziona quando sarai presente</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {DATES.map(d => (
                <div key={d} className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-3 border-b pb-4">
                    <Calendar className="text-indigo-600" />
                    <span className="text-xl font-black">{d}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {TIME_SLOTS.map(s => {
                      const val = availabilities[currentUser]?.[d]?.[s];
                      return (
                        <button 
                          key={s} 
                          onClick={() => toggleAvailability(d, s)} 
                          className={`h-20 rounded-2xl flex flex-col items-center justify-center transition-all border-2 ${val === true ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-100' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                        >
                          {val === true ? <Check size={20} /> : <Clock size={16} className="opacity-20" />}
                          <span className="text-[10px] font-black uppercase">{s}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottone di uscita fisso in basso */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-lg border-t flex justify-center z-50">
              <button 
                onClick={() => { window.scrollTo(0,0); setCurrentUser(null); }} 
                className="max-w-md w-full bg-slate-900 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95"
              >
                <CheckCircle2 className="text-emerald-400" /> SALVA E ESCI
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;