import React, { useState } from 'react';
import { Lightbulb, Send, Trash2, Check, X, Sparkles } from 'lucide-react';

const IdeaBoard = ({ ideas, darkMode, onAddIdea, onDeleteIdea, onUpdateIdea }) => {
  const [newIdea, setNewIdea] = useState('');
  const [editingIdea, setEditingIdea] = useState(null);

  const handleAdd = async () => {
    if (!newIdea.trim()) return;
    await onAddIdea(newIdea.trim());
    setNewIdea('');
  };

  const handleUpdate = async () => {
    if (!editingIdea || !editingIdea.text.trim()) return;
    await onUpdateIdea(editingIdea);
    setEditingIdea(null);
  };

  const card = darkMode
    ? 'bg-[#1e3a2a]/60 border-[#2a4a35]'
    : 'bg-green-50 border-green-100';

  return (
    <div className="flex flex-col h-full">
      <h2 className={`text-xl font-black mb-4 flex items-center gap-2 ${darkMode ? 'text-amber-300' : 'text-amber-600'}`}>
        <Lightbulb size={22} /> Idee
      </h2>

      {/* Input */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Nuova idea..."
          className={`flex-1 px-4 py-3 rounded-2xl border outline-none focus:ring-2 ring-[#c41e3a]/40 transition-all ${
            darkMode ? 'bg-[#0a1a0e] border-[#1e3a2a] text-white placeholder-white/30' : 'bg-white border-slate-200 placeholder-slate-400'
          }`}
          value={newIdea}
          onChange={e => setNewIdea(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
        />
        <button
          onClick={handleAdd}
          className="p-3 bg-[#c41e3a] text-white rounded-2xl hover:bg-[#a01830] hover:scale-105 transition-all shadow-lg shadow-[#c41e3a]/30"
        >
          <Send size={18} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
        {ideas.length === 0 && (
          <p className={`text-center py-8 text-sm italic opacity-40 ${darkMode ? 'text-white' : 'text-slate-600'}`}>
            Nessuna idea ancora... sii il primo! ✨
          </p>
        )}
        {ideas.map(idea => {
          const isEditing = editingIdea?.id === idea.id;
          return (
            <div key={idea.id} className={`p-3 rounded-2xl border group transition-all ${card}`}>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={editingIdea.text}
                    onChange={e => setEditingIdea({ ...editingIdea, text: e.target.value })}
                    onKeyDown={e => { if (e.key === 'Enter') handleUpdate(); if (e.key === 'Escape') setEditingIdea(null); }}
                    className={`flex-1 px-3 py-1.5 rounded-xl border outline-none focus:ring-2 ring-amber-400 text-sm font-bold ${
                      darkMode ? 'bg-[#0a1a0e] border-[#1e3a2a] text-white' : 'bg-white border-green-200'
                    }`}
                  />
                  <button onClick={handleUpdate} className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors">
                    <Check size={14} />
                  </button>
                  <button onClick={() => setEditingIdea(null)} className="p-1.5 rounded-lg bg-slate-500 text-white hover:bg-slate-600 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <p
                    className={`font-bold text-sm leading-tight italic opacity-90 flex-1 cursor-pointer ${darkMode ? 'text-emerald-200' : 'text-green-900'}`}
                    onClick={() => setEditingIdea({ id: idea.id, text: idea.text })}
                    title="Clicca per modificare"
                  >
                    "{idea.text}"
                  </p>
                  <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={() => setEditingIdea({ id: idea.id, text: idea.text })} className="text-slate-400 hover:text-amber-500 transition-colors p-1">
                      <Sparkles size={14} />
                    </button>
                    <button onClick={() => onDeleteIdea(idea.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IdeaBoard;
