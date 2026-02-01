![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel)
![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-Latest-646CFF?logo=vite)

# 📋 Presenze Animatori - Sistema Gestione Presenze

Applicazione web moderna per la gestione delle presenze degli animatori, costruita con **React** e **Vite**, deployata automaticamente su **Vercel**.

🌐 **Live Demo**: [presenze-animatori.vercel.app](https://presenze-animatori.vercel.app/)

---

## 📋 Indice

**Getting Started**
- [Caratteristiche](#-caratteristiche)
- [Demo Live](#-demo-live)
- [Tecnologie Utilizzate](#-tecnologie-utilizzate)
- [Installazione](#-installazione)

**Sviluppo**
- [Struttura Progetto](#-struttura-progetto)
- [Comandi Disponibili](#-comandi-disponibili)
- [Deployment](#-deployment)

**Altro**
- [Roadmap](#-roadmap)
- [Contribuire](#-contribuire)
- [Licenza](#-licenza)
- [Autore](#-autore)
- [Crediti](#-crediti)

---

## ✨ Caratteristiche

- ✅ **Gestione presenze** in tempo reale
- 👥 **Registro animatori** con profili dettagliati
- 📊 **Dashboard statistiche** con grafici e metriche
- 📱 **Design responsive** - ottimizzato per mobile e desktop
- ⚡ **Performance ottimizzate** grazie a Vite
- 🎨 **UI/UX moderna** e intuitiva
- 🔄 **Auto-deploy** su Vercel ad ogni commit
- 💾 **Persistenza dati** (localStorage/backend)
- 🌙 **Tema chiaro/scuro** (opzionale)

---

## 🌐 Demo Live

Visita l'applicazione live: **[presenze-animatori.vercel.app](https://presenze-animatori.vercel.app/)**

### Screenshots
```
// Aggiungere screenshots in futuro:
- Homepage
- Dashboard presenze
- Registro animatori
- Statistiche
```

---

## 🛠️ Tecnologie Utilizzate

### Frontend

| Tecnologia | Versione | Utilizzo |
|-----------|----------|----------|
| **React** | 18+ | Framework UI |
| **Vite** | Latest | Build tool e dev server |
| **JavaScript/JSX** | ES6+ | Linguaggio principale |
| **CSS3** | - | Styling |
| **React Router** | (se usato) | Navigazione SPA |

### Deployment & Tools

- **Vercel** - Hosting e CI/CD automatico
- **Git/GitHub** - Version control
- **npm** - Package manager
- **ESLint** - Code quality

### Librerie (se utilizzate)
```json
// Esempi comuni
"dependencies": {
  "react": "^18.x.x",
  "react-dom": "^18.x.x",
  "react-router-dom": "^6.x.x",
  // altre dipendenze...
}
```

---

## 📥 Installazione

### Prerequisiti

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 (o yarn/pnpm)
- **Git**

### 1. Clone Repository
```bash
git clone https://github.com/Marr111/presenze-animatori.git
cd presenze-animatori
```

### 2. Installa Dipendenze
```bash
npm install
```

### 3. Avvia Development Server
```bash
npm run dev
```

L'applicazione sarà disponibile su: **http://localhost:5173**

### 4. Build per Produzione
```bash
npm run build
```

I file ottimizzati saranno generati nella cartella `dist/`

---

## 📂 Struttura Progetto
```
presenze-animatori/
├── public/               # File statici
│   ├── favicon.ico
│   └── ...
├── src/
│   ├── assets/          # Immagini, icone, font
│   ├── components/      # Componenti React riutilizzabili
│   │   ├── Header.jsx
│   │   ├── Dashboard.jsx
│   │   ├── PresenzeList.jsx
│   │   └── ...
│   ├── pages/           # Pagine/views principali
│   │   ├── Home.jsx
│   │   ├── Animatori.jsx
│   │   └── Statistiche.jsx
│   ├── styles/          # File CSS/SCSS
│   │   ├── App.css
│   │   └── index.css
│   ├── utils/           # Utility functions
│   │   └── helpers.js
│   ├── App.jsx          # Componente root
│   └── main.jsx         # Entry point
├── .gitignore
├── index.html           # Template HTML
├── package.json
├── vite.config.js       # Configurazione Vite
└── README.md
```

---

## 🎮 Comandi Disponibili

### Development
```bash
# Avvia dev server con hot reload
npm run dev

# Avvia dev server e apri browser
npm run dev -- --open
```

### Build & Preview
```bash
# Build per produzione
npm run build

# Preview build locale
npm run preview

# Lint del codice
npm run lint
```

### Testing (se configurato)
```bash
# Run tests
npm run test

# Test coverage
npm run test:coverage
```

---

## 🚀 Deployment

### Deploy su Vercel (Automatico)

Il progetto è configurato per **auto-deploy** su Vercel:

1. **Push su GitHub** → Deploy automatico su Vercel
2. **Pull Request** → Preview deployment automatico
3. **Merge su main** → Deploy in produzione

### Deploy Manuale su Vercel
```bash
# Installa Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy in produzione
vercel --prod
```

### Configurazione Vercel

File `vercel.json` (se presente):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "framework": "vite"
}
```

### Variabili d'Ambiente

Se usi variabili d'ambiente, crea file `.env`:
```bash
# .env.local (non committare!)
VITE_API_URL=https://api.example.com
VITE_APP_NAME=Presenze Animatori
```

Aggiungi le stesse variabili su **Vercel Dashboard** → Settings → Environment Variables

---

## 🎯 Funzionalità Principali

### 1. Gestione Presenze

- ✅ Registra presenza giornaliera
- 📅 Visualizza calendario presenze
- 📊 Esporta report presenze

### 2. Dashboard Statistiche

- 📈 Grafici presenze mensili
- 🔢 Totale ore per animatore
- 📊 Tasso di presenza medio
- 📉 Trend presenze

---

## 🎨 Design e UI

### Palette Colori
```css
/* Colori principali */
--primary: #3b82f6;      /* Blu */
--secondary: #10b981;    /* Verde */
--accent: #f59e0b;       /* Arancione */
--background: #f9fafb;   /* Grigio chiaro */
--text: #111827;         /* Grigio scuro */
```

### Tipografia
```css
/* Font stack */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 
             'Segoe UI', sans-serif;
```

### Responsive Breakpoints
```css
/* Mobile first */
@media (min-width: 640px)  { /* sm */ }
@media (min-width: 768px)  { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

---

## 🔧 Configurazione Vite

### vite.config.js
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser'
  }
})
```

### Ottimizzazioni

- ⚡ **Code splitting** automatico
- 🗜️ **Minificazione** CSS e JS
- 📦 **Tree shaking** per bundle size ottimale
- 🖼️ **Ottimizzazione immagini** (se configurata)

---

## 🐛 Troubleshooting

### Problemi Comuni

| Problema | Soluzione |
|----------|-----------|
| **Port 5173 già in uso** | Cambia porta in `vite.config.js` o chiudi processo |
| **Build fallisce** | Verifica `node_modules`, esegui `npm install` |
| **Deploy Vercel fallisce** | Controlla logs su Vercel dashboard |
| **Stili non applicati** | Verifica import CSS in `main.jsx` |
| **Routing non funziona** | Aggiungi `vercel.json` con rewrites |

### Fix Routing su Vercel

Crea `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Clear Cache
```bash
# Rimuovi node_modules e lock file
rm -rf node_modules package-lock.json

# Reinstalla
npm install

# Clear cache Vite
rm -rf .vite
```

---

## 📊 Performance

### Metriche Target

- ⚡ **First Contentful Paint**: < 1.5s
- 🎯 **Time to Interactive**: < 3s
- 📦 **Bundle size**: < 200kb (gzipped)
- 🌐 **Lighthouse Score**: > 90

### Ottimizzazioni Implementate

- ✅ Lazy loading componenti
- ✅ Code splitting
- ✅ Image optimization
- ✅ Caching strategy
- ✅ Minificazione assets

---

## 🗺️ Roadmap

### ✅ Versione 1.0 (Attuale)

- [x] Sistema presenze base
- [x] Registro animatori
- [x] Dashboard statistiche
- [x] Deploy su Vercel

### 🔨 Versione 1.5 (Prossima)

- [ ] Autenticazione utenti
- [ ] Notifiche push
- [ ] Esportazione Excel/PDF
- [ ] Backup automatico dati
- [ ] Tema scuro

### 🚀 Versione 2.0 (Futuro)

- [ ] Backend API (Node.js/Firebase)
- [ ] Database cloud
- [ ] App mobile (React Native)
- [ ] Sistema turni
- [ ] Chat interna
- [ ] Calendario eventi

---

## 🤝 Contribuire

I contributi sono benvenuti! Segui questi passi:

### 1. Fork & Clone
```bash
# Fork su GitHub, poi:
git clone https://github.com/TUO_USERNAME/presenze-animatori.git
cd presenze-animatori
```

### 2. Crea Branch
```bash
git checkout -b feature/nuova-funzionalita
```

### 3. Sviluppo
```bash
# Installa dipendenze
npm install

# Avvia dev server
npm run dev

# Implementa le modifiche...
```

### 4. Test & Commit
```bash
# Verifica che tutto funzioni
npm run build
npm run preview

# Lint del codice
npm run lint

# Commit
git add .
git commit -m "feat: aggiunta nuova funzionalità"
```

### 5. Push & Pull Request
```bash
git push origin feature/nuova-funzionalita
```

Poi apri una **Pull Request** su GitHub!

### Convenzioni Commit

Usa [Conventional Commits](https://www.conventionalcommits.org/):
```
feat: nuova funzionalità
fix: correzione bug
docs: aggiornamento documentazione
style: formattazione codice
refactor: refactoring codice
test: aggiunta test
chore: task manutenzione
```

---

## 📄 Licenza

Questo progetto è distribuito sotto **licenza MIT**.
```
MIT License - Copyright (c) 2024

Permesso concesso a chiunque di usare, copiare, modificare e distribuire
questo software per qualsiasi scopo, con o senza fini di lucro.
```

---

## 👤 Autore

**Marr111**

- 🌐 GitHub: [@Marr111](https://github.com/Marr111)
- 📧 Email: [contattami su GitHub]
- 🌐 Portfolio: [presenze-animatori.vercel.app](https://presenze-animatori.vercel.app/)

---

## 🙏 Crediti

### Sviluppo

- **Progettazione e sviluppo principale**: Marr111
- **Assistenza design e grafica UI**: AI (Claude/ChatGPT)
- **Framework e librerie**: React Team, Vite Team

### Risorse e Ispirazioni

- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Vercel Docs](https://vercel.com/docs)
- Community open-source

### Tools Utilizzati

- **AI Assistant**: Claude/ChatGPT - Supporto per design UI/UX, debugging e ottimizzazioni grafiche
- **Vercel**: Hosting e deployment
- **GitHub**: Version control e collaborazione

---

## 📚 Risorse Utili

### Documentazione

- [React Docs](https://react.dev/)
- [Vite Guide](https://vitejs.dev/)
- [Vercel Platform](https://vercel.com/docs)
- [MDN Web Docs](https://developer.mozilla.org/)

### Tutorial e Guide

- [React Tutorial](https://react.dev/learn)
- [Vite Getting Started](https://vitejs.dev/guide/)
- [Deploy to Vercel](https://vercel.com/docs/concepts/deployments/overview)

### Community

- [React Discord](https://discord.gg/react)
- [Vite Discord](https://chat.vitejs.dev/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/reactjs)

---

## 🔐 Sicurezza

Se scopri una vulnerabilità di sicurezza, per favore **NON aprire una issue pubblica**. 

Invia invece un'email a: [tua-email] o usa la sezione Security di GitHub.

---

## 📈 Analytics e Monitoring (Opzionale)
```javascript
// Integrazione Google Analytics
// Aggiungi in index.html o usa react-ga

import ReactGA from 'react-ga4';
ReactGA.initialize('G-XXXXXXXXXX');
```

---

## ❓ FAQ

**Q: Come posso modificare i colori del tema?**  
A: Modifica le variabili CSS in `src/styles/index.css`

**Q: Posso usare questo progetto per scopi commerciali?**  
A: Sì, la licenza MIT lo permette

**Q: Come aggiungo un database?**  
A: Puoi integrare Firebase, Supabase o un backend custom

**Q: È responsive?**  
A: Sì, ottimizzato per mobile, tablet e desktop

**Q: Posso contribuire anche se sono principiante?**  
A: Assolutamente! Controlla le issue "good first issue"

---

<div align="center">

### ⭐ Se questo progetto ti è utile, lascia una stella! ⭐

**Made with ❤️ and React**

![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

[⬆️ Torna su](#-presenze-animatori---sistema-gestione-presenze)

</div>
