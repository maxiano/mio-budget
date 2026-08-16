/* ==========================================================================
   CONFIGURAZIONE & DATI INIZIALI
   ========================================================================== */
const INITIAL_ACCOUNT_BALANCE = 5348.43;

const YEAR_MONTHS = {
    2026: [
        { key: "2026-01", label: "Gennaio 2026", baseIncome: 1901.90 },
        { key: "2026-02", label: "Febbraio 2026", baseIncome: 1901.90 },
        { key: "2026-03", label: "Marzo 2026", baseIncome: 1901.90 },
        { key: "2026-04", label: "Aprile 2026", baseIncome: 1901.90 },
        { key: "2026-05", label: "Maggio 2026", baseIncome: 1901.90 },
        { key: "2026-06", label: "Giugno 2026", baseIncome: 1901.90 },
        { key: "2026-07", label: "Luglio 2026", baseIncome: 1901.90 },
        { key: "2026-08", label: "Agosto 2026", baseIncome: 1901.90 },
        { key: "2026-09", label: "Settembre 2026", baseIncome: 1901.90 },
        { key: "2026-10", label: "Ottobre 2026", baseIncome: 1901.90 },
        { key: "2026-11", label: "Novembre 2026", baseIncome: 1901.90 },
        { key: "2026-12", label: "Dicembre 2026", baseIncome: 1901.90 }
    ]
};

const baseMonthlyFixed = [
    { title: "Affitto", amount: 620 },
    { title: "Mantenimento Valerio", amount: 350 },
    { title: "Spesa Cibo", amount: 250 },
    { title: "Prestito Compass", amount: 200 },
    { title: "Prestito Agos", amount: 151 },
    { title: "Luce e Gas (Accantonamento)", amount: 100 },
    { title: "Infortuni Generali", amount: 68 },
    { title: "TIM Fibra", amount: 30 },
    { title: "Iliad Mobile", amount: 10 }
];

const periodicExpenses = {
    "2026-05": [{ title: "TARI (Tassa Rifiuti)", amount: 110 }],
    "2026-09": [{ title: "Assicurazione Scooter", amount: 320 }],
    "2026-11": [{ title: "TARI (Tassa Rifiuti)", amount: 110 }]
};

/* ==========================================================================
   STATO DELL'APPLICAZIONE
   ========================================================================== */
let currentYear = 2026;
let currentMonthKey = "2026-08";
let monthlyData = {}; 
let budgetRef = null;

/* ==========================================================================
   INIZIALIZZAZIONE FIREBASE REALTIME DATABASE
   ========================================================================== */
let auth = null;
let db = null;

const firebaseConfig = {
  apiKey: "AIzaSyDFQbKY8HA83xRlFk_OMNIFF_BAQMuP8HI",
  authDomain: "gestione-spese-d905a.firebaseapp.com",
  databaseURL: "https://gestione-spese-d905a-default-rtdb.firebaseio.com",
  projectId: "gestione-spese-d905a",
  storageBucket: "gestione-spese-d905a.firebasestorage.app",
  messagingSenderId: "518124443080",
  appId: "1:518124443080:web:676fce0a4e6ad6168d9cfd",
  measurementId: "G-T6B3VVSZNQ"
};

if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    auth = firebase.auth();
    db = firebase.database();
}

