// ============================================================
// PRESENZE ANIMATORI — Google Apps Script
// ============================================================
// Questo file è una copia di riferimento dello script che gira
// nel Google Sheet. Per applicare le modifiche, incollale
// nello Script Editor del foglio (Estensioni → Apps Script).
// ============================================================

var SPREADSHEET_ID = "1ekTnim4mHdvqKjrvnTxits1B1-VzwB4QMgE_lF3mNys";

// --- SYNC CONFIG ---
var VERCEL_URL = "https://presenze-animatori.vercel.app";
var SYNC_SECRET = "trd26_sync_Kx7mP9qR";

// Mappa delle colonne per le presenze
// La colonna 1 è il Nome, quindi la prima presenza inizia dalla colonna 2
var COL_MAP = {
  "Gio 2 Apr": { "Cena": 1, "Sera": 2, "Notte": 3 },
  "Ven 3 Apr": { "Mattino": 4, "Pranzo": 5, "Pomeriggio": 6, "Cena": 7, "Sera": 8, "Notte": 9 },
  "Sab 4 Apr": { "Mattino": 10, "Pranzo": 11, "Pomeriggio": 12, "Cena": 13 }
};

// ============================================================
// saveData — Scrive i dati dal sito al foglio Google
// Supporta l'array `people` per aggiungere/rimuovere righe
// ============================================================
function saveData(ss, fullData) {
    var availabilities = fullData.availabilities || {};
    var ideas = fullData.ideas || [];
    var schedule = fullData.schedule || [];
    var paidUsers = fullData.paidUsers || [];
    var people = fullData.people || []; // Array nomi dal sito

    var mainSheet = ss.getSheetByName("Presenze") || ss.getSheets()[0];
    var data = mainSheet.getDataRange().getValues();
    var existingNames = [];
    var prezzoIndex = -1;

    // Trova i nomi che sono già nel foglio e cerca la riga "Prezzo a pasto"
    for (var i = 2; i < data.length; i++) {
        var rowName = (data[i][0] || "").toString().trim();
        if (rowName.toLowerCase().includes("prezzo a pasto")) {
            prezzoIndex = i + 1; // +1 perché getRange usa indici da 1
            break;
        }
        if (rowName && !rowName.toLowerCase().includes("totali")) {
            existingNames.push(rowName);
        }
    }

    // --- RIMOZIONE: Se people è fornito, rimuovi dal foglio chi non è più nella lista ---
    if (people.length > 0) {
        var namesToRemove = [];
        for (var i = 0; i < existingNames.length; i++) {
            if (people.indexOf(existingNames[i]) === -1) {
                namesToRemove.push(existingNames[i]);
            }
        }

        if (namesToRemove.length > 0) {
            // Rimuovi dal basso verso l'alto per non spostare gli indici
            var freshData = mainSheet.getDataRange().getValues();
            for (var i = freshData.length - 1; i >= 2; i--) {
                var rowName = (freshData[i][0] || "").toString().trim();
                if (namesToRemove.indexOf(rowName) !== -1) {
                    mainSheet.deleteRow(i + 1);
                }
            }
            // Ricarica i dati dopo le rimozioni
            data = mainSheet.getDataRange().getValues();
            existingNames = [];
            prezzoIndex = -1;
            for (var i = 2; i < data.length; i++) {
                var rowName = (data[i][0] || "").toString().trim();
                if (rowName.toLowerCase().includes("prezzo a pasto")) {
                    prezzoIndex = i + 1;
                    break;
                }
                if (rowName && !rowName.toLowerCase().includes("totali")) {
                    existingNames.push(rowName);
                }
            }
        }
    }

    // --- AGGIUNTA: Trova i nomi nuovi da inserire ---
    var namesToUse = people.length > 0 ? people : Object.keys(availabilities);
    var newNames = [];
    for (var i = 0; i < namesToUse.length; i++) {
        if (existingNames.indexOf(namesToUse[i]) === -1) {
            newNames.push(namesToUse[i]);
        }
    }

    // Se ci sono nuovi utenti, inserisci le nuove righe
    if (newNames.length > 0) {
        if (prezzoIndex !== -1) {
            // Inserisce nuove righe vuote esattamente PRIMA della riga "Prezzo a pasto"
            mainSheet.insertRowsBefore(prezzoIndex, newNames.length);
            // Scrive i nuovi nomi nelle righe appena create
            for (var k = 0; k < newNames.length; k++) {
                mainSheet.getRange(prezzoIndex + k, 1).setValue(newNames[k]);
            }
        } else {
            // Se non trova "Prezzo a pasto", li aggiunge semplicemente in fondo
            var lastRow = mainSheet.getLastRow();
            for (var k = 0; k < newNames.length; k++) {
                mainSheet.getRange(lastRow + 1 + k, 1).setValue(newNames[k]);
            }
        }
        // Ricarichiamo i dati del foglio dopo aver aggiunto le righe
        data = mainSheet.getDataRange().getValues();
    }

    // Procediamo con l'inserimento delle "x" per le disponibilità
    // (COL_MAP deve essere definito separatamente nel progetto Apps Script)
    if (typeof COL_MAP !== "undefined" && data.length > 2) {
        for (var i = 2; i < data.length; i++) {
            var name = (data[i][0] || "").toString().trim();
            if (availabilities[name]) {
                for (var date in COL_MAP) {
                    if (availabilities[name][date]) {
                        for (var slot in COL_MAP[date]) {
                            var colIndex = COL_MAP[date][slot];
                            var status = availabilities[name][date][slot];
                            mainSheet.getRange(i + 1, colIndex + 1).setValue(status ? "x" : "");
                        }
                    }
                }
            }
        }
    }

    // Salva le altre schede (se updateGenericSheet è definita)
    if (typeof updateGenericSheet === "function") {
        updateGenericSheet(ss, "Idee", ["id", "text"], ideas);
        updateGenericSheet(ss, "Programma", ["id", "date", "time", "title", "description", "icon"], schedule);
        updateGenericSheet(ss, "Pagamenti", ["name"], paidUsers.map(function(n) { return { name: n }; }));
    }
}

