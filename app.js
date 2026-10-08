/* =====================================================
   CAR MANAGEMENT SYSTEM - app.js
   v2: Google Sheets Sync + Food + Servicing + Money Flow
   ===================================================== */

'use strict';

// ─── CONSTANTS ────────────────────────────────────────
const STORAGE_KEY  = 'car_mgmt_records';
const COLS_KEY     = 'car_mgmt_cols';
const DRIVERS_KEY  = 'car_mgmt_drivers';
const SHEETS_KEY   = 'car_mgmt_sheets_url';

const ALL_COLUMNS = [
  { id: 'date',            label: 'Date',                 always: true  },
  { id: 'driverName',      label: 'Driver Name',          always: true  },
  { id: 'startKm',         label: 'Start Km',             always: false },
  { id: 'endKm',           label: 'End Km',               always: false },
  { id: 'totalKm',         label: 'Total Km',             always: false },
  { id: 'fuelType',        label: 'Fuel Type',            always: false },
  { id: 'fuelUpi',         label: 'Fuel (UPI) ₹',         always: false },
  { id: 'fuelCash',        label: 'Fuel (Cash) ₹',        always: false },
  { id: 'foodExp',         label: 'Food ₹',               always: false },
  { id: 'servicing',       label: 'Servicing ₹',          always: false },
  { id: 'commission',      label: 'Commission ₹',         always: false },
  { id: 'upiAmount',       label: 'UPI Earned ₹',         always: false },
  { id: 'cashAmount',      label: 'Cash Earned ₹',        always: false },
  { id: 'totalFare',       label: 'Total Fare ₹',         always: true  },
  { id: 'totalExpenses',   label: 'Total Expenses ₹',     always: false },
  { id: 'netProfit',       label: 'Net Profit ₹',         always: true  },
  { id: 'ownerReceived',   label: 'Owner Gets ₹',         always: false },
  { id: 'cashPayDriver',   label: 'Cash Paid by Driver',  always: false },
  { id: 'extraExpCash',    label: 'Extra Exp. Cash ₹',    always: false },
  { id: 'extraExpUpi',     label: 'Extra Exp. UPI ₹',     always: false },
  { id: 'cashIntoUpi',     label: 'Cash→UPI by Driver',   always: false },
  { id: 'notes',           label: 'Notes',                always: false },
  { id: 'syncStatus',      label: 'Sync',                 always: false },
  { id: 'actions',         label: 'Actions',              always: true  },
];

// ─── STATE ────────────────────────────────────────────
let records      = [];
let drivers      = [];
let visibleCols  = [];
let currentView  = 'dashboard';
let editingId    = null;
let filterMonth  = '';
let filterDriver = '';
let sheetsUrl    = '';

// ─── INIT ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  setDefaultMonth();
  renderDriverOptions();
  renderColumnManager();
  renderAll();
  switchView('dashboard');
  loadSheetsUrl();
});

// ─── STORAGE ──────────────────────────────────────────
function loadFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  records = raw ? JSON.parse(raw) : [];

  const drv = localStorage.getItem(DRIVERS_KEY);
  drivers = drv ? JSON.parse(drv) : ['Rocky Kumar'];

  const cols = localStorage.getItem(COLS_KEY);
  if (cols) {
    visibleCols = JSON.parse(cols);
  } else {
    visibleCols = ALL_COLUMNS
      .filter(c => ['date','driverName','totalKm','fuelType','fuelUpi','fuelCash',
                    'foodExp','servicing','commission','upiAmount','cashAmount',
                    'totalFare','netProfit','ownerReceived','cashPayDriver',
                    'notes','syncStatus','actions'].includes(c.id))
      .map(c => c.id);
  }

  if (records.length === 0) seedSampleData();
}

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function saveDrivers() {
  localStorage.setItem(DRIVERS_KEY, JSON.stringify(drivers));
}

function saveCols() {
  localStorage.setItem(COLS_KEY, JSON.stringify(visibleCols));
}

function loadSheetsUrl() {
  sheetsUrl = localStorage.getItem(SHEETS_KEY) || '';
  const el = document.getElementById('sheetsWebhookUrl');
  if (el) el.value = sheetsUrl;
}

function saveSheetsUrl() {
  const el = document.getElementById('sheetsWebhookUrl');
  if (!el) return;
  sheetsUrl = el.value.trim();
  localStorage.setItem(SHEETS_KEY, sheetsUrl);
  showToast('Google Sheets URL saved ✓', 'success');
}

