// Modulo di gestione autenticazione (Firebase Auth + Modalità Ospite)
import { auth } from './firebase-config.js';
import { state, setCurrentUser, loadLocalData } from './state.js';

let onAuthChangedCallback = null;

export function initAuth(onAuthChanged) {
  onAuthChangedCallback = onAuthChanged;

  if (auth) {
    auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
        document.getElementById("authScreen")?.classList.add("hidden");
        if (onAuthChangedCallback) onAuthChangedCallback(user);
      } else if (!state.currentUser?.isGuest) {
        setCurrentUser(null);
        document.getElementById("authScreen")?.classList.remove("hidden");
        if (onAuthChangedCallback) onAuthChangedCallback(null);
      }
    });
  }
}

export async function handleAuth(e) {
  if (e) e.preventDefault();
  const errDiv = document.getElementById("authError");
  if (errDiv) errDiv.classList.add("hidden");

  if (!auth) {
    alert("Firebase Auth non è configurato o non è pronto. Puoi usare 'Continua come Ospite'.");
    return;
  }

  const email = document.getElementById("authEmail")?.value;
  const password = document.getElementById("authPassword")?.value;

  if (!email || !password) return;

  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch (err) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      try {
        await auth.createUserWithEmailAndPassword(email, password);
      } catch (createErr) {
        if (errDiv) {
          errDiv.innerText = createErr.message;
          errDiv.classList.remove("hidden");
        }
      }
    } else {
      if (errDiv) {
        errDiv.innerText = err.message;
        errDiv.classList.remove("hidden");
      }
    }
  }
}

export function continueAsGuest(onSuccess) {
  const guestUser = { email: "ospite@budget.app", isGuest: true };
  setCurrentUser(guestUser);
  document.getElementById("authScreen")?.classList.add("hidden");
  loadLocalData();
  if (onSuccess) onSuccess(guestUser);
}

export function logout() {
  if (state.currentUser && state.currentUser.isGuest) {
    setCurrentUser(null);
    document.getElementById("authScreen")?.classList.remove("hidden");
    return;
  }
  if (auth) {
    auth.signOut();
  }
}
