import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export const SHEET_ID = process.env.GOOGLE_SHEET_ID || '1ekTnim4mHdvqKjrvnTxits1B1-VzwB4QMgE_lF3mNys';

// Google Sheets Auth
const getDoc = async () => {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!serviceAccountEmail || !privateKey) {
    throw new Error('Mancano le credenziali Google (GOOGLE_SERVICE_ACCOUNT_EMAIL o GOOGLE_PRIVATE_KEY)');
  }

  const auth = new JWT({
    email: serviceAccountEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const doc = new GoogleSpreadsheet(SHEET_ID, auth);
  await doc.loadInfo();
  return doc;
};

const COL_MAP = {
  'Gio 2 Apr': { 'Cena': 1, 'Sera': 2, 'Notte': 3 },
  'Ven 3 Apr': { 'Mattino': 4, 'Pranzo': 5, 'Pomeriggio': 6, 'Cena': 7, 'Sera': 8, 'Notte': 9 },
  'Sab 4 Apr': { 'Mattino': 10, 'Pranzo': 11, 'Pomeriggio': 12, 'Cena': 13 }
};

export const loadFromSheets = async () => {
  const doc = await getDoc();
  const mainSheet = doc.sheetsByTitle['Presenze'] || doc.sheetsByIndex[0];
  await mainSheet.loadHeaderRow(2); // Headers are on row 2 in the new sheet
  const rows = await mainSheet.getRows();
  
  const availabilities = {};
  const people = [];

  rows.forEach(row => {
    const firstColValue = row.get(mainSheet.headerValues[0]) || '';
    const name = firstColValue.trim();
    if (!name || name.toLowerCase().includes('totali') || name.toLowerCase().includes('prezzo')) return;
    
    people.push(name);
    availabilities[name] = {};
    
    Object.entries(COL_MAP).forEach(([date, slots]) => {
      availabilities[name][date] = {};
      Object.entries(slots).forEach(([slot, colIndex]) => {
        const val = row.get(mainSheet.headerValues[colIndex]);
        availabilities[name][date][slot] = (val?.toLowerCase() === 'x');
      });
    });
  });

  // Load other sheets (Idee, Programma, Pagamenti)
  let ideas = [];
  try {
    const ideasSheet = doc.sheetsByTitle['Idee'];
    if (ideasSheet) {
      const ideaRows = await ideasSheet.getRows();
      ideas = ideaRows.map(r => ({ id: Number(r.get('id')), text: r.get('text') }));
    }
  } catch (e) {}

  let schedule = [];
  try {
    const progSheet = doc.sheetsByTitle['Programma'];
    if (progSheet) {
      const progRows = await progSheet.getRows();
      schedule = progRows.map(r => ({
        id: r.get('id') ? Number(r.get('id')) : Date.now(),
        date: r.get('date'),
        time: r.get('time'),
        title: r.get('title'),
        description: r.get('description'),
        icon: r.get('icon')
      }));
    }
  } catch (e) {}

  let paidUsers = [];
  try {
    const paidSheet = doc.sheetsByTitle['Pagamenti'];
    if (paidSheet) {
      const paidRows = await paidSheet.getRows();
      paidUsers = paidRows.map(r => r.get('name')).filter(Boolean);
    }
  } catch (e) {}

  return { availabilities, ideas, people, schedule, paidUsers };
};

export const saveToSheets = async (fullData) => {
  const doc = await getDoc();
  const { availabilities, ideas, schedule, paidUsers } = fullData;

  const mainSheet = doc.sheetsByTitle['Presenze'] || doc.sheetsByIndex[0];
  await mainSheet.loadHeaderRow(2);
  let rows = await mainSheet.getRows();

  // 1. Ensure all people exist in the sheet
  const existingNames = rows.map(r => (r.get(mainSheet.headerValues[0]) || '').trim());
  const newNames = Object.keys(availabilities).filter(name => !existingNames.includes(name));

  if (newNames.length > 0) {
    // Find "Prezzo a pasto" row to insert before it
    let prezzoIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      const val = (rows[i].get(mainSheet.headerValues[0]) || '').toLowerCase();
      if (val.includes('prezzo a pasto')) {
        prezzoIndex = rows[i].rowNumber - 1; // 0-indexed pos in grid
        break;
      }
    }

    if (prezzoIndex !== -1) {
      await mainSheet.insertDimension('ROWS', { startIndex: prezzoIndex, endIndex: prezzoIndex + newNames.length });
    } else {
      // If not found, just append at the end of data
    }
    
    // Refresh rows after insertion
    rows = await mainSheet.getRows();
  }

  // 2. Save Availabilities
  for (const row of rows) {
    const name = (row.get(mainSheet.headerValues[0]) || '').trim();
    if (availabilities[name]) {
      Object.entries(COL_MAP).forEach(([date, slots]) => {
        Object.entries(slots).forEach(([slot, colIndex]) => {
          const isAvailable = availabilities[name][date]?.[slot];
          row.set(mainSheet.headerValues[colIndex], isAvailable ? 'x' : '');
        });
      });
      await row.save();
    } else if (newNames.includes(name)) {
        // This is a newly inserted row that we haven't matched yet? 
        // Actually the loop above handles it if names match.
    }
  }

  // 3. Handle newly inserted rows (filling the name if it was just an empty row)
  // We can also just iterate newNames and find the empty rows we added.
  // But the logic above should work if we filled the name during insert?
  // Since insertDimension just adds empty rows, we need to set the names.
  rows = await mainSheet.getRows(); // final refresh
  for (const name of newNames) {
    const emptyRow = rows.find(r => !(r.get(mainSheet.headerValues[0]) || '').trim());
    if (emptyRow) {
      emptyRow.set(mainSheet.headerValues[0], name);
      Object.entries(COL_MAP).forEach(([date, slots]) => {
        Object.entries(slots).forEach(([slot, colIndex]) => {
          const isAvailable = availabilities[name][date]?.[slot];
          emptyRow.set(mainSheet.headerValues[colIndex], isAvailable ? 'x' : '');
        });
      });
      await emptyRow.save();
    }
  }

  // 4. Save other sheets
  try {
    const ideasSheet = doc.sheetsByTitle['Idee'] || await doc.addSheet({ title: 'Idee', headerValues: ['id', 'text'] });
    await ideasSheet.clearRows();
    if (ideas?.length > 0) await ideasSheet.addRows(ideas.map(i => ({ id: i.id, text: i.text })));
  } catch (e) {}

  try {
    const progSheet = doc.sheetsByTitle['Programma'] || await doc.addSheet({ title: 'Programma', headerValues: ['id', 'date', 'time', 'title', 'description', 'icon'] });
    await progSheet.clearRows();
    if (schedule?.length > 0) await progSheet.addRows(schedule.map(s => ({ id: s.id, date: s.date, time: s.time, title: s.title, description: s.description, icon: s.icon })));
  } catch (e) {}

  try {
    const paidSheet = doc.sheetsByTitle['Pagamenti'] || await doc.addSheet({ title: 'Pagamenti', headerValues: ['name'] });
    await paidSheet.clearRows();
    if (paidUsers?.length > 0) await paidSheet.addRows(paidUsers.map(name => ({ name })));
  } catch (e) {}
};
