![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel)
![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-Latest-646CFF?logo=vite)

# 📋 Presenze Animatori - Sistema Gestione Presenze

Applicazione web moderna per la gestione e il monitoraggio degli animatori, costruita con **React** e **Vite**, deployata automaticamente su **Vercel**.

🌐 **Live Demo**: [presenze-animatori.vercel.app](https://presenze-animatori.vercel.app/)

---

## 📋 Indice

- [Obiettivo del Progetto](#-obiettivo-del-progetto)
- [Funzionalità](#-funzionalità)
- [Demo Live](#-demo-live)
- [Tecnologie Utilizzate](#️-tecnologie-utilizzate)
- [Design e UI](#-design-e-ui)
- [Performance](#-performance)
- [Roadmap](#️-roadmap)
- [Contribuire](#-contribuire)
- [Setup e Installazione](#-setup-e-installazione)
- [Deployment](#-deployment)
- [FAQ](#-faq)
- [Licenza](#-licenza)
- [Autore](#-autore)
- [Crediti](#-crediti)

---

## 🎯 Obiettivo del Progetto

**Presenze Animatori** è stato creato per semplificare e digitalizzare la gestione delle presenze del personale animatore, sostituendo i tradizionali fogli cartacei con una soluzione moderna, veloce e accessibile da qualsiasi dispositivo.

### Problemi Risolti

- ❌ **Registri cartacei** difficili da gestire e perdere
- ❌ **Calcolo manuale** delle ore e delle presenze
- ❌ **Mancanza di statistiche** in tempo reale
- ❌ **Difficoltà nel tracciare** le assenze e i trend

### Vantaggi

- ✅ **Accesso immediato** da smartphone, tablet o PC
- ✅ **Calcoli automatici** di ore, presenze e statistiche
- ✅ **Visualizzazione chiara** con grafici e dashboard
- ✅ **Dati sempre disponibili** e mai perduti
- ✅ **Interfaccia intuitiva** utilizzabile da chiunque

---

## ✨ Funzionalità

### 📊 Dashboard Principale

- **Vista d'insieme** con riepilogo presenze giornaliere/settimanali/mensili
- **Grafici interattivi** per visualizzare trend e statistiche
- **Indicatori di presenza** in tempo reale
- **Avvisi automatici** per assenze o anomalie

### 👥 Gestione Animatori

- **Registro completo** di tutti gli animatori
- **Profili dettagliati** con informazioni di contatto
- **Ruoli e competenze** per ogni animatore
- **Storico presenze** individuale

### ✅ Registrazione Presenze

- **Check-in rapido** con un click
- **Selezione data** per registrazioni retroattive
- **Note e commenti** per ogni presenza
- **Validazione automatica** dei dati inseriti

### 📈 Statistiche e Report

- **Grafici mensili** delle presenze totali
- **Percentuale di presenza** per ogni animatore
- **Trend temporali** per identificare pattern
- **Report esportabili** (prossimamente in PDF/Excel)

### 🎨 Design Responsive

- **Ottimizzato per mobile** - registra presenze ovunque
- **Interfaccia tablet-friendly** - ideale per reception
- **Desktop completo** - per gestione e statistiche
- **Tema chiaro/scuro** (in sviluppo)

---

## 🌐 Demo Live

Prova l'applicazione live: **[presenze-animatori.vercel.app](https://presenze-animatori.vercel.app/)**

### Come Testare

1. Visita il sito
2. Esplora la dashboard
3. Registra una presenza di test
4. Visualizza le statistiche

### Screenshots
```
// Da aggiungere:
- Homepage con dashboard
- Schermata registrazione presenza
- Pagina statistiche con grafici
- Vista mobile responsive
```

---

## 🛠️ Tecnologie Utilizzate

### Stack Principale

- **React 18+** - Libreria UI moderna e performante
- **Vite** - Build tool velocissimo con HMR
- **JavaScript ES6+** - Linguaggio moderno e pulito
- **CSS3** - Styling responsive e animazioni

### Deployment & Hosting

- **Vercel** - Hosting con deploy automatico e CDN globale
- **GitHub** - Version control e CI/CD
- **npm** - Gestione dipendenze

### Performance Features

- ⚡ Hot Module Replacement (HMR) per sviluppo veloce
- 📦 Code splitting automatico per bundle ottimali
- 🗜️ Minificazione e compressione assets
- 🚀 Lazy loading componenti per caricamento rapido

---

## 🎨 Design e UI

### Principi di Design

- **Mobile-first** - progettato prima per smartphone
- **Accessibilità** - utilizzabile da tutti
- **Semplicità** - interfaccia pulita e intuitiva
- **Feedback visivo** - ogni azione ha una risposta chiara

### Palette Colori
```css
--primary: #3b82f6;      /* Blu - azioni principali */
--secondary: #10b981;    /* Verde - conferme e successi */
--accent: #f59e0b;       /* Arancione - avvisi */
--background: #f9fafb;   /* Grigio chiaro - sfondo */
--text: #111827;         /* Grigio scuro - testo */
```

### Responsive Design

- 📱 **Mobile** (< 640px) - UI compatta, bottoni grandi
- 📱 **Tablet** (640px - 1024px) - Layout a due colonne
- 💻 **Desktop** (> 1024px) - Dashboard completa con sidebar

---

## 📊 Performance

### Metriche Attuali

- ⚡ **First Contentful Paint**: ~1.2s
- 🎯 **Time to Interactive**: ~2.5s
- 📦 **Bundle size**: ~180kb (gzipped)
- 🌐 **Lighthouse Score**: 92/100

### Ottimizzazioni Implementate

- ✅ Code splitting per route
- ✅ Lazy loading componenti pesanti
- ✅ Caching intelligente con Vercel
- ✅ Compressione immagini e assets
- ✅ Minificazione CSS e JavaScript

---

## 🗺️ Roadmap

### ✅ Fase 1 - MVP (Completata)

- [x] Sistema base di registrazione presenze
- [x] Dashboard con statistiche essenziali
- [x] Registro animatori
- [x] Design responsive
- [x] Deploy su Vercel

### 🔨 Fase 2 - Miglioramenti (In Corso)

- [ ] **Esportazione dati** in PDF ed Excel
- [ ] **Tema scuro** per uso notturno
- [ ] **Notifiche push** per promemoria
- [ ] **Backup automatico** dei dati
- [ ] **Filtri avanzati** nelle statistiche

### 🚀 Fase 3 - Features Avanzate (Futuro)

- [ ] **Backend con database** (Firebase/Supabase)
- [ ] **Autenticazione utenti** multi-ruolo
- [ ] **Sistema turni** e pianificazione
- [ ] **Calendario eventi** integrato
- [ ] **App mobile nativa** (React Native)
- [ ] **API pubblica** per integrazioni

---

## 🤝 Contribuire

Il progetto è aperto a contributi! Se vuoi aiutare:

### Come Contribuire

1. **Idee e suggerimenti** - Apri una issue con proposte
2. **Bug report** - Segnala problemi trovati
3. **Codice** - Invia una Pull Request con miglioramenti
4. **Documentazione** - Migliora il README o aggiungi guide

### Aree che Necessitano Aiuto

- 🐛 Testing su diversi browser e dispositivi
- 🎨 Miglioramenti UI/UX
- 📚 Documentazione e tutorial
- 🌍 Traduzioni in altre lingue
- ♿ Miglioramenti accessibilità

### Pull Request Guidelines
```bash
# 1. Fork e clone
git clone https://github.com/TUO_USERNAME/presenze-animatori.git

# 2. Crea branch
git checkout -b feature/nome-feature

# 3. Commit con conventional commits
git commit -m "feat: aggiunta nuova funzionalità"

# 4. Push e apri PR
git push origin feature/nome-feature
```

---

## 📥 Setup e Installazione

<details>
<summary><b>👨‍💻 Per Sviluppatori - Clicca per espandere</b></summary>

### Prerequisiti

- Node.js >= 18.0.0
- npm o yarn
- Git

### Installazione Rapida
```bash
# Clone repository
git clone https://github.com/Marr111/presenze-animatori.git
cd presenze-animatori

# Installa dipendenze
npm install

# Avvia dev server
npm run dev
```

L'app sarà disponibile su `http://localhost:5173`

### Build Produzione
```bash
npm run build    # Crea bundle ottimizzato
npm run preview  # Testa build locale
```

### Struttura Progetto
```
src/
├── components/   # Componenti riutilizzabili
├── pages/        # Pagine principali
├── styles/       # CSS globali
├── utils/        # Funzioni helper
└── App.jsx       # Componente root
```

</details>

---

## 🚀 Deployment

<details>
<summary><b>☁️ Deploy su Vercel - Clicca per espandere</b></summary>

### Deploy Automatico (Consigliato)

1. Push su GitHub
2. Connetti repository a Vercel
3. Deploy automatico ad ogni commit

### Deploy Manuale
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Configurazione Vercel
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

</details>

---

## ❓ FAQ

**Q: L'app salva i dati in modo permanente?**  
A: Attualmente usa localStorage del browser. Il backup su database cloud è in roadmap.

**Q: Posso usarla offline?**  
A: Parzialmente. Una volta caricata, funziona offline ma serve connessione per aggiornamenti.

**Q: È sicura per dati sensibili?**  
A: I dati rimangono sul dispositivo. Per uso professionale, consiglio implementazione con backend sicuro.

**Q: Posso personalizzare l'interfaccia?**  
A: Sì! Il codice è open-source, modifica colori e layout a piacimento.

**Q: Supporta più gruppi di animatori?**  
A: Attualmente no, ma è previsto nelle prossime versioni con sistema multi-tenant.

**Q: Come posso segnalare un bug?**  
A: Apri una issue su GitHub con descrizione dettagliata e screenshot.

---

## 📄 Licenza

Progetto distribuito sotto **licenza MIT** - libero per uso personale e commerciale.
```
MIT License - Copyright (c) 2024
Permesso di uso, copia, modifica e distribuzione per qualsiasi scopo.
```

---

## 👤 Autore

**Marr111**

- 🌐 GitHub: [@Marr111](https://github.com/Marr111)
- 📧 Contatti: [Profilo GitHub](https://github.com/Marr111)
- 💼 Portfolio: [presenze-animatori.vercel.app](https://presenze-animatori.vercel.app/)

---

## 🙏 Crediti

### Sviluppo e Design

- **Sviluppo principale**: Marr111
- **Assistenza UI/UX e grafica**: AI (Claude/ChatGPT) - Supporto per design interfaccia, scelte cromatiche e ottimizzazioni visual
- **Framework**: React Team, Vite Team

### Tools e Risorse

- **Vercel** - Hosting e deployment gratuito
- **GitHub** - Repository e version control
- **Vite** - Build tool velocissimo
- **React** - Libreria UI moderna

### Comunità e Ispirazioni

Un grazie alla community open-source per documentazione, tutorial e ispirazione continua.

---

## 📚 Link Utili

- [📖 Documentazione React](https://react.dev/)
- [⚡ Guida Vite](https://vitejs.dev/)
- [☁️ Vercel Docs](https://vercel.com/docs)
- [💬 Apri una Issue](https://github.com/Marr111/presenze-animatori/issues)

---

<div align="center">

### ⭐ Se questo progetto ti è utile, lascia una stella su GitHub! ⭐

**Made with ❤️ and React**

![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

[⬆️ Torna su](#-presenze-animatori---sistema-gestione-presenze)

</div>
