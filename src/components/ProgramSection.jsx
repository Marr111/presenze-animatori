import React, { useState } from 'react';
import { CalendarDays, Plus, Trash2, Check, X, Pencil, GripVertical } from 'lucide-react';
import { DATES } from '../utils/constants';

const SLOT_ICONS = {
  'Mattino': '🌅',
  'Pranzo':  '🍽️',
  'Pomeriggio': '☀️',
  'Cena': '🕯️',
  'Sera': '🌙',
  'Notte': '⭐',
  'Generale': '📌',
};

const ProgramSection = ({ schedule, darkMode, isAdmin, onUpdate }) => {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ date: DATES[0], time: '', title: '', description: '', icon: '📌' });

  const card = darkMode
    ? 'bg-[#132019] border-[#1e3a2a]'
    : 'bg-white border-slate-100 shadow-sm';

  const inputCls = darkMode
    ? 'bg-[#0a1a0e] border-[#1e3a2a] text-white placeholder-white/30'
    : 'bg-slate-50 border-slate-200 placeholder-slate-400';

  const handleAdd = () => {
    if (!newItem.title.trim()) return;
    const updated = [...(schedule || []), { ...newItem, id: Date.now() }];
    onUpdate(updated);
    setNewItem({ date: DATES[0], time: '', title: '', description: '', icon: '📌' });
    setShowAdd(false);
  };

  const handleDelete = (id) => {
    if (!confirm('Vuoi davvero eliminare questa voce dal programma?')) return;
    onUpdate((schedule || []).filter(i => i.id !== id));
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditData({ ...item });
  };

  const handleSaveEdit = () => {
    if (!editData.title.trim()) return;
    onUpdate((schedule || []).map(i => i.id === editingId ? { ...editData } : i));
    setEditingId(null);
  };

  // Group by date
  const grouped = {};
  [... DATES, 'Generale'].forEach(d => { grouped[d] = []; });
  (schedule || []).forEach(item => {
    const key = item.date || 'Generale';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  });

  const sortByTime = (a, b) => (a.time || '99:99').localeCompare(b.time || '99:99');

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className={`text-xl font-black flex items-center gap-2 ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>
          <CalendarDays size={22} /> Programma
        </h2>
        {isAdmin && (
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#2d7a4e] text-white rounded-xl text-xs font-black uppercase hover:bg-[#1a5c38] transition-colors shadow-md"
          >
            <Plus size={14} /> Aggiungi
          </button>
        )}
      </div>

      {/* Add form */}
      {isAdmin && showAdd && (
        <div className={`p-5 rounded-2xl border mb-5 space-y-3 ${card}`}>
          <h3 className="font-black text-sm uppercase opacity-60">Nuova Voce</h3>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={newItem.date}
              onChange={e => setNewItem({ ...newItem, date: e.target.value })}
              className={`px-3 py-2 rounded-xl border outline-none text-sm font-bold ${inputCls}`}
            >
              {DATES.map(d => <option key={d} value={d}>{d}</option>)}
              <option value="Generale">Generale</option>
            </select>
            <input
              type="time"
              value={newItem.time}
              onChange={e => setNewItem({ ...newItem, time: e.target.value })}
              className={`px-3 py-2 rounded-xl border outline-none text-sm font-bold ${inputCls}`}
            />
          </div>
          <input
            type="text"
            placeholder="Titolo dell'evento *"
            value={newItem.title}
            onChange={e => setNewItem({ ...newItem, title: e.target.value })}
            className={`w-full px-4 py-2.5 rounded-xl border outline-none text-sm font-bold ${inputCls}`}
          />
          <input
            type="text"
            placeholder="Descrizione (opzionale)"
            value={newItem.description}
            onChange={e => setNewItem({ ...newItem, description: e.target.value })}
            className={`w-full px-4 py-2.5 rounded-xl border outline-none text-sm ${inputCls}`}
          />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="flex-1 py-2.5 bg-[#c41e3a] text-white rounded-xl font-black text-sm uppercase hover:bg-[#a01830] transition-colors flex items-center justify-center gap-1.5">
              <Plus size={14} /> Aggiungi
            </button>
            <button onClick={() => setShowAdd(false)} className={`px-4 py-2.5 rounded-xl font-black text-sm ${darkMode ? 'bg-[#1e3a2a] text-white/60 hover:bg-[#2a4a35]' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'} transition-colors`}>
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Schedule grouped by day */}
      <div className="space-y-6">
        {[...DATES, 'Generale'].map(date => {
          const items = grouped[date]?.sort(sortByTime) || [];
          if (items.length === 0 && !isAdmin) return null;
          return (
            <div key={date}>
              <h3 className={`text-xs font-black uppercase tracking-widest mb-3 pb-2 border-b ${
                darkMode ? 'text-emerald-400 border-[#1e3a2a]' : 'text-emerald-700 border-green-100'
              }`}>
                {date === 'Generale' ? '📌 Generale / Tutti i Giorni' : `🗓 ${date}`}
              </h3>
              <div className="space-y-2">
                {items.length === 0 && isAdmin && (
                  <p className="text-xs italic opacity-30 pl-2">Nessuna voce — aggiungine una sopra.</p>
                )}
                {items.map(item => (
                  <div key={item.id} className={`p-4 rounded-2xl border flex items-start gap-3 group transition-all ${card}`}>
                    <GripVertical size={14} className="opacity-20 mt-1 flex-shrink-0" />
                    <div className="text-xl flex-shrink-0">{item.icon || '📌'}</div>
                    <div className="flex-1 min-w-0">
                      {editingId === item.id ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <select value={editData.date} onChange={e => setEditData({ ...editData, date: e.target.value })} className={`px-2 py-1.5 rounded-lg border text-xs font-bold outline-none ${inputCls}`}>
                              {DATES.map(d => <option key={d} value={d}>{d}</option>)}
                              <option value="Generale">Generale</option>
                            </select>
                            <input type="time" value={editData.time} onChange={e => setEditData({ ...editData, time: e.target.value })} className={`px-2 py-1.5 rounded-lg border text-xs font-bold outline-none ${inputCls}`} />
                          </div>
                          <input type="text" value={editData.title} onChange={e => setEditData({ ...editData, title: e.target.value })} className={`w-full px-3 py-1.5 rounded-lg border text-sm font-bold outline-none ${inputCls}`} />
                          <input type="text" value={editData.description || ''} onChange={e => setEditData({ ...editData, description: e.target.value })} placeholder="Descrizione" className={`w-full px-3 py-1.5 rounded-lg border text-xs outline-none ${inputCls}`} />
                          <div className="flex gap-2">
                            <button onClick={handleSaveEdit} className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-xs font-black flex items-center gap-1"><Check size={12}/> Salva</button>
                            <button onClick={() => setEditingId(null)} className="px-3 py-1 bg-slate-500 text-white rounded-lg text-xs font-black flex items-center gap-1"><X size={12}/> Annulla</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-baseline gap-2 flex-wrap">
                            {item.time && <span className={`text-xs font-black tabular-nums ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>{item.time}</span>}
                            <span className="font-black text-sm">{item.title}</span>
                          </div>
                          {item.description && <p className="text-xs opacity-60 mt-0.5 leading-relaxed">{item.description}</p>}
                        </>
                      )}
                    </div>
                    {isAdmin && editingId !== item.id && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
                        <button onClick={() => handleEdit(item)} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50/20 transition-colors"><Pencil size={13} /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50/20 transition-colors"><Trash2 size={13} /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {(schedule || []).length === 0 && !isAdmin && (
          <div className="text-center py-12 opacity-30">
            <CalendarDays size={40} className="mx-auto mb-3" />
            <p className="font-bold text-sm">Il programma non è ancora stato pubblicato.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgramSection;
