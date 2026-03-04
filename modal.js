/* modules/modal.js — Equation editor modal UI
 * Depends on: data.js, validator.js, inserter.js (loaded before this) */
window.GEQ = window.GEQ || {};

GEQ.openModal = function (composeBody, savedRange) {
  document.getElementById('geq-overlay')?.remove();

  const { SYMBOL_GROUPS, STRUCTURES } = GEQ;
  const { escapeAttr, escapeHtml } = GEQ;

  // ── Build HTML ───────────────────────────────────────────
  const overlay = document.createElement('div');
  overlay.id = 'geq-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  overlay.innerHTML = `
    <div id="geq-modal">
      <div id="geq-header">
        <div id="geq-title"><span id="geq-title-icon">∑</span> Equation Editor</div>
        <button id="geq-close" aria-label="Close">&times;</button>
      </div>

      <div id="geq-tabs">
        <button class="geq-tab geq-tab-active" data-tab="visual">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
          Visual
        </button>
        <button class="geq-tab" data-tab="latex">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
          </svg>
          LaTeX
        </button>
      </div>

      <!-- VISUAL PANEL -->
      <div id="geq-panel-visual" class="geq-panel">
        <div class="geq-section-label">Structures</div>
        <div id="geq-structures">
          ${STRUCTURES.map((s, i) => `
            <button class="geq-struct-btn" data-idx="${i}" title="${escapeAttr(s.label)}">
              <img class="geq-struct-img" src="${GEQ.buildSvgUrl(s.latex)}" alt="${escapeAttr(s.label)}" loading="lazy" />
              <span class="geq-struct-label">${s.label}</span>
            </button>`).join('')}
        </div>

        <div id="geq-slot-editor" style="display:none">
          <div id="geq-slot-header">
            <span id="geq-slot-title"></span>
            <button id="geq-slot-close" title="Cancel">×</button>
          </div>
          <div id="geq-slot-fields"></div>
          <div id="geq-slot-preview-wrap">
            <img id="geq-slot-preview-img" alt="preview" />
          </div>
          <button id="geq-slot-insert" class="geq-btn-secondary">Add to equation</button>
        </div>

        <div class="geq-section-label" style="margin-top:14px">Symbols</div>
        <div id="geq-sym-tabs">
          ${SYMBOL_GROUPS.map((g, i) => `
            <button class="geq-sym-tab ${i === 0 ? 'geq-sym-tab-active' : ''}" data-group="${g.id}">
              <span class="geq-sym-tab-icon">${g.icon}</span>${g.label}
            </button>`).join('')}
        </div>
        <div id="geq-sym-grid">
          ${SYMBOL_GROUPS.map((g, i) => `
            <div class="geq-sym-panel ${i === 0 ? 'geq-sym-panel-active' : ''}" data-group="${g.id}">
              ${g.symbols.map(s => `
                <button class="geq-sym" data-latex="${escapeAttr(s.l)}" title="${escapeAttr(s.l)}">${s.d}</button>`
  ).join('')}
            </div>`).join('')}
        </div>

        <div class="geq-section-label" style="margin-top:14px">Equation so far</div>
        <div id="geq-visual-eq-wrap">
          <div id="geq-visual-eq-display">
            <span class="geq-eq-placeholder">Click symbols &amp; structures above…</span>
          </div>
          <button id="geq-visual-clear" title="Clear">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- LATEX PANEL -->
      <div id="geq-panel-latex" class="geq-panel" style="display:none">
        <label class="geq-section-label" for="geq-latex-input">LaTeX source</label>
        <div id="geq-input-wrap">
          <textarea id="geq-latex-input" spellcheck="false" autocorrect="off" autocapitalize="off"
            placeholder="e.g. \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}"></textarea>
        </div>
        <div id="geq-validation-msg" style="display:none"></div>
      </div>

      <!-- PREVIEW -->
      <div id="geq-preview-section">
        <div class="geq-section-label">Preview</div>
        <div id="geq-preview">
          <div id="geq-preview-inner">
            <span id="geq-preview-hint">Build or type an equation above…</span>
            <img id="geq-preview-img" alt="equation preview" style="display:none" />
            <div id="geq-preview-error" style="display:none"></div>
          </div>
        </div>
      </div>

      <div id="geq-bottom-row">
        <div id="geq-size-row">
          <label for="geq-size">Size</label>
          <input type="range" id="geq-size" min="14" max="40" value="22" step="1" />
          <span id="geq-size-val">22px</span>
        </div>
        <div id="geq-actions">
          <button id="geq-insert" class="geq-btn-primary" disabled>Insert Equation</button>
          <button id="geq-cancel" class="geq-btn-ghost">Cancel</button>
        </div>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  // ── State ────────────────────────────────────────────────
  let activeTab = 'visual';
  let visualLatex = '';
  let currentSize = 22;
  let previewTimer = null;
  let slotDebounce = null;

  const $ = (sel) => overlay.querySelector(sel);
  const $$ = (sel) => overlay.querySelectorAll(sel);

  const previewImg = $('#geq-preview-img');
  const previewErr = $('#geq-preview-error');
  const hint = $('#geq-preview-hint');
  const insertBtn = $('#geq-insert');
  const latexInput = $('#geq-latex-input');
  const eqDisplay = $('#geq-visual-eq-display');
  const slotEditor = $('#geq-slot-editor');
  const validationEl = $('#geq-validation-msg');

  // ── Close ────────────────────────────────────────────────
  function closeModal() {
    document.removeEventListener('keydown', escHandler);
    overlay.remove();
  }
  const escHandler = (e) => { if (e.key === 'Escape') closeModal(); };
  document.addEventListener('keydown', escHandler);
  $('#geq-close').onclick = closeModal;
  $('#geq-cancel').onclick = closeModal;
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

  // ── Mode tabs ────────────────────────────────────────────
  $$('.geq-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const name = tab.dataset.tab;
      if (name === activeTab) return;
      activeTab = name;
      $$('.geq-tab').forEach(t => t.classList.toggle('geq-tab-active', t.dataset.tab === name));
      $('#geq-panel-visual').style.display = name === 'visual' ? '' : 'none';
      $('#geq-panel-latex').style.display = name === 'latex' ? '' : 'none';
      if (name === 'latex' && visualLatex) latexInput.value = visualLatex;
      if (name === 'visual' && latexInput.value.trim()) {
        visualLatex = latexInput.value.trim();
        renderEqDisplay();
      }
      schedulePreview();
      if (name === 'latex') latexInput.focus();
    });
  });

  // ── Structure clicks → slot editor ──────────────────────
  $$('.geq-struct-btn').forEach(btn => {
    btn.addEventListener('click', () => openSlotEditor(STRUCTURES[parseInt(btn.dataset.idx, 10)]));
  });

  function openSlotEditor(struct) {
    slotEditor.style.display = 'block';
    $('#geq-slot-title').textContent = struct.label;

    const fields = $('#geq-slot-fields');
    fields.innerHTML = struct.slots.map((slot, i) => `
      <div class="geq-slot-field">
        <label class="geq-slot-label" for="geq-slot-${i}">${slot.label}</label>
        <input class="geq-slot-input" id="geq-slot-${i}" type="text"
          placeholder="${escapeAttr(slot.placeholder)}" autocomplete="off" spellcheck="false" />
      </div>`).join('');

    const slotPreviewImg = $('#geq-slot-preview-img');
    const getValues = () => struct.slots.map((_, i) => ($(`#geq-slot-${i}`)?.value.trim() || ''));

    function updateSlotPreview() {
      slotPreviewImg.src = GEQ.buildSvgUrl(struct.build(getValues()));
    }

    fields.querySelectorAll('.geq-slot-input').forEach(inp => {
      inp.addEventListener('input', () => {
        clearTimeout(slotDebounce);
        slotDebounce = setTimeout(updateSlotPreview, 300);
      });
    });

    updateSlotPreview();
    setTimeout(() => $(`#geq-slot-0`)?.focus(), 50);

    $('#geq-slot-insert').onclick = () => {
      const latex = struct.build(getValues());
      visualLatex += (visualLatex ? ' ' : '') + latex;
      renderEqDisplay();
      schedulePreview();
      closeSlotEditor();
    };
  }

  function closeSlotEditor() {
    slotEditor.style.display = 'none';
    $('#geq-slot-fields').innerHTML = '';
  }
  $('#geq-slot-close').addEventListener('click', closeSlotEditor);

  // ── Symbol group tabs ────────────────────────────────────
  $$('.geq-sym-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const gid = tab.dataset.group;
      $$('.geq-sym-tab').forEach(t => t.classList.toggle('geq-sym-tab-active', t.dataset.group === gid));
      $$('.geq-sym-panel').forEach(p => p.classList.toggle('geq-sym-panel-active', p.dataset.group === gid));
    });
  });

  // ── Symbol clicks ────────────────────────────────────────
  $$('.geq-sym').forEach(btn => {
    btn.addEventListener('click', () => {
      visualLatex += (visualLatex ? ' ' : '') + btn.dataset.latex;
      renderEqDisplay();
      schedulePreview();
    });
  });

  // ── Clear ────────────────────────────────────────────────
  $('#geq-visual-clear').addEventListener('click', () => {
    visualLatex = '';
    renderEqDisplay();
    schedulePreview();
  });

  // ── LaTeX input — validate immediately, debounce preview ─
  latexInput.addEventListener('input', () => {
    showValidation(latexInput.value.trim());
    schedulePreview();
  });

  // ── Size slider ──────────────────────────────────────────
  $('#geq-size').addEventListener('input', (e) => {
    currentSize = parseInt(e.target.value, 10);
    $('#geq-size-val').textContent = currentSize + 'px';
    if (previewImg.style.display !== 'none') previewImg.style.height = currentSize + 'px';
  });

  // ── Insert ───────────────────────────────────────────────
  insertBtn.addEventListener('click', async () => {
    const latex = getLatex();
    if (!latex) return;

    // Prevent any double-click
    insertBtn.disabled = true;
    insertBtn.innerHTML = `
            <svg style="animation:geq-spin 0.7s linear infinite;vertical-align:middle;margin-right:5px"
                 width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>Inserting…`;

    document.removeEventListener('keydown', escHandler);

    try {
      await GEQ.doInsert(latex, composeBody, savedRange, currentSize);
      overlay.remove(); // only close on success
    } catch (err) {
      // Show error inline instead of silently failing
      insertBtn.disabled = false;
      insertBtn.textContent = 'Insert Equation';
      previewErr.style.display = 'block';
      previewErr.textContent = '⚠ Insert failed — check your connection and try again.';
      previewImg.style.display = 'none';
      // Re-attach esc handler since modal is still open
      document.addEventListener('keydown', escHandler);
    }
  });

  // ── Core helpers ─────────────────────────────────────────
  function getLatex() {
    return activeTab === 'latex' ? latexInput.value.trim() : visualLatex.trim();
  }

  function renderEqDisplay() {
    eqDisplay.innerHTML = visualLatex.trim()
      ? `<code class="geq-eq-code">${escapeHtml(visualLatex)}</code>`
      : `<span class="geq-eq-placeholder">Click symbols &amp; structures above…</span>`;
  }

  // Validate and show inline message — runs on every keystroke (cheap)
  function showValidation(latex) {
    if (!latex) { validationEl.style.display = 'none'; return; }
    const result = GEQ.validate(latex);
    if (!result.valid) {
      validationEl.className = 'geq-validation-error';
      validationEl.textContent = '⚠ ' + result.error;
      validationEl.style.display = 'block';
    } else if (result.warnings.length > 0) {
      validationEl.className = 'geq-validation-warning';
      validationEl.textContent = '⚡ ' + result.warnings[0];
      validationEl.style.display = 'block';
    } else {
      validationEl.style.display = 'none';
    }
  }

  // Debounced preview — only fires after user stops typing for 600ms
  function schedulePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(updatePreview, 600);
  }

  function updatePreview() {
    const latex = getLatex();
    hint.style.display = 'none';
    previewErr.style.display = 'none';

    if (!latex) {
      previewImg.style.display = 'none';
      hint.style.display = 'block';
      insertBtn.disabled = true;
      return;
    }

    // Run validation before hitting the API
    if (activeTab === 'latex') {
      const result = GEQ.validate(latex);
      if (!result.valid) {
        previewImg.style.display = 'none';
        previewErr.style.display = 'block';
        previewErr.textContent = '⚠ ' + result.error;
        insertBtn.disabled = true;
        return;
      }
    }

    const url = GEQ.buildSvgUrl(latex);
    previewImg.onload = () => {
      previewImg.style.height = currentSize + 'px';
      previewImg.style.display = 'block';
      previewErr.style.display = 'none';
      insertBtn.disabled = false;
    };
    previewImg.onerror = () => {
      previewImg.style.display = 'none';
      previewErr.style.display = 'block';
      previewErr.textContent = '⚠ Could not render — check your LaTeX syntax.';
      insertBtn.disabled = true;
    };
    previewImg.src = url;
  }
};