/* ==========================================================================
   GESTORI EVENTI & LIFECYCLE
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
    setupYearAndMonthSelectors();
    
    if (auth) {
        auth.onAuthStateChanged(user => {
            const loginSection = document.getElementById("loginSection") || document.getElementById("authScreen");
            const appContent = document.getElementById("appContent") || document.getElementById("mainApp");

            if (user) {
                if (loginSection) loginSection.classList.add("hidden");
                if (loginSection) loginSection.style.display = "none";
                if (appContent) appContent.classList.remove("hidden");
                if (appContent) appContent.style.display = "block";
                loadFirebaseData();
            } else {
                if (loginSection) loginSection.classList.remove("hidden");
                if (loginSection) loginSection.style.display = "block";
                if (appContent) appContent.classList.add("hidden");
                if (appContent) appContent.style.display = "none";
                if (budgetRef) {
                    budgetRef.off();
                    budgetRef = null;
                }
            }
        });
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeIncomeModal();
            closeFixedModal();
        }
    });
});

// Esposizione nell'ambito globale per far funzionare l'evento inline onsubmit="handleAuth(event)"
window.handleAuth = function(event) {
    if (event) event.preventDefault();

    if (!auth) {
        alert("Servizio di autenticazione non disponibile. Verificare la connessione a Firebase.");
        return;
    }

    // Supporto sia per ID 'email'/'password' che 'authEmail'/'authPassword'
    const emailInput = document.getElementById("email") || document.getElementById("authEmail");
    const passwordInput = document.getElementById("password") || document.getElementById("authPassword");
    const errorDiv = document.getElementById("authError");

    if (!emailInput || !passwordInput) {
        console.error("Campi input email o password non trovati nel DOM.");
        return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        if (errorDiv) {
            errorDiv.innerText = "Inserisci email e password.";
            errorDiv.classList.remove("hidden");
        } else {
            alert("Inserisci email e password.");
        }
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            emailInput.value = "";
            passwordInput.value = "";
            if (errorDiv) errorDiv.classList.add("hidden");
        })
        .catch(error => {
            console.error("Errore di autenticazione:", error);
            if (errorDiv) {
                errorDiv.innerText = "Errore di accesso: " + error.message;
                errorDiv.classList.remove("hidden");
            } else {
                alert("Errore di accesso: " + error.message);
            }
        });
};

function setupYearAndMonthSelectors() {
    const yearSelect = document.getElementById("yearSelect");
    const monthSelect = document.getElementById("monthSelect");

    if (!yearSelect || !monthSelect) return;

    yearSelect.value = currentYear;
    updateMonthDropdownOptions();

    yearSelect.addEventListener("change", (e) => {
        currentYear = parseInt(e.target.value, 10);
        updateMonthDropdownOptions();
        const availableMonths = YEAR_MONTHS[currentYear] || [];
        if (availableMonths.length > 0) {
            currentMonthKey = availableMonths[0].key;
            monthSelect.value = currentMonthKey;
        }
        renderAll();
    });

    monthSelect.addEventListener("change", (e) => {
        currentMonthKey = e.target.value;
        renderAll();
    });
}

function updateMonthDropdownOptions() {
    const monthSelect = document.getElementById("monthSelect");
    if (!monthSelect) return;

    monthSelect.innerHTML = "";
    const months = YEAR_MONTHS[currentYear] || [];
    
    months.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m.key;
        opt.textContent = m.label;
        if (m.key === currentMonthKey) opt.selected = true;
        monthSelect.appendChild(opt);
    });
}

/* ==========================================================================
   SINCRONIZZAZIONE FIREBASE REALTIME DATABASE
   ========================================================================== */
function loadFirebaseData() {
    const user = auth ? auth.currentUser : null;
    if (!user || !db) return;

    if (budgetRef) budgetRef.off();

    budgetRef = db.ref(`users/${user.uid}/budgetData`);

    budgetRef.on("value", snapshot => {
        monthlyData = snapshot.val() || {};
        renderAll();
    }, error => {
        console.error("Errore durante il recupero dati da Realtime Database:", error);
    });
}

function saveDataToFirebase(monthKey) {
    const user = auth ? auth.currentUser : null;
    if (!user || !db) return;

    const dataToSave = monthlyData[monthKey] || { incomes: [], fixedOverrides: [], variableExpenses: [] };

    db.ref(`users/${user.uid}/budgetData/${monthKey}`)
        .set(dataToSave)
        .catch(error => {
            console.error("Errore nel salvataggio su Realtime Database:", error);
        });
}

/* ==========================================================================
   LOGICA DI CALCOLO
   ========================================================================== */
function getFixedExpensesForMonth(monthKey) {
    let list = baseMonthlyFixed.map(item => ({ ...item }));
    
    if (periodicExpenses[monthKey]) {
        list = list.concat(periodicExpenses[monthKey].map(item => ({ ...item })));
    }

    const savedData = monthlyData[monthKey];
    if (savedData && Array.isArray(savedData.fixedOverrides)) {
        savedData.fixedOverrides.forEach(override => {
            const index = list.findIndex(f => f.title === override.title);
            if (index !== -1) {
                list[index].amount = override.amount;
            } else {
                list.push({ title: override.title, amount: override.amount });
            }
        });
    }

    return list;
}

