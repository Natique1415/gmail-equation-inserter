/* modules/validator.js — Client-side LaTeX validation
 *
 * Returns: { valid: boolean, error: string|null, warnings: string[] }
 * Runs synchronously — no API calls. Catches the most common mistakes
 * before we ever hit CodeCogs, saving round-trips and giving instant feedback.
 */
window.GEQ = window.GEQ || {};

GEQ.validate = function validateLatex(latex) {
    const warnings = [];

    // ── 1. Empty ───────────────────────────────────────────────
    if (!latex || !latex.trim()) {
        return { valid: false, error: 'Empty expression.', warnings };
    }

    const s = latex.trim();

    // ── 2. Unbalanced curly braces {} ─────────────────────────
    let depth = 0;
    for (let i = 0; i < s.length; i++) {
        if (s[i] === '{' && (i === 0 || s[i - 1] !== '\\')) depth++;
        if (s[i] === '}' && (i === 0 || s[i - 1] !== '\\')) depth--;
        if (depth < 0) {
            return { valid: false, error: 'Unmatched closing brace } — check your braces.', warnings };
        }
    }
    if (depth !== 0) {
        return { valid: false, error: `Unmatched opening brace { — ${depth} brace(s) never closed.`, warnings };
    }

    // ── 3. Unbalanced square brackets [] ──────────────────────
    let sqDepth = 0;
    for (let i = 0; i < s.length; i++) {
        if (s[i] === '[' && (i === 0 || s[i - 1] !== '\\')) sqDepth++;
        if (s[i] === ']' && (i === 0 || s[i - 1] !== '\\')) sqDepth--;
        if (sqDepth < 0) {
            return { valid: false, error: 'Unmatched closing bracket ] — check your brackets.', warnings };
        }
    }
    if (sqDepth !== 0) {
        return { valid: false, error: `Unmatched opening bracket [ — never closed.`, warnings };
    }

    // ── 4. \begin / \end environment matching ─────────────────
    const beginRe = /\\begin\{([^}]+)\}/g;
    const endRe = /\\end\{([^}]+)\}/g;
    const begins = [];
    const ends = [];
    let m;
    while ((m = beginRe.exec(s)) !== null) begins.push(m[1]);
    while ((m = endRe.exec(s)) !== null) ends.push(m[1]);

    if (begins.length !== ends.length) {
        return {
            valid: false,
            error: `Mismatched \\begin/\\end — found ${begins.length} \\begin but ${ends.length} \\end.`,
            warnings,
        };
    }
    for (let i = 0; i < begins.length; i++) {
        if (begins[i] !== ends[i]) {
            return {
                valid: false,
                error: `Environment mismatch: \\begin{${begins[i]}} closed by \\end{${ends[i]}}.`,
                warnings,
            };
        }
    }

    // ── 5. Trailing backslash (incomplete command) ─────────────
    if (/\\$/.test(s)) {
        return { valid: false, error: 'Expression ends with a lone \\ — incomplete command.', warnings };
    }

    // ── 6. Double superscript / subscript without grouping ────
    if (/\^\^/.test(s)) warnings.push('Double ^^ detected — did you mean ^{...}?');
    if (/\_\_/.test(s)) warnings.push('Double __ detected — did you mean _{...}?');

    // ── 7. \frac requires two arguments ───────────────────────
    const fracRe = /\\frac(?!\{[^}]*\}\{[^}]*\})/g;
    if (fracRe.test(s)) {
        // A crude check — warn if \frac isn't immediately followed by {}{} pattern
        const fracSimple = /\\frac[^{]/.test(s) || /\\frac$/.test(s);
        if (fracSimple) warnings.push('\\frac needs two arguments: \\frac{numerator}{denominator}');
    }

    // ── 8. Common typos ────────────────────────────────────────
    if (/\\[a-zA-Z]+\s+\{/.test(s)) {
        warnings.push('Space between command and { — this might cause issues (e.g. \\frac {a} should be \\frac{a}).');
    }

    return { valid: true, error: null, warnings };
};