// ============================================================
// testNuovoUtente — Funzione di debug
// ============================================================
function testNuovoUtente() {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var mainSheet = ss.getSheetByName("Presenze") || ss.getSheets()[0];
    var data = mainSheet.getDataRange().getValues();

    var log = "Righe trovate:\n";
    for (var i = 0; i < data.length; i++) {
        log += "Riga " + i + ": '" + data[i][0] + "'\n";
    }
    Logger.log(log);
}

// ============================================================
// loadData — Legge i dati dal foglio per il sito
// ============================================================
function loadData(ss) {
    var mainSheet = ss.getSheetByName("Presenze") || ss.getSheets()[0];
    var data = mainSheet.getDataRange().getValues();
    
    var availabilities = {};
    var people = [];
    var schedule = []; 
    var ideas = []; 
    var paidUsers = []; 

    // Costruisci mappa inversa
    var reverseMap = {};
    for (var date in COL_MAP) {
        for (var slot in COL_MAP[date]) {
            reverseMap[COL_MAP[date][slot]] = { date: date, slot: slot };
        }
    }

    // Estrai persone e disponibilità
    for (var i = 2; i < data.length; i++) {
        var name = (data[i][0] || "").toString().trim();
        if (!name || 
            name.toLowerCase().includes("prezzo a pasto") || 
            name.toLowerCase().includes("totali")) continue;
            
        people.push(name);
        availabilities[name] = {};
        
        for (var colIndex in reverseMap) {
            var cell = (data[i][parseInt(colIndex)] || "").toString().trim().toLowerCase();
            if (cell === "x" || cell === "✓" || cell === "true" || cell === "1") {
                var info = reverseMap[colIndex];
                if (!availabilities[name][info.date]) availabilities[name][info.date] = {};
                availabilities[name][info.date][info.slot] = true;
            }
        }
    }

    // Carica altre liste se esistono
    var ideasSheet = ss.getSheetByName("Idee");
    if (ideasSheet) {
        var ideasData = ideasSheet.getDataRange().getValues();
        for (var i = 1; i < ideasData.length; i++) {
            if (ideasData[i][0]) ideas.push({ id: ideasData[i][0], text: ideasData[i][1] });
        }
    }

    var scheduleSheet = ss.getSheetByName("Programma");
    if (scheduleSheet) {
        var schedData = scheduleSheet.getDataRange().getValues();
        for (var i = 1; i < schedData.length; i++) {
            if (schedData[i][0]) {
                schedule.push({
                    id: schedData[i][0], date: schedData[i][1], time: schedData[i][2],
                    title: schedData[i][3], description: schedData[i][4], icon: schedData[i][5]
                });
            }
        }
    }

    var paidSheet = ss.getSheetByName("Pagamenti");
    if (paidSheet) {
        var paidData = paidSheet.getDataRange().getValues();
        for (var i = 1; i < paidData.length; i++) {
            if (paidData[i][0]) paidUsers.push(paidData[i][0].toString().trim());
        }
    }

    return {
        availabilities: availabilities,
        people: people,
        ideas: ideas,
        schedule: schedule,
        paidUsers: paidUsers
    };
}

