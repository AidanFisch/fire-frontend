/* ══════════════════════════════════════════════════════════
   Australian Tax Data & Calculation Engine
   ══════════════════════════════════════════════════════════ */

const TAX_DATA = {
  '2023-24': {
    label: '2023–24',
    brackets: [
      { min:      0, rate: 0,     base:     0, label: '$0 – $18,200'         },
      { min:  18200, rate: 0.19,  base:     0, label: '$18,201 – $37,000'    },
      { min:  37000, rate: 0.325, base:  3572, label: '$37,001 – $87,000'    },
      { min:  87000, rate: 0.37,  base: 19822, label: '$87,001 – $180,000'   },
      { min: 180000, rate: 0.45,  base: 54232, label: '$180,001+'            },
    ],
    lito: { full: 700, fullTo: 37500, mid: 325, taper1: 0.05, taper1From: 37500, taper2: 0.015, taper2From: 45000, taper2To: 66667 },
    medicareRate: 0.02, medicareThreshold: 24276, medicarePhaseEnd: 30345,
    mlsThreshold: 90000,
    mlsRates: [{ max: 105000, rate: 0.01 }, { max: 140000, rate: 0.0125 }, { max: Infinity, rate: 0.015 }],
    hecsRates: [
      { max:  51550, rate: 0    }, { max:  59518, rate: 0.01  }, { max:  63089, rate: 0.02  },
      { max:  66875, rate: 0.025}, { max:  70888, rate: 0.03  }, { max:  75141, rate: 0.035 },
      { max:  79649, rate: 0.04 }, { max:  84429, rate: 0.045 }, { max:  89494, rate: 0.05  },
      { max:  94865, rate: 0.055}, { max: 100557, rate: 0.06  }, { max: 106590, rate: 0.065 },
      { max: 112985, rate: 0.07 }, { max: 119765, rate: 0.075}, { max: 126951, rate: 0.08  },
      { max: 134568, rate: 0.085}, { max: 142642, rate: 0.09 }, { max: 151200, rate: 0.095 },
      { max: Infinity, rate: 0.10 },
    ],
    defaultSuperRate: 11, concCap: 27500,
  },
  '2024-25': {
    label: '2024–25',
    brackets: [
      { min:      0, rate: 0,    base:     0, label: '$0 – $18,200'         },
      { min:  18200, rate: 0.16, base:     0, label: '$18,201 – $45,000'    },
      { min:  45000, rate: 0.30, base:  4288, label: '$45,001 – $135,000'   },
      { min: 135000, rate: 0.37, base: 31288, label: '$135,001 – $190,000'  },
      { min: 190000, rate: 0.45, base: 51638, label: '$190,001+'            },
    ],
    lito: { full: 700, fullTo: 37500, mid: 325, taper1: 0.05, taper1From: 37500, taper2: 0.015, taper2From: 45000, taper2To: 66667 },
    medicareRate: 0.02, medicareThreshold: 27222, medicarePhaseEnd: 34028,
    mlsThreshold: 93000,
    mlsRates: [{ max: 108000, rate: 0.01 }, { max: 144000, rate: 0.0125 }, { max: Infinity, rate: 0.015 }],
    hecsRates: [
      { max:  54434, rate: 0    }, { max:  62849, rate: 0.01  }, { max:  66620, rate: 0.02  },
      { max:  70617, rate: 0.025}, { max:  74855, rate: 0.03  }, { max:  79346, rate: 0.035 },
      { max:  84107, rate: 0.04 }, { max:  88756, rate: 0.045}, { max:  93969, rate: 0.05  },
      { max:  99996, rate: 0.055}, { max: 105996, rate: 0.06 }, { max: 112355, rate: 0.065 },
      { max: 119097, rate: 0.07 }, { max: 126243, rate: 0.075}, { max: 133818, rate: 0.08  },
      { max: 141847, rate: 0.085}, { max: 150357, rate: 0.09 }, { max: 159280, rate: 0.095 },
      { max: Infinity, rate: 0.10 },
    ],
    defaultSuperRate: 11.5, concCap: 30000,
  },
  '2025-26': {
    label: '2025–26',
    brackets: [
      { min:      0, rate: 0,    base:     0, label: '$0 – $18,200'         },
      { min:  18200, rate: 0.16, base:     0, label: '$18,201 – $45,000'    },
      { min:  45000, rate: 0.30, base:  4288, label: '$45,001 – $135,000'   },
      { min: 135000, rate: 0.37, base: 31288, label: '$135,001 – $190,000'  },
      { min: 190000, rate: 0.45, base: 51638, label: '$190,001+'            },
    ],
    lito: { full: 700, fullTo: 37500, mid: 325, taper1: 0.05, taper1From: 37500, taper2: 0.015, taper2From: 45000, taper2To: 66667 },
    medicareRate: 0.02, medicareThreshold: 27222, medicarePhaseEnd: 34028,
    mlsThreshold: 93000,
    mlsRates: [{ max: 108000, rate: 0.01 }, { max: 144000, rate: 0.0125 }, { max: Infinity, rate: 0.015 }],
    hecsRates: [
      { max:  54434, rate: 0    }, { max:  62849, rate: 0.01  }, { max:  66620, rate: 0.02  },
      { max:  70617, rate: 0.025}, { max:  74855, rate: 0.03  }, { max:  79346, rate: 0.035 },
      { max:  84107, rate: 0.04 }, { max:  88756, rate: 0.045}, { max:  93969, rate: 0.05  },
      { max:  99996, rate: 0.055}, { max: 105996, rate: 0.06 }, { max: 112355, rate: 0.065 },
      { max: 119097, rate: 0.07 }, { max: 126243, rate: 0.075}, { max: 133818, rate: 0.08  },
      { max: 141847, rate: 0.085}, { max: 150357, rate: 0.09 }, { max: 159280, rate: 0.095 },
      { max: Infinity, rate: 0.10 },
    ],
    defaultSuperRate: 12, concCap: 30000,
  },
};

