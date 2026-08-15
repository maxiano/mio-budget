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
let unsubscribeFirebase = null;

/* ==========================================================================
   INIZIALIZZAZIONE FIREBASE
   ========================================================================== */
let auth = null;
let db = null;

if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    auth = firebase.auth();
    db = firebase.firestore();
}

/* ==========================================================================
   GESTORI EVENTI & LIFECYCLE
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
    setupYearAndMonthSelectors();
    
    if (auth) {
        auth.onAuthStateChanged(user => {
            if (user) {
                document.getElementById("loginSection").style.display = "none";
                document.getElementById("appContent").style.display = "block";
                loadFirebaseData();
            } else {
                document.getElementById("loginSection").style.display = "block";
                document.getElementById("appContent").style.display = "none";
                if (unsubscribeFirebase) unsubscribeFirebase();
            }
        });
    }

    // Chiusura modali con tasto ESC
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeIncomeModal();
            closeFixedModal();
        }
    });
});

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
   SINCRONIZZAZIONE FIREBASE
   ========================================================================== */
function loadFirebaseData() {
    const user = auth.currentUser;
    if (!user) return;

    if (unsubscribeFirebase) unsubscribeFirebase();

    unsubscribeFirebase = db.collection("users")
        .doc(user.uid)
        .collection("budgetData")
        .onSnapshot(snapshot => {
            monthlyData = {};
            snapshot.forEach(doc => {
                monthlyData[doc.id] = doc.data();
            });
            renderAll();
        }, error => {
            console.error("Errore durante il recupero dati:", error);
        });
}

function saveDataToFirebase(monthKey) {
    const user = auth.currentUser;
    if (!user || !db) return;

    const dataToSave = monthlyData[monthKey] || { incomes: [], fixedOverrides: [] };

    db.collection("users")
        .doc(user.uid)
        .collection("budgetData")
        .doc(monthKey)
        .set(dataToSave)
        .catch(error => {
            console.error("Errore nel salvataggio su Firebase:", error);
        });
}

/* ==========================================================================
   LOGICA DI CALCOLO & CALCOLO CUMULATIVO
   ========================================================================== */
function getCurrentMonthConfig() {
    const months = YEAR_MONTHS[currentYear] || [];
    return months.find(m => m.key === currentMonthKey) || { baseIncome: 1901.90 };
}

function getFixedExpensesForMonth(monthKey) {
    let list = baseMonthlyFixed.map(item => ({ ...item }));
    
    if (periodicExpenses[monthKey]) {
        list = list.concat(periodicExpenses[monthKey]);
    }

    const savedData = monthlyData[monthKey];
    if (savedData && savedData.fixedOverrides) {
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
    // Individua la configurazione specifica del mese target
    const [yearStr] = monthKey.split("-");
    const yearNum = parseInt(yearStr, 10);
    const yearMonths = YEAR_MONTHS[yearNum] || [];
    const monthConf = yearMonths.find(m => m.key === monthKey) || { baseIncome: 1901.90 };

    const data = monthlyData[monthKey] || { incomes: [], fixedOverrides: [] };

    const extraIncomesTotal = (data.incomes || []).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
    const totalIncome = monthConf.baseIncome + extraIncomesTotal;

    const fixedExpensesList = getFixedExpensesForMonth(monthKey);
    const totalFixed = fixedExpensesList.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

    const netMonthlyMargin = totalIncome - totalFixed;

    return {
        baseIncome: monthConf.baseIncome,
        extraIncomesTotal,
        totalIncome,
        totalFixed,
        netMonthlyMargin,
        fixedExpensesList,
        incomesList: data.incomes || []
    };
}

function calculateCumulativeAccountBalance() {
    let runningBalance = INITIAL_ACCOUNT_BALANCE;
    const allYears = Object.keys(YEAR_MONTHS).map(Number).sort((a, b) => a - b);

    for (const yr of allYears) {
        const months = YEAR_MONTHS[yr];
        for (const m of months) {
            const summary = calculateMonthSummary(m.key);
            runningBalance += summary.netMonthlyMargin;

            if (m.key === currentMonthKey) {
                return runningBalance;
            }
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

    // Table Entrate Extra (Ordinamento per data tramite confronto stringhe ISO)
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
                <td>${inc.date || '-'}</td>
                <td>
                    <button class="btn-icon" onclick="deleteIncome('${inc.id}')" title="Elimina">🗑️</button>
                </td>
            `;
            incomesTableBody.appendChild(tr);
        });
    }

    // Table Uscite Fisse
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
function openAddIncomeModal() {
    const modal = document.getElementById("incomeModal");
    if (modal) modal.style.display = "flex";
}

function closeIncomeModal() {
    const modal = document.getElementById("incomeModal");
    if (modal) modal.style.display = "none";
    document.getElementById("incomeTitle").value = "";
    document.getElementById("incomeAmount").value = "";
    document.getElementById("incomeDate").value = "";
}

function saveIncome() {
    const title = document.getElementById("incomeTitle").value.trim();
    const amount = parseFloat(document.getElementById("incomeAmount").value);
    const date = document.getElementById("incomeDate").value;

    if (!title || isNaN(amount)) {
        alert("Inserisci un titolo e un importo validi.");
        return;
    }

    if (!monthlyData[currentMonthKey]) {
        monthlyData[currentMonthKey] = { incomes: [], fixedOverrides: [] };
    }

    const newIncome = {
        id: "inc_" + Date.now(),
        title,
        amount,
        date: date || new Date().toISOString().split("T")[0]
    };

    monthlyData[currentMonthKey].incomes.push(newIncome);
    saveDataToFirebase(currentMonthKey);
    closeIncomeModal();
    renderAll();
}

function deleteIncome(id) {
    if (!monthlyData[currentMonthKey] || !monthlyData[currentMonthKey].incomes) return;

    monthlyData[currentMonthKey].incomes = monthlyData[currentMonthKey].incomes.filter(i => i.id !== id);
    saveDataToFirebase(currentMonthKey);
    renderAll();
}

function openEditFixedModal(title, currentAmount) {
    document.getElementById("fixedTitle").value = title;
    document.getElementById("fixedAmount").value = currentAmount;
    const modal = document.getElementById("fixedModal");
    if (modal) modal.style.display = "flex";
}

function closeFixedModal() {
    const modal = document.getElementById("fixedModal");
    if (modal) modal.style.display = "none";
}

function saveFixedOverride() {
    const title = document.getElementById("fixedTitle").value;
    const amount = parseFloat(document.getElementById("fixedAmount").value);

    if (isNaN(amount)) {
        alert("Inserisci un importo valido.");
        return;
    }

    if (!monthlyData[currentMonthKey]) {
        monthlyData[currentMonthKey] = { incomes: [], fixedOverrides: [] };
    }
    if (!monthlyData[currentMonthKey].fixedOverrides) {
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
}

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
