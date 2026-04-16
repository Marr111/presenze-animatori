import React, { useState, useMemo, useEffect } from 'react';
import {
  Check, Printer, ChevronRight, AlertTriangle, Activity,
  BarChart2, Download, Skull, Settings, Database, Clock, User
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, PieChart, Pie, Cell,
  LineChart, Line, Legend, ResponsiveContainer
} from 'recharts';

import Navbar from '../components/Navbar';
import DishesBoard from '../components/DishesBoard';
import ProgramSection from '../components/ProgramSection';
import { DATES, DAY_SLOTS, ALL_PERIODS, COLORS, INITIAL_PEOPLE } from '../utils/constants';
import { countTotal, calculateDebt, exportToCSV, getInitials } from '../utils/helpers';
import { getLogs } from '../utils/api';

const TABS = [
  { key: 'summary',   label: 'Riepilogo' },
  { key: 'caranzano', label: 'Pasti' },
  { key: 'matrix',    label: 'Matrice' },
  { key: 'charts',    label: 'Grafici' },
  { key: 'dishes',    label: '🍽 Piatti' },
  { key: 'program',   label: '📋 Programma' },
  { key: 'logs',      label: '📜 Log' },
  { key: 'payments',  label: '💰 Pagamenti' },
  { key: 'database',  label: 'Database' },
];

