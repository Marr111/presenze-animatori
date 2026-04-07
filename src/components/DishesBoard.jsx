import React, { useState, useMemo } from 'react';
import { Utensils, AlertTriangle, GripVertical, RotateCcw } from 'lucide-react';
import { DATES, DAY_SLOTS } from '../utils/constants';
import { getInitials, computeDishwasherSchedule, formatFirstName } from '../utils/helpers';

const MEAL_SLOTS = ['Pranzo', 'Cena'];

const PersonChip = ({ name, allPeople, darkMode, draggable, onDragStart, onDragEnd, isDragging }) => (
  <div
    draggable={draggable}
    onDragStart={onDragStart}
    onDragEnd={onDragEnd}
    className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-grab active:cursor-grabbing select-none transition-all ${
      isDragging ? 'opacity-30 scale-95' : 'opacity-100'
    } ${
      darkMode
        ? 'bg-[#1e3a2a] border-[#2a4a35] hover:border-emerald-600'
        : 'bg-white border-slate-200 hover:border-emerald-400 shadow-sm'
    }`}
    title={name}
  >
    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#c41e3a] to-[#2d7a4e] text-white flex items-center justify-center font-black text-[10px] flex-shrink-0">
      {getInitials(name)}
    </div>
    <span className="font-bold text-xs whitespace-nowrap">{formatFirstName(name, allPeople)}</span>
    <GripVertical size={12} className="opacity-30 flex-shrink-0" />
  </div>
);

const DropZone = ({ mealKey, assignedPeople, allPresent, allPeople, darkMode, onDrop, onDragOver, onDragLeave, isOver, onRemovePerson }) => {
  const unassigned = allPresent.filter(p => !assignedPeople.includes(p));

  return (
    <div
      onDrop={e => onDrop(e, mealKey)}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={`min-h-[80px] rounded-2xl border-2 border-dashed p-3 transition-all ${
        isOver
          ? 'border-[#c41e3a] bg-[#c41e3a]/10 scale-[1.02]'
          : darkMode
            ? 'border-[#1e3a2a] bg-[#0a1a0e]/40'
            : 'border-slate-200 bg-slate-50/50'
      }`}
    >
      <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">
        Lavano i Piatti ({assignedPeople.length})
      </div>
      <div className="flex flex-wrap gap-2">
        {assignedPeople.map(p => (
          <div
            key={p}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all group ${
              darkMode ? 'bg-[#c41e3a]/20 border-[#c41e3a]/40 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#c41e3a] to-[#a01830] text-white flex items-center justify-center font-black text-[9px]">
              {getInitials(p)}
            </div>
            {formatFirstName(p, allPeople)}
            <button
              onClick={() => onRemovePerson(mealKey, p)}
              className="opacity-0 group-hover:opacity-100 ml-1 text-red-400 hover:text-red-600 transition-opacity"
              title="Rimuovi"
            >
              ×
            </button>
          </div>
        ))}
        {assignedPeople.length === 0 && (
          <p className="text-xs italic opacity-30">Trascina qui le persone...</p>
        )}
      </div>
    </div>
  );
};

const DishesBoard = ({ people, availabilities, dishAssignments, darkMode, onUpdateAssignments }) => {
  const [draggedPerson, setDraggedPerson] = useState(null);
  const [dragSource, setDragSource] = useState(null);
  const [dragOverTarget, setDragOverTarget] = useState(null);

  const autoSchedule = useMemo(() =>
    computeDishwasherSchedule(people, availabilities),
    [people, availabilities]
  );

  const getMealKey = (date, slot) => `${date}|${slot}`;

  const getAssigned = (mealKey) => dishAssignments?.[mealKey] ?? null;

  const finalScheduleMap = useMemo(() => {
    const map = {};
    DATES.forEach(date => {
      MEAL_SLOTS.forEach(slot => {
        if (!DAY_SLOTS[date].includes(slot)) return;
        const mealKey = getMealKey(date, slot);
        const autoEntry = autoSchedule.find(e => e.date === date && e.slot === slot);
        map[mealKey] = dishAssignments?.[mealKey] ?? (autoEntry?.crew || []);
      });
    });
    return map;
  }, [autoSchedule, dishAssignments]);

  const washCounts = useMemo(() => {
    const counts = {};
    people.forEach(p => counts[p] = 0);
    Object.values(finalScheduleMap).forEach(crew => {
      crew.forEach(p => {
        if (counts[p] !== undefined) counts[p]++;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'it', { sensitivity: 'base' }));
  }, [finalScheduleMap, people]);

  const handleDragStart = (e, person, sourceKey) => {
    setDraggedPerson(person);
    setDragSource(sourceKey);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e, targetKey) => {
    e.preventDefault();
    if (!draggedPerson) return;

    let newAssignments = { ...dishAssignments };

    // Remove from source zone if dragged from an assigned zone
    if (dragSource && dragSource !== 'pool') {
      newAssignments[dragSource] = (newAssignments[dragSource] || []).filter(p => p !== draggedPerson);
    }

    // Add to target zone
    if (targetKey !== 'pool') {
      const current = newAssignments[targetKey] || [];
      if (!current.includes(draggedPerson)) {
        newAssignments[targetKey] = [...current, draggedPerson];
      }
    }

    onUpdateAssignments(newAssignments);
    setDraggedPerson(null);
    setDragSource(null);
    setDragOverTarget(null);
  };

  const handleRemovePerson = (mealKey, person) => {
    const current = finalScheduleMap[mealKey];
    const newAssignments = {
      ...dishAssignments,
      [mealKey]: current.filter(p => p !== person),
    };
    onUpdateAssignments(newAssignments);
  };

  const handleResetMeal = (mealKey) => {
    const newAssignments = { ...dishAssignments };
    delete newAssignments[mealKey];
    onUpdateAssignments(newAssignments);
  };

  const card = darkMode
    ? 'bg-[#132019] border-[#1e3a2a]'
    : 'bg-white border-slate-100 shadow-sm';

  return (
    <div className="space-y-8">
      <div className={`p-4 rounded-2xl border flex items-start gap-3 text-sm ${
        darkMode ? 'bg-amber-900/20 border-amber-900/40 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700'
      }`}>
        <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
        <span>
          <strong>Come funziona:</strong> Trascina le carte-persona nella zona "Lavano i Piatti" del pasto desiderato.
          Se nessuno è assegnato manualmente, viene usato il calcolo automatico (chi ha lavato meno).
          Clicca <strong>↺</strong> per tornare all'automatico su un singolo pasto.
        </span>
      </div>

      <div className={`p-4 rounded-2xl border ${card}`}>
        <h3 className="text-xs font-black uppercase opacity-60 mb-3">Statistiche Turni Piatti</h3>
        <div className="flex flex-wrap gap-2">
          {washCounts.map(([name, count]) => (
            <div key={name} className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
              count === 0
                ? (darkMode ? 'bg-[#1e3a2a] border-[#2a4a35] text-white/50' : 'bg-slate-50 border-slate-200 text-slate-400')
                : (darkMode ? 'bg-[#c41e3a]/20 border-[#c41e3a]/40 text-red-300' : 'bg-red-50 border-red-200 text-red-700')
            }`}>
              {formatFirstName(name, people)}: <span className="font-black">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {DATES.map(date => {
        const dayMeals = MEAL_SLOTS.filter(s => DAY_SLOTS[date].includes(s));
        if (dayMeals.length === 0) return null;
        return (
          <div key={date}>
            <h3 className={`text-xs font-black uppercase tracking-widest mb-4 pb-2 border-b ${
              darkMode ? 'text-emerald-400 border-[#1e3a2a]' : 'text-emerald-700 border-green-100'
            }`}>
              🗓 {date}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dayMeals.map(slot => {
                const mealKey = getMealKey(date, slot);
                const presentPeople = people.filter(p => availabilities[p]?.[date]?.[slot]);
                const manualAssigned = getAssigned(mealKey);
                const isManual = manualAssigned !== null;
                const autoEntry = autoSchedule.find(e => e.date === date && e.slot === slot);
                const displayAssigned = isManual ? manualAssigned : (autoEntry?.crew || []);
                const isOver = dragOverTarget === mealKey;

                return (
                  <div key={slot} className={`p-5 rounded-3xl border ${card}`}>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Utensils size={14} className="text-[#c41e3a]" />
                        <span className="font-black text-sm uppercase">{slot}</span>
                        {isManual && (
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
                            darkMode ? 'bg-[#c41e3a]/20 text-red-300' : 'bg-red-100 text-red-600'
                          }`}>
                            Manuale
                          </span>
                        )}
                        {!isManual && (
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
                            darkMode ? 'bg-emerald-900/40 text-emerald-400' : 'bg-green-100 text-green-700'
                          }`}>
                            Auto
                          </span>
                        )}
                      </div>
                      {isManual && (
                        <button
                          onClick={() => handleResetMeal(mealKey)}
                          title="Torna al calcolo automatico"
                          className={`p-1.5 rounded-lg transition-colors text-sm ${
                            darkMode ? 'hover:bg-[#1e3a2a] text-white/40 hover:text-white/80' : 'hover:bg-slate-100 text-slate-400'
                          }`}
                        >
                          <RotateCcw size={13} />
                        </button>
                      )}
                    </div>

                    {/* Drop zone */}
                    <DropZone
                      mealKey={mealKey}
                      assignedPeople={displayAssigned}
                      allPresent={presentPeople}
                      allPeople={people}
                      darkMode={darkMode}
                      isOver={isOver}
                      onDrop={handleDrop}
                      onDragOver={e => { e.preventDefault(); setDragOverTarget(mealKey); }}
                      onDragLeave={() => setDragOverTarget(null)}
                      onRemovePerson={handleRemovePerson}
                    />

                    {/* Presenti / Pool */}
                    <div className="mt-3">
                      <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">
                        Presenti ({presentPeople.length}) — trascina ↑
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {presentPeople.map(p => (
                          <PersonChip
                            key={p}
                            name={p}
                            allPeople={people}
                            darkMode={darkMode}
                            draggable
                            isDragging={draggedPerson === p && dragSource === 'pool' + mealKey}
                            onDragStart={e => handleDragStart(e, p, 'pool' + mealKey)}
                            onDragEnd={() => { setDraggedPerson(null); setDragSource(null); }}
                          />
                        ))}
                        {presentPeople.length === 0 && (
                          <p className="text-xs italic opacity-30">Nessun presente a questo pasto.</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DishesBoard;
