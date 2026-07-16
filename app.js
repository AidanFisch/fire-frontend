/** ---------------------------
 *  State + Defaults
 *  --------------------------*/
const LS_KEY = "fire_frontend_state_v3";

// ─── DEV MODE — set false before shipping ───────────────
const DEV_MODE = false;
// ────────────────────────────────────────────────────────
let state = {
  apiBase: "https://fire-api-wixz.onrender.com",
  apiPath: "/fire",
  mode: "yearly",
  syncModes: {},   // keyed by input field id: 'manual' | 'sync'
  inputs: {
    current_age: 25,
    end_age: 65,
    inflation: 0.025,
    todays_lifestyle_income: 80000,
    initial_savings: 500000,
    current_income: 200000,
    current_expenses: 64000,
    average_salary_increase: 0.035,
    stock_growth: 0.06,
    stock_yearly_contribution: 20000,
    starting_stock_value: 35000,
	
	stock_swr: 0.04,
	super_swr: 0.04,
    super_access_age: 60,
    super_starting_balance: 120000,
    super_sg_rate: 0.12,
    super_growth: 0.065,
    super_additional_annual: 0,
    super_extra_is_pre_tax: true,
    cpi_rate: 0.025,
    on_income_support: false
  },
  property_list: [
    {
      id: 1,
      name: "Investment 1 (Apartment)",
      purchase_price: 400000,
      current_value: 640000,
      original_loan: 325000,
      loan_balance_current: 215000,
      purchase_fees: 20000,
      monthly_rent: 2400,
      strata_quarterly: 1200,
      rates_quarterly: 900,
      other_costs_monthly: 200,
      interest_rate: 0.055,
      property_growth: 0.03,
      rental_growth: 0.03,
      year_bought: 2021,
      loan_term_years: 30,
      use_offset: true,
      is_owner_occupied: false
    },
    {
      id: 2,
      name: "PPOR",
      purchase_price: 1200000,
      current_value: 1200000,
      original_loan: 900000,
      loan_balance_current: 0,
      purchase_fees: 40000,
      monthly_rent: 0,
      strata_quarterly: 0,
      rates_quarterly: 900,
      other_costs_monthly: 300,
      interest_rate: 0.055,
      property_growth: 0.03,
      rental_growth: 0.0,
      year_bought: 2027,
      loan_term_years: 30,
      use_offset: true,
      is_owner_occupied: true
    }
  ],
  life_events: [],
  autoRunModel: false, // desktop dock: auto re-run the model after input changes
  modelRunUsage: null, // { date: 'YYYY-MM-DD', count: N } — free-plan daily run cap
  stock_contribution_overrides: [], // [{ year, amount }] — per-year override of annual stock contribution
  chartTogglesVersion: 2,
  chartToggles: {
    netWorth: true,
    cash: false,
    stocks: false,
    propertyEquity: false,
    fireTarget: true,
    netRent: false,
    taxPaid: false,
	superBalance: false,
	cashDrawdown: false,
	fireIncome: false,
	fireIncomeWithCash: true,
  },
  chartFilterMode: 'key',
	selectedPropPrefixes: [],
	knownPropPrefixes: [],
	selectedPropSublines: [],
	expandedPropertyId: null,
  lastResult: null,
  collapsed: {},
};

	// ===== Theme handling =====
const THEME_KEY = "wm_theme"; // "light" | "dark" | null (auto)
function applyTheme(theme) {
  if (theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
    document.documentElement.style.colorScheme = "light";
  } else if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    document.documentElement.style.colorScheme = "dark";
  } else {
    // Auto: remove explicit attribute to let @media take over
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.style.colorScheme = "";
  }
  updateThemeToggleLabel();
}
function updateThemeToggleLabel() {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;
  const t = document.documentElement.getAttribute("data-theme");
  if (!t) {
    // Auto mode: show what OS prefers
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    btn.textContent = prefersDark ? "☀️ Light" : "🌙 Dark";
  } else if (t === "dark") {
    btn.textContent = "☀️ Light";
  } else {
    btn.textContent = "🌙 Dark";
  }
}
function getStoredTheme() {
  try { return localStorage.getItem(THEME_KEY); } catch(e){ return null; }
}
function setStoredTheme(v) {
  try { localStorage.setItem(THEME_KEY, v ?? ""); } catch(e){}
}

// Apply on load (respect stored or fall back to auto)
applyTheme(getStoredTheme());

// React to OS changes when in auto mode (no data-theme attribute)
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (!document.documentElement.getAttribute("data-theme")) updateThemeToggleLabel();
});

// Hook up toggle
function _updateTopbarHeightVar() {
  const h = document.querySelector('.topbar')?.offsetHeight || 85;
  document.documentElement.style.setProperty('--topbar-height', h + 'px');
  const bar = document.getElementById('modelActionsBar');
  if(bar && bar.offsetHeight) document.documentElement.style.setProperty('--bar-height', bar.offsetHeight + 'px');
}
window.addEventListener('resize', _updateTopbarHeightVar);

function _syncActionBarPosition() {
  const bar = document.getElementById('modelActionsBar');
  if (!bar || bar.style.display === 'none') return;
  const tbH = document.querySelector('.topbar')?.offsetHeight || 0;
  bar.style.top = (window.scrollY >= tbH ? 0 : tbH - window.scrollY) + 'px';
}
window.addEventListener('scroll', _syncActionBarPosition, { passive: true });

window.addEventListener("load", () => {
  _updateTopbarHeightVar();
  if (window._refreshInstallButtons) window._refreshInstallButtons();
  const btn = document.getElementById("themeToggle");
  if (!btn) return;
  btn.onclick = () => {
    const current = document.documentElement.getAttribute("data-theme");
    // cycle: auto -> dark -> light -> auto …
    let next;
    if (!current) next = "dark";
    else if (current === "dark") next = "light";
    else next = null; // auto
    applyTheme(next);
    setStoredTheme(next);
  };
  updateThemeToggleLabel();
});


let toastTimer = null;

function toggleDebug(){
  const el = document.getElementById("debugArea");
  if(!el) return;
  el.classList.toggle("hidden");
}

function showToast(title, msg, ms = 2500){
  const el = document.getElementById("toast");
  const t  = document.getElementById("toastTitle");
  const m  = document.getElementById("toastMsg");
  if(!el || !t || !m) return;

  t.textContent = title || "Notice";
  m.textContent = msg || "";

  el.classList.add("show");

  if(toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => hideToast(), ms);
}

function hideToast(){
  const el = document.getElementById("toast");
  if(!el) return;
  el.classList.remove("show");
}

function toggleCollapse(id){
  const body = document.getElementById(id);
  if(!body) return;
  const isHidden = body.classList.contains("hidden");
  body.classList.toggle("hidden", !isHidden);

  // persist collapsed state
  state.collapsed = state.collapsed || {};
  state.collapsed[id] = !isHidden ? true : false; // true means hidden
  saveState();
}

function toggleSection(bodyId, chevId){
  toggleCollapse(bodyId);
  const body = document.getElementById(bodyId);
  const chev = document.getElementById(chevId);
  if(body && chev){
    chev.textContent = body.classList.contains("hidden") ? "▸" : "▾";
  }
}



function applyCollapseState(){
  state.collapsed = state.collapsed || {};
  for(const [id, isHidden] of Object.entries(state.collapsed)){
    const el = document.getElementById(id);
    if(el) el.classList.toggle("hidden", !!isHidden);
  }
}



const FIELD_LABELS = {
  // Core
  current_age: "Current Age",
  end_age: "End Age",
  initial_savings: "Initial Savings",
  todays_lifestyle_income: "Target Lifestyle Income (Today)",
  current_income: "Current Income",
  current_expenses: "Current Expenses",

  // Advanced
  inflation: "Inflation Rate",
  average_salary_increase: "Annual Salary Growth",
  stock_growth: "Stock Growth Rate",
  stock_yearly_contribution: "Annual Stock Contribution",
  starting_stock_value: "Starting Stock Balance",
  stock_swr: "Stock Safe Withdrawal Rate",
  super_swr: "Super Safe Withdrawal Rate",
  super_access_age: "Super Access Age",
  super_starting_balance: "Starting Super Balance",
  super_sg_rate: "Super Guarantee Rate",
  super_growth: "Super Growth Rate",
  super_additional_annual: "Additional Super Contributions (Annual)",
};


const PROP_FIELD_LABELS = {
  name: "Property Name",
  year_bought: "Year Purchased",
  purchase_price: "Purchase Price",
  purchase_fees: "Purchase Costs",
  current_value: "Current Value",
  original_loan: "Original Loan Amount",
  loan_balance_current: "Current Loan Balance",
  interest_rate: "Interest Rate",
  loan_term_years: "Loan Term (Years)",
  property_growth: "Capital Growth Rate",
  monthly_rent: "Monthly Rent",
  rental_growth: "Rental Growth Rate",
  strata_quarterly: "Strata (Quarterly)",
  rates_quarterly: "Council Rates (Quarterly)",
  other_costs_monthly: "Other Costs (Monthly)",
  vacancy_weeks: "Vacancy (Weeks/Year)",
  mgmt_fee_rate: "Agent Management Fee",
};


const FIELD_META = {
  // ---- core money
  initial_savings: { type: "money" },
  todays_lifestyle_income: { type: "money" },
  current_income: { type: "money" },
  current_expenses: { type: "money" },

  // ---- core rates (stored as decimal, displayed as %)
  inflation: { type: "percent" },
  average_salary_increase: { type: "percent" },
  stock_growth: { type: "percent" },
  stock_swr: { type: "percent" },
  super_swr: { type: "percent" },
  super_sg_rate: { type: "percent" },
  super_growth: { type: "percent" },

  // ---- integers
  current_age: { type: "int" },
  end_age: { type: "int" },
  super_access_age: { type: "int" },

  // ---- other money
  stock_yearly_contribution: { type: "money" },
  starting_stock_value: { type: "money" },
  super_starting_balance: { type: "money" },
  super_additional_annual: { type: "money" },
  cpi_rate: { type: "percent" },
  on_income_support: { type: "bool" },
  super_extra_is_pre_tax: { type: "bool" },
};

const PROP_FIELD_META = {
  // money
  purchase_price: { type: "money" },
  current_value: { type: "money" },
  original_loan: { type: "money" },
  loan_balance_current: { type: "money" },
  purchase_fees: { type: "money" },
  monthly_rent: { type: "money" },
  strata_quarterly: { type: "money" },
  rates_quarterly: { type: "money" },
  other_costs_monthly: { type: "money" },

  // rates (decimal in state, % in UI)
  interest_rate: { type: "percent" },
  property_growth: { type: "percent" },
  rental_growth: { type: "percent" },
  mgmt_fee_rate: { type: "percent" },

  // integers
  year_bought: { type: "int" },
  loan_term_years: { type: "int" },
  vacancy_weeks: { type: "int" },

  // text
  name: { type: "text" },
};

function normSlug(s){
  return String(s ?? "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function displayNameForPrefix(prefix){
  const pfx = normSlug(prefix);
  const hit = (state.property_list || []).find(p => normSlug(p?.name).includes(pfx));
  return hit?.name || prefix;
}

const PROP_FAMILIES = [
  { // violet family — 1st property
    equity:   { color:"#A855F7", dash:[8,4]     },
    mortgage: { color:"#C084FC", dash:[3,3]     },
    netRent:  { color:"#7C3AED", dash:[8,4,3,4] },
  },
  { // emerald family — 2nd property
    equity:   { color:"#10B981", dash:[8,4]     },
    mortgage: { color:"#34D399", dash:[3,3]     },
    netRent:  { color:"#059669", dash:[8,4,3,4] },
  },
  { // sky blue family — 3rd property
    equity:   { color:"#0EA5E9", dash:[8,4]     },
    mortgage: { color:"#38BDF8", dash:[3,3]     },
    netRent:  { color:"#0284C7", dash:[8,4,3,4] },
  },
  { // amber family — 4th property
    equity:   { color:"#F59E0B", dash:[8,4]     },
    mortgage: { color:"#FCD34D", dash:[3,3]     },
    netRent:  { color:"#D97706", dash:[8,4,3,4] },
  },
];

function makeDashSVG(color, dash, active){
  const SVG_NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("width", "20"); svg.setAttribute("height", "8");
  svg.setAttribute("viewBox", "0 0 20 8");
  svg.style.flexShrink = "0";
  const line = document.createElementNS(SVG_NS, "line");
  line.setAttribute("x1", "0"); line.setAttribute("y1", "4");
  line.setAttribute("x2", "20"); line.setAttribute("y2", "4");
  line.setAttribute("stroke", active ? "#FFFFFF" : color);
  line.setAttribute("stroke-width", "2");
  line.setAttribute("stroke-dasharray", dash.join(","));
  svg.appendChild(line);
  return svg;
}

function renderPropertyChips(propPrefixes){
  const wrap  = document.getElementById("propertyChips");
  const group = document.getElementById("propChipsGroup");
  if(!wrap) return;
  wrap.innerHTML = "";

  if(!propPrefixes || !propPrefixes.length){
    if(group) group.style.display = "none";
    return;
  }
  if(group) group.style.display = "";

  if(!Array.isArray(state.selectedPropPrefixes)) state.selectedPropPrefixes = [];
  if(!Array.isArray(state.knownPropPrefixes))    state.knownPropPrefixes    = [];
  if(!Array.isArray(state.selectedPropSublines)) state.selectedPropSublines = [];

  propPrefixes.forEach(prefix => {
    if(!state.knownPropPrefixes.includes(prefix)){
      state.knownPropPrefixes = [...state.knownPropPrefixes, prefix];
    }
  });

  const SUBTYPES = [
    { key:"equity",   label:"Equity"   },
    { key:"mortgage", label:"Mortgage" },
    { key:"netRent",  label:"Net rent" },
  ];

  propPrefixes.forEach((prefix, i) => {
    const family = PROP_FAMILIES[i % PROP_FAMILIES.length];
    const displayName = displayNameForPrefix(prefix);

    SUBTYPES.forEach(({ key, label }) => {
      const spec = family[key];
      const sublineKey = `${prefix}:${key}`;
      const isActive = state.selectedPropSublines.includes(sublineKey);

      const chip = document.createElement("div");
      chip.className = "chip" + (isActive ? " active" : "");
      chip.style.setProperty("--chip-accent", spec.color);

      chip.appendChild(makeDashSVG(spec.color, spec.dash, isActive));
      chip.appendChild(document.createTextNode(`${displayName} — ${label}`));

      chip.onclick = (e) => {
        e.preventDefault(); e.stopPropagation();
        const scrollY = window.scrollY;
        if(state.selectedPropSublines.includes(sublineKey)){
          state.selectedPropSublines = state.selectedPropSublines.filter(k => k !== sublineKey);
        } else {
          state.selectedPropSublines = [...state.selectedPropSublines, sublineKey];
        }
        // keep selectedPropPrefixes in sync for legacy compat
        const anyActive = SUBTYPES.some(st => state.selectedPropSublines.includes(`${prefix}:${st.key}`));
        if(anyActive && !state.selectedPropPrefixes.includes(prefix)){
          state.selectedPropPrefixes = [...state.selectedPropPrefixes, prefix];
        } else if(!anyActive){
          state.selectedPropPrefixes = state.selectedPropPrefixes.filter(p => p !== prefix);
        }
        saveState();
        if(state.lastResult) renderResults(state.lastResult);
        window.scrollTo(0, scrollY);
      };

      wrap.appendChild(chip);
    });
  });
}






function saveState(){
  // Demo mode (?demo=1) is read-only: never persist the sample scenario over
  // the user's real localStorage / synced data.
  if (window._demoMode) return;
  localStorage.setItem(LS_KEY, JSON.stringify(state));
  _queueSync();
}
function isPlainObject(x){
  return x && typeof x === "object" && !Array.isArray(x);
}

function loadState(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(!raw) return;

    const parsed = JSON.parse(raw);

    // merge only safe top-level primitives
    if (isPlainObject(parsed)) {
      if (typeof parsed.apiBase === "string") state.apiBase = parsed.apiBase;
      if (typeof parsed.apiPath === "string") state.apiPath = parsed.apiPath;
      // Monthly "debug" mode retired — the model always runs yearly now.
      state.mode = "yearly";
	  if (parsed.expandedPropertyId !== undefined) state.expandedPropertyId = parsed.expandedPropertyId;


      // IMPORTANT: only merge inputs if it's a real object
      if (isPlainObject(parsed.inputs)) {
        state.inputs = { ...state.inputs, ...parsed.inputs };
      }

      // One-time migration: 11%/11.5% were the app's old SG defaults, not a
      // user choice — the legislated rate is 12% from 1 July 2025.
      if (state.inputs.super_sg_rate === 0.115 || state.inputs.super_sg_rate === 0.11) {
        state.inputs.super_sg_rate = 0.12;
      }

      if (Array.isArray(parsed.property_list)) {
        state.property_list = parsed.property_list.map(_migrateProperty);
      }

      if (Array.isArray(parsed.life_events)) {
        state.life_events = parsed.life_events;
      }

      if (isPlainObject(parsed.modelRunUsage)) {
        state.modelRunUsage = parsed.modelRunUsage;
      }

      if (typeof parsed.autoRunModel === 'boolean') state.autoRunModel = parsed.autoRunModel;

      if (Array.isArray(parsed.stock_contribution_overrides)) {
        state.stock_contribution_overrides = parsed.stock_contribution_overrides;
      }

      if (isPlainObject(parsed.chartToggles) && parsed.chartTogglesVersion === state.chartTogglesVersion) {
        state.chartToggles = { ...state.chartToggles, ...parsed.chartToggles };
      }

      if (Array.isArray(parsed.selectedPropPrefixes)) state.selectedPropPrefixes = parsed.selectedPropPrefixes;
      if (Array.isArray(parsed.knownPropPrefixes))    state.knownPropPrefixes    = parsed.knownPropPrefixes;
      if (Array.isArray(parsed.selectedPropSublines)) state.selectedPropSublines = parsed.selectedPropSublines;

      if (parsed.chartFilterMode && CHART_FILTER_CYCLE.includes(parsed.chartFilterMode)) {
        state.chartFilterMode = parsed.chartFilterMode;
      }

      if (parsed.lastResult) state.lastResult = parsed.lastResult;
    }
  } catch(e){
    // ignore bad storage
  }
  
  state.expandedPropertyId = null;

  // hard defaults if blanks
  if (!state.apiBase || !String(state.apiBase).trim()) state.apiBase = "https://fire-api-wixz.onrender.com";
  if (!state.apiPath || !String(state.apiPath).trim()) state.apiPath = "/fire";
}


/** ---------------------------
 *  Tab navigation
 *  --------------------------*/
function showTab(name){
  document.querySelectorAll(".tabs").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".nav button").forEach(el => el.classList.remove("active"));
  const tabEl = document.getElementById(`tab-${name}`);
  if(tabEl) tabEl.classList.add("active");
  const btnEl = document.getElementById(`btn${name.charAt(0).toUpperCase()+name.slice(1)}`);
  if(btnEl) btnEl.classList.add("active");
  // SPA has no real page navigation — log a page_view manually per tab switch
  window._logEvent?.('page_view', { page_title: name, page_location: window.location.href + '#' + name });
}

let _appEntered = false;
let _showEventMarkers = true;

function toggleEventMarkers() {
  _showEventMarkers = !_showEventMarkers;
  const btn = document.getElementById('eventMarkersToggle');
  if (btn) btn.classList.toggle('off', !_showEventMarkers);
  if (chart) chart.update('none');
}

/* ── Mobile full-screen (landscape) chart ──
   Moves the live chart canvas + toggle chips into a rotated overlay so the
   projection uses the full width of the phone. Toggles keep working because
   they act on the same chart element; renderResults rebuilds it in place. */
function openChartFullscreen(){
  if (!state.lastResult) { alert('Run the model first.'); return; }
  const overlay = document.getElementById('chartFsOverlay');
  const canvasSlot = document.getElementById('chartFsCanvasSlot');
  const chipsSlot  = document.getElementById('chartFsChipsSlot');
  const host  = document.getElementById('chartCanvasHost');
  const chips = document.querySelector('#chartSection .chips-bar');
  if (!overlay || !canvasSlot || !host) return;

  _chartFullscreen = true;
  canvasSlot.appendChild(host);
  if (chips) chipsSlot.appendChild(chips);
  overlay.style.display = 'block';
  document.body.style.overflow = 'hidden';
  // Rebuild the chart so it fills the stage (maintainAspectRatio off)
  renderResults(state.lastResult);
  requestAnimationFrame(() => { if (chart) chart.resize(); });
  document.addEventListener('keydown', _chartFsEsc);
  window.addEventListener('resize', _chartFsRefit);
  window.addEventListener('orientationchange', _chartFsRefit);
}

function closeChartFullscreen(){
  const overlay = document.getElementById('chartFsOverlay');
  const section = document.getElementById('chartSection');
  const host  = document.getElementById('chartCanvasHost');
  const chips = document.querySelector('#chartFsChipsSlot .chips-bar');
  if (!overlay || !section || !host) return;

  _chartFullscreen = false;
  // Put the canvas host back where it belongs (before the stock-override panel)
  const anchor = section.querySelector('.stock-override-panel');
  if (anchor) section.insertBefore(host, anchor); else section.appendChild(host);
  if (chips) section.appendChild(chips);   // chips-bar sits after the panel
  overlay.style.display = 'none';
  document.body.style.overflow = '';
  renderResults(state.lastResult);
  document.removeEventListener('keydown', _chartFsEsc);
  window.removeEventListener('resize', _chartFsRefit);
  window.removeEventListener('orientationchange', _chartFsRefit);
}

function _chartFsEsc(e){ if (e.key === 'Escape') closeChartFullscreen(); }

/* Rotation/resize while full-screen: re-render so the chart re-measures the
   new stage box (a bare chart.resize() doesn't reflow reliably here). */
let _chartFsRefitTimer = null;
function _chartFsRefit(){
  clearTimeout(_chartFsRefitTimer);
  _chartFsRefitTimer = setTimeout(() => {
    if (_chartFullscreen && state.lastResult) {
      renderResults(state.lastResult);
      requestAnimationFrame(() => { if (chart) chart.resize(); });
    }
  }, 180);
}

/* ====== Additional Stock Contributions ======
   Per-year override of the annual stock contribution, so the model can
   reflect years where less/more was actually invested (e.g. cash was
   tight) instead of a flat inflation-adjusted amount every year. */
let _stockOverrideModeOn = false;
let _stockOverrideFormYear = null;

function toggleStockOverrideMode(on){
  _stockOverrideModeOn = on;
  const hint = document.getElementById('stockOverrideHint');
  if (hint) hint.style.display = on ? '' : 'none';
  if (!on) _stockOverrideFormYear = null;
  renderStockOverridePanel();
}

function openStockOverrideEditor(year){
  const toggle = document.getElementById('stockOverrideToggle');
  if (toggle && !toggle.checked) {
    toggle.checked = true;
    toggleStockOverrideMode(true);
  }
  _stockOverrideFormYear = year;
  renderStockOverridePanel();
}

function cancelStockOverrideForm(){
  _stockOverrideFormYear = null;
  renderStockOverridePanel();
}

function saveStockOverride(year){
  const amountEl = document.getElementById('stockOverrideAmount');
  if (!amountEl) return;
  const amount = toNumber(amountEl.value);
  let list = (state.stock_contribution_overrides || []).filter(o => o.year !== year);
  list.push({ year, amount });
  state.stock_contribution_overrides = list;
  _stockOverrideFormYear = null;
  saveState();
  _refreshAfterStockOverrideChange();
  const sign = amount >= 0 ? '+' : '';
  showToast('Saved', `${year}: ${sign}${fmtMoney(amount)} on top of the normal contribution.`);
}

function removeStockOverride(year){
  state.stock_contribution_overrides = (state.stock_contribution_overrides || []).filter(o => o.year !== year);
  if (_stockOverrideFormYear === year) _stockOverrideFormYear = null;
  saveState();
  _refreshAfterStockOverrideChange();
}

function _renderStockOverrideForm(year){
  const existing = (state.stock_contribution_overrides || []).find(o => o.year === year);
  const baseAmt = toNumber(state.inputs.stock_yearly_contribution);
  const additionalAmt = existing ? existing.amount : 0;
  return `
    <div class="prop-history-form" style="margin-top:10px;">
      <div class="prop-history-form-title">Additional contribution for ${year}</div>
      <div class="prop-history-form-grid" style="grid-template-columns:1fr;">
        <div>
          <label>On top of the normal ${fmtMoney(baseAmt)}/yr <span style="font-size:10px;color:#6A716B;">(+ to add, − to reduce)</span></label>
          <input type="text" inputmode="decimal" id="stockOverrideAmount" value="${additionalAmt ? fmtMoneyInput(additionalAmt) : ''}" placeholder="e.g. 5000 or -5000" />
        </div>
      </div>
      <div class="prop-history-form-actions" style="${existing ? 'justify-content:space-between;' : ''}">
        ${existing ? `<button class="btn ghost" style="color:#E11D48;" onclick="removeStockOverride(${year})">Remove</button>` : ''}
        <div style="display:flex; gap:8px;">
          <button class="btn ghost" onclick="cancelStockOverrideForm()">Cancel</button>
          <button class="btn primary" onclick="saveStockOverride(${year})">Save</button>
        </div>
      </div>
    </div>
  `;
}

function renderStockOverridePanel(){
  const body = document.getElementById('stockOverridePanelBody');
  if (!body) return;
  // No chip list/remove-all here by design — the chart's colored, underlined
  // Year/Age tick labels (stockOverrideTickPlugin) are the only "which years
  // have an override" indicator now. Click a flagged year to edit or remove it.
  body.innerHTML = _stockOverrideFormYear != null ? _renderStockOverrideForm(_stockOverrideFormYear) : '';
}

/** Save/remove change which years are flagged, so the chart's tick colors
 *  need a real rebuild (not just a redraw) — re-running renderResults on
 *  the last known result is the simplest way to recompute stockOverrideIdxSet.
 *  renderResults() calls renderStockOverridePanel() itself at the end, so
 *  callers should use this instead of renderStockOverridePanel() directly
 *  whenever the override list itself changed. */
function _refreshAfterStockOverrideChange(){
  if (state.lastResult) renderResults(state.lastResult);
  else renderStockOverridePanel();
}
function enterApp(){
  _appEntered = true;
  document.body.classList.remove("landing");
  showDashboard();
}

/* ── Demo mode: a curated, relatable Australian scenario for ad/screenshot
   recording. Loaded via ?demo=1, never persisted. A 32-year-old couple with
   an apartment they rent out, a home bought this year, shares and super —
   reaches FIRE in their early 50s, a satisfying on-screen arc. */
const DEMO_SCENARIO = {
  inputs: {
    current_age: 32,
    end_age: 90,
    inflation: 0.025,
    todays_lifestyle_income: 46000,
    initial_savings: 110000,
    current_income: 155000,
    current_expenses: 55000,
    average_salary_increase: 0.035,
    stock_growth: 0.07,
    stock_yearly_contribution: 42000,
    starting_stock_value: 140000,
    stock_swr: 0.04,
    super_swr: 0.04,
    super_access_age: 60,
    super_starting_balance: 110000,
    super_sg_rate: 0.12,
    super_growth: 0.065,
    super_additional_annual: 0,
    super_extra_is_pre_tax: true,
    cpi_rate: 0.025,
    on_income_support: false,
  },
  property_list: [
    {
      id: 1, name: "Investment Apartment", purchase_price: 480000, current_value: 620000,
      original_loan: 384000, loan_balance_current: 300000, purchase_fees: 22000,
      monthly_rent: 2350, strata_quarterly: 1100, rates_quarterly: 850, other_costs_monthly: 150,
      interest_rate: 0.058, property_growth: 0.04, rental_growth: 0.03, year_bought: 2020,
      purchase_date: "2020-06", loan_term_years: 30, use_offset: true, is_owner_occupied: false,
      vacancy_weeks: 2, mgmt_fee_rate: 0.066, ppor_periods: [], sale_date: null, sale_year: null, sale_price: null
    },
    {
      id: 2, name: "Our Home", purchase_price: 780000, current_value: 1050000,
      original_loan: 620000, loan_balance_current: 430000, purchase_fees: 38000,
      monthly_rent: 0, strata_quarterly: 0, rates_quarterly: 900, other_costs_monthly: 350,
      interest_rate: 0.058, property_growth: 0.04, rental_growth: 0.0,
      year_bought: 2019, purchase_date: "2019-05",
      loan_term_years: 25, use_offset: true, is_owner_occupied: true,
      vacancy_weeks: 0, mgmt_fee_rate: 0, ppor_periods: [], sale_date: null, sale_year: null, sale_price: null
    }
  ],
  life_events: [],
  stock_contribution_overrides: [],
};

function _startDemoMode(){
  window._demoMode = true;
  state.inputs = { ...state.inputs, ...DEMO_SCENARIO.inputs };
  state.property_list = JSON.parse(JSON.stringify(DEMO_SCENARIO.property_list));
  state.life_events = [];
  state.stock_contribution_overrides = [];
  state.mode = "yearly";
  // Drop the user's field-sync settings — otherwise the "sync from budget /
  // holdings" logic would overwrite the demo income/expenses a tick after load.
  state.syncModes = {};
  state.lastResult = null;   // don't show the user's stale cached result
  document.querySelectorAll('.input-synced').forEach(el => el.classList.remove('input-synced'));
  clearTimeout(window._authFallback);
  bindCoreInputs();
  enterApp();
  renderProperties?.();
  showTab('results');
  // Commit the demo field values, then run once. (First load can hit the
  // Render cold-start — the chart shows a loading state for ~15-40s until the
  // API wakes; clearing lastResult above prevents a stale result flashing.)
  syncInputsFromUI();
  setTimeout(() => runModel(), 150);
}

/* ── Install as app ── */
function _isIos(){
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    // iPadOS 13+ reports as Mac but has touch
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
function _isStandalone(){
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
function _refreshInstallButtons(){
  const card = document.getElementById('settingsInstallCard');
  if (!card) return;
  // Already installed → never show. Otherwise show if the browser offered an
  // install prompt, or if we're on iOS (which needs manual instructions).
  const show = !_isStandalone() && (window._deferredInstallPrompt || _isIos());
  card.style.display = show ? 'flex' : 'none';
  const sub = document.getElementById('settingsInstallSub');
  if (sub) sub.textContent = _isIos() && !window._deferredInstallPrompt
    ? 'Tap for Add to Home Screen steps'
    : 'Add WealthModel to your home screen';
}
window._refreshInstallButtons = _refreshInstallButtons;

async function promptInstallApp(){
  window._logEvent?.('install_click', {});
  if (window._deferredInstallPrompt) {
    const e = window._deferredInstallPrompt;
    window._deferredInstallPrompt = null;
    e.prompt();
    try { await e.userChoice; } catch(_) {}
    _refreshInstallButtons();
    return;
  }
  if (_isIos()) { document.getElementById('iosInstallSheet').style.display = 'block'; return; }
  // Fallback (rare: desktop browsers without a captured prompt)
  showToast?.('Install', 'Use your browser menu → “Install app” or “Add to Home screen”.');
}
function closeIosInstall(){
  const s = document.getElementById('iosInstallSheet');
  if (s) s.style.display = 'none';
}

/** "Get Started Free" CTA: drop them straight into the app (no forced
 *  signup), then nudge sign-up a beat later — dismissible via the ✕,
 *  the "Continue without an account" link, or clicking the backdrop. */
function beginFree(){
  enterApp();
  if (!_currentUser) {
    setTimeout(() => openAuthModal(), 500);
  }
}

function initLanding(){
  document.body.classList.add("landing");
  showTab("landing");
}

function scrollLanding(id){
  const el = document.getElementById(id);
  if(el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}



/** ---------------------------
 *  Mode
 *  --------------------------*/
function setMode(mode){
  state.mode = mode;

  const modeSelect = document.getElementById("modeSelect");
  if (modeSelect) modeSelect.value = mode;

  const chipYearly = document.getElementById("chipModeYearly");
  const chipMonthly = document.getElementById("chipModeMonthly");

  if (chipYearly) chipYearly.classList.toggle("active", mode === "yearly");
  if (chipMonthly) chipMonthly.classList.toggle("active", mode === "monthly");

  saveState();
}




function copyPayload(){
  const payload = buildPayload();
  console.log("payload.inputs (expanded):", JSON.stringify(payload.inputs, null, 2));
  navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
  alert("Copied payload to clipboard.");
}

/** ---------------------------
 *  Inputs binding
 *  --------------------------*/
let pingTimer = null;

function _updateSuperExtraHint(){
  const hint = document.getElementById('superExtraHint');
  if (!hint) return;
  hint.textContent = state.inputs.super_extra_is_pre_tax
    ? 'Reduces your taxable income · 15% contributions tax · stops at FIRE'
    : 'Paid from after-tax cash · lands in full · no tax deduction';
}

function bindCoreInputs(){
  // API fields
  document.getElementById("apiBase").value = state.apiBase || "";
  document.getElementById("apiPath").value = state.apiPath || "";

  // ✅ Attach formatting behavior to ALL core+advanced input fields
  for (const k of Object.keys(state.inputs)){
    const el = document.getElementById(k);
    if (!el) continue;

    const meta = FIELD_META[k] || { type: "money" };

    // Boolean checkbox: just sync checked state
    if (meta.type === "bool"){
      el.checked = !!state.inputs[k];
      el.onchange = () => { state.inputs[k] = el.checked; saveState(); };
      continue;
    }

    // Use text inputs so we can display formatted values like "$500,000" or "2.5%"
    if (meta.type === "money" || meta.type === "percent"){
      el.type = "text";
      el.inputMode = "decimal";
    } else if (meta.type === "int"){
      el.type = "text";
      el.inputMode = "numeric";
    }

    attachUnitInputBehavior(
      el,
      meta,
      () => state.inputs[k],
      (v) => { state.inputs[k] = v; }
    );
  }

  // Super extra pre/after-tax hint tracks the toggle
  const preTaxEl = document.getElementById('super_extra_is_pre_tax');
  if (preTaxEl && !preTaxEl.dataset.hintBound){
    preTaxEl.dataset.hintBound = '1';
    preTaxEl.addEventListener('change', _updateSuperExtraHint);
  }
  _updateSuperExtraHint();

  // API listeners
  document.getElementById("apiBase").oninput = (e)=>{
    state.apiBase = e.target.value.trim();
    saveState();
    clearTimeout(pingTimer);
    pingTimer = setTimeout(pingAPI, 400);
  };

  document.getElementById("apiPath").oninput = (e)=>{
    state.apiPath = e.target.value.trim();
    saveState();
  };
}



/** ---------------------------
 *  Property cards UI
 *  --------------------------*/

function calcNetMonthlyForProperty(p){
  const rent = toNumber(p.monthly_rent);
  //* const loan = toNumber(p.loan_balance_current || p.original_loan);\\
  const loan = toNumber(p.loan_balance_current ?? p.original_loan);
  const rate = toNumber(p.interest_rate);
  const interestMonthly = (loan * rate) / 12;

  const strata = toNumber(p.strata_quarterly) / 3;
  const rates = toNumber(p.rates_quarterly) / 3;
  const other = toNumber(p.other_costs_monthly);

  return rent - interestMonthly - strata - rates - other;
}

function propertySummary(p){
  const value = toNumber(p.current_value);
  const loan  = toNumber(p.loan_balance_current ?? p.original_loan ?? 0);

  const equity = Math.max(value - loan, 0);
  const lvr = (value > 0) ? (loan / value) : 0;
  const netMo = calcNetMonthlyForProperty(p);

  return { value, loan, equity, lvr, netMo };
}

/* Is this property owned TODAY (purchase date not in the future)? Planned
   future purchases must not count toward current equity/net worth — a 2041
   apartment isn't wealth you have now. */
function propertyOwnedNow(p){
  const pd = p.purchase_date || (p.year_bought ? `${p.year_bought}-01` : null);
  if (!pd) return true; // no date info — assume owned
  const now = new Date();
  const nowStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  return String(pd).slice(0,7) <= nowStr;
}


function setExpandedProperty(id){
  state.expandedPropertyId = (Number(state.expandedPropertyId) === Number(id)) ? null : Number(id);
  saveState();
  renderProperties();
}



function nextPropertyId(){
  return Math.max(0, ...state.property_list.map(p=>Number(p.id)||0)) + 1;
}


function addProperty(){
  if (!isPro() && (state.property_list||[]).length >= 1) {
    showUpgradeModal('Free plan is limited to 1 property. Upgrade to add unlimited properties.');
    return;
  }
  const id = nextPropertyId();

  state.property_list.push({
    id,
    name: `Property ${id}`,
    purchase_price: 800000,
    current_value: 800000,
    original_loan: 640000,
    loan_balance_current: 0,
    purchase_fees: 30000,
    monthly_rent: 3200,
    strata_quarterly: 0,
    rates_quarterly: 900,
    other_costs_monthly: 200,
    vacancy_weeks: 0,
    mgmt_fee_rate: 0,
    interest_rate: 0.055,
    property_growth: 0.03,
    rental_growth: 0.03,
    year_bought: new Date().getFullYear(),
    purchase_date: `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`,
    loan_term_years: 30,
    use_offset: true,
    is_owner_occupied: false,
    ppor_periods: [],
    sale_date: null,
    sale_year: null,
    sale_price: null
  });

  // keep collapsed on add (don’t auto-open)
  state.expandedPropertyId = null;

  saveState();
  renderProperties();
}



function removeProperty(id){
  state.property_list = state.property_list.filter(p => Number(p.id) !== Number(id));
  saveState();
  renderProperties();
  updatePropSummaryStrip();
}

/** Value/rent/loan history — a lightweight annual-ish snapshot log per
 *  property, separate from the monthly Holdings tracker. Lets you compare
 *  assumed vs actual over time without re-entering data every month. */
function renderPropertyHistoryList(p){
  const hist = p.value_history || [];
  if (!hist.length) {
    return `<div class="prop-history-empty">No updates logged yet — click "+ Log update" whenever you get a new valuation, rent review, or loan statement.</div>`;
  }
  const sorted = [...hist].sort((a,b) => a.date.localeCompare(b.date)); // oldest first, for deltas
  return sorted.map((entry, i) => {
    const prev = i > 0 ? sorted[i-1] : null;
    const delta = prev ? entry.current_value - prev.current_value : null;
    const dateLabel = new Date(entry.date).toLocaleDateString('en-AU', {day:'numeric', month:'short', year:'numeric'});
    const deltaHtml = (delta !== null && delta !== 0)
      ? `<span class="${delta > 0 ? 'fs-pos' : 'fs-warn'}" style="font-size:10px; margin-left:4px;">${delta > 0 ? '+' : ''}${fmtDollar(delta)}</span>`
      : '';
    return `
      <div class="prop-history-row">
        <span class="prop-history-date">${dateLabel}</span>
        <span class="prop-history-stat">Value <strong>${fmtDollar(entry.current_value)}</strong>${deltaHtml}</span>
        <span class="prop-history-stat">Loan <strong>${fmtDollar(entry.loan_balance_current)}</strong></span>
        <span class="prop-history-stat">Rent <strong>${fmtDollar(entry.monthly_rent)}/mo</strong></span>
        <button class="prop-history-edit" onclick="event.stopPropagation(); editPropertyHistoryEntry(${p.id},'${entry.date}')" title="Edit">✎</button>
        <button class="prop-history-del" onclick="event.stopPropagation(); deletePropertyHistoryEntry(${p.id},'${entry.date}')" title="Remove">✕</button>
      </div>`;
  }).reverse().join(''); // most recent first for display
}

// Ephemeral, render-session-only UI state (not persisted) — which property's
// history panel is open, and whether its log/edit form is showing.
let _historyExpanded = {};
let _historyFormOpen = {};   // id -> { date, value, loan, rent, editingDate|null }

function toggleHistoryExpanded(id){
  _historyExpanded[id] = !_historyExpanded[id];
  renderProperties();
}

function openLogPropertyHistory(id){
  const prop = state.property_list.find(x => Number(x.id) === Number(id));
  if (!prop) return;
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  _historyFormOpen[id] = {
    date: dateStr,
    value: toNumber(prop.current_value),
    loan: toNumber(prop.loan_balance_current),
    rent: toNumber(prop.monthly_rent),
    editingDate: null
  };
  _historyExpanded[id] = true;
  renderProperties();
}

function editPropertyHistoryEntry(id, dateStr){
  const prop = state.property_list.find(x => Number(x.id) === Number(id));
  const entry = prop && (prop.value_history || []).find(e => e.date === dateStr);
  if (!entry) return;
  _historyFormOpen[id] = {
    date: entry.date,
    value: entry.current_value,
    loan: entry.loan_balance_current,
    rent: entry.monthly_rent,
    editingDate: dateStr
  };
  _historyExpanded[id] = true;
  renderProperties();
}

function cancelPropertyHistoryForm(id){
  delete _historyFormOpen[id];
  renderProperties();
}

function savePropertyHistoryForm(id){
  const prop = state.property_list.find(x => Number(x.id) === Number(id));
  const form = _historyFormOpen[id];
  if (!prop || !form) return;

  const dateStr = document.getElementById(`p_${id}_hist_date`).value;
  if (!dateStr) { showToast('Missing date', 'Pick a date for this snapshot.'); return; }

  const entry = {
    date: dateStr,
    current_value: toNumber(document.getElementById(`p_${id}_hist_value`).value),
    loan_balance_current: toNumber(document.getElementById(`p_${id}_hist_loan`).value),
    monthly_rent: toNumber(document.getElementById(`p_${id}_hist_rent`).value)
  };

  if (!prop.value_history) prop.value_history = [];
  // Editing an existing entry: drop its old date first (in case the date itself changed).
  if (form.editingDate) {
    prop.value_history = prop.value_history.filter(e => e.date !== form.editingDate);
  }
  prop.value_history = prop.value_history.filter(e => e.date !== dateStr); // replace, don't duplicate same-day
  prop.value_history.push(entry);

  delete _historyFormOpen[id];
  saveState();
  renderProperties();
  showToast('Logged', `Snapshot saved for ${prop.name || 'this property'}.`);
}

function renderHistoryLogForm(p, form){
  const isEdit = !!form.editingDate;
  return `
    <div class="prop-history-form">
      <div class="prop-history-form-title">${isEdit ? 'Edit snapshot' : 'New snapshot'}</div>
      <div class="prop-history-form-grid">
        <div>
          <label>Date</label>
          <input type="date" id="p_${p.id}_hist_date" value="${form.date}" />
        </div>
        <div>
          <label>Value</label>
          <input type="text" inputmode="decimal" id="p_${p.id}_hist_value" value="${fmtMoneyInput(form.value)}" />
        </div>
        <div>
          <label>Loan Balance</label>
          <input type="text" inputmode="decimal" id="p_${p.id}_hist_loan" value="${fmtMoneyInput(form.loan)}" />
        </div>
        <div>
          <label>Rent (Monthly)</label>
          <input type="text" inputmode="decimal" id="p_${p.id}_hist_rent" value="${fmtMoneyInput(form.rent)}" />
        </div>
      </div>
      <div class="prop-history-form-actions">
        <button class="btn ghost" onclick="event.stopPropagation(); cancelPropertyHistoryForm(${p.id})">Cancel</button>
        <button class="btn primary" onclick="event.stopPropagation(); savePropertyHistoryForm(${p.id})">Save snapshot</button>
      </div>
    </div>
  `;
}

function deletePropertyHistoryEntry(id, dateStr){
  const prop = state.property_list.find(x => Number(x.id) === Number(id));
  if (!prop || !prop.value_history) return;
  prop.value_history = prop.value_history.filter(e => e.date !== dateStr);
  saveState();
  renderProperties();
}

let _propHistoryCharts = {}; // keyed by property id — one Chart.js instance per expanded card

function renderPropertyHistoryChart(p){
  const canvas = document.getElementById(`p_${p.id}_history_chart`);
  if (!canvas) return;
  if (_propHistoryCharts[p.id]) { _propHistoryCharts[p.id].destroy(); delete _propHistoryCharts[p.id]; }

  const hist = (p.value_history || []).slice().sort((a,b) => a.date.localeCompare(b.date));
  if (hist.length < 2) { canvas.style.display = 'none'; return; }
  canvas.style.display = '';

  const labels = hist.map(e => new Date(e.date).toLocaleDateString('en-AU', {month:'short', year:'2-digit'}));
  const values = hist.map(e => e.current_value);
  const ctx = canvas.getContext('2d');
  _propHistoryCharts[p.id] = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [{
      label: 'Value', data: values,
      borderColor: '#059669', backgroundColor: 'rgba(5,150,105,.1)',
      fill: true, tension: .3, pointRadius: 4, pointBackgroundColor: '#059669', borderWidth: 2.5
    }] },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: c => 'Value: ' + fmtDollar(c.parsed.y) } }
      },
      scales: {
        y: { ticks: { callback: v => '$' + Math.round(v/1000) + 'k' }, grid: { color: '#F0EDE8' } },
        x: { grid: { display: false } }
      }
    }
  });
}

function renderProperties(){
  const wrap = document.getElementById("propsContainer");
  if(!wrap) return;
  wrap.innerHTML = "";

  state.property_list.forEach((p, idx)=>{
    const isPPOR = _isPporNow(p);
    const statusInfo = _propertyStatusLabel(p);

    const card = document.createElement("div");
    card.className = "card propCard";
    card.style.marginBottom = "14px";

    const expanded = (Number(state.expandedPropertyId) === Number(p.id));
    const sum = propertySummary(p);

    const header = document.createElement("div");
    header.className = "propCardHeader";

    const netMoColor = sum.netMo < 0 ? 'negative' : (sum.netMo > 0 ? 'positive' : '');
    const thisYear = new Date().getFullYear();
    let yearLabel = '';
    if (p.purchase_date || p.year_bought) {
      const pd   = p.purchase_date || `${p.year_bought}-01`;
      const yr   = parseInt(pd.split('-')[0], 10);
      const mo   = parseInt((pd.split('-')[1] || '1'), 10);
      const moName = new Date(yr, mo-1, 1).toLocaleString('en-AU', {month:'short'});
      yearLabel  = yr <= thisYear ? `Purchased ${moName} ${yr}` : `Planned ${moName} ${yr}`;
    }
    header.innerHTML = `
      <div class="propCardHeaderLeft">
        <div class="propCardNameRow">
          <span class="propCardName">${escapeHtml(p.name || ("Property "+(idx+1)))}</span>
          <span class="propTypeBadge propTypeBadge-${statusInfo.cls}">${escapeHtml(statusInfo.text)}</span>
          ${yearLabel ? `<span class="propYearBadge">${yearLabel}</span>` : ''}
        </div>
        <div class="propStatsRow">
          <div class="propStat">
            <span class="propStatLabel">Value</span>
            <span class="propStatValue">${fmtMoney(sum.value)}</span>
          </div>
          <div class="propStat">
            <span class="propStatLabel">Equity</span>
            <span class="propStatValue">${fmtMoney(sum.equity)}</span>
          </div>
          <div class="propStat">
            <span class="propStatLabel">Net/mo</span>
            <span class="propStatValue ${netMoColor}">${fmtMoney(sum.netMo)}</span>
          </div>
        </div>
      </div>
      <div class="propExpandBtn">${expanded ? "▾" : "▸"}</div>
    `;

    header.onclick = () => setExpandedProperty(Number(p.id));
    card.appendChild(header);


    const body = document.createElement("div");
    body.className = "propBody" + (expanded ? "" : " hidden");

    const g = document.createElement("div");
    g.className = "fieldgrid";
    g.style.marginTop = "10px";

	const fieldGroups = [
	  { label: "General", fields: [
	    ["name", "text", "Name"],
	  ]},
	  { label: "Purchase & Ownership", fields: [
	    ["purchase_price", "number", "Purchase Price"],
	    ["purchase_fees", "number", "Purchase Fees"],
	  ]},
	  { label: "Loan", fields: [
	    ["original_loan", "number", "Original Loan"],
	    ["loan_balance_current", "number", "Current Loan Balance"],
	    ["interest_rate", "number", "Interest Rate"],
	    ["loan_term_years", "number", "Loan Term (Years)"],
	  ]},
	  { label: "Value & Income", fields: [
	    ["current_value", "number", "Current Value"],
	    ["property_growth", "number", "Property Growth (Annual)"],
	    ["monthly_rent", "number", "Rent (Monthly)"],
	    ["rental_growth", "number", "Rent Growth (Annual)"],
	  ]},
	  { label: "Running Costs", fields: [
	    ["strata_quarterly", "number", "Strata (Quarterly)"],
	    ["rates_quarterly", "number", "Council Rates (Quarterly)"],
	    ["other_costs_monthly", "number", "Other Costs (Monthly)"],
	    ["vacancy_weeks", "number", "Vacancy (Weeks/Year)"],
	    ["mgmt_fee_rate", "number", "Agent Mgmt Fee (% of Rent)"],
	  ]},
	];

	const fields = fieldGroups.flatMap(grp => grp.fields);

	fieldGroups.forEach(grp => {
	  const sep = document.createElement("div");
	  sep.className = "prop-section-label";
	  sep.style.display = "flex"; sep.style.alignItems = "center"; sep.style.gap = "6px";
	  sep.innerHTML = grp.label === "Value & Income"
	    ? `${grp.label}<span class="info-tip" data-tip="negative_gearing">?</span>`
	    : grp.label === "Running Costs"
	    ? `${grp.label}<span class="info-tip" data-tip="vacancy_mgmt">?</span>`
	    : grp.label;
	  g.appendChild(sep);

	  grp.fields.forEach(([key, type, label]) => {
	    const d = document.createElement("div");
	    d.innerHTML = `<label>${label}</label><input id="p_${p.id}_${key}" type="${type}" />`
	      + (key === "purchase_price" ? `<div class="prop-field-hint" id="p_${p.id}_todays_value_hint"></div>` : "")
	      + (key === "monthly_rent" ? `<button type="button" class="btn-estimate-rent" onclick="event.stopPropagation(); estimatePropertyRent(${p.id})">🏷 Estimate from value</button>` : "")
	      + (key === "vacancy_weeks" ? `<div class="input-hint">Typical: 1–3 weeks</div>` : "")
	      + (key === "mgmt_fee_rate" ? `<div class="input-hint">Typical: 5–8% agent-managed · 0 self-managed</div>` : "");
	    g.appendChild(d);
	  });

	  if (grp.label === "Purchase & Ownership") {
	    // Purchase date (month precision)
	    const pdWrap = document.createElement("div");
	    pdWrap.innerHTML = `
	      <label style="font-size:12px; color:#5A625D; display:block; margin-bottom:4px;">Purchase Date</label>
	      <div style="width:160px;">${monthPickerHTML(`p_${p.id}_purchase_date`, p.purchase_date || `${p.year_bought||2020}-01`, {
	        onChange: (val) => updatePurchaseDate(p.id, val)
	      })}</div>
	    `;
	    g.appendChild(pdWrap);

	    // State selector + stamp duty estimate
	    const stateRow = document.createElement("div");
	    stateRow.className = "prop-state-row";
	    stateRow.style.cssText = "grid-column:1/-1;";
	    const states = ['NSW','VIC','QLD','WA','SA','TAS','ACT','NT'];
	    const selVal = p.state || 'NSW';
	    stateRow.innerHTML = `
	      <label>State</label>
	      <select class="prop-state-select" id="p_${p.id}_state"
	              onchange="updatePropState(${p.id},this.value)">
	        ${states.map(s => `<option value="${s}"${s===selVal?' selected':''}>${s}</option>`).join('')}
	      </select>
	      <button class="btn-estimate" onclick="event.stopPropagation();toggleStampDutyEstimate(${p.id})">
	        🏷 Estimate buying costs
	      </button>
	    `;
	    g.appendChild(stateRow);
	    const stampWrap = document.createElement("div");
	    stampWrap.id = `p_${p.id}_stamp_estimate`;
	    stampWrap.style.cssText = "display:none;grid-column:1/-1;";
	    g.appendChild(stampWrap);

	    const pporWrap = document.createElement("div");
	    pporWrap.className = "prop-ppor-section";
	    pporWrap.style.cssText = "grid-column:1/-1;";
	    pporWrap.innerHTML = `
	      <div class="prop-section-label" style="display:flex;align-items:center;gap:6px;">
	        PPOR Periods
	        <span class="info-tip" data-tip="ppor">?</span>
	      </div>
	      <div class="ppor-timeline-panel" id="ppor-panel-${p.id}">
	        <div id="ppor-rows-${p.id}"></div>
	        <button class="btn ghost btn-add-row" style="margin-top:6px;font-size:11px;"
	                onclick="event.stopPropagation();addPporPeriod(${p.id})">+ Add period</button>
	        <div class="ppor-conflict" id="ppor-conflict-${p.id}" style="display:none;"></div>
	      </div>
	    `;
	    g.appendChild(pporWrap);
	  }
	  if (grp.label === "Loan") {
	    const t = document.createElement("div");
	    t.className = "prop-toggle-row";
	    t.innerHTML = `<label class="prop-toggle"><input type="checkbox" id="p_${p.id}_use_offset" /><span class="prop-toggle-track"><span class="prop-toggle-thumb"></span></span><span class="prop-toggle-label">Use offset account</span></label><span class="info-tip" data-tip="offset">?</span>`;
	    g.appendChild(t);
	  }
	});

    body.appendChild(g);

    // ---- Sale section ----
    const saleDiv = document.createElement('div');
    saleDiv.className = 'prop-sale-section';
    const hasSale = !!(p.sale_date || p.sale_year);
    saleDiv.innerHTML = `
      <div class="prop-toggle-row" style="margin-top:8px;">
        <label class="prop-toggle">
          <input type="checkbox" id="p_${p.id}_sale_toggle" ${hasSale ? 'checked' : ''} />
          <span class="prop-toggle-track"><span class="prop-toggle-thumb"></span></span>
          <span class="prop-toggle-label">Plan to sell</span>
        </label>
      </div>
      <div id="p_${p.id}_sale_fields" style="display:${hasSale ? '' : 'none'}; margin-top:6px;">
        <div class="prop-section-label" style="display:flex; align-items:center; gap:6px;">
          Sale Details
          <span class="info-tip" data-tip="sale_price">?</span>
        </div>
        <div class="prop-sale-sub">
          CGT calculated automatically —
          <span class="info-tip info-tip-link" data-tip="cost_base">cost base</span>,
          <span class="info-tip info-tip-link" data-tip="cgt_pre2027">pre-2027 rules</span>,
          <span class="info-tip info-tip-link" data-tip="cgt_post2027">post-2027 rules</span>
        </div>
        <div class="fieldgrid" style="margin-top:6px;">
          <div>
            <label>Sale Date</label>
            ${monthPickerHTML(`p_${p.id}_sale_date`, p.sale_date || (p.sale_year ? p.sale_year+'-12' : ''), {
              allowClear: true, clearLabel: 'Clear date',
              onChange: (val) => updateSaleField(p.id, 'sale_date', val)
            })}
          </div>
          <div>
            <label>Sale Price <span style="font-size:10px; color:#6A716B;">(blank = projected)</span></label>
            <input id="p_${p.id}_sale_price" type="text" inputmode="decimal"
                   value="${p.sale_price ? fmtMoneyInput(p.sale_price) : ''}" placeholder="Leave blank"
                   oninput="updateSaleField(${p.id},'sale_price',this.value)" />
          </div>
          <div>
            <label>Agent commission <span style="font-size:10px;color:#6A716B;">(%)</span></label>
            <input id="p_${p.id}_sale_agent_rate" type="text" inputmode="decimal"
                   value="${((p.sale_agent_rate ?? 0.022)*100).toFixed(2)}"
                   oninput="updateSaleField(${p.id},'sale_agent_rate',this.value)" />
          </div>
          <div>
            <label>Conveyancing <span style="font-size:10px;color:#6A716B;">($)</span></label>
            <input id="p_${p.id}_sale_conveyancing" type="text" inputmode="decimal"
                   value="${fmtMoneyInput(p.sale_conveyancing ?? 2500)}"
                   oninput="updateSaleField(${p.id},'sale_conveyancing',this.value)" />
          </div>
        </div>
        <div id="p_${p.id}_cgt_preview" class="cgt-preview" style="margin-top:8px;"></div>
      </div>
    `;
    body.appendChild(saleDiv);

    // ---- Value history (annual-ish snapshots, not the monthly Holdings tracker) ----
    const histCount = (p.value_history || []).length;
    const histExpanded = !!_historyExpanded[p.id];
    const histForm = _historyFormOpen[p.id];
    const histDiv = document.createElement('div');
    histDiv.className = 'prop-history-section';
    histDiv.innerHTML = `
      <div class="prop-history-head" onclick="toggleHistoryExpanded(${Number(p.id)})">
        <span class="prop-section-label" style="margin:0; display:flex; align-items:center; gap:6px;">
          <span class="prop-history-chevron">${histExpanded ? '▾' : '▸'}</span>
          Value History
          ${histCount ? `<span class="prop-history-count">${histCount}</span>` : ''}
        </span>
        <button class="btn ghost" style="font-size:11px; padding:4px 10px;"
                onclick="event.stopPropagation(); openLogPropertyHistory(${Number(p.id)})">+ Log update</button>
      </div>
      <div class="prop-history-body" style="display:${histExpanded ? '' : 'none'};">
        ${histForm ? renderHistoryLogForm(p, histForm) : ''}
        <div class="prop-history-list" id="p_${p.id}_history_list">${renderPropertyHistoryList(p)}</div>
        <canvas id="p_${p.id}_history_chart" style="max-height:160px; margin-top:12px; display:none;"></canvas>
      </div>
    `;
    body.appendChild(histDiv);

    const saleToggle = saleDiv.querySelector(`#p_${p.id}_sale_toggle`);
    saleToggle.onchange = () => {
      const prop = state.property_list.find(x => Number(x.id) === Number(p.id));
      if (!prop) return;
      const fields = document.getElementById(`p_${p.id}_sale_fields`);
      if (saleToggle.checked) {
        fields.style.display = '';
      } else {
        fields.style.display = 'none';
        prop.sale_date  = null;
        prop.sale_year  = null;
        prop.sale_price = null;
        saveState();
      }
    };

    const actions = document.createElement("div");
    actions.className = "prop-actions";
    actions.innerHTML = `
      <button class="btn" onclick="event.stopPropagation(); duplicateProperty(${Number(p.id)})">Duplicate</button>
      <button class="btn danger" onclick="event.stopPropagation(); removeProperty(${Number(p.id)})">Remove</button>
    `;
    body.appendChild(actions);

    card.appendChild(body);
    wrap.appendChild(card);
    if (expanded && histExpanded) renderPropertyHistoryChart(p);


    fields.forEach(([key, type])=>{
		const el = document.getElementById(`p_${p.id}_${key}`);

		const meta = PROP_FIELD_META[key] || { type: (type === "number" ? "money" : "text") };

		
		if (meta.type === "money" || meta.type === "percent"){
		  el.type = "text";
		  el.inputMode = "decimal";
		} else if (meta.type === "int"){
		  el.type = "text";
		  el.inputMode = "numeric";
		}


		attachUnitInputBehavior(
		  el,
		  meta,
		  () => {
			const prop = state.property_list.find(x => Number(x.id) === Number(p.id));
			return prop ? prop[key] : (p[key] ?? 0);
		  },
		  (v) => {
			const prop = state.property_list.find(x => Number(x.id) === Number(p.id));
			if(!prop) return;
			prop[key] = v;
			saveState();
			if (key === "purchase_price" || key === "property_growth") _updatePropTodaysValueHint(p.id);
		  }
		);

    });

    _updatePropTodaysValueHint(p.id);

    const offEl = document.getElementById(`p_${p.id}_use_offset`);
    offEl.checked = !!p.use_offset;
    offEl.onchange = ()=>{
      const prop = state.property_list.find(x => Number(x.id) === Number(p.id));
      prop.use_offset = !!offEl.checked;
      saveState();
    };

    // PPOR quick-toggle: creates/removes a single open-ended period
  });

  // Populate PPOR rows now that all cards are in the DOM
  (state.property_list || []).forEach(p => renderPporRows(p.id));
  updatePropSummaryStrip();
  // Populate CGT previews for any properties that already have a sale date
  (state.property_list || []).forEach(p => {
    if (p.sale_date || p.sale_year) _renderCgtPreview(p.id);
  });
  // Wire up info tooltips for newly rendered elements
  initInfoTips();
}

function updateSaleField(id, field, rawVal){
  const prop = state.property_list.find(x => Number(x.id) === Number(id));
  if (!prop) return;
  if (field === 'sale_date'){
    if (!rawVal || !rawVal.trim()) {
      prop.sale_date = null;
      prop.sale_year = null;
    } else {
      prop.sale_date = rawVal.trim();
      prop.sale_year = parseInt(rawVal.split('-')[0], 10);
    }
  } else if (field === 'sale_price'){
    const v = parseFloat(String(rawVal).replace(/[,$]/g,''));
    prop.sale_price = (isNaN(v) || rawVal.trim() === '') ? null : v;
  } else if (field === 'sale_agent_rate'){
    const v = parseFloat(rawVal);
    prop.sale_agent_rate = isNaN(v) ? 0.022 : v / 100;
  } else if (field === 'sale_conveyancing'){
    const v = parseFloat(String(rawVal).replace(/[,$]/g,''));
    prop.sale_conveyancing = isNaN(v) ? 2500 : v;
  }
  saveState();
  _renderCgtPreview(id);
}

function _renderCgtPreview(id){
  const el = document.getElementById(`p_${id}_cgt_preview`);
  if (!el) return;
  const prop = state.property_list.find(x => Number(x.id) === Number(id));
  if (!prop || !(prop.sale_date || prop.sale_year)) { el.innerHTML = ''; return; }

  // Parse sale year/month from sale_date (preferred) or legacy sale_year
  let saleYr, saleMo;
  if (prop.sale_date) {
    const parts = prop.sale_date.split('-');
    saleYr = parseInt(parts[0], 10);
    saleMo = parseInt(parts[1], 10);
  } else {
    saleYr = prop.sale_year;
    saleMo = 12;
  }
  const saleDateLabel = prop.sale_date
    ? new Date(saleYr, saleMo - 1, 1).toLocaleString('en-AU', {month:'short', year:'numeric'})
    : String(saleYr);

  const costBase  = (toNumber(prop.purchase_price) + toNumber(prop.purchase_fees));
  const buyYr     = prop.year_bought || new Date().getFullYear();
  const yrsToSale = saleYr - new Date().getFullYear() + (saleMo - (new Date().getMonth()+1)) / 12;
  const projVal   = toNumber(prop.current_value) * Math.pow(1 + toNumber(prop.property_growth||0.03), yrsToSale);
  const salePrice = prop.sale_price || projVal;

  const REFORM_ABS = 2027 * 12 + 7;
  const saleAbs    = saleYr * 12 + saleMo;
  const buyAbs     = buyYr * 12 + (prop.purchase_date ? parseInt(prop.purchase_date.split('-')[1]||1,10) : 1);

  let regimeLabel = '';
  if      (saleAbs < REFORM_ABS)  regimeLabel = 'Pre-2027: 50% CGT discount';
  else if (buyAbs  >= REFORM_ABS) regimeLabel = 'Post-2027: CPI indexation + 30% min';
  else                            regimeLabel = 'Split: 50% discount + indexation';

  // Selling costs
  const agentRate    = prop.sale_agent_rate ?? 0.022;
  const conveyancing = prop.sale_conveyancing ?? 2500;
  const agentFee     = salePrice * agentRate;
  const totalSellCosts = agentFee + conveyancing;

  const totalGain = salePrice - costBase;
  const gainNote  = totalGain <= 0 ? 'No gain — no CGT.' : `Gain: ${fmtMoney(totalGain)} · ${regimeLabel}`;

  el.innerHTML = `
    <div class="cgt-breakdown">
      <div class="cgt-row"><span>Gross proceeds (${saleDateLabel})</span><span>${fmtMoney(salePrice)}</span></div>
      <div class="cgt-row sub"><span>Agent commission (${(agentRate*100).toFixed(2)}%)</span><span>−${fmtMoney(agentFee)}</span></div>
      <div class="cgt-row sub"><span>Conveyancing</span><span>−${fmtMoney(conveyancing)}</span></div>
      <div class="cgt-row total"><span>Selling costs</span><span>−${fmtMoney(totalSellCosts)}</span></div>
      <div class="cgt-row" style="margin-top:4px;"><span>Net after selling costs</span><span>${fmtMoney(salePrice - totalSellCosts)}</span></div>
      <div class="cgt-note">${gainNote} · Run model for exact CGT &amp; net cash</div>
    </div>
  `;
}

function fmtMoneyInput(v){
  if (!v && v !== 0) return '';
  return Number(v).toLocaleString('en-AU', {maximumFractionDigits:0});
}

// ---- Stamp duty calculator (progressive rates, non-FHB investor/subsequent buyer) ----
function calcStampDuty(stateCode, price) {
  price = Math.round(Number(price));
  if (!price || price <= 0) return 0;
  // [threshold, cumulative_base_tax, marginal_rate_above_threshold]
  const tiers = {
    NSW: [[3000000,150490,.07],[1000000,40490,.055],[300000,8990,.045],[80000,1290,.035],[30000,415,.0175],[14000,175,.015],[0,0,.0125]],
    VIC: [[960000,52670,.065],[130000,2870,.06],[25000,350,.024],[0,0,.014]],
    QLD: [[1000000,38025,.0575],[540000,17325,.045],[75000,1050,.035],[5000,0,.015],[0,0,0]],
    WA:  [[1000000,39965,.0515],[500000,16215,.0475],[250000,6590,.0385],[100000,2090,.03],[80000,1520,.0285],[0,0,.019]],
    SA:  [[500000,22580,.055],[300000,11580,.055],[250000,9080,.05],[200000,6830,.045],[100000,2830,.04],[50000,1080,.035],[30000,480,.03],[12000,120,.02],[0,0,.01]],
    TAS: [[725000,29048,.05],[375000,13298,.045],[200000,6298,.04],[75000,1923,.035],[25000,548,.0275],[3000,53,.0225],[0,0,.0175]],
    ACT: [[1455000,58525,.055],[1000000,33500,.055],[750000,21750,.047],[500000,10500,.045],[300000,3500,.035],[200000,1200,.023],[0,0,.006]],
    NT:  [[525000,7875,.0495],[0,0,.015]]
  };
  const table = tiers[stateCode];
  if (!table) return 0;
  for (const [thresh, base, rate] of table) {
    if (price > thresh) return Math.round(base + (price - thresh) * rate);
  }
  return 0;
}

// ---- LMI estimate (Genworth-style tiers, moderate loan sizes) ----
function calcLMI(loanAmount, purchasePrice) {
  loanAmount = Number(loanAmount);
  purchasePrice = Number(purchasePrice);
  if (!loanAmount || !purchasePrice || loanAmount <= 0) return 0;
  const lvr = loanAmount / purchasePrice;
  if (lvr <= 0.80) return 0;
  // LMI rate as % of loan amount (approximate)
  let rate;
  if      (lvr <= 0.85) rate = 0.0066;
  else if (lvr <= 0.90) rate = 0.0166;
  else if (lvr <= 0.92) rate = 0.0235;
  else if (lvr <= 0.95) rate = 0.0310;
  else                  rate = 0.0400;
  return Math.round(loanAmount * rate);
}

// ---- Toggle stamp duty + buying costs estimate panel ----
function toggleStampDutyEstimate(id) {
  const prop = state.property_list.find(p => Number(p.id) === Number(id));
  const el = document.getElementById(`p_${id}_stamp_estimate`);
  if (!prop || !el) return;
  if (el.style.display !== 'none') { el.style.display = 'none'; return; }

  const price = toNumber(prop.purchase_price);
  const loan  = toNumber(prop.original_loan);
  const stateCode = prop.state || 'NSW';

  if (!price) {
    el.innerHTML = '<div class="stamp-note" style="padding:6px;">Enter a purchase price first.</div>';
    el.style.display = '';
    return;
  }

  const stampDuty    = calcStampDuty(stateCode, price);
  const conveyancing = 2000;
  const lmi          = calcLMI(loan, price);
  const lvr          = loan > 0 ? (loan / price) : 0;
  const total        = stampDuty + conveyancing + lmi;

  el.innerHTML = `
    <div class="stamp-estimate">
      <div class="stamp-header">${stateCode} · ${fmtMoney(price)}</div>
      <div class="stamp-row"><span>Stamp duty (${stateCode})</span><span>${fmtMoney(stampDuty)}</span></div>
      <div class="stamp-row"><span>Conveyancing (estimate)</span><span>${fmtMoney(conveyancing)}</span></div>
      ${lmi > 0 ? `<div class="stamp-row lmi"><span>LMI (LVR ${(lvr*100).toFixed(1)}%)</span><span>${fmtMoney(lmi)}</span></div>` : ''}
      <div class="stamp-total"><span>Total buying costs</span><span>${fmtMoney(total)}</span></div>
      <div class="stamp-note">Estimate only · Rates as at 2025 · Not financial advice</div>
      <div class="stamp-btn-row">
        <button class="btn ghost" style="font-size:12px;padding:4px 10px;" onclick="applyBuyingCosts(${id},${total})">Apply to Purchase Fees</button>
      </div>
    </div>
  `;
  el.style.display = '';
}

function applyBuyingCosts(id, total) {
  const prop = state.property_list.find(p => Number(p.id) === Number(id));
  if (!prop) return;
  prop.purchase_fees = total;
  saveState();
  const el = document.getElementById(`p_${id}_purchase_fees`);
  if (el) { el.value = fmtMoneyInput(total); el.dispatchEvent(new Event('blur')); }
  showToast('Buying costs applied', `Purchase fees set to ${fmtMoney(total)}`);
}

function updatePropState(id, stateCode) {
  const prop = state.property_list.find(p => Number(p.id) === Number(id));
  if (!prop) return;
  prop.state = stateCode;
  saveState();
  // Refresh estimate panel if open
  const el = document.getElementById(`p_${id}_stamp_estimate`);
  if (el && el.style.display !== 'none') {
    el.style.display = 'none';
    toggleStampDutyEstimate(id);
  }
}

function updatePurchaseDate(id, value){
  const prop = state.property_list.find(x => Number(x.id) === Number(id));
  if (!prop || !value) return;
  prop.purchase_date = value;                              // "YYYY-MM"
  prop.year_bought   = parseInt(value.split('-')[0], 10); // keep in sync for API
  // If ppor_periods has an auto-seeded period starting at old year_bought-01, update it
  if (prop.ppor_periods && prop.ppor_periods.length === 1 && !prop.ppor_periods[0].to) {
    prop.ppor_periods[0].from = value;
  }
  saveState();
  // Re-render the year badge without full re-render
  const card = document.getElementById(`p_${id}_purchase_date`)?.closest('.propCard');
  if (card) {
    const badge = card.querySelector('.propYearBadge');
    if (badge) {
      const yr   = parseInt(value.split('-')[0], 10);
      const mo   = parseInt(value.split('-')[1], 10);
      const thisYear = new Date().getFullYear();
      const moName = new Date(yr, mo-1, 1).toLocaleString('en-AU', {month:'short'});
      badge.textContent = yr <= thisYear
        ? `Purchased ${moName} ${yr}`
        : `Planned ${moName} ${yr}`;
    }
  }
  updatePropSummaryStrip();
  _updatePropTodaysValueHint(id);
}

/** Future purchase prices are hard to sanity-check on their own (is $2.1M
 *  in 15 years high or low?) — show what that price discounts back to in
 *  today's dollars, using the property's own growth-rate assumption. */
function _updatePropTodaysValueHint(id){
  const el = document.getElementById(`p_${id}_todays_value_hint`);
  if (!el) return;
  const prop = state.property_list.find(x => Number(x.id) === Number(id));
  if (!prop) { el.textContent = ''; return; }

  const buyDateStr = prop.purchase_date || `${prop.year_bought || new Date().getFullYear()}-01`;
  const [buyYear, buyMonth] = buyDateStr.split('-').map(Number);
  const now = new Date();
  const yearsUntil = ((buyYear * 12 + buyMonth) - (now.getFullYear() * 12 + now.getMonth() + 1)) / 12;

  const price = toNumber(prop.purchase_price);
  const growth = toNumber(prop.property_growth);
  if (yearsUntil <= 0 || !price) { el.textContent = ''; return; }

  const todaysValue = price / Math.pow(1 + growth, yearsUntil);
  el.textContent = `≈ ${fmtMoney(todaysValue)} in today's dollars (at ${(growth*100).toFixed(1)}%/yr growth over ${yearsUntil.toFixed(1)} yrs)`;
}

/** Quick rent ballpark for properties far enough out that the user has no
 *  real basis for a number — assumes a typical AU residential gross yield.
 *  Deliberately rough (one flat assumption, not suburb-aware); it's a
 *  starting point to edit, not a valuation. */
const ASSUMED_GROSS_RENTAL_YIELD = 0.04; // ~4%/yr

function estimatePropertyRent(id){
  const prop = state.property_list.find(x => Number(x.id) === Number(id));
  if (!prop) return;
  const value = toNumber(prop.current_value) || toNumber(prop.purchase_price);
  if (!value) {
    showToast('Add a value first', 'Enter Current Value or Purchase Price to estimate rent.');
    return;
  }
  const estMonthly = Math.round((value * ASSUMED_GROSS_RENTAL_YIELD) / 12);
  prop.monthly_rent = estMonthly;
  saveState();
  const el = document.getElementById(`p_${id}_monthly_rent`);
  if (el) el.value = formatForUI(estMonthly, PROP_FIELD_META.monthly_rent);
  showToast('Estimated', `Rent set to ${fmtMoney(estMonthly)}/mo — ~${(ASSUMED_GROSS_RENTAL_YIELD*100).toFixed(0)}% gross yield on ${fmtMoney(value)}. Adjust if you know the area.`);
}

function duplicateProperty(id){
  const p = state.property_list.find(x => Number(x.id) === Number(id));
  if(!p) return;

  const newId = nextPropertyId();
  const copy = JSON.parse(JSON.stringify(p));

  // duplicated property should NEVER be PPOR
  if (copy.is_owner_occupied) copy.is_owner_occupied = false;

  copy.id = newId;
  copy.name = (p.name || "Property") + " (copy)";

  state.property_list.push(copy);
  saveState();
  renderProperties();
}


/* ── Properties Tab ─────────────────────────────────────── */

function showPropertiesTab(){
  showTab('portfolio');
  switchPortSubTab('properties');
  // Both sub-tabs share tab-portfolio; showTab activated the Holdings nav
  // button — hand the highlight to the Properties one instead.
  document.getElementById('btnPortfolio')?.classList.remove('active');
  document.getElementById('btnPropertiesNav')?.classList.add('active');
}

function updatePropSummaryStrip(){
  const props = state.property_list || [];
  // Totals reflect what you own TODAY — planned future purchases are shown
  // on their own cards but excluded here so equity/net worth aren't inflated
  // by wealth that doesn't exist yet.
  const owned = props.filter(propertyOwnedNow);
  const planned = props.length - owned.length;
  const totValue  = owned.reduce((s,p) => s + toNumber(p.current_value), 0);
  const totDebt   = owned.reduce((s,p) => s + toNumber(p.loan_balance_current ?? p.original_loan ?? 0), 0);
  const totEquity = Math.max(totValue - totDebt, 0);
  const avgLvr    = totValue > 0 ? (totDebt / totValue) : 0;
  const totNet    = owned.reduce((s,p) => s + calcNetMonthlyForProperty(p), 0);
  const fmt = v => v > 0 ? fmtMoney(v) : (v < 0 ? '-'+fmtMoney(-v) : '—');
  const s = id => document.getElementById(id);
  if(s('propSIValue'))  s('propSIValue').textContent = fmtMoney(totValue);
  if(s('propSIDebt'))   s('propSIDebt').textContent  = fmtMoney(totDebt);
  if(s('propSIEquity')) s('propSIEquity').textContent= fmtMoney(totEquity);
  if(s('propSILvr'))    s('propSILvr').textContent   = totValue > 0 ? `${(avgLvr*100).toFixed(0)}%` : '—';
  if(s('propSINet')){
    s('propSINet').textContent = totNet !== 0 ? (totNet > 0 ? '+' : '') + fmtMoney(totNet)+'/mo' : '—';
    s('propSINet').style.color = totNet >= 0 ? '#059669' : '#E11D48';
  }
  // Also update drawer summary
  const dps = document.getElementById('drawerPropSummary');
  if(dps){
    if(!props.length){
      dps.textContent = 'No properties added yet.';
    } else {
      const inv  = props.filter(p => !_isPporNow(p)).length;
      const ppor = props.filter(p =>  _isPporNow(p)).length;
      dps.innerHTML = `${props.length} propert${props.length!==1?'ies':'y'}`
        + (ppor ? ` &nbsp;·&nbsp; ${ppor} PPOR` : '')
        + (inv  ? ` &nbsp;·&nbsp; ${inv} investment` : '')
        + (planned ? ` &nbsp;·&nbsp; ${planned} planned` : '')
        + `<br>Total equity <strong>${fmtMoney(totEquity)}</strong>`
        + (planned ? ` <span style="color:#6A716B;">(owned today — excludes planned)</span>` : '')
        + ` &nbsp;·&nbsp; Net/mo <strong style="color:${totNet>=0?'#059669':'#E11D48'}">${totNet>=0?'+':''}${fmtMoney(totNet)}</strong>`;
    }
  }
}

/** ---------------------------
 *  Property migration
 *  --------------------------*/
function _migrateProperty(p){
  // Derive purchase_date from year_bought if absent
  if (!p.purchase_date && p.year_bought) {
    p.purchase_date = `${p.year_bought}-01`;
  }
  // Sync year_bought from purchase_date (keep in step)
  if (p.purchase_date) {
    p.year_bought = parseInt(p.purchase_date.split('-')[0], 10);
  }
  // Add ppor_periods if absent (derive from legacy is_owner_occupied)
  if (!p.ppor_periods) {
    const from = p.purchase_date || `${p.year_bought || new Date().getFullYear()}-01`;
    p.ppor_periods = p.is_owner_occupied
      ? [{ from, to: null, six_year_rule: false }]
      : [];
  }
  if (p.sale_year           === undefined) p.sale_year           = null;
  if (p.sale_price          === undefined) p.sale_price          = null;
  if (p.sale_agent_rate     === undefined) p.sale_agent_rate     = 0.022;
  if (p.sale_conveyancing   === undefined) p.sale_conveyancing   = 2500;
  if (!p.state)                            p.state               = 'NSW';
  // Derive sale_date from legacy sale_year if absent (assume December)
  if (!p.sale_date && p.sale_year) {
    p.sale_date = `${p.sale_year}-12`;
  }
  // Keep sale_year synced from sale_date
  if (p.sale_date) {
    p.sale_year = parseInt(p.sale_date.split('-')[0], 10);
  }
  if (p.sale_date === undefined) p.sale_date = null;
  return p;
}

// Is this property currently PPOR (today's date)?
function _isPporNow(p){
  const periods = p.ppor_periods || [];
  if (!periods.length) return !!p.is_owner_occupied;
  const now = new Date();
  const nowAbs = now.getFullYear() * 12 + now.getMonth() + 1;
  for (const pr of periods){
    const [fy, fm] = pr.from.split('-').map(Number);
    const fAbs = fy * 12 + fm;
    let tAbs = 999999;
    if (pr.to){ const [ty, tm] = pr.to.split('-').map(Number); tAbs = ty * 12 + tm; }
    if (nowAbs >= fAbs && nowAbs <= tAbs) return true;
  }
  return false;
}

/** Human-readable current status — flags the 6-year-rule window specifically,
 *  since "Investment" alone doesn't make clear the CGT exemption is still active. */
function _propertyStatusLabel(p){
  if (_isPporNow(p)) return { text: 'Owner-occupied', cls: 'ppor' };
  const periods = p.ppor_periods || [];
  if (!periods.length) return { text: 'Investment', cls: 'investment' };
  const now = new Date();
  const nowAbs = now.getFullYear() * 12 + now.getMonth() + 1;
  // Most recent ended period with an explicit "to" date
  let lastEnded = null;
  for (const pr of periods){
    if (!pr.to) continue;
    const [ty, tm] = pr.to.split('-').map(Number);
    const tAbs = ty * 12 + tm;
    if (tAbs < nowAbs && (!lastEnded || tAbs > lastEnded.tAbs)) lastEnded = { ...pr, tAbs };
  }
  if (lastEnded && lastEnded.six_year_rule){
    const monthsSince = nowAbs - lastEnded.tAbs;
    if (monthsSince <= 72){
      const yearsLeft = ((72 - monthsSince) / 12).toFixed(1);
      return { text: `Rented — 6-yr CGT exemption (${yearsLeft} yrs left)`, cls: 'sixyear' };
    }
  }
  return { text: 'Investment', cls: 'investment' };
}

// Derive is_owner_occupied from ppor_periods for the API payload
function _derivedIsOwnerOccupied(p){
  return _isPporNow(p);
}

/** ---------------------------
 *  PPOR Timeline UI
 *  --------------------------*/

function renderPporRows(id){
  const wrap = document.getElementById(`ppor-rows-${id}`);
  if (!wrap) return;
  const prop = state.property_list.find(x => Number(x.id) === Number(id));
  if (!prop) return;
  const periods = prop.ppor_periods || [];

  wrap.innerHTML = '';
  if (!periods.length){
    wrap.innerHTML = '<div style="font-size:12px; color:#6A716B; padding:4px 0;">No PPOR periods — property treated as investment throughout.</div>';
    return;
  }

  // Panel header
  const hdr = document.createElement('div');
  hdr.className = 'ppor-panel-hdr';
  hdr.textContent = 'PPOR periods · "To" blank = ongoing';
  wrap.appendChild(hdr);

  periods.forEach((pr, idx) => {
    const hasEnd = !!pr.to;
    const row = document.createElement('div');
    row.className = 'ppor-row';
    row.innerHTML = `
      <div style="width:126px;">${monthPickerHTML(`ppor_${id}_${idx}_from`, pr.from || '', {
        onChange: (val) => updatePporPeriod(id, idx, 'from', val)
      })}</div>
      <span class="ppor-arrow">→</span>
      <div style="width:126px;">${monthPickerHTML(`ppor_${id}_${idx}_to`, pr.to || '', {
        placeholder: 'Ongoing', allowClear: true, clearLabel: 'Ongoing',
        onChange: (val) => updatePporPeriod(id, idx, 'to', val || null)
      })}</div>
      <label class="ppor-sixyr-chip${hasEnd ? '' : ' chip-disabled'}"
             title="${hasEnd ? 'Claim 6-year CGT absence rule after this period ends' : 'Set an end date to enable the 6-year absence rule'}">
        <input type="checkbox" ${pr.six_year_rule?'checked':''} ${hasEnd?'':'disabled'}
               onchange="updatePporPeriod(${id},${idx},'six_year_rule',this.checked)" />
        6-year rule
        <span class="info-tip" data-tip="six_year_rule">?</span>
      </label>
      <button class="btn ghost ppor-remove-btn" onclick="removePporPeriod(${id},${idx})">✕</button>
    `;
    wrap.appendChild(row);
  });

  checkPporConflicts();
}

function addPporPeriod(id){
  const prop = state.property_list.find(x => Number(x.id) === Number(id));
  if (!prop) return;
  if (!prop.ppor_periods) prop.ppor_periods = [];
  // Default: start from next year if periods exist, else from year_bought
  const lastEnd = prop.ppor_periods.length
    ? (prop.ppor_periods[prop.ppor_periods.length-1].to || null)
    : null;
  const defaultFrom = lastEnd
    ? lastEnd
    : (prop.purchase_date || `${prop.year_bought || new Date().getFullYear()}-01`);
  prop.ppor_periods.push({ from: defaultFrom, to: null, six_year_rule: false });
  // Sync is_owner_occupied
  prop.is_owner_occupied = _derivedIsOwnerOccupied(prop);
  saveState();
  renderPporRows(id);
}

function removePporPeriod(id, idx){
  const prop = state.property_list.find(x => Number(x.id) === Number(id));
  if (!prop) return;
  prop.ppor_periods.splice(idx, 1);
  prop.is_owner_occupied = _derivedIsOwnerOccupied(prop);
  saveState();
  renderPporRows(id);
  renderProperties();
}

function updatePporPeriod(id, idx, field, value){
  const prop = state.property_list.find(x => Number(x.id) === Number(id));
  if (!prop || !prop.ppor_periods[idx]) return;
  prop.ppor_periods[idx][field] = value;
  // If 'to' is cleared, set six_year_rule = false (can't apply to open period)
  if (field === 'to' && !value) prop.ppor_periods[idx].six_year_rule = false;
  prop.is_owner_occupied = _derivedIsOwnerOccupied(prop);
  saveState();
  renderPporRows(id);
  updatePropSummaryStrip();
}

function checkPporConflicts(){
  // Build flat list of (propId, from_abs, to_abs)
  const segments = [];
  (state.property_list || []).forEach(p => {
    (p.ppor_periods || []).forEach(pr => {
      const [fy, fm] = pr.from.split('-').map(Number);
      const fAbs = fy * 12 + fm;
      let tAbs = 999999;
      if (pr.to){ const [ty, tm] = pr.to.split('-').map(Number); tAbs = ty * 12 + tm; }
      segments.push({ id: p.id, fAbs, tAbs });
    });
  });

  // Find conflicts (two segments from different properties that overlap)
  const conflicted = new Set();
  for (let a = 0; a < segments.length; a++){
    for (let b = a + 1; b < segments.length; b++){
      if (segments[a].id === segments[b].id) continue; // same property — ok
      const overlap = segments[a].fAbs <= segments[b].tAbs && segments[b].fAbs <= segments[a].tAbs;
      if (overlap){ conflicted.add(segments[a].id); conflicted.add(segments[b].id); }
    }
  }

  (state.property_list || []).forEach(p => {
    const el = document.getElementById(`ppor-conflict-${p.id}`);
    if (!el) return;
    if (conflicted.has(p.id)){
      el.textContent = '⚠ PPOR overlap with another property — only one PPOR at a time.';
      el.style.display = '';
    } else {
      el.style.display = 'none';
    }
  });
}

/** ---------------------------
 *  Info tooltip system
 *  --------------------------*/
const INFO_TIPS = {
  stock_override: {
    title: 'Additional Stock Contributions',
    body: 'Add to (or subtract from) what the model normally contributes to stocks in a specific year — it\'s additional on top of your usual yearly contribution, not a replacement of it. Useful for years with a bonus or windfall (positive amount) or years cash was tight (negative amount). On the Model tab, switch on "Additional Stock Contributions" below the chart, then click that year — the line, the Year row, or the Age row all work. Years with one turn dark yellow on the Year/Age axis so you can see which are set at a glance; click a highlighted year again to edit or remove it.'
  },
  ppor: {
    title: 'Main Residence (PPOR)',
    body: 'Your Principal Place of Residence is fully exempt from Capital Gains Tax. You can only have one PPOR at a time. If you move out, the 6-year absence rule may extend the exemption.'
  },
  six_year_rule: {
    title: '6-Year Absence Rule',
    body: 'If you move out and rent the property out, this only protects your CGT exemption when you eventually sell — it does NOT keep treating the property as your home. The moment your PPOR period ends, the model automatically switches to investment treatment: rent counts as income, mortgage interest becomes tax-deductible, exactly like any other rental. The 6-year rule just caps how much of that rental period still counts as CGT-exempt at sale time. Set an end date on this period, tick this box, and make sure Monthly Rent is set to what you\'ll actually charge.'
  },
  cgt_pre2027: {
    title: 'CGT Discount (pre-July 2027)',
    body: 'For properties sold before 1 July 2027, capital gains are halved (50% discount) if you\'ve owned the property for more than 12 months. The remainder is taxed at your marginal rate.'
  },
  cgt_post2027: {
    title: 'CGT Reform (from July 2027)',
    body: 'Under the reform legislated in 2026, from 1 July 2027 the 50% discount is replaced by CPI indexation of your cost base (only real gains above inflation are taxed) plus a 30% minimum tax rate. This applies to the post-2027 portion of any gain. Exemptions apply for income-support recipients, and investors in new builds can opt to keep the old 50% discount.'
  },
  cost_base: {
    title: 'Cost Base',
    body: 'Purchase price plus purchase costs (stamp duty, legal fees). A higher cost base means a lower taxable gain. From July 2027 the cost base is also adjusted upward for CPI inflation each year.'
  },
  sale_price: {
    title: 'Expected Sale Price',
    body: 'Leave blank to use the model\'s projected property value in the sale year (based on your growth rate). Enter a specific figure to override the projection.'
  },
  rb_chart: {
    title: 'Reading the chart',
    body: 'The solid green line is your net worth if you buy — home equity (value minus what you still owe) plus any investments once owning becomes cheaper than renting. The dashed indigo line is the renter\'s portfolio: the deposit, stamp duty and costs they never spent, invested, plus everything they save each month while renting is cheaper. The renter starts AHEAD, because the buyer just handed over stamp duty and costs that vanish on day one. Where the lines cross is your break-even — the point buying overtakes renting. Before it, renting won; after it, buying is winning and the gap usually widens as rent keeps rising and the loan shrinks. Drag the growth and return sliders and watch the crossing move — sometimes off the chart entirely.'
  },
  rb_assumptions: {
    title: 'What drives rent vs buy',
    body: 'This runs both paths month by month. The buyer sinks their deposit, stamp duty and costs into the home; the renter invests that exact same cash instead, then keeps investing whatever the cheaper option saves each month (early on that\'s usually renting, but as rent grows owning often becomes cheaper — then the owner starts investing the difference). We compare net worth at the end: home equity plus any investments, versus the renter\'s portfolio. The result hinges almost entirely on two numbers: property growth vs investment return. Long-run Australian housing has done roughly 5–7% and diversified shares roughly 7–10%, but nudge either and the answer flips — so treat this as a way to test your assumptions, not a prediction. It also ignores selling costs, rate changes, and the security of owning your home.'
  },
  bp_chart: {
    title: 'Why rates move your borrowing power',
    body: 'Your income and expenses set a fixed monthly surplus — the most you can put toward a repayment. What that surplus can actually buy depends entirely on the rate: at a higher rate, more of every repayment is interest, so the same surplus services a smaller loan. This curve steps in 0.25% (25 basis points), the increment the RBA moves in, so each step along the line is one rate decision. The marked point is your current rate. Notice the line is steeper at the low end — early hikes bite hardest. And remember lenders assess you at your rate plus a 3% buffer, so the whole curve already sits lower than today\'s repayment alone would suggest.'
  },
  bp_commitments: {
    title: 'How lenders assess your spending',
    body: 'Banks don\'t just take your word on expenses — they use the greater of what you declare and a benchmark (the HEM) based on your household. Leave living expenses blank and we estimate a HEM-style figure from your household size and dependants; enter your own to override. Credit cards count even if you never carry a balance: lenders treat the full limit as a commitment (we assume ~3.8% of the limit per month), so cancelling unused cards can lift your borrowing power. Other loan repayments (car, personal, HECS) reduce it too.'
  },
  bp_buffer: {
    title: 'The serviceability buffer',
    body: 'Lenders don\'t assess you at today\'s rate — APRA requires them to add a buffer (currently 3%) and check you could still repay if rates rose. So we test your borrowing power at your rate + 3%. Your actual repayment (shown separately) is calculated at the real rate. This is why the amount a bank will lend is lower than what today\'s repayment alone would suggest.'
  },
  bp_duty: {
    title: 'Stamp duty estimate',
    body: 'Stamp (transfer) duty is a state tax on the purchase price, on a sliding scale — it\'s often your biggest upfront cost after the deposit. We use current standard rates for your state (VIC and NT use their own formulas). First-home-buyer concessions are applied for NSW, VIC and QLD where the rules are clear-cut; other states show a reminder to check. Rates are indexed and concessions change, so treat this as indicative and confirm with your state revenue office\'s calculator.'
  },
  off_strategy: {
    title: 'How this works',
    body: 'Your minimum repayment stays the same, but money in an offset account is netted off your loan balance before interest is charged — so less of each repayment is eaten by interest and more pays down the loan. That means the interest you save is automatically reinvested into paying the loan off faster. Extra repayments do the same, directly. Together they can cut years off a 30-year loan and save tens of thousands in interest.'
  },
  off_chart: {
    title: 'Reading the chart',
    body: 'The green line is your loan balance with the offset and extra repayments; the grey dashed line is the same loan with neither. Where green hits zero is the day you\'re debt-free — the gap to the grey line is the time you saved. The amber lines are the interest you\'ve handed the bank so far, cumulatively: solid is your plan, dashed is the standard loan, and the gap between them at the end is your total interest saved. Notice the green line starts dropping faster and keeps accelerating — every dollar of interest you avoid becomes principal, which shrinks next month\'s interest again.'
  },
  off_grow: {
    title: 'Growing your offset',
    body: 'If you sweep spare cash into your offset each month — a portion of your pay, say — the offset balance grows over time, cutting your interest by more and more as it builds. Unlike extra repayments, offset money stays yours to withdraw whenever you need it, which makes it a flexible way to get ahead without locking the cash away.'
  },
  pnc_depreciation: {
    title: 'Depreciation (mostly new builds)',
    body: 'Depreciation is a paper deduction — you claim wear-and-tear on the building and its fittings without spending a cent, so it lifts your negative-gearing tax back while your cash flow is untouched. It\'s biggest on new or near-new builds: roughly $8,000–15,000 a year early on (building at 2.5% p.a. plus fixtures and fittings). Established homes are usually far less — often $2,000–5,000, and close to $0 if built before 1987 or bought second-hand after May 2017, when the rules stopped investors depreciating used fittings. Only the tax saved (depreciation × your marginal rate) reduces your cost, not the full amount. For an exact figure, get a quantity surveyor\'s depreciation schedule.'
  },
  pnc_offset: {
    title: 'Offset account',
    body: 'Cash sitting in an offset account linked to the loan is netted against your loan balance before interest is charged — $50,000 in offset on a $600,000 loan means you only pay interest on $550,000. Your repayment stays the same, so the interest you save goes straight to extra principal: you pay the loan down faster and build equity quicker. It also cuts your deductible interest slightly (a smaller negative-gearing benefit), but you come out ahead because you save interest at the full rate and only give back tax at your marginal rate. Unlike a redraw, offset money stays yours to withdraw anytime.'
  },
  pnc_costs: {
    title: 'Typical running costs',
    body: 'Rough Australian ranges to start from — adjust to your property. Agent/management: 5–9% of rent (metro ~7%). Maintenance: 0.5–1.5% of the property value a year (older places cost more). Insurance (building + landlord): ~$1,000–2,500. Council rates: ~$1,500–3,000. Strata/body corporate applies to apartments and townhouses only — houses are $0. All of these are tax-deductible against your rental income.'
  },
  pnc_gearing: {
    title: 'Negative gearing & your salary',
    body: 'When a rental costs more to hold (interest + expenses) than the rent it earns, the loss is deducted from your salary, lowering your taxable income and giving you tax back at your marginal rate — so a higher earner gets a bigger benefit. That\'s why your salary matters here. Add a partner and we assume 50/50 ownership, splitting the loss (and the tax back) across both of you at each person\'s own rate. Principal repayments are NOT deductible — only interest and running costs are.'
  },
  pnc_holding: {
    title: 'Cash out of pocket vs actual cost',
    body: 'Two different questions. CASH OUT OF POCKET is what leaves your account: repayment (interest AND principal) + running costs − rent − tax back. It\'s what your weekly budget feels. ACTUAL COST strips the principal out, because principal isn\'t spent — it pays down your loan and becomes equity you keep. So it\'s interest + running costs − rent − tax back: the money genuinely gone. It\'s also what the property would cost on an interest-only loan, which is what most investors use. What an offset does: your repayment never changes, so the only reason cash out of pocket shifts is that a smaller interest bill means a smaller tax refund — it can tick UP. Meanwhile actual cost FALLS, because you burned less interest and that money bought equity instead. The one figure an offset can\'t touch is the before-tax line (repayment + costs − rent). Worth knowing: because an offset kills a deductible expense, most advisers say put spare cash against your home loan (non-deductible) rather than an investment property\'s offset.'
  },
  plan_delta: {
    title: 'Ahead of / behind your plan',
    body: 'Your plan needs your wealth to grow by a set amount each month (income − tax − living costs, plus employer super) while your invested wealth compounds. Starting from your net worth in your first logged Holdings month, we project that plan forward to today (assuming a 5% real return) and compare it to your actual net worth now. Ahead means your real net worth is above that line; behind means below. Because it uses net worth, everything counts — savings, mortgage principal, super and market moves — so a strong (or weak) market shows up here too. It appears once you\'ve logged at least two months of Holdings.'
  },
  mortgage_split: {
    title: 'Splitting your mortgage',
    body: 'A mortgage payment is two different things: interest (the true cost of borrowing — money you never get back, like rent) and principal (paying down the loan, which builds equity you own — real progress toward FIRE). Because the row is linked to a property, we split the payment automatically from that loan\'s rate and balance, updating as the balance falls. To set it yourself, just edit the Interest or Principal field — the two always add up to the total shown in the cell, and it switches to a manual split (↺ Back to auto re-links it). Only the principal counts as wealth built; the interest stays a living cost. Budget and Actual each keep their own split.'
  },
  fire_pace: {
    title: 'Wealth built vs FIRE pace',
    body: 'The dashed line — your FIRE pace — is the total you need to put toward wealth each month to stay on plan: income minus tax minus living costs, PLUS your employer super, MINUS your home-loan interest. (Your Current Expenses input excludes the mortgage, so we subtract the interest here to match the bars, which also treat interest as a cost. Principal is left out of both — it just moves cash into equity.) Each bar is what you actually built in a logged Budget month, stacked into three kinds of progress because they aren\'t interchangeable: Invested / saved (green) is spendable — leftover cash plus share contributions; Super (indigo) is your 12% employer contribution plus any extra, locked until preservation age; Home equity (amber) is the principal you paid down on your mortgage plus any extra repayments/offset. All three count toward FIRE on a total-net-worth basis, so a month heavy on mortgage principal or super is NOT "behind" — the stack shows exactly where your progress went. Reach the line and you\'re on track. Mortgage principal is worked out automatically from your home loan in the model; add your home under Properties for it to appear.'
  },
  savings_rate: {
    title: 'Savings Rate',
    body: 'Net savings divided by after-tax income — the single most powerful FIRE lever, because it sets both how fast you invest AND how little you need to live on. The years-to-FIRE estimates shown assume a 5% real (after-inflation) return, the 4% rule (needing 25× annual spending), and starting from zero. On those assumptions: 20% ≈ 37 yrs, 30% ≈ 28 yrs, 50% ≈ 17 yrs, 70% ≈ 9 yrs — independent of how much you earn. Your full model refines this with your actual balances, property, super and tax.'
  },
  super_extra_tax: {
    title: 'Extra Super: Before vs After Tax',
    body: 'Before tax (salary sacrifice): the contribution comes out of your salary before income tax, reducing your tax bill, but the fund takes 15% contributions tax on the way in (85% lands), and it stops at FIRE since there\'s no salary left to sacrifice. After tax: paid from your savings — the full amount lands, there\'s no tax deduction, and it can continue after FIRE. Before tax usually wins while your marginal rate is above 15%. Watch the $30k/yr concessional cap (includes employer SG) — the model doesn\'t enforce it.'
  },
  fire_number: {
    title: 'FIRE Number',
    body: 'The net worth needed to retire, calculated as your target annual expenses divided by the safe withdrawal rate (SWR). At 4% SWR, multiply annual expenses by 25.'
  },
  swr: {
    title: 'Safe Withdrawal Rate (SWR)',
    body: 'The annual percentage of your portfolio you can sustainably withdraw. 4% is the commonly cited figure from the Trinity Study (1998), meaning a portfolio should last 30+ years.'
  },
  super_access: {
    title: 'Super Access Age',
    body: 'The preservation age at which you can access superannuation. Currently 60 for most Australians. Super is generally tax-free in pension phase after age 60.'
  },
  offset: {
    title: 'Offset Account',
    body: 'A linked savings account whose balance reduces the loan principal for interest calculation. E.g. $100k loan with $20k offset → interest charged on $80k only. Your cash savings effectively "cancel" that portion of interest.'
  },
  negative_gearing: {
    title: 'Negative Gearing',
    body: 'When a property\'s costs (interest, rates, strata, etc.) exceed its rental income, the net loss can be offset against your other taxable income, reducing your tax bill. This is reflected in the Net Rent column.'
  },
  cpi_rate: {
    title: 'CPI Assumption',
    body: 'Annual inflation rate used to index property cost bases from July 2027 onwards. The RBA targets 2–3% over the medium term. This only affects the CGT calculation on property sales after July 2027.'
  },
  end_age: {
    title: 'Model To Age',
    body: 'The age the projection runs to. Set it past your super access age (60) so the model can show super drawdowns — ending at 60 means super income barely appears.'
  },
  lifestyle_income: {
    title: 'Target Lifestyle Income',
    body: 'The annual income (in today\'s dollars) you want to live on after reaching FIRE. The model inflates it each year and declares FIRE when your passive cashflow — net rent, stock drawdown, and super (once accessible) — covers it after tax and loan principal payments. This is also what you\'re assumed to spend each year post-FIRE.'
  },
  inflation: {
    title: 'Inflation',
    body: 'Grows your expenses, lifestyle target, and stock contributions each year. The RBA targets 2–3%; Australia\'s long-run average is about 2.5%. Small changes compound heavily over 30+ years, so stay realistic.'
  },
  salary_growth: {
    title: 'Salary Growth',
    body: 'Annual growth in your gross income. The Wage Price Index has averaged ~3–3.5%/yr. Use a higher rate if you expect promotions, but remember it applies every single year of the projection.'
  },
  stock_growth: {
    title: 'Stock Growth Rate',
    body: 'Long-run total return on your share portfolio. Australian and global equities have returned roughly 7–9%/yr over long periods before tax. The model doesn\'t tax returns during accumulation, so entering an after-tax rate (6–7%) is more realistic.'
  },
  super_growth: {
    title: 'Super Growth Rate',
    body: 'Long-run return on your super after fund fees and the 15% earnings tax. Typical balanced funds have delivered 6–7%/yr after those drags; growth options a little more with more volatility.'
  },
  sg_rate: {
    title: 'Employer Super Guarantee',
    body: 'The compulsory percentage of your salary your employer pays into super — legislated at 12% from 1 July 2025. The model applies the 15% contributions tax, so 85% of the gross amount lands in your balance.'
  },
  vacancy_mgmt: {
    title: 'Vacancy & Management Fees',
    body: 'Realistic rentals aren\'t occupied 52 weeks a year — allowing 1–3 weeks of vacancy is standard. Agent-managed properties also pay a management fee, typically 5–8% of rent. Both reduce the effective rent used in the model. Leave at 0 to self-manage with no vacancy allowance.'
  }
};

let _tipTimeout = null;

let _activeTipEl = null;
let _tipPinned = false;   // true once opened by click — stays open until dismissed explicitly

function showInfoTip(key, el, pin){
  const tip = INFO_TIPS[key];
  if (!tip) return;
  let tooltip = document.getElementById('infoTooltip');
  if (!tooltip) return;

  // Mark the icon as "open"
  if (_activeTipEl && _activeTipEl !== el) _activeTipEl.classList.remove('tip-open');
  _activeTipEl = el;
  el.classList.add('tip-open');
  if (pin) _tipPinned = true;

  tooltip.querySelector('.tip-title').textContent = tip.title;
  tooltip.querySelector('.tip-body').textContent  = tip.body;
  // The base CSS sets display:none — clearing the inline style here just
  // falls back to that, so the tip never actually appeared. Set it explicitly.
  tooltip.style.display = 'block';

  // Position near the icon — below by default, flipped above when there
  // isn't room (e.g. icons near the bottom of the inputs drawer).
  const rect = el.getBoundingClientRect();
  const scrollY = window.scrollY || 0;
  const ttH = tooltip.offsetHeight || 120;
  let top = rect.bottom + scrollY + 6;
  if (rect.bottom + ttH + 12 > window.innerHeight && rect.top - ttH - 12 > 0) {
    top = rect.top + scrollY - ttH - 6;
  }
  let left = rect.left;

  // Keep within viewport
  const ttW = 280;
  if (left + ttW > window.innerWidth - 12) left = window.innerWidth - ttW - 12;
  if (left < 8) left = 8;

  tooltip.style.top  = top  + 'px';
  tooltip.style.left = left + 'px';

  clearTimeout(_tipTimeout);
}

function closeInfoTipNow(){
  clearTimeout(_tipTimeout);
  const tooltip = document.getElementById('infoTooltip');
  if (tooltip) tooltip.style.display = 'none';
  if (_activeTipEl) { _activeTipEl.classList.remove('tip-open'); _activeTipEl = null; }
  _tipPinned = false;
}

function hideInfoTip(){
  if (_tipPinned) return;   // pinned (click-opened) tips only close via explicit dismiss
  _tipTimeout = setTimeout(closeInfoTipNow, 150);
}

let _tipOutsideClickBound = false;

function initInfoTips(){
  // Avoid double-binding: mark each element once
  document.querySelectorAll('.info-tip:not([data-tip-bound])').forEach(el => {
    el.setAttribute('data-tip-bound', '1');
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', 'More information');
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    const key = el.dataset.tip;
    el.addEventListener('mouseenter', () => { if (!_tipPinned) showInfoTip(key, el); });
    el.addEventListener('mouseleave', hideInfoTip);
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      // Clicking the already-open icon again closes it; otherwise open + pin.
      if (_tipPinned && _activeTipEl === el) { closeInfoTipNow(); return; }
      showInfoTip(key, el, true);
    });
  });
  const tooltip = document.getElementById('infoTooltip');
  if (tooltip && !tooltip._tipBound){
    tooltip._tipBound = true;
    tooltip.addEventListener('mouseenter', () => clearTimeout(_tipTimeout));
    tooltip.addEventListener('mouseleave', hideInfoTip);
  }
  // Clicking anywhere outside a pinned tooltip dismisses it.
  if (!_tipOutsideClickBound){
    _tipOutsideClickBound = true;
    document.addEventListener('click', (e) => {
      if (!_tipPinned) return;
      const tooltipEl = document.getElementById('infoTooltip');
      if (tooltipEl && tooltipEl.contains(e.target)) return;
      if (e.target.closest && e.target.closest('.info-tip')) return; // its own handler manages this
      closeInfoTipNow();
    });
  }
}

/** ---------------------------
 *  API health
 *  --------------------------*/
async function pingAPI(){
  const base = (state.apiBase || "").replace(/\/+$/,"");
  if(!base){
    setApiStatus(false, "API base URL missing");
    return;
  }
  try{
    const r = await fetch(base + "/health", {method:"GET"});
    const j = await r.json().catch(()=>null);
    const ok = !!(j && (j.ok === true || j.status === "ok"));
    setApiStatus(ok, ok ? "ok" : "health returned non-ok");
  }catch(e){
    setApiStatus(false, "unreachable");
  }
}
function setApiStatus(ok, text){
  const dot = document.getElementById("apiStatusDot");
  if(dot){
    dot.style.background = ok ? "#22c55e" : "#ef4444";
    dot.style.boxShadow  = ok
      ? "0 0 0 3px rgba(34,197,94,.20)"
      : "0 0 0 3px rgba(239,68,68,.20)";
    dot.title = ok ? `API reachable (${text}) — click to re-check` : `API issue: ${text} — click to re-check`;
  }
  const badge = document.getElementById("apiBadge");
  if(badge) badge.innerHTML = ok
    ? `<span class="ok"></span><span>API reachable (${escapeHtml(text)})</span>`
    : `<span class="no"></span><span>API issue (${escapeHtml(text)})</span>`;
  const sDot = document.getElementById("settingsApiDot");
  if(sDot) sDot.textContent = ok ? "🟢" : "🔴";
  const sText = document.getElementById("settingsApiStatusText");
  if(sText) sText.textContent = ok ? `Reachable (${text})` : `Issue: ${text}`;
}

function normalizeInputs(obj){
  const out = {};
  for (const [k, v] of Object.entries(obj || {})){
    out[k] = toNumber(v); // every input becomes a number
  }
  return out;
}

/** ---------------------------
 *  Build payload + run
 *  --------------------------*/
function buildPayload(){
  return {
    inputs: normalizeInputs(state.inputs),  // ✅ normalize ALL inputs, no key list
    property_list: state.property_list,
    life_events: state.life_events || [],
    stock_contribution_overrides: state.stock_contribution_overrides || [],
    display_month: (state.mode === "monthly")
  };
}

function nowMs(){ return performance.now(); }



async function callPath(base, path, payload, idToken){
  const url = base + path + (path.includes("?") ? "&" : "?") + "t=" + Date.now();

  const body = JSON.stringify(payload);
  console.log("SENDING body:", body);

  // ✅ TIMING START
  const t0 = nowMs();

  let r, text;
  try {
    const headers = {
      "Content-Type":"application/json",
      "Cache-Control":"no-store",
      "Pragma":"no-cache"
    };
    if (idToken) headers["Authorization"] = "Bearer " + idToken;
    r = await fetch(url, {
      method: "POST",
      headers,
      cache: "no-store",
      body
    });
  } catch (e) {
    const tFail = (nowMs() - t0).toFixed(1);
    console.log(`[timing] FETCH FAILED after ${tFail}ms -> ${path}`);
    throw new Error(`FETCH_FAILED @ ${path}: ${e.message || e}`);
  }

  // ✅ Got response headers back (network + server processing up to first byte)
  const tHeaders = nowMs();

  text = await r.text();

  // ✅ Finished reading body
  const tBody = nowMs();

  // --- your existing HTML detection ---
  if ((text || "").trim().startsWith("<!DOCTYPE html")) {
    console.log(`[timing] ${path} headers ${(tHeaders-t0).toFixed(1)}ms | body ${(tBody-tHeaders).toFixed(1)}ms | total ${(tBody-t0).toFixed(1)}ms`);
    throw new Error(
      "HIT_FRONTEND_HTML @ " + path +
      "\nYour apiBase is probably pointing to the Netlify site, not Render." +
      "\napiBase=" + base +
      "\n--- body (first 200 chars) ---\n" +
      text.slice(0, 200)
    );
  }

  let j = null;
  try { j = JSON.parse(text); } catch(e) {}

  if(!r.ok){
    console.log(`[timing] ${path} headers ${(tHeaders-t0).toFixed(1)}ms | body ${(tBody-tHeaders).toFixed(1)}ms | total ${(tBody-t0).toFixed(1)}ms`);
    throw new Error(`HTTP_${r.status} @ ${path}\n--- body ---\n${text.slice(0, 2000)}`);
  }

  if(!j){
    console.log(`[timing] ${path} headers ${(tHeaders-t0).toFixed(1)}ms | body ${(tBody-tHeaders).toFixed(1)}ms | total ${(tBody-t0).toFixed(1)}ms`);
    throw new Error(`NON_JSON_200 @ ${path}\n--- body ---\n${text.slice(0, 2000)}`);
  }

  // ✅ SUCCESS timing log
  console.log(
    `[timing] ${path} headers ${(tHeaders-t0).toFixed(1)}ms | body ${(tBody-tHeaders).toFixed(1)}ms | total ${(tBody-t0).toFixed(1)}ms`
  );

  return j;
}





const FREE_DAILY_RUN_LIMIT = 5;

/** Free plan: enough runs/day to explore and tweak inputs, not enough to
 *  exhaustively drill down. Returns false (and shows the upgrade modal)
 *  without incrementing if the day's quota is already used. */
function _checkModelRunLimit(){
  if (window._demoMode) return true;   // demo scenario runs freely (ad recording)
  if (isPro()) return true;
  const today = todayMonthStr() + '-' + String(new Date().getDate()).padStart(2, '0');
  if (!state.modelRunUsage || state.modelRunUsage.date !== today) {
    state.modelRunUsage = { date: today, count: 0 };
  }
  if (state.modelRunUsage.count >= FREE_DAILY_RUN_LIMIT) {
    showUpgradeModal(`Free plan is limited to ${FREE_DAILY_RUN_LIMIT} model runs per day. Upgrade for unlimited runs.`);
    return false;
  }
  state.modelRunUsage.count++;
  saveState();
  return true;
}

async function runModel(){
  if (!_checkModelRunLimit()) return;

  const runBtn = document.getElementById("btnRunModelBar");
  if(runBtn){ runBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" style="animation:spin .8s linear infinite"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2a5 5 0 110 10A5 5 0 018 3z" opacity=".3"/><path d="M8 1a7 7 0 017 7h-2a5 5 0 00-5-5V1z"/></svg> Running…'; runBtn.disabled = true; }
  _showChartSkeleton();

  // Inputs changed — projections cache is stale
  invalidateFireProjections();

  syncInputsFromUI();
  saveState();
  const base = (state.apiBase || "").replace(/\/+$/,"");
  if(!base){
    alert("Set API Base URL first.");
    return;
  }

  const payload = buildPayload();
  const payloadStr = JSON.stringify(payload);
  const fp = hashString(payloadStr);

  document.getElementById("lastRunMeta").textContent =
    `Running… | payload hash=${fp} | mode=${state.mode} | apiPath=${state.apiPath || "(auto)"}`;

  console.log("RUN payload hash:", fp, payload);

  const explicit = (state.apiPath || "").trim();

  const candidates = explicit
    ? [explicit.startsWith("/") ? explicit : ("/"+explicit)]
	: ["/fire", "/fire/", "/run", "/fire-model", "/model", "/run_fire_model", "/fire_model", "/calculate"];

  document.getElementById("rawOut").textContent = "Running…";
  document.getElementById("resultsMeta").textContent = "Running…";

  // Attach a real auth token (when signed in) so the server can enforce the
  // free-plan run cap per account — a client-only check can't survive
  // incognito mode or someone clearing localStorage.
  const idToken = window._fbGetIdToken ? await window._fbGetIdToken() : null;

  let result = null;
  let usedPath = null;
  let lastErr = null;

  for(const p of candidates){
    try{
      result = await callPath(base, p, payload, idToken);
      usedPath = p;
      break;
    }catch(e){
      lastErr = e;
      // 403 from the real endpoint means the server-side run quota was hit —
      // stop immediately instead of burning time on the other (wrong) guessed
      // candidate paths, and surface the quota message, not a generic failure.
      if (String(e.message || e).startsWith("HTTP_403")) {
        if(runBtn){ runBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M3 2l11 6-11 6V2z"/></svg> Run Model'; runBtn.disabled = false; }
        const detailMatch = String(e.message).match(/--- body ---\n([\s\S]*)/);
        let detailMsg = `Free plan is limited to ${FREE_DAILY_RUN_LIMIT} model runs per day. Upgrade for unlimited runs.`;
        if (detailMatch) {
          try { detailMsg = JSON.parse(detailMatch[1]).detail || detailMsg; } catch(_) {}
        }
        showUpgradeModal(detailMsg);
        return;
      }
    }
  }

  if(!result){
    // A failed model run doesn't necessarily mean the API is down (could be a
    // bad payload), so leave the dot alone here — only the ping or a success
    // should move it. But a successful run below is hard proof of health.
    document.getElementById("rawOut").textContent = String(lastErr || "Unknown error");
    document.getElementById("resultsMeta").textContent = "Run failed. See raw output.";
    if(runBtn){ runBtn.textContent = "Run Model"; runBtn.disabled = false; }
    _hideChartSkeleton();
    showTab("results");
    return;
  }

  // A successful /fire response is direct proof the API is healthy — the
  // dot can otherwise get stuck red forever from a one-shot cold-start ping
  // at page load that nothing ever re-checks.
  setApiStatus(true, "ok");

  // If FIRE not achieved within end_age, extend simulation until it is (up to age 90)
  const fireNotFound = (r) => !r || !r.rows || !r.rows.some(row => (row["FIRE_Eligible"] || 0) === 1);
  let fireExtended = false;
  let fireSearchEndAge = null;

  if (fireNotFound(result)) {
    const superAccess = state.inputs.super_access_age || 60;
    let searchEndAge = Math.max(state.inputs.end_age || 65, superAccess) + 5;
    const FIRE_SEARCH_MAX = 90;
    document.getElementById("resultsMeta").textContent = "Extending simulation to find FIRE age…";
    while (searchEndAge <= FIRE_SEARCH_MAX) {
      const extPayload = {
        ...buildPayload(),
        inputs: { ...normalizeInputs(state.inputs), end_age: searchEndAge }
      };
      try {
        const extResult = await callPath(base, usedPath, extPayload);
        if (!fireNotFound(extResult)) {
          result = extResult;
          fireExtended = true;
          fireSearchEndAge = searchEndAge;
          break;
        }
      } catch(e) { break; }
      searchEndAge += 5;
    }
  }

  // Response fingerprint (hash the raw JSON string we actually got back)
  const respText = result.__rawText ? result.__rawText : JSON.stringify(result);
  const respHash = hashString(respText);

  state.lastResult = result;
  saveState();

  const extNote = fireExtended ? ` | extended to age ${fireSearchEndAge} to find FIRE` : "";
  document.getElementById("lastRunMeta").textContent =
    `Last run: ${new Date().toLocaleString()} | endpoint=${usedPath} | payload=${fp} | response=${respHash} | mode=${result.mode}${extNote}`;

  console.log("RUN result endpoint:", usedPath);
  console.log("RUN response hash:", respHash);


  renderResults(result);
  showTab("results");
  if(runBtn){ runBtn.textContent = "Run Model"; runBtn.disabled = false; }
  _postRunRefresh();
  showSavePrompt();
}

function _postRunRefresh(){
  // Dashboard — FIRE card, stats, net-worth chart all depend on lastResult
  renderDashboard();
  // Property summary strip (equity, LVR)
  updatePropSummaryStrip();
  // CGT previews for any properties with a planned sale
  (state.property_list || []).forEach(p => {
    if (p.sale_date || p.sale_year) _renderCgtPreview(p.id);
  });
}

// Draw vertical marker lines: FIRE + property buy/sell events
const fireMarkerPlugin = {
  id: "fireMarker",
  afterDraw(chart, args, pluginOptions) {
    const { ctx, chartArea, scales } = chart;
    const xScale = scales.x;
    if (!xScale || !chartArea) return;

    // Helper: draw one vertical marker
    function drawMarker(idx, label, lineColor, boxBg, dashPattern, yOffset) {
      if (idx === null || idx === undefined || idx < 0) return;
      const x = xScale.getPixelForValue(idx);
      if (!Number.isFinite(x)) return;

      ctx.save();
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1.5;
      ctx.setLineDash(dashPattern || [4, 4]);
      ctx.beginPath();
      ctx.moveTo(x, chartArea.top);
      ctx.lineTo(x, chartArea.bottom);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.font = "600 11px ui-sans-serif, system-ui, -apple-system, Segoe UI";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      const padX = 6, boxH = 20;
      const textW = ctx.measureText(label).width;
      const boxW  = textW + padX * 2;
      const bx = Math.min(x + 6, chartArea.right - boxW);
      const by = chartArea.top + 8 + (yOffset || 0);

      ctx.fillStyle = boxBg || "rgba(0,0,0,.45)";
      ctx.strokeStyle = "rgba(255,255,255,.15)";
      ctx.lineWidth = 1;
      const r = 8;
      ctx.beginPath();
      ctx.moveTo(bx+r, by);
      ctx.arcTo(bx+boxW, by, bx+boxW, by+boxH, r);
      ctx.arcTo(bx+boxW, by+boxH, bx, by+boxH, r);
      ctx.arcTo(bx, by+boxH, bx, by, r);
      ctx.arcTo(bx, by, bx+boxW, by, r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,.92)";
      ctx.fillText(label, bx + padX, by + 4);
      ctx.restore();
    }

    // FIRE marker
    const fireIdx = pluginOptions?.index;
    const fireLabel = pluginOptions?.label || "FIRE";
    drawMarker(fireIdx, fireLabel, "rgba(28,28,26,.25)", "#151816", [4,4], 0);

    // Major event markers (property buy/sell, super access, age pension)
    if (_showEventMarkers) {
      const events = pluginOptions?.events || [];
      events.forEach((ev, i) => {
        drawMarker(ev.index, ev.label, ev.lineColor || ev.color, ev.boxBg || ev.color, [3,3], (i % 3) * 28 + 36);
      });
    }
  }
};

// Quiet marker for years with an Additional Stock Contribution override —
// just colors that year's tick label on both the Year (top) and Age
// (bottom) axes (no underline — it was drawing through the text).
const STOCK_OVERRIDE_COLOR = "#92400E";

/** ---------------------------
 *  Results rendering
 *  --------------------------*/
let chart = null;
let lastMetricsRegistry = [];
let _chartFullscreen = false;   // mobile landscape full-screen chart overlay

/* Chart loading skeleton — shown while a run is in flight. After ~7s (a
   likely Render cold-start) the note explains the one-off wait. */
let _chartSkeletonTimer = null;
function _showChartSkeleton(){
  const el = document.getElementById('chartSkeleton');
  const note = document.getElementById('chartSkeletonNote');
  if(!el) return;
  if(note) note.textContent = 'Modelling your projection…';
  el.hidden = false;
  clearTimeout(_chartSkeletonTimer);
  _chartSkeletonTimer = setTimeout(() => {
    if(note && !el.hidden) note.textContent = 'Waking the modelling engine — first run can take ~30s…';
  }, 7000);
}
function _hideChartSkeleton(){
  clearTimeout(_chartSkeletonTimer);
  const el = document.getElementById('chartSkeleton');
  if(el) el.hidden = true;
}

function renderResults(result){
  _hideChartSkeleton();
  document.getElementById("rawOut").textContent = JSON.stringify(result, null, 2);

  const rows = result.rows || [];
  const mode = result.mode || "yearly";
  const n = rows.length;

  const rowsBadge = document.getElementById("rowsBadge");
  rowsBadge.innerHTML = n
    ? `<span class="ok"></span><span>${n} rows returned (${escapeHtml(mode)}).</span>`
    : `<span class="no"></span><span>No rows returned.</span>`;

  document.getElementById("resultsMeta").textContent =
    n ? `Showing ${n} rows (${mode}).` : "No rows to display.";

  if(!n) return;

  const cols = result.columns || Object.keys(rows[0] || {});
  const last = rows[n-1];

  const yearKey  = findKey(cols, ["Year"]);
  const ageKey   = findKey(cols, ["Age"]);

	const fireEligibleKey = findKey(cols, ["FIRE_Eligible", "fire_eligible"]);
	let fireIndex = -1;
	
	if (fireEligibleKey) {
	  // first row where FIRE_Eligible becomes 1
	  fireIndex = rows.findIndex(r => toNumber(r[fireEligibleKey]) === 1);
}

	let fireLabel = "FIRE";
if (fireIndex >= 0) {
  const fireRow = rows[fireIndex];
  const fireAge = ageKey ? toNumber(fireRow[ageKey]) : null;

  // Use year label if available
  const fireYear = yearKey ? fireRow[yearKey] : null;

  if (Number.isFinite(fireAge) && fireAge > 0) {
    fireLabel = `FIRE @ ${fireAge.toFixed(1)}`;
  } else if (fireYear !== null && fireYear !== undefined) {
    fireLabel = `FIRE (${fireYear})`;
  }
}


  // Core keys
  const cashKey  = findKey(cols, ["Cash_Balance_End","Cumulative_Savings","Cash"]);
  const stockKey = findKey(cols, ["Stock_Balance_End","Total_Stock_Balance","Stocks"]);
  const superKey = findKey(cols, ["Super_Balance", "Super_Balance_End", "Super"]);

  // Prefer backend totals/net-worth if present
  const equityTotalKey   = findKey(cols, ["Property_Equity_Total","Total_Property_Equity","Total_Equity"]);
  const mortgageTotalKey = findKey(cols, ["Mortgage_Balance_Total","Total_Mortgage_Balance"]);
  const nwKey = findKey(cols, [
    "Net_Worth_Incl_PPOR",
    "Net_Worth_Ex_PPOR",
    "Net_Worth",
    "Net_Worth_Incl_Super_Incl_PPOR",
    "Net_Worth_Incl_Super_Ex_PPOR"
  ]);

	// Cashflow/FIRE keys (optional)
	const fireTargetKey = findKey(cols, [
	  "Fire_Target_Monthly",
	  "FIRE_Target_Monthly",
	  "Target_Monthly_Infl_Adj",
	  "FIRE_Target"
	]);
	
	// You only want FIRE income series (no passive income series)
	const fireIncomeKey = findKey(cols, [
	  "FIRE_Income_Monthly",
	  "Fire_Replacement_Cashflow_Monthly"
	]);

  // Debug series (optional)
  const netRentKey = findKey(cols, ["Total_Net_Rent","Total_Net_Rent_Monthly","Net_Rent_Total"]);
  const taxKey = findKey(cols, ["Tax_Paid","Tax_Payable_Paid","Tax_Payable","Tax Paid"]);

  // Property totals fallback using prefixes
  const propPrefixes = detectPropertyPrefixes(cols);
  renderPropertyChips(propPrefixes);






	
  // KPI end row
  const cashEnd   = getFirstNumber(last, [cashKey]);
  const stocksEnd = getFirstNumber(last, [stockKey]);
  const equityEnd = (equityTotalKey && Object.prototype.hasOwnProperty.call(last, equityTotalKey))
    ? toNumber(last[equityTotalKey])
    : computePropertyTotals(last, propPrefixes, cols).totalEquity;

  const netWorthEnd = (nwKey && Object.prototype.hasOwnProperty.call(last, nwKey))
    ? toNumber(last[nwKey])
    : (cashEnd + stocksEnd + equityEnd);

  document.getElementById("kpiCashEnd").textContent = fmtMoney(cashEnd);
  document.getElementById("kpiStocksEnd").textContent = fmtMoney(stocksEnd);
  document.getElementById("kpiEquityEnd").textContent = fmtMoney(equityEnd);
  document.getElementById("kpiNWEnd").textContent = fmtMoney(netWorthEnd);

  // FIRE banner
  const fireBanner = document.getElementById("fireBanner");
  const kpiFireAgeEl = document.getElementById("kpiFireAge");
  const fireBannerNote = document.getElementById("fireBannerNote");
  const fireBannerIcon = document.getElementById("fireBannerIcon");
  fireBanner.style.display = "block";
  if (fireIndex >= 0) {
    const fireRow = rows[fireIndex];
    const fireAge = ageKey ? toNumber(fireRow[ageKey]) : null;
    const fireYear = yearKey ? fireRow[yearKey] : null;
    fireBanner.classList.remove("not-achieved");
    fireBannerIcon.textContent = "🔥";
    const label = document.querySelector("#fireBanner .fire-banner-label");
    if (label) label.textContent = "FIRE achieved";
    kpiFireAgeEl.textContent = Number.isFinite(fireAge) && fireAge > 0
      ? `Age ${fireAge.toFixed(0)}`
      : (fireYear ? `Year ${fireYear}` : "—");
    fireBannerNote.textContent = "";
  } else {
    fireBanner.classList.add("not-achieved");
    fireBannerIcon.textContent = "—";
    const label = document.querySelector("#fireBanner .fire-banner-label");
    if (label) label.textContent = "FIRE status";
    kpiFireAgeEl.textContent = "Not achieved within simulation";
    fireBannerNote.textContent = "Try increasing end age or adjusting inputs.";
  }

  // Build labels + series
  const labels = rows.map(r => yearKey ? String(r[yearKey] ?? "") : "");
  const ageLabels = rows.map(r => ageKey ? String(r[ageKey] ?? "") : "");


  const seriesFromKey = (key) => rows.map(r => getFirstNumber(r, [key]));


// ✅ Always plot monthly units on the chart.
// If yearly backend gives an annual total, convert to monthly.
// const passiveIncomeSeries = fireIncomeProxyKey
//   ? seriesFromKey(fireIncomeProxyKey).map(v => {
//       return (fireIncomeProxyKey === "Passive_Income_Total") ? (v / 12) : v;
//     })
//   : null;

	
const cashDrawKey = findKey(cols, [
  "Cash_Drawdown_Monthly",   // NEW yearly “last month” metric
  "Cash_Drawdown_Paid",
  "Cash_Drawdown_Total"
]);


const cashDrawSeries = cashDrawKey
  ? seriesFromKey(cashDrawKey).map(v => (cashDrawKey === "Cash_Drawdown_Total" ? v / 12 : v))
  : null;

  const cashSeries   = seriesFromKey(cashKey);
  const stockSeries  = seriesFromKey(stockKey);
  const superSeries = superKey ? seriesFromKey(superKey) : null;

  const equitySeries = rows.map(r => {
    if (equityTotalKey && Object.prototype.hasOwnProperty.call(r, equityTotalKey)) return toNumber(r[equityTotalKey]);
    return computePropertyTotals(r, propPrefixes, cols).totalEquity;
  });

  const mortgageTotalSeries = propPrefixes.length ? rows.map(r => {
    if (mortgageTotalKey && Object.prototype.hasOwnProperty.call(r, mortgageTotalKey)) return toNumber(r[mortgageTotalKey]);
    return computePropertyTotals(r, propPrefixes, cols).totalMortgage;
  }) : null;

  const netWorthSeries = rows.map(r => {
    if (nwKey && Object.prototype.hasOwnProperty.call(r, nwKey)) return toNumber(r[nwKey]);
    const c = getFirstNumber(r, [cashKey]);
    const s = getFirstNumber(r, [stockKey]);
    const e = (equityTotalKey && Object.prototype.hasOwnProperty.call(r, equityTotalKey))
      ? toNumber(r[equityTotalKey])
      : computePropertyTotals(r, propPrefixes, cols).totalEquity;
    return c + s + e;
  });

  const fireTargetSeries = fireTargetKey ? seriesFromKey(fireTargetKey) : null;
  
  const netRentSeries = netRentKey
  ? seriesFromKey(netRentKey).map(v => {
      // Yearly mode returns annual net rent, so convert to monthly
      return (mode === "yearly" ? v / 12 : v);
    })
  : null;
  const taxSeries = taxKey
  ? seriesFromKey(taxKey).map(v => (mode === "yearly" ? v / 12 : v))
  : null;

	const fireIncomeSeries = fireIncomeKey ? seriesFromKey(fireIncomeKey) : null;
	
const fireIncomeWithCashSeries =
  (fireIncomeSeries && cashDrawSeries && fireIncomeSeries.length === cashDrawSeries.length)
    ? fireIncomeSeries.map((v, idx) => v + cashDrawSeries[idx])
    : null;


	
	const withdrawalsKey = findKey(cols, ["Withdrawals_Total","Withdrawals_Monthly"]);
	const withdrawalsSeries = withdrawalsKey
	  ? seriesFromKey(withdrawalsKey).map(v => (withdrawalsKey === "Withdrawals_Total" ? v / 12 : v))
	  : null;

	// Wealth needed for FIRE at each point: inflation-adjusted annual target / SWR
	const _swr = toNumber(state.inputs.stock_swr) || 0.04;
	const fireNumberSeries = (fireTargetSeries && _swr > 0)
	  ? fireTargetSeries.map(v => (v * 12) / _swr)
	  : null;

	// Flat line at today's actual net worth (equity + holdings) for context
	const _todayNW = _dashCurrentNW();
	const todayNWLineSeries = _todayNW > 0 ? rows.map(() => _todayNW) : null;


  // Registry of possible chart datasets
	// Registry of possible chart datasets
	const METRICS = [
	  // --- Balances (left axis)
	  { id:"netWorth",        label:"Net worth",               axis:"y",  data: netWorthSeries,        defaultOn:true,  group:"balances", order:1, color:"#059669", borderWidth:2.5 },
	  { id:"cash",            label:"Cash",                    axis:"y",  data: cashSeries,            defaultOn:false, group:"balances", order:2, color:"#6366F1" },
	  { id:"stocks",          label:"Stocks",                  axis:"y",  data: stockSeries,           defaultOn:false, group:"balances", order:3, color:"#F59E0B" },
	  ...(superSeries ? [{ id:"superBalance", label:"Super",   axis:"y",  data: superSeries,           defaultOn:false, group:"balances", order:4, color:"#8B5CF6" }] : []),

	  // --- Cashflow (right axis)
	  ...(fireTargetSeries      ? [{ id:"fireTarget",         label:"FIRE target",        axis:"y2", data: fireTargetSeries,       defaultOn:true,  group:"cashflow", order:1, color:"#E11D48" }] : []),
	  ...(fireIncomeSeries      ? [{ id:"fireIncome",         label:"FIRE income",        axis:"y2", data: fireIncomeSeries,       defaultOn:false, group:"cashflow", order:2, color:"#0EA5E9" }] : []),
	  ...(fireIncomeWithCashSeries ? [{ id:"fireIncomeWithCash", label:"FIRE income + cash", axis:"y2", data: fireIncomeWithCashSeries, defaultOn:true, group:"cashflow", order:3, color:"#14B8A6" }] : []),
	  ...(withdrawalsSeries     ? [{ id:"withdrawals",        label:"Withdrawals",        axis:"y2", data: withdrawalsSeries,      defaultOn:false, group:"cashflow", order:5, color:"#FB923C" }] : []),
	  ...(taxSeries             ? [{ id:"taxPaid",            label:"Tax paid",           axis:"y2", data: taxSeries,             defaultOn:false, group:"cashflow", order:6, color:"#94A3B8" }] : []),
	  ...(cashDrawSeries        ? [{ id:"cashDrawdown",       label:"Cash drawdown",      axis:"y2", data: cashDrawSeries,        defaultOn:false, group:"cashflow", order:7, color:"#EC4899" }] : []),

	  // --- Reference lines (left axis)
	  // FIRE Number = wealth needed at each point in time: the inflation-
	  // adjusted lifestyle target divided by the stock drawdown rate. Where
	  // Net worth crosses this line ≈ wealth-based FIRE.
	  ...(fireNumberSeries      ? [{ id:"fireNumberLine",  label:"FIRE Number (wealth needed)", axis:"y", data: fireNumberSeries, defaultOn:true,  group:"balances", order:6, color:"#DC2626", borderDash:[7,4], borderWidth:1.5 }] : []),
	  ...(todayNWLineSeries     ? [{ id:"todayNWLine",     label:"Today's net worth",           axis:"y", data: todayNWLineSeries, defaultOn:false, group:"balances", order:7, color:"#6A716B", borderDash:[3,3], borderWidth:1.5 }] : []),

	  // --- Properties combined (above per-property breakdown)
	  ...(propPrefixes.length   ? [{ id:"propertyEquity",  label:"Total equity",   axis:"y",  data: equitySeries,        defaultOn:false, group:"props-combined", order:1, color:"#F97316" }] : []),
	  ...(mortgageTotalSeries   ? [{ id:"totalMortgage",   label:"Total mortgage", axis:"y",  data: mortgageTotalSeries, defaultOn:false, group:"props-combined", order:2, color:"#C2410C" }] : []),
	  ...(netRentSeries         ? [{ id:"netRent",         label:"Net rent",       axis:"y2", data: netRentSeries,       defaultOn:false, group:"props-combined", order:3, color:"#84CC16" }] : []),
	];



  lastMetricsRegistry = METRICS;

  // Ensure toggle values exist (but keep user’s saved preferences)
  for(const m of METRICS){
    if(typeof state.chartToggles[m.id] !== "boolean"){
      state.chartToggles[m.id] = !!m.defaultOn;
    }
  }
  saveState();
  renderChartChips(METRICS);

const datasets = METRICS
  .filter(m => state.chartToggles[m.id])
  .map(m => ({
    label: m.label,
    data: m.data,
    yAxisID: m.axis,
    borderColor: m.color,
    backgroundColor: m.color + "28",
    pointBackgroundColor: m.color,
    borderWidth: m.borderWidth || 2,
    borderDash: m.borderDash || [],
    tension: .25,
    pointRadius: (mode === "monthly" ? 0 : 2),
    pointHoverRadius: (mode === "monthly" ? 2 : 4)
  }));

  
const subs = Array.isArray(state.selectedPropSublines) ? state.selectedPropSublines : [];

const mkPropDs = (data, yAxisID, spec) => ({
  data, yAxisID,
  borderColor:        spec.color,
  backgroundColor:    spec.color + "18",
  pointBorderColor:   spec.color,
  pointBackgroundColor: "#FFFFFF",
  pointBorderWidth:   1.5,
  borderDash:         spec.dash,
  borderWidth:        2,
  tension:            .25,
  pointRadius:        (mode === "monthly" ? 0 : 3),
  pointHoverRadius:   (mode === "monthly" ? 3 : 5),
});

propPrefixes.forEach((prefix, i) => {
  const family    = PROP_FAMILIES[i % PROP_FAMILIES.length];
  const valueCol  = propCol(prefix, "value", cols);
  const mortCol   = propCol(prefix, "mortgage", cols);
  const rentCol   = propCol(prefix, "netRentMonthly", cols);

  if(subs.includes(`${prefix}:equity`)){
    const equitySeriesP = rows.map(r => Math.max(getFirstNumber(r,[valueCol]) - getFirstNumber(r,[mortCol]), 0));
    datasets.push({ label:`${prefix} — Equity`, ...mkPropDs(equitySeriesP, "y", family.equity) });
  }
  if(subs.includes(`${prefix}:mortgage`)){
    const mortgageSeries = rows.map(r => getFirstNumber(r,[mortCol]));
    datasets.push({ label:`${prefix} — Mortgage`, ...mkPropDs(mortgageSeries, "y", family.mortgage) });
  }
  if(subs.includes(`${prefix}:netRent`)){
    const netRentSeriesP = rows.map(r => {
      const v = getFirstNumber(r,[rentCol]);
      return (mode === "yearly" ? v / 12 : v);
    });
    datasets.push({ label:`${prefix} — Net rent`, ...mkPropDs(netRentSeriesP, "y2", family.netRent) });
  }
});


  // Property buy/sell event markers for chart
  const propEventMarkers = [];
  const modelStartYear = yearKey ? toNumber(rows[0][yearKey]) : new Date().getFullYear();
  const BUY_COLORS  = ['#059669','#0891B2','#7C3AED','#DC2626'];
  const SELL_COLORS = ['#D97706','#EA580C','#BE185D','#4B5563'];
  (state.property_list || []).forEach((p, pi) => {
    const buyDate = p.purchase_date || `${p.year_bought || modelStartYear}-01`;
    const buyYr   = parseInt(buyDate.split('-')[0]);
    const alreadyOwned = buyYr < modelStartYear || (buyYr === modelStartYear);
    if (!alreadyOwned) {
      const idx = mode === 'yearly'
        ? rows.findIndex(r => toNumber(r[yearKey]) >= buyYr)
        : rows.findIndex(r => r['Date'] && r['Date'].startsWith(buyDate.slice(0,7)));
      if (idx >= 0) propEventMarkers.push({
        index: idx, label: `Buy ${p.name}`,
        color: BUY_COLORS[pi % BUY_COLORS.length] + 'AA',
        boxBg: BUY_COLORS[pi % BUY_COLORS.length]
      });
    }
    if (p.sale_date || p.sale_year) {
      const sellDate = p.sale_date || `${p.sale_year}-12`;
      const sellYr   = parseInt(sellDate.split('-')[0]);
      const idx = mode === 'yearly'
        ? rows.findIndex(r => toNumber(r[yearKey]) >= sellYr)
        : rows.findIndex(r => r['Date'] && r['Date'].startsWith(sellDate.slice(0,7)));
      if (idx >= 0) propEventMarkers.push({
        index: idx, label: `Sell ${p.name}`,
        color: SELL_COLORS[pi % SELL_COLORS.length] + 'AA',
        boxBg: SELL_COLORS[pi % SELL_COLORS.length]
      });
    }
  });

  // Super access and age pension milestones
  const currAge  = toNumber(state.inputs.current_age) || 30;
  const superAge = toNumber(state.inputs.super_access_age) || 60;
  const PENSION_AGE = 67;
  [
    [superAge,    `Super access (${superAge})`, '#0EA5E9AA', '#0369A1'],
    [PENSION_AGE, `Age pension (67)`,           '#A78BFAAA', '#6D28D9'],
  ].forEach(([age, lbl, lineC, boxC]) => {
    if (currAge >= age) return;
    const evYr = modelStartYear + (age - currAge);
    const idx  = mode === 'yearly'
      ? rows.findIndex(r => toNumber(r[yearKey]) >= evYr)
      : rows.findIndex(r => r['Date'] && parseInt(r['Date'].split('-')[0]) >= evYr);
    if (idx >= 0) propEventMarkers.push({ index: idx, label: lbl, color: lineC, boxBg: boxC });
  });

  // Life event markers (income/expense changes, windfalls)
  const LIFE_EVENT_COLORS = {
    income_change:  ['#059669AA', '#059669'],
    expense_change: ['#C0285AAA', '#C0285A'],
    windfall:       ['#8A6D1DAA', '#8A6D1D'],
  };
  (state.life_events || []).forEach(ev => {
    if (!ev.start) return;
    const idx = mode === 'yearly'
      ? rows.findIndex(r => toNumber(r[yearKey]) >= parseInt(ev.start.split('-')[0]))
      : rows.findIndex(r => r['Date'] && r['Date'].startsWith(ev.start));
    if (idx < 0) return;
    const [lineC, boxC] = LIFE_EVENT_COLORS[ev.type] || LIFE_EVENT_COLORS.windfall;
    propEventMarkers.push({ index: idx, label: ev.name || _lifeEventTypeLabel(ev.type), color: lineC, boxBg: boxC });
  });

  // Additional stock contribution years — marked via colored/underlined
  // axis tick labels (stockOverrideTickPlugin) rather than a chart pin.
  const stockOverrideIdxSet = new Set();
  (state.stock_contribution_overrides || []).forEach(o => {
    const idx = mode === 'yearly'
      ? rows.findIndex(r => toNumber(r[yearKey]) === o.year)
      : rows.findIndex(r => r['Date'] && r['Date'].startsWith(String(o.year)));
    if (idx >= 0) stockOverrideIdxSet.add(idx);
  });

  const ctx = document.getElementById("chartMain");
  if(chart){ chart.destroy(); chart = null; }

  chart = new Chart(ctx, {
    type: "line",
    data: {
	labels,
	datasets
	},
    plugins: [fireMarkerPlugin],
    options: {
	  locale: "en-US",
      responsive: true,
      // Full-screen overlay: fill the stage (definite height) rather than hold
      // an aspect ratio. Otherwise near-square on phones (legible multi-decade
      // projection), wide on desktop.
      maintainAspectRatio: _chartFullscreen ? false : true,
      aspectRatio: (window.innerWidth <= 640 ? 1.15 : 2.2),
      interaction: { mode: "index", intersect: false },
      onClick: (evt, elements, chartInstance) => {
        if (!_stockOverrideModeOn) return;
        // Clicking the line itself hits `elements` via index-mode hit-testing;
        // clicking a Year/Age tick label sits outside chartArea so `elements`
        // is empty there — fall back to nearest-pixel lookup on the x scale,
        // which works the same whether the click was top, bottom, or on the line.
        let idx = elements.length ? elements[0].index : null;
        if (idx == null) {
          const xScale = chartInstance.scales.x;
          if (!xScale) return;
          idx = Math.round(xScale.getValueForPixel(evt.x));
        }
        if (idx == null || idx < 0 || idx >= rows.length) return;
        const row = rows[idx];
        const year = row && yearKey ? parseInt(row[yearKey]) : null;
        if (year) openStockOverrideEditor(year);
      },
      plugins: {
        legend: { display: false }, // chips are the legend
        tooltip: {
          callbacks: {
            label: (c)=> `${c.dataset.label}: ${fmtMoney(c.parsed.y)}`
          }
        },		
      fireMarker: {
        index: fireIndex,
        label: fireLabel,
        color: "rgba(28,28,26,.25)",
        dash: [4, 4],
        lineWidth: 1.5,
        boxBg: "#151816",
        events: propEventMarkers
      }
      },
      scales: {
        x: {
			  position: "top",
			  ticks: {
				color: (c) => stockOverrideIdxSet.has(c.index) ? STOCK_OVERRIDE_COLOR : "#5A625D",
				font: (c) => ({ size: 11, weight: stockOverrideIdxSet.has(c.index) ? '700' : '400' })
			  },
			  grid: {
				color: "#F0EDE8"
			  }
			},
		xAge: {
			  position: "bottom",
			  labels: ageLabels,
			  ticks: {
				color: (c) => stockOverrideIdxSet.has(c.index) ? STOCK_OVERRIDE_COLOR : "#9A9590",
				font: (c) => ({ size: 11, weight: stockOverrideIdxSet.has(c.index) ? '700' : '400' })
			  },
			  grid: {
				drawOnChartArea: false
			  }
			},

		  y: {
			position: "left",
			title: { display: true, text: "Balance", color: "#9A9590", font:{ size:11, family:"var(--sans)" } },
			ticks:{ color:"#7A7770", font:{ size:11 }, callback:(v)=> moneyAxis(v) },
			grid:{ color:"#F0EDE8" }
		  },
		  y2: {
			position: "right",
			title: { display: true, text: "Cashflow", color: "#9A9590", font:{ size:11, family:"var(--sans)" } },
			ticks:{ color:"#7A7770", font:{ size:11 }, callback:(v)=> moneyAxis(v) },
			grid:{ drawOnChartArea:false }
		  }
      }
    }
  });

function renderMiniSummary(result){
  const wrap = document.getElementById("miniSummaryWrap");
  if(!wrap) return;

  const rows = result.rows || [];
  if(!rows.length){
    wrap.innerHTML = `<div style="padding:12px;" class="muted">No data yet.</div>`;
    return;
  }

  const cols = result.columns || Object.keys(rows[0] || {});
  const ageKey   = findKey(cols, ["Age"]);
  const cashKey  = findKey(cols, ["Cash_Balance_End","Cumulative_Savings","Cash"]);
  const stockKey = findKey(cols, ["Stock_Balance_End","Total_Stock_Balance","Stocks"]);
  const equityKey= findKey(cols, ["Property_Equity_Total","Total_Property_Equity"]);
  const nwKey    = findKey(cols, [
    "Net_Worth_Incl_PPOR","Net_Worth_Ex_PPOR","Net_Worth",
    "Net_Worth_Incl_Super_Incl_PPOR","Net_Worth_Incl_Super_Ex_PPOR"
  ]);
  const fireEligKey = findKey(cols, ["FIRE_Eligible","fire_eligible"]);
  const fireIdx = fireEligKey ? rows.findIndex(r => toNumber(r[fireEligKey]) === 1) : -1;

  const snap = (r) => {
    const cash   = getFirstNumber(r, [cashKey]);
    const stocks = getFirstNumber(r, [stockKey]);
    const equity = equityKey ? getFirstNumber(r, [equityKey]) : 0;
    const nw = (nwKey && r[nwKey] != null) ? toNumber(r[nwKey]) : (cash + stocks + equity);
    return { age: ageKey ? (r[ageKey] ?? "—") : "—", cash, stocks, equity, nw };
  };

  const first = snap(rows[0]);
  const last  = snap(rows[rows.length - 1]);
  const fire  = fireIdx >= 0 ? snap(rows[fireIdx]) : null;

  const col = (s, label, isFire) => `
    <div class="ms-col${isFire ? ' fire' : ''}">
      <div class="ms-col-label">${label}</div>
      <div class="ms-row"><span class="ms-label">Age</span><span class="ms-value">${s.age}</span></div>
      <div class="ms-row"><span class="ms-label">Cash</span><span class="ms-value">${fmtMoney(s.cash)}</span></div>
      <div class="ms-row"><span class="ms-label">Stocks</span><span class="ms-value">${fmtMoney(s.stocks)}</span></div>
      <div class="ms-row"><span class="ms-label">Prop. Equity</span><span class="ms-value">${fmtMoney(s.equity)}</span></div>
      <div class="ms-row"><span class="ms-label">Net Worth</span><span class="ms-value">${fmtMoney(s.nw)}</span></div>
    </div>`;

  const fireCol = fire
    ? col(fire, '🔥 FIRE', true)
    : `<div class="ms-col fire"><div class="ms-col-label">🔥 FIRE</div><div class="ms-row" style="color:var(--muted);font-size:12px;padding-top:4px;">Not achieved</div></div>`;

  wrap.innerHTML = `<div class="ms-grid">${col(first, 'Now', false)}${fireCol}${col(last, 'End', false)}</div>`;
}

renderMiniSummary(result);
renderAnalysisFlags({ rows, cols, fireIndex, cashKey });

  renderSummaryTable(result, propPrefixes);
  renderPropertyEndTable(last, propPrefixes);
  renderFullTable();
  renderScenarios(); // refresh save button visibility + comparison table
  renderScenCompareBar();
  if (_pinnedScenarios.size > 0) updateChartScenarios();
  // Refresh dashboard if it's the active tab
  if(document.getElementById('tab-dashboard')?.classList.contains('active')) renderDashboard();
  renderStockOverridePanel();
}


function renderAnalysisFlags({ rows, cols, fireIndex, cashKey }){
  const cashSeries = rows.map(r => getFirstNumber(r, [cashKey]));
  const minCash = Math.min(...cashSeries);

  if(minCash < 0 && _appEntered){
    showToast(
      "⚠ Cash goes negative",
      `Minimum cash balance: ${fmtMoney(minCash)}. Consider reducing expenses or increasing income.`,
      6000
    );
  }
  // No problem — stay silent
}


/** ---------------------------
 *  Chart chips + presets
 *  --------------------------*/
function renderChartChips(METRICS){
  const wrapBalances   = document.getElementById("chipsBalances");
  const wrapCashflow   = document.getElementById("chipsCashflow");
  const wrapPropCombo  = document.getElementById("chipsPropsCombo");
  const propCombinedGrp = document.getElementById("propCombinedGroup");

  // fallback (in case you forget HTML change)
  const fallback = document.getElementById("chartChips");

  const clear = (el) => { if(el) el.innerHTML = ""; };
  clear(wrapBalances); clear(wrapCashflow); clear(wrapPropCombo);
  if(fallback) fallback.innerHTML = "";

  const hasPropCombined = (METRICS || []).some(m => m.group === "props-combined");
  if(propCombinedGrp) propCombinedGrp.style.display = hasPropCombined ? "" : "none";

  const sorted = (METRICS || []).slice().sort((a,b) => {
    const ga = a.group || "other";
    const gb = b.group || "other";
    if (ga !== gb) return ga.localeCompare(gb);
    return (a.order || 999) - (b.order || 999);
  });

  sorted.forEach(m => {
    const chip = document.createElement("div");
    chip.className = "chip" + (state.chartToggles[m.id] ? " active" : "");
    if(m.color) chip.style.setProperty('--chip-accent', m.color);

    if(m.color){
      const dot = document.createElement("span");
      dot.className = "chip-dot";
      dot.style.background = m.color;
      chip.appendChild(dot);
    }
    chip.appendChild(document.createTextNode(m.label));

    chip.onclick = (e) => {
      e.preventDefault(); e.stopPropagation();
      const scrollY = window.scrollY;
      state.chartToggles[m.id] = !state.chartToggles[m.id];
      saveState();
      if(state.lastResult) renderResults(state.lastResult);
      window.scrollTo(0, scrollY);
    };

    if (m.group === "balances" && wrapBalances)             wrapBalances.appendChild(chip);
    else if (m.group === "cashflow" && wrapCashflow)         wrapCashflow.appendChild(chip);
    else if (m.group === "props-combined" && wrapPropCombo)  wrapPropCombo.appendChild(chip);
    else if (fallback)                                        fallback.appendChild(chip);
  });
}


function setChartPreset(which){
  const METRICS = lastMetricsRegistry || [];
  if(!METRICS.length){
    if(state.lastResult) renderResults(state.lastResult);
    return;
  }

  const ids = METRICS.map(m => m.id);

  if(which === "none"){
    for(const id of ids) state.chartToggles[id] = false;
  } else if(which === "all"){
    for(const id of ids) state.chartToggles[id] = true;
  } else {
    // key
    const keySet = new Set(["netWorth","cash","stocks","superBalance","propertyEquity","fireTarget","fireIncome","fireIncomeWithCash"]);
    for(const id of ids) state.chartToggles[id] = keySet.has(id);
  }

  saveState();
  if(state.lastResult) renderResults(state.lastResult);
}

const CHART_FILTER_CYCLE = ['key','balances','cashflow','all'];
const CHART_FILTER_LABELS = { key:'Key', balances:'Balances', cashflow:'Cashflow', all:'All' };

function cycleChartFilter(){
  const METRICS = lastMetricsRegistry || [];
  const current = state.chartFilterMode || 'key';
  const idx = CHART_FILTER_CYCLE.indexOf(current);
  const next = CHART_FILTER_CYCLE[(idx + 1) % CHART_FILTER_CYCLE.length];
  applyChartFilter(next, METRICS);
}

function applyChartFilter(mode, METRICS){
  state.chartFilterMode = mode;
  const ids = (METRICS || []).map(m => m.id);
  if(mode === 'all'){
    for(const id of ids) state.chartToggles[id] = true;
  } else if(mode === 'balances'){
    for(const m of (METRICS || [])) state.chartToggles[m.id] = m.group === 'balances' || m.group === 'props-combined';
  } else if(mode === 'cashflow'){
    for(const m of (METRICS || [])) state.chartToggles[m.id] = m.group === 'cashflow' || m.group === 'props-combined';
  } else {
    const keySet = new Set(["netWorth","cash","stocks","propertyEquity","fireTarget","fireIncome","fireIncomeWithCash"]);
    for(const id of ids) state.chartToggles[id] = keySet.has(id);
  }
  saveState();
  const btn = document.getElementById('chartFilterBtn');
  if(btn) btn.textContent = CHART_FILTER_LABELS[mode] || mode;
  if(state.lastResult) renderResults(state.lastResult);
}

function syncChartFilterBtn(){
  const btn = document.getElementById('chartFilterBtn');
  if(btn) btn.textContent = CHART_FILTER_LABELS[state.chartFilterMode || 'key'] || 'Key';
}

/** ---------------------------
 *  Summary + tables
 *  --------------------------*/
function renderSummaryTable(result, propPrefixes){
  const rows = result.rows || [];
  const cols = result.columns || (rows[0] ? Object.keys(rows[0]) : []);

  const yearKey   = findKey(cols, ["Year"]);
  const ageKey    = findKey(cols, ["Age"]);

  const salaryKey = findKey(cols, ["Salary_Annual", "Salary (Increase Inc.)", "Salary"]);
  const expKey    = findKey(cols, ["Expenses_Annual", "Living Expenses (Increase Inc.)", "Expenses"]);
  const taxKey    = findKey(cols, ["Tax_Paid","Tax_Payable_Paid","Tax_Payable","Tax Paid"]);
  const netRentKey= findKey(cols, ["Total_Net_Rent","Total_Net_Rent_Monthly","Total Net Rent"]);

  const cashKey   = findKey(cols, ["Cash_Balance_End","Cumulative_Savings","Cash"]);
  const stockKey  = findKey(cols, ["Stock_Balance_End","Total_Stock_Balance","Stocks"]);

  const propValueTotalKey = findKey(cols, ["Property_Value_Total", "Total_Property_Value"]);
  const mortBalTotalKey   = findKey(cols, ["Mortgage_Balance_Total", "Total_Mortgage_Balance"]);
  const equityTotalKey    = findKey(cols, ["Property_Equity_Total", "Total_Property_Equity"]);

  const nwKey = findKey(cols, [
    "Net_Worth_Incl_PPOR",
    "Net_Worth_Ex_PPOR",
    "Net_Worth",
    "Net_Worth_Incl_Super_Incl_PPOR",
    "Net_Worth_Incl_Super_Ex_PPOR"
  ]);

  const summaryRows = rows.map(r => {
    const cash   = getFirstNumber(r, [cashKey]);
    const stocks = getFirstNumber(r, [stockKey]);

    const computed = computePropertyTotals(r, propPrefixes, cols);

    const propValueTotal = (propValueTotalKey && Object.prototype.hasOwnProperty.call(r, propValueTotalKey))
      ? toNumber(r[propValueTotalKey])
      : computed.totalValue;

    const mortBalTotal = (mortBalTotalKey && Object.prototype.hasOwnProperty.call(r, mortBalTotalKey))
      ? toNumber(r[mortBalTotalKey])
      : computed.totalMortgage;

    const equityTotal = (equityTotalKey && Object.prototype.hasOwnProperty.call(r, equityTotalKey))
      ? toNumber(r[equityTotalKey])
      : Math.max(propValueTotal - mortBalTotal, 0);

    const netWorth = (nwKey && Object.prototype.hasOwnProperty.call(r, nwKey))
      ? toNumber(r[nwKey])
      : (cash + stocks + equityTotal);

    return {
      [(yearKey || "Year")]: yearKey ? (r[yearKey] ?? "") : "",
      [(ageKey  || "Age")]:  ageKey  ? (r[ageKey] ?? "")  : "",
      Salary_Annual: salaryKey ? (r[salaryKey] ?? "") : "",
      Expenses_Annual: expKey ? (r[expKey] ?? "") : "",
      Total_Net_Rent: netRentKey ? (r[netRentKey] ?? "") : "",
      Tax_Paid: taxKey ? (r[taxKey] ?? "") : "",
      Cash_End: cash,
      Stocks_End: stocks,
      Property_Value_Total: propValueTotal,
      Mortgage_Balance_Total: mortBalTotal,
      Property_Equity_Total: equityTotal,
      Net_Worth: netWorth
    };
  });

  const showCols = Object.keys(summaryRows[0] || {});
  document.getElementById("summaryTableWrap").innerHTML = buildTableHTML(summaryRows, showCols, {
    formatters: {
      Salary_Annual: fmtMoney,
      Expenses_Annual: fmtMoney,
      Total_Net_Rent: fmtMoney,
      Tax_Paid: fmtMoney,
      Cash_End: fmtMoney,
      Stocks_End: fmtMoney,
      Property_Value_Total: fmtMoney,
      Mortgage_Balance_Total: fmtMoney,
      Property_Equity_Total: fmtMoney,
      Net_Worth: fmtMoney
    },
    rightAlign: new Set([
      "Salary_Annual","Expenses_Annual","Total_Net_Rent","Tax_Paid",
      "Cash_End","Stocks_End","Property_Value_Total","Mortgage_Balance_Total",
      "Property_Equity_Total","Net_Worth"
    ])
  });
}

function renderPropertyEndTable(lastRow, propPrefixes){
  const colsAll = state.lastResult?.columns || Object.keys(lastRow || {});
  const rows = propPrefixes.map(prefix => {
    const snap = getPropertySnapshot(lastRow, prefix, colsAll);
    return {
      Property: prefix,
      Type: snap.isPPOR ? "PPOR" : "Investment",
      Property_Value: snap.value,
      Mortgage_Balance: snap.mortgage,
      Equity: snap.equity,
      Rent_Monthly: snap.rent,
      Net_Rent_Monthly: snap.netRent
    };
  });

  const cols = ["Property","Type","Property_Value","Mortgage_Balance","Equity","Rent_Monthly","Net_Rent_Monthly"];
  document.getElementById("propEndTableWrap").innerHTML = rows.length
    ? buildTableHTML(rows, cols, {
        formatters: {
          Property_Value: fmtMoney,
          Mortgage_Balance: fmtMoney,
          Equity: fmtMoney,
          Rent_Monthly: fmtMoney,
          Net_Rent_Monthly: fmtMoney
        },
        rightAlign: new Set(["Property_Value","Mortgage_Balance","Equity","Rent_Monthly","Net_Rent_Monthly"])
      })
    : `<div style="padding:12px;" class="muted">No property columns detected in the API output.</div>`;
}

function toggleFullTable(){
  const box = document.getElementById("fullTableBox");
  box.style.display = (box.style.display==="none") ? "block" : "none";
  if(box.style.display === "block") renderFullTable();
}

function renderFullTable(){
  const box = document.getElementById("fullTableWrap");
  const res = state.lastResult;
  if(!res || !(res.rows||[]).length){
    box.innerHTML = `<div style="padding:12px;" class="muted">No data yet.</div>`;
    return;
  }
  const q = (document.getElementById("tableSearch").value || "").toLowerCase().trim();
  const rows = res.rows || [];
  const cols = res.columns || Object.keys(rows[0]||{});

  let filtered = rows;
  if(q){
    filtered = rows.filter(r=>{
      for(const c of cols){
        if(String(c).toLowerCase().includes(q)) return true;
        const v = r[c];
        if(v !== null && v !== undefined && String(v).toLowerCase().includes(q)) return true;
      }
      return false;
    });
  }
  box.innerHTML = buildTableHTML(filtered.slice(0, 500), cols, {
    rightAlign: new Set(cols.filter(c=>/balance|value|income|tax|rent|salary|expenses|contribution|offset|mortgage|principal|interest|equity|worth/i.test(c)))
  }) + (filtered.length > 500 ? `<div class="small" style="padding:10px;">Showing first 500 rows of ${filtered.length}. Use Yearly mode or add search to narrow.</div>` : "");
}

/** ---------------------------
 *  CSV download
 *  --------------------------*/
function downloadLastCSV(){
  if (!isPro()) {
    showUpgradeModal('CSV export is a Pro feature. Upgrade to download your model results.');
    return;
  }
  const res = state.lastResult;
  if(!res || !res.rows || !res.rows.length){
    alert("No results to download yet.");
    return;
  }
  const cols = res.columns || Object.keys(res.rows[0]);
  const csv = toCSV(res.rows, cols);
  downloadText(csv, `fire_${res.mode || "result"}.csv`, "text/csv");
}
function toCSV(rows, cols){
  const esc = (s)=> `"${String(s ?? "").replace(/"/g,'""')}"`;
  const head = cols.map(esc).join(",");
  const body = rows.map(r => cols.map(c => esc(r[c])).join(",")).join("\n");
  return head + "\n" + body;
}
function downloadText(text, filename, type){
  const blob = new Blob([text], {type});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function syncInputsFromUI(){
  // Pull current values directly from the DOM so "Run" always uses what you see on screen
  for (const k of Object.keys(state.inputs)){
    const el = document.getElementById(k);
    if (!el) continue;
    // Boolean checkboxes
    if (el.type === 'checkbox'){
      state.inputs[k] = el.checked;
      continue;
    }
    // Only update if the field isn't blank
	const raw = String(el.value ?? "").trim();
	const meta = FIELD_META[k] || { type: "money" };
	if (raw !== "") state.inputs[k] = parseFromUI(raw, meta);


  }
  // Keep API fields in sync too
  const baseEl = document.getElementById("apiBase");
  const pathEl = document.getElementById("apiPath");
  if (baseEl) state.apiBase = baseEl.value.trim();
  if (pathEl) state.apiPath = pathEl.value.trim();

  saveState();
}

function stableStringify(obj){
  // stable-ish stringify for quick fingerprinting (good enough for debugging)
  return JSON.stringify(obj, Object.keys(obj).sort(), 0);
}

function hashString(s){
  // tiny non-crypto hash for fingerprints
  let h = 2166136261;
  for (let i = 0; i < s.length; i++){
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}


/** ---------------------------
 *  Utilities
 *  --------------------------*/
function resetDefaults(){
  localStorage.removeItem(LS_KEY);
  loadState();
  hydrateUI();
  alert("Defaults restored.");
}
function hydrateUI(){
  document.getElementById("apiBase").value = state.apiBase || "";
  document.getElementById("apiPath").value = state.apiPath || "";
  document.getElementById("modeSelect").value = state.mode || "yearly";
  setMode(state.mode || "yearly");
  applyCollapseState();

  // ✅ DO NOT do: el.value = state.inputs[k]
  // bindCoreInputs() + attachUnitInputBehavior already handles formatting + values.

  renderProperties();
  initInfoTips();
  pingAPI();

  if(state.lastResult){
    renderResults(state.lastResult);
    document.getElementById("lastRunMeta").textContent =
      `Last run loaded from browser storage (${new Date().toLocaleString()}).`;
  }
}

function toNumber(v){
  if (v === null || v === undefined) return 0;

  if (typeof v === "number") return Number.isFinite(v) ? v : 0;

  if (typeof v === "string") {
    const s = v.trim();
    if (!s || s === "—" || s === "-") return 0;

    const cleaned = s
      .replace(/[$€£¥]/g, "")
      .replace(/,/g, "")
      .replace(/\s+/g, "");

    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }

  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}




function formatForUI(value, meta){
  const n = Number(value);
  if (!meta || meta.type === "text") return String(value ?? "");
  if (meta.type === "int") return Number.isFinite(n) ? String(Math.round(n)) : "";
  if (meta.type === "money") return Number.isFinite(n) ? fmtMoney(n) : "";
  if (meta.type === "percent") return Number.isFinite(n) ? `${(n * 100).toFixed(2).replace(/\.00$/,"")}%` : "";
  return String(value ?? "");
}

function parseFromUI(str, meta){
  if (!meta || meta.type === "text") return String(str ?? "");

  const s = String(str ?? "").trim();
  if (!s) return 0;

  if (meta.type === "percent"){
    const cleaned = s.replace(/%/g,"").replace(/,/g,"").trim();
    const raw = Number(cleaned);
    if (!Number.isFinite(raw)) return 0;
    return (raw > 1) ? raw / 100 : raw;
  }

  const n = toNumber(s);
  return meta.type === "int" ? Math.round(n) : n;
}

/* Sensible ranges for assumption fields — values outside get a soft amber
   highlight (guidance only, never blocks input). Decimal form (0.025 = 2.5%). */
const RANGE_GUIDES = {
  inflation:               [0.015, 0.04],
  average_salary_increase: [0.02,  0.055],
  stock_growth:            [0.04,  0.10],
  stock_swr:               [0.025, 0.05],
  super_swr:               [0.025, 0.05],
  super_growth:            [0.04,  0.09],
  super_sg_rate:           [0.10,  0.13],
  cpi_rate:                [0.015, 0.035],
};

function applyRangeGuide(el, value){
  const range = RANGE_GUIDES[el.id];
  if (!range) return;
  const n = Number(value);
  el.classList.toggle("input-warn", Number.isFinite(n) && (n < range[0] || n > range[1]));
}

function attachUnitInputBehavior(el, meta, getVal, setVal){
  if (!el) return;

  el.value = formatForUI(getVal(), meta);
  applyRangeGuide(el, getVal());

  el.addEventListener("focus", () => {
    const v = getVal();
    if (meta?.type === "percent") el.value = String((Number(v) * 100).toFixed(4)).replace(/0+$/,"").replace(/\.$/,"");
    else el.value = String(v ?? "");
  });

  const commit = () => {
    const parsed = parseFromUI(el.value, meta);
    setVal(parsed);
    el.value = formatForUI(parsed, meta);
    applyRangeGuide(el, parsed);
    saveState();
  };

  el.addEventListener("blur", commit);
  el.addEventListener("change", commit);
}



const moneyFmt = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  currencyDisplay: "narrowSymbol", // usually "$" not "A$"
  maximumFractionDigits: 0
});

function fmtMoney(n){
  const x = Number(n);
  if(!Number.isFinite(x)) return "—";
  return moneyFmt
    .format(x)
    .replace(/^A\$/, "$")
    .replace(/^AU\$/, "$");
}



function moneyAxis(v){
  const x = Number(v);
  if(!Number.isFinite(x)) return v;
  if(Math.abs(x) >= 1_000_000) return (x/1_000_000).toFixed(1) + "m";
  if(Math.abs(x) >= 1_000) return (x/1_000).toFixed(0) + "k";
  return String(Math.round(x));
}
function escapeHtml(s){
  return String(s ?? "").replace(/[&<>"']/g, (m)=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]));
}

function findKey(cols, candidates){
  if(!Array.isArray(cols)) return null;

  for (const cand of candidates){
    if (cols.includes(cand)) return cand;
  }

  const lowerMap = new Map(cols.map(c => [String(c).toLowerCase(), c]));
  for (const cand of candidates){
    const hit = lowerMap.get(String(cand).toLowerCase());
    if (hit) return hit;
  }

  const colsLower = cols.map(c => String(c).toLowerCase());
  for (const cand of candidates){
    const needle = String(cand).toLowerCase();
    const idx = colsLower.findIndex(c => c.includes(needle));
    if (idx >= 0) return cols[idx];
  }

  return null;
}

function detectPropertyPrefixes(cols){
  const set = new Set();
  if(!Array.isArray(cols)) return [];

  const patterns = [
    /^(.+)_Property_Value$/i,
    /^(.+)_Property_Projected_Value$/i,
    /^(.+)_Mortgage_Balance$/i,
    /^(.+)_Mortgage_Balance_Projected$/i,
    /^(.+)_Property_Projected_Rental_Income$/i,
    /^(.+)_Rent_Income$/i
  ];

  cols.forEach(c=>{
    const s = String(c);
    for(const re of patterns){
      const m = s.match(re);
      if(m){ set.add(m[1]); break; }
    }
  });

  return Array.from(set);
}

function getFirstNumber(row, keys){
  for(const k of keys){
    if(!k) continue;
    if(Object.prototype.hasOwnProperty.call(row, k)) return toNumber(row[k]);
  }
  return 0;
}

function propCol(prefix, kind, cols){
  const candidatesByKind = {
    value: [
      `${prefix}_Property_Value`,
      `${prefix}_Property_Projected_Value`
    ],
    mortgage: [
      `${prefix}_Mortgage_Balance`,
      `${prefix}_Mortgage_Balance_Projected`
    ],
    rentMonthly: [
      `${prefix}_Rent_Income`,
      `${prefix}_Property_Projected_Rental_Income`
    ],
    netRentMonthly: [
      `${prefix}_Net_Rent`,
      `${prefix}_Net_Rent_Monthly`,
      `${prefix}_Property_Net_Rent`
    ],
    isPPOR: [
      `${prefix}_Is_PPOR`,
      `${prefix}_is_owner_occupied`,
      `${prefix}_Is_Owner_Occupied`
    ]
  };

  const cands = candidatesByKind[kind] || [];
  return findKey(cols, cands);
}

function getPropertySnapshot(row, prefix, cols){
  const valueKey   = propCol(prefix, "value", cols);
  const mortKey    = propCol(prefix, "mortgage", cols);
  const rentKey    = propCol(prefix, "rentMonthly", cols);
  const netRentKey = propCol(prefix, "netRentMonthly", cols);
  const isPPORKey  = propCol(prefix, "isPPOR", cols);

  const value = getFirstNumber(row, [valueKey]);
  const mortgage = getFirstNumber(row, [mortKey]);
  const equity = Math.max(value - mortgage, 0);

  const rent = getFirstNumber(row, [rentKey]);
  const netRent = getFirstNumber(row, [netRentKey]);

  const isPPOR = isPPORKey ? !!toNumber(row[isPPORKey]) : false;

  return { value, mortgage, equity, rent, netRent, isPPOR };
}

function seriesFromRowCalc(rows, fn){
  return rows.map(r => {
    const v = fn(r);
    return Number.isFinite(v) ? v : 0;
  });
}

function computePropertyTotals(row, propPrefixes, cols){
  let totalValue = 0, totalMortgage = 0;
  for(const prefix of propPrefixes){
    const snap = getPropertySnapshot(row, prefix, cols);
    totalValue += snap.value;
    totalMortgage += snap.mortgage;
  }
  return {
    totalValue,
    totalMortgage,
    totalEquity: Math.max(totalValue - totalMortgage, 0)
  };
}

function buildTableHTML(rows, cols, {formatters = {}, rightAlign = new Set()} = {}){
  if(!rows || !rows.length){
    return `<div style="padding:12px;" class="muted">No rows.</div>`;
  }
  const ths = cols.map(c=>`<th>${escapeHtml(c)}</th>`).join("");
  const tds = rows.map(r=>{
    const cells = cols.map(c=>{
      const v = r[c];
      const fmt = formatters[c];
      const out = fmt ? fmt(v) : (v ?? "");
      const cls = rightAlign.has(c) ? "right" : "";
      return `<td class="${cls}">${escapeHtml(out)}</td>`;
    }).join("");
    return `<tr>${cells}</tr>`;
  }).join("");
  return `<table><thead><tr>${ths}</tr></thead><tbody>${tds}</tbody></table>`;
}

/** ---------------------------
 *  Firebase Auth + Cloud Sync
 *  --------------------------*/
let _currentUser  = null;
let _syncTimer    = null;

// React to Firebase auth state (fired by the module script above)
window.addEventListener('fbAuthChange', async (e) => {
  clearTimeout(window._authFallback);
  const user = e.detail.user;
  _currentUser = user;
  _updateAuthHeader(user);
  if (user) {
    await _onFbLogin(user);
  } else {
    // Firebase confirmed no session — show landing page
    initLanding();
  }
});

async function _onFbLogin(user) {
  closeAuthModal();
  enterApp();
  try {
    const cloud = await window._fbLoad?.();
    if (cloud?.state) {
      localStorage.setItem(LS_KEY, JSON.stringify(cloud.state));
      loadState();
      bindCoreInputs();
      hydrateUI();
      renderDashboard();
      renderProperties();
      updatePropSummaryStrip();
      if (state.lastResult) renderResults(state.lastResult);
    } else {
      await window._fbSave?.(state);
    }
    _loadProStatus(cloud?.subscription);
    _updatePlanBadge();
    _setSyncStatus('saved');
    // Process Stripe checkout return — must run after user is confirmed logged in
    if (_pendingCheckoutSession) {
      const sid = _pendingCheckoutSession;
      _pendingCheckoutSession = null;
      // Skip onboarding check on checkout return — user is already set up
      _userProfile = cloud?.userProfile || _userProfile;
      await _handleCheckoutSuccess(sid);
    } else {
      _checkOnboarding(cloud?.userProfile);
      const name = cloud?.userProfile?.firstName || user.email.split('@')[0];
      showToast('Signed in', `Welcome back, ${name}`);
    }
  } catch(err) {
    console.error('Cloud load error:', err);
    _setSyncStatus('error');
  }
}

function _updateAuthHeader(user) {
  const btnIn  = document.getElementById('btnSignIn');
  const badge  = document.getElementById('userBadge');
  if (!btnIn || !badge) return;
  const landingSignIn = document.getElementById('landingSignInRow');
  if (user) {
    btnIn.style.display  = 'none';
    badge.style.display  = 'flex';
    document.getElementById('userInitial').textContent  = user.email[0].toUpperCase();
    document.getElementById('userMenuEmail').textContent = user.email;
    if (landingSignIn) landingSignIn.style.display = 'none';
  } else {
    btnIn.style.display  = '';
    badge.style.display  = 'none';
    if (landingSignIn) landingSignIn.style.display = 'flex';
  }
}

function _setSyncStatus(status) {
  const dot   = document.getElementById('syncDot');
  const label = document.getElementById('userMenuSync');
  if (!dot) return;
  dot.className = 'sync-dot' + (status === 'syncing' ? ' syncing' : status === 'error' ? ' error' : '');
  const txt = { saved:'Synced ✓', syncing:'Saving…', error:'Sync error — will retry', idle:'' };
  dot.title = txt[status] || '';
  if (label) label.textContent = txt[status] || '';
}

function _queueSync() {
  if (!_currentUser) return;
  _setSyncStatus('syncing');
  clearTimeout(_syncTimer);
  _syncTimer = setTimeout(async () => {
    try {
      await window._fbSave?.(state);
      _setSyncStatus('saved');
    } catch(err) {
      console.error('Sync error:', err);
      _setSyncStatus('error');
    }
  }, 2000);
}

// ---- Help modal ("How it works") ----
function openHelpModal() {
  renderHelpModalContent();
  document.getElementById('helpModal').style.display = 'flex';
}
function closeHelpModal() {
  const m = document.getElementById('helpModal');
  if (m) m.style.display = 'none';
}
function renderHelpModalContent() {
  const body = document.getElementById('helpModalBody');
  if (!body || body.dataset.rendered) return;
  body.dataset.rendered = '1';

  const tipBlock = (key) => {
    const t = INFO_TIPS[key];
    if (!t) return '';
    return `<p><strong>${escapeHtml(t.title)}</strong><br>${escapeHtml(t.body)}</p>`;
  };

  const sections = [
    {
      title: 'What this is',
      html: `<p>WealthModel runs a month-by-month simulation of your finances — salary, tax,
             expenses, mortgages, rent, shares and super — to find your <strong>FIRE age</strong>:
             the age your investments can fund your lifestyle without a salary.</p>`
    },
    {
      title: 'Step 1 — Set your inputs (2 min)',
      html: `<p>On the <strong>Model</strong> tab, click <strong>Edit Inputs</strong>.</p>
             <p><strong>About You</strong> — your age, and the age to model to. Set it past 60 so
             super drawdowns appear.</p>
             <p><strong>Income &amp; Spending</strong> — gross salary, annual living costs, and the
             <em>Target Lifestyle Income</em>: what you'd spend per year after retiring, in today's
             dollars. This one number defines your finish line, so get it right first.</p>
             <p><strong>Economic Assumptions / Stocks / Super</strong> — growth and inflation rates.
             Every field shows a recommended range underneath; values outside it get an amber
             highlight. When unsure, keep the defaults — they're set to sensible long-run figures.</p>`
    },
    {
      title: 'Step 2 — Add properties (if you have them)',
      html: `<p>In <strong>Portfolio → Properties</strong>, add your home and any investments with
             their loans, rent and running costs. Mark your home as PPOR (it's CGT-exempt and its
             rent is ignored). Planning to sell? Tick "Plan to sell" and CGT is calculated
             automatically. Future purchases work too — set the purchase date and the model saves
             the deposit until then.</p>`
    },
    {
      title: 'Step 3 — Run the model',
      html: `<p>Hit <strong>Run Model</strong>. The chart shows your net worth path, a 🔥 marker at
             your FIRE age, and toggleable lines (cash, stocks, super, property equity, cashflow).
             Click a chart year with "Additional Stock Contributions" switched on to add one-off
             amounts to specific years — bonuses, windfalls, tight years.</p>`
    },
    {
      title: 'Step 4 — Track reality (optional but powerful)',
      html: `<p>Log actual income/expenses monthly in <strong>Budget</strong> and asset values in
             <strong>Portfolio → Holdings</strong>. The <strong>Overview</strong> tab then compares
             your real savings rate and net worth against what the model assumed — so you can see
             if you're ahead or behind plan.</p>`
    },
    {
      title: 'Step 5 — Compare scenarios',
      html: `<p>Save your inputs as a named scenario ("Buy a home", "Rent &amp; invest"), change
             things, save again, and compare FIRE ages side-by-side on the chart. Free accounts
             save 1 scenario; Pro is unlimited.</p>`
    },
    {
      title: 'What moves the needle most',
      html: `<p>In rough order of impact:</p>
             <p>1. <strong>Savings rate</strong> — spending less both grows investments faster and
             shrinks the target. Nothing else comes close.<br>
             2. <strong>Target lifestyle income</strong> — every $10k/yr of retirement spending adds
             ~$250k to the wealth you need (at a 4% drawdown).<br>
             3. <strong>Investment returns</strong> — matter hugely over 20+ years, but you don't
             control them; be conservative.<br>
             4. <strong>Tax structure</strong> — salary sacrifice, negative gearing and CGT timing
             fine-tune the path rather than redraw it.</p>`
    },
    {
      title: 'Key concepts',
      tips: ['fire_number', 'savings_rate', 'swr', 'super_access', 'super_extra_tax', 'ppor', 'negative_gearing', 'offset', 'six_year_rule', 'cgt_pre2027', 'cgt_post2027']
    },
    {
      title: 'Free vs Pro',
      html: `<p>Free includes 1 property, 1 saved scenario, full projections, and 5 model runs
             per day. Pro unlocks unlimited properties, scenarios, and runs plus CSV export.
             Manage your plan anytime from the profile menu (top right).</p>`
    },
  ];

  let html = '';
  sections.forEach(sec => {
    html += `<h4>${escapeHtml(sec.title)}</h4>`;
    if (sec.html) html += sec.html;
    if (sec.tips) sec.tips.forEach(k => { html += tipBlock(k); });
  });
  body.innerHTML = html;
}

// ---- Auth modal UI ----
// ---- Legal modal (Privacy / Terms / Contact) ----
function openLegalModal(which) {
  document.getElementById('legalModal').style.display = 'flex';
  showLegalPanel(which || 'privacy');
}
function closeLegalModal() {
  const m = document.getElementById('legalModal');
  if (m) m.style.display = 'none';
}
function showLegalPanel(which) {
  const panels = { privacy: 'legalPanelPrivacy', terms: 'legalPanelTerms', method: 'legalPanelMethod', changes: 'legalPanelChanges', contact: 'legalPanelContact' };
  const tabs   = { privacy: 'legalTabPrivacy',   terms: 'legalTabTerms',   method: 'legalTabMethod',   changes: 'legalTabChanges',   contact: 'legalTabContact' };
  Object.keys(panels).forEach(k => {
    document.getElementById(panels[k]).style.display = (k === which) ? '' : 'none';
    document.getElementById(tabs[k]).classList.toggle('active', k === which);
  });
}

function openAuthModal() {
  document.getElementById('authModal').style.display = 'flex';
  setTimeout(() => document.getElementById('authEmail')?.focus(), 60);
}
function closeAuthModal() {
  const m = document.getElementById('authModal');
  if (m) m.style.display = 'none';
}
function authShowTab(tab) {
  document.getElementById('authPanelLogin').style.display    = tab === 'login'    ? '' : 'none';
  document.getElementById('authPanelRegister').style.display = tab === 'register' ? '' : 'none';
  document.getElementById('authTabLogin').classList.toggle('active',    tab === 'login');
  document.getElementById('authTabRegister').classList.toggle('active', tab === 'register');
}

async function authSignIn() {
  const email = document.getElementById('authEmail').value.trim();
  const pass  = document.getElementById('authPassword').value;
  const errEl = document.getElementById('authLoginError');
  const btn   = document.getElementById('authLoginBtn');
  errEl.className = 'auth-error err';
  errEl.textContent = '';
  if (!email || !pass) { errEl.textContent = 'Email and password required.'; return; }
  btn.disabled = true; btn.textContent = 'Signing in…';
  try {
    await window._fbSignIn(email, pass);
    window._logEvent?.('login', { method: 'password' });
  } catch(e) {
    errEl.textContent = _fbErrMsg(e);
  } finally {
    btn.disabled = false; btn.textContent = 'Sign in';
  }
}

async function authRegister() {
  const email = document.getElementById('authRegEmail').value.trim();
  const pass  = document.getElementById('authRegPassword').value;
  const errEl = document.getElementById('authRegisterError');
  const btn   = document.getElementById('authRegisterBtn');
  errEl.className = 'auth-error err';
  errEl.textContent = '';
  if (!email || !pass) { errEl.textContent = 'Email and password required.'; return; }
  btn.disabled = true; btn.textContent = 'Creating account…';
  try {
    await window._fbSignUp(email, pass);
    window._logEvent?.('sign_up', { method: 'password' });
  } catch(e) {
    errEl.textContent = _fbErrMsg(e);
  } finally {
    btn.disabled = false; btn.textContent = 'Create account';
  }
}

async function authSignOut() {
  toggleUserMenu(false);
  await window._fbSignOut?.();
  // Clear all local data then reload — ensures no stale in-memory state
  localStorage.removeItem(LS_KEY);
  localStorage.removeItem('wm_portfolio');
  localStorage.removeItem('wm_budget');
  localStorage.removeItem('wm_scenarios');
  window.location.reload();
}

async function authGoogleSignIn() {
  try {
    await window._fbGoogleIn();
    window._logEvent?.('login', { method: 'google' });
  } catch(e) {
    if (e.code !== 'auth/popup-closed-by-user') {
      showToast('Sign-in error', _fbErrMsg(e));
    }
  }
}

async function authForgotPassword() {
  const email = document.getElementById('authEmail').value.trim();
  const errEl = document.getElementById('authLoginError');
  if (!email) { errEl.className = 'auth-error err'; errEl.textContent = 'Enter your email above first.'; return; }
  try {
    await window._fbReset?.(email);
    errEl.className = 'auth-error ok';
    errEl.textContent = 'Reset email sent — check your inbox.';
  } catch(e) {
    errEl.className = 'auth-error err';
    errEl.textContent = _fbErrMsg(e);
  }
}

function toggleUserMenu(force) {
  const menu = document.getElementById('userMenu');
  if (!menu) return;
  menu.style.display = (force !== undefined ? force : menu.style.display === 'none') ? '' : 'none';
}

// Close user menu on outside click
document.addEventListener('click', (e) => {
  const badge = document.getElementById('userBadge');
  if (badge && !badge.contains(e.target)) toggleUserMenu(false);
});

// ---- Pro status ----
let _proStatus = false;
let _userProfile      = null;
let _billingCycle     = 'monthly';
let _subscriptionData = null;

function isPro(){ return _proStatus; }

function _loadProStatus(subscription) {
  _subscriptionData = subscription || null;
  _proStatus = (subscription?.tier === 'pro');
}

function _updatePlanBadge() {
  const tier   = document.getElementById('umpTier');
  const upLink = document.getElementById('umpUpgrade');
  if (!tier) return;
  if (_proStatus) {
    tier.textContent = 'Pro plan ✓';
    tier.className = 'ump-tier pro';
    if (upLink) upLink.style.display = 'none';
  } else {
    tier.textContent = 'Free plan';
    tier.className = 'ump-tier';
    if (upLink) upLink.style.display = '';
  }
}

// ---- Onboarding ----
function _checkOnboarding(userProfile) {
  _userProfile = userProfile;
  if (!userProfile) {
    // New user — show onboarding
    document.getElementById('onboardModal').style.display = 'flex';
  }
}

function onboardNext(step) {
  // Validate + advance
  if (step === 0) {
    const name  = document.getElementById('onFirstName').value.trim();
    const state = document.getElementById('onState').value;
    if (!name) { document.getElementById('onFirstName').focus(); return; }
    _userProfile = { ..._userProfile, firstName: name, state };
  } else if (step === 1) {
    const phone = document.getElementById('onPhone').value.trim();
    if (phone) _userProfile = { ..._userProfile, phone };
  }
  // Show next step
  document.getElementById(`onStep${step}`).classList.remove('active');
  document.getElementById(`onStep${step + 1}`).classList.add('active');
  document.getElementById(`onPip${step + 1}`).classList.add('done');
}

async function onboardComplete(plan) {
  document.getElementById('onboardModal').style.display = 'none';
  _userProfile = { ..._userProfile, createdAt: new Date().toISOString() };
  await window._fbSaveProfile?.(_userProfile);
  if (plan === 'pro') {
    showUpgradeModal('Choose your billing cycle to go Pro.');
  }
}

// ---- Upgrade modal ----
function showUpgradeModal(reason) {
  const el = document.getElementById('upgradeModal');
  const r  = document.getElementById('upgradeReason');
  if (r) { r.textContent = reason || ''; r.style.display = reason ? '' : 'none'; }
  setBilling('monthly');
  if (el) el.style.display = 'flex';
}
function closeUpgradeModal() {
  const el = document.getElementById('upgradeModal');
  if (el) el.style.display = 'none';
}

// ---- Profile modal ----
function openProfileModal() {
  const m = document.getElementById('profileModal');
  if (!m) return;
  document.getElementById('profFirstName').value = _userProfile?.firstName || '';
  document.getElementById('profPhone').value      = _userProfile?.phone     || '';
  document.getElementById('profEmail').value      = _currentUser?.email     || '';
  const isPro_ = isPro();
  document.getElementById('profPlanValue').textContent  = isPro_ ? 'Pro ✓' : 'Free';
  document.getElementById('profPlanValue').className    = 'profile-plan-value' + (isPro_ ? ' pro' : '');
  document.getElementById('profManageBtn').style.display  = isPro_ ? '' : 'none';
  document.getElementById('profUpgradeBtn').style.display = isPro_ ? 'none' : '';
  m.style.display = 'flex';
}
function closeProfileModal() {
  const m = document.getElementById('profileModal');
  if (m) m.style.display = 'none';
}
async function saveProfile() {
  const firstName = (document.getElementById('profFirstName').value || '').trim();
  const phone     = (document.getElementById('profPhone').value     || '').trim();
  if (!firstName) { document.getElementById('profFirstName').focus(); return; }
  _userProfile = { ..._userProfile, firstName, phone };
  await window._fbSaveProfile?.(_userProfile);
  closeProfileModal();
  showToast('Profile saved', 'Your details have been updated.');
}
async function manageSubscription() {
  const subId = _subscriptionData?.subscriptionId;
  if (!subId) { showToast('No subscription found', 'Contact support if this is unexpected.', 4000); return; }
  const btn = document.getElementById('profManageBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Loading…'; }
  try {
    const res  = await fetch(`${API_BASE}/stripe/customer-portal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription_id: subId,
        return_url: window.location.origin + window.location.pathname
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Could not open portal');
    window.location.href = data.url;
  } catch(e) {
    showToast('Error', e.message || 'Could not open subscription portal.', 4000);
    if (btn) { btn.disabled = false; btn.textContent = 'Manage subscription →'; }
  }
}

async function deleteAccount() {
  if (!_currentUser) return;
  if (!confirm('Delete your account and all WealthModel data permanently?\n\nThis cannot be undone.')) return;

  const btn = document.getElementById('profDeleteBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Deleting…'; }

  try {
    // Best-effort subscription cancellation — a Stripe-side failure here
    // shouldn't block deleting the account itself.
    const subId = _subscriptionData?.subscriptionId;
    if (subId) {
      try {
        await fetch(`${API_BASE}/stripe/cancel-subscription`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription_id: subId })
        });
      } catch(_) { /* best effort, proceed regardless */ }
    }

    // Delete the Firestore profile while still authenticated, then the
    // Auth user itself — order matters, since deleting the Auth user
    // first would invalidate the session before the Firestore delete
    // could satisfy its security rule.
    await window._fbDeleteProfile?.();
    await window._fbDeleteUser?.();

    localStorage.removeItem(LS_KEY);
    localStorage.removeItem('wm_portfolio');
    localStorage.removeItem('wm_budget');
    localStorage.removeItem('wm_scenarios');

    window.location.reload();
  } catch(e) {
    if (e.code === 'auth/requires-recent-login') {
      showToast('Please sign in again', 'For security, sign out and back in, then retry deleting your account.', 6000);
    } else {
      showToast('Error', e.message || 'Could not delete account. Contact support.', 5000);
    }
    if (btn) { btn.disabled = false; btn.textContent = 'Delete my account'; }
  }
}

function setBilling(cycle) {
  _billingCycle = cycle;
  document.getElementById('billMonthly').classList.toggle('active', cycle === 'monthly');
  document.getElementById('billAnnual').classList.toggle('active',  cycle === 'annual');
  const priceEl = document.getElementById('upgradePrice');
  const perEl   = document.getElementById('upgradePer');
  if (cycle === 'annual') {
    priceEl.innerHTML = '<sup>$</sup>50';
    perEl.textContent = '/ year — save $10';
  } else {
    priceEl.innerHTML = '<sup>$</sup>5';
    perEl.textContent = '/ month, billed monthly';
  }
}

const STRIPE_PRICES = {
  monthly: 'price_1Tlk4dDLV3KY5TYW7Ey5RyCG',
  annual:  'price_1Tlk4eDLV3KY5TYW3AIAAaa0'
};
const API_BASE = 'https://fire-api-wixz.onrender.com';

async function authStartCheckout() {
  if (!_currentUser) { closeUpgradeModal(); openAuthModal(); return; }
  const btn = document.getElementById('upgradeCheckoutBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Redirecting…'; }

  window._logEvent?.('begin_checkout', {
    currency: 'AUD',
    value:    _billingCycle === 'annual' ? 50 : 5,
    items:    [{ item_id: STRIPE_PRICES[_billingCycle], item_name: `Pro (${_billingCycle})` }]
  });

  // After 6s without a response, hint that the server is waking up (Render free tier)
  const hintTimer = setTimeout(() => {
    if (btn && btn.textContent === 'Redirecting…') btn.textContent = 'Waking server… (~30s)';
  }, 6000);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const res = await fetch(`${API_BASE}/stripe/create-checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        price_id:     STRIPE_PRICES[_billingCycle],
        email:        _currentUser.email,
        firebase_uid: _currentUser.uid,
        success_url:  window.location.origin + window.location.pathname,
        cancel_url:   window.location.origin + window.location.pathname
      })
    });
    clearTimeout(hintTimer);
    clearTimeout(timeout);
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error(data.detail || 'No checkout URL returned');
    }
  } catch(e) {
    clearTimeout(hintTimer);
    clearTimeout(timeout);
    const msg = e.name === 'AbortError'
      ? 'Server took too long — please try again.'
      : (e.message || 'Could not start checkout. Try again.');
    showToast('Checkout error', msg, 4000);
    if (btn) { btn.disabled = false; btn.textContent = 'Go Pro →'; }
  }
}

async function _handleCheckoutSuccess(sessionId) {
  try {
    const res  = await fetch(`${API_BASE}/stripe/verify-session?session_id=${sessionId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || `Server error ${res.status}`);
    if (data.paid) {
      // Optimistic local-only UI update — the Stripe webhook is the source
      // of truth and writes the real subscription doc server-side via the
      // Firebase Admin SDK. We never write subscription from the client.
      _loadProStatus({
        tier:              'pro',
        subscriptionId:    data.subscription_id,
        status:            data.subscription_status,
        currentPeriodEnd:  data.current_period_end
      });
      _updatePlanBadge();
      window._logEvent?.('purchase', {
        currency:      'AUD',
        value:         _billingCycle === 'annual' ? 50 : 5,
        transaction_id: sessionId
      });
      setTimeout(() => showToast('Welcome to Pro!', 'All features unlocked.', 6000), 800);
    }
  } catch(e) {
    console.error('Checkout verification failed:', e);
    showToast('Upgrade error', e.message || 'Could not verify payment. Contact support.', 5000);
  }
  // Clean up URL params
  window.history.replaceState({}, '', window.location.pathname);
}

// ---- Save prompt (anonymous users) ----
let _savePromptShown = false;
function showSavePrompt() {
  if (_currentUser || _savePromptShown) return;
  _savePromptShown = true;
  document.getElementById('savePrompt').style.display = 'flex';
}
function dismissSavePrompt() {
  document.getElementById('savePrompt').style.display = 'none';
}

function _fbErrMsg(e) {
  const map = {
    'auth/invalid-email':        'Invalid email address.',
    'auth/user-not-found':       'No account found with that email.',
    'auth/wrong-password':       'Incorrect password.',
    'auth/invalid-credential':   'Email or password is incorrect.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password':        'Password must be at least 6 characters.',
    'auth/too-many-requests':    'Too many attempts — try again later.',
  };
  return map[e.code] || e.message || 'Something went wrong.';
}

/** ---------------------------
 *  Init
 *  --------------------------*/
loadState();
// Capture checkout session before Firebase resolves; processed in _onFbLogin once user is ready
let _pendingCheckoutSession = null;
window.addEventListener("load", ()=>{
  const _sp = new URLSearchParams(window.location.search);
  if (_sp.get('checkout_success') === 'true') {
    _pendingCheckoutSession = _sp.get('session_id');
    // Clear params from URL without reload
    window.history.replaceState({}, '', window.location.pathname);
  }

  bindCoreInputs();
  hydrateUI();
  initIncomeTable();      // build income table once
  initExpenseTable();     // build expense table once

  // ── Demo mode (?demo=1): load a polished sample scenario for recording
  // ads/screenshots. Read-only (saveState is a no-op) so it never touches
  // the user's real data. Drops straight into the app and runs the model.
  if (_sp.get('demo') === '1') {
    _startDemoMode();
    return;
  }

  // Don't call initLanding() here — wait for fbAuthChange so signed-in users
  // go straight to the app. Fallback after 3s in case Firebase is slow.
  window._authFallback = setTimeout(() => initLanding(), 3000);
  // Re-lock any fields that were synced before page refresh
  if(state.syncModes){
    SYNC_FIELD_DEFS.forEach(def => {
      if(state.syncModes[def.key] === 'sync'){
        const el = document.getElementById(def.key);
        if(el) el.classList.add('input-synced');
      }
    });
  }
  // Render scenarios on load so the list is ready when you go to Model tab
  renderScenarios();
  // Render properties on load so the tab is populated on first visit
  renderProperties();
  updatePropSummaryStrip();
  // Render dashboard
  renderDashboard();
});

/* ====== RESULTS sub-tabs ====== */
function showResultsSubtab(name){
  const all = ["overview","charts","tables"];
  all.forEach(n => {
    document.getElementById(`subtab-${n}`)?.classList.toggle("active", n === name);
    const btnId = `btnSub${n.charAt(0).toUpperCase()+n.slice(1)}`;
    const btn = document.getElementById(btnId);
    if (btn){
      btn.classList.toggle("active", n === name);
      btn.setAttribute("aria-selected", String(n === name));
    }
  });
}

/* ====== Inputs Drawer ====== */
let _priorFocus = null;

function inputsMounts(){
  return {
    panel: document.getElementById("inputsPanel"),
    home: document.getElementById("inputsHomeMount"),
    drawer: document.getElementById("inputsDrawerMount"),
    drawerEl: document.getElementById("inputsDrawer"),
    backdrop: document.getElementById("inputsDrawerBackdrop"),
  };
}

function openInputsDrawer(){
  const { panel, drawer, drawerEl, backdrop } = inputsMounts();
  if(!panel || !drawer || !drawerEl || !backdrop) return;

  // Move panel into drawer (single source of truth – no duplicated inputs)
  if(panel.parentNode !== drawer) drawer.appendChild(panel);

  // Default inner tab
  showInputsPanel('core');

  drawerEl.classList.add("show");
  backdrop.hidden = false;
  setTimeout(()=>backdrop.classList.add("show"), 0);

  _priorFocus = document.activeElement;
  drawerEl.setAttribute("aria-hidden","false");
  drawerEl.querySelector("button, [href], input, select, textarea")?.focus();

  // Load data sources and render sync panel
  loadSyncData();

  // Wire info tooltips for drawer content
  initInfoTips();

  // Close on ESC / backdrop
  document.addEventListener("keydown", handleDrawerEsc, { once:false });
  backdrop.addEventListener("click", closeInputsDrawer, { once:true });
}

function closeInputsDrawer(){
  const { panel, home, drawerEl, backdrop } = inputsMounts();
  if(!panel || !home || !drawerEl || !backdrop) return;

  drawerEl.classList.remove("show");
  drawerEl.setAttribute("aria-hidden","true");
  backdrop.classList.remove("show");
  setTimeout(()=>{ backdrop.hidden = true; }, 200);

  document.removeEventListener("keydown", handleDrawerEsc);
  if(_priorFocus && typeof _priorFocus.focus === "function") {
    try{ _priorFocus.focus(); }catch(e){}
  }
  // Back to the dock on a wide Model screen, else the hidden home mount
  placeInputsPanel();
}

function handleDrawerEsc(e){
  if(e.key === "Escape") closeInputsDrawer();
}

/* Ensure panel is put back in Inputs when switching top-level tabs */
function ensureInputsAtHome(){
  const { panel, home } = inputsMounts();
  if(panel && home && panel.parentNode !== home){
    home.appendChild(panel);
  }
}

/* ── Docked inputs (desktop Model page) ──
   ≥1100px on the Model tab, the inputs panel lives in a permanent side dock
   next to the results, so changing an assumption and watching the FIRE age
   move is one visible loop. Below 1100px (and on other tabs) the panel parks
   in its hidden home mount and opens via the slide-over drawer as before. */
function _dockWanted(){
  return window.innerWidth >= 1100 &&
         document.getElementById('tab-results')?.classList.contains('active');
}

/** Put the inputs panel wherever it currently belongs (dock / home). */
function placeInputsPanel(){
  const { panel, home } = inputsMounts();
  const dockMount = document.getElementById('inputsDockMount');
  if(!panel) return;
  // never yank it out from under an open drawer
  if(document.getElementById('inputsDrawer')?.classList.contains('show')) return;
  if(_dockWanted() && dockMount){
    if(panel.parentNode !== dockMount){
      dockMount.appendChild(panel);
      showInputsPanel(_currentInputsPanel);
      loadSyncData();
      initInfoTips();
      _initAutoRunToggle();
    }
  } else if(home && panel.parentNode !== home){
    home.appendChild(panel);
  }
}

// Re-place when the viewport crosses the breakpoint
window.addEventListener('resize', () => {
  clearTimeout(window._dockResizeT);
  window._dockResizeT = setTimeout(placeInputsPanel, 150);
});

/* ── Auto-run: debounce a model run after any docked-input change ── */
let _autoRunTimer = null;
function setAutoRun(on){
  state.autoRunModel = !!on;
  saveState();
  const t = document.getElementById('autoRunToggle');
  if(t) t.checked = !!on;
}
function _initAutoRunToggle(){
  const t = document.getElementById('autoRunToggle');
  if(t) t.checked = !!state.autoRunModel;
}
document.addEventListener('change', (e) => {
  if(!state.autoRunModel) return;
  const panel = document.getElementById('inputsPanel');
  if(!panel || !panel.contains(e.target)) return;
  if(!document.getElementById('tab-results')?.classList.contains('active')) return;
  clearTimeout(_autoRunTimer);
  _autoRunTimer = setTimeout(() => runModel(), 900);
});

/* Wrap your original showTab to also restore the panel when leaving Results */
/* Highlight the right bottom-tab for the current screen. Deferred a tick so
   the portfolio sub-tab (_portSubTab) is already updated when we read it. */
function _syncMobileTabbar(name){
  setTimeout(() => {
    let key = name;
    if (name === 'portfolio') key = (typeof _portSubTab !== 'undefined' && _portSubTab === 'properties') ? 'properties' : 'holdings';
    document.querySelectorAll('.mobile-tabbar .mtab').forEach(b => {
      b.classList.toggle('active', b.dataset.mtab === key);
    });
  }, 0);
}

const _origShowTab = showTab;
showTab = function(name){
  ensureInputsAtHome();
  _origShowTab(name);
  _syncMobileTabbar(name);
  const modelActions = document.getElementById('modelActionsBar');
  const wrap = document.querySelector('.wrap');
  if(modelActions) {
    if(name === 'results') {
      modelActions.style.display = 'flex';
      document.body.classList.add('has-action-bar');
      document.documentElement.style.setProperty('--bar-height', modelActions.offsetHeight + 'px');
      _syncActionBarPosition();
    } else {
      modelActions.style.display = 'none';
      document.body.classList.remove('has-action-bar');
    }
  }
  // On the Model tab (desktop width) the inputs panel docks beside the results
  placeInputsPanel();
};

/* ═══════════════════════════════════════════════════════
   TOOLS TAB — standalone calculators (no login / model needed)
   ═══════════════════════════════════════════════════════ */

/* Tool router: a home grid + a dropdown switch between calculators. */
/** Collapse the nav hover-menu after a pick — the pointer is still over it, so
 *  CSS :hover would keep it open. Cleared on mouseleave (see .nav-dd markup). */
function _closeNavDD(){
  document.querySelector('.nav-dd')?.classList.add('dd-closed');
  if(document.activeElement?.closest?.('.nav-dd')) document.activeElement.blur();
}
function showToolsTab(){
  _closeNavDD();
  showTab('tools');
  document.getElementById('btnTools')?.classList.add('active');
  showToolsHome();
}
function showToolsHome(){
  document.querySelectorAll('#tab-tools .tool-panel').forEach(p => p.hidden = true);
  const home = document.getElementById('toolsHome'); if(home) home.hidden = false;
  const tb = document.getElementById('toolsTopbar'); if(tb) tb.hidden = true;
}
function showTool(name){
  _closeNavDD();
  // Reachable straight from the nav dropdown while another tab is showing, so
  // always activate the Tools tab first — not just swap the inner panel.
  showTab('tools');
  document.getElementById('btnTools')?.classList.add('active');
  const home = document.getElementById('toolsHome'); if(home) home.hidden = true;
  document.querySelectorAll('#tab-tools .tool-panel').forEach(p => p.hidden = (p.id !== 'tool-' + name));
  const tb = document.getElementById('toolsTopbar'); if(tb) tb.hidden = false;
  if(name === 'property')      calcPropertyNetCost();
  else if(name === 'borrowing') calcBorrowing();
  else if(name === 'offset')    calcOffsetImpact();
  else if(name === 'rentbuy')   calcRentBuy();
  initInfoTips();
  try { window.scrollTo({ top:0, behavior:'smooth' }); } catch(_){}
}

/* ── Sliders ───────────────────────────────────────────────────────────────
   Each range carries data-for="<textInputId>". Dragging writes the value into
   the text box and re-runs that panel's calculator; typing in the box pushes the
   value back to the slider via _toolSyncSliders() at the end of each calc. */
function toolSlider(el){
  const t = document.getElementById(el.dataset.for);
  if(!t) return;
  const v = Number(el.value);
  t.value = el.dataset.fmt === 'money' ? v.toLocaleString() : String(v);
  const panel = el.closest('.tool-panel')?.id;
  if(panel === 'tool-property')       calcPropertyNetCost();
  else if(panel === 'tool-borrowing') calcBorrowing();
  else if(panel === 'tool-offset')    calcOffsetImpact();
  else if(panel === 'tool-rentbuy')   calcRentBuy();
}
/** Push current text-input values back onto their sliders (clamped to range). */
function _toolSyncSliders(panelId){
  document.querySelectorAll(`#${panelId} input[type="range"][data-for]`).forEach(s => {
    const t = document.getElementById(s.dataset.for);
    if(!t) return;
    const v = parseFloat(String(t.value).replace(/[,$%\s]/g,''));
    if(!isNaN(v)) s.value = Math.min(Math.max(v, Number(s.min)), Number(s.max));
  });
}

/* Shared render helpers for the tool result panels. */
function _toolMoney(v){ return (v < 0 ? '−' : '') + '$' + Math.abs(Math.round(v)).toLocaleString(); }
function _toolNum(id){ const v = parseFloat(String(document.getElementById(id)?.value || '').replace(/[,$%\s]/g,'')); return isNaN(v) ? 0 : v; }
function _toolRow(label, val, opts={}){
  const v = opts.sign === false ? _toolMoney(val)
          : (val >= 0 ? '+' : '−') + '$' + Math.abs(Math.round(val)).toLocaleString();
  return `<div class="pnc-line ${opts.cls||''}"><span class="pnc-line-lbl">${label}${opts.note?` <em>${opts.note}</em>`:''}</span><span class="pnc-line-val">${v}</span></div>`;
}

/* ── Stamp duty (transfer duty) — indicative current AU rates ─────────────
   Tiered tables: duty = base + (value − min) × rate for the top bracket that
   applies. VIC (flat tiers) and NT (formula) are special-cased. FHB concessions
   applied for NSW/VIC/QLD (the clearest); other states get a caveat note. */
const _DUTY_TABLE = {
  // NSW brackets are CPI-indexed each 1 July — these are the 2025-26 schedule
  // (premium tier $3.721M @ 7% per Revenue NSW).
  NSW:[{min:0,base:0,rate:0.0125},{min:17000,base:212,rate:0.015},{min:37000,base:512,rate:0.0175},{min:99000,base:1597,rate:0.035},{min:372000,base:11152,rate:0.045},{min:1240000,base:50212,rate:0.055},{min:3721000,base:186667,rate:0.07}],
  QLD:[{min:0,base:0,rate:0},{min:5000,base:0,rate:0.015},{min:75000,base:1050,rate:0.035},{min:540000,base:17325,rate:0.045},{min:1000000,base:38025,rate:0.0575}],
  WA: [{min:0,base:0,rate:0.019},{min:120000,base:2280,rate:0.0285},{min:150000,base:3135,rate:0.038},{min:360000,base:11115,rate:0.0475},{min:725000,base:28453,rate:0.0515}],
  SA: [{min:0,base:0,rate:0.01},{min:12000,base:120,rate:0.02},{min:30000,base:480,rate:0.03},{min:50000,base:1080,rate:0.035},{min:100000,base:2830,rate:0.04},{min:200000,base:6830,rate:0.0475},{min:250000,base:9205,rate:0.05},{min:300000,base:11705,rate:0.055}],
  TAS:[{min:0,base:50,rate:0},{min:3000,base:50,rate:0.0175},{min:25000,base:435,rate:0.0225},{min:75000,base:1560,rate:0.035},{min:200000,base:5935,rate:0.04},{min:375000,base:12935,rate:0.0425},{min:725000,base:27810,rate:0.045}],
  ACT:[{min:0,base:0,rate:0.0049},{min:200000,base:980,rate:0.022},{min:300000,base:3180,rate:0.034},{min:500000,base:9980,rate:0.0432},{min:750000,base:20780,rate:0.059},{min:1000000,base:35530,rate:0.0454}]
};
function _dutyTiered(v, table){
  let b = table[0];
  for(const t of table){ if(v >= t.min) b = t; else break; }
  return b.base + (v - b.min) * b.rate;
}
function _dutyVIC(v){
  if(v <= 25000)   return v * 0.014;
  if(v <= 130000)  return 350 + (v - 25000) * 0.024;
  if(v <= 960000)  return 2870 + (v - 130000) * 0.06;
  if(v <= 2000000) return v * 0.055;                 // flat
  return 110000 + (v - 2000000) * 0.065;
}
function _dutyNT(v){
  const V = v / 1000;
  if(v <= 525000) return 0.06571441 * V * V + 15 * V;
  if(v <= 3000000) return v * 0.0495;
  if(v <= 5000000) return v * 0.0575;
  return v * 0.0595;
}
function stampDuty(value, state, fhb){
  if(value <= 0) return { duty:0, note:'' };
  let duty = state === 'VIC' ? _dutyVIC(value)
           : state === 'NT'  ? _dutyNT(value)
           : _dutyTiered(value, _DUTY_TABLE[state] || _DUTY_TABLE.NSW);
  duty = Math.max(0, duty);
  let note = '';
  if(fhb){
    const conc = (exempt, top) => {
      if(value <= exempt){ duty = 0; note = `first-home exempt (≤$${(exempt/1000)}k)`; }
      else if(value < top){ duty = Math.round(duty * (1 - (top - value) / (top - exempt))); note = 'first-home concession'; }
      else note = 'above first-home threshold';
    };
    if(state === 'NSW')      conc(800000, 1000000);
    else if(state === 'VIC') conc(600000, 750000);
    else if(state === 'QLD') conc(700000, 800000);
    else note = 'first-home concessions may apply — check your state';
  }
  return { duty: Math.round(duty), note };
}

/* ── Borrowing power & stamp duty ───────────────────────────────────────── */
function calcBorrowing(){
  const salary = _toolNum('bp_salary');
  const hasP   = !!document.getElementById('bp_partner_toggle')?.checked;
  const pSalary = hasP ? _toolNum('bp_partner_salary') : 0;
  const pw = document.getElementById('bp_partner_wrap'); if(pw) pw.hidden = !hasP;
  const deps   = _toolNum('bp_deps');
  const debts  = _toolNum('bp_debts');            // monthly
  const cards  = _toolNum('bp_cards');
  const rate   = _toolNum('bp_rate') / 100;
  const term   = _toolNum('bp_term') || 30;
  const deposit = _toolNum('bp_deposit');
  const state  = document.getElementById('bp_state')?.value || 'NSW';
  const fhb    = !!document.getElementById('bp_fhb')?.checked;

  const netMonthly = (calcTax(salary, TAX_SETTINGS).net + (pSalary > 0 ? calcTax(pSalary, TAX_SETTINGS).net : 0)) / 12;
  const expRaw = (document.getElementById('bp_expenses')?.value || '').trim();
  const estLiving = (hasP ? 3200 : 2200) + deps * 450;   // rough HEM-style monthly
  const living = expRaw !== '' ? _toolNum('bp_expenses') : estLiving;
  const cardCommit = cards * 0.038;                       // ~3.8%/mo of the limit
  const surplus = Math.max(0, netMonthly - living - debts - cardCommit);

  const n = term * 12;
  // Max loan the surplus services at a given rate, assessed at rate + 3% buffer.
  const maxLoanAt = rt => {
    const a = (rt + 0.03) / 12;
    return a > 0 ? surplus * (1 - Math.pow(1 + a, -n)) / a : surplus * n;
  };
  const maxLoan = maxLoanAt(rate);
  const BP25 = 0.0025;                                     // the RBA moves in 25bp steps
  const dropPer25 = Math.max(0, maxLoan - maxLoanAt(rate + BP25));

  const otherCosts = 3000;                                // legals + inspections (rough)
  let price = deposit + maxLoan;
  for(let i = 0; i < 5; i++){ const d = stampDuty(price, state, fhb).duty; price = Math.max(0, deposit + maxLoan - d - otherCosts); }
  const duty = stampDuty(price, state, fhb);

  const realR = rate / 12;
  const realRepay = maxLoan > 0 && realR > 0 ? maxLoan * realR / (1 - Math.pow(1 + realR, -n)) : 0;
  const lvr = price > 0 ? maxLoan / price : 0;
  // LMI estimate: typical insurer premium bands by LVR (~1.1% of the loan at
  // 80–85%, ~1.9% at 85–90%, ~3.7% at 90–95%) — indicative midpoints; the
  // real premium also scales a little with loan size and lender.
  let lmiEst = 0;
  if(lvr > 0.8) lmiEst = maxLoan * (lvr <= 0.85 ? 0.011 : lvr <= 0.90 ? 0.019 : lvr <= 0.95 ? 0.037 : 0.048);

  const out = document.getElementById('bpResults'); if(!out) return;
  out.innerHTML = `
    <div class="pnc-headline gain">
      <div class="pnc-head-lbl">You could borrow up to</div>
      <div class="pnc-head-nums">
        <div><b>${_toolMoney(maxLoan)}</b><span>home loan</span></div>
        <div><b>${_toolMoney(price)}</b><span>purchase price</span></div>
      </div>
      <div class="pnc-head-sub">with your ${_toolMoney(deposit)} deposit, in ${state}</div>
    </div>
    <div class="pnc-break">
      <div class="pnc-break-hd">How a lender sees it — per month</div>
      ${_toolRow('Net income (after tax)', netMonthly)}
      ${_toolRow('Living expenses', -living, {note: expRaw === '' ? 'estimated' : ''})}
      ${debts > 0 ? _toolRow('Other loan repayments', -debts) : ''}
      ${cards > 0 ? _toolRow('Credit cards', -cardCommit, {note:'3.8% of limit'}) : ''}
      <div class="pnc-line total"><span class="pnc-line-lbl">Left for repayments</span><span class="pnc-line-val">${_toolMoney(surplus)}</span></div>
      <div class="pnc-line"><span class="pnc-line-lbl">Actual repayment on max loan</span><span class="pnc-line-val">${_toolMoney(realRepay)}/mo</span></div>
    </div>
    <div class="pnc-break">
      <div class="pnc-break-hd">Upfront costs in ${state}</div>
      ${_toolRow('Stamp duty', -duty.duty, duty.note ? {note:duty.note} : {})}
      ${_toolRow('Legal, inspection, etc.', -otherCosts)}
      ${_toolRow('Your deposit', deposit)}
    </div>
    ${dropPer25 > 0 ? `<div class="pnc-offset-note"><span class="pnc-offset-ico">📉</span><span>Every <b>0.25%</b> rate rise cuts what you can borrow by about <b>${_toolMoney(dropPer25)}</b> — a single RBA move. A 1% run of hikes would take roughly <b>${_toolMoney(maxLoan - maxLoanAt(rate + 0.01))}</b> off it.</span></div>` : ''}
    ${lvr > 0.8 ? `<div class="pnc-offset-note" style="background:#FEF7EA;border-color:#F3D08A;color:#8a5a12;"><span class="pnc-offset-ico">⚠️</span><span>At this price your deposit is under 20% (${Math.round(lvr*100)}% LVR), so lenders will likely charge <b>Lender's Mortgage Insurance — roughly ${_toolMoney(lmiEst)}</b> at this LVR. It's usually added to the loan rather than paid up front; a bigger deposit avoids it entirely.</span></div>` : ''}
    <div class="pnc-cta">
      Ready to see how a purchase reshapes your FIRE timeline?
      <button class="btn primary" onclick="showTab('results')">Build your full model</button>
    </div>`;
  _toolSyncSliders('tool-borrowing');
  _bpChartRender(maxLoanAt, rate);
  initInfoTips();
}

let _bpChartInst = null;
/** Borrowing power across a rate range, stepped in 25bp — the increment the RBA
 *  actually moves in — with your current rate marked. */
function _bpChartRender(maxLoanAt, rate){
  const cv = document.getElementById('bpChart');
  if(!cv || typeof Chart === 'undefined') return;
  const STEP = 0.0025;
  const lo = Math.max(0.01, Math.round((rate - 0.02) / STEP) * STEP);   // ~2% below
  const pts = [];
  for(let i = 0; i <= 20; i++){                                         // 21 points = 5% span
    const rt = Math.round((lo + i * STEP) * 10000) / 10000;
    pts.push({ rt, loan: maxLoanAt(rt) });
  }
  // Mark whichever 25bp step is closest to the user's actual rate.
  const hereIdx = pts.reduce((b, p, i) => Math.abs(p.rt - rate) < Math.abs(pts[b].rt - rate) ? i : b, 0);
  if(_bpChartInst){ _bpChartInst.destroy(); _bpChartInst = null; }
  _bpChartInst = new Chart(cv.getContext('2d'), {
    type: 'line',
    data: {
      labels: pts.map(p => (p.rt * 100).toFixed(2) + '%'),
      datasets: [{
        label: 'Most you could borrow',
        data: pts.map(p => p.loan),
        borderColor: '#059669', borderWidth: 2.4, tension: .15, pointStyle: 'line',
        fill: 'origin', backgroundColor: 'rgba(5,150,105,.07)',
        pointRadius: pts.map((_, i) => i === hereIdx ? 5 : 0),
        pointBackgroundColor: '#fff', pointBorderColor: '#151816', pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, interaction: { mode:'index', intersect:false },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: {
          title: items => `At ${items[0].label}` + (items[0].dataIndex === hereIdx ? '  ·  your rate' : ''),
          label: c => 'Borrow up to ' + fmtDollar(c.parsed.y),
          footer: items => {
            const d = pts[hereIdx].loan - items[0].parsed.y;
            if(Math.abs(d) < 1) return 'This is your current rate';
            return (d > 0 ? '−' : '+') + fmtDollar(Math.abs(d)) + ' vs your rate';
          }
        }}
      },
      scales: {
        y: { ticks:{ callback: v => '$' + moneyAxis(v) }, grid:{ color:'#F0EDE8' }, beginAtZero:true },
        x: { title:{ display:true, text:'Interest rate (25bp steps)', font:{size:11} },
             grid:{ display:false }, ticks:{ maxRotation:0, autoSkip:true, maxTicksLimit:9, font:{size:10} } }
      }
    }
  });
}

/* ── Rent vs Buy ─────────────────────────────────────────────────────────
   Runs both paths month by month. The buyer sinks deposit + stamp duty + costs
   into the home; the renter invests that same cash and keeps investing whatever
   the cheaper option saves each month (either side can be the cheaper one).
   Compares net worth: home equity + any investments vs the renter's portfolio. */
function calcRentBuy(){
  const price = _toolNum('rb_price'), deposit = _toolNum('rb_deposit');
  const rate = _toolNum('rb_rate') / 100, term = _toolNum('rb_term') || 30;
  const state = document.getElementById('rb_state')?.value || 'NSW';
  const fhb = !!document.getElementById('rb_fhb')?.checked;
  const ratesY = _toolNum('rb_rates'), insY = _toolNum('rb_ins');
  const maintPct = _toolNum('rb_maint') / 100, strataY = _toolNum('rb_strata');
  const weeklyRent = _toolNum('rb_rent'), rentGrow = _toolNum('rb_rentgrow') / 100;
  const growth = _toolNum('rb_growth') / 100, invReturn = _toolNum('rb_return') / 100;
  const years = Math.max(1, _toolNum('rb_years') || 10);

  const duty = stampDuty(price, state, fhb);
  const otherCosts = 3000;
  const upfront = deposit + duty.duty + otherCosts;    // cash the buyer commits
  const loan = Math.max(0, price - deposit);
  const r = rate / 12, n = term * 12;
  const pmt = loan > 0 ? (r > 0 ? loan * r / (1 - Math.pow(1 + r, -n)) : loan / n) : 0;
  const gM = Math.pow(1 + growth, 1/12) - 1;
  const iM = Math.pow(1 + invReturn, 1/12) - 1;
  const rgM = Math.pow(1 + rentGrow, 1/12) - 1;

  let bal = loan, propValue = price, rentM = weeklyRent * 52 / 12;
  let renterPort = upfront, buyerPort = 0, breakEven = null;
  let totalRentPaid = 0, totalInterest = 0, renterContribs = 0;
  const months = Math.round(years * 12);
  // Year 0: the buyer's wealth is their equity (deposit); the renter still holds
  // the duty + costs the buyer just handed over, so they start ahead.
  const series = [{ buy: price - loan, rent: upfront }];
  for(let m = 1; m <= months; m++){
    let pay = 0;
    if(bal > 0.005){
      const it = bal * r; let pr = pmt - it;
      if(pr > bal) pr = bal;
      if(pr < 0) pr = 0;
      bal -= pr; pay = it + pr; totalInterest += it;
    }
    const ownM = (ratesY + insY + strataY + propValue * maintPct) / 12;
    const buyOut = pay + ownM;
    totalRentPaid += rentM;
    const diff = buyOut - rentM;
    if(diff > 0){ renterPort += diff; renterContribs += diff; } else buyerPort += -diff;
    renterPort *= (1 + iM); buyerPort *= (1 + iM);
    propValue *= (1 + gM); rentM *= (1 + rgM);
    if(breakEven === null && (propValue - bal + buyerPort) >= renterPort) breakEven = m;
    if(m % 12 === 0) series.push({ buy: propValue - bal + buyerPort, rent: renterPort });
  }
  const buyNW = propValue - bal + buyerPort;
  const rentNW = renterPort;
  const gap = buyNW - rentNW;
  const buyWins = gap >= 0;

  const out = document.getElementById('rbResults'); if(!out) return;
  const yrsTxt = m => m == null ? null : (m / 12).toFixed(1).replace(/\.0$/, '');
  out.innerHTML = `
    <div class="pnc-headline ${buyWins ? 'gain' : 'cost'}">
      <div class="pnc-head-lbl">After ${years} year${years>1?'s':''}, ${buyWins ? 'buying' : 'renting + investing'} is ahead by</div>
      <div class="pnc-head-nums"><div><b>${_toolMoney(Math.abs(gap))}</b><span>in net worth</span></div></div>
      <div class="pnc-head-sub">${breakEven ? `buying pulls ahead after about ${yrsTxt(breakEven)} year${breakEven>12?'s':''}` : `renting stays ahead for the whole ${years} years`}</div>
    </div>
    <div class="pnc-break">
      <div class="pnc-break-hd">If you buy — after ${years} years</div>
      ${_toolRow('Home value', propValue, {sign:false})}
      ${_toolRow('Loan still owing', -bal)}
      <div class="pnc-line subtotal"><span class="pnc-line-lbl">Home equity</span><span class="pnc-line-val">${_toolMoney(propValue - bal)}</span></div>
      ${buyerPort > 1 ? _toolRow('Invested savings', buyerPort, {note:'once owning is cheaper than renting'}) : ''}
      <div class="pnc-line total"><span class="pnc-line-lbl">Net worth</span><span class="pnc-line-val">${_toolMoney(buyNW)}</span></div>
    </div>
    <div class="pnc-break">
      <div class="pnc-break-hd">If you rent &amp; invest — after ${years} years</div>
      ${_toolRow('Upfront cash invested', upfront, {note:'deposit + stamp duty + costs'})}
      ${renterContribs > 1 ? _toolRow('Monthly savings invested', renterContribs, {note:'vs the cost of owning'}) : ''}
      ${_toolRow('Investment growth at ' + (invReturn*100).toFixed(1) + '%', rentNW - upfront - renterContribs)}
      <div class="pnc-line total"><span class="pnc-line-lbl">Net worth (portfolio)</span><span class="pnc-line-val">${_toolMoney(rentNW)}</span></div>
      <div class="pnc-line noncash"><span class="pnc-line-lbl">Rent paid along the way <em>gone, not invested</em></span><span class="pnc-line-val">−$${Math.round(totalRentPaid).toLocaleString()}</span></div>
    </div>
    <div class="pnc-alt">
      <div><div class="pnc-alt-lbl">Upfront to buy in ${state}</div>
        <div class="pnc-alt-note">stamp duty ${_toolMoney(duty.duty)}${duty.note ? ' · ' + duty.note : ''} + ${_toolMoney(otherCosts)} costs</div></div>
      <div class="pnc-alt-nums"><b>${_toolMoney(upfront)}</b></div>
    </div>
    <div class="pnc-cta">
      This ignores lifestyle — but your FIRE plan shouldn't ignore either path.
      <button class="btn primary" onclick="showTab('results')">Build your full model</button>
    </div>`;
  _toolSyncSliders('tool-rentbuy');
  _rbChartRender(series, breakEven);
  initInfoTips();
}

let _rbChartInst = null;
/** Net worth over time — buying vs renting & investing, so the crossover shows. */
function _rbChartRender(series, breakEvenMonths){
  const cv = document.getElementById('rbChart');
  if(!cv || typeof Chart === 'undefined') return;
  const labels = series.map((_, i) => i);
  const beYr = breakEvenMonths != null ? breakEvenMonths / 12 : null;
  if(_rbChartInst){ _rbChartInst.destroy(); _rbChartInst = null; }
  _rbChartInst = new Chart(cv.getContext('2d'), {
    type: 'line',
    data: { labels, datasets: [
      { label:'Buy — home equity + investments', data: series.map(p => p.buy),
        borderColor:'#059669', borderWidth:2.4, pointRadius:0, tension:.15,
        pointStyle:'line', fill:'origin', backgroundColor:'rgba(5,150,105,.07)' },
      { label:'Rent & invest — portfolio', data: series.map(p => p.rent),
        borderColor:'#6366F1', borderWidth:2.4, borderDash:[6,4], pointRadius:0, tension:.15, pointStyle:'line', fill:false }
    ]},
    options: {
      responsive:true, maintainAspectRatio:false, interaction:{ mode:'index', intersect:false },
      plugins:{
        legend: _toolLegend(),
        tooltip:{ callbacks:{
          title: items => `Year ${items[0].label}` + (beYr && Math.abs(items[0].label - beYr) < .5 ? '  ·  break-even' : ''),
          label: c => `${c.dataset.label}: ${fmtDollar(c.parsed.y)}`,
          footer: items => {
            if(items.length < 2) return '';
            const d = items[0].parsed.y - items[1].parsed.y;
            return (d >= 0 ? 'Buying ahead by ' : 'Renting ahead by ') + fmtDollar(Math.abs(d));
          }
        }}
      },
      scales:{
        y:{ ticks:{ callback: v => '$' + moneyAxis(v) }, grid:{ color:'#F0EDE8' }, beginAtZero:true },
        x:{ title:{ display:true, text:'Years', font:{size:11} }, grid:{ display:false } }
      }
    }
  });
}

/** Legend that actually distinguishes solid from dashed: draw a line segment
 *  (not a dot) and carry each dataset's borderDash through to it. */
function _toolLegend(){
  return {
    position:'top',
    labels:{
      usePointStyle:true, pointStyle:'line', boxWidth:28, boxHeight:2,
      font:{ size:11 }, color:'#3E4A3F', padding:14,
      generateLabels: chart => chart.data.datasets.map((ds, i) => ({
        text: ds.label,
        strokeStyle: ds.borderColor,
        fillStyle: ds.borderColor,
        lineWidth: Math.max(2, ds.borderWidth || 2),
        lineDash: ds.borderDash || [],
        pointStyle: 'line',
        hidden: !chart.isDatasetVisible(i),
        datasetIndex: i
      }))
    }
  };
}

/* ── Offset & extra repayments payoff simulator ─────────────────────────── */
function calcOffsetImpact(){
  const loan = _toolNum('off_loan');
  const rate = _toolNum('off_rate') / 100;
  const term = _toolNum('off_term') || 30;
  const offset0 = _toolNum('off_offset');
  const extra = _toolNum('off_extra');
  const grow = _toolNum('off_grow');
  const r = rate / 12, n = term * 12;
  const basePmt = loan > 0 ? (r > 0 ? loan * r / (1 - Math.pow(1 + r, -n)) : loan / n) : 0;

  const sim = (offStart, extraP, growP) => {
    let bal = loan, off = offStart, months = 0, interest = 0, princPaid = 0;
    const pmt = basePmt + extraP;
    const cap = n * 4;
    const series = [{ bal: loan, cumInt: 0, cumPrin: 0 }];   // yearly snapshots
    while(bal > 0.005 && months < cap){
      const it = Math.max(0, bal - off) * r;
      interest += it;
      let principal = pmt - it;
      if(principal <= 0){ months = Infinity; break; }   // never repays
      if(principal > bal) principal = bal;
      bal -= principal; princPaid += principal; off += growP; months++;
      if(months % 12 === 0) series.push({ bal: Math.max(0, bal), cumInt: interest, cumPrin: princPaid });
    }
    if(isFinite(months) && months % 12 !== 0) series.push({ bal: Math.max(0, bal), cumInt: interest, cumPrin: princPaid });
    return { months, interest, series };
  };
  const base = sim(0, 0, 0);
  const scen = sim(offset0, extra, grow);
  const monthsSaved = isFinite(scen.months) ? Math.max(0, base.months - scen.months) : 0;
  const interestSaved = base.interest - scen.interest;

  const fmtDur = m => {
    if(!isFinite(m)) return '30+ yrs';
    const y = Math.floor(m / 12), mo = Math.round(m % 12);
    return (y ? `${y} yr${y>1?'s':''}` : '') + (mo ? `${y?' ':''}${mo} mo` : '') || '0 mo';
  };

  const out = document.getElementById('offResults'); if(!out) return;
  out.innerHTML = `
    <div class="pnc-headline gain">
      <div class="pnc-head-lbl">Loan paid off in</div>
      <div class="pnc-head-nums">
        <div><b>${fmtDur(scen.months)}</b><span>vs ${fmtDur(base.months)} standard</span></div>
        <div><b>${fmtDur(monthsSaved)}</b><span>sooner</span></div>
      </div>
      <div class="pnc-head-sub">and ${_toolMoney(interestSaved)} less interest over the life of the loan</div>
    </div>
    <div class="pnc-break">
      <div class="pnc-break-hd">Total interest paid</div>
      ${_toolRow('Standard loan, no offset', base.interest, {sign:false})}
      ${_toolRow('With your offset + extra', scen.interest, {sign:false})}
      <div class="pnc-line total"><span class="pnc-line-lbl">Interest saved</span><span class="pnc-line-val">${_toolMoney(interestSaved)}</span></div>
    </div>
    <div class="pnc-alt">
      <div><div class="pnc-alt-lbl">Standard repayment</div><div class="pnc-alt-note">before your extra ${extra>0?`+ ${_toolMoney(extra)}/mo`:''}</div></div>
      <div class="pnc-alt-nums"><b>${_toolMoney(basePmt)}</b><span>/mo</span></div>
    </div>
    <div class="pnc-cta">
      See how paying your home off early frees up your FIRE plan.
      <button class="btn primary" onclick="showTab('results')">Build your full model</button>
    </div>`;
  const offS = document.getElementById('off_offset_r');
  if(offS) offS.max = String(Math.max(10000, Math.round(loan)));
  _toolSyncSliders('tool-offset');
  _offChartRender(base, scen);
  initInfoTips();
}

let _offChartInst = null;
/** Loan balance + interest paid over time: standard vs your plan. */
function _offChartRender(base, scen){
  const cv = document.getElementById('offChart');
  if(!cv || typeof Chart === 'undefined') return;
  const maxYrs = Math.max(base.series.length, scen.series.length);
  const labels = Array.from({ length: maxYrs }, (_, i) => i);
  const pick = (s, key) => { const a = s.series.map(p => p[key]); while(a.length < maxYrs) a.push(null); return a; };
  if(_offChartInst){ _offChartInst.destroy(); _offChartInst = null; }
  _offChartInst = new Chart(cv.getContext('2d'), {
    type: 'line',
    data: { labels, datasets: [
      { label:'Loan balance — standard', data: pick(base,'bal'), borderColor:'#9CA3AF', borderDash:[6,4], borderWidth:1.8, pointRadius:0, tension:.15, pointStyle:'line', fill:false },
      { label:'Loan balance — your plan', data: pick(scen,'bal'), borderColor:'#059669', borderWidth:2.4, pointRadius:0, tension:.15, pointStyle:'line',
        fill:'origin', backgroundColor:'rgba(5,150,105,.07)' },
      { label:'Interest paid — standard', data: pick(base,'cumInt'), borderColor:'#D9A441', borderDash:[6,4], borderWidth:1.8, pointRadius:0, tension:.15, pointStyle:'line', fill:false },
      { label:'Interest paid — your plan', data: pick(scen,'cumInt'), borderColor:'#F59E0B', borderWidth:2.2, pointRadius:0, tension:.15, pointStyle:'line', fill:false }
    ]},
    options: {
      responsive:true, maintainAspectRatio:false, interaction:{ mode:'index', intersect:false },
      plugins:{
        legend: _toolLegend(),
        tooltip:{ callbacks:{
          title: items => `Year ${items[0].label}`,
          label: c => c.parsed.y == null ? null : `${c.dataset.label}: ${fmtDollar(c.parsed.y)}`
        }}
      },
      scales:{
        y:{ ticks:{ callback: v => '$' + moneyAxis(v) }, grid:{ color:'#F0EDE8' }, beginAtZero:true },
        x:{ title:{ display:true, text:'Years', font:{size:11} }, grid:{ display:false } }
      }
    }
  });
}

/** Property net-cost calculator: what an investment property costs out of
 *  pocket per week/month after rent and negative-gearing tax back. */
function calcPropertyNetCost(){
  const el  = id => document.getElementById(id);
  const num = id => { const v = parseFloat(String(el(id)?.value || '').replace(/[,$%\s]/g,'')); return isNaN(v) ? 0 : v; };

  const propValue  = num('pnc_value');
  const loan       = num('pnc_loan');
  const offset     = Math.min(num('pnc_offset'), loan);   // offset can't exceed the loan
  const rate       = num('pnc_rate') / 100;
  const term       = num('pnc_term') || 30;
  const weeklyRent = num('pnc_rent');
  const mgmtPct    = num('pnc_mgmt') / 100;
  const maintPct   = num('pnc_maint') / 100;
  const insurance  = num('pnc_ins');
  const rates      = num('pnc_rates');
  const strata     = num('pnc_strata');
  const depreciation = num('pnc_depreciation');   // non-cash tax deduction (mostly new builds)
  const salary     = num('pnc_salary');
  const hasPartner = !!el('pnc_partner_toggle')?.checked;
  const partnerSalary = hasPartner ? num('pnc_partner_salary') : 0;
  const pw = el('pnc_partner_wrap'); if(pw) pw.hidden = !hasPartner;

  // Year-one interest / principal via a 12-month amortisation walk. The offset
  // reduces the balance interest is charged on, so the same repayment pays down
  // more principal. Track a no-offset run too, to show the interest saved.
  const r = rate / 12, n = term * 12;
  const monthlyPmt = loan > 0 ? (r > 0 ? loan * r / (1 - Math.pow(1 + r, -n)) : loan / n) : 0;
  let bal = loan, yearInterest = 0, yearPrincipal = 0;
  let balNo = loan, interestNoOffset = 0;
  for(let i = 0; i < 12 && bal > 0.005; i++){
    const int = Math.max(0, bal - offset) * r;                 // offset lowers charged interest
    const prin = Math.min(monthlyPmt - int, bal);
    yearInterest += int; yearPrincipal += prin; bal -= prin;
    if(balNo > 0.005){ const it = balNo * r; interestNoOffset += it; balNo -= Math.min(monthlyPmt - it, balNo); }
  }
  const annualRepay = yearInterest + yearPrincipal;
  const interestSaved = Math.max(0, interestNoOffset - yearInterest);

  // Vacancy: weeks with no tenant earn nothing; management is charged on
  // collected rent only.
  const vacWeeks = Math.min(Math.max(num('pnc_vacancy'), 0), 52);
  const annualRent = weeklyRent * (52 - vacWeeks);
  const mgmt  = annualRent * mgmtPct;
  const maint = propValue * maintPct;
  const cashExpenses = mgmt + insurance + maint + rates + strata;   // deductible cash costs
  // Deductible for tax adds non-cash depreciation; principal is never deductible.
  const deductible   = yearInterest + cashExpenses + depreciation;
  const rentalResult = annualRent - deductible;                     // <0 = loss (negative gearing)

  // Tax effect: apply the rental result to salary (split 50/50 with a partner).
  // Exclude the Medicare Levy Surcharge — that's a private-health penalty, not a
  // negative-gearing benefit, and most investors carry hospital cover. This keeps
  // the tax back at the standard marginal-rate + Medicare-levy figure.
  const benefitFor = (sal, share) => {
    if(sal <= 0) return 0;
    const t0 = calcTax(sal, TAX_SETTINGS);
    const t1 = calcTax(Math.max(0, sal + rentalResult * share), TAX_SETTINGS);
    return (t0.totalTax - t0.mls) - (t1.totalTax - t1.mls);   // >0 when a loss lowers tax
  };
  const taxBenefit = (hasPartner && partnerSalary > 0)
    ? benefitFor(salary, 0.5) + benefitFor(partnerSalary, 0.5)
    : benefitFor(salary, 1);

  // Net costs (annual). "Out of pocket" includes principal (a real cash outflow);
  // "true holding cost" excludes it because principal builds your equity.
  const netInclPrincipal = (annualRepay + cashExpenses - annualRent) - taxBenefit;
  const netExclPrincipal = (yearInterest + cashExpenses - annualRent) - taxBenefit;

  const out = el('pncResults');
  if(!out) return;
  const wk = v => v / 52, mo = v => v / 12;
  const money = v => (v < 0 ? '−' : '') + '$' + Math.abs(Math.round(v)).toLocaleString();
  // Headline is the TRUE holding cost (principal excluded — it's equity you keep,
  // not a cost). Using the incl-principal figure made an offset look like it
  // *raised* your cost, when it actually converts interest into equity.
  const isCost = netExclPrincipal >= 0;
  const headWord = isCost ? 'costs you' : 'puts in your pocket';
  const headCls  = isCost ? 'cost' : 'gain';
  // Offset impact: interest saved becomes extra principal (repayment is fixed),
  // so the win shows up as equity + lower true cost, not lower cash out.
  const margCombined = calcTax(hasPartner && partnerSalary > salary ? partnerSalary : salary, TAX_SETTINGS).marginalRate + 0.02;
  const offsetAfterTax = interestSaved * (1 - margCombined);
  // Direction-aware labels: a positively geared property earns a taxable profit
  // (extra tax), a negatively geared one makes a loss (tax back).
  const gearingLoss  = rentalResult < 0;
  const cashBeforeTax = annualRepay + cashExpenses - annualRent;   // >0 = shortfall
  const cashLbl = cashBeforeTax >= 0 ? 'Cash shortfall before tax' : 'Cash surplus before tax';
  const taxLbl  = gearingLoss ? 'Negative-gearing tax back' : 'Tax on rental profit';
  const taxNote = gearingLoss ? `cuts taxable income by ${money(-rentalResult)}`
                              : `adds ${money(rentalResult)} to taxable income`;

  const row = (label, val, opts={}) => `
    <div class="pnc-line ${opts.cls||''}">
      <span class="pnc-line-lbl">${label}${opts.note?` <em>${opts.note}</em>`:''}</span>
      <span class="pnc-line-val">${opts.sign===false ? money(val) : (val>=0?'+':'−')+'$'+Math.abs(Math.round(val)).toLocaleString()}</span>
    </div>`;

  out.innerHTML = `
    <div class="pnc-headline ${headCls}">
      <div class="pnc-head-lbl">This property ${headWord} <span class="info-tip" data-tip="pnc_holding">?</span></div>
      <div class="pnc-head-two">
        <div class="pnc-hcol">
          <div class="pnc-hcol-lbl">Cash out of pocket</div>
          <div class="pnc-hcol-big"><b>${money(Math.abs(wk(netInclPrincipal)))}</b><span>/wk</span></div>
          <div class="pnc-hcol-mo">${money(Math.abs(mo(netInclPrincipal)))}/mo</div>
          <div class="pnc-hcol-note">what actually leaves your account, including loan principal</div>
        </div>
        <div class="pnc-hcol accent">
          <div class="pnc-hcol-lbl">Actual cost</div>
          <div class="pnc-hcol-big"><b>${money(Math.abs(wk(netExclPrincipal)))}</b><span>/wk</span></div>
          <div class="pnc-hcol-mo">${money(Math.abs(mo(netExclPrincipal)))}/mo</div>
          <div class="pnc-hcol-note">money genuinely gone — principal excluded, that's equity you keep</div>
        </div>
      </div>
    </div>

    ${offset > 0 ? `<div class="pnc-offset-note">
      <span class="pnc-offset-ico">💰</span>
      <span>Your <b>${money(offset)}</b> offset saves <b>${money(interestSaved)}/yr</b> in interest — about <b>${money(offsetAfterTax)}</b> after tax. Your repayment doesn't change, so that saving pays down the loan instead: faster equity, lower true cost.</span>
    </div>` : ''}

    <div class="pnc-break">
      <div class="pnc-break-hd">Where it goes — per year</div>
      ${row('Rent received', annualRent, vacWeeks > 0 ? {note:`${52 - vacWeeks} weeks let`} : {})}
      ${row('Loan interest', -yearInterest, offset>0 ? {note:`offset saves ${money(interestSaved)}/yr`} : {})}
      ${row('Loan principal', -yearPrincipal, {note:'builds your equity'})}
      ${row('Agent / management', -mgmt)}
      ${row('Maintenance', -maint)}
      ${row('Insurance', -insurance)}
      ${row('Council rates', -rates)}
      ${strata>0 ? row('Strata / body corp', -strata) : ''}
      <div class="pnc-line subtotal">
        <span class="pnc-line-lbl">${cashLbl}</span>
        <span class="pnc-line-val">${money(-cashBeforeTax)}</span>
      </div>
      ${depreciation > 0 ? `<div class="pnc-line noncash">
        <span class="pnc-line-lbl">Depreciation <em>non-cash — extra tax deduction</em></span>
        <span class="pnc-line-val">−$${Math.round(depreciation).toLocaleString()}</span>
      </div>` : ''}
      ${row(taxLbl, taxBenefit, {note:taxNote})}
      <div class="pnc-line total">
        <span class="pnc-line-lbl">Net ${isCost?'cost':'gain'} after tax</span>
        <span class="pnc-line-val">${money(-netInclPrincipal)}</span>
      </div>
    </div>

    <div class="pnc-alt">
      <div>
        <div class="pnc-alt-lbl">Before any tax back</div>
        <div class="pnc-alt-note">repayment + costs − rent. An offset never changes this — your repayment is fixed.</div>
      </div>
      <div class="pnc-alt-nums">
        <b>${money(Math.abs(wk(cashBeforeTax)))}</b><span>/wk</span>
        <b>${money(Math.abs(mo(cashBeforeTax)))}</b><span>/mo</span>
      </div>
    </div>
    <div class="pnc-cta">
      Want to see how this fits your FIRE date, super and 30-year net worth?
      <button class="btn primary" onclick="showTab('results')">Build your full model</button>
    </div>`;
  const offSlider = el('pnc_offset_r');
  if(offSlider) offSlider.max = String(Math.max(10000, Math.round(loan)));   // can't offset more than you owe
  _toolSyncSliders('tool-property');
  initInfoTips();
}

/* ═══════════════════════════════════════════════════════
   BUDGET TAB
   ═══════════════════════════════════════════════════════ */

/** Pre-seeded category definitions — group → sub-categories */
const DEFAULT_BUDGET_CATS = [
  { group:'Housing',       key:'hous_rent',    label:'Rent' },
  { group:'Housing',       key:'hous_mort',    label:'Mortgage' },
  { group:'Housing',       key:'hous_util',    label:'Utilities' },
  { group:'Housing',       key:'hous_ins',     label:'Home Insurance' },
  { group:'Housing',       key:'hous_maint',   label:'Maintenance & Repairs' },
  { group:'Housing',       key:'hous_strata',  label:'Strata / Body Corporate' },
  { group:'Housing',       key:'hous_rates',   label:'Council Rates' },

  { group:'Transport',     key:'tran_loan',    label:'Car Loan / Lease' },
  { group:'Transport',     key:'tran_fuel',    label:'Fuel' },
  { group:'Transport',     key:'tran_ins',     label:'Car Insurance' },
  { group:'Transport',     key:'tran_rego',    label:'Registration' },
  { group:'Transport',     key:'tran_maint',   label:'Car Maintenance' },
  { group:'Transport',     key:'tran_pub',     label:'Public Transport' },
  { group:'Transport',     key:'tran_park',    label:'Parking & Tolls' },

  { group:'Food & Drink',  key:'food_groc',    label:'Groceries' },
  { group:'Food & Drink',  key:'food_dine',    label:'Dining Out' },
  { group:'Food & Drink',  key:'food_coff',    label:'Coffee & Cafes' },
  { group:'Food & Drink',  key:'food_take',    label:'Takeaway' },

  { group:'Health',        key:'hlth_ins',     label:'Private Health Insurance' },
  { group:'Health',        key:'hlth_gym',     label:'Gym & Fitness' },
  { group:'Health',        key:'hlth_med',     label:'Medical & Dental' },
  { group:'Health',        key:'hlth_pharm',   label:'Pharmacy' },

  { group:'Insurance',     key:'ins_life',     label:'Life Insurance' },
  { group:'Insurance',     key:'ins_inc',      label:'Income Protection' },

  { group:'Personal',      key:'pers_cloth',   label:'Clothing' },
  { group:'Personal',      key:'pers_care',    label:'Personal Care & Grooming' },

  { group:'Entertainment', key:'ent_stream',   label:'Streaming Services' },
  { group:'Entertainment', key:'ent_hobby',    label:'Hobbies' },
  { group:'Entertainment', key:'ent_travel',   label:'Travel & Holidays' },
  { group:'Entertainment', key:'ent_social',   label:'Social & Going Out' },

  { group:'Education',     key:'edu_courses',  label:'Courses & Learning' },
  { group:'Education',     key:'edu_books',    label:'Books & Media' },

  { group:'Financial',     key:'fin_invest',   label:'Investment Contributions' },
  { group:'Financial',     key:'fin_super',    label:'Extra Super Contributions' },
  { group:'Financial',     key:'fin_mortgage', label:'Extra Mortgage / Offset' },
  { group:'Financial',     key:'fin_debt',     label:'Other Debt Repayments' },

  { group:'Other',         key:'oth_misc',     label:'Miscellaneous' },
];

/** Live category list — loaded from localStorage, falls back to defaults */
let BUDGET_CATS = (function(){
  let cats = null;
  try {
    const saved = localStorage.getItem('fire_budget_cats_v1');
    if(saved) cats = JSON.parse(saved);
  } catch(_){}
  if(!Array.isArray(cats) || !cats.length) return DEFAULT_BUDGET_CATS.map(c => ({...c}));

  // ── Migrate saved category lists to newer defaults ──
  let changed = false;
  // "Rent / Mortgage" was split into separate "Rent" and "Mortgage" categories.
  cats.forEach(c => {
    if(c.label === 'Rent / Mortgage'){ c.label = 'Rent'; if(c.key === 'hous_rent' || !c.key) c.key = 'hous_rent'; changed = true; }
  });
  // Add any default categories the saved list doesn't have yet (matched by key,
  // falling back to label), so new features like "Mortgage" appear for everyone.
  DEFAULT_BUDGET_CATS.forEach((def, i) => {
    const has = cats.some(c => (c.key && def.key && c.key === def.key) || c.label === def.label);
    if(!has){
      // Insert near its default neighbour to keep grouping sensible.
      const prev = DEFAULT_BUDGET_CATS[i-1];
      const at = prev ? cats.findIndex(c => c.label === prev.label) : -1;
      const entry = {...def};
      if(at >= 0) cats.splice(at+1, 0, entry); else cats.push(entry);
      changed = true;
    }
  });
  if(changed){ try { localStorage.setItem('fire_budget_cats_v1', JSON.stringify(cats)); } catch(_){} }
  return cats;
})();

function saveBudgetCats(){
  try { localStorage.setItem('fire_budget_cats_v1', JSON.stringify(BUDGET_CATS)); } catch(_){}
}

/** Frequency helpers */
const FREQ_OPTIONS    = ['Weekly','Fortnightly','Monthly','Quarterly','Annually'];
const FREQ_TO_MONTHLY = { Weekly: 52/12, Fortnightly: 26/12, Monthly: 1, Quarterly: 1/3, Annually: 1/12 };

/** Common income source suggestions */
const INCOME_SOURCES = [
  'Salary / Wages','Partner Salary / Wages','Bonus / Commission',
  'Rental Income','Dividends','Interest','Business Income',
  'Freelance / Consulting','Government Benefits','Other',
];

/** Budget state */
let budgetYear      = new Date().getFullYear();
let budgetYearData  = null;
let budgetMonthStr  = todayMonthStr();
let _expRowCounter  = 0;
let _incRowCounter  = 0;
let _autosaveTimer  = null;
let _budgetLocked   = false;
let _expChartInstance  = null;
let _fireChartInstance = null;
// Cache for FIRE model yearly projections — keyed by serialised inputs+settings
let _fireProjectionsCache    = null; // { [year]: monthlyNetTarget }
let _fireProjectionsCacheKey = null;

/** Helpers */
const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function todayMonthStr(){
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`;
}
function fmtDollar(v){
  if(v === null || v === undefined) return '—';
  const abs = Math.abs(Math.round(v));
  return (v < 0 ? '-$' : '$') + abs.toLocaleString();
}
function fmtDollarShort(v){
  if(v === null || v === undefined) return '—';
  const abs = Math.abs(Math.round(v));
  const sign = v < 0 ? '-$' : '$';
  if(abs >= 1000000) return sign + (abs/1000000).toFixed(abs % 1000000 === 0 ? 0 : 1) + 'm';
  if(abs >= 1000)    return sign + Math.round(abs/1000) + 'k';
  return sign + abs;
}

function isPastMonth(monthStr){
  const n = new Date();
  const cur = `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`;
  return monthStr < cur;
}
function prevMonthStr(monthStr){
  let [y, m] = monthStr.split('-').map(Number);
  m--; if(m < 1){ m = 12; y--; }
  return `${String(y).padStart(4,'0')}-${String(m).padStart(2,'0')}`;
}
function parseCategoryDescription(str){
  const m = str.match(/^(.+?) \((.+)\)$/);
  if(!m) return {subcategory: str, description: ''};
  return {subcategory: m[1], description: m[2]};
}
function updateCopyBtn(){
  const btn = document.getElementById('budgetCopyBtn');
  if(!btn || !budgetMonthStr) return;
  btn.innerHTML = `<span aria-hidden="true">⧉</span> Copy Previous Month`;
}
function setLockState(locked){
  _budgetLocked = locked;
  const banner = document.getElementById('budgetLockBanner');
  const body   = document.getElementById('budgetEditorBody');
  if(banner) banner.style.display = locked ? 'flex' : 'none';
  if(body)   body.classList.toggle('budget-editor-locked', locked);
}
function unlockBudgetMonth(){
  setLockState(false);
}

/* ── Budget localStorage store ─────────────────────────────────────────
   Replaces server-side budgets.json so data persists across API restarts.
   Schema: wm_budget = { months: { "YYYY-MM": {
     income_planned, income_actual, income_rows:[...], expenses:[...], notes
   }}}
   ─────────────────────────────────────────────────────────────────── */
const _WM_BUDGET_KEY = 'wm_budget';

function _budgLoad(){
  try{
    const d = JSON.parse(localStorage.getItem(_WM_BUDGET_KEY)||'{}');
    if(!d.months||typeof d.months!=='object') d.months={};
    return d;
  } catch(_){ return {months:{}}; }
}
function _budgStore(data){
  try{ localStorage.setItem(_WM_BUDGET_KEY, JSON.stringify(data)); } catch(_){}
  _queueSync();
}
/** Upsert a month record — only replaces keys present in patch */
function _budgUpsertMonth(monthStr, patch){
  const d = _budgLoad();
  if(!d.months[monthStr]) d.months[monthStr]={income_planned:0,income_actual:null,income_rows:[],expenses:[],notes:''};
  Object.assign(d.months[monthStr], patch);
  _budgStore(d);
}
/** Returns month record in populateLogForm-compatible format, or null if not found */
function budgGetMonth(monthStr){
  const rec = _budgLoad().months[monthStr];
  if(!rec) return null;
  return {
    income: { planned: rec.income_planned||0, actual: rec.income_actual??null },
    categories: (rec.expenses||[]),
    notes: rec.notes||''
  };
}
/** Returns year overview compatible with renderBudgetYearTable */
function budgGetYear(year){
  const d = _budgLoad();
  const r2 = v => Math.round((v||0)*100)/100;
  const rows = [];
  for(let i=1;i<=12;i++){
    const m = `${year}-${String(i).padStart(2,'0')}`;
    const rec = d.months[m];
    if(rec){
      const ip = rec.income_planned||0;
      const ia = rec.income_actual??null;
      const exps = rec.expenses||[];
      const ep = exps.reduce((s,e)=>s+(e.planned||0),0);
      const hasAct = exps.some(e=>e.actual!=null);
      const ea = hasAct ? exps.reduce((s,e)=>s+(e.actual||0),0) : null;
      rows.push({ month:m,
        income_planned:r2(ip), income_actual:ia!=null?r2(ia):null,
        expense_planned:r2(ep), expense_actual:ea!=null?r2(ea):null,
        net_planned:r2(ip-ep),
        net_actual:(ia!=null||ea!=null)?r2((ia??ip)-(ea??ep)):null });
    } else {
      rows.push({month:m,income_planned:0,income_actual:null,expense_planned:0,expense_actual:null,net_planned:0,net_actual:null});
    }
  }
  return {year, months:rows};
}
/** Returns series data compatible with renderFireProgress / loadSyncData */
function budgGetSeries(fromMonth, toMonth){
  const d = _budgLoad();
  const r2 = v => Math.round((v||0)*100)/100;
  // Build month list
  const months=[];
  let [y,mo]=fromMonth.split('-').map(Number);
  const [ey,em]=toMonth.split('-').map(Number);
  while(y<ey||(y===ey&&mo<=em)){
    months.push(`${String(y).padStart(4,'0')}-${String(mo).padStart(2,'0')}`);
    mo++; if(mo>12){mo=1;y++;}
  }
  let cum=0;
  const series=months.map(ms=>{
    const rec=d.months[ms];
    if(rec){
      const ip=rec.income_planned||0;
      const ia=rec.income_actual??null;
      const exps=rec.expenses||[];
      const ep=exps.reduce((s,e)=>s+(e.planned||0),0);
      const hasAct=exps.some(e=>e.actual!=null);
      const ea=hasAct?exps.reduce((s,e)=>s+(e.actual||0),0):null;
      const net_a=(ia!=null||ea!=null)?r2((ia??ip)-(ea??ep)):null;
      if(net_a!=null) cum+=net_a;
      return{month:ms,income_planned:r2(ip),income_actual:ia!=null?r2(ia):null,
             expense_planned:r2(ep),expense_actual:ea!=null?r2(ea):null,
             net_planned:r2(ip-ep),net_actual:net_a,cumulative_actual:r2(cum)};
    }
    return{month:ms,income_planned:0,income_actual:null,expense_planned:0,expense_actual:null,net_planned:0,net_actual:null,cumulative_actual:r2(cum)};
  });
  return{from:months[0],to:months[months.length-1],series};
}

function copyPrevMonth(){
  if(!budgetMonthStr) return;
  copyFromMonth(prevMonthStr(budgetMonthStr));
}

/** Copy any month's PLANNED budget into the currently open month.
 *  Actuals are never copied — they belong to the source month. */
function copyFromMonth(src){
  if(!budgetMonthStr || !src || src === budgetMonthStr) return;
  const [sy, sm] = src.split('-').map(Number);
  const srcLbl = new Date(sy, sm-1, 1).toLocaleDateString('en-AU', {month:'long', year:'numeric'});

  // Check if current month already has meaningful planned data
  const hasPlanned =
    [...document.querySelectorAll('#incomeTableBody .income-row')]
      .some(r => r.querySelector('.inc-budget').value.trim()) ||
    [...document.querySelectorAll('#expenseTableBody .expense-row')]
      .some(r => r.querySelector('.exp-budget').value.trim());

  if(hasPlanned){
    if(!confirm(`Replace this month's budget with a copy of ${srcLbl}?`)) return;
  }

  const data = budgGetMonth(src);
  if(!data){
    const status = document.getElementById('budgetSaveStatus');
    if(status){ status.textContent = `No budget saved for ${srcLbl}`; status.className = 'budget-save-status error'; }
    return;
  }

  // Copy planned amounts only — strip actuals (they belong to the source month)
  if(data.income)     data.income.actual = null;
  if(data.categories) data.categories.forEach(c => { c.actual = null; });

  // Use source month's income breakdown from localStorage, strip actuals
  const srcIncRows = loadIncomeRowsFromStorage(src).map(r => ({...r, actual: ''}));
  populateLogForm(data, srcIncRows.length ? srcIncRows : undefined);

  const status = document.getElementById('budgetSaveStatus');
  if(status){ status.textContent = `Copied ${srcLbl} — edit to save`; status.className = 'budget-save-status'; }
  updateBudgetSummary();
}

/* ── Budget template: your "standard month" saved once, applied anywhere ── */
const _WM_BUDGET_TEMPLATE_KEY = 'wm_budget_template';

function _budgTemplateLoad(){
  try{ return JSON.parse(localStorage.getItem(_WM_BUDGET_TEMPLATE_KEY) || 'null'); } catch(_){ return null; }
}

/** Snapshot the currently open month's PLANNED figures as the template */
function saveBudgetTemplate(){
  const data = budgGetMonth(budgetMonthStr);
  const incRows = loadIncomeRowsFromStorage(budgetMonthStr).map(r => ({...r, actual:''}));
  if(!data && !incRows.length){
    const status = document.getElementById('budgetSaveStatus');
    if(status){ status.textContent = 'Nothing to save — fill in this month first'; status.className = 'budget-save-status error'; }
    return;
  }
  const tpl = JSON.parse(JSON.stringify(data || {}));
  if(tpl.income)     tpl.income.actual = null;
  if(tpl.categories) tpl.categories.forEach(c => { c.actual = null; });
  localStorage.setItem(_WM_BUDGET_TEMPLATE_KEY, JSON.stringify({ data: tpl, income_rows: incRows, savedFrom: budgetMonthStr }));
  const status = document.getElementById('budgetSaveStatus');
  if(status){ status.textContent = 'Template saved ✓'; status.className = 'budget-save-status saved'; }
}

/** Fill the open month from the saved template (planned only) */
function applyBudgetTemplate(){
  const tpl = _budgTemplateLoad();
  if(!tpl){ return; }
  const hasPlanned =
    [...document.querySelectorAll('#incomeTableBody .income-row')]
      .some(r => r.querySelector('.inc-budget').value.trim()) ||
    [...document.querySelectorAll('#expenseTableBody .expense-row')]
      .some(r => r.querySelector('.exp-budget').value.trim());
  if(hasPlanned && !confirm(`Replace this month's budget with your saved template?`)) return;
  populateLogForm(tpl.data || {}, (tpl.income_rows && tpl.income_rows.length) ? tpl.income_rows : undefined);
  const status = document.getElementById('budgetSaveStatus');
  if(status){ status.textContent = 'Template applied — edit to save'; status.className = 'budget-save-status'; }
  updateBudgetSummary();
}

/** Small "▾" dropdown: template actions + pick any logged month to copy from */
function toggleCopyFromDropdown(e){
  e.stopPropagation();
  const dd = document.getElementById('copyFromDropdown');
  if(!dd) return;
  if(dd.style.display !== 'none'){ dd.style.display = 'none'; return; }

  const itemStyle = `display:block; width:100%; text-align:left; padding:7px 12px; font-size:12.5px;
    background:none; border:none; cursor:pointer; color:#151816;`;
  const hover = `onmouseover="this.style.background='#F3F4F2'" onmouseout="this.style.background='none'"`;
  const closeThen = fn => `document.getElementById('copyFromDropdown').style.display='none'; ${fn}`;

  const tpl = _budgTemplateLoad();
  let tplNote = '';
  if (tpl?.savedFrom){
    const [ty, tm] = tpl.savedFrom.split('-').map(Number);
    tplNote = ` <span style="color:#6A716B;font-size:10.5px;">(from ${new Date(ty, tm-1, 1).toLocaleDateString('en-AU',{month:'short', year:'numeric'})})</span>`;
  }
  let html = `
    <button style="${itemStyle}" ${hover} onclick="${closeThen('saveBudgetTemplate()')}">📌 Save this month as template</button>
    ${tpl ? `<button style="${itemStyle}" ${hover} onclick="${closeThen('applyBudgetTemplate()')}">📋 Apply template${tplNote}</button>` : ''}
    <div style="border-top:1px solid #E5E7EB; margin:4px 0;"></div>
    <div style="padding:4px 12px 2px; font-size:10px; font-weight:700; letter-spacing:.06em; color:#6A716B; text-transform:uppercase;">Copy from month</div>`;

  const store = _budgLoad();
  const months = Object.keys(store.months || {})
    .filter(m => m !== budgetMonthStr)
    .sort()
    .reverse();

  if(!months.length){
    html += `<div style="padding:6px 12px 8px; font-size:12px; color:#6A716B;">No other months logged yet</div>`;
  } else {
    html += months.map(m => {
      const [y, mo] = m.split('-').map(Number);
      const lbl = new Date(y, mo-1, 1).toLocaleDateString('en-AU', {month:'long', year:'numeric'});
      return `<button style="${itemStyle}" ${hover} onclick="${closeThen(`copyFromMonth('${m}')`)}">${lbl}</button>`;
    }).join('');
  }
  dd.innerHTML = html;
  dd.style.display = '';
}

// Close the copy-from dropdown when clicking anywhere else
document.addEventListener('click', e => {
  const dd = document.getElementById('copyFromDropdown');
  if(dd && dd.style.display !== 'none' && !dd.contains(e.target)) dd.style.display = 'none';
});

/* ── Maths in budget amount fields: type "1200+340-50" and it evaluates on
   blur. Strictly sanitised to digits and + - * / ( ) . before evaluating. ── */
function evalBudgetExpression(raw){
  const s = String(raw ?? '').replace(/[$,\s]/g, '');
  if (s === '') return null;
  // Plain number (allowing one leading minus) — nothing to do
  if (!/[+\-*/()]/.test(s.slice(1))) return null;
  if (!/^[0-9+\-*/().]+$/.test(s)) return null;
  try {
    const v = Function(`"use strict"; return (${s});`)();
    return (typeof v === 'number' && isFinite(v)) ? Math.round(v * 100) / 100 : null;
  } catch(_) { return null; }
}

document.addEventListener('focusout', e => {
  const el = e.target;
  if (!el || !el.classList || !el.classList.contains('budget-amount')) return;
  const v = evalBudgetExpression(el.value);
  if (v !== null && String(v) !== el.value.trim()){
    el.value = v;
    // Re-run the row's oninput handler so totals/autosave pick up the result
    el.dispatchEvent(new Event('input', { bubbles: false }));
  }
});

/** Enter Budget tab */
function showBudgetTab(){
  showTab('budget');
  if(!budgetMonthStr) budgetMonthStr = todayMonthStr();
  loadBudgetMonth(budgetMonthStr);
  loadBudgetYear(budgetYear);
  renderFireProgress();
}

/** Year navigation arrows */
function budgetYearStep(delta){
  loadBudgetYear(budgetYear + delta);
  renderFireProgress();
}

/** Month navigation arrows on the editor card */
function budgetMonthStep(delta){
  if(!budgetMonthStr) budgetMonthStr = todayMonthStr();
  let [y, m] = budgetMonthStr.split('-').map(Number);
  m += delta;
  if(m > 12){ m = 1;  y++; }
  if(m < 1) { m = 12; y--; }
  loadBudgetMonth(`${String(y).padStart(4,'0')}-${String(m).padStart(2,'0')}`);
}

/** Clicking the month label itself opens the same picker popover used
 *  elsewhere, so you can jump straight to a month instead of stepping
 *  one at a time with the arrows (which keep working exactly as before). */
function toggleBudgetMonthPicker(){
  const pop = document.getElementById('budgetMonthPop');
  if (!pop) return;
  const wasOpen = pop.classList.contains('open');
  document.querySelectorAll('.month-picker-pop.open').forEach(p => p.classList.remove('open'));
  if (wasOpen) return;

  const viewYear = budgetMonthStr ? Number(budgetMonthStr.split('-')[0]) : new Date().getFullYear();
  _renderBudgetMonthPop(viewYear);
  pop.classList.add('open');

  if (!_mpOutsideBound) {
    _mpOutsideBound = true;
    document.addEventListener('click', (e) => {
      if (e.target.closest('.month-picker')) return;
      document.querySelectorAll('.month-picker-pop.open').forEach(p => p.classList.remove('open'));
    });
  }
}

function _renderBudgetMonthPop(year){
  const pop = document.getElementById('budgetMonthPop');
  if (!pop) return;
  const [selY, selM] = (budgetMonthStr || '').split('-').map(Number);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  pop.innerHTML = `
    <div class="month-picker-yearnav">
      <button type="button" onclick="event.stopPropagation(); _renderBudgetMonthPop(${year - 1})">‹</button>
      <span>${year}</span>
      <button type="button" onclick="event.stopPropagation(); _renderBudgetMonthPop(${year + 1})">›</button>
    </div>
    <div class="month-picker-grid">
      ${months.map((m, i) => `
        <button type="button" class="month-picker-cell${selY===year && selM===i+1 ? ' selected' : ''}"
                onclick="event.stopPropagation(); _budgetMonthPick(${year}, ${i+1})">${m}</button>
      `).join('')}
    </div>
  `;
}

function _budgetMonthPick(year, month){
  document.getElementById('budgetMonthPop').classList.remove('open');
  loadBudgetMonth(`${year}-${String(month).padStart(2,'0')}`);
}

/** Update the month label in the editor card header */
function updateBudgetMonthLabel(){
  const lbl = document.getElementById('budgetMonthLabel');
  if(!lbl || !budgetMonthStr) return;
  const [y, m] = budgetMonthStr.split('-').map(Number);
  lbl.textContent = new Date(y, m - 1, 1)
    .toLocaleDateString('en-AU', { month:'long', year:'numeric' });
}

/** Load a month into the inline editor */
/** How many whole months before the current real-world month this falls. Negative = future. */
function _monthsBeforeNow(monthStr){
  const [y, m] = monthStr.split('-').map(Number);
  const now = new Date();
  return (now.getFullYear()*12 + now.getMonth()+1) - (y*12 + m);
}

function loadBudgetMonth(monthStr){
  if (!isPro() && _monthsBeforeNow(monthStr) > 2) {
    showUpgradeModal('Free plan shows the last 3 months of budget history. Upgrade for unlimited history.');
    return;
  }
  clearTimeout(_autosaveTimer);
  budgetMonthStr = monthStr;
  updateBudgetMonthLabel();
  updateCopyBtn();
  const status = document.getElementById('budgetSaveStatus');
  if(status){ status.textContent = ''; status.className = 'budget-save-status'; }

  const data = budgGetMonth(monthStr);
  populateLogForm(data);
  setLockState(isPastMonth(monthStr) && data !== null);
}

/** Schedule autosave — debounced 800 ms */
function scheduleAutosave(){
  if(_budgetLocked) return;
  const status = document.getElementById('budgetSaveStatus');
  if(status){ status.textContent = 'Unsaved…'; status.className = 'budget-save-status'; }
  clearTimeout(_autosaveTimer);
  _autosaveTimer = setTimeout(doAutosave, 800);
}

/** Persist the current editor state to the API */
async function doAutosave(){
  if(!budgetMonthStr) return;
  const status = document.getElementById('budgetSaveStatus');
  if(status){ status.textContent = 'Saving…'; status.className = 'budget-save-status'; }

  // Sum income rows → API totals (net cash basis — after tax + super for gross rows)
  let incomePlannedTotal = 0, incomeActualTotal = 0, hasIncomeActual = false;
  document.querySelectorAll('#incomeTableBody .income-row').forEach(row => {
    const src = row.querySelector('.inc-source').value.trim();
    if(!src) return;
    const { budgetNet, actualNet } = _calcIncRowNets(row);
    if(budgetNet !== null) incomePlannedTotal += budgetNet;
    if(actualNet !== null){ incomeActualTotal += actualNet; hasIncomeActual = true; }
  });
  const incomePlanned = Math.round(incomePlannedTotal * 100) / 100;
  // If no actual income entered, fall back to planned as the best estimate so the
  // month counts as "logged" in the FIRE progress series. The user can override
  // by filling in the Actual income column for any month that differed.
  const incomeActual = hasIncomeActual
    ? Math.round(incomeActualTotal * 100) / 100
    : (incomePlanned > 0 ? incomePlanned : null);
  saveIncomeRowsToStorage(budgetMonthStr);

  const expenses = [];
  document.querySelectorAll('#expenseTableBody .expense-row').forEach(row => {
    const subcat    = row.querySelector('.exp-subcat').value.trim();
    if(!subcat) return;
    const isMort    = subcat === 'Mortgage';
    // Mortgage rows use a property dropdown as their "description"; store the
    // linked property's name so the saved label reads e.g. "Mortgage (PPOR)".
    const propSel   = isMort ? row.querySelector('.exp-mort-prop') : null;
    const desc      = isMort
      ? (propSel && propSel.value ? (_propertyById(propSel.value)?.name || '') : '')
      : (row.querySelector('.exp-desc')?.value.trim() || '');
    const cat       = desc ? `${subcat} (${desc})` : subcat;
    const budgetRaw = row.querySelector('.exp-budget').value.trim();
    const actualRaw = row.querySelector('.exp-actual').value.trim();
    const freq      = row.querySelector('.exp-freq').value;
    const mult      = FREQ_TO_MONTHLY[freq] ?? 1;
    const planned   = budgetRaw !== '' ? Math.round(parseFloat(budgetRaw) * mult * 100) / 100 : 0;
    const actual    = actualRaw !== '' ? Math.round(parseFloat(actualRaw) * mult * 100) / 100 : null;
    if(planned > 0 || actual != null){
      const e = { category: cat, planned, actual };
      if(isMort){
        e.property_id = propSel && propSel.value ? propSel.value : null;
        // Store each cell's resolved monthly principal (history-accurate) plus a
        // manual flag so overrides survive a reload; auto cells recompute.
        const prB = Math.round(Math.min(_cellPrincipalMonthly(row,'b'), planned || Infinity) * 100) / 100 || 0;
        const prA = actual != null ? (Math.round(Math.min(_cellPrincipalMonthly(row,'a'), actual || Infinity) * 100) / 100 || 0) : null;
        e.principal_planned = prB;
        e.principal         = prA;
        if(row.dataset.modeB === 'manual') e.pm_b = 1;
        if(row.dataset.modeA === 'manual') e.pm_a = 1;
      }
      expenses.push(e);
    }
  });

  // Warn if two rows resolve to the same category name (they'll be merged server-side)
  const catCounts = {};
  expenses.forEach(e => { catCounts[e.category] = (catCounts[e.category] || 0) + 1; });
  const dupes = Object.entries(catCounts).filter(([, n]) => n > 1).map(([k]) => k);
  if(dupes.length){
    const names = dupes.map(d => `"${d}"`).join(', ');
    if(!confirm(`You have duplicate entries for ${names}.\n\nThey'll be merged into one — add a description to each to keep them separate, or click OK to merge and save.`)) return;
  }

  // Save to localStorage (no server round-trip needed)
  _budgUpsertMonth(budgetMonthStr, { income_planned: incomePlanned, income_actual: incomeActual, expenses, notes: '' });
  if(status){ status.textContent = 'Saved ✓'; status.className = 'budget-save-status saved'; }
  loadBudgetYear(budgetYear);
  renderFireProgress();
  if(document.getElementById('tab-dashboard')?.classList.contains('active')) renderDashboard();
}

/** Load year overview from localStorage and render table */
function loadBudgetYear(year){
  budgetYear = year;
  const lbl = document.getElementById('budgetYearLabel');
  if(lbl) lbl.textContent = year;
  const wrap = document.getElementById('budgetYearTableWrap');
  if(!wrap) return;
  budgetYearData = budgGetYear(year);
  renderBudgetYearTable(budgetYearData);
}

/** Render the 12-column year overview table */
function renderBudgetYearTable(data){
  const wrap = document.getElementById('budgetYearTableWrap');
  if(!wrap) return;
  const months = data.months;
  const now = new Date();
  const thisYear = now.getFullYear(), thisMon = now.getMonth() + 1;

  const mStr   = i => `${budgetYear}-${String(i+1).padStart(2,'0')}`;
  const mCls   = i => {
    const hasData = months[i].income_actual !== null || months[i].expense_actual !== null;
    if(hasData) return 'bm-logged';
    const past = budgetYear < thisYear || (budgetYear === thisYear && i+1 <= thisMon);
    return past ? 'bm-past' : 'bm-future';
  };

  // Header row (+ year Total column)
  let thead = `<tr><th class="budget-row-th"></th>`;
  months.forEach((_, i) => {
    const cls = mCls(i);
    const dot = cls === 'bm-logged' ? '<span class="bm-dot">●</span>' : '';
    thead += `<th class="budget-month-th ${cls}" onclick="loadBudgetMonth('${mStr(i)}')">${MONTH_LABELS[i]}${dot}</th>`;
  });
  thead += `<th class="budget-month-th" style="border-left:2px solid #E5E7EB;">Total</th></tr>`;

  const sumOf = valFn => {
    const vals = months.map(valFn).filter(v => v !== null);
    return vals.length ? vals.reduce((s,v)=>s+v, 0) : null;
  };

  // Data row helper — trailing cell is the year total
  const mkRow = (label, valFn, colorFn) => {
    let r = `<tr><td class="budget-row-lbl">${label}</td>`;
    months.forEach((m, i) => {
      const v   = valFn(m);
      const cls = v === null ? 'bc-empty' : colorFn(v);
      r += `<td class="budget-cell ${cls}" onclick="loadBudgetMonth('${mStr(i)}')">${fmtDollar(v)}</td>`;
    });
    const tot = sumOf(valFn);
    const totCls = tot === null ? 'bc-empty' : colorFn(tot);
    return r + `<td class="budget-cell ${totCls}" style="border-left:2px solid #E5E7EB;font-weight:700;">${fmtDollar(tot)}</td></tr>`;
  };
  const secHdr = lbl =>
    `<tr><td class="budget-sec-hdr" colspan="14">${lbl}</td></tr>`;

  // Savings-rate row (% of income kept, actuals)
  const rateFor = (inc, net) => (inc !== null && inc > 0 && net !== null) ? net / inc : null;
  let rateRow = `<tr><td class="budget-row-lbl">Rate</td>`;
  months.forEach((m, i) => {
    const rt = rateFor(m.income_actual, m.net_actual);
    const cls = rt === null ? 'bc-empty' : rt >= 0 ? 'bc-pos' : 'bc-neg';
    rateRow += `<td class="budget-cell ${cls}" onclick="loadBudgetMonth('${mStr(i)}')">${rt === null ? '—' : Math.round(rt*100)+'%'}</td>`;
  });
  const totRate = rateFor(sumOf(m=>m.income_actual), sumOf(m=>m.net_actual));
  rateRow += `<td class="budget-cell ${totRate===null?'bc-empty':totRate>=0?'bc-pos':'bc-neg'}" style="border-left:2px solid #E5E7EB;font-weight:700;">${totRate===null?'—':Math.round(totRate*100)+'%'}</td></tr>`;

  const html = `
    <div class="data-table-wrap"><div class="tablewrap">
      <table class="budget-table">
        <thead>${thead}</thead>
        <tbody>
          ${secHdr('INCOME')}
          ${mkRow('Actual', m => m.income_actual, () => 'bc-data')}
          ${secHdr('EXPENSES')}
          ${mkRow('Actual', m => m.expense_actual, () => 'bc-data')}
          ${secHdr('NET SAVINGS')}
          ${mkRow('Actual', m => m.net_actual, v => v >= 0 ? 'bc-pos' : 'bc-neg')}
          ${secHdr('SAVINGS RATE')}
          ${rateRow}
        </tbody>
      </table>
    </div></div>`;

  wrap.innerHTML = html;
}

/** Derive the FIRE model's assumed monthly net savings from inputs + tax engine.
 *  = (current_income − estimated_tax − current_expenses) / 12
 *  This is what the model expects you to have left each month after earning,
 *  paying tax, and covering living costs — the pool deployed into stocks/super etc. */
/** Monthly interest on your home loan (PPOR) — a real living cost the bars
 *  subtract, but which Current Expenses excludes ("excl. mortgages"). We net it
 *  off the target so both sides treat mortgage interest the same way. Principal
 *  is neutral (it just moves cash → equity) so it isn't subtracted. */
function _pporMonthlyInterest(){
  return (state.property_list || [])
    .filter(p => _isPporNow(p))
    .reduce((s, p) => s + _loanMonthlySplit(p).interest, 0);
}

function fireModelTargetMonthly(){
  const grossAnnual  = Number(state.inputs.current_income   || 0);
  const expensesAnnual = Number(state.inputs.current_expenses || 0);
  if(!grossAnnual) return 0;
  const taxBreakdown = calcTax(grossAnnual, TAX_SETTINGS);
  // Take-home surplus the plan needs each month, PLUS employer super (auto FIRE
  // progress the bars count), MINUS home-loan interest (a living cost the bars
  // subtract but Current Expenses omits). Keeps target and bars like-for-like.
  const target = (grossAnnual - taxBreakdown.totalTax - expensesAnnual) / 12
               + _employerSuperMonthly()
               - _pporMonthlyInterest();
  return Math.max(0, target);
}

/* Expense sub-categories that AREN'T consumption — they move money into
   wealth (shares, super, home equity). For FIRE tracking these count toward
   progress, not against it, so we don't subtract them as "spending". */
const WEALTH_BUILDING_CATS = new Set([
  'Investment Contributions', 'Extra Super Contributions', 'Extra Mortgage / Offset'
]);

/** Money that built wealth in a saved budget month =
 *  actual income − consumption expenses (i.e. all expenses EXCEPT the
 *  wealth-building categories, which are savings routed into assets).
 *  Returns null when the month has no actuals logged. */
function _monthWealthBuilt(rec){
  if(!rec) return null;
  const inc = rec.income_actual ?? null;
  const exps = rec.expenses || [];
  const hasActual = inc != null || exps.some(e => e.actual != null);
  if(!hasActual) return null;
  const income = inc ?? rec.income_planned ?? 0;
  let consumption = 0;
  exps.forEach(e => {
    const { subcategory } = parseCategoryDescription(e.category || '');
    if(WEALTH_BUILDING_CATS.has(subcategory)) return;   // routed to assets, not spent
    consumption += (e.actual ?? e.planned ?? 0);
  });
  return Math.round((income - consumption) * 100) / 100;
}

/** Employer super guarantee (SG) per month — real FIRE progress that never
 *  appears in take-home pay, so it must be added to both the bars and the
 *  target for an apples-to-apples comparison. */
function _employerSuperMonthly(){
  const gross = Number(state.inputs.current_income || 0);
  let rate = (TAX_SETTINGS && TAX_SETTINGS.superRate) || 0.12;
  if(rate > 1) rate = rate / 100;   // stored as a percentage (e.g. 12), not a decimal
  return gross > 0 ? (gross * rate) / 12 : 0;
}

/** A property loan's current monthly split: interest (cost), principal (equity),
 *  and the scheduled payment (their sum). Interest = balance × rate; principal =
 *  payment − interest. Returns zeros for a property with no loan. */
function _loanMonthlySplit(p){
  const z = { interest:0, principal:0, payment:0 };
  if(!p) return z;
  const bal = Number(p.loan_balance_current ?? p.original_loan ?? 0);
  if(bal <= 0) return z;
  const r = (Number(p.interest_rate) || 0) / 12;
  const termM = (Number(p.loan_term_years) || 30) * 12;
  const now = new Date();
  const yb = Number(p.year_bought) || now.getFullYear();
  const elapsed = Math.max(0, (now.getFullYear() - yb) * 12 + now.getMonth());
  const n = Math.max(termM - elapsed, 12);            // remaining months
  const pmt = r > 0 ? bal * r / (1 - Math.pow(1 + r, -n)) : bal / n;
  const interest = bal * r;
  const rnd = v => Math.round(v * 100) / 100;
  return { interest: rnd(interest), principal: rnd(Math.max(0, pmt - interest)), payment: rnd(pmt) };
}
/** Monthly principal paid down on one property's loan (equity built). */
function _loanMonthlyPrincipal(p){ return _loanMonthlySplit(p).principal; }

/** Look up a property in the model by id. */
function _propertyById(id){
  if(id == null || id === '') return null;
  return (state.property_list || []).find(p => String(p.id) === String(id)) || null;
}

/** Aggregate monthly principal across owner-occupied loans (fallback used when a
 *  mortgage row isn't linked to a specific property). */
function _pporMonthlyPrincipal(){
  return (state.property_list || [])
    .filter(p => propertyOwnedNow(p) && _isPporNow(p))
    .reduce((sum, p) => sum + _loanMonthlyPrincipal(p), 0);
}

/** <option> list of properties for a mortgage row's link dropdown. A mortgage is
 *  always tied to a property, so there's no "unlinked" option — if none has been
 *  chosen yet we default to the first (preferring an owner-occupied home). */
function _propertyOptionsHtml(selId){
  const list = state.property_list || [];
  if(!list.length) return `<option value="">Add a property first</option>`;
  const def = selId || (list.find(p => _isPporNow(p)) || list[0]).id;
  return list
    .map(p => `<option value="${p.id}"${String(p.id)===String(def)?' selected':''}>${escapeHtml(p.name||('Property '+p.id))}</option>`)
    .join('');
}

/** Break a saved budget month's wealth-building into three FIRE-progress
 *  buckets that don't mix non-fungible dollars:
 *   • liquid  = take-home not consumed + share contributions (spendable)
 *   • superA  = employer SG + extra super (locked till preservation age)
 *   • equity  = home-loan principal + extra mortgage/offset (illiquid)
 *  Returns null when the month has no actuals. */
function _monthWealthSegments(rec){
  if(!rec) return null;
  const inc = rec.income_actual ?? null;
  const exps = rec.expenses || [];
  const hasActual = inc != null || exps.some(e => e.actual != null);
  if(!hasActual) return null;
  const income = inc ?? rec.income_planned ?? 0;
  let allExp = 0, invContrib = 0, extraSuper = 0, extraMortgage = 0, mortgagePrincipal = 0;
  exps.forEach(e => {
    const amt = (e.actual ?? e.planned ?? 0) || 0;
    const { subcategory } = parseCategoryDescription(e.category || '');
    allExp += amt;
    if(subcategory === 'Investment Contributions')     invContrib    += amt;
    else if(subcategory === 'Extra Super Contributions') extraSuper   += amt;
    else if(subcategory === 'Extra Mortgage / Offset')   extraMortgage += amt;
    else if(subcategory === 'Mortgage'){
      // Equity = principal portion of the payment. Prefer the split stored on
      // the row (actual, else budget); else auto-compute from the linked
      // property; cap at the payment amount used.
      const stored = (e.actual != null ? e.principal : null) ?? e.principal ?? e.principal_planned;
      let princ = (stored != null) ? Number(stored)
                : _loanMonthlyPrincipal(_propertyById(e.property_id));
      mortgagePrincipal += Math.min(Math.max(0, princ), amt);
    }
  });
  const principal = mortgagePrincipal;                              // principal inside mortgage payments
  const liquid = (income - allExp) + invContrib;                    // leftover cash + shares
  const superA = _employerSuperMonthly() + extraSuper;
  const equity = principal + extraMortgage;
  const r2 = v => Math.round(v * 100) / 100;
  return { liquid: r2(liquid), super: r2(superA), equity: r2(equity),
           total: r2(liquid + superA + equity) };
}

/**
 * Fetch the FIRE model in yearly mode and return a map of { year → monthlyNetTarget }.
 * monthlyNetTarget = (Salary_Total − Tax_Payable_Paid − Expenses_Total) / 12
 * This reflects salary growth, inflation-adjusted expenses, and super-rate changes
 * year-by-year as projected by the model.
 *
 * Results are cached — re-fetches only when inputs or tax settings change.
 */
async function fetchFireModelTargets(){
  const base = (state.apiBase || '').replace(/\/+$/, '');
  if(!base) return null;

  // Cache key: model inputs + FY (super rate changes affect net)
  const cacheKey = JSON.stringify({
    inputs: normalizeInputs(state.inputs),
    fy: TAX_SETTINGS.fy,
    superRate: TAX_SETTINGS.superRate
  });
  if(_fireProjectionsCache && _fireProjectionsCacheKey === cacheKey){
    return _fireProjectionsCache;
  }

  try {
    const payload = {
      inputs: normalizeInputs(state.inputs),
      property_list: state.property_list || [],
      life_events: state.life_events || [],
      stock_contribution_overrides: state.stock_contribution_overrides || [],
      display_month: false   // yearly rollup
    };
    const r = await fetch(`${base}/fire`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify(payload)
    });
    if(!r.ok) throw new Error('Model API ' + r.status);
    const result = await r.json();

    const map = {};
    (result.rows || []).forEach(row => {
      const year = Number(row.Year);
      if(year <= 0) return;

      // Use the monthly run-rate columns, not annual sums.
      // Salary_Monthly / Expenses_Monthly are end-of-year monthly values from
      // the model's aggregation ("last"), so they're unaffected by partial years
      // (e.g. 2026 only covering May–Dec still gives the correct monthly rate).
      const salaryMo   = Number(row.Salary_Monthly   || 0);
      const expensesMo = Number(row.Expenses_Monthly || 0);
      if(salaryMo <= 0) return;

      // Re-derive monthly tax via our ATO engine so it's consistent with the
      // rest of the app (same brackets, LITO, Medicare, MLS, HECS settings).
      const taxMo = calcTax(salaryMo * 12, TAX_SETTINGS).totalTax / 12;
      map[year]   = Math.max(0, salaryMo - taxMo - expensesMo);
    });

    _fireProjectionsCacheKey = cacheKey;
    _fireProjectionsCache    = map;
    return map;
  } catch(e){
    console.warn('fetchFireModelTargets failed:', e.message);
    return null;   // caller falls back to static formula
  }
}

/** Monthly savings target for a specific year.
 *  Uses model projections if available, otherwise the static formula. */
function fireModelTargetForYear(year, projections){
  if(projections && projections[year] != null) return projections[year];
  return fireModelTargetMonthly();   // static fallback
}

/** Invalidate the projections cache (call when inputs change) */
function invalidateFireProjections(){
  _fireProjectionsCache    = null;
  _fireProjectionsCacheKey = null;
}

/** FIRE progress: stat grid + monthly chart vs model-projected target */
async function renderFireProgress(){
  const wrap = document.getElementById('fireProgressContent');
  if(!wrap) return;

  const toM   = todayMonthStr();
  const fromD = new Date();
  fromD.setMonth(fromD.getMonth() - 11);
  const fromM = `${fromD.getFullYear()}-${String(fromD.getMonth()+1).padStart(2,'0')}`;

  // Read budget series from localStorage — instant, no API needed
  const seriesResp = budgGetSeries(fromM, toM);

  // Use cached projections if available; otherwise kick off background fetch and re-render when done
  let projections = _fireProjectionsCache;
  if(!projections){
    fetchFireModelTargets().then(p => {
      if(p){
        // Only re-render if this section is still visible
        const currentWrap = document.getElementById('fireProgressContent');
        if(currentWrap) renderFireProgress();
      }
    }).catch(()=>{});
  }

  const series = seriesResp.series || [];
  const logged = series.filter(m => m.net_actual !== null);

  if(!logged.length){
    wrap.innerHTML = '<div class="small muted" style="padding:8px 0">Log at least one month to see your FIRE progress.</div>';
    return;
  }

  // Per-month target — uses model projection for that year, falls back to static
  const monthTarget = m => fireModelTargetForYear(Number(m.month.split('-')[0]), projections);

  // Core stats
  const thisYear      = new Date().getFullYear();
  const curYearTarget = fireModelTargetForYear(thisYear, projections);

  const avgMo         = logged.reduce((s,m) => s + m.net_actual, 0) / logged.length;
  // Weighted avg target across logged months (accounts for year-over-year step-up)
  const avgTarget     = logged.reduce((s,m) => s + monthTarget(m), 0) / logged.length;
  const onTrack       = avgMo >= avgTarget;
  const pct           = avgTarget > 0 ? Math.max(0, Math.min(100, (avgMo / avgTarget) * 100)) : 0;
  const onTrackCount  = logged.filter(m => m.net_actual >= monthTarget(m)).length;

  // This month
  const thisM      = series.find(m => m.month === toM);
  const thisActual = thisM?.net_actual  ?? null;
  const thisBudget = thisM?.net_planned ?? null;
  const thisTarget = monthTarget({ month: toM });

  // Year-to-date (current calendar year, logged months only)
  const ytdLogged = series.filter(m => m.month?.startsWith(String(thisYear)) && m.net_actual !== null);
  const ytdActual = ytdLogged.reduce((s,m) => s + m.net_actual, 0);
  const ytdTarget = ytdLogged.reduce((s,m) => s + monthTarget(m), 0);

  const col  = (v, tgt) => v >= tgt ? '#059669' : v >= 0 ? '#F59E0B' : '#E11D48';
  const colV = v => v === null ? '#70736E' : v >= 0 ? '#059669' : '#E11D48';

  // Source label for target footnote
  const targetSource = projections
    ? `model projection for ${thisYear}`
    : 'static estimate (run model to improve)';

  wrap.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px;">

      <!-- Stat grid -->
      <div class="fp-stat-grid">
        <div class="fp-stat-box">
          <div class="fp-stat-label">Avg Monthly Saved</div>
          <div class="fp-stat-val" style="color:${col(avgMo,avgTarget)}">${fmtDollar(avgMo)}</div>
          <div class="fp-stat-sub">FIRE target ${fmtDollar(avgTarget)}/mo</div>
        </div>
        <div class="fp-stat-box">
          <div class="fp-stat-label">This Month</div>
          <div class="fp-stat-val" style="color:${thisActual!==null?col(thisActual,thisTarget):'#70736E'}">${fmtDollar(thisActual)}</div>
          <div class="fp-stat-sub">${thisBudget!==null?'budget '+fmtDollar(thisBudget):'not yet logged'}</div>
        </div>
        <div class="fp-stat-box">
          <div class="fp-stat-label">YTD Total Saved</div>
          <div class="fp-stat-val" style="color:${colV(ytdActual)}">${fmtDollar(ytdActual)}</div>
          <div class="fp-stat-sub">FIRE target ${fmtDollar(ytdTarget)}${ytdLogged.length?' ('+ytdLogged.length+' mo)':''}</div>
        </div>
        <div class="fp-stat-box">
          <div class="fp-stat-label">Months On Target</div>
          <div class="fp-stat-val">${onTrackCount}<span style="font-size:13px;font-weight:500;color:#6A716B"> / ${logged.length}</span></div>
          <div class="fp-stat-sub">last 12 months</div>
        </div>
      </div>

      <!-- Progress bar -->
      <div>
        <div class="fp-bar-track">
          <div class="fp-bar-fill ${onTrack?'':'fp-behind'}" style="width:${pct}%"></div>
          <span class="fp-bar-pct" style="
            left:${pct >= 100 ? '50%' : pct + '%'};
            transform:translate(${pct >= 100 ? '-50%' : pct >= 20 ? 'calc(-100% - 8px)' : '8px'}, -50%);
            color:${pct >= 20 ? '#fff' : '#5A625D'};
          ">${Math.round(pct)}%</span>
        </div>
      </div>

      <!-- Monthly chart -->
      <div>
        <div class="fp-chart-hdr">
          <span class="fp-chart-title">Net savings by month</span>
          <span class="small muted" style="font-size:10px;display:flex;align-items:center;gap:10px;">
            <span style="display:flex;align-items:center;gap:3px;">
              <span style="display:inline-block;width:10px;height:10px;background:#BFDBFE;border:1px solid #93C5FD;border-radius:2px;"></span>Budget
            </span>
            <span style="display:flex;align-items:center;gap:3px;">
              <span style="display:inline-block;width:10px;height:10px;background:#10B981;border-radius:2px;"></span><span style="display:inline-block;width:10px;height:10px;background:#F59E0B;border-radius:2px;margin-left:1px;"></span><span style="display:inline-block;width:10px;height:10px;background:#EF4444;border-radius:2px;margin-left:1px;"></span>Actual
            </span>
            <span style="display:flex;align-items:center;gap:3px;">
              <span style="display:inline-block;width:16px;height:0;border-top:2px dashed #059669;"></span>FIRE Target
            </span>
          </span>
        </div>
        <div class="fp-chart-wrap"><canvas id="fireProgressCanvas"></canvas></div>
      </div>

    </div>`;

  // Pass per-month target array to chart (steps up when year changes)
  const perMonthTargets = series.map(m => monthTarget(m));
  _renderFireChart(series, perMonthTargets);
}

/**
 * Render the monthly savings bar chart.
 * @param {Array} series   - month objects from the budget series API
 * @param {number[]} targets - per-month target values (may step up year-to-year)
 */
function _renderFireChart(series, targets){
  if(_fireChartInstance){ _fireChartInstance.destroy(); _fireChartInstance = null; }
  const canvas = document.getElementById('fireProgressCanvas');
  if(!canvas) return;

  const labels  = series.map(m => {
    const [y, mo] = m.month.split('-');
    return new Date(Number(y), Number(mo)-1, 1)
      .toLocaleDateString('en-AU', { month:'short', year:'2-digit' });
  });

  const planned = series.map(m => m.net_planned ?? 0);
  const actual  = series.map(m => m.net_actual  ?? null);

  // Colour each actual bar against its own month's target
  const actualBg = actual.map((v, i) => {
    const tgt = targets[i] ?? 0;
    return v === null ? 'transparent' :
           v >= tgt   ? '#10B981' :
           v >= 0     ? '#F59E0B' : '#EF4444';
  });

  // FIRE Target label — no embedded $ range here; the exact monthly figure
  // already shows per-point in the tooltip, so a min–max suffix just reads
  // as a confusing "two numbers in brackets" on hover.
  const targetLabel = 'FIRE Target';

  _fireChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          type: 'bar',
          label: 'Budget',
          data: planned,
          backgroundColor: '#BFDBFE',
          borderColor: '#93C5FD',
          borderWidth: 1,
          borderRadius: 3,
          order: 2,
        },
        {
          type: 'bar',
          label: 'Actual',
          data: actual,
          backgroundColor: actualBg,
          borderRadius: 3,
          order: 1,
        },
        {
          type: 'line',
          label: targetLabel,
          data: targets,
          borderColor: '#059669',
          borderWidth: 1.5,
          borderDash: [5, 3],
          pointRadius: 0,
          fill: false,
          tension: 0,
          order: 0,
        },
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode:'index', intersect:false },
      plugins: {
        legend: { display:false },
        tooltip: {
          callbacks: {
            label: ctx => {
              if(ctx.raw === null) return null;
              return ` ${ctx.dataset.label}: ${fmtDollar(ctx.raw)}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { font:{size:10}, color:'#5A625D' },
          grid:  { display:false }
        },
        y: {
          ticks: {
            callback: v => '$' + Math.round(v/1000) + 'k',
            font:{size:10}, color:'#6A716B'
          },
          grid:   { color:'#F0EDE8' },
          border: { color:'#E5E7EB' }
        }
      }
    }
  });
}


/* ── Income row helpers ─────────────────────────────── */

/** Build the income table — called once on init */
function initIncomeTable(){
  const wrap = document.getElementById('incomeTableWrap');
  if(!wrap) return;
  wrap.innerHTML = `
    <table class="expense-table">
      <colgroup>
        <col style="width:140px"><col style="width:120px">
        <col style="width:74px"><col style="width:74px">
        <col style="width:84px"><col style="width:58px">
        <col style="width:26px"><col style="width:26px">
      </colgroup>
      <thead><tr>
        <th>Source</th><th>Description</th>
        <th class="th-num">Budget</th><th class="th-num">Actual</th>
        <th>Frequency</th><th>Mode</th><th></th><th></th>
      </tr></thead>
      <tbody id="incomeTableBody"></tbody>
    </table>`;
}

/** Add one income row; pass data object to pre-fill */
function addIncomeRow(data){
  const tbody = document.getElementById('incomeTableBody');
  if(!tbody) return;
  const id       = ++_incRowCounter;
  const srcVal   = data?.source  || '';
  const descVal  = escapeHtml(data?.description || '');
  const budgVal  = (data?.budget  != null && data.budget  !== '') ? data.budget  : '';
  const actVal   = (data?.actual  != null && data.actual  !== '') ? data.actual  : '';
  const selFreq  = data?.freq || 'Monthly';
  const isGross  = data?.is_gross !== false; // default true
  const volB     = data?.vol_budget != null ? data.vol_budget : '';
  const volA     = data?.vol_actual != null ? data.vol_actual : '';

  const freqOpts = FREQ_OPTIONS.map(f => `<option${f===selFreq?' selected':''}>${f}</option>`).join('');
  const srcOpts  = INCOME_SOURCES.map(s =>
    `<option value="${escapeHtml(s)}"${s===srcVal?' selected':''}>${escapeHtml(s)}</option>`
  ).join('');

  const tbody2 = tbody; // alias for closure

  // Main row
  const tr = document.createElement('tr');
  tr.className = 'income-row';
  tr.dataset.rowId = id;
  tr.dataset.isGross = isGross ? '1' : '0';
  tr.innerHTML = `
    <td><select class="exp-input inc-source" onchange="incSourceChanged(${id})">${srcOpts}</select></td>
    <td><input class="exp-input inc-desc" type="text" placeholder="Note (optional)"
               value="${descVal}" oninput="incRowChanged(${id})"></td>
    <td><div class="dollar-wrap"><span class="inp-dollar">$</span>
        <input class="exp-input inc-budget budget-amount" type="text" inputmode="decimal" placeholder="0"
               title="Maths OK: 1200+340-50" value="${budgVal}" oninput="incRowChanged(${id})"></div></td>
    <td><div class="dollar-wrap"><span class="inp-dollar">$</span>
        <input class="exp-input inc-actual budget-amount" type="text" inputmode="decimal" placeholder="—"
               title="Maths OK: 1200+340-50" value="${actVal}" oninput="incRowChanged(${id})"></div></td>
    <td><select class="exp-input inc-freq" onchange="incRowChanged(${id})">${freqOpts}</select></td>
    <td><select class="inc-mode-sel" onchange="setIncomeMode(${id}, this.value)">
          <option value="gross"${isGross?' selected':''}>Gross</option>
          <option value="net"${!isGross?' selected':''}>Net</option>
        </select><span class="inc-mode-dash" style="display:none;color:#70736E;font-size:12px;" title="Gross/net breakdown (PAYG tax + employer super) only applies to salary income — enter the cash amount you actually receive">—</span></td>
    <td><button class="inc-expand-btn" id="incExp_${id}" onclick="toggleIncomeExpand(${id})"
                style="${isGross?'':'display:none'}" title="Show breakdown">&#9654;</button></td>
    <td><button class="exp-del" onclick="deleteIncomeRow(${id})" title="Remove">×</button></td>`;
  tbody.appendChild(tr);

  // Sub-rows (tax, employer super, voluntary super, net cash)
  const mkSub = (subId, label, inputClass, inputVal, isNet) => {
    const sr = document.createElement('tr');
    sr.className = 'income-sub-row';
    sr.id = `incSub_${id}_${subId}`;
    sr.style.display = 'none';
    const valCls = isNet ? 'inc-sub-net' : 'inc-sub-auto';
    if(inputClass){
      sr.innerHTML = `
        <td class="inc-sub-lbl" colspan="2">${label}</td>
        <td><div class="dollar-wrap"><span class="inp-dollar">$</span>
            <input class="exp-input ${inputClass}_b budget-amount" type="text" inputmode="decimal" placeholder="0"
                   value="${inputVal?.b ?? ''}" oninput="incRowChanged(${id})"></div></td>
        <td><div class="dollar-wrap"><span class="inp-dollar">$</span>
            <input class="exp-input ${inputClass}_a budget-amount" type="text" inputmode="decimal" placeholder="—"
                   value="${inputVal?.a ?? ''}" oninput="incRowChanged(${id})"></div></td>
        <td colspan="3" class="inc-sub-empty"></td>`;
    } else {
      sr.innerHTML = `
        <td class="inc-sub-lbl" colspan="2">${label}</td>
        <td class="${valCls}" id="incSub_${id}_${subId}_b">—</td>
        <td class="${valCls}" id="incSub_${id}_${subId}_a">—</td>
        <td colspan="3" class="inc-sub-empty"></td>`;
    }
    return sr;
  };

  tbody.appendChild(mkSub('tax',   'Tax withheld (est.)',   null, null, false));
  tbody.appendChild(mkSub('emp',   'Employer super — paid on top (est.)', null, null, false));
  tbody.appendChild(mkSub('vol',   'Voluntary super',       'inc-vol', { b: volB, a: volA }, false));
  tbody.appendChild(mkSub('net',   'Net cash (take-home)',  null, null, true));

  // Gross/net only applies to salary-type income — sync visibility now
  _syncIncModeUI(id);

  // Auto-expand if gross and has data (salary rows only — others were just
  // forced to net by the sync above)
  if(tr.dataset.isGross === '1' && (budgVal !== '' || actVal !== '')){
    toggleIncomeExpand(id);
  }
}

/* Sources where a gross amount, PAYG withholding and employer super make
   sense. Everything else (rent, dividends, interest, business…) is entered
   as the cash you actually receive — no gross/net mode. */
const _INC_SALARY_SOURCES = new Set(['Salary / Wages', 'Partner Salary / Wages', 'Bonus / Commission']);

function _syncIncModeUI(id){
  const row = document.querySelector(`#incomeTableBody [data-row-id="${id}"]`);
  if(!row) return;
  const isSalary = _INC_SALARY_SOURCES.has(row.querySelector('.inc-source')?.value || '');
  const modeSel = row.querySelector('.inc-mode-sel');
  const dash    = row.querySelector('.inc-mode-dash');
  if(modeSel) modeSel.style.display = isSalary ? '' : 'none';
  if(dash)    dash.style.display    = isSalary ? 'none' : '';
  if(!isSalary && row.dataset.isGross === '1'){
    // force net: amount = cash received; hides breakdown sub-rows
    if(modeSel) modeSel.value = 'net';
    setIncomeMode(id, 'net');
  }
}

/** Source dropdown changed — re-evaluate whether gross/net applies */
function incSourceChanged(id){
  _syncIncModeUI(id);
  incRowChanged(id);
}

/** Trigger summary + autosave when any income field changes */
function incRowChanged(id){
  updateIncomeBreakdown(id);
  updateBudgetSummary();
  scheduleAutosave();
}

/** Switch a row between Gross and Net mode */
function setIncomeMode(id, mode){
  const tbody = document.getElementById('incomeTableBody');
  const row   = tbody?.querySelector(`[data-row-id="${id}"]`);
  if(!row) return;
  const isGross = mode === 'gross';
  row.dataset.isGross = isGross ? '1' : '0';
  const expBtn = document.getElementById(`incExp_${id}`);
  if(expBtn) expBtn.style.display = isGross ? '' : 'none';
  if(!isGross) _hideIncSubrows(id);
  incRowChanged(id);
}

/** Expand / collapse the breakdown sub-rows */
function toggleIncomeExpand(id){
  const btn    = document.getElementById(`incExp_${id}`);
  const isOpen = btn?.classList.contains('open');
  if(isOpen){
    _hideIncSubrows(id);
  } else {
    ['tax','emp','vol','net'].forEach(k => {
      const el = document.getElementById(`incSub_${id}_${k}`);
      if(el) el.style.display = '';
    });
    if(btn) btn.classList.add('open');
    updateIncomeBreakdown(id);
  }
}

function _hideIncSubrows(id){
  ['tax','emp','vol','net'].forEach(k => {
    const el = document.getElementById(`incSub_${id}_${k}`);
    if(el) el.style.display = 'none';
  });
  const btn = document.getElementById(`incExp_${id}`);
  if(btn) btn.classList.remove('open');
}

/** Recalculate and render the tax/super/net breakdown for one row */
function updateIncomeBreakdown(id){
  const tbody = document.getElementById('incomeTableBody');
  const row   = tbody?.querySelector(`[data-row-id="${id}"]`);
  if(!row || row.dataset.isGross !== '1') return;

  // Only update if sub-rows are visible
  if(document.getElementById(`incSub_${id}_tax`)?.style.display === 'none') return;

  const mult = FREQ_TO_MONTHLY[row.querySelector('.inc-freq')?.value] ?? 1;
  const fmt  = v => '$' + Math.round(v).toLocaleString();

  const calc = (rawVal, volSelector) => {
    if(rawVal === '' || rawVal == null) return null;
    const monthly    = parseFloat(rawVal) * mult;
    const annual     = monthly * 12;
    const tax        = calcTax(annual, TAX_SETTINGS);
    // MLS isn't withheld by payroll — exclude it so this matches payslips.
    const taxM       = (tax.totalTax - tax.mls) / 12;
    const superEmpM  = annual * (TAX_SETTINGS.superRate / 100) / 12;
    const volEl      = document.querySelector(volSelector);
    const volM       = parseFloat(volEl?.value || 0) || 0;
    // Employer super is paid ON TOP of salary — shown for info, not deducted.
    const netM       = monthly - taxM - volM;
    return { taxM, superEmpM, netM: Math.max(0, netM) };
  };

  const bRaw  = row.querySelector('.inc-budget')?.value.trim();
  const aRaw  = row.querySelector('.inc-actual')?.value.trim();
  const bCalc = calc(bRaw, `#incSub_${id}_vol .inc-vol_b`);
  const aCalc = calc(aRaw, `#incSub_${id}_vol .inc-vol_a`);

  const set = (elId, val) => {
    const el = document.getElementById(elId);
    if(el) el.textContent = val != null ? fmt(val) : '—';
  };

  set(`incSub_${id}_tax_b`,  bCalc?.taxM);
  set(`incSub_${id}_tax_a`,  aCalc?.taxM);
  set(`incSub_${id}_emp_b`,  bCalc?.superEmpM);
  set(`incSub_${id}_emp_a`,  aCalc?.superEmpM);
  set(`incSub_${id}_net_b`,  bCalc?.netM);
  set(`incSub_${id}_net_a`,  aCalc?.netM);
}

/** Remove an income row and its sub-rows — always keeps at least one */
function deleteIncomeRow(id){
  const tbody = document.getElementById('incomeTableBody');
  if(!tbody) return;
  if(tbody.querySelectorAll('.income-row').length <= 1) return;
  const row = tbody.querySelector(`[data-row-id="${id}"]`);
  if(!row) return;
  // Remove sub-rows
  ['tax','emp','vol','net'].forEach(k => {
    document.getElementById(`incSub_${id}_${k}`)?.remove();
  });
  row.remove();
  updateBudgetSummary();
  scheduleAutosave();
}

/**
 * For a gross-mode income row, derive the net monthly cash after tax + employer super +
 * voluntary super sacrifice. For a net-mode row, return the face value.
 * Returns { budgetNet, actualNet } — either can be null if the field is blank.
 */
function _calcIncRowNets(row){
  const id      = row.dataset.rowId;
  const bRaw    = row.querySelector('.inc-budget')?.value.trim() ?? '';
  const aRaw    = row.querySelector('.inc-actual')?.value.trim() ?? '';
  const m       = FREQ_TO_MONTHLY[row.querySelector('.inc-freq')?.value] ?? 1;
  const isGross = row.dataset.isGross === '1';

  if(!isGross){
    return {
      budgetNet: bRaw !== '' ? parseFloat(bRaw) * m : null,
      actualNet: aRaw !== '' ? parseFloat(aRaw) * m : null,
      budgetGross: null, actualGross: null
    };
  }

  const deduct = (rawVal, volSelector) => {
    if(rawVal === '') return null;
    const monthly   = parseFloat(rawVal) * m;
    const annual    = monthly * 12;
    const tax       = calcTax(annual, TAX_SETTINGS);
    // Withholding estimate: MLS isn't withheld by payroll (assessed at tax
    // time), so exclude it — this matches real payslips.
    const taxM      = (tax.totalTax - tax.mls) / 12;
    const volEl     = document.querySelector(volSelector);
    const volM      = parseFloat(volEl?.value || 0) || 0;
    // Employer super is paid ON TOP of salary — it never reduces take-home.
    // Only tax and voluntary (salary-sacrifice) contributions come out.
    return Math.max(0, monthly - taxM - volM);
  };

  const budgetGross = bRaw !== '' ? parseFloat(bRaw) * m : null;
  const actualGross = aRaw !== '' ? parseFloat(aRaw) * m : null;
  return {
    budgetNet: deduct(bRaw, `#incSub_${id}_vol .inc-vol_b`),
    actualNet: deduct(aRaw, `#incSub_${id}_vol .inc-vol_a`),
    budgetGross, actualGross
  };
}

/** Recalculate the summary strip from live table values */
function updateBudgetSummary(){
  let incP = 0, incA = 0, hasIncA = false;
  let incGrossP = 0, incGrossA = 0, anyGross = false;
  document.querySelectorAll('#incomeTableBody .income-row').forEach(row => {
    const { budgetNet, actualNet, budgetGross, actualGross } = _calcIncRowNets(row);
    if(budgetNet !== null) incP += budgetNet;
    if(actualNet !== null){ incA += actualNet; hasIncA = true; }
    if(budgetGross !== null){ incGrossP += budgetGross; anyGross = true; }
    if(actualGross !== null) incGrossA += actualGross;
  });

  let expP = 0, expA = 0, hasExpA = false;
  document.querySelectorAll('#expenseTableBody .expense-row').forEach(row => {
    const b = row.querySelector('.exp-budget').value.trim();
    const a = row.querySelector('.exp-actual').value.trim();
    const m = FREQ_TO_MONTHLY[row.querySelector('.exp-freq').value] ?? 1;
    if(b !== '') expP += parseFloat(b) * m;
    if(a !== ''){ expA += parseFloat(a) * m; hasExpA = true; }
  });

  const netP  = incP - expP;
  const netA  = incA - expA;
  const rateP = incP > 0 ? netP / incP : null;
  const rateA = (hasIncA && incA > 0) ? netA / incA : null;

  const fmt  = v => v === 0 ? '—' : (v < 0 ? '-$' : '$') + Math.abs(Math.round(v)).toLocaleString();
  const fmtR = v => v === null ? '' : Math.round(v * 100) + '%';
  const setEl = (id, text, cls='bsi-val') => {
    const el = document.getElementById(id);
    if(el){ el.textContent = text; el.className = cls; }
  };

  setEl('bsiIncome',   fmt(incP));
  setEl('bsiIncomeA',  hasIncA ? `Actual ${fmt(incA)}` : '', 'bsi-sub');
  // Show gross note when any row is in gross mode
  const grossEl = document.getElementById('bsiIncomeGross');
  if(grossEl){
    grossEl.textContent = anyGross ? `Gross ${fmt(incGrossP)}` : '';
    grossEl.className = 'bsi-gross';
  }
  setEl('bsiExpenses', fmt(expP));
  setEl('bsiExpensesA',hasExpA ? `Actual ${fmt(expA)}` : '', 'bsi-sub');

  const netCls = `bsi-val${netP > 0 ? ' bsi-pos' : netP < 0 ? ' bsi-neg' : ''}`;
  setEl('bsiNet',  fmt(netP), netCls);
  const netActualCls = (hasIncA || hasExpA) ? (netA < 0 ? 'bsi-sub bsi-neg' : 'bsi-sub') : 'bsi-sub';
  setEl('bsiNetA', (hasIncA || hasExpA) ? `Actual ${fmt(netA)}` : '', netActualCls);

  // Wealth-linked FIRE readout: how this month's saving pace translates to
  // your actual FIRE timeline (real current NW + FIRE number, 5% real
  // return), and what slice of the remaining gap this month closes.
  const tgtEl = document.getElementById('bsiNetTarget');
  if (tgtEl){
    const rawNet = (hasIncA || hasExpA) ? netA : netP;
    // Money routed into shares/super/extra-mortgage isn't spending — add it
    // back so the FIRE pace reflects wealth built, not just cash left over.
    // Also add employer super (never in take-home) and home-loan principal
    // (the equity slice of the mortgage), matching the stacked Overview chart.
    let wealthAddBack = 0, principalAdd = 0;
    document.querySelectorAll('#expenseTableBody .expense-row').forEach(row => {
      const sub = row.querySelector('.exp-subcat')?.value?.trim();
      const freqMult = FREQ_TO_MONTHLY[row.querySelector('.exp-freq')?.value] ?? 1;
      const raw = (hasExpA ? row.querySelector('.exp-actual')?.value : '') || row.querySelector('.exp-budget')?.value || '';
      const v = (parseFloat(String(raw).replace(/[,$]/g,'')) || 0) * freqMult;
      if(WEALTH_BUILDING_CATS.has(sub)) wealthAddBack += v;
      else if(sub === 'Mortgage') principalAdd += Math.min(_mortgageRowPrincipalMonthly(row), v);
    });
    const liveNet = rawNet == null ? null
                  : rawNet + wealthAddBack + _employerSuperMonthly() + principalAdd;
    const fireN = _dashFireNumber();
    const nw = _dashCurrentNW();
    tgtEl.style.color = '#059669';
    if (fireN && liveNet !== null && liveNet > 0 && (incP || incA)){
      if (nw >= fireN){
        tgtEl.textContent = 'FIRE number reached 🎉';
      } else {
        const r = 0.05, c = liveNet * 12;
        const yrs = Math.log((fireN * r + c) / (Math.max(nw, 0) * r + c)) / Math.log(1 + r);
        const gapPct = (liveNet / (fireN - nw)) * 100;
        const yrsStr = yrs < 1 ? '<1 yr' : `${Math.round(yrs)} yrs`;
        const gapStr = gapPct >= 0.05 ? ` · closes ${gapPct < 1 ? gapPct.toFixed(1) : Math.round(gapPct)}% of your FIRE gap` : '';
        tgtEl.textContent = `≈ ${yrsStr} to FIRE at this pace${gapStr}`;
      }
    } else {
      tgtEl.textContent = '';
    }
  }

  const rateCls = `bsi-val${rateP !== null && rateP > 0 ? ' bsi-pos' : rateP !== null && rateP < 0 ? ' bsi-neg' : ''}`;
  setEl('bsiRate',  rateP !== null ? fmtR(rateP) : '—', rateCls);
  const rateActualCls = rateA !== null && rateA < 0 ? 'bsi-sub bsi-neg' : 'bsi-sub';
  setEl('bsiRateA', rateA !== null ? `Actual ${fmtR(rateA)}` : '', rateActualCls);

  renderExpenseChart();
}

/** Render vertical stacked bar chart of expense budget vs actual, grouped by major category */
function renderExpenseChart(){
  const wrap = document.getElementById('expenseChartWrap');
  if(!wrap) return;

  // All major category labels in defined order
  const ALL_GROUPS = [...new Set(BUDGET_CATS.map(c => c.group))];

  // Aggregate entered rows by major category
  const groups = {};
  document.querySelectorAll('#expenseTableBody .expense-row').forEach(row => {
    const cat  = row.querySelector('.exp-cat')?.value.trim() || 'Other';
    const bRaw = row.querySelector('.exp-budget')?.value.trim();
    const aRaw = row.querySelector('.exp-actual')?.value.trim();
    const mult = FREQ_TO_MONTHLY[row.querySelector('.exp-freq')?.value] ?? 1;
    const planned = bRaw !== '' ? parseFloat(bRaw) * mult : 0;
    const actual  = aRaw !== '' ? parseFloat(aRaw) * mult : null;
    if(!groups[cat]) groups[cat] = { planned: 0, actual: null };
    groups[cat].planned += planned;
    if(actual !== null) groups[cat].actual = (groups[cat].actual ?? 0) + actual;
  });

  // Build rows for all groups (zero for empty ones)
  const rows = ALL_GROUPS.map(label => {
    const v = groups[label] || { planned: 0, actual: null };
    return { label, planned: Math.round(v.planned * 100) / 100, actual: v.actual !== null ? Math.round(v.actual * 100) / 100 : null };
  });

  if(!document.getElementById('expenseBarCanvas')){
    wrap.innerHTML = '<canvas id="expenseBarCanvas"></canvas>';
  }
  const canvas = document.getElementById('expenseBarCanvas');
  const hasActual = rows.some(r => r.actual !== null);

  // Stacked: Spent (green) + Remaining (light blue) + Overspend (red)
  const spent     = rows.map(r => r.actual !== null ? Math.min(r.actual, r.planned) : 0);
  const remaining = rows.map(r => {
    const s = r.actual !== null ? Math.min(r.actual, r.planned) : 0;
    return Math.max(0, r.planned - s);
  });
  const overspend = rows.map(r => r.actual !== null ? Math.max(0, r.actual - r.planned) : 0);
  const anyOver   = overspend.some(v => v > 0);

  const datasets = hasActual ? [
    { label:'Spent',       data:spent,     backgroundColor:'#10B981', stack:'s', borderSkipped:false },
    { label:'Remaining',   data:remaining, backgroundColor:'#BFDBFE', stack:'s', borderSkipped:false },
    ...(anyOver ? [{ label:'Over budget', data:overspend, backgroundColor:'#FCA5A5', stack:'s', borderSkipped:false }] : [])
  ] : [
    { label:'Budget', data:rows.map(r => r.planned), backgroundColor:'#3B82F6', stack:'s', borderRadius:4 }
  ];

  wrap.style.height = '260px';

  if(_expChartInstance){ _expChartInstance.destroy(); _expChartInstance = null; }
  _expChartInstance = new Chart(canvas, {
    type: 'bar',
    data: { labels: rows.map(r => r.label), datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position:'bottom', labels:{ font:{size:10}, boxWidth:10, padding:10, color:'#5A625D' } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: $${Math.round(ctx.raw).toLocaleString()}` } }
      },
      scales: {
        x: {
          stacked: true,
          ticks: { font:{size:10}, color:'#5A625D', maxRotation:30 },
          grid: { display:false }
        },
        y: {
          stacked: true,
          ticks: { callback: v => '$' + Math.round(v).toLocaleString(), font:{size:10}, color:'#6A716B' },
          grid: { color:'#F0EDE8' }, border:{ color:'#E5E7EB' }
        }
      }
    }
  });
}

/** Persist income row detail into wm_budget month record */
function saveIncomeRowsToStorage(monthStr){
  const rows = [];
  document.querySelectorAll('#incomeTableBody .income-row').forEach(row => {
    const id   = row.dataset.rowId;
    const src  = row.querySelector('.inc-source').value.trim();
    const desc = row.querySelector('.inc-desc')?.value.trim() || '';
    const budg = row.querySelector('.inc-budget').value.trim();
    const act  = row.querySelector('.inc-actual').value.trim();
    const freq = row.querySelector('.inc-freq').value;
    const isGross = row.dataset.isGross !== '0';
    const volB = document.querySelector(`#incSub_${id}_vol .inc-vol_b`)?.value.trim() ?? '';
    const volA = document.querySelector(`#incSub_${id}_vol .inc-vol_a`)?.value.trim() ?? '';
    if(budg || act) rows.push({
      source: src, description: desc, budget: budg, actual: act, freq,
      is_gross: isGross, vol_budget: volB, vol_actual: volA
    });
  });
  _budgUpsertMonth(monthStr, { income_rows: rows });
}

/** Restore income row detail from wm_budget month record */
function loadIncomeRowsFromStorage(monthStr){
  try{
    const rec = _budgLoad().months[monthStr];
    if(rec && rec.income_rows && rec.income_rows.length) return rec.income_rows;
    // Fallback: check legacy budg_inc_* key and migrate if found
    const legacy = JSON.parse(localStorage.getItem(`budg_inc_${monthStr}`) || 'null');
    if(legacy && legacy.length){ _budgUpsertMonth(monthStr, { income_rows: legacy }); return legacy; }
    return [];
  } catch(_){ return []; }
}

/* ── Expense table ──────────────────────────────────── */

/** Returns <option> tags for a subcategory select, pre-selecting `selected` */
function getSubcatSelectOpts(group, selected){
  const cats = BUDGET_CATS.filter(c => c.group === group && c.enabled !== false);
  let opts = cats.map(c =>
    `<option value="${escapeHtml(c.label)}"${c.label===selected?' selected':''}>${escapeHtml(c.label)}</option>`
  ).join('');
  // If the saved value isn't in the standard list, preserve it as the first option
  if(selected && !cats.find(c => c.label === selected)){
    opts = `<option value="${escapeHtml(selected)}" selected>${escapeHtml(selected)}</option>` + opts;
  }
  return opts;
}

/** Build the expense table inside the budget editor card — called once on init */
function initExpenseTable(){
  const wrap = document.getElementById('budgetExpenseWrap');
  if(!wrap) return;
  wrap.innerHTML = `
    <table class="expense-table">
      <colgroup>
        <col style="width:130px"><col style="width:165px"><col style="width:144px"><col style="width:68px">
        <col style="width:68px"><col style="width:90px"><col style="width:30px">
      </colgroup>
      <thead><tr>
        <th>Category</th><th>Sub-category</th><th>Description</th>
        <th class="th-num">Budget</th><th class="th-num">Actual</th>
        <th>Frequency</th><th></th>
      </tr></thead>
      <tbody id="expenseTableBody"></tbody>
    </table>`;
}

/** Called when the category dropdown changes — repopulates the subcategory select */
/* One colour per major category — used as a row accent so groups are
   scannable at a glance (sub-categories share their group's colour). */
const BUDGET_GROUP_COLORS = {
  'Housing':       '#0EA5E9',
  'Transport':     '#F59E0B',
  'Food & Drink':  '#10B981',
  'Utilities':     '#84CC16',
  'Health':        '#EF4444',
  'Insurance':     '#8B5CF6',
  'Entertainment': '#EC4899',
  'Personal':      '#14B8A6',
  'Education':     '#6366F1',
  'Financial':     '#0891B2',
  'Other':         '#9CA3AF',
};

function _applyExpRowColor(row){
  const g = row.querySelector('.exp-cat')?.value;
  const c = BUDGET_GROUP_COLORS[g] || '#9CA3AF';
  // Category colour is carried by the whole-row tint (data, not decoration);
  // the accent border was a side-stripe tell — the tint alone reads the group.
  row.style.background = c + '14';                    // ~8% tint across the row
  row.style.setProperty('--row-tint', c + '10');     // inputs inherit it too
}

/** Reorder expense rows: category group order, then sub-category A→Z */
function sortExpenseRows(){
  const tbody = document.getElementById('expenseTableBody');
  if(!tbody) return;
  const groups = [...new Set(BUDGET_CATS.filter(c => c.enabled !== false).map(c => c.group))];
  const rows = [...tbody.querySelectorAll('.expense-row')];
  rows.sort((a, b) => {
    const ga = groups.indexOf(a.querySelector('.exp-cat')?.value);
    const gb = groups.indexOf(b.querySelector('.exp-cat')?.value);
    if (ga !== gb) return ga - gb;
    const sa = a.querySelector('.exp-subcat')?.value || '';
    const sb = b.querySelector('.exp-subcat')?.value || '';
    return sa.localeCompare(sb);
  });
  rows.forEach(r => tbody.appendChild(r));
}

function expCatChanged(id){
  const tbody = document.getElementById('expenseTableBody');
  if(!tbody) return;
  const row = tbody.querySelector(`[data-row-id="${id}"]`);
  if(!row) return;
  const group    = row.querySelector('.exp-cat').value;
  const subSel   = row.querySelector('.exp-subcat');
  if(subSel) subSel.innerHTML = getSubcatSelectOpts(group, '');
  _applyExpRowColor(row);
  sortExpenseRows();
  updateBudgetSummary();
  scheduleAutosave();
}

/** Add one expense row; pass a data object to pre-fill */
function addExpenseRow(data){
  const tbody = document.getElementById('expenseTableBody');
  if(!tbody) return;

  const id      = ++_expRowCounter;
  const groups  = [...new Set(BUDGET_CATS.filter(c => c.enabled !== false).map(c => c.group))];
  const selGrp  = data && data.group ? data.group : groups[0];
  const grpOpts = groups.map(g =>
    `<option value="${escapeHtml(g)}"${g===selGrp?' selected':''}>${escapeHtml(g)}</option>`
  ).join('');

  // Pass the RAW sub-category — getSubcatSelectOpts escapes exactly once.
  // Pre-escaping here double-escaped "&" labels ("Travel &amp;amp; Holidays")
  // and broke matching against the real label, compounding every save/load.
  // The while-loop repairs values already corrupted by previous versions.
  let subVal = data ? (data.subcategory || '') : '';
  while (/&amp;/.test(subVal)) subVal = subVal.replace(/&amp;/g, '&');
  const expDescVal = data ? escapeHtml(data.description || '') : '';
  const budgVal = (data && data.budget  !== '' && data.budget  != null) ? data.budget  : '';
  const actVal  = (data && data.actual  !== '' && data.actual  != null) ? data.actual  : '';
  const selFreq = (data && data.freq)   ? data.freq : 'Monthly';
  const freqOpts = FREQ_OPTIONS.map(f =>
    `<option${f===selFreq?' selected':''}>${f}</option>`
  ).join('');

  const tr = document.createElement('tr');
  tr.className     = 'expense-row';
  tr.dataset.rowId = id;
  tr.innerHTML = `
    <td><select class="exp-input exp-cat" onchange="expCatChanged(${id})">${grpOpts}</select></td>
    <td><select class="exp-input exp-subcat" onchange="expSubcatChanged(${id})">
          ${getSubcatSelectOpts(selGrp, subVal)}
        </select></td>
    <td><input  class="exp-input exp-desc" type="text" placeholder="Note (optional)"
                value="${expDescVal}" oninput="expRowChanged(${id})"></td>
    <td><div class="dollar-wrap"><span class="inp-dollar">$</span><input class="exp-input exp-budget budget-amount" type="text" inputmode="decimal" placeholder="0"
                title="Maths OK: 1200+340-50" value="${budgVal}" oninput="expRowChanged(${id})"></div></td>
    <td><div class="dollar-wrap"><span class="inp-dollar">$</span><input class="exp-input exp-actual budget-amount" type="text" inputmode="decimal" placeholder="—"
                title="Maths OK: 1200+340-50" value="${actVal}" oninput="expRowChanged(${id})"></div></td>
    <td><select class="exp-input exp-freq" onchange="expRowChanged(${id})">${freqOpts}</select></td>
    <td><button class="exp-del" onclick="deleteExpenseRow(${id})" title="Remove row">×</button></td>`;

  if(data){
    if(data.property_id != null && data.property_id !== '') tr.dataset.propertyId = data.property_id;
    // Restore each cell's split: a stored monthly principal + manual flag means
    // the user overrode it; otherwise the cell auto-tracks the linked loan.
    if(data.principal_planned != null) tr.dataset.prinB = data.principal_planned;
    if(data.principal        != null) tr.dataset.prinA = data.principal;
    tr.dataset.modeB = data.pm_b ? 'manual' : 'auto';
    tr.dataset.modeA = data.pm_a ? 'manual' : 'auto';
  }
  tbody.appendChild(tr);
  _applyExpRowColor(tr);
  _setupMortgageRow(tr);
}

/** Trigger summary + autosave when any expense field changes */
function expRowChanged(id){
  const row = document.querySelector(`#expenseTableBody [data-row-id="${id}"]`);
  if(row && row.querySelector('.exp-subcat')?.value?.trim() === 'Mortgage') _recalcMortgageRow(row);
  updateBudgetSummary();
  scheduleAutosave();
}

/** Sub-category changed — reconfigure mortgage UI, re-sort, then normal update */
function expSubcatChanged(id){
  const row = document.querySelector(`#expenseTableBody [data-row-id="${id}"]`);
  if(row) _setupMortgageRow(row);
  sortExpenseRows();
  expRowChanged(id);
}

/* ── Mortgage rows: always linked to a property, split into interest+principal ─
   A Mortgage row's description is a property dropdown (a mortgage is always tied
   to one property). Both the Budget and Actual cells show only the TOTAL, with a
   split button that opens a two-field editor (Interest + Principal). Editing
   either field re-sums to the total shown in the cell. Only principal counts as
   FIRE-building equity. Per-cell state on the <tr>:
     data-property-id, data-prin-b/-a (monthly principal), data-mode-b/-a(auto|manual)
   ─────────────────────────────────────────────────────────────────────────── */

const _MORT_CELL = {
  b: { sel:'.exp-budget', modeKey:'modeB', prinKey:'prinB', label:'Budget' },
  a: { sel:'.exp-actual', modeKey:'modeA', prinKey:'prinA', label:'Actual' }
};
function _rowFreqMult(row){ return FREQ_TO_MONTHLY[row.querySelector('.exp-freq')?.value] ?? 1; }

/** A mortgage cell's total, in MONTHLY dollars. */
function _cellMonthlyTotal(row, which){
  const raw = row.querySelector(_MORT_CELL[which].sel)?.value || '';
  return (parseFloat(String(raw).replace(/[,$]/g,'')) || 0) * _rowFreqMult(row);
}
/** A mortgage cell's principal, in MONTHLY dollars (manual override, else auto
 *  from the linked loan), capped at the cell's total. */
function _cellPrincipalMonthly(row, which){
  const c = _MORT_CELL[which];
  const total = _cellMonthlyTotal(row, which);
  if(row.dataset[c.modeKey] === 'manual')
    return Math.min(Number(row.dataset[c.prinKey]) || 0, total || Infinity);
  const auto = _loanMonthlyPrincipal(_propertyById(row.querySelector('.exp-mort-prop')?.value));
  return Math.min(auto, total || auto);
}
/** Actual principal if an actual is present, else budget's — used elsewhere. */
function _mortgageRowPrincipalMonthly(row){
  const hasA = (row.querySelector('.exp-actual')?.value || '').trim() !== '';
  return _cellPrincipalMonthly(row, hasA ? 'a' : 'b');
}

/** Configure (or tear down) a Mortgage row's property dropdown + split buttons. */
function _setupMortgageRow(row){
  if(!row) return;
  const id = row.dataset.rowId;
  const isMort = row.querySelector('.exp-subcat')?.value?.trim() === 'Mortgage';
  row.classList.toggle('is-mortgage', isMort);

  if(isMort){
    // description input → property dropdown (always linked)
    const descInp = row.querySelector('input.exp-desc');
    if(descInp){
      const sel = document.createElement('select');
      sel.className = 'exp-input exp-mort-prop';
      sel.title = 'The property this mortgage is for — used to split interest vs principal';
      sel.innerHTML = _propertyOptionsHtml(row.dataset.propertyId || '');
      sel.setAttribute('onchange', `mortgagePropChanged(${id})`);
      descInp.replaceWith(sel);
    }
    if(!row.dataset.propertyId) row.dataset.propertyId = row.querySelector('.exp-mort-prop')?.value || '';
    row.dataset.modeB = row.dataset.modeB || 'auto';
    row.dataset.modeA = row.dataset.modeA || 'auto';
    // split button inside each amount cell (once)
    ['b','a'].forEach(which => {
      const cell = row.querySelector(_MORT_CELL[which].sel)?.closest('td');
      const wrap = cell?.querySelector('.dollar-wrap');
      if(wrap && !wrap.querySelector('.exp-mort-split')){
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'exp-mort-split';
        btn.title = 'Split into interest and principal';
        btn.setAttribute('aria-label', 'Split into interest and principal');
        btn.setAttribute('onclick', `openMortgageSplit(${id}, '${which}', this)`);
        btn.innerHTML = _MORT_SPLIT_ICON;
        wrap.appendChild(btn);
      }
    });
    _recalcMortgageRow(row);
  } else {
    const sel = row.querySelector('.exp-mort-prop');
    if(sel){
      const inp = document.createElement('input');
      inp.className = 'exp-input exp-desc';
      inp.type = 'text';
      inp.placeholder = 'Note (optional)';
      inp.setAttribute('oninput', `expRowChanged(${id})`);
      sel.replaceWith(inp);
    }
    row.querySelectorAll('.exp-mort-split').forEach(b => b.remove());
    ['propertyId','prinB','prinA','modeB','modeA'].forEach(k => delete row.dataset[k]);
  }
}
const _MORT_SPLIT_ICON =
  '<svg viewBox="0 0 20 20" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3v4"/><path d="M10 7c0 3-4 3-4 6v1"/><path d="M10 7c0 3 4 3 4 6v1"/></svg>';

/** Property link changed — re-enable auto split on both cells and recompute. */
function mortgagePropChanged(id){
  const row = document.querySelector(`#expenseTableBody [data-row-id="${id}"]`);
  if(!row) return;
  row.dataset.propertyId = row.querySelector('.exp-mort-prop')?.value || '';
  row.dataset.modeB = 'auto'; row.dataset.modeA = 'auto';
  delete row.dataset.prinB; delete row.dataset.prinA;
  _recalcMortgageRow(row);
  updateBudgetSummary();
  scheduleAutosave();
}

/** Recompute auto-mode principals, refresh split-button state + any open popover. */
function _recalcMortgageRow(row){
  ['b','a'].forEach(which => {
    const c = _MORT_CELL[which];
    if(row.dataset[c.modeKey] !== 'manual')
      row.dataset[c.prinKey] = String(_cellPrincipalMonthly(row, which));
    const btn = row.querySelector(_MORT_CELL[which].sel)?.closest('td')?.querySelector('.exp-mort-split');
    if(btn) btn.classList.toggle('has-split', (Number(row.dataset[c.prinKey]) || 0) > 0);
  });
  if(_mortSplitOpen && _mortSplitOpen.row === row) _renderMortgageSplitPop();
}

let _mortSplitOpen = null;   // { row, which }
/** Open/close the two-field interest–principal editor for one cell. */
function openMortgageSplit(id, which, anchor){
  const row = document.querySelector(`#expenseTableBody [data-row-id="${id}"]`);
  if(!row) return;
  if(_mortSplitOpen && _mortSplitOpen.row === row && _mortSplitOpen.which === which){ closeMortgageSplit(); return; }
  _mortSplitOpen = { row, which };
  // If the cell is empty and auto, seed it with the linked loan's scheduled payment.
  const c = _MORT_CELL[which];
  if(_cellMonthlyTotal(row, which) <= 0 && row.dataset[c.modeKey] !== 'manual'){
    const s = _loanMonthlySplit(_propertyById(row.querySelector('.exp-mort-prop')?.value));
    if(s.payment > 0) _writeCellTotal(row, which, s.payment);
  }
  let pop = document.getElementById('mortSplitPop');
  if(!pop){ pop = document.createElement('div'); pop.id = 'mortSplitPop'; pop.className = 'mort-split-pop'; document.body.appendChild(pop); }
  _renderMortgageSplitPop();
  const r = anchor.getBoundingClientRect();
  pop.style.display = 'block';
  const w = pop.offsetWidth || 280;
  pop.style.top  = `${window.scrollY + r.bottom + 8}px`;
  pop.style.left = `${window.scrollX + Math.min(r.left, window.innerWidth - w - 12)}px`;
  setTimeout(() => document.addEventListener('mousedown', _mortSplitOutside), 0);
  pop.querySelector('.msp-prin input')?.focus();
}
function _mortSplitOutside(e){
  const pop = document.getElementById('mortSplitPop');
  if(pop && !pop.contains(e.target) && !e.target.closest?.('.exp-mort-split')) closeMortgageSplit();
}
function closeMortgageSplit(){
  const pop = document.getElementById('mortSplitPop');
  if(pop) pop.style.display = 'none';
  _mortSplitOpen = null;
  document.removeEventListener('mousedown', _mortSplitOutside);
}
/** Write a MONTHLY total back into a cell in its own frequency units. */
function _writeCellTotal(row, which, monthlyTotal){
  const inp = row.querySelector(_MORT_CELL[which].sel);
  if(!inp) return;
  const perPeriod = monthlyTotal / (_rowFreqMult(row) || 1);
  inp.value = perPeriod ? String(Math.round(perPeriod * 100) / 100) : '';
}
function _renderMortgageSplitPop(){
  const pop = document.getElementById('mortSplitPop');
  if(!pop || !_mortSplitOpen) return;
  const { row, which } = _mortSplitOpen;
  const id = row.dataset.rowId, c = _MORT_CELL[which];
  const mult = _rowFreqMult(row);
  const prop = _propertyById(row.querySelector('.exp-mort-prop')?.value);
  const manual = row.dataset[c.modeKey] === 'manual';
  const principalM = _cellPrincipalMonthly(row, which);
  const interestM  = Math.max(0, _cellMonthlyTotal(row, which) - principalM);
  const pp = v => Math.round((v / (mult || 1)) * 100) / 100;   // monthly → per-period
  const unit = mult === 1 ? '/mo' : '';
  const note = manual
    ? 'Manual split — edit either field'
    : (prop ? `Auto-split from ${escapeHtml(prop.name || 'this property')}, tracking its balance` : 'Link a property to auto-split');
  pop.innerHTML = `
    <div class="msp-head"><span>Split the ${c.label.toLowerCase()} payment</span><span class="info-tip" data-tip="mortgage_split">?</span></div>
    <label class="msp-field msp-int">
      <span class="msp-lbl"><i class="msp-dot int"></i>Interest <em>cost</em></span>
      <span class="dollar-wrap"><span class="inp-dollar">$</span>
        <input type="text" inputmode="decimal" value="${interestM ? pp(interestM) : ''}" placeholder="0"
               oninput="mortgageSplitEdited(${id},'${which}')"></span>
    </label>
    <label class="msp-field msp-prin">
      <span class="msp-lbl"><i class="msp-dot prin"></i>Principal <em>equity</em></span>
      <span class="dollar-wrap"><span class="inp-dollar">$</span>
        <input type="text" inputmode="decimal" value="${principalM ? pp(principalM) : ''}" placeholder="0"
               oninput="mortgageSplitEdited(${id},'${which}')"></span>
    </label>
    <div class="msp-total"><span>Total ${unit}</span><b class="msp-total-val">${fmtDollar(pp(interestM) + pp(principalM))}</b></div>
    <div class="msp-note">${note}</div>
    ${manual ? `<button type="button" class="msp-reset" onclick="mortgageSplitReset(${id},'${which}')">↺ Back to auto-split</button>` : ''}`;
  initInfoTips();
}
/** Either field edited → re-sum to the cell total, store principal, go manual.
 *  Updates happen in place (total text + button state); we deliberately do NOT
 *  re-render the popover, which would blow away the input the user is typing in. */
function mortgageSplitEdited(id, which){
  const row = document.querySelector(`#expenseTableBody [data-row-id="${id}"]`);
  const pop = document.getElementById('mortSplitPop');
  if(!row || !pop) return;
  const mult = _rowFreqMult(row);
  const num = el => { const n = parseFloat(String(el?.value||'').replace(/[,$]/g,'')); return isNaN(n) ? 0 : Math.max(0, n); };
  const intPP  = num(pop.querySelector('.msp-int input'));
  const prinPP = num(pop.querySelector('.msp-prin input'));
  _writeCellTotal(row, which, (intPP + prinPP) * mult);
  const c = _MORT_CELL[which];
  row.dataset[c.modeKey] = 'manual';
  row.dataset[c.prinKey] = String(Math.round(prinPP * mult * 100) / 100);
  const tv = pop.querySelector('.msp-total-val'); if(tv) tv.textContent = fmtDollar(intPP + prinPP);
  const btn = row.querySelector(c.sel)?.closest('td')?.querySelector('.exp-mort-split');
  if(btn) btn.classList.toggle('has-split', prinPP > 0);
  updateBudgetSummary();
  scheduleAutosave();
}
function mortgageSplitReset(id, which){
  const row = document.querySelector(`#expenseTableBody [data-row-id="${id}"]`);
  if(!row) return;
  const c = _MORT_CELL[which];
  row.dataset[c.modeKey] = 'auto';
  delete row.dataset[c.prinKey];
  _recalcMortgageRow(row);
  _renderMortgageSplitPop();
  updateBudgetSummary();
  scheduleAutosave();
}

/* ══════════════════════════════════════════════════════════
   Bank statement import — parse CSV/PDF, rule-categorise (no AI),
   review, then write summed expenses into the current month's actuals.
   ══════════════════════════════════════════════════════════ */

// Starter keyword → category rules for common Australian merchants.
// Matched as case-insensitive substrings of the transaction description.
const IMPORT_DEFAULT_RULES = [
  { kw:'woolworths', g:'Food & Drink', s:'Groceries' }, { kw:'coles', g:'Food & Drink', s:'Groceries' },
  { kw:'aldi', g:'Food & Drink', s:'Groceries' }, { kw:'iga', g:'Food & Drink', s:'Groceries' },
  { kw:'costco', g:'Food & Drink', s:'Groceries' },
  { kw:'mcdonald', g:'Food & Drink', s:'Takeaway' }, { kw:'kfc', g:'Food & Drink', s:'Takeaway' },
  { kw:'hungry jack', g:'Food & Drink', s:'Takeaway' }, { kw:'dominos', g:'Food & Drink', s:'Takeaway' },
  { kw:'uber eats', g:'Food & Drink', s:'Takeaway' }, { kw:'menulog', g:'Food & Drink', s:'Takeaway' },
  { kw:'doordash', g:'Food & Drink', s:'Takeaway' },
  { kw:'cafe', g:'Food & Drink', s:'Coffee & Cafes' }, { kw:'coffee', g:'Food & Drink', s:'Coffee & Cafes' },
  { kw:'restaurant', g:'Food & Drink', s:'Dining Out' }, { kw:'bar ', g:'Food & Drink', s:'Dining Out' },
  { kw:'bp ', g:'Transport', s:'Fuel' }, { kw:'shell', g:'Transport', s:'Fuel' },
  { kw:'ampol', g:'Transport', s:'Fuel' }, { kw:'caltex', g:'Transport', s:'Fuel' },
  { kw:'7-eleven', g:'Transport', s:'Fuel' }, { kw:'united petrol', g:'Transport', s:'Fuel' },
  { kw:'opal', g:'Transport', s:'Public Transport' }, { kw:'myki', g:'Transport', s:'Public Transport' },
  { kw:'translink', g:'Transport', s:'Public Transport' }, { kw:'metro', g:'Transport', s:'Public Transport' },
  { kw:'linkt', g:'Transport', s:'Parking & Tolls' }, { kw:'e-toll', g:'Transport', s:'Parking & Tolls' },
  { kw:'uber', g:'Transport', s:'Public Transport' }, { kw:'didi', g:'Transport', s:'Public Transport' },
  { kw:'wilson parking', g:'Transport', s:'Parking & Tolls' }, { kw:'secure parking', g:'Transport', s:'Parking & Tolls' },
  { kw:'agl', g:'Housing', s:'Utilities' }, { kw:'origin energy', g:'Housing', s:'Utilities' },
  { kw:'energyaustralia', g:'Housing', s:'Utilities' }, { kw:'red energy', g:'Housing', s:'Utilities' },
  { kw:'sydney water', g:'Housing', s:'Utilities' }, { kw:'telstra', g:'Housing', s:'Utilities' },
  { kw:'optus', g:'Housing', s:'Utilities' }, { kw:'vodafone', g:'Housing', s:'Utilities' },
  { kw:'tpg', g:'Housing', s:'Utilities' }, { kw:'aussie broadband', g:'Housing', s:'Utilities' },
  { kw:'netflix', g:'Entertainment', s:'Streaming Services' }, { kw:'spotify', g:'Entertainment', s:'Streaming Services' },
  { kw:'disney', g:'Entertainment', s:'Streaming Services' }, { kw:'stan.', g:'Entertainment', s:'Streaming Services' },
  { kw:'binge', g:'Entertainment', s:'Streaming Services' }, { kw:'youtube premium', g:'Entertainment', s:'Streaming Services' },
  { kw:'kayo', g:'Entertainment', s:'Streaming Services' }, { kw:'amazon prime', g:'Entertainment', s:'Streaming Services' },
  { kw:'jetstar', g:'Entertainment', s:'Travel & Holidays' }, { kw:'qantas', g:'Entertainment', s:'Travel & Holidays' },
  { kw:'virgin aust', g:'Entertainment', s:'Travel & Holidays' }, { kw:'airbnb', g:'Entertainment', s:'Travel & Holidays' },
  { kw:'booking.com', g:'Entertainment', s:'Travel & Holidays' }, { kw:'hotel', g:'Entertainment', s:'Travel & Holidays' },
  { kw:'chemist warehouse', g:'Health', s:'Pharmacy' }, { kw:'priceline', g:'Health', s:'Pharmacy' },
  { kw:'pharmacy', g:'Health', s:'Pharmacy' }, { kw:'terry white', g:'Health', s:'Pharmacy' },
  { kw:'gym', g:'Health', s:'Gym & Fitness' }, { kw:'fitness first', g:'Health', s:'Gym & Fitness' },
  { kw:'anytime fitness', g:'Health', s:'Gym & Fitness' }, { kw:'f45', g:'Health', s:'Gym & Fitness' },
  { kw:'medicare', g:'Health', s:'Medical & Dental' }, { kw:'dental', g:'Health', s:'Medical & Dental' },
  { kw:'bupa', g:'Health', s:'Private Health Insurance' }, { kw:'medibank', g:'Health', s:'Private Health Insurance' },
  { kw:'hcf', g:'Health', s:'Private Health Insurance' }, { kw:'nib', g:'Health', s:'Private Health Insurance' },
  { kw:'kmart', g:'Personal', s:'Clothing' }, { kw:'target', g:'Personal', s:'Clothing' },
  { kw:'cotton on', g:'Personal', s:'Clothing' }, { kw:'uniqlo', g:'Personal', s:'Clothing' },
  { kw:'h&m', g:'Personal', s:'Clothing' }, { kw:'myer', g:'Personal', s:'Clothing' },
  { kw:'mecca', g:'Personal', s:'Personal Care & Grooming' }, { kw:'barber', g:'Personal', s:'Personal Care & Grooming' },
  { kw:'hairdress', g:'Personal', s:'Personal Care & Grooming' },
  { kw:'bunnings', g:'Housing', s:'Maintenance & Repairs' }, { kw:'ikea', g:'Housing', s:'Maintenance & Repairs' },
  { kw:'officeworks', g:'Education', s:'Books & Media' }, { kw:'udemy', g:'Education', s:'Courses & Learning' },
];

function _importRulesLoad(){
  try { return JSON.parse(localStorage.getItem('fire_import_rules_v1') || '{}'); } catch(_){ return {}; }
}
function _importRulesSave(map){
  try { localStorage.setItem('fire_import_rules_v1', JSON.stringify(map)); } catch(_){}
}
/** Learn a merchant→category rule from a user correction */
function _importLearnRule(desc, group, sub){
  const key = _importMerchantKey(desc);
  if (!key) return;
  const map = _importRulesLoad();
  map[key] = { g: group, s: sub };
  _importRulesSave(map);
}
/** A stable-ish merchant key: first 2–3 significant words, lowercased */
function _importMerchantKey(desc){
  return String(desc||'').toLowerCase().replace(/[^a-z0-9 ]/g,' ')
    .split(/\s+/).filter(w => w.length > 2 && !/^\d+$/.test(w)).slice(0,3).join(' ').trim();
}
/** Categorise a description → {g, s} or null. Learned rules take priority. */
function importCategorise(desc){
  const d = String(desc||'').toLowerCase();
  const learned = _importRulesLoad();
  const key = _importMerchantKey(desc);
  if (key && learned[key]) return learned[key];
  // learned rules can also be substrings
  for (const k in learned){ if (k && d.includes(k)) return learned[k]; }
  for (const r of IMPORT_DEFAULT_RULES){ if (d.includes(r.kw)) return { g:r.g, s:r.s }; }
  return null;
}

/* ── CSV parsing ── */
function _parseCSV(text){
  const rows = [];
  let row = [], cell = '', inQ = false;
  for (let i=0; i<text.length; i++){
    const c = text[i];
    if (inQ){
      if (c === '"'){ if (text[i+1] === '"'){ cell+='"'; i++; } else inQ=false; }
      else cell += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ','){ row.push(cell); cell=''; }
      else if (c === '\n'){ row.push(cell); rows.push(row); row=[]; cell=''; }
      else if (c === '\r'){ /* skip */ }
      else cell += c;
    }
  }
  if (cell !== '' || row.length){ row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(x => String(x).trim() !== ''));
}

function _looksLikeDate(s){ return /\b\d{1,4}[\/\-.]\d{1,2}[\/\-.]\d{1,4}\b/.test(String(s)); }
function _parseAmount(s){
  const m = String(s).replace(/[^0-9.\-]/g,'');
  if (m === '' || m === '-' || m === '.') return null;
  const v = parseFloat(m);
  return isFinite(v) ? v : null;
}

/** Detect which columns hold date / description / amount (or debit+credit). */
function _detectColumns(rows){
  if (!rows.length) return null;
  const first = rows[0].map(c => String(c).toLowerCase());
  const headerish = first.some(c => /date|desc|narrat|detail|amount|debit|credit|transaction/.test(c));
  const find = (re) => first.findIndex(c => re.test(c));
  if (headerish){
    const dateCol   = find(/date/);
    const descCol   = find(/desc|narrat|detail|transaction|reference/);
    const debitCol  = find(/debit/);
    const creditCol = find(/credit/);
    const amountCol = find(/amount/);
    if (dateCol >= 0 && descCol >= 0 && (amountCol >= 0 || debitCol >= 0)){
      return { header:true, dateCol, descCol, amountCol, debitCol, creditCol, sign:'neg' };
    }
  }
  // No usable header — infer from the data rows.
  const sample = rows.slice(0, 20);
  const nCols = Math.max(...sample.map(r => r.length));
  let dateCol=-1, amountCol=-1, descCol=-1;
  for (let c=0; c<nCols; c++){
    const col = sample.map(r => r[c] ?? '');
    if (dateCol<0 && col.filter(_looksLikeDate).length >= sample.length*0.6) dateCol=c;
  }
  for (let c=0; c<nCols; c++){
    if (c===dateCol) continue;
    const col = sample.map(r => r[c] ?? '');
    const nums = col.filter(x => _parseAmount(x)!=null && /[0-9]/.test(x)).length;
    if (nums >= sample.length*0.6){ amountCol = amountCol<0 ? c : amountCol; }
  }
  // description = the widest text column that isn't date/amount
  let bestLen=-1;
  for (let c=0; c<nCols; c++){
    if (c===dateCol || c===amountCol) continue;
    const avg = sample.reduce((s,r)=>s+String(r[c]||'').length,0)/sample.length;
    if (avg > bestLen){ bestLen=avg; descCol=c; }
  }
  if (dateCol>=0 && amountCol>=0 && descCol>=0)
    return { header:false, dateCol, descCol, amountCol, debitCol:-1, creditCol:-1, sign:'neg' };
  return null;   // caller shows the manual mapping step
}

/** Turn raw rows + column map into normalised expense transactions. */
function _rowsToTransactions(rows, map){
  const body = map.header ? rows.slice(1) : rows;
  const txns = [];
  body.forEach(r => {
    const desc = String(r[map.descCol] || '').trim();
    if (!desc) return;
    let amt = null;
    if (map.debitCol >= 0){
      const d = _parseAmount(r[map.debitCol]);
      if (d != null && Math.abs(d) > 0) amt = -Math.abs(d);   // debit = expense
      else return;   // credit rows skipped
    } else {
      const raw = _parseAmount(r[map.amountCol]);
      if (raw == null) return;
      amt = map.sign === 'pos' ? -raw : raw;   // normalise so expenses are negative
    }
    if (amt == null || amt >= 0) return;   // only money OUT
    txns.push({ date: String(r[map.dateCol]||'').trim(), desc, amount: Math.abs(amt), cat: importCategorise(desc) });
  });
  return txns;
}

/* ── Modal control ── */
let _importState = { rows:[], map:null, txns:[], newCatForIdx:null };

function _importMonthLabel(){
  const [y,mo] = (budgetMonthStr||todayMonthStr()).split('-');
  return new Date(y, mo-1, 1).toLocaleDateString('en-AU', {month:'long', year:'numeric'});
}
function openImportModal(){
  _importState = { rows:[], map:null, txns:[], newCatForIdx:null };
  document.getElementById('importTargetMonth').textContent = `Transactions will be added to ${_importMonthLabel()}.`;
  _importShowStep('upload');
  document.getElementById('importFile').value = '';
  document.getElementById('importModal').style.display = 'block';
}
function closeImportModal(){ document.getElementById('importModal').style.display = 'none'; }
function importBackToUpload(){ _importShowStep('upload'); document.getElementById('importFile').value=''; }
function _importShowStep(step){
  document.getElementById('importStepUpload').style.display  = step==='upload'  ? '' : 'none';
  document.getElementById('importStepMap').style.display     = step==='map'     ? '' : 'none';
  document.getElementById('importStepPreview').style.display = step==='preview' ? '' : 'none';
}

function importFileChosen(file){
  if (!file) return;
  const status = document.getElementById('importTargetMonth');
  if (/\.pdf$/i.test(file.name)){
    status.textContent = 'Reading PDF… (experimental — please review every row)';
    _importReadPdf(file);
    return;
  }
  const reader = new FileReader();
  reader.onload = () => _importIngestText(String(reader.result || ''));
  reader.readAsText(file);
}

function _importIngestText(text){
  const rows = _parseCSV(text);
  if (rows.length < 2){ alert('Could not read any rows from that file.'); return; }
  _importState.rows = rows;
  const map = _detectColumns(rows);
  if (map){ _importState.map = map; _importBuildPreview(); }
  else _importShowMapping(rows);
}

function _importShowMapping(rows){
  const cols = Math.max(...rows.slice(0,10).map(r => r.length));
  const opts = (sel) => { let h=''; for(let i=0;i<cols;i++){ const sample=(rows[1]||rows[0])[i]||''; h+=`<option value="${i}"${i===sel?' selected':''}>Column ${i+1} — "${escapeHtml(String(sample).slice(0,18))}"</option>`; } return h; };
  document.getElementById('mapDate').innerHTML   = opts(0);
  document.getElementById('mapDesc').innerHTML   = opts(2);
  document.getElementById('mapAmount').innerHTML = opts(1);
  _importShowStep('map');
}
function importApplyMapping(){
  _importState.map = {
    header: _looksLikeDate((_importState.rows[0]||[])[+document.getElementById('mapDate').value]) ? false : true,
    dateCol:   +document.getElementById('mapDate').value,
    descCol:   +document.getElementById('mapDesc').value,
    amountCol: +document.getElementById('mapAmount').value,
    debitCol:-1, creditCol:-1,
    sign: document.getElementById('mapSign').value,
  };
  _importBuildPreview();
}

function _importBuildPreview(){
  const txns = _rowsToTransactions(_importState.rows, _importState.map);
  if (!txns.length){ alert('No expense transactions found. Check the column mapping (or that the file has money-out rows).'); _importShowMapping(_importState.rows); return; }
  _importState.txns = txns;
  _importRenderPreview();
  _importShowStep('preview');
}

/** Build the grouped <select> options for a category cell */
function _importCatOptions(sel){
  const groups = [...new Set(BUDGET_CATS.filter(c=>c.enabled!==false).map(c=>c.group))];
  let h = `<option value="">— Skip —</option>`;
  groups.forEach(g => {
    h += `<optgroup label="${escapeHtml(g)}">`;
    BUDGET_CATS.filter(c=>c.group===g && c.enabled!==false).forEach(c => {
      const v = `${g}|${c.label}`;
      h += `<option value="${escapeHtml(v)}"${v===sel?' selected':''}>${escapeHtml(c.label)}</option>`;
    });
    h += `</optgroup>`;
  });
  h += `<option value="__new__">＋ New category…</option>`;
  return h;
}

function _importRenderPreview(){
  const txns = _importState.txns;
  const nCat = txns.filter(t=>t.cat).length;
  document.getElementById('importSummary').textContent =
    `${txns.length} expenses found · ${nCat} auto-categorised · ${txns.length-nCat} need a category`;
  let html = `<thead><tr style="position:sticky; top:0; background:#F7F7F5;">
    <th style="text-align:left; padding:7px 10px;">Description</th>
    <th style="text-align:right; padding:7px 10px;">Amount</th>
    <th style="text-align:left; padding:7px 10px; min-width:170px;">Category</th></tr></thead><tbody>`;
  txns.forEach((t, i) => {
    const sel = t.cat ? `${t.cat.g}|${t.cat.s}` : '';
    const warn = t.cat ? '' : 'background:#FFFBEB;';
    html += `<tr style="border-top:1px solid #EEE; ${warn}">
      <td style="padding:6px 10px;">${escapeHtml(t.desc.slice(0,42))}<div style="font-size:10px;color:#70736E;">${escapeHtml(t.date)}</div></td>
      <td style="padding:6px 10px; text-align:right; white-space:nowrap;">${fmtDollar(t.amount)}</td>
      <td style="padding:6px 10px;"><select class="exp-input" style="width:100%;" onchange="importRowCatChanged(${i}, this.value)">${_importCatOptions(sel)}</select></td>
    </tr>`;
  });
  html += `</tbody>`;
  document.getElementById('importPreviewTable').innerHTML = html;
}

function importRowCatChanged(idx, value){
  if (value === '__new__'){ _importState.newCatForIdx = idx; openImportNewCat(); return; }
  const t = _importState.txns[idx];
  if (!value){ t.cat = null; }
  else {
    const [g, s] = value.split('|');
    t.cat = { g, s };
    _importLearnRule(t.desc, g, s);   // remember this correction for next time
  }
  _importRenderPreview();
}

/* ── New-category popup ── */
function openImportNewCat(){
  const groups = [...new Set(BUDGET_CATS.map(c=>c.group))];
  document.getElementById('newCatGroup').innerHTML = groups.map(g=>`<option>${escapeHtml(g)}</option>`).join('');
  document.getElementById('newCatName').value = '';
  document.getElementById('importNewCatModal').style.display = 'block';
  setTimeout(()=>document.getElementById('newCatName').focus(), 50);
}
function closeImportNewCat(){
  document.getElementById('importNewCatModal').style.display = 'none';
  _importRenderPreview();   // reset the dropdown that showed "New category…"
}
function saveImportNewCat(){
  const group = document.getElementById('newCatGroup').value;
  const name  = document.getElementById('newCatName').value.trim();
  if (!name){ document.getElementById('newCatName').focus(); return; }
  if (!BUDGET_CATS.some(c => c.group===group && c.label.toLowerCase()===name.toLowerCase())){
    BUDGET_CATS.push({ group, key:'cust_'+Date.now().toString(36), label:name });
    saveBudgetCats();
  }
  const idx = _importState.newCatForIdx;
  if (idx != null){
    _importState.txns[idx].cat = { g:group, s:name };
    _importLearnRule(_importState.txns[idx].desc, group, name);
  }
  document.getElementById('importNewCatModal').style.display = 'none';
  _importRenderPreview();
}

/** Aggregate categorised expenses and write them into the month's actuals. */
function importApply(){
  const addMode = document.getElementById('importAddMode').checked;
  const byCat = {};   // "group|sub" → total
  _importState.txns.forEach(t => {
    if (!t.cat) return;
    const k = `${t.cat.g}|${t.cat.s}`;
    byCat[k] = (byCat[k] || 0) + t.amount;
  });
  const entries = Object.entries(byCat);
  if (!entries.length){ alert('Nothing to add — assign a category to at least one row.'); return; }

  entries.forEach(([k, total]) => {
    const [g, s] = k.split('|');
    const amt = Math.round(total * 100) / 100;
    // Find an existing expense row for this sub-category with no description
    const rows = [...document.querySelectorAll('#expenseTableBody .expense-row')];
    const existing = rows.find(r =>
      r.querySelector('.exp-cat')?.value === g &&
      r.querySelector('.exp-subcat')?.value === s &&
      !(r.querySelector('.exp-desc')?.value || '').trim());
    if (existing){
      const actEl = existing.querySelector('.exp-actual');
      const prev = addMode ? (parseFloat(String(actEl.value).replace(/[,$]/g,'')) || 0) : 0;
      actEl.value = Math.round((prev + amt) * 100) / 100;
      existing.querySelector('.exp-cat').value = g;   // ensure group is right
    } else {
      addExpenseRow({ group:g, subcategory:s, actual:amt, freq:'Monthly' });
    }
  });
  sortExpenseRows();
  updateBudgetSummary();
  scheduleAutosave();
  closeImportModal();
  const st = document.getElementById('budgetSaveStatus');
  if (st){ st.textContent = `Imported ${entries.length} categories ✓`; st.className = 'budget-save-status saved'; }
}

/* ── PDF (best-effort, experimental) ── */
let _pdfjsLoading = null;
function _loadPdfJs(){
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (_pdfjsLoading) return _pdfjsLoading;
  _pdfjsLoading = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.min.mjs';
    s.type = 'module';
    // pdf.js v4 is ESM; use a small import shim
    const shim = document.createElement('script');
    shim.type = 'module';
    shim.textContent = `import * as pdfjs from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.min.mjs';
      pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';
      window.pdfjsLib = pdfjs; window.dispatchEvent(new Event('pdfjs-ready'));`;
    window.addEventListener('pdfjs-ready', () => res(window.pdfjsLib), { once:true });
    setTimeout(() => { if (!window.pdfjsLib) rej(new Error('pdfjs load timeout')); }, 10000);
    document.head.appendChild(shim);
  });
  return _pdfjsLoading;
}

async function _importReadPdf(file){
  try {
    const pdfjs = await _loadPdfJs();
    const buf = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: buf }).promise;
    let lines = [];
    for (let p=1; p<=pdf.numPages; p++){
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      // group text items into visual lines by their y-position
      const byY = {};
      content.items.forEach(it => {
        const y = Math.round(it.transform[5]);
        (byY[y] = byY[y] || []).push({ x: it.transform[4], s: it.str });
      });
      Object.keys(byY).sort((a,b)=>b-a).forEach(y => {
        const line = byY[y].sort((a,b)=>a.x-b.x).map(o=>o.s).join(' ').replace(/\s+/g,' ').trim();
        if (line) lines.push(line);
      });
    }
    // Best-effort: keep lines that contain a date AND a dollar amount
    const txns = [];
    const amtRe = /(-?\$?\d[\d,]*\.\d{2})(?!\d)/;
    lines.forEach(line => {
      if (!_looksLikeDate(line)) return;
      const m = line.match(amtRe);
      if (!m) return;
      const amount = Math.abs(_parseAmount(m[1]) || 0);
      if (!amount) return;
      const desc = line.replace(amtRe, '').replace(/\b\d{1,4}[\/\-.]\d{1,2}[\/\-.]\d{1,4}\b/g,'').replace(/\s+/g,' ').trim();
      if (desc.length < 3) return;
      txns.push({ date:'', desc, amount, cat: importCategorise(desc) });
    });
    if (!txns.length){ alert('Couldn\'t extract transactions from this PDF. PDF layouts vary a lot — a CSV export from your bank will work far more reliably.'); document.getElementById('importTargetMonth').textContent = `Transactions will be added to ${_importMonthLabel()}.`; return; }
    _importState.txns = txns;
    _importRenderPreview();
    _importShowStep('preview');
    document.getElementById('importSummary').textContent += ' · ⚠ PDF import — double-check amounts';
  } catch(e){
    console.warn('PDF import failed', e);
    alert('PDF reading failed. Please use a CSV export from your bank instead.');
  }
}

/** Remove a row — always keeps at least one */
function deleteExpenseRow(id){
  const tbody = document.getElementById('expenseTableBody');
  if(!tbody) return;
  if(tbody.querySelectorAll('.expense-row').length <= 1) return;
  const row = tbody.querySelector(`[data-row-id="${id}"]`);
  if(row){ row.remove(); updateBudgetSummary(); scheduleAutosave(); }
}

/** Fill editor from API data (or reset to blank). Pass incomeOverride to skip localStorage lookup. */
function populateLogForm(data, incomeOverride){
  // ── Income rows ──
  const incTbody = document.getElementById('incomeTableBody');
  if(incTbody){
    incTbody.innerHTML = '';
    _incRowCounter = 0;
    const stored = incomeOverride !== undefined ? incomeOverride : loadIncomeRowsFromStorage(budgetMonthStr);
    if(stored && stored.length){
      stored.forEach(r => addIncomeRow(r));
    } else if(data && data.income && data.income.planned > 0){
      // API only gives us a total — show it as one row
      addIncomeRow({
        source: 'Income',
        budget: data.income.planned,
        actual: data.income.actual != null ? data.income.actual : '',
        freq:   'Monthly'
      });
    }
  }

  // ── Expense rows ──
  const tbody = document.getElementById('expenseTableBody');
  if(!tbody) return;
  tbody.innerHTML = '';
  _expRowCounter = 0;

  if(data && data.categories && data.categories.length){
    data.categories.forEach(cat => {
      const {subcategory, description} = parseCategoryDescription(cat.category);
      const match = BUDGET_CATS.find(c => c.label.toLowerCase() === subcategory.toLowerCase());
      addExpenseRow({
        group:       match ? match.group : (BUDGET_CATS[0]?.group || 'Other'),
        subcategory: subcategory,
        description: description,
        budget:      cat.planned != null ? cat.planned : '',
        actual:      cat.actual  != null ? cat.actual  : '',
        freq:        'Monthly',  // API always stores monthly amounts
        property_id: cat.property_id != null ? cat.property_id : null,
        principal:          cat.principal         != null ? cat.principal         : null,
        principal_planned:  cat.principal_planned != null ? cat.principal_planned : null,
        pm_b: cat.pm_b, pm_a: cat.pm_a
      });
    });
  }
  sortExpenseRows();
  updateBudgetSummary();
}

/* ─────────────────────────────────────────────────────── */

/* Drawer inner tabs (Core / Stocks & Super / Properties) */
let _currentInputsPanel = 'core';
function showInputsPanel(which){
  _currentInputsPanel = which;
  // Two synced button sets: the drawer header tabs and the desktop dock tabs
  const groups = [
    { id:"core",       el: document.getElementById("panel-core"),       btns: [document.getElementById("btnDrawerCore"),   document.getElementById("btnDockCore")] },
    { id:"stocks",     el: document.getElementById("panel-stocks"),     btns: [document.getElementById("btnDrawerStocks"), document.getElementById("btnDockStocks")] },
    { id:"properties", el: document.getElementById("panel-properties"), btns: [document.getElementById("btnDrawerProps"),  document.getElementById("btnDockProps")] },
    { id:"events",     el: document.getElementById("panel-events"),     btns: [document.getElementById("btnDrawerEvents"), document.getElementById("btnDockEvents")] },
  ];
  groups.forEach(g=>{
    const isActive = (g.id === which);
    if(g.el) g.el.classList.toggle("hidden", !isActive);
    g.btns.forEach(btn => {
      if(!btn) return;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-selected", String(isActive));
    });
  });
  if (which === "events") renderLifeEvents();
}

/* ====== Life Events ====== */

function _lifeEventTypeLabel(t){
  return ({ income_change:'Income change', expense_change:'Expense change', windfall:'Windfall / one-off' })[t] || t;
}
function _lifeEventBadgeClass(t){
  return ({ income_change:'income', expense_change:'expense', windfall:'windfall' })[t] || '';
}
function _fmtLifeEventMonth(ym){
  if(!ym) return '—';
  const parts = ym.split('-').map(Number);
  return new Date(parts[0], parts[1]-1, 1).toLocaleDateString('en-AU', {month:'short', year:'numeric'});
}
function _fmtLifeEventDateRange(ev){
  const startLabel = _fmtLifeEventMonth(ev.start);
  if (ev.type === 'windfall') return startLabel;
  return ev.end ? `${startLabel} – ${_fmtLifeEventMonth(ev.end)}` : `${startLabel} – ongoing`;
}
function _fmtLifeEventAmount(ev){
  const amt = Number(ev.amount) || 0;
  const sign = amt >= 0 ? '+' : '';
  if (ev.type === 'windfall') return sign + fmtMoney(amt);
  if (ev.mode === 'percent') return `${sign}${amt}%`;
  return `${sign}${fmtMoney(amt)}/mo`;
}

/* ====== Month picker ======
   A custom month/year picker to replace native <input type="month">, whose
   built-in year-scrolling UI is clunky. Renders a button showing the
   formatted month + a popover with explicit prev/next year arrows and a
   12-month grid. The real value lives in a hidden input with the given id,
   so any code reading `document.getElementById(fieldId).value` (e.g.
   saveLifeEventForm) doesn't need to change. Trying this on Life Events
   first before rolling it out to Budget/Holdings/Properties. */

let _mpOutsideBound = false;
const _mpAllowClear = {};   // fieldId -> { clearLabel }

const _mpOnChange = {}; // fieldId -> function(newValue) — for callers that need a side effect on change

function monthPickerHTML(fieldId, value, opts={}){
  // clearLabel is the wording on the clear *button* (an action, e.g. "Clear date");
  // placeholder is what the field itself shows once empty (e.g. "Select month").
  // Keeping these separate avoids a cleared field echoing the button's action text.
  if (opts.allowClear) _mpAllowClear[fieldId] = {
    clearLabel: opts.clearLabel || 'Clear',
    placeholder: opts.placeholder || 'Select month'
  };
  if (opts.onChange) _mpOnChange[fieldId] = opts.onChange;
  const label = value ? _fmtLifeEventMonth(value) : (opts.placeholder || 'Select month');
  return `
    <div class="month-picker" id="${fieldId}_wrap">
      <button type="button" class="month-picker-btn" onclick="event.stopPropagation(); toggleMonthPicker('${fieldId}')">
        <span id="${fieldId}_label">${escapeHtml(label)}</span>
        <span class="month-picker-caret">▾</span>
      </button>
      <input type="hidden" id="${fieldId}" value="${value||''}" />
      <div class="month-picker-pop" id="${fieldId}_pop"></div>
    </div>
  `;
}

function toggleMonthPicker(fieldId){
  const pop = document.getElementById(`${fieldId}_pop`);
  if (!pop) return;
  const wasOpen = pop.classList.contains('open');
  document.querySelectorAll('.month-picker-pop.open').forEach(p => p.classList.remove('open'));
  if (wasOpen) return;

  const val = document.getElementById(fieldId).value;
  const viewYear = val ? Number(val.split('-')[0]) : new Date().getFullYear();
  _renderMonthPickerPop(fieldId, viewYear);
  pop.classList.add('open');

  if (!_mpOutsideBound) {
    _mpOutsideBound = true;
    document.addEventListener('click', (e) => {
      if (e.target.closest('.month-picker')) return;
      document.querySelectorAll('.month-picker-pop.open').forEach(p => p.classList.remove('open'));
    });
  }
}

function _renderMonthPickerPop(fieldId, year){
  const pop = document.getElementById(`${fieldId}_pop`);
  if (!pop) return;
  const val = document.getElementById(fieldId).value;
  const [selY, selM] = val ? val.split('-').map(Number) : [null, null];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const clearOpt = _mpAllowClear[fieldId];

  pop.innerHTML = `
    <div class="month-picker-yearnav">
      <button type="button" onclick="event.stopPropagation(); _renderMonthPickerPop('${fieldId}', ${year - 1})">‹</button>
      <span>${year}</span>
      <button type="button" onclick="event.stopPropagation(); _renderMonthPickerPop('${fieldId}', ${year + 1})">›</button>
    </div>
    <div class="month-picker-grid">
      ${months.map((m, i) => `
        <button type="button" class="month-picker-cell${selY===year && selM===i+1 ? ' selected' : ''}"
                onclick="event.stopPropagation(); _mpSelect('${fieldId}', ${year}, ${i+1})">${m}</button>
      `).join('')}
    </div>
    ${clearOpt ? `<button type="button" class="month-picker-clear" onclick="event.stopPropagation(); _mpClear('${fieldId}')">${clearOpt.clearLabel}</button>` : ''}
  `;
}

function _mpSelect(fieldId, year, month){
  const ym = `${year}-${String(month).padStart(2,'0')}`;
  document.getElementById(fieldId).value = ym;
  document.getElementById(`${fieldId}_label`).textContent = _fmtLifeEventMonth(ym);
  document.getElementById(`${fieldId}_pop`).classList.remove('open');
  if (_mpOnChange[fieldId]) _mpOnChange[fieldId](ym);
}

function _mpClear(fieldId){
  document.getElementById(fieldId).value = '';
  document.getElementById(`${fieldId}_label`).textContent = _mpAllowClear[fieldId]?.placeholder || 'Select month';
  document.getElementById(`${fieldId}_pop`).classList.remove('open');
  if (_mpOnChange[fieldId]) _mpOnChange[fieldId]('');
}

let _lifeEventFormOpen = null; // { id, name, type, start, end, mode, amount } while add/edit form is showing

function renderLifeEvents(){
  const wrap = document.getElementById('lifeEventsList');
  if (!wrap) return;
  const events = (state.life_events || []).slice().sort((a,b) => (a.start||'').localeCompare(b.start||''));

  let html = _lifeEventFormOpen ? _renderLifeEventForm(_lifeEventFormOpen) : '';
  if (!events.length) {
    html += `<div class="prop-history-empty">No life events yet — add a temporary pay cut, a big one-off expense, or a windfall to see how it shifts your FIRE date.</div>`;
  } else {
    events.forEach(ev => {
      html += `
        <div class="life-event-card">
          <div class="life-event-row">
            <span class="propTypeBadge propTypeBadge-${_lifeEventBadgeClass(ev.type)}">${escapeHtml(_lifeEventTypeLabel(ev.type))}</span>
            <span class="life-event-name">${escapeHtml(ev.name || 'Untitled event')}</span>
            <span class="life-event-actions">
              <button class="prop-history-edit" onclick="event.stopPropagation(); editLifeEvent(${Number(ev.id)})" title="Edit">✎</button>
              <button class="prop-history-del" onclick="event.stopPropagation(); deleteLifeEvent(${Number(ev.id)})" title="Remove">✕</button>
            </span>
          </div>
          <div class="life-event-meta">${_fmtLifeEventDateRange(ev)} &nbsp;·&nbsp; ${_fmtLifeEventAmount(ev)}</div>
        </div>`;
    });
  }
  wrap.innerHTML = html;
}

function openAddLifeEvent(){
  if (!isPro() && (state.life_events||[]).length >= 1) {
    showUpgradeModal('Free plan is limited to 1 life event. Upgrade to model unlimited income changes, expenses, and windfalls.');
    return;
  }
  _lifeEventFormOpen = { id:null, name:'', type:'income_change', start: todayMonthStr(), end:'', mode:'percent', amount:'' };
  renderLifeEvents();
}
function editLifeEvent(id){
  const ev = (state.life_events || []).find(e => Number(e.id) === Number(id));
  if (!ev) return;
  _lifeEventFormOpen = { ...ev, amount: ev.amount ?? '' };
  renderLifeEvents();
}
function cancelLifeEventForm(){
  _lifeEventFormOpen = null;
  renderLifeEvents();
}
function deleteLifeEvent(id){
  state.life_events = (state.life_events || []).filter(e => Number(e.id) !== Number(id));
  saveState();
  renderLifeEvents();
}
function _onLifeEventTypeChange(val){
  if (!_lifeEventFormOpen) return;
  // Preserve whatever the user already typed before the field layout swaps
  const nameEl = document.getElementById('lev_name');
  const startEl = document.getElementById('lev_start');
  const endEl = document.getElementById('lev_end');
  const modeEl = document.getElementById('lev_mode');
  const amountEl = document.getElementById('lev_amount');
  if (nameEl) _lifeEventFormOpen.name = nameEl.value;
  if (startEl) _lifeEventFormOpen.start = startEl.value;
  if (endEl) _lifeEventFormOpen.end = endEl.value;
  if (modeEl) _lifeEventFormOpen.mode = modeEl.value;
  if (amountEl) _lifeEventFormOpen.amount = toNumber(amountEl.value);
  _lifeEventFormOpen.type = val;
  renderLifeEvents();
}
function saveLifeEventForm(){
  if (!_lifeEventFormOpen) return;
  const name  = document.getElementById('lev_name').value.trim();
  const type  = document.getElementById('lev_type').value;
  const start = document.getElementById('lev_start').value;
  const endEl = document.getElementById('lev_end');
  const modeEl = document.getElementById('lev_mode');
  const amount = toNumber(document.getElementById('lev_amount').value);

  if (!start) { showToast('Missing date', 'Pick a date for this event.'); return; }

  const id = _lifeEventFormOpen.id ?? Date.now();
  const entry = {
    id, name, type, start,
    end: (type !== 'windfall' && endEl && endEl.value) ? endEl.value : null,
    mode: type === 'windfall' ? 'lump' : (modeEl ? modeEl.value : 'percent'),
    amount
  };

  const list = state.life_events || [];
  const idx = list.findIndex(e => Number(e.id) === Number(id));
  if (idx >= 0) list[idx] = entry; else list.push(entry);
  state.life_events = list;

  _lifeEventFormOpen = null;
  saveState();
  renderLifeEvents();
  showToast('Saved', `"${name || 'Life event'}" saved.`);
}
function _onLifeEventModeChange(val){
  if (!_lifeEventFormOpen) return;
  const amountEl = document.getElementById('lev_amount');
  if (amountEl) _lifeEventFormOpen.amount = toNumber(amountEl.value);
  _lifeEventFormOpen.mode = val;
  renderLifeEvents();
}
function _levAmountFocus(el){
  el.value = el.value.replace(/[^0-9.\-]/g, '');
}
function _levAmountBlur(el, isDollar){
  if (el.value.trim() === '') return;
  const v = toNumber(el.value);
  el.value = isDollar ? fmtMoney(v) : v;
}
function _renderLifeEventForm(form){
  const isEdit = form.id != null;
  const isWindfall = form.type === 'windfall';
  const isDollarAmount = isWindfall || form.mode === 'dollar';
  return `
    <div class="prop-history-form">
      <div class="prop-history-form-title">${isEdit ? 'Edit life event' : 'New life event'}</div>
      <div class="prop-history-form-grid life-event-form-grid">
        <div style="grid-column:1/-1;">
          <label>Name</label>
          <input type="text" id="lev_name" value="${escapeHtml(form.name||'')}" placeholder="e.g. Parental leave" />
        </div>
        <div>
          <label>Type</label>
          <select id="lev_type" onchange="_onLifeEventTypeChange(this.value)">
            <option value="income_change" ${form.type==='income_change'?'selected':''}>Income change</option>
            <option value="expense_change" ${form.type==='expense_change'?'selected':''}>Expense change</option>
            <option value="windfall" ${form.type==='windfall'?'selected':''}>Windfall / one-off</option>
          </select>
        </div>
        <div>
          <label>${isWindfall ? 'Date' : 'Start'}</label>
          ${monthPickerHTML('lev_start', form.start)}
        </div>
        ${!isWindfall ? `
        <div>
          <label>End <span style="font-size:10px;color:#6A716B;">(blank = ongoing)</span></label>
          ${monthPickerHTML('lev_end', form.end, { placeholder: 'Ongoing', allowClear: true, clearLabel: 'Ongoing' })}
        </div>
        <div>
          <label>Amount type</label>
          <select id="lev_mode" onchange="_onLifeEventModeChange(this.value)">
            <option value="percent" ${form.mode==='percent'?'selected':''}>% change</option>
            <option value="dollar" ${form.mode==='dollar'?'selected':''}>$ per month</option>
          </select>
        </div>` : ''}
        <div style="grid-column:1/-1;">
          <label>${isWindfall ? 'Amount ($, negative = expense)' : (form.mode==='percent' ? 'Amount (%)' : 'Amount ($/mo)')}</label>
          <input type="text" inputmode="decimal" id="lev_amount"
                 value="${form.amount==='' ? '' : (isDollarAmount ? fmtMoney(Number(form.amount)) : form.amount)}"
                 placeholder="${isWindfall ? 'e.g. $50,000 or -$15,000' : 'e.g. -30'}"
                 onfocus="_levAmountFocus(this)" onblur="_levAmountBlur(this, ${isDollarAmount})" />
        </div>
      </div>
      <div class="prop-history-form-actions">
        <button class="btn ghost" onclick="cancelLifeEventForm()">Cancel</button>
        <button class="btn primary" onclick="saveLifeEventForm()">Save event</button>
      </div>
    </div>
  `;
}


/* ═══════════════════════════════════════════════════════
   PORTFOLIO TAB
   ═══════════════════════════════════════════════════════ */

const PORT_TYPES = [
  { key:'cash',     label:'Cash & Savings'  },
  { key:'stocks',   label:'Stocks & ETFs'   },
  { key:'super',    label:'Superannuation'  },
  { key:'property', label:'Property'        },
  { key:'other',    label:'Other'           },
];
const PORT_MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/** Live total of current_value across property model cards (Properties sub-tab). */
function propModelTotal(){
  // EQUITY (value − loan) of properties owned TODAY — this feeds the
  // Holdings "Property" row and net-worth cards. Gross value would count
  // the bank's share as wealth; planned future purchases aren't wealth yet.
  return (state.property_list || [])
    .filter(propertyOwnedNow)
    .reduce((s,p) => s + propertySummary(p).equity, 0);
}

let _portYear = new Date().getFullYear();
let _portChartInstance = null;
let _portUnlockedMonths = new Set(); // past months user has confirmed to unlock

function portLoad(){
  try {
    const r = localStorage.getItem('wm_portfolio');
    if(r){
      const d = JSON.parse(r);
      // Migrate old snapshot-based format → monthly format
      if(!d.monthly && d.snapshots?.length){
        d.monthly = {};
        d.snapshots.forEach(s => {
          if(!s.month) return;
          const mv = {};
          (d.assets||[]).forEach(a => { if(s[a.type] > 0) mv[a.id] = s[a.type]/Math.max(1,(d.assets||[]).filter(x=>x.type===a.type).length); });
          d.monthly[s.month] = mv;
        });
        delete d.snapshots;
      }
      if(!d.monthly) d.monthly = {};
      return d;
    }
  } catch(_){}
  return { assets:[], monthly:{} };
}
function portSave(data){
  try { localStorage.setItem('wm_portfolio', JSON.stringify(data)); } catch(_){}
  _queueSync();
}

/** Returns assets with .value set from current month's stored data.
 *  If no property-type asset has a manually tracked value this month,
 *  falls back to the live Properties model total. */
function portGetCurrentData(){
  const d = portLoad();
  const month = todayMonthStr();
  const monthly = d.monthly || {};
  // Months with data, up to and including the current one, oldest→newest.
  // Only positive values are ever stored, so "missing" is unambiguous.
  const priorMonths = Object.keys(monthly).filter(m => m <= month).sort();
  // Latest logged value for an asset: current month if present, else carry
  // forward the most recent earlier month — so the summary doesn't drop to
  // zero just because this month hasn't been filled in yet.
  const latestValueFor = (id) => {
    for (let i = priorMonths.length - 1; i >= 0; i--) {
      const v = monthly[priorMonths[i]][id];
      if (v != null && Number(v) > 0) return Number(v);
    }
    return 0;
  };
  const assets = (d.assets||[]).map(a => ({ ...a, value: latestValueFor(a.id) }));
  const hasManualProperty = assets.some(a => a.type === 'property' && a.value > 0);
  if (!hasManualProperty) {
    const modelTotal = propModelTotal();
    if (modelTotal > 0) assets.push({ id:'__prop_fallback__', type:'property', name:'Property equity (from Properties)', value: modelTotal });
  }
  return assets;
}

function portTotals(assets){
  const t = { cash:0, stocks:0, super:0, property:0, other:0, total:0 };
  (assets||[]).forEach(a => {
    const k = Object.prototype.hasOwnProperty.call(t, a.type) ? a.type : 'other';
    t[k] += a.value || 0;
    t.total += a.value || 0;
  });
  return t;
}

let _portSubTab = 'holdings';

function toggleNavPortDrop(e) {
  e.stopPropagation();
  const drop = document.getElementById('navPortDropdown');
  if (!drop) return;
  const opening = !drop.classList.contains('open');
  drop.classList.toggle('open', opening);
  if (opening) {
    document.addEventListener('click', closeNavPortDrop, { once: true });
  }
}
function closeNavPortDrop() {
  const drop = document.getElementById('navPortDropdown');
  if (drop) drop.classList.remove('open');
}

function switchPortSubTab(tab){
  _portSubTab = tab;
  document.getElementById('portSubHoldings').style.display    = tab === 'holdings'   ? '' : 'none';
  document.getElementById('portSubProperties').style.display  = tab === 'properties' ? '' : 'none';
  if (tab === 'holdings') {
    const d = portLoad();
    renderPortYear(d);
    updatePortSummary();
    renderPortHistoryChart(d);
  } else {
    renderProperties();
    updatePropSummaryStrip();
  }
}

function showPortfolioTab(){
  showTab('portfolio');   // activates btnPortfolio (Holdings) by naming convention
  switchPortSubTab('holdings');
}

function renderPortfolioTab(){
  const d = portLoad();
  if (_portSubTab === 'holdings') {
    renderPortYear(d);
    updatePortSummary();
    renderPortHistoryChart(d);
  } else {
    renderProperties();
    updatePropSummaryStrip();
  }
}

function portYearStep(delta){
  const nextYear = _portYear + delta;
  if (!isPro() && nextYear < new Date().getFullYear()) {
    showUpgradeModal('Free plan shows the current year of holdings history. Upgrade for unlimited history.');
    return;
  }
  _portYear = nextYear;
  renderPortYear(portLoad());
}

function _portMonthsForYear(year){
  return Array.from({length:12}, (_,i) => `${year}-${String(i+1).padStart(2,'0')}`);
}

function renderPortYear(data){
  const el = document.getElementById('portYearLabel');
  if(el) el.textContent = _portYear;
  const today  = todayMonthStr();
  const months = _portMonthsForYear(_portYear);
  const assets = data.assets || [];

  // ── Header ──
  const head = document.getElementById('portYearHead');
  if(head){
    head.innerHTML = `<tr>
      <th style="text-align:left;">Asset</th>
      <th style="text-align:left;">Type</th>
      ${months.map((m,i) => {
        const isPast    = m < today;
        const isCurrent = m === today;
        const isFuture  = m > today;
        const unlocked  = _portUnlockedMonths.has(m);
        const locked    = isPast && !unlocked;
        const lockBtn   = isPast
          ? (locked
              ? `<button class="port-lock-icon" onclick="portUnlockMonth('${m}')" title="Click to edit ${PORT_MONTH_NAMES[i]} ${_portYear}">🔒</button>`
              : `<button class="port-lock-icon port-lock-open" onclick="portRelockMonth('${m}')" title="Click to lock ${PORT_MONTH_NAMES[i]} ${_portYear}">🔓</button>`)
          : '';
        const cls       = isFuture ? 'port-th-future' : isCurrent ? 'port-th-current' : '';
        return `<th class="${cls}">${PORT_MONTH_NAMES[i]}${lockBtn}</th>`;
      }).join('')}
      <th></th>
    </tr>`;
  }

  // ── Body ──
  const body = document.getElementById('portYearBody');
  if(body){
    body.innerHTML = '';
    if(assets.length === 0){
      _appendPortAssetRow({ id:1, name:'', type:'cash' }, data, months, today);
    } else {
      assets.forEach(a => _appendPortAssetRow(a, data, months, today));
    }
  }

}

function _appendPortAssetRow(asset, data, months, today){
  const body = document.getElementById('portYearBody');
  if(!body) return;
  const typeOpts = PORT_TYPES.map(t =>
    `<option value="${t.key}"${asset.type===t.key?' selected':''}>${t.label}</option>`
  ).join('');
  const tr = document.createElement('tr');
  tr.className = 'port-asset-row';
  tr.dataset.portId = asset.id;
  const cells = months.map(m => {
    const isPast    = m < today;
    const isFuture  = m > today;
    const isCurrent = m === today;
    const locked    = isPast && !_portUnlockedMonths.has(m);
    const val       = ((data.monthly||{})[m]||{})[asset.id] || '';
    if(isFuture) return `<td class="port-cell-future"></td>`;
    const lockedClass = locked ? 'port-cell-locked' : '';
    const readOnly     = locked ? 'readonly' : '';
    const onClick      = locked ? `onclick="portUnlockMonth('${m}')"` : '';
    let hint = '';
    if(isCurrent && asset.type === 'property'){
      const modelTotal = propModelTotal();
      if(modelTotal > 0){
        hint = `<div class="port-cell-hint" style="display:${val?'none':''}" title="Live equity (value − loans) from Properties tab — used automatically when this cell is blank">~${fmtDollarShort(modelTotal)}</div>`;
      }
    }
    const displayVal = val ? '$' + Number(val).toLocaleString('en-AU', {maximumFractionDigits:0}) : '';
    return `<td><input class="port-cell-input ${lockedClass}" type="text" inputmode="decimal"
      value="${displayVal}" ${readOnly} ${onClick}
      data-aid="${asset.id}" data-month="${m}" oninput="portCellChanged(this); portToggleHint(this)"
      onblur="portCellBlur(this)">${hint}</td>`;
  });
  tr.innerHTML = `
    <td><input class="exp-input port-name" type="text" placeholder="Asset name"
         value="${escapeHtml(asset.name||'')}" oninput="portAssetMetaChanged(${asset.id},'name',this.value)"></td>
    <td><select class="exp-input port-type" onchange="portAssetMetaChanged(${asset.id},'type',this.value)">${typeOpts}</select></td>
    ${cells.join('')}
    <td><button class="exp-del" onclick="deletePortAsset(${asset.id})" title="Remove">✕</button></td>`;
  body.appendChild(tr);
}

function portToggleHint(input){
  const hint = input.parentElement.querySelector('.port-cell-hint');
  if(hint) hint.style.display = input.value ? 'none' : '';
}

function portUnlockMonth(month){
  const [y,m] = month.split('-');
  const label = new Date(y, m-1).toLocaleString('default',{month:'long',year:'numeric'});
  if(!confirm(`Edit ${label}?\n\nThis will update your historical record.`)) return;
  _portUnlockedMonths.add(month);
  renderPortYear(portLoad());
}

function portRelockMonth(month){
  _portUnlockedMonths.delete(month);
  renderPortYear(portLoad());
}

function portCellChanged(input){
  clearTimeout(window._portCellTimer);
  window._portCellTimer = setTimeout(()=>{
    const d    = portLoad();
    const aid  = Number(input.dataset.aid);
    const mon  = input.dataset.month;
    const val  = parseFloat(String(input.value).replace(/[,$]/g,'')) || 0;
    if(!d.monthly) d.monthly = {};
    if(!d.monthly[mon]) d.monthly[mon] = {};
    if(val > 0) d.monthly[mon][aid] = val; else delete d.monthly[mon][aid];
    if(!Object.keys(d.monthly[mon]).length) delete d.monthly[mon];
    portSave(d);
    updatePortSummary();
    reapplySyncedFields();
    renderSyncPanel();
    renderPortHistoryChart(d);
    const st = document.getElementById('portSaveStatus');
    if(st){ st.textContent='Saved ✓'; st.className='budget-save-status saved'; }
  }, 600);
}

function portCellBlur(input){
  const v = parseFloat(String(input.value).replace(/[,$]/g,''));
  input.value = (!isNaN(v) && v > 0) ? '$' + v.toLocaleString('en-AU', {maximumFractionDigits:0}) : '';
}

function portAssetMetaChanged(id, field, value){
  if (field === 'type') {
    // A <select> change is already a complete, deliberate action — debouncing
    // (meant for keystroke-driven text fields) just adds a delay with zero
    // visual feedback, which looks like the totals aren't updating at all.
    const d = portLoad();
    const a = (d.assets||[]).find(x => x.id === id);
    if(a) a[field] = value;
    portSave(d);
    renderPortYear(d);  // full re-render so e.g. the property auto-fill hint follows the new type
    updatePortSummary();
    const st = document.getElementById('portSaveStatus');
    if(st){ st.textContent='Saved ✓'; st.className='budget-save-status saved'; }
    return;
  }
  clearTimeout(window._portMetaTimer);
  window._portMetaTimer = setTimeout(()=>{
    const d = portLoad();
    const a = (d.assets||[]).find(x => x.id === id);
    if(a) a[field] = value;
    portSave(d);
    updatePortSummary();
    const st = document.getElementById('portSaveStatus');
    if(st){ st.textContent='Saved ✓'; st.className='budget-save-status saved'; }
  }, 600);
}

function addPortfolioAsset(){
  const d = portLoad();
  const maxId = (d.assets||[]).reduce((m,a) => Math.max(m, a.id||0), 0);
  const newAsset = { id: maxId+1, name:'', type:'cash' };
  d.assets = [...(d.assets||[]), newAsset];
  portSave(d);
  const months = _portMonthsForYear(_portYear);
  _appendPortAssetRow(newAsset, d, months, todayMonthStr());
}

function deletePortAsset(id){
  const d = portLoad();
  d.assets = (d.assets||[]).filter(a => a.id !== id);
  Object.keys(d.monthly||{}).forEach(m => { if(d.monthly[m]) delete d.monthly[m][id]; });
  portSave(d);
  document.querySelector(`#portYearBody [data-port-id="${id}"]`)?.remove();
  updatePortSummary();
}

function updatePortSummary(){
  const t   = portTotals(portGetCurrentData());
  const fmt = v => v > 0 ? fmtDollar(v) : '—';
  const s   = id => document.getElementById(id);
  if(s('psiTotal'))  s('psiTotal').textContent  = fmt(t.cash + t.stocks + t.super + t.other);
  if(s('psiCash'))   s('psiCash').textContent   = fmt(t.cash);
  if(s('psiStocks')) s('psiStocks').textContent = fmt(t.stocks);
  if(s('psiSuper'))  s('psiSuper').textContent  = fmt(t.super);
  if(s('psiOther'))  s('psiOther').textContent  = fmt(t.other);
}

function renderPortHistoryChart(data){
  const wrap = document.getElementById('portHistoryContent');
  if(!wrap) return;
  const monthly = data.monthly || {};
  const assets  = (data.assets || []).filter(a => a.type !== 'property'); // property lives in the Properties tab, not here

  const months  = Object.keys(monthly)
    .filter(m => assets.some(a => (monthly[m][a.id]||0) > 0))
    .sort();
  if(months.length < 2){
    if(_portChartInstance){ _portChartInstance.destroy(); _portChartInstance=null; }
    wrap.innerHTML = '<div class="empty-state"><span class="es-icon">📈</span>Enter asset values for at least two months to see your net worth trend.</div>';
    return;
  }
  if(!document.getElementById('portHistoryCanvas')){
    wrap.innerHTML = '<canvas id="portHistoryCanvas" style="max-height:280px;"></canvas>';
  }
  const ctx    = document.getElementById('portHistoryCanvas').getContext('2d');
  const labels = months.map(m => { const [y,mo]=m.split('-'); return new Date(y,mo-1).toLocaleString('default',{month:'short',year:'2-digit'}); });
  const TYPE_COLORS = { cash:'#3B82F6', stocks:'#F59E0B', super:'#8B5CF6', other:'#6B7280' };
  const typeDs = PORT_TYPES.filter(pt => pt.key !== 'property').map(pt => {
    const vals = months.map(m => assets.filter(a=>a.type===pt.key).reduce((s,a)=>s+(monthly[m][a.id]||0),0));
    if(!vals.some(v=>v>0)) return null;
    return { label:pt.label, data:vals, backgroundColor:TYPE_COLORS[pt.key], borderRadius:3, maxBarThickness:42, yAxisID:'y', order:2 };
  }).filter(Boolean);

  // % monthly change of total net worth, on its own right-hand axis.
  const nwByMonth = months.map(m => assets.reduce((s,a)=>s+(monthly[m][a.id]||0),0));
  const pctChange = nwByMonth.map((v,i) =>
    (i===0 || !nwByMonth[i-1]) ? null : Math.round(((v - nwByMonth[i-1]) / nwByMonth[i-1]) * 1000) / 10
  );
  const changeDs = {
    type:'line', label:'Monthly change', data:pctChange, yAxisID:'y1', order:0,
    borderColor:'#059669', backgroundColor:'#059669', borderWidth:2, tension:.3,
    pointRadius:3, pointBackgroundColor:'#059669', spanGaps:true
  };

  if(_portChartInstance){ _portChartInstance.destroy(); _portChartInstance=null; }
  _portChartInstance = new Chart(ctx, {
    type:'bar', data:{ labels, datasets: [...typeDs, changeDs] },
    options:{
      responsive:true,
      plugins:{
        legend:{ position:'top', labels:{ boxWidth:12, font:{size:11}, usePointStyle:true } },
        tooltip:{
          callbacks:{
            label: c => c.dataset.yAxisID === 'y1'
              ? 'Monthly change: ' + (c.parsed.y==null ? '—' : (c.parsed.y>=0?'+':'')+c.parsed.y+'%')
              : c.dataset.label+': '+fmtDollar(c.parsed.y),
            footer: items => 'Net worth: '+fmtDollar(items.filter(i=>i.dataset.yAxisID!=='y1').reduce((s,i)=>s+i.parsed.y,0))
          }
        }
      },
      scales:{
        y:{ stacked:true, ticks:{ callback: v => '$'+moneyAxis(v) }, grid:{ color:'#F0EDE8' } },
        y1:{ position:'right', title:{ display:true, text:'Monthly change', font:{size:11} },
             ticks:{ callback: v => v+'%', font:{size:10} }, grid:{ drawOnChartArea:false } },
        x:{ stacked:true, grid:{ display:false } }
      }
    }
  });
}


/* ── Data Sources sync system ─────────────────────────── */

// Which input fields can be synced, and from where
const SYNC_FIELD_DEFS = [
  { key:'current_income',         label:'Current Income',        source:'budget',    sourceLabel:'Budget avg'  },
  { key:'current_expenses',       label:'Current Expenses',      source:'budget',    sourceLabel:'Budget avg'  },
  { key:'initial_savings',        label:'Initial Savings',       source:'portfolio', sourceLabel:'Portfolio'   },
  { key:'starting_stock_value',   label:'Starting Stock Value',  source:'portfolio', sourceLabel:'Portfolio'   },
  { key:'super_starting_balance', label:'Super Balance',         source:'portfolio', sourceLabel:'Portfolio'   },
];

let _syncBudgetData = null;   // { income: annualised, expenses: annualised }

/** Read budget averages from localStorage + portfolio from storage, then re-render the panel */
function loadSyncData(){
  const toM = todayMonthStr();
  const fromD = new Date(); fromD.setMonth(fromD.getMonth()-5);
  const fromM = `${fromD.getFullYear()}-${String(fromD.getMonth()+1).padStart(2,'0')}`;
  const data = budgGetSeries(fromM, toM);
  const series = data.series||[];
  const incS = series.filter(m=>(m.income_actual??m.income_planned)>0);
  const expS = series.filter(m=>(m.expense_actual??m.expense_planned)>0);
  const avg = (arr, fn) => arr.length ? arr.reduce((s,m)=>s+fn(m),0)/arr.length : 0;
  const avgInc = avg(incS, m=>m.income_actual??m.income_planned??0);
  const avgExp = avg(expS, m=>m.expense_actual??m.expense_planned??0);
  if(avgInc > 0 || avgExp > 0){
    _syncBudgetData = { income: Math.round(avgInc*12), expenses: Math.round(avgExp*12) };
    // Re-apply any fields already set to sync budget
    SYNC_FIELD_DEFS.filter(d=>d.source==='budget').forEach(d=>{
      if((state.syncModes||{})[d.key] === 'sync') applySyncValue(d.key);
    });
  } else {
    _syncBudgetData = null;
  }
  renderSyncPanel();
}

/** Get the live source value for a given field key */
function getSyncValue(key){
  const def = SYNC_FIELD_DEFS.find(d=>d.key===key);
  if(!def) return null;
  if(def.source === 'budget'){
    if(!_syncBudgetData) return null;
    return key==='current_income' ? _syncBudgetData.income : _syncBudgetData.expenses;
  }
  if(def.source === 'portfolio'){
    const t = portTotals(portGetCurrentData());
    if(key==='initial_savings')        return t.cash   > 0 ? t.cash   : null;
    if(key==='starting_stock_value')   return t.stocks > 0 ? t.stocks : null;
    if(key==='super_starting_balance') return t.super  > 0 ? t.super  : null;
  }
  return null;
}

/** Apply the synced value to a field's input + state */
function applySyncValue(key){
  const val = getSyncValue(key);
  if(val === null) return;
  state.inputs[key] = val;
  const el = document.getElementById(key);
  if(el){ el.value = val; el.classList.add('input-synced'); }
}

/** Unlock a field (switch back to manual) */
function unlockField(key){
  const el = document.getElementById(key);
  if(el) el.classList.remove('input-synced');
}

/** Toggle a field between manual and sync modes */
function setSyncMode(key, mode){
  if(!state.syncModes) state.syncModes = {};
  state.syncModes[key] = mode;
  if(mode === 'sync'){
    applySyncValue(key);
  } else {
    unlockField(key);
  }
  saveState();
  renderSyncPanel();
}

/** Sync all fields that have a value available */
function syncAllFields(){
  if(!state.syncModes) state.syncModes = {};
  SYNC_FIELD_DEFS.forEach(def => {
    if(getSyncValue(def.key) !== null){
      state.syncModes[def.key] = 'sync';
      applySyncValue(def.key);
    }
  });
  saveState();
  renderSyncPanel();
}

/** Render the sync panel rows */
function renderSyncPanel(){
  const container = document.getElementById('syncPanelRows');
  if(!container) return;
  if(!state.syncModes) state.syncModes = {};
  container.innerHTML = SYNC_FIELD_DEFS.map(def => {
    const mode     = state.syncModes[def.key] || 'manual';
    const srcVal   = getSyncValue(def.key);
    const hasData  = srcVal !== null;
    const valLabel = hasData ? fmtDollar(srcVal)+'/yr' : 'No data yet';
    return `<div class="sync-row">
      <span class="sync-field-lbl">${def.label}</span>
      <span class="sync-field-val" style="color:${hasData?'#5A625D':'#C8C4BC'}">${valLabel}</span>
      <div class="sync-pills">
        <button class="sync-pill${mode==='manual'?' active':''}" onclick="setSyncMode('${def.key}','manual')">Manual</button>
        <button class="sync-pill${mode==='sync'?' active':''}"${!hasData?' disabled':''} onclick="setSyncMode('${def.key}','sync')">${def.sourceLabel}</button>
      </div>
    </div>`;
  }).join('');
}

/* ── Dashboard ─────────────────────────────────────────
   Overview tab: FIRE progress, net worth, savings rate,
   net worth trend chart, monthly savings vs target.
   ─────────────────────────────────────────────────────── */
let _dashNWChart     = null;
let _dashBudgetChart = null;

function showDashboard(){
  showTab('dashboard');
  renderDashboard();
}

function renderDashboard(){
  _dashFireCard();
  _dashPlanDelta_render();
  _dashStats();
  _dashNWChart_render();
  _dashBudgetChart_render();
}

/* ONE net-worth composition used by the FIRE card, the stat card, and the
   trend chart so they can never disagree. Property counts as EQUITY exactly
   once: the manual Property row in Holdings if logged for that month,
   otherwise live equity from the Properties tab. */
function _nwForMonthAssets(assetsWithValues){
  const hasManualProperty = assetsWithValues.some(a => a.type === 'property' && (a.value||0) > 0);
  let tot = portTotals(assetsWithValues).total;
  if (!hasManualProperty) tot += propModelTotal();
  return tot;
}

function _dashCurrentNW(){
  // portGetCurrentData() already includes property equity — either the
  // user's manual Property row or the automatic equity fallback. Do NOT
  // add property equity again here.
  return portTotals(portGetCurrentData()).total;
}

/* Current net worth for FIRE progress. Prefers tracked Holdings; when none
   are logged yet, falls back to the model inputs so the card isn't stuck
   near $0 for new users. Returns { nw, src }. */
function _dashProgressNW(){
  const tracked = _dashCurrentNW();
  if (tracked > 0) return { nw: tracked, src: 'tracked' };
  const inp = state.inputs || {};
  const fallback = toNumber(inp.initial_savings) + toNumber(inp.starting_stock_value)
                 + toNumber(inp.super_starting_balance) + propModelTotal();
  return { nw: fallback, src: 'inputs' };
}

/* Your FIRE number in TODAY'S dollars: target lifestyle income / drawdown
   rate (e.g. $80k / 4% = $2M). Progress against this means "how much of the
   wealth I ultimately need do I already have" — comparing against the
   inflated projected net worth AT the FIRE date would understate progress. */
function _dashFireNumber(){
  const target = toNumber(state.inputs?.todays_lifestyle_income);
  const swr = toNumber(state.inputs?.stock_swr) || 0.04;
  return target > 0 ? target / swr : null;
}

/* "$X ahead / behind your plan" — anchors to your earliest logged Holdings
   month, projects the plan forward from there (the monthly FIRE target the pace
   line uses, compounding at 5% real like your invested wealth), and compares to
   your net worth now. Net worth is the common currency, so principal, super and
   market moves all count. Returns null until there's history to anchor to. */
function _dashPlanDeltaData(){
  const target = fireModelTargetMonthly();
  if(!(target > 0)) return null;
  const port = portLoad();
  const monthly = port.monthly || {};
  const assets  = port.assets  || [];
  const nwAt = m => _nwForMonthAssets(assets.map(a => ({ ...a, value:(monthly[m]||{})[a.id] || 0 })));
  const months = Object.keys(monthly).sort().filter(m => nwAt(m) > 0);
  if(months.length < 2) return null;                 // need a start point + now
  const m0 = months[0];
  const nw0 = nwAt(m0);
  const nwNow = _dashCurrentNW();
  const [y0, mo0] = m0.split('-').map(Number);
  const now = new Date();
  const n = (now.getFullYear() - y0) * 12 + (now.getMonth() + 1 - mo0);
  if(n < 1 || nwNow <= 0) return null;
  const r = Math.pow(1.05, 1/12) - 1;                // 5% real, monthly
  const planNow = nw0 * Math.pow(1 + r, n) + target * ((Math.pow(1 + r, n) - 1) / r);
  return { delta: nwNow - planNow, planNow, nwNow, n, m0 };
}

function _dashPlanDelta_render(){
  const el = document.getElementById('dashPlanDelta');
  if(!el) return;
  const d = _dashPlanDeltaData();
  if(!d){ el.hidden = true; el.innerHTML = ''; return; }
  const tol = Math.max(1500, d.planNow * 0.02);      // within ~2% reads as on track
  const onTrack = Math.abs(d.delta) <= tol;
  const ahead = d.delta >= 0;
  const cls = onTrack ? 'ontrack' : (ahead ? 'ahead' : 'behind');
  const abs = fmtDollar(Math.abs(Math.round(d.delta)));
  const mLabel = new Date(d.m0 + '-01').toLocaleString('default', { month:'short', year:'numeric' });
  const ico  = onTrack ? '✓' : (ahead ? '▲' : '▼');
  const main = onTrack ? "You're on track with your plan"
             : `You're <b>${abs}</b> ${ahead ? 'ahead of' : 'behind'} your plan`;
  el.hidden = false;
  el.className = 'plan-delta ' + cls;
  el.innerHTML = `<span class="pd-ico">${ico}</span>
    <span class="pd-text"><span class="pd-main">${main}</span>
    <span class="pd-sub">vs the pace needed since ${mLabel} <span class="info-tip" data-tip="plan_delta">?</span></span></span>`;
  initInfoTips();
}

function _dashFireCard(){
  const el = document.getElementById('dashFireCard');
  if(!el) return;
  const { nw: currentNW, src } = _dashProgressNW();
  const fireNumber = _dashFireNumber();
  const sum = state.lastResult ? _extractModelSummary() : null;
  const fireAge = sum?.fire_age ?? null;

  if(fireNumber){
    const pct = Math.min(100, Math.max(0, (currentNW/fireNumber)*100));
    const barColor = '#059669';
    const ageStr = fireAge ? `🔥 FIRE @ ${Math.round(fireAge)}` : '🔥 FIRE Progress';
    const srcNote = src === 'inputs' ? ' · from model inputs — log Holdings for live tracking' : '';
    el.innerHTML = `
      <div class="dash-fire-header">
        <div>
          <div class="dash-fire-label">${ageStr}</div>
          <div class="dash-fire-sub">${fmtDollar(currentNW)} now &nbsp;/&nbsp; ${fmtDollar(fireNumber)} FIRE number (today's $)${srcNote}</div>
        </div>
        <div class="dash-fire-pct" style="color:${barColor}">${pct.toFixed(0)}%</div>
      </div>
      <div class="dash-progress-track" style="margin-top:10px;">
        <div class="dash-progress-fill" style="width:${pct}%;background:${barColor};"></div>
      </div>
      ${!fireAge ? `<div class="small" style="margin-top:8px;"><button class="btn primary" style="white-space:nowrap;" onclick="showTab('results');runModel()">Run Model for your FIRE age</button></div>` : ''}`;
  } else {
    el.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <div>
          <div class="dash-fire-label" style="color:#70736E;font-size:15px;">Set a Target Lifestyle Income to see your FIRE progress</div>
          <div class="dash-fire-sub">Current net worth: <strong>${fmtDollar(currentNW)}</strong></div>
        </div>
        <button class="btn primary" style="white-space:nowrap;" onclick="openInputsDrawer()">Edit Inputs</button>
      </div>
      <div class="dash-progress-track" style="margin-top:10px;">
        <div class="dash-progress-fill" style="width:0%;"></div>
      </div>`;
  }
}

function _dashStats(){
  const s = id => document.getElementById(id);
  const set = (id, txt, sub, color) => {
    if(s(id)) s(id).textContent = txt;
    if(sub && s(id+'Sub')){ s(id+'Sub').textContent = sub; if(color) s(id+'Sub').style.color = color; }
  };

  // Net worth
  const currentNW = _dashCurrentNW();
  const portData   = portLoad();
  const months     = Object.keys(portData.monthly||{}).sort();
  let nwDelta = null;
  if(months.length >= 2){
    const prev = months[months.length-2];
    const prevNW = _nwForMonthAssets((portData.assets||[]).map(a=>({...a, value:(portData.monthly[prev][a.id]||0)})));
    nwDelta = currentNW - prevNW;
  }
  set('dashNW', fmtDollar(currentNW), nwDelta!=null ? (nwDelta>=0?'+':'')+fmtDollar(nwDelta)+' vs last mo' : 'No history yet', nwDelta>=0?'#059669':'#E11D48');

  // To FIRE Number: how much wealth is still missing, in today's dollars —
  // same definitions as the FIRE Progress card so the two always agree.
  const toM = todayMonthStr();
  const fireNumber = _dashFireNumber();
  if(fireNumber){
    const gap = fireNumber - currentNW;
    if(gap <= 0){
      set('dashFireGap', 'Reached 🎉', `FIRE number ${fmtDollar(fireNumber)} (today's $)`, '#059669');
    } else {
      set('dashFireGap', fmtDollar(gap), `of ${fmtDollar(fireNumber)} FIRE number (today's $)`, '#5A625D');
    }
  } else {
    set('dashFireGap', '—', 'Set a Target Lifestyle Income', '#70736E');
  }

  // This month net
  const thisSeries = budgGetSeries(toM, toM).series[0];
  const thisNet = thisSeries?.net_actual ?? thisSeries?.net_planned ?? null;
  const modelMoTarget = fireModelTargetMonthly();
  let tmStr = thisNet!=null ? (thisNet>=0?'+':'')+fmtDollar(thisNet) : '—';
  let tmSub = '', tmColor = '#70736E';
  if(thisNet!=null && modelMoTarget>0){
    tmSub = `Target ${fmtDollar(modelMoTarget)}/mo`;
    tmColor = thisNet >= modelMoTarget ? '#059669' : '#F59E0B';
  } else if(thisNet!=null){
    tmSub = 'No model target yet';
    tmColor = thisNet>=0?'#059669':'#E11D48';
  }
  if(s('dashThisMonth')) s('dashThisMonth').textContent = tmStr;
  if(s('dashThisMonth')) s('dashThisMonth').style.color = thisNet!=null?(thisNet>=0?'#059669':'#E11D48'):'';
  if(s('dashThisMonthSub')){ s('dashThisMonthSub').textContent=tmSub; s('dashThisMonthSub').style.color=tmColor; }

  // Months logged
  const d = _budgLoad();
  const loggedMonths = Object.values(d.months||{}).filter(m=>m.income_actual||m.income_planned>0).length;
  const loggedYears  = (loggedMonths/12).toFixed(1);
  set('dashMonthsLogged', String(loggedMonths), loggedMonths>0?`${loggedYears} years of data`:'Start logging in Budget');
}

function _dashNWChart_render(){
  const wrap = document.getElementById('dashNWChartWrap');
  if(!wrap) return;
  const portData = portLoad();
  const monthly  = portData.monthly||{};
  const assets   = portData.assets||[];
  const months   = Object.keys(monthly).filter(m=>assets.some(a=>(monthly[m][a.id]||0)>0)).sort();
  if(months.length < 2){
    if(_dashNWChart){ _dashNWChart.destroy(); _dashNWChart=null; }
    wrap.innerHTML='<div class="empty-state"><span class="es-icon">📈</span>Add at least two months of Holdings data to see your net worth trend.<div class="es-cta"><button class="btn ghost" style="font-size:12px;" onclick="showPortfolioTab()">Open Holdings</button></div></div>';
    return;
  }
  if(!wrap.querySelector('#dashNWCanvas')) wrap.innerHTML='<canvas id="dashNWCanvas" style="max-height:240px;"></canvas>';
  const ctx = wrap.querySelector('#dashNWCanvas').getContext('2d');
  const labels = months.map(m=>{ const [y,mo]=m.split('-'); return new Date(y,mo-1).toLocaleString('default',{month:'short',year:'2-digit'}); });
  const totals = months.map(m=>_nwForMonthAssets(assets.map(a=>({...a, value:(monthly[m][a.id]||0)}))));

  if(_dashNWChart){ _dashNWChart.destroy(); _dashNWChart=null; }
  // Dashed line = FIRE number in today's dollars (lifestyle income / SWR) —
  // same definition as the FIRE Progress card above, so the two agree.
  const fireNumber = _dashFireNumber();
  const datasets = [
    { label:'Net Worth', data:totals, borderColor:'#059669', backgroundColor:'rgba(5,150,105,.12)', fill:true, tension:.3, pointRadius:4, pointBackgroundColor:'#059669', borderWidth:2.5 },
  ];
  if(fireNumber){
    datasets.push({ label:'FIRE Number', data:Array(months.length).fill(fireNumber), borderColor:'#F59E0B', borderDash:[6,4], borderWidth:1.5, pointRadius:0, fill:false, tension:0 });
  }
  _dashNWChart = new Chart(ctx, {
    type:'line', data:{ labels, datasets },
    options:{
      responsive:true,
      plugins:{
        legend:{ position:'top', labels:{ boxWidth:12, font:{size:11}, usePointStyle:true } },
        tooltip:{ callbacks:{ label: c=>c.dataset.label+': '+fmtDollar(c.parsed.y) } }
      },
      scales:{
        y:{ ticks:{ callback:v=>'$'+moneyAxis(v) }, grid:{ color:'#F0EDE8' } },
        x:{ grid:{ display:false } }
      }
    }
  });
}

function _dashBudgetChart_render(){
  const wrap = document.getElementById('dashBudgetChartWrap');
  if(!wrap) return;
  // Last 12 months of budget data
  const toM   = todayMonthStr();
  const fromD = new Date(); fromD.setMonth(fromD.getMonth()-11);
  const fromM = `${fromD.getFullYear()}-${String(fromD.getMonth()+1).padStart(2,'0')}`;
  const series = budgGetSeries(fromM, toM).series;
  const logged = series.filter(m=>m.net_actual!=null);
  if(logged.length < 1){
    if(_dashBudgetChart){ _dashBudgetChart.destroy(); _dashBudgetChart=null; }
    wrap.innerHTML='<div class="empty-state"><span class="es-icon">📊</span>Log a few budget months to see your savings history.<div class="es-cta"><button class="btn ghost" style="font-size:12px;" onclick="showBudgetTab()">Open Budget</button></div></div>';
    return;
  }
  if(!wrap.querySelector('#dashBudgetCanvas')) wrap.innerHTML='<canvas id="dashBudgetCanvas" style="max-height:200px;"></canvas>';
  const ctx = wrap.querySelector('#dashBudgetCanvas').getContext('2d');
  const labels = series.map(m=>{ const [y,mo]=m.month.split('-'); return new Date(y,mo-1).toLocaleString('default',{month:'short'}); });
  // Wealth built, split into 3 non-fungible FIRE buckets (see _monthWealthSegments):
  // liquid (spendable) + super (locked) + home equity (illiquid). All count
  // toward FIRE on a total-net-worth basis; stacking keeps them visible.
  const budStore = _budgLoad();
  const segs   = series.map(m => _monthWealthSegments(budStore.months[m.month]));
  const liquid = segs.map(s => s ? s.liquid : null);
  const superA = segs.map(s => s ? s.super  : null);
  const equity = segs.map(s => s ? s.equity : null);
  const target = fireModelTargetMonthly() || null;
  const targets = series.map(()=>target);

  const C = { liquid:'#059669', super:'#6366F1', equity:'#F59E0B', target:'#151816' };

  if(_dashBudgetChart){ _dashBudgetChart.destroy(); _dashBudgetChart=null; }
  _dashBudgetChart = new Chart(ctx, {
    type:'bar',
    data:{
      labels,
      datasets:[
        { label:'Invested / saved', data:liquid, backgroundColor:C.liquid, stack:'wealth', borderRadius:{topLeft:0,topRight:0}, borderSkipped:false },
        { label:'Super',            data:superA, backgroundColor:C.super,  stack:'wealth', borderSkipped:false },
        { label:'Home equity',      data:equity, backgroundColor:C.equity, stack:'wealth', borderRadius:{topLeft:3,topRight:3}, borderSkipped:false },
        ...(target ? [{ label:'Target', data:targets, type:'line',
          borderColor:C.target, borderDash:[5,4], borderWidth:1.5, pointRadius:0, fill:false, tension:0 }] : [])
      ]
    },
    options:{
      responsive:true,
      plugins:{
        legend:{
          position:'top',
          labels:{ boxWidth:12, font:{size:11}, usePointStyle:true }
        },
        tooltip:{
          callbacks:{
            label: c => c.dataset.label + ': ' + fmtDollar(c.parsed.y),
            footer: items => {
              const t = items.filter(i => i.dataset.type !== 'line')
                             .reduce((a,i)=>a+(i.parsed.y||0), 0);
              return 'Total wealth built: ' + fmtDollar(t);
            }
          }
        }
      },
      scales:{
        y:{ stacked:true, ticks:{ callback:v=>'$'+moneyAxis(v) }, grid:{ color:'#F0EDE8' }, beginAtZero:true },
        x:{ stacked:true, grid:{ display:false } }
      }
    }
  });
}

/* ── Scenarios ─────────────────────────────────────────
   Saves named snapshots of model runs to localStorage so
   you can compare how inputs changes affect FIRE date.
   ─────────────────────────────────────────────────────── */
const _WM_SCENARIOS_KEY = 'wm_scenarios';
const SCEN_COLORS = ['#7C3AED','#0891B2','#D97706','#059669','#DC2626','#BE185D','#0369A1','#92400E'];
let _pinnedScenarios = new Set();

function _extractScenarioChartData() {
  const result = state.lastResult;
  if (!result?.rows?.length) return null;
  const rows = result.rows;
  const cols = result.columns || Object.keys(rows[0] || {});
  const yearKey  = findKey(cols, ["Year","Calendar_Year"]);
  const nwKey    = findKey(cols, ["Net_Worth_Incl_PPOR","Net_Worth_Ex_PPOR","Net_Worth","Net_Worth_Incl_Super_Incl_PPOR"]);
  const fireKey  = findKey(cols, ["FIRE_Eligible","fire_eligible"]);
  // Downsample to yearly (take last row per year) to keep storage small
  let useRows = rows;
  if (yearKey && rows.length > 60) {
    const byYear = {};
    rows.forEach(r => { byYear[String(toNumber(r[yearKey]))] = r; });
    useRows = Object.values(byYear);
  }
  return {
    labels:    useRows.map(r => yearKey ? toNumber(r[yearKey]) : null),
    netWorth:  useRows.map(r => nwKey   ? toNumber(r[nwKey])   : 0),
    fireIndex: fireKey ? useRows.findIndex(r => toNumber(r[fireKey]) === 1) : -1
  };
}

function toggleScenarioPin(id) {
  if (_pinnedScenarios.has(id)) _pinnedScenarios.delete(id);
  else _pinnedScenarios.add(id);
  updateChartScenarios();
  renderScenCompareBar();
  renderScenarios();
}

function updateChartScenarios() {
  if (!chart) return;
  chart.data.datasets = chart.data.datasets.filter(ds => !ds._isScenario);
  const list = _scenLoad();
  const currentLabels = chart.data.labels || [];
  _pinnedScenarios.forEach(id => {
    const s = list.find(s => s.id === id);
    if (!s?.chartData?.netWorth) return;
    const byYear = {};
    s.chartData.labels.forEach((yr, i) => { byYear[yr] = s.chartData.netWorth[i]; });
    const aligned = currentLabels.map(lbl => byYear[toNumber(lbl)] ?? null);
    chart.data.datasets.push({
      _isScenario: true,
      label: s.label,
      data: aligned,
      borderColor: (s.color || '#888') + 'BB',
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderDash: [6, 3],
      pointRadius: 2,
      pointBackgroundColor: s.color || '#888',
      tension: 0.3,
      yAxisID: 'y',
      spanGaps: true,
    });
  });
  chart.update('none');
}

function renderScenCompareBar() {
  const bar = document.getElementById('scenCompareBar');
  if (!bar) return;
  const list = _scenLoad();
  if (!list.length || !state.lastResult) { bar.style.display = 'none'; return; }
  bar.style.display = '';
  bar.innerHTML = `<span style="font-size:11px;color:#6A716B;white-space:nowrap;">Compare:</span>` +
    list.map(s => {
      const pinned = _pinnedScenarios.has(s.id);
      const color  = s.color || '#888';
      const fire   = s.summary?.fire_age ? `FIRE ${Math.round(s.summary.fire_age)}` : '—';
      const hasCd  = !!s.chartData;
      return `<button class="scen-chip${pinned ? ' pinned' : ''}"
        style="--chip-color:${color};--chip-bg:${color}18"
        onclick="toggleScenarioPin('${s.id}')"
        ${!hasCd ? 'title="Re-save this scenario to enable chart overlay"' : ''}>
        <span class="scen-chip-dot" style="background:${color}"></span>
        ${escapeHtml(s.label)}
        <span class="scen-chip-meta"> · ${fire}</span>
      </button>`;
    }).join('');
}

function toggleScenarioDropdown(force) {
  const dd = document.getElementById('scenarioDropdown');
  if (!dd) return;
  const open = force !== undefined ? force : dd.style.display === 'none';
  dd.style.display = open ? '' : 'none';
}

// Close dropdown when clicking outside
document.addEventListener('click', e => {
  const dd  = document.getElementById('scenarioDropdown');
  const btn = document.getElementById('btnLoadScenario');
  if (dd && btn && !dd.contains(e.target) && !btn.contains(e.target)) {
    dd.style.display = 'none';
  }
});

function _scenLoad(){
  try{ const s = JSON.parse(localStorage.getItem(_WM_SCENARIOS_KEY)||'[]'); return Array.isArray(s)?s:[]; } catch(_){ return []; }
}
function _scenStore(list){
  try{ localStorage.setItem(_WM_SCENARIOS_KEY, JSON.stringify(list)); } catch(_){}
  _queueSync();
}

/** Pull the key headline numbers out of the last model result */
function _extractModelSummary(){
  const result = state.lastResult;
  if(!result || !result.rows || !result.rows.length) return null;
  const rows = result.rows;
  const cols = result.columns || Object.keys(rows[0]||{});
  const ageKey     = findKey(cols, ["Age"]);
  const yearKey    = findKey(cols, ["Year","Calendar_Year"]);
  const nwKey      = findKey(cols, ["Net_Worth_Incl_PPOR","Net_Worth_Ex_PPOR","Net_Worth","Net_Worth_Incl_Super_Incl_PPOR","Net_Worth_Incl_Super_Ex_PPOR"]);
  const stockKey   = findKey(cols, ["Stock_Balance_End","Total_Stock_Balance","Stocks"]);
  const superKey   = findKey(cols, ["Super_Balance","Super_Balance_End","Super"]);
  const cashKey    = findKey(cols, ["Cash_Balance_End","Cumulative_Savings","Cash"]);
  const fireEligKey= findKey(cols, ["FIRE_Eligible","fire_eligible"]);
  const fireIdx    = fireEligKey ? rows.findIndex(r=>toNumber(r[fireEligKey])===1) : -1;
  const gN = (r,k) => k ? toNumber(r[k]||0) : 0;
  const getNW = r => nwKey && r[nwKey]!=null ? toNumber(r[nwKey]) : (gN(r,cashKey)+gN(r,stockKey)+gN(r,superKey));
  const fireRow = fireIdx>=0 ? rows[fireIdx] : null;
  const endRow  = rows[rows.length-1];
  const inc  = Number(state.inputs.current_income  || 0);
  const exp  = Number(state.inputs.current_expenses || 0);
  return {
    fire_age:   fireRow && ageKey  ? toNumber(fireRow[ageKey])  : null,
    fire_year:  fireRow && yearKey ? toNumber(fireRow[yearKey]) : null,
    fire_nw:    fireRow ? Math.round(getNW(fireRow)) : null,
    end_nw:     endRow  ? Math.round(getNW(endRow))  : null,
    end_age:    endRow  && ageKey  ? toNumber(endRow[ageKey])   : null,
    income:     inc,
    expenses:   exp,
    savings_rate: inc>0 ? Math.max(0,Math.min(1,(inc-exp)/inc)) : null,
  };
}

function saveScenario(){
  if (!isPro() && _scenLoad().length >= 1) {
    showUpgradeModal('Free plan is limited to 1 saved scenario. Upgrade for unlimited scenarios.');
    return;
  }
  const summary = _extractModelSummary();
  if(!summary){ alert('Run the model first.'); return; }
  const today = new Date().toLocaleDateString('en-AU',{day:'2-digit',month:'short',year:'numeric'});
  const fireStr = summary.fire_age ? `FIRE @ ${Math.round(summary.fire_age)}` : 'No FIRE';
  const defaultLabel = `${fireStr} — ${today}`;
  const label = prompt('Name this scenario:', defaultLabel);
  if(label === null) return;
  const list = _scenLoad();
  const color = SCEN_COLORS[list.length % SCEN_COLORS.length];
  list.unshift({
    id: Date.now().toString(),
    label: label||defaultLabel,
    date: new Date().toISOString().slice(0,10),
    color,
    inputs: {...state.inputs},
    property_list: JSON.parse(JSON.stringify(state.property_list||[])),
    life_events: JSON.parse(JSON.stringify(state.life_events||[])),
    stock_contribution_overrides: JSON.parse(JSON.stringify(state.stock_contribution_overrides||[])),
    summary,
    chartData: _extractScenarioChartData()
  });
  _scenStore(list);
  renderScenarios();
  renderScenCompareBar();
  // Auto-open scenarios section
  const body = document.getElementById('scenariosBody');
  const chev = document.getElementById('scenariosChev');
  if(body && body.classList.contains('hidden')){ body.classList.remove('hidden'); if(chev) chev.textContent='▾'; }
}

function loadScenario(id){
  const s = _scenLoad().find(s=>s.id===id);
  if(!s) return;
  if(!confirm(`Load "${s.label}"?\n\nThis replaces your current inputs.`)) return;
  state.inputs = {...s.inputs};
  state.property_list = JSON.parse(JSON.stringify(s.property_list||[]));
  state.life_events = JSON.parse(JSON.stringify(s.life_events||[]));
  state.stock_contribution_overrides = JSON.parse(JSON.stringify(s.stock_contribution_overrides||[]));
  saveState();
  bindCoreInputs();
  showTab('results');
  runModel();
}

function deleteScenario(id){
  const s = _scenLoad().find(s=>s.id===id);
  if(!s) return;
  if(!confirm(`Delete "${s.label}"?`)) return;
  _scenStore(_scenLoad().filter(x=>x.id!==id));
  renderScenarios();
}

function renameScenario(id){
  const list = _scenLoad();
  const s = list.find(s=>s.id===id);
  if(!s) return;
  const lbl = prompt('Rename:', s.label);
  if(lbl===null || !lbl.trim()) return;
  s.label = lbl.trim();
  _scenStore(list);
  renderScenarios();
}

function renderScenarios(){
  const list = _scenLoad();

  // Show/hide action bar buttons
  const saveBtn = document.getElementById('btnSaveScenario');
  const loadBtn = document.getElementById('btnLoadScenario');
  if(saveBtn) saveBtn.style.display = state.lastResult ? 'inline-flex' : 'none';
  if(loadBtn) loadBtn.style.display = list.length ? 'inline-flex' : 'none';

  const container = document.getElementById('scenariosList');
  if(!container) return;

  if(!list.length){
    container.innerHTML = '';
    renderScenCompareBar();
    return;
  }

  const fireAges = list.map(s=>s.summary?.fire_age).filter(a=>a!=null);
  const bestFire = fireAges.length ? Math.min(...fireAges) : null;

  container.innerHTML = list.map((s,i) => {
    const sum     = s.summary || {};
    const fireAge = sum.fire_age ? Math.round(sum.fire_age) : null;
    const isBest  = bestFire != null && fireAge === bestFire && fireAges.length > 1;
    const color   = s.color || '#ccc';
    let fireDiff = '';
    if(i > 0 && list[0].summary?.fire_age != null && sum.fire_age != null){
      const delta = Math.round(sum.fire_age - list[0].summary.fire_age);
      if(delta > 0) fireDiff = `<span style="color:#E11D48;font-size:11px;"> +${delta}yr</span>`;
      else if(delta < 0) fireDiff = `<span style="color:#059669;font-size:11px;"> ${delta}yr</span>`;
    }
    return `<div style="display:flex;align-items:center;gap:8px;padding:8px 14px;border-bottom:1px solid #F0EDE8;" onmouseenter="this.style.background='#FAFAF8'" onmouseleave="this.style.background=''">
      <span style="width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0;"></span>
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:600;color:#151816;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${escapeHtml(s.label)}">${escapeHtml(s.label)}</div>
        <div style="font-size:11px;color:#6A716B;">${s.date} · FIRE ${fireAge || '—'}${fireDiff}${isBest?' 🏆':''}</div>
      </div>
      <button class="btn ghost" style="padding:3px 10px;font-size:12px;white-space:nowrap;" onclick="loadScenario('${s.id}');toggleScenarioDropdown(false);">Load</button>
      <button style="background:none;border:none;color:#C4B5B0;cursor:pointer;font-size:14px;padding:0 2px;" onclick="deleteScenario('${s.id}')" title="Delete">✕</button>
    </div>`;
  }).join('');

  renderScenCompareBar();
}

/* ── Dev mode test data ───────────────────────────────── */
function fillTestData(){
  // Model inputs
  const testInputs = {
    current_age: 32, end_age: 65,
    todays_lifestyle_income: 80000,
    current_income: 140000, current_expenses: 62000,
    initial_savings: 85000,
    inflation: 0.025, average_salary_increase: 0.035,
    stock_growth: 0.07, stock_yearly_contribution: 15000,
    starting_stock_value: 45000, stock_swr: 0.04,
    super_swr: 0.04, super_access_age: 60,
    super_starting_balance: 95000, super_sg_rate: 0.12,
    super_growth: 0.065, super_additional_annual: 5000,
  };
  Object.entries(testInputs).forEach(([k,v]) => {
    state.inputs[k] = v;
    const el = document.getElementById(k);
    if(el) el.value = v;
  });

  // Budget — populate current month's form then autosave
  const _seedCurrentBudget = () => {
    const incBody = document.getElementById('incomeTableBody');
    const expBody = document.getElementById('expenseTableBody');
    if(incBody){ incBody.innerHTML=''; _incRowCounter=0; }
    if(expBody){ expBody.innerHTML=''; _expRowCounter=0; }
    addIncomeRow({ source:'Salary / Wages', description:'Main job', budget:8500, actual:8200, freq:'Monthly', is_gross:false });
    [
      { group:'Housing',      subcategory:'Rent',                    description:'Apartment', budget:2400, actual:2400 },
      { group:'Food & Drink', subcategory:'Groceries',               description:'',          budget:600,  actual:570  },
      { group:'Transport',    subcategory:'Fuel',                    description:'',          budget:200,  actual:185  },
      { group:'Housing',      subcategory:'Utilities',               description:'',          budget:180,  actual:195  },
      { group:'Food & Drink', subcategory:'Dining Out',              description:'',          budget:300,  actual:340  },
      { group:'Health',       subcategory:'Private Health Insurance',description:'',          budget:200,  actual:200  },
      { group:'Personal',     subcategory:'Clothing',                description:'',          budget:150,  actual:90   },
    ].forEach(r => addExpenseRow({ ...r, freq:'Monthly' }));
    updateBudgetSummary();
    doAutosave();
  };

  // Seed 11 past months directly into localStorage
  const jitter = () => Math.round((Math.random()-0.4)*300);
  for(let i=11; i>=1; i--){
    const d = new Date(); d.setMonth(d.getMonth()-i);
    const m = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    _budgUpsertMonth(m, {
      income_planned: 8500, income_actual: 8200 + jitter(),
      expenses: [
        {category:'Rent',                    planned:2400, actual:2400},
        {category:'Groceries',               planned:600,  actual:580+jitter()},
        {category:'Fuel',                    planned:200,  actual:190+jitter()},
        {category:'Utilities',               planned:180,  actual:185+jitter()},
        {category:'Dining Out',              planned:300,  actual:310+jitter()},
        {category:'Private Health Insurance',planned:200,  actual:200},
      ]
    });
  }

  // Populate current month form and refresh UI
  if(document.getElementById('budgetMonthLabel')){
    _seedCurrentBudget();
    loadBudgetYear(budgetYear);
    renderFireProgress();
  }
  // If already on budget tab, populate immediately too
  if(document.getElementById('tab-budget')?.classList.contains('active')) _seedCurrentBudget();
  // Refresh sync data immediately (localStorage is ready)
  loadSyncData();

  // Portfolio assets — new monthly format
  const portAssets = [
    { id:1, name:'ING Savings',     type:'cash'     },
    { id:2, name:'Vanguard VDHG',   type:'stocks'   },
    { id:3, name:'AustralianSuper', type:'super'    },
    { id:4, name:'Family Home',     type:'property' },
  ];
  const portMonthly = {};
  for(let i=11; i>=0; i--){
    const d = new Date(); d.setMonth(d.getMonth()-i);
    const m = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const g = (11-i)*0.008;
    portMonthly[m] = {
      1: Math.round(85000 + (11-i)*400),
      2: Math.round(45000 * (1+g)),
      3: Math.round(95000 * (1+g*0.9)),
      4: 750000
    };
  }
  localStorage.setItem('wm_portfolio', JSON.stringify({ assets: portAssets, monthly: portMonthly }));

  saveState();
  // Refresh portfolio tab if open
  if(document.getElementById('tab-portfolio')?.classList.contains('active')) renderPortfolioTab();
  renderSyncPanel();

  const btn = document.getElementById('devFillBtn');
  if(btn){ btn.textContent='✓ Filled'; setTimeout(()=>{ btn.textContent='🧪 Fill test data'; },2000); }
}

window.addEventListener('load', ()=>{
  if(!DEV_MODE) return;
  const btn = document.createElement('button');
  btn.id = 'devFillBtn';
  btn.textContent = '🧪 Fill test data';
  btn.style.cssText = 'position:fixed;bottom:16px;left:16px;z-index:9999;background:#151816;color:#fff;border:none;border-radius:6px;padding:7px 13px;font-size:12px;font-weight:600;cursor:pointer;opacity:.85;';
  btn.onclick = fillTestData;
  document.body.appendChild(btn);
});

/** Re-apply all currently-synced fields — call after portfolio assets change */
function reapplySyncedFields(){
  if(!state.syncModes) return;
  SYNC_FIELD_DEFS.forEach(def => {
    if(state.syncModes[def.key] === 'sync') applySyncValue(def.key);
  });
}


