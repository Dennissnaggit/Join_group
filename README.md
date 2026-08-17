# Join

Join ist eine responsive Kanban-Anwendung zur Organisation von Aufgaben und Kontakten. Aufgaben lassen sich erstellen, bearbeiten, priorisieren und per Drag-and-drop durch die Bereiche **To do**, **In progress**, **Await feedback** und **Done** bewegen.

## Funktionen

- Registrierung und Anmeldung mit Firebase Authentication
- Gastzugang ohne Benutzerkonto
- Übersicht mit Kennzahlen zu offenen und erledigten Aufgaben
- Kanban-Board mit Drag-and-drop
- Erstellen, Bearbeiten und Löschen von Aufgaben
- Prioritäten, Kategorien, Fälligkeitsdaten und Subtasks
- Kontaktverwaltung
- Speicherung angemeldeter Benutzer in Firebase Firestore
- Lokale Speicherung der Gastdaten im Browser
- Responsive Darstellung für Desktop und mobile Geräte
- Hilfe, Datenschutzerklärung und Impressum

## Verwendete Technologien

- HTML5
- CSS3
- JavaScript (ES Modules)
- [Bootstrap 5](https://getbootstrap.com/)
- [Firebase](https://firebase.google.com/) Authentication und Firestore
- Firebase Hosting

## Projekt lokal starten

### Voraussetzungen

- Ein aktueller Browser
- [Node.js](https://nodejs.org/) inklusive npm
- Ein lokaler Webserver, zum Beispiel die VS-Code-Erweiterung **Live Server**

### Installation

Repository klonen und in den Projektordner wechseln:

```bash
git clone <REPOSITORY-URL>
cd Join_group
```

Abhängigkeiten installieren:

```bash
npm install
```

Anschließend das Projekt über einen lokalen Webserver öffnen. Mit Live Server kann dazu die `index.html` gestartet werden. Alternativ funktioniert beispielsweise:

```bash
npx serve .
```

Die im Terminal angezeigte lokale Adresse im Browser öffnen.

> Die Anwendung sollte nicht direkt über `file://` geöffnet werden, da HTML-Komponenten dynamisch geladen werden und JavaScript-Module einen Webserver benötigen.

## Nutzung

1. Auf der Startseite registrieren oder mit einem vorhandenen Konto anmelden.
2. Alternativ **Guest Log in** wählen, um die Anwendung ohne Konto auszuprobieren.
3. Über **Add Task** eine Aufgabe mit Kategorie, Priorität, Kontakten und optionalen Subtasks anlegen.
4. Aufgaben auf dem Board per Drag-and-drop zwischen den Statusspalten verschieben.
5. Kontakte unter **Contacts** hinzufügen, bearbeiten oder löschen.

Beim Gastzugang werden Aufgaben und Kontakte nur im `localStorage` des jeweiligen Browsers gespeichert. Registrierte Benutzer speichern ihre Daten benutzerbezogen in Firestore.

## Projektstruktur

```text
Join_group/
├── assets/             # Logos, Icons, Bilder und Schriftarten
├── components/         # Wiederverwendbare HTML-Komponenten
├── pages/              # Ansichten der Anwendung
├── script/             # JavaScript-Module und Firebase-Anbindung
│   └── board/          # Aufgeteilte Board-Logik
├── style/              # Seiten- und Komponenten-Stylesheets
├── index.html          # Login und Einstiegspunkt
├── script.js           # Globale UI- und Layout-Funktionen
├── style.css           # Globale Styles
├── firebase.json       # Konfiguration für Firebase Hosting
└── package.json        # npm-Abhängigkeiten
```

## Firebase-Konfiguration

Die Firebase-Verbindung wird in `script/firebase.js` initialisiert. Für den Einsatz mit einem eigenen Firebase-Projekt müssen dort die Werte von `firebaseConfig` ersetzt und in der Firebase Console folgende Dienste eingerichtet werden:

- **Authentication** mit der Anmeldemethode E-Mail/Passwort
- **Cloud Firestore** für Benutzer, Aufgaben und Kontakte

Zusätzlich sollten passende Firestore-Sicherheitsregeln eingerichtet werden, damit Benutzer ausschließlich auf ihre eigenen Daten zugreifen können.

## Deployment

Das Repository enthält bereits eine `firebase.json` für Firebase Hosting. Nach Installation und Anmeldung bei der Firebase CLI kann die Anwendung bereitgestellt werden:

```bash
npm install -g firebase-tools
firebase login
firebase use <PROJECT-ID>
firebase deploy
```

## Hinweise

- Bootstrap wird aus `node_modules` eingebunden. Deshalb muss vor dem lokalen Start oder Deployment `npm install` ausgeführt werden.
- Die Firebase-Webkonfiguration ist clientseitig sichtbar. Der Schutz der Daten erfolgt über Authentication und korrekt konfigurierte Firestore-Sicherheitsregeln, nicht durch das Verbergen des API-Schlüssels.