// ─── SEED DATA ───────────────────────────────────────
function seedSampleData() {

  // ── October 2026 — Driver: Nitish Kumar ──────────────
  const october = [
    {
      // 01 Oct — Absent
      date:'2026-10-01', driverName:'Nitish Kumar',
      startKm:0, endKm:0, fuelType:'',
      fuelUpi:0, fuelCash:0, commission:0,
      upiAmount:0, cashAmount:0,
      foodExp:0, servicing:0,
      notes:'ABSENT'
    },
    {
      // 02 Oct — UPI: 700, CNG cash: 498
      // No split given so all fare treated as UPI
      date:'2026-10-02', driverName:'Nitish Kumar',
      startKm:0, endKm:0, fuelType:'CNG',
      fuelUpi:0, fuelCash:498, commission:0,
      upiAmount:700, cashAmount:0,
      foodExp:0, servicing:0,
      notes:''
    },
    {
      // 03 Oct — Total fare 1999 (assumed cash), CNG cash 555
      date:'2026-10-03', driverName:'Nitish Kumar',
      startKm:0, endKm:0, fuelType:'CNG',
      fuelUpi:0, fuelCash:555, commission:0,
      upiAmount:0, cashAmount:1999,
      foodExp:0, servicing:0,
      notes:''
    },
    {
      // 04 Oct — Total fare 1300 (assumed cash), CNG cash 555
      date:'2026-10-04', driverName:'Nitish Kumar',
      startKm:0, endKm:0, fuelType:'CNG',
      fuelUpi:0, fuelCash:555, commission:0,
      upiAmount:0, cashAmount:1300,
      foodExp:0, servicing:0,
      notes:''
    },
    {
      // 05 Oct — Total fare 1900 (assumed cash), CNG cash 636
      date:'2026-10-05', driverName:'Nitish Kumar',
      startKm:0, endKm:0, fuelType:'CNG',
      fuelUpi:0, fuelCash:636, commission:0,
      upiAmount:0, cashAmount:1900,
      foodExp:0, servicing:0,
      notes:''
    },
    {
      // 06 Oct — Total fare 1945 (assumed cash), CNG cash 740, Rapido commission 1001
      date:'2026-10-06', driverName:'Nitish Kumar',
      startKm:0, endKm:0, fuelType:'CNG',
      fuelUpi:0, fuelCash:740, commission:1001,
      upiAmount:0, cashAmount:1945,
      foodExp:0, servicing:0,
      notes:'Rapido commission: ₹1001'
    },
    {
      // 07 Oct — Fare 2232 (cash), Toll 280 extra, Food 120
      //          CNG 565 (cash) + Petrol 200 (cash)
      date:'2026-10-07', driverName:'Nitish Kumar',
      startKm:0, endKm:0, fuelType:'CNG+Petrol',
      fuelUpi:0, fuelCash:565, commission:0,
      upiAmount:0, cashAmount:2232,
      foodExp:120, servicing:0,
      extraExpCash:200 + 280,   // petrol 200 + toll 280
      notes:'Toll: ₹280 | Food: ₹120 | Petrol: ₹200 (extra)'
    },
  ];

  // ── April 2026 — Driver: Rocky Kumar ─────────────────
  const april = [
    { date:'2026-04-01', driverName:'Rocky Kumar', startKm:14935, endKm:15072, fuelType:'CNG', fuelUpi:600,  fuelCash:0,    commission:0, upiAmount:2258, cashAmount:0,    foodExp:0, servicing:0, notes:'' },
    { date:'2026-04-02', driverName:'Rocky Kumar', startKm:15072, endKm:15167, fuelType:'CNG', fuelUpi:0,    fuelCash:500,  commission:0, upiAmount:616,  cashAmount:1688, foodExp:0, servicing:0, notes:'' },
    { date:'2026-04-03', driverName:'Rocky Kumar', startKm:15167, endKm:15253, fuelType:'CNG', fuelUpi:0,    fuelCash:440,  commission:0, upiAmount:764,  cashAmount:471,  foodExp:0, servicing:0, notes:'' },
    { date:'2026-04-04', driverName:'Rocky Kumar', startKm:15253, endKm:15369, fuelType:'CNG', fuelUpi:640,  fuelCash:0,    commission:0, upiAmount:1046, cashAmount:260,  foodExp:0, servicing:0, notes:'' },
    { date:'2026-04-05', driverName:'Rocky Kumar', startKm:15369, endKm:15499, fuelType:'CNG', fuelUpi:0,    fuelCash:685,  commission:0, upiAmount:1512, cashAmount:1104, foodExp:0, servicing:0, notes:'' },
    { date:'2026-04-06', driverName:'Rocky Kumar', startKm:0,     endKm:0,     fuelType:'',    fuelUpi:0,    fuelCash:0,    commission:0, upiAmount:0,    cashAmount:0,    foodExp:0, servicing:0, notes:'ABSENT | Advance: 1000' },
    { date:'2026-04-07', driverName:'Rocky Kumar', startKm:0,     endKm:0,     fuelType:'',    fuelUpi:0,    fuelCash:0,    commission:0, upiAmount:0,    cashAmount:0,    foodExp:0, servicing:0, notes:'ABSENT' },
    { date:'2026-04-08', driverName:'Rocky Kumar', startKm:15499, endKm:15642, fuelType:'CNG', fuelUpi:700,  fuelCash:0,    commission:0, upiAmount:1952, cashAmount:0,    foodExp:0, servicing:0, notes:'' },
    { date:'2026-04-09', driverName:'Rocky Kumar', startKm:0,     endKm:0,     fuelType:'',    fuelUpi:0,    fuelCash:0,    commission:0, upiAmount:0,    cashAmount:0,    foodExp:0, servicing:0, notes:'ABSENT' },
    { date:'2026-04-10', driverName:'Rocky Kumar', startKm:0,     endKm:0,     fuelType:'',    fuelUpi:0,    fuelCash:0,    commission:0, upiAmount:793,  cashAmount:0,    foodExp:0, servicing:0, notes:'' },
    { date:'2026-04-11', driverName:'Rocky Kumar', startKm:15642, endKm:15803, fuelType:'CNG', fuelUpi:610,  fuelCash:0,    commission:0, upiAmount:1865, cashAmount:100,  foodExp:0, servicing:0, notes:'' },
    { date:'2026-04-12', driverName:'Rocky Kumar', startKm:15803, endKm:15972, fuelType:'CNG', fuelUpi:690,  fuelCash:0,    commission:0, upiAmount:1330, cashAmount:0,    foodExp:0, servicing:0, notes:'' },
    { date:'2026-04-13', driverName:'Rocky Kumar', startKm:15972, endKm:16168, fuelType:'CNG', fuelUpi:620,  fuelCash:0,    commission:0, upiAmount:1192, cashAmount:0,    foodExp:0, servicing:0, notes:'' },
    { date:'2026-04-14', driverName:'Rocky Kumar', startKm:0,     endKm:0,     fuelType:'CNG', fuelUpi:590,  fuelCash:0,    commission:0, upiAmount:1656, cashAmount:0,    foodExp:0, servicing:0, notes:'' },
    { date:'2026-04-15', driverName:'Rocky Kumar', startKm:0,     endKm:0,     fuelType:'',    fuelUpi:0,    fuelCash:0,    commission:0, upiAmount:0,    cashAmount:0,    foodExp:0, servicing:0, notes:'ABSENT' },
    { date:'2026-04-16', driverName:'Rocky Kumar', startKm:16168, endKm:16399, fuelType:'CNG', fuelUpi:592,  fuelCash:0,    commission:0, upiAmount:1818, cashAmount:0,    foodExp:0, servicing:0, notes:'' },
    { date:'2026-04-17', driverName:'Rocky Kumar', startKm:16399, endKm:16545, fuelType:'CNG', fuelUpi:650,  fuelCash:0,    commission:0, upiAmount:559,  cashAmount:473,  foodExp:0, servicing:0, notes:'HALF DAY' },
    { date:'2026-04-18', driverName:'Rocky Kumar', startKm:16545, endKm:16683, fuelType:'CNG', fuelUpi:0,    fuelCash:560,  commission:0, upiAmount:630,  cashAmount:630,  foodExp:0, servicing:0, notes:'' },
    { date:'2026-04-19', driverName:'Rocky Kumar', startKm:16683, endKm:16800, fuelType:'CNG', fuelUpi:665,  fuelCash:0,    commission:0, upiAmount:2073, cashAmount:400,  foodExp:0, servicing:0, notes:'' },
    { date:'2026-04-20', driverName:'Rocky Kumar', startKm:0,     endKm:0,     fuelType:'',    fuelUpi:0,    fuelCash:0,    commission:0, upiAmount:0,    cashAmount:0,    foodExp:0, servicing:0, notes:'19 & 20 combined' },
    { date:'2026-04-21', driverName:'Rocky Kumar', startKm:0,     endKm:0,     fuelType:'',    fuelUpi:0,    fuelCash:1300, commission:0, upiAmount:1300, cashAmount:1300, foodExp:0, servicing:0, notes:'' },
    { date:'2026-04-22', driverName:'Rocky Kumar', startKm:0,     endKm:0,     fuelType:'',    fuelUpi:0,    fuelCash:0,    commission:0, upiAmount:0,    cashAmount:0,    foodExp:0, servicing:0, notes:'ABSENT' },
    { date:'2026-04-23', driverName:'Rocky Kumar', startKm:16800, endKm:0,     fuelType:'CNG', fuelUpi:0,    fuelCash:600,  commission:0, upiAmount:1314, cashAmount:1500, foodExp:0, servicing:0, notes:'' },
    { date:'2026-04-24', driverName:'Rocky Kumar', startKm:0,     endKm:17211, fuelType:'CNG', fuelUpi:0,    fuelCash:1060, commission:0, upiAmount:1671, cashAmount:1500, foodExp:0, servicing:0, notes:'Paid = 1800 Cash' },
    { date:'2026-04-25', driverName:'Rocky Kumar', startKm:17211, endKm:17451, fuelType:'CNG', fuelUpi:0,    fuelCash:865,  commission:0, upiAmount:1509, cashAmount:2800, foodExp:0, servicing:0, notes:'' },
    { date:'2026-04-26', driverName:'Rocky Kumar', startKm:17451, endKm:17669, fuelType:'CNG', fuelUpi:0,    fuelCash:670,  commission:0, upiAmount:0,    cashAmount:1000, foodExp:0, servicing:0, notes:'Advance payment: 3000' },
    { date:'2026-04-27', driverName:'Rocky Kumar', startKm:0,     endKm:17788, fuelType:'CNG', fuelUpi:0,    fuelCash:675,  commission:0, upiAmount:954,  cashAmount:868,  foodExp:0, servicing:0, notes:'Barati' },
    { date:'2026-04-28', driverName:'Rocky Kumar', startKm:0,     endKm:0,     fuelType:'',    fuelUpi:0,    fuelCash:0,    commission:0, upiAmount:0,    cashAmount:0,    foodExp:0, servicing:0, notes:'ABSENT' },
    { date:'2026-04-29', driverName:'Rocky Kumar', startKm:0,     endKm:0,     fuelType:'',    fuelUpi:0,    fuelCash:0,    commission:0, upiAmount:0,    cashAmount:0,    foodExp:0, servicing:0, notes:'ABSENT' },
    { date:'2026-04-30', driverName:'Rocky Kumar', startKm:0,     endKm:0,     fuelType:'',    fuelUpi:0,    fuelCash:1000, commission:0, upiAmount:0,    cashAmount:6500, foodExp:0, servicing:0, notes:'' },
  ];

  // Combine both months
  const allSeed = [...october, ...april];

  records = allSeed.map((r, i) => ({
    id: 'seed_' + i,
    ...r,
    extraExpCash:  r.extraExpCash  || 0,
    extraExpUpi:   r.extraExpUpi   || 0,
    cashIntoUpi:   r.cashIntoUpi   || 0,
    cashPayDriver: Math.max(0, (r.cashAmount||0) - (r.fuelCash||0)),
    synced:        false,
  }));

  // Also register Nitish Kumar as a driver
  if (!drivers.includes('Nitish Kumar')) drivers.push('Nitish Kumar');
  saveDrivers();
  saveRecords();
}

