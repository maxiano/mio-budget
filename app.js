// 1. Inizializzazione Firebase
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.database();

// 2. Costanti e Parametri Iniziali
const INITIAL_ACCOUNT_BALANCE = 5348.43;
let currentUser = null;
let currentYear = "2026";
let currentMonth = "Agosto_Prev";

let expensesData = {};
let incomesData = {};

const CATEGORY_BUDGETS = {
    "Carburante": 200,
    "Spesa Alimentare": 400
};

// Uscite fisse base ricorrenti ogni mese
const baseMonthlyFixed = [
    { cat: "Affitto/Mutuo", name: "Quota Casa", amount: 500.00, desc: "Canone Mensile" },
    { cat: "Finanziamenti", name: "Prestito Personale", amount: 250.00, desc: "Rata Mensile" },
    { cat: "Abbonamenti", name: "Internet & Telefono", amount: 35.00, desc: "Canone Mensile" }
];

// 3. Definizione Cronologica Mesi & Ingressi Base (2026-2027)
const YEAR_MONTHS = {
    "2026": [
        { key: "Agosto_Prev", label: "Agosto (Prev)", baseIncome: 2100, breakdown: [{ name: "Stipendio Base", amount: 2100 }] },
        { key: "Settembre", label: "Settembre", baseIncome: 2100, breakdown: [{ name: "Stipendio Base", amount: 2100 }] },
        { key: "Ottobre", label: "Ottobre", baseIncome: 2100, breakdown: [{ name: "Stipendio Base", amount: 2100 }] },
        { key: "Novembre", label: "Novembre", baseIncome: 2100, breakdown: [{ name: "Stipendio Base", amount: 2100 }] },
        { key: "Dicembre", label: "Dicembre", baseIncome: 3500, breakdown: [{ name: "Stipendio Base", amount: 2100 }, { name: "Tredicesima", amount: 1400 }] }
    ],
    "2027": [
        { key: "Gennaio", label: "Gennaio", baseIncome: 2100, breakdown: [{ name: "Stipendio Base", amount: 2100 }] },
        { key: "Febbraio", label: "Febbraio", baseIncome: 2100, breakdown: [{ name: "Stipendio Base", amount: 2100 }] },
        { key: "Marzo", label: "Marzo", baseIncome: 2100, breakdown: [{ name: "Stipendio Base", amount: 2100 }] },
        { key: "Aprile", label: "Aprile", baseIncome: 2100, breakdown: [{ name: "Stipendio Base", amount: 2100 }] },
        { key: "Maggio", label: "Maggio", baseIncome: 2100, breakdown: [{ name: "Stipendio Base", amount: 2100 }] },
        { key: "Giugno", label: "Giugno", baseIncome: 3500, breakdown: [{ name: "Stipendio Base", amount: 2100 }, { name: "Quattordicesima", amount: 1400 }] },
        { key: "Luglio", label: "Luglio", baseIncome: 2100, breakdown: [{ name: "Stipendio Base", amount: 2100 }] },
        { key: "Agosto", label: "Agosto", baseIncome: 2100, breakdown: [{ name: "Stipendio Base", amount: 2100 }] },
        { key: "Settembre_27", label: "Settembre", baseIncome: 2100, breakdown: [{ name: "Stipendio Base", amount: 2100 }] },
        { key: "Ottobre_27", label: "Ottobre", baseIncome: 2100, breakdown: [{ name: "Stipendio Base", amount: 2100 }] },
        { key: "Novembre_27", label: "Novembre", baseIncome: 2100, breakdown: [{ name: "Stipendio Base", amount: 2100 }] },
        { key: "Dicembre_27", label: "Dicembre", baseIncome: 3500, breakdown: [{ name: "Stipendio Base", amount: 2100 }, { name: "Tredicesima", amount: 1400 }] }
    ]
};

const CHRONOLOGICAL_MONTHS = [
    { key: "Agosto_Prev", year: "2026", label: "Agosto 2026" },
    { key: "Settembre", year: "2026", label: "Settembre 2026" },
    { key: "Ottobre", year: "2026", label: "Ottobre 2026" },
    { key: "Novembre", year: "2026", label: "Novembre 2026" },
    { key: "Dicembre", year: "2026", label: "Dicembre 2026" },
    { key: "Gennaio", year: "2027", label: "Gennaio 2027" },
    { key: "Febbraio", year: "2027", label: "Febbraio 2027" },
    { key: "Marzo", year: "2027", label: "Marzo 2027" },
    { key: "Aprile", year: "2027", label: "Aprile 2027" },
    { key: "Maggio", year: "2027", label: "Maggio 2027" },
    { key: "Giugno", year: "2027", label: "Giugno 2027" },
    { key: "Luglio", year: "2027", label: "Luglio 2027" },
    { key: "Agosto", year: "2027", label: "Agosto 2027" },
    { key: "Settembre_27", year: "2027", label: "Settembre 2027" },
    { key: "Ottobre_27", year: "2027", label: "Ottobre 2027" },
    { key: "Novembre_27", year: "2027", label: "Novembre 2027" },
    { key: "Dicembre_27", year: "2027", label: "Dicembre 2027" }
];