function calculateMonthSummary(monthKey) {
    const [yearStr] = monthKey.split("-");
    const yearNum = parseInt(yearStr, 10);
    const yearMonths = YEAR_MONTHS[yearNum] || [];
    const monthConf = yearMonths.find(m => m.key === monthKey) || { baseIncome: 1901.90 };

    const data = monthlyData[monthKey] || { incomes: [], fixedOverrides: [], variableExpenses: [] };
    const incomesList = Array.isArray(data.incomes) ? data.incomes : [];
    const variableExpensesList = Array.isArray(data.variableExpenses) ? data.variableExpenses : [];

    const extraIncomesTotal = incomesList.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
    const totalIncome = monthConf.baseIncome + extraIncomesTotal;

    const fixedExpensesList = getFixedExpensesForMonth(monthKey);
    const totalFixed = fixedExpensesList.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

    const variableExpensesTotal = variableExpensesList.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

    const netMonthlyMargin = totalIncome - totalFixed - variableExpensesTotal;

    return {
        baseIncome: monthConf.baseIncome,
        extraIncomesTotal,
        totalIncome,
        totalFixed,
        variableExpensesTotal,
        netMonthlyMargin,
        fixedExpensesList,
        incomesList,
        variableExpensesList
    };
}

function calculateCumulativeAccountBalance() {
    let runningBalance = INITIAL_ACCOUNT_BALANCE;
    const allYears = Object.keys(YEAR_MONTHS).map(Number).sort((a, b) => a - b);

    for (const yr of allYears) {
        const months = YEAR_MONTHS[yr] || [];
        for (const m of months) {
            // Se siamo arrivati al mese corrente, interrompiamo prima di sommare il suo margine:
            // questo restituisce il saldo accumulato fino alla fine del mese PRECEDENTE (es. saldo al 1° del mese).
            if (m.key === currentMonthKey) {
                return runningBalance;
            }

            const summary = calculateMonthSummary(m.key);
            runningBalance += summary.netMonthlyMargin;
        }
    }

    return runningBalance;
}

/* ==========================================================================
   RENDERING INTERFACCIA UTENTE
   ========================================================================== */
function renderAll() {
    renderKPIs();
    renderTables();
}

function renderKPIs() {
    const summary = calculateMonthSummary(currentMonthKey);
    const cumulativeBalance = calculateCumulativeAccountBalance();

    const elTotalIncome = document.getElementById("kpiTotalIncome");
    const elTotalFixed = document.getElementById("kpiTotalFixed");
    const elNetMargin = document.getElementById("kpiNetMargin");
    const elCumulativeBalance = document.getElementById("kpiCumulativeBalance");

    if (elTotalIncome) elTotalIncome.textContent = formatCurrency(summary.totalIncome);
    if (elTotalFixed) elTotalFixed.textContent = formatCurrency(summary.totalFixed);
    if (elNetMargin) {
        elNetMargin.textContent = formatCurrency(summary.netMonthlyMargin);
        elNetMargin.className = summary.netMonthlyMargin >= 0 ? "kpi-value positive" : "kpi-value negative";
    }
    if (elCumulativeBalance) {
        elCumulativeBalance.textContent = formatCurrency(cumulativeBalance);
        elCumulativeBalance.className = cumulativeBalance >= 0 ? "kpi-value positive" : "kpi-value negative";
    }
}

function renderTables() {
    const summary = calculateMonthSummary(currentMonthKey);

    // Tabella Entrate Extra
    const incomesTableBody = document.querySelector("#incomesTable tbody");
    if (incomesTableBody) {
        incomesTableBody.innerHTML = "";
        const sortedIncomes = [...summary.incomesList].sort((a, b) => 
            (b.date || "").localeCompare(a.date || "")
        );

        sortedIncomes.forEach(inc => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${escapeHtml(inc.title)}</td>
                <td>${formatCurrency(inc.amount)}</td>
                <td>${escapeHtml(inc.date || '-')}</td>
                <td>
                    <button class="btn-icon" onclick="deleteIncome('${inc.id}')" title="Elimina">🗑️</button>
                </td>
            `;
            incomesTableBody.appendChild(tr);
        });
    }

    // Tabella Uscite Fisse
    const fixedTableBody = document.querySelector("#fixedExpensesTable tbody");
    if (fixedTableBody) {
        fixedTableBody.innerHTML = "";
        summary.fixedExpensesList.forEach(fix => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${escapeHtml(fix.title)}</td>
                <td>${formatCurrency(fix.amount)}</td>
                <td>
                    <button class="btn-icon" onclick="openEditFixedModal('${escapeHtml(fix.title)}', ${fix.amount})" title="Modifica">✏️</button>
                </td>
            `;
            fixedTableBody.appendChild(tr);
        });
    }
}