/** Calculate annual tax breakdown for a given gross annual income */
function calcTax(grossAnnual, settings){
  const fy = TAX_DATA[settings.fy];
  if(!fy || !grossAnnual || grossAnnual <= 0) return { incomeTax:0, lito:0, medicare:0, mls:0, hecs:0, totalTax:0, effectiveRate:0, marginalRate:0, net: grossAnnual || 0 };

  // 1. Base income tax (bracket + base formula)
  let incomeTax = 0;
  for(let i = fy.brackets.length - 1; i >= 0; i--){
    if(grossAnnual > fy.brackets[i].min){
      incomeTax = fy.brackets[i].base + (grossAnnual - fy.brackets[i].min) * fy.brackets[i].rate;
      break;
    }
  }

  // 2. LITO (Low Income Tax Offset)
  const L = fy.lito;
  let lito = 0;
  if(grossAnnual <= L.fullTo)         lito = L.full;
  else if(grossAnnual <= L.taper2From) lito = Math.max(0, L.full  - (grossAnnual - L.taper1From) * L.taper1);
  else if(grossAnnual <= L.taper2To)  lito = Math.max(0, L.mid   - (grossAnnual - L.taper2From) * L.taper2);
  incomeTax = Math.max(0, incomeTax - lito);

  // 3. Medicare levy (with phase-in for low incomes)
  let medicare = 0;
  if(grossAnnual > fy.medicareThreshold){
    const full = grossAnnual * fy.medicareRate;
    const phaseIn = (grossAnnual - fy.medicareThreshold) * 0.1;
    medicare = grossAnnual < fy.medicarePhaseEnd ? Math.min(full, phaseIn) : full;
  }

  // 4. Medicare Levy Surcharge (no PHI and above threshold)
  let mls = 0;
  if(!settings.hasPHI && grossAnnual > fy.mlsThreshold){
    for(const tier of fy.mlsRates){
      if(grossAnnual <= tier.max){ mls = grossAnnual * tier.rate; break; }
    }
  }

  // 5. HECS/HELP repayment
  let hecs = 0;
  if(settings.hasHECS){
    for(const tier of fy.hecsRates){
      if(grossAnnual <= tier.max){ hecs = grossAnnual * tier.rate; break; }
    }
  }

  const totalTax    = incomeTax + medicare + mls + hecs;
  const effectiveRate = grossAnnual > 0 ? totalTax / grossAnnual : 0;

  // Marginal rate = highest bracket rate that applies
  let marginalRate = 0;
  for(let i = fy.brackets.length - 1; i >= 0; i--){
    if(grossAnnual > fy.brackets[i].min){ marginalRate = fy.brackets[i].rate; break; }
  }

  return {
    incomeTax:    Math.round(incomeTax),
    lito:         Math.round(lito),
    medicare:     Math.round(medicare),
    mls:          Math.round(mls),
    hecs:         Math.round(hecs),
    totalTax:     Math.round(totalTax),
    effectiveRate,
    marginalRate,
    net:          Math.round(grossAnnual - totalTax),
  };
}

