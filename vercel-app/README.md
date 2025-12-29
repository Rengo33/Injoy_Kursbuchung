# INJOY Kursplan - Vercel App

Eine moderne Web-App zum Anzeigen und Buchen von Fitnesskursen bei INJOY Wolfsburg.

## 🚀 Deployment auf Vercel

### 1. Repository erstellen
```bash
cd vercel-app
git init
git add .
git commit -m "Initial commit"
```

### 2. Auf GitHub pushen
Erstelle ein neues Repository auf GitHub und pushe den Code:
```bash
git remote add origin https://github.com/DEIN_USERNAME/injoy-kursbuchung.git
git push -u origin main
```

### 3. Mit Vercel verbinden
1. Gehe zu [vercel.com](https://vercel.com)
2. Klicke auf "New Project"
3. Importiere dein GitHub Repository
4. **Wichtig:** Setze die Environment Variables:
   - `API_AUTH_TOKEN` - Token für Kursplan-Abfrage
   - `BOOKING_AUTH_TOKEN` - Token für Buchungen
   - `CENTER_ID` - Center ID (27)
   - `DOMAIN` - Domain (https://www.injoy-wolfsburg.de)
5. Klicke auf "Deploy"

## 💻 Lokale Entwicklung

```bash
# Dependencies installieren
npm install

# Development Server starten
npm run dev

# Öffne http://localhost:3000
```

## 🔧 Environment Variables

Erstelle eine `.env.local` Datei mit:

```
API_AUTH_TOKEN=dein_api_token
BOOKING_AUTH_TOKEN=dein_booking_token
CENTER_ID=27
DOMAIN=https://www.injoy-wolfsburg.de
```

## 📁 Projektstruktur

```
vercel-app/
├── app/
│   ├── api/
│   │   ├── kurse/route.ts      # API: Kurse laden
│   │   └── buchen/route.ts     # API: Kurs buchen
│   ├── globals.css             # Styles
│   ├── layout.tsx              # Root Layout
│   └── page.tsx                # Hauptseite
├── lib/
│   ├── config.ts               # Konfiguration
│   └── kurs-service.ts         # API Service
├── package.json
└── README.md
```

## ✨ Features

- 📅 Kursplan anzeigen (heute bis 2 Wochen)
- 🎫 Kurse direkt buchen
- 📋 Wartelisten-Anmeldung wenn voll
- 📱 Responsive Design (Mobile-freundlich)
- ⚡ Schnell dank Next.js & Vercel Edge
