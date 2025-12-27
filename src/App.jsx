import './App.css';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Check, Calendar, Users, LogOut, Search,
  BarChart3, PieChart, Activity, Clock, Info, ChevronRight,
  Utensils, CheckCircle2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart as RePieChart, Pie, Cell 
} from 'recharts';

// CONFIGURAZIONE AGGIORNATA
const DATES = ['Gio 2 Apr', 'Ven 3 Apr', 'Sab 4 Apr'];
const TIME_SLOTS = ['Mattino', 'Pranzo', 'Pomeriggio', 'Cena', 'Sera', 'Notte'];
const PEOPLE = [
  'Mario Rossi', 'Luigi Bianchi', 'Anna Verdi', 'Paolo Neri',
  'Giulia Romano', 'Marco Ferrari', 'Sara Colombo', 'Andrea Ricci',
  'Francesca Marino', 'Roberto Greco', 'Test'
].sort();

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [availabilities, setAvailabilities] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [testView, setTestView] = useState('summary'); 
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (isLoading) return;
      setIsLoading(true);
      try {
        let data;
        if (window.storage) {
          const result = await window.storage.get('availabilities_v2', true);
          data = result?.value ? JSON.parse(result.value) : {};
        } else {
          const saved = localStorage.getItem('availabilities_v2');
          data = saved ? JSON.parse(saved) : {};
        }
        setAvailabilities(data);
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

  const saveData = async (newData) => {
    try {
      if (window.storage) {
        await window.storage.set('availabilities_v2', JSON.stringify(newData), true);
      } else {
        localStorage.setItem('availabilities_v2', JSON.stringify(newData));
      }
    } catch (e) {
      console.error("Errore salvataggio:", e);
    }
  };

  const toggleAvailability = async (date, slot) => {
    if (!currentUser || currentUser === 'Test' || isLoading) return;
    
    // Logica semplificata: solo Presente (true) o Nullo (null)
    const current = availabilities[currentUser]?.[date]?.[slot];
    const newValue = current === true ? null : true;

    const updated = {
      ...availabilities,
      [currentUser]: {
        ...availabilities[currentUser],
        [date]: { ...availabilities[currentUser]?.[date], [slot]: newValue }
      }
    };

    setAvailabilities(updated);
    await saveData(updated);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const countTotal = (date, slot) => 
    PEOPLE.filter(p => p !== 'Test' && availabilities[p]?.[date]?.[slot] === true).length;

  const filteredPeople = useMemo(() => 
    PEOPLE.filter(p => p.toLowerCase().includes(searchTerm.toLowerCase())),
    [searchTerm]
  );

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  // LOGIN VIEW
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4">
          <div className="text-center space-y-2 mb-8">
             <div className="inline-flex p-4 bg-indigo-600 rounded-3xl shadow-lg shadow-indigo-200 mb-2">
                <Users className="w-8 h-8 text-white" />
             </div>
             <h1 className="text-3xl font-black text-slate-800 tracking-tight">Staff Portal</h1>
             <p className="text-slate-500 font-medium">Cerca il tuo nome per iniziare</p>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Scrivi qui il tuo nome..."
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {filteredPeople.map(p => (
                <button key={p} onClick={() => { setCurrentUser(p); setSearchTerm(""); }}
                  className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-indigo-50 transition-all group border border-transparent hover:border-indigo-100">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    {getInitials(p)}
                  </div>
                  <span className="font-bold text-slate-700 group-hover:text-indigo-700 flex-1 text-left">{p}</span>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500" />
                </button>
              ))}
              {filteredPeople.length === 0 && (
                <p className="text-center py-4 text-slate-400 text-sm">Nessun nome trovato</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isTest = currentUser === 'Test';

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <nav className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-md shadow-indigo-100">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-slate-800 tracking-tight text-lg uppercase">Tracker 2026</span>
          </div>
          <div className="flex items-center gap-4 bg-slate-100/50 p-1.5 pl-4 rounded-2xl border border-slate-200/50">
            <span className="text-sm font-bold text-slate-600">{currentUser}</span>
            <button onClick={() => setCurrentUser(null)} className="p-2 bg-white shadow-sm rounded-xl text-rose-500 hover:text-rose-600 transition-colors border border-slate-100">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-4 sm:p-8 space-y-8">
        {showSuccess && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-300">
            <div className="bg-emerald-500 rounded-full p-1"><Check className="w-4 h-4" /></div>
            <span className="font-bold text-sm tracking-wide uppercase">Sincronizzato</span>
          </div>
        )}

        {isTest ? (
          /* ADMIN VIEW */
          <>
            <div className="flex justify-center mb-8">
              <div className="inline-flex bg-slate-200/50 p-1.5 rounded-2xl border border-slate-200">
                {[
                  { id: 'summary', label: 'Tabella' },
                  { id: 'caranzano', label: 'Per Caranzano' },
                  { id: 'charts', label: 'Grafici' }
                ].map((v) => (
                  <button key={v.id} onClick={() => setTestView(v.id)}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-tighter ${testView === v.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {testView === 'caranzano' ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-amber-500 rounded-[2.5rem] p-8 text-white shadow-xl shadow-amber-100 flex items-center gap-6">
                  <div className="p-4 bg-white/20 rounded-3xl backdrop-blur-md">
                    <Utensils className="w-10 h-10" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black tracking-tight">Conteggio Pasti</h2>
                    <p className="text-amber-50 font-medium">Riepilogo persone presenti a Pranzo e Cena</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {DATES.map(d => (
                    <div key={d} className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm space-y-6">
                      <h3 className="text-xl font-black text-slate-800 border-b pb-4">{d}</h3>
                      <div className="space-y-4">
                        {['Pranzo', 'Cena'].map(meal => (
                          <div key={meal} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                            <span className="font-bold text-slate-600">{meal}</span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-black text-indigo-600">{countTotal(d, meal)}</span>
                              <span className="text-xs font-bold text-slate-400 uppercase">Persone</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : testView === 'summary' ? (
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="p-6 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Data</th>
                        {TIME_SLOTS.map(s => <th key={s} className="p-6 text-center text-xs font-black text-slate-400 uppercase tracking-widest">{s}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {DATES.map(d => (
                        <tr key={d} className="hover:bg-slate-50/30 transition-colors">
                          <td className="p-6 font-black text-slate-700">{d}</td>
                          {TIME_SLOTS.map(s => {
                            const count = countTotal(d, s);
                            return (
                              <td key={s} className="p-4">
                                <div className="h-14 w-14 mx-auto rounded-2xl flex flex-col items-center justify-center border-2 bg-indigo-50 border-indigo-100 text-indigo-700">
                                  <span className="text-lg font-black">{count}</span>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Grafici originali mantenuti qui */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 h-[400px]">
                   <h3 className="font-black mb-4 flex items-center gap-2"><BarChart3 size={20}/> Copertura</h3>
                   <ResponsiveContainer width="100%" height="90%">
                      <BarChart data={DATES.map(d => ({ name: d, count: TIME_SLOTS.reduce((a, s) => a + countTotal(d, s), 0) }))}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 8, 8]} />
                      </BarChart>
                   </ResponsiveContainer>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 h-[400px]">
                   <h3 className="font-black mb-4 flex items-center gap-2"><PieChart size={20}/> Distribuzione</h3>
                   <ResponsiveContainer width="100%" height="90%">
                    <RePieChart>
                      <Pie data={TIME_SLOTS.map(s => ({ name: s, value: DATES.reduce((a, d) => a + countTotal(d, s), 0) }))} innerRadius={60} outerRadius={80} dataKey="value">
                        {TIME_SLOTS.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RePieChart>
                   </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        ) : (
          /* USER VIEW */
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
              <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">Le tue disponibilità</h2>
                <p className="text-slate-500 font-medium">Seleziona i momenti in cui sarai presente</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {DATES.map(d => (
                <div key={d} className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                    <div className="p-2 bg-indigo-50 rounded-xl"><Calendar className="w-5 h-5 text-indigo-600" /></div>
                    <span className="text-xl font-black text-slate-800">{d}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {TIME_SLOTS.map(s => {
                      const val = availabilities[currentUser]?.[d]?.[s];
                      return (
                        <button key={s} onClick={() => toggleAvailability(d, s)}
                          className={`group h-20 rounded-2xl flex flex-col items-center justify-center transition-all border-2 active:scale-95 ${
                            val === true ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-100' :
                            'bg-slate-50 border-slate-100 text-slate-400 hover:border-indigo-200'
                          }`}>
                          {val === true ? <Check className="w-6 h-6 mb-1" /> : <Clock className="w-5 h-5 mb-1 opacity-20" />}
                          <span className="text-[10px] font-black uppercase tracking-tighter">{s}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* BARRA DI CHIUSURA FISSA IN BASSO */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-lg border-t border-slate-200 flex justify-center z-50">
              <button 
                onClick={() => {
                   window.scrollTo({ top: 0, behavior: 'smooth' });
                   setCurrentUser(null);
                }}
                className="max-w-md w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95"
              >
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                HO FINITO / ESCI
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;