/* ==========================================================================
   OPERAZIONI DATI & MODALI
   ========================================================================== */
window.openIncomeModal = function() {
    const modal = document.getElementById("incomeModal");
    if (modal) modal.style.display = "flex";
};

window.closeIncomeModal = function() {
    const modal = document.getElementById("incomeModal");
    if (modal) modal.style.display = "none";
    const t = document.getElementById("incomeTitle");
    const a = document.getElementById("incomeAmount");
    const d = document.getElementById("incomeDate");
    if (t) t.value = "";
    if (a) a.value = "";
    if (d) d.value = "";
};

window.saveIncome = function() {
    const titleEl = document.getElementById("incomeTitle");
    const amountEl = document.getElementById("incomeAmount");
    const dateEl = document.getElementById("incomeDate");

    const title = titleEl ? titleEl.value.trim() : "";
    const amount = amountEl ? parseFloat(amountEl.value) : NaN;
    const date = dateEl ? dateEl.value : "";

    if (!title || isNaN(amount)) {
        alert("Inserisci un titolo e un importo validi.");
        return;
    }

    if (!monthlyData[currentMonthKey]) {
        monthlyData[currentMonthKey] = { incomes: [], fixedOverrides: [], variableExpenses: [] };
    }

    const newIncome = {
        id: "inc_" + Date.now(),
        title,
        amount,
        date: date || new Date().toISOString().split("T")[0]
    };

    if (!Array.isArray(monthlyData[currentMonthKey].incomes)) {
        monthlyData[currentMonthKey].incomes = [];
    }
    monthlyData[currentMonthKey].incomes.push(newIncome);

    saveDataToFirebase(currentMonthKey);
    closeIncomeModal();
    renderAll();
};

window.deleteIncome = function(id) {
    if (!monthlyData[currentMonthKey] || !Array.isArray(monthlyData[currentMonthKey].incomes)) return;

    monthlyData[currentMonthKey].incomes = monthlyData[currentMonthKey].incomes.filter(i => i.id !== id);
    saveDataToFirebase(currentMonthKey);
    renderAll();
};

window.openEditFixedModal = function(title, currentAmount) {
    const elTitle = document.getElementById("fixedTitle");
    const elAmount = document.getElementById("fixedAmount");
    if (elTitle) elTitle.value = title;
    if (elAmount) elAmount.value = currentAmount;

    const modal = document.getElementById("fixedModal");
    if (modal) modal.style.display = "flex";
};

window.closeFixedModal = function() {
    const modal = document.getElementById("fixedModal");
    if (modal) modal.style.display = "none";
};

window.saveFixedOverride = function() {
    const titleEl = document.getElementById("fixedTitle");
    const amountEl = document.getElementById("fixedAmount");

    const title = titleEl ? titleEl.value : "";
    const amount = amountEl ? parseFloat(amountEl.value) : NaN;

    if (isNaN(amount)) {
        alert("Inserisci un importo valido.");
        return;
    }

    if (!monthlyData[currentMonthKey]) {
        monthlyData[currentMonthKey] = { incomes: [], fixedOverrides: [], variableExpenses: [] };
    }
    if (!Array.isArray(monthlyData[currentMonthKey].fixedOverrides)) {
        monthlyData[currentMonthKey].fixedOverrides = [];
    }

    const overrides = monthlyData[currentMonthKey].fixedOverrides;
    const index = overrides.findIndex(o => o.title === title);

    if (index !== -1) {
        overrides[index].amount = amount;
    } else {
        overrides.push({ title, amount });
    }

    saveDataToFirebase(currentMonthKey);
    closeFixedModal();
    renderAll();
};

window.logout = function() {
    if (auth) auth.signOut();
};

/* ==========================================================================
   UTILITIES
   ========================================================================== */
function formatCurrency(val) {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(val || 0);
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
