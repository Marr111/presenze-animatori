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
// Quando qualcuno modifica i nomi nella colonna A del foglio,
// invia la lista aggiornata al sito Vercel.
// ============================================================
function onEdit(e) {
    // Anti-loop: se l'ultima scrittura programmatica è stata
    // meno di 15 secondi fa, ignora (evita ping-pong infinito)
    var lastSync = PropertiesService.getScriptProperties().getProperty('_syncing');
    if (lastSync && (new Date().getTime() - parseInt(lastSync)) < 15000) {
        return;
    }

    // Reagisci solo a modifiche nel foglio "Presenze"
    var editedSheet = e.range.getSheet();
    if (editedSheet.getName() !== "Presenze") return;

    // Reagisci solo a modifiche nella colonna A (nomi)
    if (e.range.getColumn() !== 1) return;

    // Ignora modifiche nelle prime 2 righe (intestazioni)
    if (e.range.getRow() <= 2) return;

    // Leggi tutti i nomi attuali dalla colonna A (a partire dalla riga 3)
    var sheet = e.source.getSheetByName("Presenze");
    var data = sheet.getDataRange().getValues();
    var names = [];
    for (var i = 2; i < data.length; i++) {
        var name = (data[i][0] || "").toString().trim();
        if (name &&
            !name.toLowerCase().includes("prezzo a pasto") &&
            !name.toLowerCase().includes("totali")) {
            names.push(name);
        }
    }

    // Invia la lista aggiornata al sito Vercel
    try {
        UrlFetchApp.fetch(VERCEL_URL + "/api/sync-from-sheet", {
            method: "post",
            contentType: "application/json",
            payload: JSON.stringify({
                secret: SYNC_SECRET,
                people: names
            }),
            muteHttpExceptions: true
        });
    } catch (err) {
        Logger.log("Sync to Vercel failed: " + err.message);
    }
}
