/* modules/inserter.js — Fetch PNG from CodeCogs and insert into Gmail compose */
window.GEQ = window.GEQ || {};

GEQ.CODECOGS_SVG = 'https://latex.codecogs.com/svg.image?';
GEQ.CODECOGS_PNG = 'https://latex.codecogs.com/png.image?';

GEQ.buildSvgUrl = function (latex) {
    return GEQ.CODECOGS_SVG + encodeURIComponent('\\bg{white}\\color{black}' + latex);
};

GEQ.buildPngUrl = function (latex) {
    return GEQ.CODECOGS_PNG + encodeURIComponent('\\dpi{150}\\bg{white}' + latex);
};

/* Fetch the equation as a PNG data URL.
 * Content-script fetch bypasses CORS for domains in host_permissions. */
GEQ.latexToPng = async function (latex) {
    const url = GEQ.buildPngUrl(latex);
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`CodeCogs returned HTTP ${resp.status}`);
    const blob = await resp.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Blob → dataURL conversion failed'));
        reader.readAsDataURL(blob);
    });
};

/* Insert equation image into Gmail compose body.
 * savedRange must be captured before the modal opens (before focus is stolen). */
GEQ.doInsert = async function (latex, composeBody, savedRange, size) {
    if (!composeBody) {
        console.warn('[GEQ] No compose body found.');
        return;
    }

    let pngDataUrl;
    try {
        pngDataUrl = await GEQ.latexToPng(latex);
    } catch (err) {
        console.error('[GEQ] Render failed:', err);
        return;
    }

    // Focus the compose area
    composeBody.focus();

    // Restore the cursor saved before the modal opened
    const sel = window.getSelection();
    sel.removeAllRanges();

    if (savedRange && composeBody.contains(savedRange.commonAncestorContainer)) {
        sel.addRange(savedRange);
    } else {
        // Fallback: end of compose body
        const r = document.createRange();
        r.selectNodeContents(composeBody);
        r.collapse(false);
        sel.addRange(r);
    }

    // execCommand('insertImage') is required for Gmail to promote a data: URL
    // into a proper inline CID MIME attachment on send.
    // It works here because: modal is gone, compose is focused, selection is live.
    const ok = document.execCommand('insertImage', false, pngDataUrl); // eslint-disable-line

    if (!ok) {
        // Fallback to direct DOM insert — will show in compose but may be stripped on send
        console.warn('[GEQ] execCommand returned false — using DOM fallback');
        const range = sel.rangeCount > 0 ? sel.getRangeAt(0) : (() => {
            const r = document.createRange();
            r.selectNodeContents(composeBody);
            r.collapse(false);
            return r;
        })();
        const img = document.createElement('img');
        img.src = pngDataUrl;
        img.style.cssText = `height:${size}px;width:auto;vertical-align:middle;display:inline-block;border:none;margin:0 2px;`;
        range.deleteContents();
        range.insertNode(img);
        range.setStartAfter(img);
        range.setEndAfter(img);
        sel.removeAllRanges();
        sel.addRange(range);
    } else {
        // Resize the image Gmail just wrapped in its own markup
        setTimeout(() => {
            const imgs = composeBody.querySelectorAll('img');
            if (imgs.length > 0) {
                const last = imgs[imgs.length - 1];
                last.style.height = size + 'px';
                last.style.width = 'auto';
                last.style.verticalAlign = 'middle';
            }
        }, 50);
    }

    // Notify Gmail so autosave + character-count update
    composeBody.dispatchEvent(new Event('input', { bubbles: true }));
};