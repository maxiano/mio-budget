/* ==========================================================================
   CONFIGURAZIONE STATO APPLICAZIONE E VARIABILI GLOBALI
   ========================================================================== */

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1; // 1 - 12
let budgetRef = null;

// Nomi dei mesi in italiano per la formattazione
const monthNames = [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
];

/* ==========================================================================
   INIZIALIZZAZIONE AL CARICAMENTO DEL DOM
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // Inizializza i selettori di anno e mese
    setupYearAndMonthSelectors();

    // Ascolto dello stato di autenticazione Firebase
    if (typeof auth !== "undefined" && auth) {
        auth.onAuthStateChanged(user => {
            const authScreen = document.getElementById("authScreen");

            if (user) {
                // Utente autenticato: nascondi la schermata di login
                if (authScreen) authScreen.classList.add("hidden");
                
                // Carica i dati del mese selezionato
                loadFirebaseData();
            } else {
                // Utente non autenticato: mostra overlay di login
                if (authScreen) authScreen.classList.remove("hidden");
                
                // Pulisci listener attivi
                if (budgetRef) {
                    budgetRef.off();
                    budgetRef = null;
                }
            }
        });
    }

    // Gestione chiusura modali con tasto ESC
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeIncomeModal();
            closeFixedModal();
        }
    });
});

/* ==========================================================================
   SELETTORI E NAVIGAZIONE TEMPORALE (Anno / Mese)
   ========================================================================== */

function setupYearAndMonthSelectors() {
    const yearSelect = document.getElementById("yearSelect");
    const monthSelect = document.getElementById("monthSelect");

    if (yearSelect) {
        yearSelect.innerHTML = "";
        const startYear = currentYear - 2;
        const endYear = currentYear + 3;

        for (let y = startYear; y <= endYear; y++) {
            const opt = document.createElement("option");
            opt.value = y;
            opt.textContent = y;
            if (y === currentYear) opt.selected = true;
            yearSelect.appendChild(opt);
        }

        yearSelect.addEventListener("change", (e) => {
            currentYear = parseInt(e.target.value, 10);
            loadFirebaseData();
        });
    }

    if (monthSelect) {
        monthSelect.value = currentMonth;
        monthSelect.addEventListener("change", (e) => {
            currentMonth = parseInt(e.target.value, 10);
            loadFirebaseData();
        });
    }
}

/* ==========================================================================
   AUTENTICAZIONE FIREBASE
   ========================================================================== */

function handleAuth(e) {
    if (e) e.preventDefault();

    const emailInput = document.getElementById("authEmail");
    const passwordInput = document.getElementById("authPassword");
    const errorElement = document.getElementById("authError");
    const submitBtn = document.getElementById("authSubmitBtn");

    if (!emailInput || !passwordInput) return;

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        showAuthError("Inserisci sia l'email che la password.");
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Autenticazione in corso...";
    }
    if (errorElement) errorElement.classList.add("hidden");

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log("Accesso eseguito:", userCredential.user.email);
            resetAuthForm();
        })
        .catch((error) => {
            if (error.code === 'auth/user-not-found') {
                auth.createUserWithEmailAndPassword(email, password)
                    .then((userCredential) => {
                        console.log("Nuovo account creato:", userCredential.user.email);
                        resetAuthForm();
                    })
                    .catch((createError) => handleAuthError(createError));
            } else {
                handleAuthError(error);
            }
        })
        .finally(() => {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Accedi / Registrati";
            }
        });
}

function handleAuthError(error) {
    let message = "Errore durante l'accesso.";
    switch (error.code) {
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            message = "Password non corretta o credenziali non valide.";
            break;
        case 'auth/invalid-email':
            message = "Formato e-mail non valido.";
            break;
        case 'auth/weak-password':
            message = "La password deve contenere almeno 6 caratteri.";
            break;
        case 'auth/too-many-requests':
            message = "Troppi tentativi falliti. Riprova più tardi.";
            break;
        default:
            message = error.message;
    }
    showAuthError(message);
}

function showAuthError(msg) {
    const errorElement = document.getElementById("authError");
    if (errorElement) {
        errorElement.textContent = msg;
        errorElement.classList.remove("hidden");
    } else {
        alert(msg);
    }
}

function resetAuthForm() {
    const emailInput = document.getElementById("authEmail");
    const passwordInput = document.getElementById("authPassword");
    const errorElement = document.getElementById("authError");

    if (emailInput) emailInput.value = "";
    if (passwordInput) passwordInput.value = "";
    if (errorElement) errorElement.classList.add("hidden");
}

function logout() {
    if (auth) {
        auth.signOut()
            .then(() => console.log("Logout effettuato."))
            .catch(err => console.error("Errore durante il logout:", err));
    }
}

/* ==========================================================================
   SINCRO DATI FIREBASE REALTIME DATABASE
   ========================================================================== */