// ─── CALCULATIONS ─────────────────────────────────────
function calcRecord(r) {
  const startKm      = parseFloat(r.startKm)      || 0;
  const endKm        = parseFloat(r.endKm)        || 0;
  const fuelUpi      = parseFloat(r.fuelUpi)      || 0;
  const fuelCash     = parseFloat(r.fuelCash)     || 0;
  const foodExp      = parseFloat(r.foodExp)      || 0;
  const servicing    = parseFloat(r.servicing)    || 0;
  const commission   = parseFloat(r.commission)   || 0;
  const upiAmount    = parseFloat(r.upiAmount)    || 0;
  const cashAmount   = parseFloat(r.cashAmount)   || 0;
  const extraExpCash = parseFloat(r.extraExpCash) || 0;
  const extraExpUpi  = parseFloat(r.extraExpUpi)  || 0;

  const totalKm      = (endKm > startKm) ? (endKm - startKm) : (parseFloat(r.totalKm) || 0);
  const totalFuel    = fuelUpi + fuelCash;
  const totalFare    = upiAmount + cashAmount;
  const totalExpenses= totalFuel + foodExp + servicing + commission + extraExpCash + extraExpUpi;
  const netProfit    = totalFare - totalExpenses;
  // owner gets = net profit (what stays after all expenses)
  const ownerReceived= netProfit;

  return { totalKm, totalFuel, totalFare, totalExpenses, netProfit, ownerReceived };
}

// ─── FILTER / MONTH HELPERS ───────────────────────────
function setDefaultMonth() {
  const now = new Date();
  filterMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const sel = document.getElementById('filterMonth');
  if (sel) sel.value = filterMonth;
  const sel2 = document.getElementById('dashMonth');
  if (sel2) sel2.value = filterMonth;
}

function getFilteredRecords() {
  return records.filter(r => {
    const monthMatch  = !filterMonth  || r.date.startsWith(filterMonth);
    const driverMatch = !filterDriver || r.driverName === filterDriver;
    return monthMatch && driverMatch;
  });
}

// ─── RENDER ALL ───────────────────────────────────────
function renderAll() {
  renderDashboard();
  renderTable();
  renderMonthlySummary();
}

// ─── DASHBOARD ────────────────────────────────────────
function renderDashboard() {
  const month = document.getElementById('dashMonth')?.value || filterMonth;
  const recs  = records.filter(r => r.date.startsWith(month));

  let totalFare = 0, totalFuel = 0, totalProfit = 0;
  let totalKm   = 0, totalDays = 0, absentDays  = 0;
  let upiTotal  = 0, cashTotal = 0, foodTotal   = 0, servicingTotal = 0;

  recs.forEach(r => {
    const c = calcRecord(r);
    const isAbsent = isAbsentDay(r);
    totalFare   += c.totalFare;
    totalFuel   += c.totalFuel;
    totalProfit += c.netProfit;
    totalKm     += c.totalKm;
    foodTotal   += parseFloat(r.foodExp)  || 0;
    servicingTotal += parseFloat(r.servicing) || 0;
    if (!isAbsent && c.totalFare > 0) totalDays++;
    if (isAbsent) absentDays++;
    upiTotal  += parseFloat(r.upiAmount)  || 0;
    cashTotal += parseFloat(r.cashAmount) || 0;
  });

  set('stat-totalFare',    fmt(totalFare));
  set('stat-totalFuel',    fmt(totalFuel));
  set('stat-netProfit',    fmt(totalProfit));
  set('stat-totalKm',      totalKm.toLocaleString('en-IN') + ' km');
  set('stat-workDays',     totalDays + ' days');
  set('stat-absentDays',   absentDays + ' days');
  set('stat-upiTotal',     fmt(upiTotal));
  set('stat-cashTotal',    fmt(cashTotal));
  set('stat-foodTotal',    fmt(foodTotal));
  set('stat-servicingTotal', fmt(servicingTotal));

  const profitEl = document.getElementById('stat-netProfit');
  if (profitEl) {
    profitEl.className = 'stat-value ' + (totalProfit >= 0 ? 'profit-positive' : 'profit-negative');
  }

  // recent 5
  const recent = [...records].sort((a,b) => b.date.localeCompare(a.date)).slice(0, 5);
  const tbody  = document.getElementById('recentTbody');
  if (!tbody) return;
  if (recent.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">No records yet</td></tr>`;
    return;
  }
  tbody.innerHTML = recent.map(r => {
    const c = calcRecord(r);
    const syncBadge = r.synced
      ? `<span class="badge badge-cng" title="Synced to Google Sheets">☁️</span>`
      : `<span class="badge badge-absent" title="Not synced">📵</span>`;
    return `<tr class="${isAbsentDay(r) ? 'absent-row' : ''}">
      <td>${formatDate(r.date)}</td>
      <td>${r.driverName || '—'}</td>
      <td>${c.totalKm > 0 ? c.totalKm + ' km' : '—'}</td>
      <td>${fuelBadge(r.fuelType)}</td>
      <td>${fmt(c.totalFare)}</td>
      <td class="${c.netProfit >= 0 ? 'profit-positive' : 'profit-negative'}">${fmt(c.netProfit)}</td>
      <td>${syncBadge}</td>
    </tr>`;
  }).join('');
}

// ─── MAIN TABLE ───────────────────────────────────────
function renderTable() {
  buildTableHeader();
  buildTableBody();
  buildTableFooter();
  renderDriverCashSummary();
}

