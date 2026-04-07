export const DATES = ['Gio 2 Apr', 'Ven 3 Apr', 'Sab 4 Apr'];
export const TIME_SLOTS = ['Mattino', 'Pranzo', 'Pomeriggio', 'Cena', 'Sera', 'Notte'];
export const DAY_SLOTS = {
  'Gio 2 Apr': ['Cena', 'Sera', 'Notte'],
  'Ven 3 Apr': ['Mattino', 'Pranzo', 'Pomeriggio', 'Cena', 'Sera', 'Notte'],
  'Sab 4 Apr': ['Mattino', 'Pranzo', 'Pomeriggio', 'Cena']
};
export const MEAL_PRICE = 5;
export const COLORS = ['#c41e3a', '#2d7a4e', '#e8c84b', '#e74c3c', '#1a5c1a', '#d4a017', '#8e44ad', '#2980b9'];
export const DATE_MAP = {
  'Gio 2 Apr': '20260402',
  'Ven 3 Apr': '20260403',
  'Sab 4 Apr': '20260404'
};
export const TIME_MAP = {
  'Mattino':    { start: '090000', end: '120000' },
  'Pranzo':     { start: '120000', end: '143000' },
  'Pomeriggio': { start: '143000', end: '190000' },
  'Cena':       { start: '190000', end: '213000' },
  'Sera':       { start: '213000', end: '235900' },
  'Notte':      { start: '000000', end: '080000' }
};
export const INITIAL_PEOPLE = [
  'Matteo Casetta', 'Laura Casetta', 'Arianna Aloi', 'Beatrice Aloi',
  'Lorenzo Trucco 04', 'Lorenzo Trucco 08', 'Simone Cavaglià', 'Simone Casetta',
  'Gloria Romano', 'Vittoria Pelassa'
].sort((a, b) => a.localeCompare(b, 'it', { sensitivity: 'base' }));
export const ALL_PERIODS = DATES.flatMap(d => DAY_SLOTS[d].map(s => ({ date: d, slot: s })));