// 4. Uscite Periodiche Extra/Stagionali
const periodicExpenses = {
    "Agosto_Prev": [
        { cat: "Utenze", name: "Luce (Bimestrale)", amount: 130.00, desc: "Scadenza Agosto" }
    ],
    "Settembre": [
        { cat: "Utenze", name: "Acqua (Bimestrale)", amount: 30.00, desc: "Scadenza Settembre" }
    ],
    "Ottobre": [
        { cat: "Utenze", name: "Luce (Bimestrale)", amount: 130.00, desc: "Scadenza Ottobre" }
    ],
    "Novembre": [
        { cat: "Utenze", name: "Acqua (Bimestrale)", amount: 30.00, desc: "Scadenza Novembre" },
        { cat: "Utenze", name: "TARI (Tassa Rifiuti)", amount: 40.00, desc: "Quota Trimestrale" }
    ],
    "Dicembre": [
        { cat: "Utenze", name: "Luce (Bimestrale)", amount: 130.00, desc: "Scadenza Dicembre" }
    ],
    "Gennaio": [
        { cat: "Utenze", name: "Acqua (Bimestrale)", amount: 30.00, desc: "Scadenza Gennaio" }
    ],
    "Febbraio": [
        { cat: "Utenze", name: "Luce (Bimestrale)", amount: 130.00, desc: "Scadenza Febbraio" }
    ],
    "Marzo": [
        { cat: "Utenze", name: "Acqua (Bimestrale)", amount: 30.00, desc: "Scadenza Marzo" },
        { cat: "Utenze", name: "TARI (Tassa Rifiuti)", amount: 40.00, desc: "Quota Trimestrale" }
    ],
    "Aprile": [
        { cat: "Utenze", name: "Luce (Bimestrale)", amount: 130.00, desc: "Scadenza Aprile" }
    ],
    "Maggio": [
        { cat: "Utenze", name: "Acqua (Bimestrale)", amount: 30.00, desc: "Scadenza Maggio" },
        { cat: "Trasporti", name: "Bollo Auto", amount: 170.00, desc: "Scadenza Annuale" }
    ],
    "Giugno": [
        { cat: "Utenze", name: "Luce (Bimestrale)", amount: 130.00, desc: "Scadenza Giugno" },
        { cat: "Utenze", name: "TARI (Tassa Rifiuti)", amount: 40.00, desc: "Quota Trimestrale" },
        { cat: "Tempo Libero", name: "Rimessaggio Roulotte", amount: 500.00, desc: "Scadenza Annuale" }
    ],
    "Luglio": [
        { cat: "Utenze", name: "Acqua (Bimestrale)", amount: 30.00, desc: "Scadenza Luglio" },
        { cat: "Trasporti", name: "Assicurazione Auto", amount: 360.00, desc: "Scadenza Annuale" }
    ],
    "Agosto": [
        { cat: "Utenze", name: "Luce (Bimestrale)", amount: 130.00, desc: "Scadenza Agosto" },
        { cat: "Extra", name: "Campeggio Estivo", amount: 1800.00, desc: "Quota Straordinaria" }
    ],
    "Settembre_27": [
        { cat: "Utenze", name: "Acqua (Bimestrale)", amount: 30.00, desc: "Scadenza Settembre" }
    ],
    "Ottobre_27": [
        { cat: "Utenze", name: "Luce (Bimestrale)", amount: 130.00, desc: "Scadenza Ottobre" }
    ],
    "Novembre_27": [
        { cat: "Utenze", name: "Acqua (Bimestrale)", amount: 30.00, desc: "Scadenza Novembre" },
        { cat: "Utenze", name: "TARI (Tassa Rifiuti)", amount: 40.00, desc: "Quota Trimestrale" }
    ],
    "Dicembre_27": [
        { cat: "Utenze", name: "Luce (Bimestrale)", amount: 130.00, desc: "Scadenza Dicembre" }
    ]
};