// ─── DRIVER CASH SUMMARY (below table) ───────────────
function renderDriverCashSummary() {
  const container = document.getElementById('driverCashSummaryContainer');
  if (!container) return;

  const recs = getFilteredRecords().sort((a,b) => a.date.localeCompare(b.date));
  if (recs.length === 0) { container.innerHTML = ''; return; }

  // Get month label for heading
  const monthLabel = (() => {
    if (!filterMonth) return 'All Records';
    const [y, m] = filterMonth.split('-');
    return new Date(y, parseInt(m)-1, 1)
      .toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  })();

  // Group by driver
  const byDriver = {};
  recs.forEach(r => {
    const name = r.driverName || 'Unknown';
    if (!byDriver[name]) byDriver[name] = [];
    byDriver[name].push(r);
  });

  const blocks = Object.entries(byDriver).map(([driverName, dRecs]) => {
    // Totals for this driver
    let cashEarned     = 0; // total cash from rides
    let cashPayDriver  = 0; // cash driver paid to owner
    let extraExpCash   = 0; // extra cash expenses
    let salaryPaid     = 0; // salary paid out (we treat advance/salary from notes if any)
    let cashIntoUpi    = 0; // cash converted to UPI by driver

    dRecs.forEach(r => {
      cashEarned    += parseFloat(r.cashAmount)    || 0;
      cashPayDriver += parseFloat(r.cashPayDriver) || 0;
      extraExpCash  += parseFloat(r.extraExpCash)  || 0;
      cashIntoUpi   += parseFloat(r.cashIntoUpi)   || 0;
    });

    // Net cash owner should receive:
    // cashEarned (all cash rides) - cashPayDriver (driver gave back) - extraExpCash
    const cashReceivedByDriver = cashEarned;
    const rockyJiPay           = cashPayDriver;    // what driver returned
    const extraExp             = extraExpCash;
    // Total = what driver STILL owes / owner actually got
    const totalAfterDeductions = cashReceivedByDriver - rockyJiPay - extraExp - cashIntoUpi;
    const netToOwner           = totalAfterDeductions - salaryPaid;

    // Row color logic
    const profitColor = netToOwner >= 0 ? '#166534' : '#991b1b';
    const profitBg    = netToOwner >= 0 ? '#dcfce7' : '#fee2e2';

    return `
      <div class="driver-cash-summary-box">
        <div class="dcs-header">
          <div>
            <span class="dcs-title">📋 Summary — ${monthLabel}</span>
          </div>
          <div class="dcs-driver-badge">👤 ${driverName}</div>
        </div>

        <table class="dcs-table">
          <thead>
            <tr>
              <th colspan="2">Driver Cash Received Details</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>💵 Total Cash Received (from rides)</td>
              <td class="dcs-amount">${fmt(cashReceivedByDriver)}</td>
            </tr>
            <tr class="dcs-deduct">
              <td>↩️ Cash Paid Back by Driver</td>
              <td class="dcs-amount dcs-minus">− ${fmt(rockyJiPay)}</td>
            </tr>
            <tr class="dcs-deduct">
              <td>🧾 Extra Expenses (Cash)</td>
              <td class="dcs-amount dcs-minus">− ${fmt(extraExp)}</td>
            </tr>
            ${cashIntoUpi > 0 ? `
            <tr class="dcs-deduct">
              <td>🔄 Cash Converted to UPI by Driver</td>
              <td class="dcs-amount dcs-minus">− ${fmt(cashIntoUpi)}</td>
            </tr>` : ''}
            <tr class="dcs-subtotal">
              <td>📊 Sub Total</td>
              <td class="dcs-amount">${fmt(totalAfterDeductions)}</td>
            </tr>
            <tr class="dcs-deduct">
              <td>💰 Salary Paid</td>
              <td class="dcs-amount dcs-minus">− ${fmt(salaryPaid)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="dcs-total-row" style="background:${profitBg};color:${profitColor}">
              <td>🏦 Total Amount (Owner Receives from Cash)</td>
              <td class="dcs-amount dcs-final">${fmt(netToOwner)}</td>
            </tr>
          </tfoot>
        </table>

        <div class="dcs-footer-note">
          <span>📅 ${dRecs.length} records in ${monthLabel}</span>
          <span>Working days: ${dRecs.filter(r => !isAbsentDay(r) && ((parseFloat(r.cashAmount)||0)+(parseFloat(r.upiAmount)||0)) > 0).length}</span>
          <span>Absent: ${dRecs.filter(r => isAbsentDay(r)).length}</span>
        </div>
      </div>`;
  });

  container.innerHTML = `
    <div style="margin-top:24px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px">
        <h3 style="font-size:15px;font-weight:700;color:var(--gray-800)">💳 Driver Cash Summary — ${monthLabel}</h3>
        <span style="font-size:12px;color:var(--gray-500)">Auto-calculated from filtered records</span>
      </div>
      <div class="dcs-grid">${blocks.join('')}</div>
    </div>`;
}

function buildTableHeader() {
  const thead = document.getElementById('mainThead');
  if (!thead) return;
  const cols = getVisibleCols();
  thead.innerHTML = `<tr>${cols.map(c => `<th>${c.label}</th>`).join('')}</tr>`;
}

function buildTableBody() {
  const tbody = document.getElementById('mainTbody');
  if (!tbody) return;
  const recs = getFilteredRecords().sort((a,b) => a.date.localeCompare(b.date));

  if (recs.length === 0) {
    const colCount = getVisibleCols().length;
    tbody.innerHTML = `<tr><td colspan="${colCount}">
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <p>No records found for this filter</p>
        <small>Add a new entry or change the month/driver filter</small>
      </div></td></tr>`;
    return;
  }

  const cols = getVisibleCols();
  tbody.innerHTML = recs.map(r => {
    const c = calcRecord(r);
    const absent = isAbsentDay(r);
    return `<tr class="${absent ? 'absent-row' : ''}">
      ${cols.map(col => renderCell(col.id, r, c, absent)).join('')}
    </tr>`;
  }).join('');
}

function buildTableFooter() {
  const tfoot = document.getElementById('mainTfoot');
  if (!tfoot) return;
  const recs = getFilteredRecords();
  const cols = getVisibleCols();

  const t = {
    totalKm:0, fuelUpi:0, fuelCash:0, foodExp:0, servicing:0,
    commission:0, upiAmount:0, cashAmount:0, totalFare:0,
    totalExpenses:0, netProfit:0, ownerReceived:0,
    cashPayDriver:0, extraExpCash:0, extraExpUpi:0, cashIntoUpi:0,
  };

  recs.forEach(r => {
    const c = calcRecord(r);
    t.totalKm       += c.totalKm;
    t.fuelUpi       += parseFloat(r.fuelUpi)       || 0;
    t.fuelCash      += parseFloat(r.fuelCash)      || 0;
    t.foodExp       += parseFloat(r.foodExp)        || 0;
    t.servicing     += parseFloat(r.servicing)      || 0;
    t.commission    += parseFloat(r.commission)     || 0;
    t.upiAmount     += parseFloat(r.upiAmount)      || 0;
    t.cashAmount    += parseFloat(r.cashAmount)     || 0;
    t.totalFare     += c.totalFare;
    t.totalExpenses += c.totalExpenses;
    t.netProfit     += c.netProfit;
    t.ownerReceived += c.ownerReceived;
    t.cashPayDriver += parseFloat(r.cashPayDriver)  || 0;
    t.extraExpCash  += parseFloat(r.extraExpCash)   || 0;
    t.extraExpUpi   += parseFloat(r.extraExpUpi)    || 0;
    t.cashIntoUpi   += parseFloat(r.cashIntoUpi)    || 0;
  });

  const cellMap = {
    date:          'TOTAL',
    driverName:    `${recs.length} records`,
    startKm:       '', endKm: '',
    totalKm:       t.totalKm.toLocaleString('en-IN') + ' km',
    fuelType:      '',
    fuelUpi:       fmt(t.fuelUpi),
    fuelCash:      fmt(t.fuelCash),
    foodExp:       fmt(t.foodExp),
    servicing:     fmt(t.servicing),
    commission:    fmt(t.commission),
    upiAmount:     fmt(t.upiAmount),
    cashAmount:    fmt(t.cashAmount),
    totalFare:     fmt(t.totalFare),
    totalExpenses: fmt(t.totalExpenses),
    netProfit:     fmt(t.netProfit),
    ownerReceived: fmt(t.ownerReceived),
    cashPayDriver: fmt(t.cashPayDriver),
    extraExpCash:  fmt(t.extraExpCash),
    extraExpUpi:   fmt(t.extraExpUpi),
    cashIntoUpi:   fmt(t.cashIntoUpi),
    notes:         '', syncStatus: '', actions: '',
  };

  tfoot.innerHTML = `<tr class="tfoot-row">
    ${cols.map(c => `<td>${cellMap[c.id] ?? ''}</td>`).join('')}
  </tr>`;
}