// ============================================================
// doGet — Gestisce richieste GET (load/save via URL params)
// Il sito Vercel usa GET per salvare (evita blocchi CORS/auth
// che Google applica alle POST verso Apps Script web app)
// ============================================================
function doGet(e) {
    try {
        var action = e.parameter.action || 'load';
        var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

        if (action === 'save' && e.parameter.payload) {
            // Flag anti-loop: impedisce che onEdit si ri-attivi
            // per le scritture programmatiche fatte da questo sync
            PropertiesService.getScriptProperties().setProperty('_syncing', String(new Date().getTime()));

            var data = JSON.parse(e.parameter.payload);
            saveData(ss, data);
            return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
                .setMimeType(ContentService.MimeType.JSON);
        }

        // Default: load
        if (typeof loadData === "function") {
            return ContentService.createTextOutput(JSON.stringify(loadData(ss)))
                .setMimeType(ContentService.MimeType.JSON);
        }
        return ContentService.createTextOutput(JSON.stringify({ error: "loadData not defined" }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({ error: error.message }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

// ============================================================
// doPost — Gestisce richieste POST con body JSON (dal sito)
// ============================================================
function doPost(e) {
    try {
        var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

        // Gestisci richieste POST con body JSON (dal sito Vercel)
        if (e.postData && e.postData.contents) {
            var body = JSON.parse(e.postData.contents);

            if (body.action === 'save' && body.payload) {
                // Flag anti-loop: impedisce che onEdit si ri-attivi
                // per le scritture programmatiche fatte da questo sync
                PropertiesService.getScriptProperties().setProperty('_syncing', String(new Date().getTime()));

                saveData(ss, body.payload);

                return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
                    .setMimeType(ContentService.MimeType.JSON);
            }
        }

        // Fallback: carica i dati
        if (typeof loadData === "function") {
            return ContentService.createTextOutput(JSON.stringify(loadData(ss)))
                .setMimeType(ContentService.MimeType.JSON);
        }
        return ContentService.createTextOutput(JSON.stringify({ error: "loadData not defined" }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({ error: error.message }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

// ============================================================
// onEdit — Sync Foglio → Sito (trigger installabile)
// Reagisce a qualsiasi modifica nel foglio "Presenze":
//   - Colonna A (nomi): aggiorna la lista persone
//   - Qualsiasi colonna: legge l'intera griglia e manda
//     le disponibilità aggiornate al sito Vercel.
// IMPORTANTE: deve essere un trigger INSTALLABILE (non semplice)
// perché usa UrlFetchApp e PropertiesService.
// ============================================================
function onEdit(e) {
    try {
        // Anti-loop: se l'ultima scrittura programmatica è stata
        // meno di 15 secondi fa, ignora (evita ping-pong infinito)
        var lastSync = PropertiesService.getScriptProperties().getProperty('_syncing');
        if (lastSync && (new Date().getTime() - parseInt(lastSync)) < 15000) {
            return;
        }

        // Reagisci solo a modifiche nel foglio "Presenze"
        var editedSheet = e.range.getSheet();
        if (editedSheet.getName() !== "Presenze") return;

        // Ignora modifiche nelle prime 2 righe (intestazioni)
        if (e.range.getRow() <= 2) return;

        // --- Costruisci la mappa inversa: numero colonna (0-based) → {date, slot} ---
        var reverseMap = {}; // colIndex -> { date, slot }
        for (var date in COL_MAP) {
            for (var slot in COL_MAP[date]) {
                reverseMap[COL_MAP[date][slot]] = { date: date, slot: slot };
            }
        }

        // --- Leggi l'intera griglia dal foglio ---
        var sheet = e.source.getSheetByName("Presenze");
        var data = sheet.getDataRange().getValues();

        var names = [];
        var availabilities = {};

        for (var i = 2; i < data.length; i++) {
            var name = (data[i][0] || "").toString().trim();
            if (!name ||
                name.toLowerCase().includes("prezzo a pasto") ||
                name.toLowerCase().includes("totali")) {
                continue;
            }
            names.push(name);
            availabilities[name] = {};

            // Leggi le X per ogni colonna mappata
            for (var colIndex in reverseMap) {
                var cell = (data[i][parseInt(colIndex)] || "").toString().trim().toLowerCase();
                var isChecked = (cell === "x" || cell === "✓" || cell === "true" || cell === "1");
                if (isChecked) {
                    var info = reverseMap[colIndex];
                    if (!availabilities[name][info.date]) {
                        availabilities[name][info.date] = {};
                    }
                    availabilities[name][info.date][info.slot] = true;
                }
            }
        }

        // Invia la lista aggiornata + disponibilità al sito Vercel
        try {
            e.source.toast("Invio dati a Vercel in corso...", "Sincronizzazione");
            
            var payload = {
                secret: SYNC_SECRET,
                people: names,
                availabilities: availabilities
            };
            
            var response = UrlFetchApp.fetch(VERCEL_URL + "/api/sync-from-sheet", {
                method: "post",
                contentType: "application/json",
                payload: JSON.stringify(payload),
                muteHttpExceptions: true
            });
            
            Logger.log("Sync to Vercel: " + response.getContentText());
            var code = response.getResponseCode();
            
            if (code >= 200 && code < 300) {
                e.source.toast("✅ Sincronizzazione sito completata (" + code + ")", "Successo", 3);
            } else {
                e.source.toast("⚠️ Vercel ha risposto con Errore " + code + ": " + response.getContentText(), "Avviso Vercel", -1);
            }
            
        } catch (err) {
            Logger.log("Sync to Vercel failed: " + err.message);
            e.source.toast("🔴 Errore fetch verso Vercel: " + err.message, "Errore di Rete", -1);
        }
    } catch (globalErr) {
        if (e && e.source) {
            e.source.toast("🔴 ERRORE CRITICO script onEdit: " + globalErr.message, "Errore Script", -1);
        }
    }
}
