import { DATE_MAP, TIME_MAP, DAY_SLOTS, DATES, MEAL_PRICE, ALL_PERIODS } from './constants';

export const getInitials = (name) => {
  const initials = name.split(' ').filter(w => isNaN(w)).map(n => n[0]).join('').toUpperCase();
  return initials || '?';
};

export const calculateDebt = (person, availabilities) => {
  let meals = 0;
  DATES.forEach(d => {
    if (availabilities[person]?.[d]?.['Pranzo']) meals++;
    if (availabilities[person]?.[d]?.['Cena']) meals++;
  });
  return meals * MEAL_PRICE;
};

export const hasFilledIn = (person, availabilities) => {
  const userAvail = availabilities[person];
  if (!userAvail) return false;
  return DATES.some(d => DAY_SLOTS[d].some(s => userAvail[d]?.[s] === true));
};

export const countTotal = (date, slot, people, availabilities) =>
  people.filter(p => availabilities[p]?.[date]?.[slot] === true).length;

export const getICSDateStr = (dateLabel, slotName) => {
  const dateStr = DATE_MAP[dateLabel];
  const timeData = TIME_MAP[slotName];
  if (!dateStr || !timeData) return null;
  if (slotName === 'Notte') {
    const year = parseInt(dateStr.slice(0, 4));
    const month = parseInt(dateStr.slice(4, 6)) - 1;
    const day = parseInt(dateStr.slice(6, 8));
    const next = new Date(year, month, day + 1);
    const nextStr = `${next.getFullYear()}${String(next.getMonth() + 1).padStart(2, '0')}${String(next.getDate()).padStart(2, '0')}`;
    return { dtstart: `${nextStr}T${timeData.start}`, dtend: `${nextStr}T${timeData.end}` };
  }
  return { dtstart: `${dateStr}T${timeData.start}`, dtend: `${dateStr}T${timeData.end}` };
};

export const downloadICS = (currentUser, availabilities) => {
  let icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//TriduoTracker//IT\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n`;
  const userSlots = availabilities[currentUser] || {};
  let eventCount = 0;
  Object.keys(userSlots).forEach(dateLabel => {
    const slots = userSlots[dateLabel];
    if (!slots) return;
    Object.keys(slots).forEach(slotName => {
      if (slots[slotName]) {
        const dates = getICSDateStr(dateLabel, slotName);
        if (dates) {
          eventCount++;
          icsContent += `BEGIN:VEVENT\nSUMMARY:Triduo 2026 - Turno ${slotName}\nDTSTART:${dates.dtstart}\nDTEND:${dates.dtend}\nDESCRIPTION:Turno confermato per ${currentUser}.\nLOCATION:Casa Alpina\nSTATUS:CONFIRMED\nEND:VEVENT\n`;
        }
      }
    });
  });
  icsContent += `END:VCALENDAR`;
  if (eventCount === 0) { alert('Nessun turno selezionato!'); return; }
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `Triduo_${currentUser.replace(/\s+/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToCSV = (people, availabilities) => {
  let csvContent = 'Nome,' + ALL_PERIODS.map(p => `${p.date} ${p.slot}`).join(',') + ',Totale Debito\n';
  people.forEach(p => {
    let row = `${p},`;
    row += ALL_PERIODS.map(per => availabilities[p]?.[per.date]?.[per.slot] ? 'X' : '').join(',');
    row += `,${calculateDebt(p, availabilities)}€`;
    csvContent += row + '\n';
  });
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'triduo_report.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

export const computeDishwasherSchedule = (people, availabilities) => {
  const schedule = [];
  const washCounts = {};
  people.forEach(p => { washCounts[p] = 0; });
  DATES.forEach(date => {
    ['Pranzo', 'Cena'].forEach(slot => {
      if (!DAY_SLOTS[date].includes(slot)) return;
      const presentPeople = people.filter(p => availabilities[p]?.[date]?.[slot]);
      const sortedCandidates = [...presentPeople].sort((a, b) => {
        const countDiff = washCounts[a] - washCounts[b];
        if (countDiff !== 0) return countDiff;
        return a.localeCompare(b);
      });
      const crew = sortedCandidates.slice(0, 3);
      crew.forEach(p => { washCounts[p]++; });
      schedule.push({ date, slot, crew, totalPresent: presentPeople.length, presentPeople });
    });
  });
  return schedule;
};

export const formatFirstName = (fullName, allPeople) => {
  const parts = fullName.split(' ');
  const first = parts[0];
  const sameFirstNames = allPeople.filter(p => p.split(' ')[0] === first && p !== fullName);
  if (sameFirstNames.length === 0) return first;

  const myRest = fullName.substring(first.length + 1);
  let charsToTake = 1;

  while (charsToTake <= myRest.length) {
    const myPrefix = myRest.substring(0, charsToTake).toLowerCase();
    const stillConflict = sameFirstNames.some(p => {
      const otherRest = p.substring(first.length + 1);
      return otherRest.substring(0, charsToTake).toLowerCase() === myPrefix;
    });
    if (!stillConflict) break;
    charsToTake++;
  }

  const resultRest = myRest.substring(0, charsToTake);
  if (charsToTake >= myRest.length) {
    return `${first} ${resultRest}`;
  }
  return `${first} ${resultRest}.`;
};