function renderCell(colId, r, c, absent) {
  if (absent && !['date','driverName','notes','syncStatus','actions'].includes(colId)) {
    return `<td>—</td>`;
  }

  switch (colId) {
    case 'date':          return `<td><strong>${formatDate(r.date)}</strong></td>`;
    case 'driverName':    return `<td>${r.driverName || '—'}</td>`;
    case 'startKm':       return `<td>${r.startKm > 0 ? r.startKm.toLocaleString('en-IN') : '—'}</td>`;
    case 'endKm':         return `<td>${r.endKm   > 0 ? r.endKm.toLocaleString('en-IN')   : '—'}</td>`;
    case 'totalKm':       return `<td>${c.totalKm > 0 ? c.totalKm + ' km' : '—'}</td>`;
    case 'fuelType':      return `<td>${fuelBadge(r.fuelType)}</td>`;
    case 'fuelUpi':       return `<td>${r.fuelUpi    > 0 ? fmt(r.fuelUpi)    : '—'}</td>`;
    case 'fuelCash':      return `<td>${r.fuelCash   > 0 ? fmt(r.fuelCash)   : '—'}</td>`;
    case 'foodExp':       return `<td>${r.foodExp    > 0 ? fmt(r.foodExp)    : '—'}</td>`;
    case 'servicing':     return `<td>${r.servicing  > 0 ? fmt(r.servicing)  : '—'}</td>`;
    case 'commission':    return `<td>${r.commission > 0 ? fmt(r.commission) : '—'}</td>`;
    case 'upiAmount':     return `<td>${r.upiAmount  > 0 ? fmt(r.upiAmount)  : '—'}</td>`;
    case 'cashAmount':    return `<td>${r.cashAmount > 0 ? fmt(r.cashAmount) : '—'}</td>`;
    case 'totalFare':     return `<td><strong>${fmt(c.totalFare)}</strong></td>`;
    case 'totalExpenses': return `<td style="color:var(--danger)">${fmt(c.totalExpenses)}</td>`;
    case 'netProfit':     return `<td class="${c.netProfit >= 0 ? 'profit-positive' : 'profit-negative'}">${fmt(c.netProfit)}</td>`;
    case 'ownerReceived': return `<td class="${c.ownerReceived >= 0 ? 'profit-positive' : 'profit-negative'}">${fmt(c.ownerReceived)}</td>`;
    case 'cashPayDriver': return `<td>${r.cashPayDriver > 0 ? fmt(r.cashPayDriver) : '—'}</td>`;
    case 'extraExpCash':  return `<td>${r.extraExpCash > 0 ? fmt(r.extraExpCash)   : '—'}</td>`;
    case 'extraExpUpi':   return `<td>${r.extraExpUpi  > 0 ? fmt(r.extraExpUpi)    : '—'}</td>`;
    case 'cashIntoUpi':   return `<td>${r.cashIntoUpi  > 0 ? fmt(r.cashIntoUpi)    : '—'}</td>`;
    case 'notes':         return `<td style="max-width:160px;white-space:normal">${r.notes ? `<small style="color:var(--gray-500)">${r.notes}</small>` : '—'}</td>`;
    case 'syncStatus':
      return r.synced
        ? `<td><span class="badge badge-cng" title="Synced">☁️ OK</span></td>`
        : `<td><span class="badge badge-absent" title="Not synced yet">📵</span></td>`;
    case 'actions':
      return `<td><div style="display:flex;gap:4px">
        <button class="btn btn-sm btn-primary btn-icon" title="Edit" onclick="openEdit('${r.id}')">✏️</button>
        <button class="btn btn-sm btn-danger btn-icon" title="Delete" onclick="deleteRecord('${r.id}')">🗑️</button>
        ${!r.synced && sheetsUrl ? `<button class="btn btn-sm btn-outline btn-icon" title="Sync to Sheets" onclick="syncSingleRecord('${r.id}')">☁️</button>` : ''}
      </div></td>`;
    default: return `<td>—</td>`;
  }
}