/* ── Tax Settings state ── */
const DEFAULT_TAX_SETTINGS = { fy:'2025-26', superRate:12, hasPHI:false, hasHECS:false, showCapWarning:true };
let TAX_SETTINGS = (function(){
  try{
    const s = localStorage.getItem('fire_tax_settings_v1');
    if(s){
      const merged = { ...DEFAULT_TAX_SETTINGS, ...JSON.parse(s) };
      // Migrate stale app defaults (not user choices): SG is legislated 12%
      // from 1 Jul 2025, and old builds defaulted the FY to 2024-25 with
      // pre-Stage-3 brackets — move both forward.
      if(merged.superRate === 11.5 || merged.superRate === 11) merged.superRate = 12;
      if(merged.fy === '2024-25') merged.fy = '2025-26';
      return merged;
    }
  }catch(_){}
  return { ...DEFAULT_TAX_SETTINGS };
})();

function saveTaxSettings(){
  try{ localStorage.setItem('fire_tax_settings_v1', JSON.stringify(TAX_SETTINGS)); }catch(_){}
}

/* ══════════════════════════════════════════════════════════
   Settings — navigation + category management
   ══════════════════════════════════════════════════════════ */

/* ── Navigation ── */
function openSettings(){
  settingsGoHome();
  if (window._refreshInstallButtons) _refreshInstallButtons();
  document.getElementById('settingsOverlay').style.display = 'flex';
}
function closeSettings(){ document.getElementById('settingsOverlay').style.display = 'none'; }
function handleSettingsOverlayClick(e){ if(e.target === e.currentTarget) closeSettings(); }

function settingsGoHome(){
  document.getElementById('settingsHome').style.display = 'block';
  document.querySelectorAll('.settings-page').forEach(p => p.classList.remove('active'));
  document.getElementById('settingsTitle').textContent = 'Settings';
  const back = document.getElementById('settingsBackBtn');
  back.style.display = 'none';
}

function showSettingsPage(page){
  document.getElementById('settingsHome').style.display = 'none';
  document.querySelectorAll('.settings-page').forEach(p => p.classList.remove('active'));
  const back = document.getElementById('settingsBackBtn');
  back.style.display = 'flex';

  if(page === 'budgetCats'){
    document.getElementById('settingsTitle').textContent = 'Budget Categories';
    document.getElementById('settingsPageBudgetCats').classList.add('active');
    renderSettingsCats();
  } else if(page === 'taxSuper'){
    document.getElementById('settingsTitle').textContent = 'Tax & Super';
    document.getElementById('settingsPageTaxSuper').classList.add('active');
    renderTaxSettings();
  }
}

/* ── Tax & Super page ── */

function renderTaxSettings(){
  const s = TAX_SETTINGS;
  const fy = TAX_DATA[s.fy];

  // Populate controls
  const fyEl = document.getElementById('tsFY');
  if(fyEl) fyEl.value = s.fy;

  const srEl = document.getElementById('tsSuperRate');
  if(srEl) srEl.value = s.superRate;

  document.getElementById('tsPHI').checked        = s.hasPHI;
  document.getElementById('tsHECS').checked       = s.hasHECS;
  document.getElementById('tsCapWarning').checked = s.showCapWarning;

  // Bracket toggle label
  const lbl = document.getElementById('tsBracketLbl');
  if(lbl && fy) lbl.textContent = `View ${fy.label} brackets`;

  // Render bracket table
  renderBracketTable();
}

function onTaxSettingChange(){
  const fy = document.getElementById('tsFY')?.value || '2024-25';
  const fyData = TAX_DATA[fy];

  TAX_SETTINGS.fy           = fy;
  TAX_SETTINGS.superRate    = parseFloat(document.getElementById('tsSuperRate')?.value) || fyData?.defaultSuperRate || 11.5;
  TAX_SETTINGS.hasPHI       = document.getElementById('tsPHI')?.checked || false;
  TAX_SETTINGS.hasHECS      = document.getElementById('tsHECS')?.checked || false;
  TAX_SETTINGS.showCapWarning = document.getElementById('tsCapWarning')?.checked ?? true;

  // Auto-update super rate to FY default when user changes FY (if they haven't customised it)
  if(document.getElementById('tsSuperRate') && fyData){
    // Only auto-update if value matches a known default (i.e. user hasn't customised)
    const knownDefaults = Object.values(TAX_DATA).map(d => d.defaultSuperRate);
    if(knownDefaults.includes(TAX_SETTINGS.superRate)){
      TAX_SETTINGS.superRate = fyData.defaultSuperRate;
      document.getElementById('tsSuperRate').value = TAX_SETTINGS.superRate;
    }
  }

  saveTaxSettings();

  // Refresh bracket label + table
  const lbl = document.getElementById('tsBracketLbl');
  if(lbl && fyData) lbl.textContent = `View ${fyData.label} brackets`;
  renderBracketTable();
}

