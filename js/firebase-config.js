// Inizializzazione e configurazione Firebase
export const firebaseConfig = {
  apiKey: "AIzaSyDFQbKY8HA83xRlFk_OMNIFF_BAQMuP8HI",
  authDomain: "gestione-spese-d905a.firebaseapp.com",
  databaseURL: "https://gestione-spese-d905a-default-rtdb.firebaseio.com",
  projectId: "gestione-spese-d905a",
  storageBucket: "gestione-spese-d905a.firebasestorage.app",
  messagingSenderId: "518124443080",
  appId: "1:518124443080:web:676fce0a4e6ad6168d9cfd",
  measurementId: "G-T6B3VVSZNQ"
};

let auth = null;
let db = null;

try {
  if (typeof firebase !== "undefined") {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    auth = firebase.auth();
    db = firebase.database();
  }
} catch (err) {
  console.warn("Inizializzazione Firebase:", err);
}

export { auth, db };