function getMonthPath() {
    const user = auth.currentUser;
    if (!user) return null;
    const formattedMonth = String(currentMonth).padStart(2, '0');
    return `users/${user.uid}/years/${currentYear}/months/${formattedMonth}`;
}

function loadFirebaseData() {
    const path = getMonthPath();
    if (!path) return;

    if (budgetRef) {
        budgetRef.off();
    }

    budgetRef = database.ref(path);

    // Listener in tempo reale sulle modifiche dei dati
    budgetRef.on("value", (snapshot) => {
        const data = snapshot.val() || {};
        renderDashboard(data);
    }, (error) => {
        console.error("Errore di lettura da Firebase:", error);
    });
}

/* ==========================================================================
   RENDER DASHBOARD E CALCOLI
   ========================================================================== */

function renderDashboard(data) {
    const incomes = data.incomes || {};
    const expenses = data.expenses || {};
    const fixedExpenses = data.fixedExpenses || {};

    let totalIncome = 0;
    let totalExpense = 0;
    let totalFixed = 0;

    // Calcolo Totale Entrate
    Object.values(incomes).forEach(item => {
        totalIncome += parseFloat(item.amount || 0);
    });

    // Calcolo Totale Uscite
    Object.values(expenses).forEach(item => {
        totalExpense += parseFloat(item.amount || 0);
    });

    // Calcolo Totale Spese Fisse
    Object.values(fixedExpenses).forEach(item => {
        totalFixed += parseFloat(item.amount || 0);
    });

    const netBalance = totalIncome - totalExpense - totalFixed;

    // Aggiornamento KPI Card
    updateElementText("totalIncomeDisplay", `€ ${totalIncome.toFixed(2)}`);
    updateElementText("totalExpenseDisplay", `€ ${totalExpense.toFixed(2)}`);
    updateElementText("totalFixedDisplay", `€ ${totalFixed.toFixed(2)}`);
    updateElementText("netBalanceDisplay", `€ ${netBalance.toFixed(2)}`);

    // Styling del bilancio in base al segno
    const netBalanceEl = document.getElementById("netBalanceDisplay");
    if (netBalanceEl) {
        if (netBalance < 0) {
            netBalanceEl.classList.remove("text-emerald-600", "text-slate-800");
            netBalanceEl.classList.add("text-red-600");
        } else if (netBalance > 0) {
            netBalanceEl.classList.remove("text-red-600", "text-slate-800");
            netBalanceEl.classList.add("text-emerald-600");
        } else {
            netBalanceEl.classList.remove("text-red-600", "text-emerald-600");
            netBalanceEl.classList.add("text-slate-800");
        }
    }

    // Render delle liste
    renderIncomesList(incomes);
    renderExpensesList(expenses);
    renderFixedExpensesList(fixedExpenses);
}

function updateElementText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

/* ==========================================================================
   RENDER LISTE (ENTRATE, USCITE, SPESE FISSE)
   ========================================================================== */

