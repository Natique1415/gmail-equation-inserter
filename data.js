/* modules/data.js — Static equation data (symbols, structures, examples) */
window.GEQ = window.GEQ || {};

GEQ.SYMBOL_GROUPS = [
    {
        id: 'greek', label: 'Greek', icon: 'αβ',
        symbols: [
            { d: 'α', l: '\\alpha' }, { d: 'β', l: '\\beta' }, { d: 'γ', l: '\\gamma' },
            { d: 'δ', l: '\\delta' }, { d: 'ε', l: '\\epsilon' }, { d: 'ζ', l: '\\zeta' },
            { d: 'η', l: '\\eta' }, { d: 'θ', l: '\\theta' }, { d: 'ι', l: '\\iota' },
            { d: 'κ', l: '\\kappa' }, { d: 'λ', l: '\\lambda' }, { d: 'μ', l: '\\mu' },
            { d: 'ν', l: '\\nu' }, { d: 'ξ', l: '\\xi' }, { d: 'π', l: '\\pi' },
            { d: 'ρ', l: '\\rho' }, { d: 'σ', l: '\\sigma' }, { d: 'τ', l: '\\tau' },
            { d: 'υ', l: '\\upsilon' }, { d: 'φ', l: '\\phi' }, { d: 'χ', l: '\\chi' },
            { d: 'ψ', l: '\\psi' }, { d: 'ω', l: '\\omega' },
            { d: 'Γ', l: '\\Gamma' }, { d: 'Δ', l: '\\Delta' }, { d: 'Θ', l: '\\Theta' },
            { d: 'Λ', l: '\\Lambda' }, { d: 'Ξ', l: '\\Xi' }, { d: 'Π', l: '\\Pi' },
            { d: 'Σ', l: '\\Sigma' }, { d: 'Φ', l: '\\Phi' }, { d: 'Ψ', l: '\\Psi' },
            { d: 'Ω', l: '\\Omega' },
        ],
    },
    {
        id: 'ops', label: 'Operations', icon: '×÷',
        symbols: [
            { d: '×', l: '\\times' }, { d: '÷', l: '\\div' }, { d: '±', l: '\\pm' },
            { d: '∓', l: '\\mp' }, { d: '·', l: '\\cdot' }, { d: '∘', l: '\\circ' },
            { d: '∗', l: '\\ast' }, { d: '⊕', l: '\\oplus' }, { d: '⊗', l: '\\otimes' },
            { d: '⊙', l: '\\odot' }, { d: '∧', l: '\\wedge' }, { d: '∨', l: '\\vee' },
            { d: '∩', l: '\\cap' }, { d: '∪', l: '\\cup' }, { d: '△', l: '\\triangle' },
        ],
    },
    {
        id: 'rel', label: 'Relations', icon: '≤≥',
        symbols: [
            { d: '=', l: '=' }, { d: '≠', l: '\\neq' }, { d: '≡', l: '\\equiv' },
            { d: '<', l: '<' }, { d: '>', l: '>' }, { d: '≤', l: '\\leq' },
            { d: '≥', l: '\\geq' }, { d: '≪', l: '\\ll' }, { d: '≫', l: '\\gg' },
            { d: '≈', l: '\\approx' }, { d: '∼', l: '\\sim' }, { d: '≅', l: '\\cong' },
            { d: '∝', l: '\\propto' }, { d: '⊂', l: '\\subset' }, { d: '⊃', l: '\\supset' },
            { d: '⊆', l: '\\subseteq' }, { d: '∈', l: '\\in' }, { d: '∉', l: '\\notin' },
            { d: '⊥', l: '\\perp' }, { d: '∥', l: '\\parallel' },
        ],
    },
    {
        id: 'arrows', label: 'Arrows', icon: '→⇒',
        symbols: [
            { d: '→', l: '\\to' }, { d: '←', l: '\\leftarrow' }, { d: '↔', l: '\\leftrightarrow' },
            { d: '↑', l: '\\uparrow' }, { d: '↓', l: '\\downarrow' }, { d: '⇒', l: '\\Rightarrow' },
            { d: '⇐', l: '\\Leftarrow' }, { d: '⇔', l: '\\Leftrightarrow' }, { d: '⇑', l: '\\Uparrow' },
            { d: '⇓', l: '\\Downarrow' }, { d: '↦', l: '\\mapsto' }, { d: '↪', l: '\\hookrightarrow' },
        ],
    },
    {
        id: 'misc', label: 'Misc', icon: '∞∂',
        symbols: [
            { d: '∞', l: '\\infty' }, { d: '∂', l: '\\partial' }, { d: '∇', l: '\\nabla' },
            { d: '∀', l: '\\forall' }, { d: '∃', l: '\\exists' }, { d: '∅', l: '\\emptyset' },
            { d: '…', l: '\\ldots' }, { d: '⋯', l: '\\cdots' }, { d: '⋮', l: '\\vdots' },
            { d: '⋱', l: '\\ddots' }, { d: '∴', l: '\\therefore' }, { d: '∵', l: '\\because' },
            { d: 'ℕ', l: '\\mathbb{N}' }, { d: 'ℤ', l: '\\mathbb{Z}' }, { d: 'ℝ', l: '\\mathbb{R}' },
            { d: 'ℂ', l: '\\mathbb{C}' }, { d: '!', l: '!' },
        ],
    },
];

