import React, { useState, useEffect } from 'react';
import { 
  Check, X, Calendar, Users, LogOut, Eye, 
  BarChart3, PieChart, Activity, Clock, Info, ChevronRight 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, LineChart, Line, PieChart as RePieChart, 
  Pie, Cell 
} from 'recharts';

// CONFIGURAZIONE
const DATES = ['20 Dic', '21 Dic', '22 Dic', '23 Dic', '24 Dic'];
const TIME_SLOTS = ['Mattino', 'Pranzo', 'Pomeriggio', 'Sera'];
const PEOPLE = [
  'Mario Rossi', 'Luigi Bianchi', 'Anna Verdi', 'Paolo Neri',
  'Giulia Romano', 'Marco Ferrari', 'Sara Colombo', 'Andrea Ricci',
  'Francesca Marino', 'Roberto Greco', 'Test'
];

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'];

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [availabilities, setAvailabilities] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [testView, setTestView] = useState('summary'); 
  const [isLoading, setIsLoading] = useState(false);

  // Caricamento dati con Fallback (se window.storage non esiste, usa localStorage)
  useEffect(() => {
    const loadData = async () => {
      if (isLoading) return;
      setIsLoading(true);
      try {
        let data;
        if (window.storage) {
          const result = await window.storage.get('availabilities_shared', true);
          data = result?.value ? JSON.parse(result.value) : {};
        } else {
          const saved = localStorage.getItem('availabilities_shared');
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
        await window.storage.set('availabilities_shared', JSON.stringify(newData), true);
      } else {
        localStorage.setItem('availabilities_shared', JSON.stringify(newData));
      }
    } catch (e) {
      console.error("Errore salvataggio:", e);
    }
  };

  const toggleAvailability = async (date, slot) => {
    if (!currentUser || currentUser === 'Test' || isLoading) return;
    const current = availabilities[currentUser]?.[date]?.[slot];
    const newValue = current === true ? false : current === false ? null : true;

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

  const getStatusColor = (val, isBtn = false) => {
    if (val === true) return isBtn ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (val === false) return isBtn ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700 border-rose-200';
    return isBtn ? 'bg-slate-100 text-slate-400' : 'bg-slate-50 text-slate-400 border-slate-100';
  };

  // UI: LOGIN
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 overflow-hidden border border-slate-100">
            <div className="bg-indigo-600 p-8 text-center">
              <div className="inline-flex p-3 bg-white/20 rounded-2xl backdrop-blur-sm mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Staff Tracker</h1>
              <p className="text-indigo-100 text-sm mt-1">Seleziona il tuo profilo per iniziare</p>
            </div>
            <div className="p-6 space-y-2 max-h-[60vh] overflow-y-auto">
              {PEOPLE.map(p => (
                <button key={p} onClick={() => setCurrentUser(p)}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all group">
                  <span className="font-medium text-slate-700 group-hover:text-indigo-700">{p}</span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // UI: DASHBOARD (ADMIN o UTENTE)
  const isTest = currentUser === 'Test';

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Navbar Mobile-Optimized */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-800 hidden sm:inline">Tracker Presenze</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-500">Ciao, <span className="text-slate-900">{currentUser}</span></span>
            <button onClick={() => setCurrentUser(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Success Alert */}
        {showSuccess && (
          <div className="fixed bottom-6 right-6 z-50 animate-bounce bg-emerald-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2">
            <Check className="w-5 h-5" /> Salvato!
          </div>
        )}

        {/* ADMIN VIEW: Charts & Summary */}
        {isTest ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="text-indigo-500 w-5 h-5" />
                  <span className="text-sm text-slate-500 uppercase font-semibold">Staff Totale</span>
                </div>
                <div className="text-3xl font-bold text-slate-900">{PEOPLE.length - 1}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="text-emerald-500 w-5 h-5" />
                  <span className="text-sm text-slate-500 uppercase font-semibold">Fasce Orarie</span>
                </div>
                <div className="text-3xl font-bold text-slate-900">{DATES.length * TIME_SLOTS.length}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="text-rose-500 w-5 h-5" />
                  <span className="text-sm text-slate-500 uppercase font-semibold">Sync Status</span>
                </div>
                <div className="text-sm font-medium text-emerald-600 flex items-center gap-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Real-time Attivo
                </div>
              </div>
            </div>

            {/* View Selector */}
            <div className="flex bg-slate-200/50 p-1 rounded-xl w-fit">
              {['summary', 'charts'].map((v) => (
                <button key={v} onClick={() => setTestView(v)}
                  className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${testView === v ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>
                  {v.toUpperCase()}
                </button>
              ))}
            </div>

            {testView === 'summary' ? (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Data</th>
                        {TIME_SLOTS.map(s => <th key={s} className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">{s}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {DATES.map(d => (
                        <tr key={d} className="hover:bg-slate-50/50">
                          <td className="p-4 font-bold text-slate-700">{d}</td>
                          {TIME_SLOTS.map(s => {
                            const count = countTotal(d, s);
                            const perc = (count / (PEOPLE.length - 1)) * 100;
                            return (
                              <td key={s} className="p-4">
                                <div className={`rounded-xl p-3 text-center border ${perc >= 70 ? 'bg-emerald-50 border-emerald-100' : perc >= 40 ? 'bg-amber-50 border-amber-100' : 'bg-rose-50 border-rose-100'}`}>
                                  <div className="text-xl font-black text-slate-800">{count}</div>
                                  <div className="text-[10px] font-bold uppercase opacity-50">Persone</div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-96">
                  <h3 className="text-slate-800 font-bold mb-6">Copertura Giornaliera</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={DATES.map(d => ({ name: d, count: TIME_SLOTS.reduce((a, s) => a + countTotal(d, s), 0) }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} />
                      <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-96">
                  <h3 className="text-slate-800 font-bold mb-6">Distribuzione Oraria</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie 
                        data={TIME_SLOTS.map(s => ({ name: s, value: DATES.reduce((a, d) => a + countTotal(d, s), 0) }))} 
                        innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                      >
                        {TIME_SLOTS.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36}/>
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        ) : (
          /* USER VIEW: Grid per inserimento */
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="text-indigo-500 w-5 h-5" /> Il Tuo Calendario
              </h2>
              <p className="text-sm text-slate-500 mt-1">Clicca sulle celle per cambiare stato (Disponibile/Assente/Reset)</p>
            </div>
            <div className="overflow-x-auto px-4 py-6">
              <div className="min-w-[600px] grid grid-cols-[120px_repeat(4,1fr)] gap-3">
                <div />
                {TIME_SLOTS.map(s => <div key={s} className="text-center text-xs font-black text-slate-400 uppercase tracking-widest pb-2">{s}</div>)}
                
                {DATES.map(d => (
                  <React.Fragment key={d}>
                    <div className="flex items-center font-bold text-slate-700 bg-slate-50 rounded-xl px-4">{d}</div>
                    {TIME_SLOTS.map(s => {
                      const val = availabilities[currentUser]?.[d]?.[s];
                      return (
                        <button key={s} onClick={() => toggleAvailability(d, s)}
                          className={`h-20 rounded-2xl flex flex-col items-center justify-center transition-all border-2 active:scale-95 ${
                            val === true ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-200' :
                            val === false ? 'bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-200' :
                            'bg-slate-50 border-slate-100 text-slate-300 hover:bg-slate-100'
                          }`}>
                          {val === true ? <Check className="w-8 h-8" /> : val === false ? <X className="w-8 h-8" /> : <div className="w-2 h-2 bg-slate-200 rounded-full" />}
                          <span className="text-[10px] font-bold uppercase mt-1 opacity-70">
                            {val === true ? 'Presente' : val === false ? 'Assente' : 'Libero'}
                          </span>
                        </button>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div className="bg-indigo-50 p-6 flex items-start gap-4">
               <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
               <div className="text-sm text-indigo-800 leading-relaxed">
                 Le tue modifiche vengono salvate istantaneamente e condivise con il team. Puoi modificare le tue scelte in qualsiasi momento.
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