function renderIncomesList(incomes) {
    const container = document.getElementById("incomesList");
    if (!container) return;

    container.innerHTML = "";
    const entries = Object.entries(incomes);

    if (entries.length === 0) {
        container.innerHTML = `<p class="text-sm text-slate-400 italic">Nessuna entrata registrata per questo mese.</p>`;
        return;
    }

    entries.forEach(([id, item]) => {
        const div = document.createElement("div");
        div.className = "flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm";
        div.innerHTML = `
            <div>
                <div class="font-medium text-slate-700 dark:text-slate-200">${escapeHtml(item.description)}</div>
                <div class="text-xs text-slate-400">${item.date || ''}</div>
            </div>
            <div class="flex items-center gap-3">
                <span class="font-semibold text-emerald-600 dark:text-emerald-400">+€ ${parseFloat(item.amount).toFixed(2)}</span>
                <button onclick="deleteItem('incomes', '${id}')" class="text-slate-400 hover:text-red-500 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

function renderExpensesList(expenses) {
    const container = document.getElementById("expensesList");
    if (!container) return;

    container.innerHTML = "";
    const entries = Object.entries(expenses);

    if (entries.length === 0) {
        container.innerHTML = `<p class="text-sm text-slate-400 italic">Nessuna spesa registrata per questo mese.</p>`;
        return;
    }

    entries.forEach(([id, item]) => {
        const div = document.createElement("div");
        div.className = "flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm";
        div.innerHTML = `
            <div>
                <div class="font-medium text-slate-700 dark:text-slate-200">${escapeHtml(item.description)}</div>
                <div class="text-xs text-slate-400">${item.category || 'Generale'} • ${item.date || ''}</div>
            </div>
            <div class="flex items-center gap-3">
                <span class="font-semibold text-red-600 dark:text-red-400">-€ ${parseFloat(item.amount).toFixed(2)}</span>
                <button onclick="deleteItem('expenses', '${id}')" class="text-slate-400 hover:text-red-500 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

function renderFixedExpensesList(fixedExpenses) {
    const container = document.getElementById("fixedExpensesList");
    if (!container) return;

    container.innerHTML = "";
    const entries = Object.entries(fixedExpenses);

    if (entries.length === 0) {
        container.innerHTML = `<p class="text-sm text-slate-400 italic">Nessuna spesa fissa configurata.</p>`;
        return;
    }

    entries.forEach(([id, item]) => {
        const div = document.createElement("div");
        div.className = "flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm";
        div.innerHTML = `
            <div>
                <div class="font-medium text-slate-700 dark:text-slate-200">${escapeHtml(item.description)}</div>
            </div>
            <div class="flex items-center gap-3">
                <span class="font-semibold text-amber-600 dark:text-amber-400">€ ${parseFloat(item.amount).toFixed(2)}</span>
                <button onclick="deleteItem('fixedExpenses', '${id}')" class="text-slate-400 hover:text-red-500 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

/* ==========================================================================
   OPERAZIONI CRUD (AGGIUNTA E ELIMINAZIONE)
   ========================================================================== */

function addIncome(e) {
    if (e) e.preventDefault();
    const descInput = document.getElementById("incomeDesc");
    const amountInput = document.getElementById("incomeAmount");

    if (!descInput || !amountInput) return;

    const description = descInput.value.trim();
    const amount = parseFloat(amountInput.value);

    if (!description || isNaN(amount) || amount <= 0) {
        alert("Inserisci una descrizione e un importo valido per l'entrata.");
        return;
    }

    const path = getMonthPath();
    if (!path) return;

    const newRef = database.ref(`${path}/incomes`).push();
    newRef.set({
        description: description,
        amount: amount,
        date: new Date().toISOString().split('T')[0]
    }).then(() => {
        descInput.value = "";
        amountInput.value = "";
        closeIncomeModal();
    }).catch(err => console.error("Errore aggiunta entrata:", err));
}

function addExpense(e) {
    if (e) e.preventDefault();
    const descInput = document.getElementById("expenseDesc");
    const amountInput = document.getElementById("expenseAmount");
    const catInput = document.getElementById("expenseCategory");

    if (!descInput || !amountInput) return;

    const description = descInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = catInput ? catInput.value : "Generale";

    if (!description || isNaN(amount) || amount <= 0) {
        alert("Inserisci una descrizione e un importo valido per la spesa.");
        return;
    }

    const path = getMonthPath();
    if (!path) return;

    const newRef = database.ref(`${path}/expenses`).push();
    newRef.set({
        description: description,
        amount: amount,
        category: category,
        date: new Date().toISOString().split('T')[0]
    }).then(() => {
        descInput.value = "";
        amountInput.value = "";
    }).catch(err => console.error("Errore aggiunta spesa:", err));
}

function addFixedExpense(e) {
    if (e) e.preventDefault();
    const descInput = document.getElementById("fixedDesc");
    const amountInput = document.getElementById("fixedAmount");

    if (!descInput || !amountInput) return;

    const description = descInput.value.trim();
    const amount = parseFloat(amountInput.value);

    if (!description || isNaN(amount) || amount <= 0) {
        alert("Inserisci una descrizione e un importo valido per la spesa fissa.");
        return;
    }

    const path = getMonthPath();
    if (!path) return;

    const newRef = database.ref(`${path}/fixedExpenses`).push();
    newRef.set({
        description: description,
        amount: amount
    }).then(() => {
        descInput.value = "";
        amountInput.value = "";
        closeFixedModal();
    }).catch(err => console.error("Errore aggiunta spesa fissa:", err));
}

function deleteItem(type, itemId) {
    if (!confirm("Sei sicuro di voler eliminare questa voce?")) return;

    const path = getMonthPath();
    if (!path) return;

    database.ref(`${path}/${type}/${itemId}`).remove()
        .catch(err => console.error("Errore eliminazione:", err));
}

/* ==========================================================================
   GESTIONE MODALI
   ========================================================================== */

function openIncomeModal() {
    const modal = document.getElementById("incomeModal");
    if (modal) modal.classList.remove("hidden");
}

function closeIncomeModal() {
    const modal = document.getElementById("incomeModal");
    if (modal) modal.classList.add("hidden");
}

function openFixedModal() {
    const modal = document.getElementById("fixedModal");
    if (modal) modal.classList.remove("hidden");
}

function closeFixedModal() {
    const modal = document.getElementById("fixedModal");
    if (modal) modal.classList.add("hidden");
}

/* ==========================================================================
   UTILITY
   ========================================================================== */

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>"']/g, (m) => {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[m];
    });
}