GEQ.STRUCTURES = [
    {
        label: 'Fraction', latex: '\\frac{a}{b}',
        slots: [{ label: 'Numerator', placeholder: 'e.g. a+b' }, { label: 'Denominator', placeholder: 'e.g. 2c' }],
        build: (v) => `\\frac{${v[0] || 'a'}}{${v[1] || 'b'}}`,
    },
    {
        label: 'Square root', latex: '\\sqrt{x}',
        slots: [{ label: 'Expression', placeholder: 'e.g. x^2+1' }],
        build: (v) => `\\sqrt{${v[0] || 'x'}}`,
    },
    {
        label: 'nth root', latex: '\\sqrt[n]{x}',
        slots: [{ label: 'Index (n)', placeholder: 'e.g. 3' }, { label: 'Expression', placeholder: 'e.g. x' }],
        build: (v) => `\\sqrt[${v[0] || 'n'}]{${v[1] || 'x'}}`,
    },
    {
        label: 'Superscript', latex: 'x^{a}',
        slots: [{ label: 'Base', placeholder: 'e.g. x' }, { label: 'Exponent', placeholder: 'e.g. 2' }],
        build: (v) => `${v[0] || 'x'}^{${v[1] || 'a'}}`,
    },
    {
        label: 'Subscript', latex: 'x_{a}',
        slots: [{ label: 'Base', placeholder: 'e.g. x' }, { label: 'Index', placeholder: 'e.g. n' }],
        build: (v) => `${v[0] || 'x'}_{${v[1] || 'a'}}`,
    },
    {
        label: 'Sub + super', latex: 'x^{b}_{a}',
        slots: [{ label: 'Base', placeholder: 'e.g. x' }, { label: 'Subscript', placeholder: 'e.g. i' }, { label: 'Superscript', placeholder: 'e.g. 2' }],
        build: (v) => `${v[0] || 'x'}^{${v[2] || 'b'}}_{${v[1] || 'a'}}`,
    },
    {
        label: 'Sum', latex: '\\sum_{i=1}^{n}',
        slots: [{ label: 'Lower limit', placeholder: 'e.g. i=1' }, { label: 'Upper limit', placeholder: 'e.g. n' }, { label: 'Body', placeholder: 'e.g. x_i' }],
        build: (v) => `\\sum_{${v[0] || 'i=1'}}^{${v[1] || 'n'}} ${v[2] || ''}`,
    },
    {
        label: 'Product', latex: '\\prod_{i=1}^{n}',
        slots: [{ label: 'Lower limit', placeholder: 'e.g. i=1' }, { label: 'Upper limit', placeholder: 'e.g. n' }, { label: 'Body', placeholder: 'e.g. x_i' }],
        build: (v) => `\\prod_{${v[0] || 'i=1'}}^{${v[1] || 'n'}} ${v[2] || ''}`,
    },
    {
        label: 'Integral', latex: '\\int_{a}^{b}',
        slots: [{ label: 'Lower limit', placeholder: 'e.g. 0' }, { label: 'Upper limit', placeholder: 'e.g. \\infty' }, { label: 'Integrand', placeholder: 'e.g. f(x)\\,dx' }],
        build: (v) => `\\int_{${v[0] || 'a'}}^{${v[1] || 'b'}} ${v[2] || ''}`,
    },
    {
        label: 'Double int.', latex: '\\iint',
        slots: [{ label: 'Integrand', placeholder: 'e.g. f(x,y)\\,dx\\,dy' }],
        build: (v) => `\\iint ${v[0] || ''}`,
    },
    {
        label: 'Oint integral', latex: '\\oint',
        slots: [{ label: 'Integrand', placeholder: 'e.g. f(z)\\,dz' }],
        build: (v) => `\\oint ${v[0] || ''}`,
    },
    {
        label: 'Limit', latex: '\\lim_{x \\to 0}',
        slots: [{ label: 'Variable → value', placeholder: 'e.g. x \\to 0' }, { label: 'Expression', placeholder: 'e.g. f(x)' }],
        build: (v) => `\\lim_{${v[0] || 'x \\to 0'}} ${v[1] || ''}`,
    },
    {
        label: 'Matrix 2×2', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}',
        slots: [{ label: 'a (top-left)', placeholder: 'a' }, { label: 'b (top-right)', placeholder: 'b' }, { label: 'c (bottom-left)', placeholder: 'c' }, { label: 'd (bottom-right)', placeholder: 'd' }],
        build: (v) => `\\begin{pmatrix} ${v[0] || 'a'} & ${v[1] || 'b'} \\\\ ${v[2] || 'c'} & ${v[3] || 'd'} \\end{pmatrix}`,
    },
    {
        label: 'Abs value', latex: '\\left|x\\right|',
        slots: [{ label: 'Expression', placeholder: 'e.g. x-y' }],
        build: (v) => `\\left|${v[0] || 'x'}\\right|`,
    },
    {
        label: 'Overline', latex: '\\overline{x}',
        slots: [{ label: 'Expression', placeholder: 'e.g. AB' }],
        build: (v) => `\\overline{${v[0] || 'x'}}`,
    },
    {
        label: 'Hat', latex: '\\hat{x}',
        slots: [{ label: 'Expression', placeholder: 'e.g. x' }],
        build: (v) => `\\hat{${v[0] || 'x'}}`,
    },
    {
        label: 'Vector', latex: '\\vec{x}',
        slots: [{ label: 'Expression', placeholder: 'e.g. v' }],
        build: (v) => `\\vec{${v[0] || 'x'}}`,
    },
    {
        label: 'Cases', latex: 'f(x) = \\begin{cases} x & x \\ge 0 \\\\ -x & x < 0 \\end{cases}',
        slots: [
            { label: 'Function name', placeholder: 'f(x)' },
            { label: 'Case 1 value', placeholder: 'x' },
            { label: 'Case 1 cond.', placeholder: 'x \\ge 0' },
            { label: 'Case 2 value', placeholder: '-x' },
            { label: 'Case 2 cond.', placeholder: 'x < 0' },
        ],
        build: (v) => `${v[0] || 'f(x)'} = \\begin{cases} ${v[1] || 'x'} & ${v[2] || 'x \\ge 0'} \\\\ ${v[3] || '-x'} & ${v[4] || 'x < 0'} \\end{cases}`,
    },
];