// ─── MONTHLY SUMMARY + MONEY FLOW ────────────────────
function renderMonthlySummary() {
  const container = document.getElementById('summaryContainer');
  if (!container) return;

  const recs = getFilteredRecords();

  // accumulators
  let totalFare = 0, totalExpenses = 0, netProfit = 0, ownerReceived = 0;
  let totalKm   = 0, totalDays = 0, absentDays = 0;
  let upiEarned = 0, cashEarned = 0;
  let fuelUpiT  = 0, fuelCashT  = 0, foodTotal = 0, servicingTotal = 0;
  let commissionT = 0, extraCashT = 0, extraUpiT = 0;
  let cashPayDriverT = 0, cashIntoUpiT = 0;

  recs.forEach(r => {
    const c = calcRecord(r);
    totalFare    += c.totalFare;
    totalExpenses+= c.totalExpenses;
    netProfit    += c.netProfit;
    ownerReceived+= c.ownerReceived;
    totalKm      += c.totalKm;
    upiEarned    += parseFloat(r.upiAmount)    || 0;
    cashEarned   += parseFloat(r.cashAmount)   || 0;
    fuelUpiT     += parseFloat(r.fuelUpi)      || 0;
    fuelCashT    += parseFloat(r.fuelCash)     || 0;
    foodTotal    += parseFloat(r.foodExp)       || 0;
    servicingTotal += parseFloat(r.servicing)  || 0;
    commissionT  += parseFloat(r.commission)   || 0;
    extraCashT   += parseFloat(r.extraExpCash) || 0;
    extraUpiT    += parseFloat(r.extraExpUpi)  || 0;
    cashPayDriverT += parseFloat(r.cashPayDriver) || 0;
    cashIntoUpiT += parseFloat(r.cashIntoUpi)  || 0;
    if (isAbsentDay(r)) absentDays++;
    else if (c.totalFare > 0) totalDays++;
  });

  const totalFuelAll = fuelUpiT + fuelCashT;
  const avgProfit    = totalDays > 0 ? Math.round(netProfit / totalDays) : 0;

  container.innerHTML = `

    <!-- ROW 1: Earnings + Expenses -->
    <div class="summary-grid" style="margin-bottom:20px">

      <div class="summary-box green">
        <h3>💰 Earnings Breakdown</h3>
        <div class="summary-row"><span class="label">UPI Earned</span><span class="value blue">${fmt(upiEarned)}</span></div>
        <div class="summary-row"><span class="label">Cash Earned</span><span class="value blue">${fmt(cashEarned)}</span></div>
        <div class="summary-row" style="border-top:2px solid var(--gray-200);margin-top:6px;padding-top:8px">
          <span class="label" style="font-weight:700">Total Fare</span>
          <span class="value green" style="font-size:16px">${fmt(totalFare)}</span>
        </div>
      </div>

      <div class="summary-box red">
        <h3>💸 Expenses Breakdown</h3>
        <div class="summary-row"><span class="label">⛽ Fuel (UPI)</span><span class="value red">${fmt(fuelUpiT)}</span></div>
        <div class="summary-row"><span class="label">⛽ Fuel (Cash)</span><span class="value red">${fmt(fuelCashT)}</span></div>
        <div class="summary-row"><span class="label">🍔 Food</span><span class="value red">${fmt(foodTotal)}</span></div>
        <div class="summary-row"><span class="label">🔧 Servicing</span><span class="value red">${fmt(servicingTotal)}</span></div>
        <div class="summary-row"><span class="label">🤝 Commission</span><span class="value red">${fmt(commissionT)}</span></div>
        <div class="summary-row"><span class="label">🧾 Extra Expenses</span><span class="value red">${fmt(extraCashT + extraUpiT)}</span></div>
        <div class="summary-row" style="border-top:2px solid var(--gray-200);margin-top:6px;padding-top:8px">
          <span class="label" style="font-weight:700">Total Expenses</span>
          <span class="value red" style="font-size:16px">${fmt(totalExpenses)}</span>
        </div>
      </div>

      <div class="summary-box purple">
        <h3>📊 Net Profit / Loss</h3>
        <div class="summary-row"><span class="label">Total Fare Earned</span><span class="value green">${fmt(totalFare)}</span></div>
        <div class="summary-row"><span class="label">Total Expenses</span><span class="value red">${fmt(totalExpenses)}</span></div>
        <div class="summary-row" style="border-top:2px solid var(--gray-200);margin-top:6px;padding-top:10px">
          <span class="label" style="font-weight:700;font-size:14px">NET PROFIT</span>
          <span class="value ${netProfit >= 0 ? 'green' : 'red'}" style="font-size:22px">${fmt(netProfit)}</span>
        </div>
        <div class="summary-row" style="margin-top:6px">
          <span class="label">Avg Profit/Day</span>
          <span class="value ${avgProfit >= 0 ? 'green':'red'}">${fmt(avgProfit)}</span>
        </div>
      </div>

      <div class="summary-box yellow">
        <h3>🚗 Trip Statistics</h3>
        <div class="summary-row"><span class="label">Total Records</span><span class="value">${recs.length}</span></div>
        <div class="summary-row"><span class="label">Working Days</span><span class="value blue">${totalDays}</span></div>
        <div class="summary-row"><span class="label">Absent Days</span><span class="value red">${absentDays}</span></div>
        <div class="summary-row"><span class="label">Total KM Driven</span><span class="value">${totalKm.toLocaleString('en-IN')} km</span></div>
        <div class="summary-row"><span class="label">Avg KM/Day</span><span class="value">${totalDays > 0 ? Math.round(totalKm/totalDays) : 0} km</span></div>
        <div class="summary-row"><span class="label">Total Fuel Used</span><span class="value red">${fmt(totalFuelAll)}</span></div>
      </div>

    </div>

    <!-- ROW 2: MONEY FLOW OVERVIEW -->
    <div class="money-flow-card">
      <div class="money-flow-header">
        <span>💹 Monthly Money Flow — Where Did The Money Go?</span>
        <span style="font-size:12px;opacity:0.8">Complete breakdown for the selected month</span>
      </div>
      <div class="money-flow-body">

        <!-- INCOME SIDE -->
        <div class="flow-column income-col">
          <div class="flow-col-title">📥 Total Income</div>
          <div class="flow-item income">
            <span>UPI from Rides</span>
            <strong>${fmt(upiEarned)}</strong>
          </div>
          <div class="flow-item income">
            <span>Cash from Rides</span>
            <strong>${fmt(cashEarned)}</strong>
          </div>
          <div class="flow-total income-total">
            <span>TOTAL INCOME</span>
            <strong>${fmt(totalFare)}</strong>
          </div>
        </div>

        <!-- ARROW -->
        <div class="flow-arrow">→</div>

        <!-- EXPENSE SIDE -->
        <div class="flow-column expense-col">
          <div class="flow-col-title">📤 Money Spent On</div>
          ${buildExpenseBar('⛽ Fuel (Total)',    fuelUpiT + fuelCashT, totalFare)}
          ${buildExpenseBar('🍔 Food',            foodTotal,            totalFare)}
          ${buildExpenseBar('🔧 Servicing',       servicingTotal,       totalFare)}
          ${buildExpenseBar('🤝 Commission',      commissionT,          totalFare)}
          ${buildExpenseBar('🧾 Extra (Cash)',     extraCashT,           totalFare)}
          ${buildExpenseBar('🧾 Extra (UPI)',      extraUpiT,            totalFare)}
          <div class="flow-total expense-total">
            <span>TOTAL SPENT</span>
            <strong>${fmt(totalExpenses)}</strong>
          </div>
        </div>

        <!-- ARROW -->
        <div class="flow-arrow">→</div>

        <!-- OWNER SIDE -->
        <div class="flow-column owner-col">
          <div class="flow-col-title">👑 Owner Receives</div>
          <div class="flow-item owner">
            <span>Total Fare</span>
            <strong>${fmt(totalFare)}</strong>
          </div>
          <div class="flow-item expense">
            <span>− All Expenses</span>
            <strong>− ${fmt(totalExpenses)}</strong>
          </div>
          <div class="flow-total owner-total ${netProfit >= 0 ? '' : 'negative'}">
            <span>NET TO OWNER</span>
            <strong>${fmt(netProfit)}</strong>
          </div>
          <div style="margin-top:12px;padding:10px;background:rgba(255,255,255,0.15);border-radius:8px;font-size:12px">
            <div style="margin-bottom:4px">💵 Cash Paid by Driver: <strong>${fmt(cashPayDriverT)}</strong></div>
            <div>🔄 Cash→UPI Transfers: <strong>${fmt(cashIntoUpiT)}</strong></div>
          </div>
        </div>

      </div>
    </div>

    <!-- ROW 3: EXPENSE PERCENT TABLE -->
    <div class="card" style="margin-top:20px">
      <div class="card-header">
        <span class="card-title">📊 Expense Breakdown by Category</span>
      </div>
      <div class="card-body">
        <table style="min-width:auto;width:100%">
          <thead>
            <tr style="background:var(--gray-800);color:white">
              <th style="padding:10px 12px;text-align:left">Category</th>
              <th style="padding:10px 12px;text-align:right">Amount</th>
              <th style="padding:10px 12px;text-align:right">% of Income</th>
              <th style="padding:10px 12px;text-align:left">Visual</th>
            </tr>
          </thead>
          <tbody>
            ${buildExpenseRow('⛽ Fuel (UPI)',    fuelUpiT,    totalFare, '#ef4444')}
            ${buildExpenseRow('⛽ Fuel (Cash)',   fuelCashT,   totalFare, '#f97316')}
            ${buildExpenseRow('🍔 Food',          foodTotal,   totalFare, '#eab308')}
            ${buildExpenseRow('🔧 Servicing',     servicingTotal, totalFare, '#8b5cf6')}
            ${buildExpenseRow('🤝 Commission',    commissionT, totalFare, '#06b6d4')}
            ${buildExpenseRow('🧾 Extra (Cash)',  extraCashT,  totalFare, '#6b7280')}
            ${buildExpenseRow('🧾 Extra (UPI)',   extraUpiT,   totalFare, '#9ca3af')}
          </tbody>
          <tfoot>
            <tr style="background:var(--gray-800);color:white;font-weight:700">
              <td style="padding:10px 12px">TOTAL EXPENSES</td>
              <td style="padding:10px 12px;text-align:right">${fmt(totalExpenses)}</td>
              <td style="padding:10px 12px;text-align:right">${totalFare > 0 ? Math.round(totalExpenses/totalFare*100) : 0}%</td>
              <td style="padding:10px 12px"></td>
            </tr>
            <tr style="background:${netProfit >= 0 ? '#166534':'#7f1d1d'};color:white;font-weight:700">
              <td style="padding:10px 12px">👑 OWNER NET PROFIT</td>
              <td style="padding:10px 12px;text-align:right">${fmt(netProfit)}</td>
              <td style="padding:10px 12px;text-align:right">${totalFare > 0 ? Math.round(netProfit/totalFare*100) : 0}%</td>
              <td style="padding:10px 12px"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>`;
}

