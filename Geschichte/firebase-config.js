// =========================================================
// FIREBASE CONFIGURATION
// =========================================================
//
// WICHTIG: Ersetze die Werte unten mit deiner Firebase-Config!
//
// So bekommst du deine Config:
// 1. Gehe zu https://console.firebase.google.com
// 2. Klicke "Create Project" (kostenlos mit Spark-Plan)
// 3. Gib einen Namen ein, z.B. "isla-leones"
// 4. Auf der Projekt-Seite: Klicke das Zahnrad (Settings) → "Project Settings"
// 5. Scrolle runter zu "Your apps" und klicke "</>" (Web)
// 6. Kopiere die ganze Config (die Werte mit apiKey, projectId, etc.)
// 7. Ersetze die Werte unten
//
// Security Rules müssen auch gesetzt werden:
// 1. Gehe zu Firestore Database
// 2. Klicke "Rules" oben
// 3. Ersetze mit der Config in app.js (siehe dort)
// 4. "Publish" klicken

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// ERSETZE DIESE WERTE:
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialisiere Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

console.log("✓ Firebase initialisiert für Projekt:", firebaseConfig.projectId);
