/* content.js — Entry point: observes Gmail for compose windows, injects toolbar button.
 * All heavy logic lives in modules/ loaded before this file.
 *
 * RESILIENCE STRATEGY
 * Gmail minifies and rotates its internal CSS class names (e.g. .aDh) on every
 * deploy.  Rather than betting everything on one class, we try three layers:
 *   1. Known class selectors (updated as Gmail changes)
 *   2. Stable attribute / ARIA selectors that Gmail has kept consistent longer
 *   3. Structural proximity: walk up from any [contenteditable] compose body
 *      and find the nearest sibling toolbar-like container
 */
(function () {
  'use strict';

  window.GEQ = window.GEQ || {};

  // ── Shared string utilities (used by modal.js) ───────────
  GEQ.escapeAttr = (s) => s.replace(/"/g, '&quot;');
  GEQ.escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // ── Toolbar detection ─────────────────────────────────────
  // Layer 1: Known Gmail class names, in priority order.
  // Add new ones here whenever Gmail rotates them — old ones
  // harmlessly return 0 results and the next selector is tried.
  const CLASS_SELECTORS = ['.aDh', '.btC', '.aX2', '.gU.Up'];

  // Layer 2: Stable attribute selectors Gmail has kept for years.
  const ATTR_SELECTORS = [
    '[data-tooltip="Formatting options"]',
    '[aria-label="Formatting options"]',
    '[role="toolbar"]',
  ];

  function findComposeToolbars() {
    // Try class names first (fastest)
    for (const sel of CLASS_SELECTORS) {
      const matches = filterToComposeContext(document.querySelectorAll(sel));
      if (matches.length) return matches;
    }

    // Try attribute selectors
    for (const sel of ATTR_SELECTORS) {
      const matches = filterToComposeContext(document.querySelectorAll(sel));
      if (matches.length) return matches;
    }

    // Layer 3: Structural proximity fallback.
    // Every Gmail compose editor is a [contenteditable="true"] div.
    // The formatting toolbar is always a sibling or nearby cousin in the
    // same compose container.  We look for the nearest element that:
    //   * contains at least 3 direct button/div[role=button] children
    //     (that's what a toolbar looks like structurally)
    //   * sits inside the same compose dialog as the editor
    return findByProximity();
  }

  // Keep only elements that live inside a genuine compose window.
  // .nH is Gmail's full-page shell — too broad, causes button to appear
  // in the inbox toolbar and email hover actions. Only use compose-specific
  // containers: [role="dialog"] (popup compose), .T-I-KE, .AD (full-screen).
  function filterToComposeContext(nodeList) {
    return Array.from(nodeList).filter(
      (el) => !!el.closest('[role="dialog"], .T-I-KE, .AD')
    );
  }

  function findByProximity() {
    const results = [];
    document.querySelectorAll('[contenteditable="true"]').forEach((editor) => {
      // Walk up to the closest compose wrapper
      const wrapper = editor.closest('[role="dialog"], .T-I-KE, .AD');
      if (!wrapper) return;

      // A toolbar has several direct actionable children
      wrapper.querySelectorAll('div, span').forEach((candidate) => {
        if (results.includes(candidate)) return;
        const actionable = candidate.querySelectorAll(
          ':scope > [role="button"], :scope > button'
        );
        if (actionable.length >= 3 && candidate !== wrapper) {
          results.push(candidate);
        }
      });
    });
    return results;
  }

  // ── Toolbar injection ─────────────────────────────────────
  const injected = new WeakSet();

  function injectButtons() {
    findComposeToolbars().forEach((toolbar) => {
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

  // ── Debounced MutationObserver ────────────────────────────
  // Gmail's DOM is extremely busy. Without debouncing, injectButtons
  // (which does a querySelectorAll scan) runs hundreds of times/second.
  let debounceTimer = null;
  const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(injectButtons, 250);
  });

  observer.observe(document.body, { childList: true, subtree: true });
  injectButtons(); // run once immediately on load

})();