function buildExpenseBar(label, amount, total) {
  if (amount <= 0) return '';
  const pct = total > 0 ? Math.round(amount / total * 100) : 0;
  return `<div class="flow-item expense">
    <span>${label} <small style="opacity:0.7">(${pct}%)</small></span>
    <strong>${fmt(amount)}</strong>
  </div>`;
}

function buildExpenseRow(label, amount, total, color) {
  const pct = total > 0 ? (amount / total * 100) : 0;
  const barW = Math.min(100, pct);
  return `<tr style="border-bottom:1px solid var(--gray-100)">
    <td style="padding:10px 12px">${label}</td>
    <td style="padding:10px 12px;text-align:right;font-weight:600;color:var(--danger)">${fmt(amount)}</td>
    <td style="padding:10px 12px;text-align:right;color:var(--gray-600)">${pct.toFixed(1)}%</td>
    <td style="padding:10px 12px;min-width:120px">
      <div style="background:var(--gray-100);border-radius:4px;height:8px;overflow:hidden">
        <div style="background:${color};height:100%;width:${barW}%;border-radius:4px;transition:width 0.3s"></div>
      </div>
    </td>
  </tr>`;
}

// ─── FORM OPEN/CLOSE ──────────────────────────────────
function openAddModal() {
  editingId = null;
  document.getElementById('modalTitle').textContent = '➕ Add New Entry';
  clearForm();
  document.getElementById('fDate').value = todayISO();
  openModal('entryModal');
}

function openEdit(id) {
  const r = records.find(x => x.id === id);
  if (!r) return;
  editingId = id;
  document.getElementById('modalTitle').textContent = '✏️ Edit Entry';
  fillForm(r);
  openModal('entryModal');
}

function fillForm(r) {
  const fields = ['date','driverName','startKm','endKm','fuelType','fuelUpi','fuelCash',
                  'foodExp','servicing','commission','upiAmount','cashAmount',
                  'cashPayDriver','extraExpCash','extraExpUpi','cashIntoUpi','notes'];
  fields.forEach(f => {
    const el = document.getElementById('f' + capitalize(f));
    if (el) el.value = r[f] ?? '';
  });
}

function clearForm() {
  const fields = ['date','driverName','startKm','endKm','fuelType','fuelUpi','fuelCash',
                  'foodExp','servicing','commission','upiAmount','cashAmount',
                  'cashPayDriver','extraExpCash','extraExpUpi','cashIntoUpi','notes'];
  fields.forEach(f => {
    const el = document.getElementById('f' + capitalize(f));
    if (el) el.value = '';
  });
}

// ─── FORM SAVE ────────────────────────────────────────
function saveEntry() {
  const getVal = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
  const getNum = id => parseFloat(getVal(id)) || 0;

  const date = getVal('fDate');
  if (!date) { showToast('Please select a date', 'error'); return; }

  const rec = {
    id:            editingId || genId(),
    date,
    driverName:    getVal('fDriverName'),
    startKm:       getNum('fStartKm'),
    endKm:         getNum('fEndKm'),
    fuelType:      getVal('fFuelType'),
    fuelUpi:       getNum('fFuelUpi'),
    fuelCash:      getNum('fFuelCash'),
    foodExp:       getNum('fFoodExp'),
    servicing:     getNum('fServicing'),
    commission:    getNum('fCommission'),
    upiAmount:     getNum('fUpiAmount'),
    cashAmount:    getNum('fCashAmount'),
    cashPayDriver: getNum('fCashPayDriver'),
    extraExpCash:  getNum('fExtraExpCash'),
    extraExpUpi:   getNum('fExtraExpUpi'),
    cashIntoUpi:   getNum('fCashIntoUpi'),
    notes:         getVal('fNotes'),
    synced:        false,
  };

  if (editingId) {
    const idx = records.findIndex(x => x.id === editingId);
    if (idx !== -1) { rec.synced = records[idx].synced; records[idx] = rec; }
    showToast('Entry updated ✓', 'success');
  } else {
    records.push(rec);
    showToast('Entry added ✓', 'success');
  }

  saveRecords();
  closeModal('entryModal');
  renderAll();
  updateDriverOptions();
  populateMonthPickers();

  // Auto-sync to Google Sheets if URL is configured
  if (sheetsUrl) {
    syncToSheets(rec);
  }
}

// ─── GOOGLE SHEETS SYNC ───────────────────────────────
function syncToSheets(rec) {
  if (!sheetsUrl) {
    showToast('No Google Sheets URL configured', 'error');
    return;
  }

  const c = calcRecord(rec);
  const payload = {
    id:            rec.id,
    date:          formatDate(rec.date),
    driverName:    rec.driverName,
    startKm:       rec.startKm,
    endKm:         rec.endKm,
    totalKm:       c.totalKm,
    fuelType:      rec.fuelType,
    fuelUpi:       rec.fuelUpi,
    fuelCash:      rec.fuelCash,
    foodExp:       rec.foodExp,
    servicing:     rec.servicing,
    commission:    rec.commission,
    upiAmount:     rec.upiAmount,
    cashAmount:    rec.cashAmount,
    totalFare:     c.totalFare,
    totalExpenses: c.totalExpenses,
    netProfit:     c.netProfit,
    ownerReceived: c.ownerReceived,
    cashPayDriver: rec.cashPayDriver,
    extraExpCash:  rec.extraExpCash,
    extraExpUpi:   rec.extraExpUpi,
    cashIntoUpi:   rec.cashIntoUpi,
    notes:         rec.notes,
    syncedAt:      new Date().toISOString(),
  };

  showToast('Syncing to Google Sheets...', '');

  fetch(sheetsUrl, {
    method: 'POST',
    mode:   'no-cors',          // Apps Script requires no-cors
    headers: { 'Content-Type': 'application/json' },
    body:   JSON.stringify(payload),
  })
  .then(() => {
    // no-cors always resolves (can't read response), mark as synced
    markSynced(rec.id);
    showToast('Synced to Google Sheets ✓', 'success');
  })
  .catch(err => {
    console.error('Sheets sync error:', err);
    showToast('Sync failed — check URL in Admin', 'error');
  });
}

function syncSingleRecord(id) {
  const r = records.find(x => x.id === id);
  if (r) syncToSheets(r);
}

function syncAllUnsyncedRecords() {
  if (!sheetsUrl) { showToast('Configure Google Sheets URL first', 'error'); return; }
  const unsynced = records.filter(r => !r.synced);
  if (unsynced.length === 0) { showToast('All records already synced ✓', 'success'); return; }
  showToast(`Syncing ${unsynced.length} records...`, '');
  unsynced.forEach((r, i) => setTimeout(() => syncToSheets(r), i * 300));
}

function markSynced(id) {
  const idx = records.findIndex(x => x.id === id);
  if (idx !== -1) {
    records[idx].synced = true;
    saveRecords();
    renderTable();
    renderDashboard();
  }
}

// ─── DELETE ───────────────────────────────────────────
function deleteRecord(id) {
  if (!confirm('Delete this entry? This cannot be undone.')) return;
  records = records.filter(r => r.id !== id);
  saveRecords();
  renderAll();
  showToast('Entry deleted', 'error');
}

// ─── DRIVER MANAGEMENT ────────────────────────────────
function renderDriverOptions() { updateDriverOptions(); }

function updateDriverOptions() {
  const fromRecords = [...new Set(records.map(r => r.driverName).filter(Boolean))];
  drivers = [...new Set([...drivers, ...fromRecords])];
  saveDrivers();

  document.querySelectorAll('.driver-select').forEach(sel => {
    const cur = sel.value;
    sel.innerHTML = `<option value="">-- Select Driver --</option>` +
      drivers.map(d => `<option value="${d}" ${d===cur?'selected':''}>${d}</option>`).join('');
    if (cur) sel.value = cur;
  });

  const filterSel = document.getElementById('filterDriver');
  if (filterSel) {
    const cur = filterSel.value;
    filterSel.innerHTML = `<option value="">All Drivers</option>` +
      drivers.map(d => `<option value="${d}" ${d===cur?'selected':''}>${d}</option>`).join('');
  }
}