function renderBracketTable(){
  const tbody = document.getElementById('tsBracketRows');
  if(!tbody) return;
  const fy = TAX_DATA[TAX_SETTINGS.fy];
  if(!fy){ tbody.innerHTML = ''; return; }

  const fmt = n => '$' + Math.round(n).toLocaleString();
  tbody.innerHTML = fy.brackets.map((b, i) => {
    const next = fy.brackets[i + 1];
    const maxIncome = next ? next.min : null;
    const taxInBracket = maxIncome
      ? fmt(b.base + (maxIncome - b.min) * b.rate - b.base)
      : '—';
    // tax in bracket = just the marginal portion
    const bracketTax = maxIncome
      ? fmt((maxIncome - b.min) * b.rate)
      : 'unlimited';
    return `<tr>
      <td>${b.label}</td>
      <td>${Math.round(b.rate * 100)}%</td>
      <td>${bracketTax}</td>
    </tr>`;
  }).join('');
}

function toggleTaxBrackets(){
  const body  = document.getElementById('tsBracketBody');
  const arrow = document.getElementById('tsBracketArrow');
  const toggle = document.getElementById('tsBracketToggle');
  body.classList.toggle('open');
  arrow.classList.toggle('open');
  toggle.classList.toggle('open');
}

/* ── Budget Categories page ── */

/** Build group → subcats map from BUDGET_CATS, preserving order */
function buildGroupMap(){
  const order = [], map = {};
  BUDGET_CATS.forEach(c => {
    if(!map[c.group]){ map[c.group] = []; order.push(c.group); }
    map[c.group].push(c);
  });
  return { order, map };
}

/** Re-render the category list */
function renderSettingsCats(){
  const container = document.getElementById('settingsCatList');
  if(!container) return;
  const { order, map } = buildGroupMap();

  container.innerHTML = '';
  order.forEach(group => {
    const subcats = map[group];
    const groupEnabled = subcats.some(c => c.enabled !== false);
    const gKey = CSS.escape(group);

    const div = document.createElement('div');
    div.className = 'scat-group';

    div.innerHTML = `
      <div class="scat-group-row${groupEnabled ? '' : ' disabled'}" onclick="scatToggleExpand(this)">
        <span class="scat-expand" id="scatArrow_${gKey}">&#9654;</span>
        <div class="scat-group-name" onclick="event.stopPropagation()">
          <input type="text" value="${escapeHtml(group)}" placeholder="Category name"
            onblur="scatRenameGroup('${escapeHtml(group)}', this.value)"
            onkeydown="if(event.key==='Enter') this.blur()">
        </div>
        <label class="tog" onclick="event.stopPropagation()" title="Enable / disable category">
          <input type="checkbox" ${groupEnabled ? 'checked' : ''}
            onchange="scatToggleGroup('${escapeHtml(group)}', this.checked)">
          <span class="tog-track"></span>
          <span class="tog-thumb"></span>
        </label>
        <button class="scat-del" title="Delete category"
          onclick="event.stopPropagation(); scatDeleteGroup('${escapeHtml(group)}')">&#10005;</button>
      </div>
      <div class="scat-subcats" id="scatSubs_${gKey}">
        ${subcats.map(c => `
          <div class="scat-sub-row${c.enabled === false ? ' disabled' : ''}" data-key="${escapeHtml(c.key)}">
            <div class="scat-sub-name">
              <input type="text" value="${escapeHtml(c.label)}" placeholder="Sub-category name"
                onblur="scatRenameSubcat('${escapeHtml(c.key)}', this.value)"
                onkeydown="if(event.key==='Enter') this.blur()">
            </div>
            <div class="scat-sub-actions">
              <label class="tog" title="Enable / disable">
                <input type="checkbox" ${c.enabled !== false ? 'checked' : ''}
                  onchange="scatToggleSubcat('${escapeHtml(c.key)}', this.checked)">
                <span class="tog-track"></span>
                <span class="tog-thumb"></span>
              </label>
              <button class="scat-del" onclick="scatDeleteSubcat('${escapeHtml(c.key)}')">&#10005;</button>
            </div>
          </div>`).join('')}
        <button class="scat-add-sub" onclick="scatAddSubcat('${escapeHtml(group)}')">+ Add sub-category</button>
      </div>`;
    container.appendChild(div);
  });
}

