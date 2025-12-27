import './App.css';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Check, X, Calendar, Users, LogOut, Eye, Search,
  BarChart3, PieChart, Activity, Clock, Info, ChevronRight 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart as RePieChart, Pie, Cell 
} from 'recharts';

// CONFIGURAZIONE
const DATES = ['20 Dic', '21 Dic', '22 Dic', '23 Dic', '24 Dic'];
const TIME_SLOTS = ['Mattino', 'Pranzo', 'Pomeriggio', 'Sera'];
const PEOPLE = [
  'Mario Rossi', 'Luigi Bianchi', 'Anna Verdi', 'Paolo Neri',
  'Giulia Romano', 'Marco Ferrari', 'Sara Colombo', 'Andrea Ricci',
  'Francesca Marino', 'Roberto Greco', 'Test'
].sort();

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'];

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [availabilities, setAvailabilities] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [testView, setTestView] = useState('summary'); 
  const [isLoading, setIsLoading] = useState(false);

  // Caricamento dati
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

  const filteredPeople = useMemo(() => 
    PEOPLE.filter(p => p.toLowerCase().includes(searchTerm.toLowerCase())),
    [searchTerm]
  );

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  // UI: LOGIN MODERNIZZATA
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4">
          <div className="text-center space-y-2 mb-8">
             <div className="inline-flex p-4 bg-indigo-600 rounded-3xl shadow-lg shadow-indigo-200 mb-2">
                <Users className="w-8 h-8 text-white" />
             </div>
             <h1 className="text-3xl font-black text-slate-800 tracking-tight">Staff Portal</h1>
             <p className="text-slate-500 font-medium">Chi sta accedendo oggi?</p>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cerca il tuo nome..."
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {filteredPeople.map(p => (
                <button key={p} onClick={() => setCurrentUser(p)}
                  className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-indigo-50 transition-all group border border-transparent hover:border-indigo-100">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    {getInitials(p)}
                  </div>
                  <span className="font-bold text-slate-700 group-hover:text-indigo-700 flex-1 text-left">{p}</span>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isTest = currentUser === 'Test';

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Navbar Minimal */}
      <nav className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-md shadow-indigo-100">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-slate-800 tracking-tight text-lg">TRACKER</span>
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
            <span className="font-bold text-sm tracking-wide uppercase">Dati Sincronizzati</span>
          </div>
        )}

        {isTest ? (
          /* ADMIN VIEW */
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Team', val: PEOPLE.length - 1, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { label: 'Slot Totali', val: DATES.length * TIME_SLOTS.length, icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Attività', val: 'Live', icon: Activity, color: 'text-rose-600', bg: 'bg-rose-50' }
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
                  <div className={`p-4 ${stat.bg} ${stat.color} rounded-2xl`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                    <p className="text-2xl font-black text-slate-800">{stat.val}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <div className="inline-flex bg-slate-200/50 p-1.5 rounded-2xl border border-slate-200">
                {['summary', 'charts'].map((v) => (
                  <button key={v} onClick={() => setTestView(v)}
                    className={`px-8 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-tighter ${testView === v ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {testView === 'summary' ? (
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
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
                            const perc = (count / (PEOPLE.length - 1)) * 100;
                            return (
                              <td key={s} className="p-4">
                                <div className={`h-16 rounded-2xl flex flex-col items-center justify-center border-2 transition-all ${perc >= 70 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : perc >= 40 ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                                  <span className="text-xl font-black">{count}</span>
                                  <span className="text-[9px] font-bold uppercase opacity-60">Staff</span>
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
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 h-[450px]">
                  <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2">
                    <BarChart3 className="text-indigo-500 w-5 h-5" /> Copertura Giornaliera
                  </h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={DATES.map(d => ({ name: d, count: TIME_SLOTS.reduce((a, s) => a + countTotal(d, s), 0) }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                      <Tooltip 
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} 
                        cursor={{fill: '#f8fafc'}} 
                      />
                      <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 8, 8]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 h-[450px]">
                  <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2">
                    <PieChart className="text-indigo-500 w-5 h-5" /> Mix Orario
                  </h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie 
                        data={TIME_SLOTS.map(s => ({ name: s, value: DATES.reduce((a, d) => a + countTotal(d, s), 0) }))} 
                        innerRadius={80} outerRadius={110} paddingAngle={8} dataKey="value" stroke="none"
                      >
                        {TIME_SLOTS.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{paddingTop: '20px', fontWeight: 700}} />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        ) : (
          /* USER VIEW: CARDS MOBILE-FRIENDLY */
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
              <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">Il Tuo Calendario</h2>
                <p className="text-slate-500 font-medium">Seleziona quando sarai con noi</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full" /> Presente
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <div className="w-3 h-3 bg-rose-500 rounded-full" /> Assente
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {DATES.map(d => (
                <div key={d} className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-slate-100 rounded-xl"><Calendar className="w-5 h-5 text-slate-500" /></div>
                       <span className="text-xl font-black text-slate-800">{d}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {TIME_SLOTS.map(s => {
                      const val = availabilities[currentUser]?.[d]?.[s];
                      return (
                        <button key={s} onClick={() => toggleAvailability(d, s)}
                          className={`group relative h-24 rounded-3xl flex flex-col items-center justify-center transition-all border-2 active:scale-95 ${
                            val === true ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-100' :
                            val === false ? 'bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-100' :
                            'bg-slate-50 border-slate-100 text-slate-400 hover:bg-white hover:border-indigo-200 hover:text-indigo-500'
                          }`}>
                          <div className="mb-1">
                            {val === true ? <Check className="w-8 h-8 animate-in zoom-in duration-300" /> : 
                             val === false ? <X className="w-8 h-8 animate-in zoom-in duration-300" /> : 
                             <Clock className="w-6 h-6 opacity-20 group-hover:opacity-100 group-hover:animate-pulse" />}
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-tighter">
                            {s}
                          </span>
                          {val === null && <span className="absolute bottom-2 text-[8px] font-black opacity-40">CLICCA</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center gap-6 shadow-xl shadow-indigo-200">
               <div className="p-4 bg-white/20 rounded-3xl backdrop-blur-md">
                 <Info className="w-8 h-8" />
               </div>
               <div className="text-center md:text-left space-y-1">
                 <h4 className="text-lg font-black tracking-tight">Salvataggio Istantaneo</h4>
                 <p className="text-indigo-100 text-sm font-medium">Le tue scelte sono sincronizzate in tempo reale con il team degli animatori. Puoi cambiare idea quando vuoi!</p>
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