function addDriver() {
  const input = document.getElementById('newDriverInput');
  if (!input) return;
  const name = input.value.trim();
  if (!name)              { showToast('Enter driver name', 'error'); return; }
  if (drivers.includes(name)) { showToast('Driver already exists', 'error'); return; }
  drivers.push(name);
  saveDrivers();
  updateDriverOptions();
  input.value = '';
  showToast(`Driver "${name}" added ✓`, 'success');
  renderDriverList();
}

function removeDriver(name) {
  if (!confirm(`Remove driver "${name}"?`)) return;
  drivers = drivers.filter(d => d !== name);
  saveDrivers();
  updateDriverOptions();
  renderDriverList();
  showToast(`Driver "${name}" removed`, 'error');
}

function renderDriverList() {
  const el = document.getElementById('driverList');
  if (!el) return;
  el.innerHTML = drivers.length === 0
    ? `<p style="color:var(--gray-400)">No drivers added yet.</p>`
    : drivers.map(d => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border:1px solid var(--gray-200);border-radius:8px;background:var(--gray-50)">
        <span style="font-weight:500">👤 ${d}</span>
        <button class="btn btn-sm btn-danger" onclick="removeDriver('${d}')">Remove</button>
      </div>`).join('');
}

// ─── COLUMN MANAGER ───────────────────────────────────
function renderColumnManager() {
  const container = document.getElementById('colManager');
  if (!container) return;
  container.innerHTML = ALL_COLUMNS
    .filter(c => !c.always)
    .map(c => `
      <label class="col-toggle">
        <input type="checkbox" id="col_${c.id}"
          ${visibleCols.includes(c.id) ? 'checked' : ''}
          onchange="toggleColumn('${c.id}', this.checked)">
        <span>${c.label}</span>
      </label>`).join('');
}

function toggleColumn(id, show) {
  if (show) { if (!visibleCols.includes(id)) visibleCols.push(id); }
  else        { visibleCols = visibleCols.filter(c => c !== id); }
  saveCols();
  renderTable();
}

function getVisibleCols() {
  return ALL_COLUMNS.filter(c => c.always || visibleCols.includes(c.id));
}

// ─── NAVIGATION ───────────────────────────────────────
function switchView(view) {
  currentView = view;
  document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
  const viewEl = document.getElementById('view-' + view);
  const navEl  = document.getElementById('nav-' + view);
  if (viewEl) viewEl.classList.add('active');
  if (navEl)  navEl.classList.add('active');
  if (view === 'admin')     renderDriverList();
  if (view === 'table')     renderTable();
  if (view === 'summary')   renderMonthlySummary();
  if (view === 'dashboard') renderDashboard();
}

// ─── FILTERS ──────────────────────────────────────────
function onFilterMonthChange(val) {
  filterMonth = val;
  renderAll();
  ['dashMonth','filterMonth','summaryMonth'].forEach(id => {
    const el = document.getElementById(id);
    if (el && el.value !== val) el.value = val;
  });
}

function onFilterDriverChange(val) {
  filterDriver = val;
  renderAll();
}

function onDashMonthChange(val) {
  filterMonth = val;
  renderAll();
  const tabM = document.getElementById('filterMonth');
  if (tabM && tabM.value !== val) tabM.value = val;
  const sumM = document.getElementById('summaryMonth');
  if (sumM && sumM.value !== val) sumM.value = val;
}

// ─── MODAL HELPERS ────────────────────────────────────
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('open');
});

// ─── EXPORT CSV ───────────────────────────────────────
function exportCSV() {
  const recs = getFilteredRecords().sort((a,b) => a.date.localeCompare(b.date));
  const cols = ALL_COLUMNS.filter(c => c.id !== 'actions' && c.id !== 'syncStatus');

  const header = cols.map(c => `"${c.label}"`).join(',');
  const rows = recs.map(r => {
    const c = calcRecord(r);
    const map = {
      date: formatDate(r.date), driverName: r.driverName,
      startKm: r.startKm, endKm: r.endKm, totalKm: c.totalKm,
      fuelType: r.fuelType, fuelUpi: r.fuelUpi, fuelCash: r.fuelCash,
      foodExp: r.foodExp, servicing: r.servicing,
      commission: r.commission, upiAmount: r.upiAmount, cashAmount: r.cashAmount,
      totalFare: c.totalFare, totalExpenses: c.totalExpenses,
      netProfit: c.netProfit, ownerReceived: c.ownerReceived,
      cashPayDriver: r.cashPayDriver, extraExpCash: r.extraExpCash,
      extraExpUpi: r.extraExpUpi, cashIntoUpi: r.cashIntoUpi, notes: r.notes,
    };
    return cols.map(col => `"${map[col.id] ?? ''}"`).join(',');
  });

  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `car-report-${filterMonth || 'all'}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('CSV exported ✓', 'success');
}

function printReport() { window.print(); }

function resetAllData() {
  if (!confirm('⚠️ This will DELETE ALL records permanently. Are you sure?')) return;
  if (!confirm('Final confirmation: delete all data?')) return;
  localStorage.removeItem(STORAGE_KEY);
  records = [];
  renderAll();
  showToast('All data cleared', 'error');
}

// ─── TOAST ────────────────────────────────────────────
function showToast(msg, type = '') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', '': 'ℹ️' };
  toast.innerHTML = `${icons[type] ?? 'ℹ️'} ${msg}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ─── UTILITIES ────────────────────────────────────────
function fmt(n) {
  const num = parseFloat(n) || 0;
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d}-${months[parseInt(m)-1]}-${y}`;
}

function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}

function genId() {
  return 'r_' + Date.now() + '_' + Math.random().toString(36).slice(2,7);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function set(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function isAbsentDay(r) {
  return (r.notes || '').toUpperCase().includes('ABSENT') &&
         (parseFloat(r.upiAmount) || 0) === 0 &&
         (parseFloat(r.cashAmount) || 0) === 0;
}

function fuelBadge(type) {
  if (!type) return '<span class="badge badge-absent">—</span>';
  const t = type.toUpperCase();
  if (t.includes('HALF'))   return '<span class="badge badge-halfday">Half Day</span>';
  if (t === 'CNG')          return '<span class="badge badge-cng">⛽ CNG</span>';
  if (t === 'PETROL')       return '<span class="badge badge-petrol">🛢️ Petrol</span>';
  if (t.includes('CNG') && t.includes('PETROL')) return '<span class="badge badge-both">CNG+Petrol</span>';
  return `<span class="badge badge-halfday">${type}</span>`;
}

// ─── MONTH PICKERS ────────────────────────────────────
function populateMonthPickers() {
  const dates  = records.map(r => r.date.substring(0,7));
  const unique = [...new Set(dates)].sort().reverse();
  if (unique.length === 0) {
    const now = new Date();
    unique.push(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`);
  }

  ['filterMonth','dashMonth','summaryMonth'].forEach(pid => {
    const sel = document.getElementById(pid);
    if (!sel) return;
    const cur = sel.value || filterMonth;
    sel.innerHTML = unique.map(m => {
      const [y, mo] = m.split('-');
      const name = new Date(y, parseInt(mo)-1, 1)
        .toLocaleString('en-IN', { month: 'long', year: 'numeric' });
      return `<option value="${m}" ${m===cur?'selected':''}>${name}</option>`;
    }).join('');
    if (cur) sel.value = cur;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(populateMonthPickers, 50);
});
