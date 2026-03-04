/* content.js — Entry point: observes Gmail for compose windows, injects toolbar button.
 * All heavy logic lives in modules/ loaded before this file. */
(function () {
  'use strict';

  window.GEQ = window.GEQ || {};

  // ── Shared string utilities (used by modal.js) ───────────
  GEQ.escapeAttr = (s) => s.replace(/"/g, '&quot;');
  GEQ.escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // ── Toolbar injection ─────────────────────────────────────
  const injected = new WeakSet();

  function injectButtons() {
    document.querySelectorAll('.aDh').forEach((toolbar) => {
      if (injected.has(toolbar)) return;
      injected.add(toolbar);
      addEquationButton(toolbar);
    });
  }

  function addEquationButton(toolbar) {
    const btn = document.createElement('div');
    btn.className = 'geq-toolbar-btn';
    btn.setAttribute('role', 'button');
    btn.setAttribute('tabindex', '0');
    btn.setAttribute('aria-label', 'Insert equation');
    btn.innerHTML = `
      <span class="geq-btn-sigma">∑</span>
      <span class="geq-btn-label">Insert Equation</span>`;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();

      const composeRoot = toolbar.closest('.T-I-KE, .AD, [role="dialog"]');
      const composeBody =
        (composeRoot && composeRoot.querySelector('[contenteditable="true"]')) ||
        document.querySelector('.Am.Al.editable[contenteditable="true"]');

      // Capture cursor position NOW — before the modal steals focus
      let savedRange = null;
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        savedRange = sel.getRangeAt(0).cloneRange();
      }

      GEQ.openModal(composeBody, savedRange);
    });

    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') btn.click();
    });

    toolbar.appendChild(btn);
  }

  const observer = new MutationObserver(injectButtons);
  observer.observe(document.body, { childList: true, subtree: true });
  injectButtons();

})();