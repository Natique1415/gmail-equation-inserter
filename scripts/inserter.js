/* ============================================================
   Gmail Equation Inserter — inserter.js
   Handles equation rendering + Gmail insertion
   ============================================================ */

(function () {
    "use strict";

    window.GEQ = window.GEQ || {};

    const CODECOGS_SVG = "https://latex.codecogs.com/svg.image?";
    const CODECOGS_PNG = "https://latex.codecogs.com/png.image?";

    // In-memory blob cache so the same equation is never fetched twice.
    // Cleared when the page unloads (extension's normal lifecycle).
    const blobCache = new Map();

    /* ------------------------------------------------------------
       SVG URL (used for previews in modal)
       ------------------------------------------------------------ */
    GEQ.buildSvgUrl = function (latex) {
        return (
            CODECOGS_SVG +
            encodeURIComponent("\\bg{white}\\color{black}" + latex)
        );
    };

    /* ------------------------------------------------------------
       PNG URL (used for insertion)
       ------------------------------------------------------------ */
    function buildPngUrl(latex) {
        return (
            CODECOGS_PNG +
            encodeURIComponent("\\dpi{150}\\bg{white}\\color{black}" + latex)
        );
    }

    /* ------------------------------------------------------------
       Render LaTeX → Blob  (cached + timeout)
       ------------------------------------------------------------ */
    async function latexToBlob(latex) {
        if (blobCache.has(latex)) return blobCache.get(latex);

        const url = buildPngUrl(latex);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10_000);

        let resp;
        try {
            resp = await fetch(url, { signal: controller.signal });
        } catch (err) {
            clearTimeout(timeoutId);
            if (err.name === "AbortError") {
                throw new Error("Render timed out — CodeCogs is slow. Try again in a moment.");
            }
            throw new Error("Network error — check your connection and try again.");
        }
        clearTimeout(timeoutId);

        if (!resp.ok) {
            throw new Error(`CodeCogs returned ${resp.status}. Check your LaTeX syntax.`);
        }

        const blob = await resp.blob();
        blobCache.set(latex, blob);
        return blob;
    }

    /* ------------------------------------------------------------
       Equation history  (persisted via chrome.storage.local)
       Requires  "storage"  permission in manifest.json.
       ------------------------------------------------------------ */
    const HISTORY_KEY = "geq_history";
    const HISTORY_MAX = 10;

    GEQ.saveToHistory = function (latex) {
        if (!latex || !latex.trim()) return;
        if (typeof chrome === "undefined" || !chrome.storage) {
            console.warn("[GEQ] chrome.storage unavailable — add \"storage\" permission to manifest.json");
            return;
        }
        chrome.storage.local.get({ [HISTORY_KEY]: [] }, (data) => {
            if (chrome.runtime.lastError) {
                console.warn("[GEQ] saveToHistory error:", chrome.runtime.lastError.message);
                return;
            }
            const history = data[HISTORY_KEY].filter((item) => item !== latex);
            history.unshift(latex);
            chrome.storage.local.set({ [HISTORY_KEY]: history.slice(0, HISTORY_MAX) });
        });
    };

    // callback receives ({ ok: bool, history: string[] })
    // ok=false means chrome.storage is unavailable (missing permission)
    GEQ.loadHistory = function (callback) {
        if (typeof chrome === "undefined" || !chrome.storage) {
            console.warn("[GEQ] chrome.storage unavailable — add \"storage\" permission to manifest.json");
            callback({ ok: false, history: [] });
            return;
        }
        chrome.storage.local.get({ [HISTORY_KEY]: [] }, (data) => {
            if (chrome.runtime.lastError) {
                console.warn("[GEQ] loadHistory error:", chrome.runtime.lastError.message);
                callback({ ok: false, history: [] });
                return;
            }
            callback({ ok: true, history: data[HISTORY_KEY] || [] });
        });
    };

    /* ------------------------------------------------------------
       Restore cursor position
       ------------------------------------------------------------ */
    function restoreCursor(composeBody, savedRange) {
        composeBody.focus();

        const sel = window.getSelection();
        sel.removeAllRanges();

        if (
            savedRange &&
            composeBody.contains(savedRange.commonAncestorContainer)
        ) {
            sel.addRange(savedRange);
        } else {
            const r = document.createRange();
            r.selectNodeContents(composeBody);
            r.collapse(false);
            sel.addRange(r);
        }
    }

    /* ------------------------------------------------------------
       Simulate paste event (mimics real Ctrl+V)
       Gmail will upload the image internally
       ------------------------------------------------------------ */
    function simulatePasteImage(composeBody, blob, size) {
        const file = new File([blob], "equation.png", { type: "image/png" });
        const dt = new DataTransfer();
        dt.items.add(file);

        const pasteEvent = new ClipboardEvent("paste", {
            clipboardData: dt,
            bubbles: true,
            cancelable: true,
        });

        composeBody.focus();
        composeBody.dispatchEvent(pasteEvent);

        // Use a MutationObserver to resize the image as soon as Gmail inserts it,
        // rather than guessing with a fixed setTimeout.
        const mo = new MutationObserver(() => {
            const imgs = composeBody.querySelectorAll("img");
            if (!imgs.length) return;
            const last = imgs[imgs.length - 1];
            last.style.height = size + "px";
            last.style.width = "auto";
            last.style.verticalAlign = "middle";
            mo.disconnect();
        });
        mo.observe(composeBody, { childList: true, subtree: true });

        // Safety net: disconnect observer after 3 s regardless
        setTimeout(() => mo.disconnect(), 3000);
    }

    /* ------------------------------------------------------------
       Fallback insertion (rarely needed)
       ------------------------------------------------------------ */
    function fallbackInsert(composeBody, blob, size) {
        const reader = new FileReader();

        reader.onload = () => {
            const img = document.createElement("img");
            img.src = reader.result;
            img.style.cssText =
                `height:${size}px;width:auto;vertical-align:middle;border:none;margin:0 2px;`;

            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) {
                // No selection at all — append to end of compose body
                composeBody.appendChild(img);
                return;
            }

            const range = sel.getRangeAt(0);
            range.deleteContents();
            range.insertNode(img);
            range.setStartAfter(img);
            range.setEndAfter(img);
            sel.removeAllRanges();
            sel.addRange(range);
        };

        reader.readAsDataURL(blob);
    }

    /* ------------------------------------------------------------
       Main function used by modal.js
       Throws on failure so the modal can display errors inline
       (no alert() calls here).
       ------------------------------------------------------------ */
    GEQ.doInsert = async function (latex, composeBody, savedRange, size) {
        if (!composeBody) {
            throw new Error("Compose body not found — click inside your email first.");
        }

        // latexToBlob throws descriptive errors on failure
        const blob = await latexToBlob(latex);

        restoreCursor(composeBody, savedRange);

        try {
            simulatePasteImage(composeBody, blob, size);
        } catch (err) {
            console.warn("[GEQ] Paste simulation failed, using fallback", err);
            fallbackInsert(composeBody, blob, size);
        }

        composeBody.dispatchEvent(new Event("input", { bubbles: true }));

        // Persist to history after a confirmed successful insert
        GEQ.saveToHistory(latex);
    };
})();