function scatToggleExpand(rowEl){
  const groupDiv = rowEl.closest('.scat-group');
  const subs  = groupDiv.querySelector('.scat-subcats');
  const arrow = groupDiv.querySelector('.scat-expand');
  subs.classList.toggle('open');
  arrow.classList.toggle('open');
}

function scatRenameGroup(oldName, newName){
  newName = newName.trim();
  if(!newName || newName === oldName) return;
  BUDGET_CATS.forEach(c => { if(c.group === oldName) c.group = newName; });
  saveBudgetCats(); renderSettingsCats(); refreshExpenseDropdowns();
}

function scatRenameSubcat(key, newLabel){
  newLabel = newLabel.trim();
  const entry = BUDGET_CATS.find(c => c.key === key);
  if(!entry || entry.label === newLabel) return;
  entry.label = newLabel;
  saveBudgetCats(); refreshExpenseDropdowns();
}

function scatToggleGroup(group, enabled){
  BUDGET_CATS.forEach(c => { if(c.group === group) c.enabled = enabled; });
  saveBudgetCats(); renderSettingsCats(); refreshExpenseDropdowns();
}

function scatToggleSubcat(key, enabled){
  const entry = BUDGET_CATS.find(c => c.key === key);
  if(entry){ entry.enabled = enabled; saveBudgetCats(); renderSettingsCats(); refreshExpenseDropdowns(); }
}

function scatDeleteGroup(group){
  if(!confirm(`Delete "${group}" and all its sub-categories?`)) return;
  BUDGET_CATS = BUDGET_CATS.filter(c => c.group !== group);
  saveBudgetCats(); renderSettingsCats(); refreshExpenseDropdowns();
}

function scatDeleteSubcat(key){
  BUDGET_CATS = BUDGET_CATS.filter(c => c.key !== key);
  saveBudgetCats(); renderSettingsCats(); refreshExpenseDropdowns();
}

function settingsAddGroup(){
  const name = 'New Category';
  BUDGET_CATS.push({ group: name, key: 'custom_' + Date.now(), label: 'New sub-category', enabled: true });
  saveBudgetCats(); renderSettingsCats(); refreshExpenseDropdowns();
  // Auto-expand the new group
  const last = document.querySelector('#settingsCatList .scat-group:last-child');
  if(last){
    last.querySelector('.scat-subcats').classList.add('open');
    last.querySelector('.scat-expand').classList.add('open');
  }
}

function scatAddSubcat(group){
  BUDGET_CATS.push({ group, key: 'custom_' + Date.now(), label: '', enabled: true });
  saveBudgetCats(); renderSettingsCats(); refreshExpenseDropdowns();
  // Re-expand and focus the new input
  const gKey = CSS.escape(group);
  const subs = document.getElementById('scatSubs_' + gKey);
  if(subs){
    subs.classList.add('open');
    document.getElementById('scatArrow_' + gKey)?.classList.add('open');
    // Focus last sub-category input
    const inputs = subs.querySelectorAll('.scat-sub-name input');
    if(inputs.length) inputs[inputs.length - 1].focus();
  }
}

/** Rebuild expense dropdowns (only enabled categories) */
function refreshExpenseDropdowns(){
  const activeGroups = [...new Set(
    BUDGET_CATS.filter(c => c.enabled !== false).map(c => c.group)
  )];
  const grpOpts = activeGroups.map(g => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join('');

  document.querySelectorAll('#expenseTableBody .expense-row').forEach(row => {
    const catSel = row.querySelector('.exp-cat');
    const subSel = row.querySelector('.exp-subcat');
    if(!catSel || !subSel) return;
    const curCat = catSel.value;
    const curSub = subSel.value;
    catSel.innerHTML = grpOpts;
    catSel.value = activeGroups.includes(curCat) ? curCat : (activeGroups[0] || '');
    subSel.innerHTML = getSubcatSelectOpts(catSel.value, curSub);
  });
  renderExpenseChart();
}