// 5. Listener DOM e Inizializzazione
document.addEventListener("DOMContentLoaded", () => {
    const today = new Date();
    document.getElementById("expenseDate").valueAsDate = today;
    document.getElementById("incomeDate").valueAsDate = today;
    
    populateMonthDropdown();

    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }

    if (auth) {
        auth.onAuthStateChanged(user => {
            if (user) {
                currentUser = user;
                document.getElementById("authScreen").classList.add("hidden");
                listenToDatabase();
            } else {
                currentUser = null;
                document.getElementById("authScreen").classList.remove("hidden");
            }
        });
    }
});

function populateMonthDropdown() {
    const monthSelect = document.getElementById("monthSelect");
    monthSelect.innerHTML = "";
    const months = YEAR_MONTHS[currentYear] || [];
    
    months.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m.key;
        opt.className = "bg-slate-800";
        opt.innerText = `${m.label} (${m.baseIncome.toLocaleString('it-IT')} €)`;
        monthSelect.appendChild(opt);
    });

    currentMonth = months[0].key;
    monthSelect.value = currentMonth;
}

function changeYear() {
    currentYear = document.getElementById("yearSelect").value;
    populateMonthDropdown();
    updateView();
}

function changeMonth() {
    currentMonth = document.getElementById("monthSelect").value;
    updateView();
}

async function handleAuth(e) {
    e.preventDefault();
    if (!auth) return alert("Firebase Auth non è pronto.");
    
    const email = document.getElementById("authEmail").value;
    const password = document.getElementById("authPassword").value;
    const errDiv = document.getElementById("authError");
    errDiv.classList.add("hidden");

    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (err) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
            try {
                await auth.createUserWithEmailAndPassword(email, password);
            } catch (createErr) {
                errDiv.innerText = createErr.message;
                errDiv.classList.remove("hidden");
            }
        } else {
            errDiv.innerText = err.message;
            errDiv.classList.remove("hidden");
        }
    }
}

function logout() { 
    if (auth) auth.signOut(); 
}

function listenToDatabase() {
    if (!db) return;
    db.ref("user_budget").on("value", (snapshot) => {
        const data = snapshot.val() || {};
        expensesData = data.expenses || {};
        incomesData = data.incomes || {};
        updateView();
    });
}

function getMonthFixedExpenses(month) {
    return [...baseMonthlyFixed, ...(periodicExpenses[month] || [])];
}

function getCurrentMonthConfig() {
    const allMonths = [...YEAR_MONTHS["2026"], ...YEAR_MONTHS["2027"]];
    return allMonths.find(m => m.key === currentMonth) || { baseIncome: 0, tag: "Base", breakdown: [] };
}

// Calcola il margine netto di un singolo mese
function getMonthNetMargin(mKey, mYear) {
    const yearMonths = YEAR_MONTHS[mYear] || [];
    const monthConf = yearMonths.find(m => m.key === mKey) || { baseIncome: 0 };

    const currentExpenses = Object.values(expensesData[mKey] || {});
    const currentIncomes = Object.values(incomesData[mKey] || {});

    const extraIncomeTotal = currentIncomes.reduce((sum, item) => sum + item.amount, 0);
    const totalIncome = monthConf.baseIncome + extraIncomeTotal;
    const totalFixedMonth = getMonthFixedExpenses(mKey).reduce((sum, item) => sum + item.amount, 0);
    const totalVariable = currentExpenses.reduce((sum, item) => sum + item.amount, 0);

    return totalIncome - (totalFixedMonth + totalVariable);
}

// Calcola sia la Base Iniziale (startOfMonthBalance) sia il Saldo Finale a fine mese
function calculateCumulativeAccountBalance() {
    const currentIndex = CHRONOLOGICAL_MONTHS.findIndex(m => m.key === currentMonth && m.year === currentYear);
    const targetIndex = currentIndex !== -1 ? currentIndex : 0;

    let runningBalance = INITIAL_ACCOUNT_BALANCE;

    for (let i = 0; i < targetIndex; i++) {
        const item = CHRONOLOGICAL_MONTHS[i];
        runningBalance += getMonthNetMargin(item.key, item.year);
    }

    const startOfMonthBalance = runningBalance;
    const currentMargin = getMonthNetMargin(CHRONOLOGICAL_MONTHS[targetIndex].key, CHRONOLOGICAL_MONTHS[targetIndex].year);
    const endOfMonthBalance = startOfMonthBalance + currentMargin;
    const currentLabel = CHRONOLOGICAL_MONTHS[targetIndex] ? CHRONOLOGICAL_MONTHS[targetIndex].label : "";

    return { startOfMonthBalance, endOfMonthBalance, currentLabel };
}

