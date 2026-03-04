/* ============================================================
   Gmail Equation Inserter — inserter.js
   Handles equation rendering + Gmail insertion
   ============================================================ */

(function () {
    "use strict";

    window.GEQ = window.GEQ || {};

    const CODECOGS_SVG = "https://latex.codecogs.com/svg.image?";
    const CODECOGS_PNG = "https://latex.codecogs.com/png.image?";

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
       Render LaTeX → Blob
       ------------------------------------------------------------ */
    async function latexToBlob(latex) {
        const url = buildPngUrl(latex);

        const resp = await fetch(url);
        if (!resp.ok) {
            throw new Error("CodeCogs render failed: " + resp.status);
        }

        return await resp.blob();
    }

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
        const file = new File([blob], "equation.png", {
            type: "image/png",
        });

        const dt = new DataTransfer();
        dt.items.add(file);

        const pasteEvent = new ClipboardEvent("paste", {
            clipboardData: dt,
            bubbles: true,
            cancelable: true,
        });

        composeBody.focus();
        composeBody.dispatchEvent(pasteEvent);

        // resize after Gmail inserts image
        setTimeout(() => {
            const imgs = composeBody.querySelectorAll("img");
            if (imgs.length > 0) {
                const last = imgs[imgs.length - 1];

                last.style.height = size + "px";
                last.style.width = "auto";
                last.style.verticalAlign = "middle";
            }
        }, 250);
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
                "height:" +
                size +
                "px;width:auto;vertical-align:middle;border:none;margin:0 2px;";

            const sel = window.getSelection();
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
       ------------------------------------------------------------ */
    GEQ.doInsert = async function (
        latex,
        composeBody,
        savedRange,
        size
    ) {
        if (!composeBody) {
            console.warn("[GEQ] Compose body not found");
            return;
        }

        let blob;

        try {
            blob = await latexToBlob(latex);
        } catch (err) {
            console.error("[GEQ] Equation render failed", err);
            alert("Failed to render equation.");
            return;
        }

        restoreCursor(composeBody, savedRange);

        try {
            simulatePasteImage(composeBody, blob, size);
        } catch (err) {
            console.warn(
                "[GEQ] Paste simulation failed, using fallback",
                err
            );
            fallbackInsert(composeBody, blob, size);
        }

        composeBody.dispatchEvent(new Event("input", { bubbles: true }));
    };
})();