// Formats log timestamp in Italian-friendly format
const formatTs = (ts) => {
  try {
    const d = new Date(ts);
    return d.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch { return ts; }
};

const AdminDashboard = ({
  appData, darkMode, setDarkMode, onLogout, updateAndSave, persistToCloud, isSaving, saveError,
}) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [visibleCharts, setVisibleCharts] = useState(0);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [filterUser, setFilterUser] = useState('');

  const { availabilities, ideas, people, schedule, dishAssignments, paidUsers } = appData;

  const dm = darkMode;
  const card = dm ? 'bg-[#132019] border-[#1e3a2a]' : 'bg-white border-slate-100 shadow-sm';

  // Chart waterfall animation
  useEffect(() => {
    if (activeTab === 'charts') {
      setVisibleCharts(0);
      const iv = setInterval(() => {
        setVisibleCharts(p => { if (p < 8) return p + 1; clearInterval(iv); return p; });
      }, 300);
      return () => clearInterval(iv);
    }
  }, [activeTab]);

  // Load logs when tab opens
  useEffect(() => {
    if (activeTab === 'logs') {
      setLogsLoading(true);
      getLogs().then(l => { setLogs(l); setLogsLoading(false); });
    }
  }, [activeTab]);

  const ct = (date, slot) => countTotal(date, slot, people, availabilities);

  // Charts data
  const chartsData = useMemo(() => {
    const timeline = ALL_PERIODS.map(p => ({ name: `${p.date.split(' ')[1]} ${p.slot[0]}.`, persone: ct(p.date, p.slot) }));
    const mealsMix = [
      { name: 'Pranzi', value: DATES.reduce((a, d) => a + ct(d, 'Pranzo'), 0) },
      { name: 'Cene', value: DATES.reduce((a, d) => a + ct(d, 'Cena'), 0) },
    ];
    const staffActivity = people.map(p => {
      let count = 0;
      DATES.forEach(d => DAY_SLOTS[d].forEach(s => { if (availabilities[p]?.[d]?.[s]) count++; }));
      return { name: p.split(' ')[0], impegni: count };
    });
    const radar = ['Mattino','Pranzo','Pomeriggio','Cena','Sera','Notte'].map(s => ({
      subject: s, A: DATES.reduce((a, d) => a + ct(d, s), 0),
    }));
    const debtData = people.map(p => ({ name: p.split(' ')[0], euro: calculateDebt(p, availabilities) })).filter(d => d.euro > 0);
    const dailyTotal = DATES.map(d => ({ name: d, totale: DAY_SLOTS[d].reduce((a, s) => a + ct(d, s), 0) }));
    const categoryMix = [
      { name: 'Fasce Pasti', value: DATES.reduce((a, d) => a + ct(d, 'Pranzo') + ct(d, 'Cena'), 0) },
      { name: 'Altre Fasce', value: DATES.reduce((a, d) => a + ct(d, 'Mattino') + ct(d, 'Pomeriggio') + ct(d, 'Sera') + ct(d, 'Notte'), 0) },
    ];
    const lineData = DATES.map(d => ({ name: d.split(' ')[1], Mattino: ct(d, 'Mattino'), Pomeriggio: ct(d, 'Pomeriggio'), Sera: ct(d, 'Sera') }));
    return { timeline, mealsMix, staffActivity, radar, debtData, dailyTotal, categoryMix, lineData };
  }, [availabilities, people]);

  // Groups logs by user for the filter
  const uniqueUsers = useMemo(() => [...new Set(logs.map(l => l.user))].sort(), [logs]);
  const filteredLogs = filterUser ? logs.filter(l => l.user === filterUser) : logs;

  const handleResetData = async () => {
    if (!confirm('ATTENZIONE ESTREMA:\n\nStai per cancellare TUTTI i dati.\nQuesta azione non è reversibile.\n\nSei sicuro?')) return;
    const empty = { availabilities: {}, ideas: [], people: INITIAL_PEOPLE, schedule: [], dishAssignments: {}, paidUsers: [] };
    await persistToCloud(empty);
    alert('Database resettato.');
    window.location.reload();
  };

  const handleGenerateRandom = async () => {
    if (!confirm('Questa azione sovrascriverà le selezioni con dati casuali.\n\nContinuare?')) return;
    const newAvail = {};
    people.forEach(person => {
      newAvail[person] = {};
      DATES.forEach(d => {
        newAvail[person][d] = {};
        DAY_SLOTS[d].forEach(s => { if (Math.random() > 0.6) newAvail[person][d][s] = true; });
      });
    });
    await persistToCloud({ ...appData, availabilities: newAvail });
    alert('Dati di test generati!');
    window.location.reload();
  };

  const handleUpdateDishes = async (newAssignments) => {
    await updateAndSave({ dishAssignments: newAssignments }, 'Admin ha modificato i turni piatti');
  };

  const handleUpdateSchedule = async (newSchedule) => {
    await updateAndSave({ schedule: newSchedule }, 'Admin ha aggiornato il programma');
  };

  const handleTogglePayment = async (person) => {
    const isPaid = (paidUsers || []).includes(person);
    const newPaid = isPaid
      ? paidUsers.filter(p => p !== person)
      : [...(paidUsers || []), person];
    await updateAndSave({ paidUsers: newPaid }, `Admin ha segnato ${person} come ${isPaid ? 'NON pagato' : 'PAGATO'}`);
  };

  const chartBox = (index, title, chartEl) => (
    <div className={`bg-white dark:bg-[#132019] p-4 rounded-3xl border border-slate-100 dark:border-[#1e3a2a] shadow-sm flex flex-col items-center transition-all duration-500 ${visibleCharts >= index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <h3 className="text-[10px] font-black mb-3 uppercase text-slate-400 dark:text-white/30">{title}</h3>
      {chartEl}
    </div>
  );

  return (
    <div className={`min-h-screen pb-12 transition-colors duration-300 ${dm ? 'bg-[#0a1a0e] text-white' : 'bg-[#fef5e8] text-[#1a2e1a]'}`}>
      <style>{`
        @media print {
          @page { size: landscape; }
          nav, .no-print { display: none !important; }
          table { font-size: 8px !important; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #2d7a4e; border-radius: 10px; }
      `}</style>

      <Navbar currentUser="Admin 🔑" darkMode={dm} setDarkMode={setDarkMode} onLogout={onLogout} />

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Tab bar */}
        <div className={`flex gap-1 flex-wrap p-1.5 rounded-2xl mb-6 no-print items-center ${dm ? 'bg-[#132019]' : 'bg-slate-100'}`}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                activeTab === t.key ? 'bg-[#c41e3a] text-white shadow-md shadow-[#c41e3a]/30' : dm ? 'text-white/40 hover:text-white/70 hover:bg-[#1e3a2a]' : 'text-slate-400 hover:bg-white'
              }`}
            >
              {t.label}
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            <button onClick={() => { exportToCSV(people, availabilities); }} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5 uppercase hover:bg-blue-700 transition-colors shadow-md">
              <Download size={14} /> CSV
            </button>
            <button onClick={() => window.print()} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5 uppercase hover:bg-emerald-700 transition-colors shadow-md">
              <Printer size={14} /> Stampa
            </button>
          </div>
        </div>

        {/* ── SUMMARY ── */}
        {activeTab === 'summary' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {DATES.map(d => (
              <div key={d} className={`p-6 rounded-3xl border ${card}`}>
                <h3 className={`font-black text-sm uppercase tracking-widest border-b pb-2 mb-4 ${dm ? 'text-emerald-400 border-[#1e3a2a]' : 'text-emerald-700 border-green-100'}`}>{d}</h3>
                {DAY_SLOTS[d].map(s => (
                  <div key={s} className={`flex justify-between py-2 border-b last:border-0 ${dm ? 'border-[#1e3a2a]' : 'border-slate-50'}`}>
                    <span className="font-bold opacity-50 text-[10px] uppercase tracking-wide">{s}</span>
                    <span className="font-black">{ct(d, s)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ── CARANZANO ── */}
        {activeTab === 'caranzano' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {DATES.map(d => (
              <div key={d} className={`p-6 rounded-3xl border ${card}`}>
                <h3 className={`text-lg font-black mb-5 uppercase border-b pb-2 ${dm ? 'text-emerald-400 border-[#1e3a2a]' : 'text-emerald-700 border-green-100'}`}>{d}</h3>
                {['Pranzo', 'Cena'].filter(m => DAY_SLOTS[d].includes(m)).map(m => (
                  <div key={m} className={`flex justify-between items-center p-5 rounded-2xl mb-3 ${dm ? 'bg-[#0a1a0e]' : 'bg-slate-50 border border-slate-100'}`}>
                    <span className="font-black opacity-40 uppercase text-xs">{m}</span>
                    <span className="text-4xl font-black">{ct(d, m)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ── MATRIX ── */}
        {activeTab === 'matrix' && (
          <div className={`rounded-3xl border overflow-hidden print-area ${dm ? 'bg-[#132019] border-[#1e3a2a]' : 'bg-white border-slate-200'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr className={dm ? 'bg-[#0a1a0e] text-white/50' : 'bg-slate-100 text-slate-500'}>
                    <th className={`p-3 text-left border-r sticky left-0 z-10 w-32 ${dm ? 'bg-[#0a1a0e] border-[#1e3a2a]' : 'bg-slate-100 border-slate-200'}`}>Staff</th>
                    {ALL_PERIODS.map((p, i) => (
                      <th key={i} className={`p-2 border-r text-center font-black ${dm ? 'border-[#1e3a2a]' : 'border-slate-200'}`}>
                        {p.date.split(' ')[1]}<br /><span className="text-[9px] opacity-60">{p.slot}</span>
                      </th>
                    ))}
                    <th className="p-3 bg-amber-500/10 text-amber-500">€</th>
                  </tr>
                </thead>
                <tbody className={dm ? 'text-white/70' : 'text-slate-700'}>
                  {[...people].sort((a,b)=>a.localeCompare(b,'it',{sensitivity:'base'})).map(p => {
                    const isPaid = (paidUsers || []).includes(p);
                    return (
                      <tr key={p} className={`border-t transition-colors ${dm ? 'border-[#1e3a2a] hover:bg-[#1e3a2a]' : 'border-slate-100 hover:bg-slate-50'} ${isPaid ? (dm ? 'bg-emerald-500/5' : 'bg-emerald-50/30') : ''}`}>
                        <td className={`p-2 font-bold sticky left-0 border-r flex items-center gap-2 ${dm ? 'bg-[#132019] border-[#1e3a2a]' : 'bg-white border-slate-100'}`}>
                          {isPaid && <Check size={12} className="text-emerald-500" />}
                          <span className={isPaid ? 'text-emerald-500' : ''}>{p}</span>
                        </td>
                        {ALL_PERIODS.map((per, i) => (
                          <td key={i} className={`text-center border-r p-1 ${dm ? 'border-[#1e3a2a]' : 'border-slate-100'}`}>
                            {availabilities[p]?.[per.date]?.[per.slot] && <Check size={14} className="mx-auto text-emerald-500" />}
                          </td>
                        ))}
                        <td className={`p-2 text-center font-black ${isPaid ? 'text-emerald-500 bg-emerald-500/10' : 'bg-amber-500/5 text-amber-500'}`}>
                          {calculateDebt(p, availabilities)}€
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className={`font-black uppercase text-[9px] ${dm ? 'bg-[#c41e3a]/20 text-red-300' : 'bg-[#c41e3a] text-white'}`}>
                  <tr>
                    <td className="p-3 border-r border-white/10">TOT. PRESENZE</td>
                    {ALL_PERIODS.map((p, i) => <td key={i} className="text-center border-r border-white/10">{ct(p.date, p.slot)}</td>)}
                    <td className="text-center font-black">{people.reduce((a, p) => a + calculateDebt(p, availabilities), 0)}€</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* ── CHARTS ── */}
        {activeTab === 'charts' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {chartBox(1, '1. Andamento Presenze', <AreaChart width={300} height={170} data={chartsData.timeline}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" tick={{fontSize: 8}}/><YAxis tick={{fontSize: 8}}/><Tooltip/><Area type="monotone" dataKey="persone" stroke="#c41e3a" fill="#c41e3a22"/></AreaChart>)}
            {chartBox(2, '2. Bilancio Pasti', <PieChart width={300} height={170}><Pie data={chartsData.mealsMix} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" label={{fontSize: 8}}>{chartsData.mealsMix.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}</Pie><Tooltip/><Legend iconSize={8} wrapperStyle={{fontSize: 10}}/></PieChart>)}
            {chartBox(3, '3. Classifica Impegni', <BarChart width={300} height={170} data={chartsData.staffActivity.slice(0,6)}><XAxis dataKey="name" tick={{fontSize: 8}}/><YAxis tick={{fontSize: 8}}/><Tooltip/><Bar dataKey="impegni" fill="#2d7a4e" radius={[4,4,0,0]}/></BarChart>)}
            {chartBox(4, '4. Analisi Fasce', <RadarChart cx={150} cy={85} outerRadius={55} width={300} height={170} data={chartsData.radar}><PolarGrid/><PolarAngleAxis dataKey="subject" tick={{fontSize: 8}}/><Radar dataKey="A" stroke="#e8c84b" fill="#e8c84b" fillOpacity={0.5}/></RadarChart>)}
            {chartBox(5, '5. Debiti (€)', <BarChart width={300} height={170} data={chartsData.debtData}><XAxis dataKey="name" tick={{fontSize: 8}}/><YAxis tick={{fontSize: 8}}/><Tooltip/><Bar dataKey="euro" fill="#e8c84b" radius={[4,4,0,0]}/></BarChart>)}
            {chartBox(6, '6. Volume Giornaliero', <BarChart width={300} height={170} data={chartsData.dailyTotal}><XAxis dataKey="name" tick={{fontSize: 8}}/><YAxis tick={{fontSize: 8}}/><Tooltip/><Bar dataKey="totale" fill="#c41e3a" radius={[4,4,0,0]}/></BarChart>)}
            {chartBox(7, '7. Tipo Attività', <PieChart width={300} height={170}><Pie data={chartsData.categoryMix} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={{fontSize: 8}}>{chartsData.categoryMix.map((_, i) => <Cell key={i} fill={COLORS[(i+2) % COLORS.length]}/>)}</Pie><Tooltip/></PieChart>)}
            {chartBox(8, '8. Trend Giornaliero', <LineChart width={300} height={170} data={chartsData.lineData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name" tick={{fontSize: 8}}/><YAxis tick={{fontSize: 8}}/><Tooltip/><Legend iconSize={8} wrapperStyle={{fontSize: 8}}/><Line type="monotone" dataKey="Mattino" stroke="#c41e3a"/><Line type="monotone" dataKey="Sera" stroke="#2d7a4e"/></LineChart>)}
          </div>
        )}

        {/* ── DISHES ── */}
        {activeTab === 'dishes' && (
          <DishesBoard
            people={people}
            availabilities={availabilities}
            dishAssignments={dishAssignments || {}}
            darkMode={dm}
            onUpdateAssignments={handleUpdateDishes}
          />
        )}

        {/* ── PROGRAM ── */}
        {activeTab === 'program' && (
          <div className={`p-6 rounded-[2rem] border ${card}`}>
            <ProgramSection
              schedule={schedule || []}
              darkMode={dm}
              isAdmin={true}
              onUpdate={handleUpdateSchedule}
              onDownloadICS={() => downloadICS('Admin', availabilities, schedule)}
            />
          </div>
        )}

        {/* ── LOGS ── */}
        {activeTab === 'logs' && (
          <div className="space-y-5">
            <div className={`flex flex-wrap gap-3 p-4 rounded-2xl border items-center ${card}`}>
              <span className="font-black text-sm uppercase opacity-50">Filtra per utente:</span>
              <button onClick={() => setFilterUser('')} className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${!filterUser ? 'bg-[#c41e3a] text-white' : dm ? 'bg-[#1e3a2a] text-white/50 hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                Tutti
              </button>
              {uniqueUsers.map(u => (
                <button key={u} onClick={() => setFilterUser(u)} className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${filterUser === u ? 'bg-[#c41e3a] text-white' : dm ? 'bg-[#1e3a2a] text-white/50 hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                  {u}
                </button>
              ))}
            </div>

            {logsLoading && (
              <div className="text-center py-12 opacity-40">
                <Activity className="animate-spin mx-auto mb-2" size={24} />
                <p className="text-sm font-bold">Caricamento log...</p>
              </div>
            )}

            {!logsLoading && filteredLogs.length === 0 && (
              <div className="text-center py-12 opacity-30">
                <Clock size={40} className="mx-auto mb-3" />
                <p className="font-bold text-sm">Nessuna attività registrata ancora.</p>
              </div>
            )}

            <div className="space-y-2">
              {filteredLogs.map((log, i) => (
                <div key={i} className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${card}`}>
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#c41e3a] to-[#2d7a4e] text-white flex items-center justify-center font-black text-[10px] flex-shrink-0 shadow-md">
                    {getInitials(log.user)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className={`font-black text-sm ${dm ? 'text-emerald-300' : 'text-emerald-700'}`}>{log.user}</span>
                      <span className={`text-sm ${dm ? 'text-white/80' : 'text-slate-700'}`}>{log.action}</span>
                    </div>
                    <div className={`text-[10px] mt-0.5 font-mono opacity-40`}>{formatTs(log.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PAYMENTS ── */}
        {activeTab === 'payments' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className={`p-6 rounded-[2rem] border ${card}`}>
              <h3 className="text-xl font-black mb-6 uppercase flex items-center gap-2">
                <Check className="text-emerald-500" /> Registro Pagamenti
              </h3>
              <div className="space-y-2">
                {[...people].sort((a,b) => a.localeCompare(b)).map(p => {
                  const debt = calculateDebt(p, availabilities);
                  const isPaid = (paidUsers || []).includes(p);
                  if (debt === 0 && !isPaid) return null; // Nascondi chi non deve nulla e non ha pagato
                  
                  return (
                    <div 
                      key={p} 
                      onClick={() => handleTogglePayment(p)}
                      className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] ${
                        isPaid 
                          ? (dm ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-green-50 border-green-200 text-green-700')
                          : (dm ? 'bg-amber-500/5 border-amber-500/20' : 'bg-white border-slate-100 shadow-sm')
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                          isPaid 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-gradient-to-br from-slate-400 to-slate-500 text-white'
                        }`}>
                          {isPaid ? <Check size={20} /> : getInitials(p)}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{p}</p>
                          <p className="text-[10px] uppercase font-black opacity-50 tracking-wider">
                            Quota: {debt}€
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {isPaid && <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 px-2 py-1 rounded-lg">Pagato ✓</span>}
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          isPaid ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'
                        }`}>
                          {isPaid && <Check size={14} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className={`p-6 rounded-3xl border flex flex-col sm:flex-row items-center sm:items-center justify-between gap-4 ${card}`}>
              <div className="flex items-center gap-3 text-emerald-500">
                <BarChart2 size={24} />
                <div className="text-center sm:text-left">
                  <p className="text-[10px] uppercase font-black opacity-50">Totale Incassato</p>
                  <p className="text-2xl font-black">
                    {people.filter(p => (paidUsers || []).includes(p)).reduce((a, p) => a + calculateDebt(p, availabilities), 0)}€
                  </p>
                </div>
              </div>
              <div className="text-center sm:text-right">
                <p className="text-[10px] uppercase font-black opacity-50">Ancora da Incassare</p>
                <p className="text-2xl font-black text-[#c41e3a]">
                  {people.filter(p => !(paidUsers || []).includes(p)).reduce((a, p) => a + calculateDebt(p, availabilities), 0)}€
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── DATABASE ── */}
        {activeTab === 'database' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className={`p-6 rounded-3xl border flex items-start gap-4 ${dm ? 'bg-amber-900/20 border-amber-900/40' : 'bg-amber-50 border-amber-200'}`}>
              <div className={`p-3 rounded-2xl ${dm ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>
                <Settings size={28} />
              </div>
              <div>
                <h3 className={`text-xl font-black mb-1 ${dm ? 'text-amber-400' : 'text-amber-700'}`}>Pannello di Controllo</h3>
                <p className="text-sm opacity-70">Operazioni delicate sul database. Irreversibili. Procedi con cautela.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <button onClick={handleGenerateRandom} className={`group relative overflow-hidden p-6 rounded-3xl border text-left transition-all ${
                dm ? 'bg-[#132019] border-[#1e3a2a] hover:border-blue-500' : 'bg-white border-slate-200 hover:border-blue-400 shadow-sm'
              }`}>
                <div className="flex items-center gap-3 mb-3 text-blue-500">
                  <Database size={22} />
                  <span className="font-black uppercase tracking-widest text-xs">Test Mode</span>
                </div>
                <h4 className="text-lg font-bold mb-1">Genera Dati Random</h4>
                <p className="text-xs opacity-50">Riempie con dati casuali per testare grafici e statistiche.</p>
                <ChevronRight size={14} className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
              </button>
              <button onClick={handleResetData} className={`group relative overflow-hidden p-6 rounded-3xl border text-left transition-all ${
                dm ? 'bg-[#132019] border-[#1e3a2a] hover:border-red-500' : 'bg-white border-slate-200 hover:border-red-400 shadow-sm'
              }`}>
                <div className="flex items-center gap-3 mb-3 text-red-500">
                  <Skull size={22} />
                  <span className="font-black uppercase tracking-widest text-xs">Reset Mode</span>
                </div>
                <h4 className="text-lg font-bold mb-1">Reset Totale</h4>
                <p className="text-xs opacity-50">Cancella ogni presenza, idea e dato. Riporta l'app allo stato iniziale.</p>
                <ChevronRight size={14} className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-red-500" />
              </button>
            </div>
          </div>
        )}
      </main>

      {saveError && (
        <div className="fixed top-20 left-0 right-0 flex justify-center z-50 pointer-events-none">
          <div className="pointer-events-auto bg-red-500 text-white px-6 py-3 rounded-2xl shadow-2xl font-bold flex items-center gap-2 text-sm animate-bounce">
            <AlertTriangle size={18} /> {saveError}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