function updateView() {
    const monthConfig = getCurrentMonthConfig();
    const currentExpenses = Object.values(expensesData[currentMonth] || {});
    const currentIncomes = Object.values(incomesData[currentMonth] || {});

    const extraIncomeTotal = currentIncomes.reduce((sum, item) => sum + item.amount, 0);
    const totalIncome = monthConfig.baseIncome + extraIncomeTotal;
    const totalFixedMonth = getMonthFixedExpenses(currentMonth).reduce((sum, item) => sum + item.amount, 0);
    const totalVariable = currentExpenses.reduce((sum, item) => sum + item.amount, 0);
    const remaining = totalIncome - (totalFixedMonth + totalVariable);

    // Aggiornamento Conto Generale
    const accountInfo = calculateCumulativeAccountBalance();
    document.getElementById("displayTotalAccount").innerText = formatEuro(accountInfo.endOfMonthBalance);
    
    const displayInitialBaseElements = document.querySelectorAll(".displayInitialBase, #displayInitialBase");
    displayInitialBaseElements.forEach(el => {
        el.innerText = formatEuro(accountInfo.startOfMonthBalance);
    });

    document.getElementById("accountCurrentMonthLabel").innerText = accountInfo.currentLabel;

    document.getElementById("displayIncome").innerText = formatEuro(totalIncome);
    document.getElementById("displayFixed").innerText = formatEuro(totalFixedMonth);
    document.getElementById("displayVariable").innerText = formatEuro(totalVariable);

    const totalFuel = currentExpenses.filter(e => e.category === "Carburante").reduce((s, e) => s + e.amount, 0);
    const totalFood = currentExpenses.filter(e => e.category === "Spesa Alimentare").reduce((s, e) => s + e.amount, 0);
    document.getElementById("fuelBudgetBar").innerText = `${Math.round(totalFuel)}/200€`;
    document.getElementById("foodBudgetBar").innerText = `${Math.round(totalFood)}/400€`;

    const remainingElem = document.getElementById("displayRemaining");
    remainingElem.innerText = (remaining >= 0 ? "+" : "") + formatEuro(remaining);
    remainingElem.className = remaining < 0 ? "text-lg md:text-xl font-bold text-rose-400" : "text-lg md:text-xl font-bold text-emerald-400";

    renderTables(currentIncomes, currentExpenses);
    if (typeof lucide !== "undefined") lucide.createIcons();
}

function addIncome(e) {
    e.preventDefault();
    if (!db) return;
    const cat = document.getElementById("incomeCategory").value;
    const amount = parseFloat(document.getElementById("incomeAmount").value);
    const note = document.getElementById("incomeNote").value.trim() || "-";
    const date = document.getElementById("incomeDate").value;
    const newId = Date.now().toString();

    db.ref(`user_budget/incomes/${currentMonth}/${newId}`).set({
        id: newId, category: cat, amount, note, date
    });

    document.getElementById("incomeAmount").value = "";
    document.getElementById("incomeNote").value = "";
}

function addExpense(e) {
    e.preventDefault();
    if (!db) return;
    const cat = document.getElementById("expenseCategory").value;
    const amount = parseFloat(document.getElementById("expenseAmount").value);
    const note = document.getElementById("expenseNote").value.trim() || "-";
    const date = document.getElementById("expenseDate").value;

    const currentExpenses = Object.values(expensesData[currentMonth] || {});
    if (CATEGORY_BUDGETS[cat]) {
        const limit = CATEGORY_BUDGETS[cat];
        const currentSpent = currentExpenses.filter(i => i.category === cat).reduce((s, i) => s + i.amount, 0);
        if (currentSpent + amount > limit) {
            alert(`⚠️ LIMITE SUPERATO!\n\nPer "${cat}" hai impostato un tetto di ${formatEuro(limit)}.\nSpesi finora: ${formatEuro(currentSpent)}.`);
            return;
        }
    }

    const newId = Date.now().toString();
    db.ref(`user_budget/expenses/${currentMonth}/${newId}`).set({
        id: newId, category: cat, amount, note, date
    });

    document.getElementById("expenseAmount").value = "";
    document.getElementById("expenseNote").value = "";
}

function deleteIncome(id) { if (db) db.ref(`user_budget/incomes/${currentMonth}/${id}`).remove(); }
function deleteExpense(id) { if (db) db.ref(`user_budget/expenses/${currentMonth}/${id}`).remove(); }

function clearIncomesData() {
    if (confirm("Svuotare entrate extra del mese?") && db) {
        db.ref(`user_budget/incomes/${currentMonth}`).remove();
    }
}

function clearExpensesData() {
    if (confirm("Svuotare uscite variabili del mese?") && db) {
        db.ref(`user_budget/expenses/${currentMonth}`).remove();
    }
}

