import React, { useState } from 'react';
import { MessageSquareWarning, X, Send, Activity } from 'lucide-react';
import { createIssue } from '../utils/api';

const IssueModal = ({ darkMode, onClose }) => {
  const [issueTitle, setIssueTitle] = useState('');
  const [issueBody, setIssueBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!issueTitle.trim() || !issueBody.trim()) return;
    setIsSubmitting(true);
    try {
      const data = await createIssue(issueTitle, issueBody);
      if (data.success) {
        alert('Segnalazione inviata con successo!');
        onClose();
      } else if (data.error === 'TOKEN_MISSING') {
        alert('Errore Server: GITHUB_TOKEN non configurato.');
      } else {
        alert('Errore durante l\'invio: ' + data.error);
      }
    } catch (e) {
      alert('Errore di rete: ' + e.message);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`max-w-md w-full p-6 rounded-[2rem] shadow-2xl relative ${
        darkMode ? 'bg-[#132019] border border-[#1e3a2a] text-white' : 'bg-white border border-slate-200 text-slate-900'
      }`}>
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-full transition ${darkMode ? 'hover:bg-[#1e3a2a]' : 'hover:bg-slate-100'}`}
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
          <MessageSquareWarning className="text-amber-500" /> Segnala Problema
        </h2>
        <p className="text-sm opacity-60 mb-6">Verrà trasformata in una issue su GitHub automaticamente.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">Titolo *</label>
            <input
              type="text"
              value={issueTitle}
              onChange={e => setIssueTitle(e.target.value)}
              placeholder="Es: Il grafico dei pasti si sovrappone"
              className={`w-full px-4 py-3 rounded-2xl border outline-none focus:ring-2 ring-[#c41e3a]/40 ${
                darkMode ? 'bg-[#0a1a0e] border-[#1e3a2a] text-white' : 'bg-slate-50 border-slate-200'
              }`}
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest opacity-50 mb-2">Descrizione *</label>
            <textarea
              value={issueBody}
              onChange={e => setIssueBody(e.target.value)}
              rows={4}
              placeholder="Descrivi il problema nel dettaglio..."
              className={`w-full px-4 py-3 rounded-2xl border outline-none focus:ring-2 ring-[#c41e3a]/40 resize-none custom-scrollbar ${
                darkMode ? 'bg-[#0a1a0e] border-[#1e3a2a] text-white' : 'bg-slate-50 border-slate-200'
              }`}
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !issueTitle.trim() || !issueBody.trim()}
            className="w-full mt-2 bg-[#c41e3a] text-white py-4 rounded-2xl font-black uppercase text-sm hover:bg-[#a01830] disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#c41e3a]/30"
          >
            {isSubmitting ? <Activity className="animate-spin" size={18} /> : <Send size={18} />}
            Invia Segnalazione
          </button>
        </div>
      </div>
    </div>
  );
};

export default IssueModal;