function renderTables(incomes, expenses) {
    const incBody = document.getElementById("incomeTableBody");
    const expBody = document.getElementById("expenseTableBody");
    incBody.innerHTML = ""; expBody.innerHTML = "";

    document.getElementById("emptyIncomeMessage").classList.toggle("hidden", incomes.length > 0);
    document.getElementById("emptyExpenseMessage").classList.toggle("hidden", expenses.length > 0);

    incomes.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(i => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td class="p-2">${formatDate(i.date)}</td><td class="p-2"><span class="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded text-[10px] font-bold border border-emerald-500/20">${i.category}</span></td><td class="p-2 text-slate-400">${i.note}</td><td class="p-2 text-right font-bold text-emerald-400">+${formatEuro(i.amount)}</td><td class="p-2 text-center"><button onclick="deleteIncome('${i.id}')" class="text-slate-500 hover:text-rose-400"><i data-lucide="x" class="w-3.5 h-3.5"></i></button></td>`;
        incBody.appendChild(tr);
    });

    expenses.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(e => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td class="p-2">${formatDate(e.date)}</td><td class="p-2"><span class="bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded text-[10px] font-bold border border-rose-500/20">${e.category}</span></td><td class="p-2 text-slate-400">${e.note}</td><td class="p-2 text-right font-bold text-slate-100">-${formatEuro(e.amount)}</td><td class="p-2 text-center"><button onclick="deleteExpense('${e.id}')" class="text-slate-500 hover:text-rose-400"><i data-lucide="x" class="w-3.5 h-3.5"></i></button></td>`;
        expBody.appendChild(tr);
    });
}

// Modal Dettaglio Entrate
function openIncomeModal() {
    const monthConfig = getCurrentMonthConfig();
    document.getElementById("modalIncomeMonthName").innerText = `${monthConfig.label} ${currentYear}`;
    const modalBody = document.getElementById("modalIncomeTableBody");
    modalBody.innerHTML = "";
    
    let total = 0;

    if (monthConfig.breakdown && monthConfig.breakdown.length > 0) {
        monthConfig.breakdown.forEach(item => {
            total += item.amount;
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="p-2 font-semibold text-emerald-400"><span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[10px]">Fissa</span></td>
                <td class="p-2 font-medium text-slate-200">${item.name}</td>
                <td class="p-2 text-slate-400">Ricorrente mensile</td>
                <td class="p-2 text-right font-bold text-emerald-400">+${formatEuro(item.amount)}</td>
            `;
            modalBody.appendChild(tr);
        });
    }

    const currentIncomes = Object.values(incomesData[currentMonth] || {});
    currentIncomes.forEach(i => {
        total += i.amount;
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="p-2 font-semibold text-blue-400"><span class="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded text-[10px]">Extra</span></td>
            <td class="p-2 font-medium text-slate-200">${i.category}</td>
            <td class="p-2 text-slate-400">${i.note} (${formatDate(i.date)})</td>
            <td class="p-2 text-right font-bold text-emerald-400">+${formatEuro(i.amount)}</td>
        `;
        modalBody.appendChild(tr);
    });

    document.getElementById("modalIncomeTotal").innerText = formatEuro(total);
    document.getElementById("incomeModal").classList.remove("hidden");
}

function closeIncomeModal() { document.getElementById("incomeModal").classList.add("hidden"); }

// Modal Uscite Fisse
function openFixedModal() {
    const monthConfig = getCurrentMonthConfig();
    document.getElementById("modalMonthName").innerText = `${monthConfig.label} ${currentYear}`;
    const modalBody = document.getElementById("modalFixedTableBody");
    modalBody.innerHTML = "";
    const list = getMonthFixedExpenses(currentMonth);
    let total = 0;
    list.forEach(i => {
        total += i.amount;
        const tr = document.createElement("tr");
        tr.innerHTML = `<td class="p-2 font-semibold text-blue-400">${i.cat}</td><td class="p-2 text-slate-200">${i.name}</td><td class="p-2 text-slate-400">${i.desc}</td><td class="p-2 text-right font-bold text-slate-100">${formatEuro(i.amount)}</td>`;
        modalBody.appendChild(tr);
    });
    document.getElementById("modalFixedTotal").innerText = formatEuro(total);
    document.getElementById("fixedModal").classList.remove("hidden");
}

function closeFixedModal() { document.getElementById("fixedModal").classList.add("hidden"); }
function formatEuro(val) { return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(val); }
function formatDate(dStr) { if (!dStr) return "-"; const [y, m, d] = dStr.split("-"); return `${d}/${m}`; }
