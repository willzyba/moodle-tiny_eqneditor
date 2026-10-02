// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * The toolbar button, menu item, and dialog itself.
 *
 * The same maths-view-only dialog as tinymce/v6/eqneditor.js in the top-level
 * fxPlugins repo - Moodle 4.1+'s own editor *is* TinyMCE 6 - with the LaTeX and
 * Inline toggles bottom-left and "Insert as", Cancel and OK bottom-right. What differs is how
 * configuration is read (options.js, via Moodle's per-context plugin configuration), how the
 * plugin registers itself (Moodle's Tiny plugin API), and a third "Insert as" choice, LaTeX
 * text, for sites that render maths with Moodle's MathJax filter. Keep the two in step by hand.
 *
 * @module      tiny_eqneditor/commands
 * @copyright   2026 CodeCogs <https://www.codecogs.com>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {getButtonImage} from 'editor_tiny/utils';
import {getString} from 'core/str';
import {component, buttonName, menuItemName, icon} from './common';
import {getServer, getLicence, getRenderUrl, getInsertAs, getDesign} from './options';

let scriptPromise = null;

const loadEqEditorApi = (scriptUrl) => {
    if (scriptPromise) {
        return scriptPromise;
    }

    scriptPromise = new Promise((resolve, reject) => {
        if (typeof window.EqEditor !== 'undefined') {
            resolve();
            return;
        }

        const existing = document.querySelector(`script[src="${scriptUrl}"]`);
        const script = existing || document.createElement('script');

        script.addEventListener('load', () => resolve());
        script.addEventListener('error', () => reject(
            new Error(`CodeCogs Equation Editor: could not load ${scriptUrl}`)
        ));

        if (!existing) {
            script.src = scriptUrl;
            document.head.appendChild(script);
        }
    });

    return scriptPromise;
};

// EqEditor.init() switches the converter every TextArea/MathView/Toolbar construction takes on
// to fxTeX Pro - skip it and they keep the placeholder converter for their whole lifetime, even
// once fxeditor.api.min.js itself has loaded. Called once per page; an empty licence is the
// normal, expected state until a real one is configured.
let initPromise = null;

const ensureInit = (licence) => {
    if (initPromise) {
        return initPromise;
    }
    initPromise = (typeof window.EqEditor.init === 'function')
        ? window.EqEditor.init({licence: licence || ''}).catch((err) => {
            window.console && console.warn(`fxTeX Pro: ${err && err.message || err}`);
        })
        : Promise.resolve();
    return initPromise;
};

// Presentation MathML, plus the three non-"m" elements the converter can emit.
// The `design` option (see the README): how the editor looks, set by the site rather than the
// author. The toolbar's rows and scale go to Toolbar.link() itself; everything else is applied
// here, once the editor is mounted - CSS scoped to this editor's root, then the starting state of
// the LaTeX toggle and the "Insert as" menu.
let designCount = 0;
const applyDesign = (root, design, latexToggle, insertSelect) => {
    if (!root || !design) return;
    if (!root.id) root.id = 'cc-eqn-design-' + (++designCount);
    const sel = '#' + root.id;
    let css = '';
    const colour = String(design.colour || '');
    if (/^(#[0-9a-f]{3,8}|[a-z]+)$/i.test(colour)) {
        css += sel + ' { --cc-accent: ' + colour + ';' +
            ' --cc-accent-soft: color-mix(in srgb, ' + colour + ' 11%, #fff);' +
            ' --cc-accent-soft-ring: color-mix(in srgb, ' + colour + ' 28%, #fff);' +
            ' --cc-accent-mid: color-mix(in srgb, ' + colour + ' 22%, #fff);' +
            ' --cc-accent-mid-ring: color-mix(in srgb, ' + colour + ' 43%, #fff); }';
    }
    if (Number(design.mathSize) > 0) css += sel + ' .CCMathView { font-size: ' + Number(design.mathSize) + 'px !important; }';
    if (Number(design.latexSize) > 0) css += sel + ' .CCLatexInput { font-size: ' + Number(design.latexSize) + 'px !important; }';
    if (design.toolbar === false) css += sel + ' .CCToolbar { display: none !important; }';
    if (design.history === false) css += sel + ' .CCEditorBar { display: none !important; }';
    if (css) {
        const style = document.createElement('style');
        style.textContent = css;
        root.appendChild(style);
    }
    // The dialog's width and height (`width`, `height`), before any scaling: the box takes the width,
    // and the editing area whatever height makes the whole dialog the height asked for - measured,
    // since everything else in it (toolbar rows, the bottom bar) varies with the design. Hosts that
    // size their dialogs themselves (TinyMCE 4, CKEditor 4) are given both when they open it instead.
    const sizedBox = root.closest('.tox-dialog, .mce-window, .cke_dialog, .ck-balloon-panel, .cc-eqneditor-modal, .tc-drop-down') || root;
    if (!sizedBox.matches('.mce-window, .cke_dialog')) {
        if (Number(design.width) > 0) sizedBox.style.setProperty('width', Number(design.width) + 'px', 'important');
        const area = root.querySelector('.CCMathViewHost');
        if (Number(design.height) > 0 && area) {
            // Measured, then measured again as the dialog settles - the toolbar fits itself to its row
            // after the dialog first lays out, and the fonts arrive - correcting by the difference each time.
            // A box with a height of its own (Froala's and Tiptap's modals) sizes to its contents instead.
            sizedBox.style.setProperty('height', 'auto', 'important');
            const sizing = document.createElement('style');
            root.appendChild(sizing);
            let h = 0;
            const fit = () => {
                const shown = root.querySelector('.CCLatexInput') && getComputedStyle(area).display === 'none'
                    ? root.querySelector('.CCLatexInput') : area;
                // Scale may already be applied (see below), and on-screen sizes include it.
                const applied = parseFloat(sizedBox.style.zoom) || parseFloat((sizedBox.style.transform.match(/scale\(([\d.]+)\)/) || [])[1]) || 1;
                const now = h || shown.getBoundingClientRect().height / applied;
                h = Math.max(120, Math.round(now + Number(design.height) - sizedBox.getBoundingClientRect().height / applied));
                // Never taller than the whole dialog asked for: a host that caps its dialog (and scrolls the
                // rest) would otherwise be chased upwards on every pass.
                h = Math.min(h, Number(design.height));
                sizing.textContent = '#' + root.id + ' { height: auto !important; } #' + root.id + ' .CCMathViewHost, #' + root.id + ' .CCLatexInput { height: ' + h + 'px !important; min-height: ' + h + 'px !important; }';
            };
            fit();
            [150, 500, 1200].forEach((t) => setTimeout(fit, t));
        }
    }
    // The whole dialog, box and contents together - see `dialogSize` in the README. Zoomed where
    // the host lays the dialog out (it grows in place); scaled where the host positions it itself
    // (CKEditor, TinyMCE 4, a TiddlyWiki drop-down), so that placement still holds.
    const size = Number(design.dialogSize);
    if (size > 0 && size !== 1) {
        const box = root.closest('.tox-dialog, .mce-window, .cke_dialog, .ck-balloon-panel, .cc-eqneditor-modal, .tc-drop-down') || root;
        const position = getComputedStyle(box).position;
        if (position === 'absolute' || position === 'fixed') {
            box.style.transform = 'scale(' + size + ')';
            box.style.transformOrigin = box.matches('.ck-balloon-panel') ? 'top center'
                : box.matches('.tc-drop-down') ? 'top left' : 'center center';
        } else {
            box.style.zoom = String(size);
            box.style.setProperty('max-width', 'calc(96vw / ' + size + ')', 'important'); // still no wider than the window
        }
    }
    if (insertSelect && design.insertAs && insertSelect.querySelector('option[value="' + design.insertAs + '"]')) {
        insertSelect.value = design.insertAs;
    }
    if (latexToggle && design.latex && !latexToggle.checked && !latexToggle.disabled) {
        latexToggle.checked = true;
        latexToggle.dispatchEvent(new Event('change', { bubbles: true }));
    }
};

const MATHML_ELEMENTS = [
    'math', 'semantics', 'annotation', 'annotation-xml',
    'mrow', 'mi', 'mo', 'mn', 'ms', 'mtext', 'mspace', 'mglyph',
    'mfrac', 'msqrt', 'mroot', 'mstyle', 'merror', 'mpadded', 'mphantom', 'menclose',
    'msub', 'msup', 'msubsup', 'munder', 'mover', 'munderover',
    'mmultiscripts', 'mprescripts', 'none',
    'mtable', 'mtr', 'mtd', 'mlabeledtr', 'maction',
];

const loadCssOnce = (url) => {
    if (document.querySelector(`link[href="${url}"]`)) {
        return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
};

const decodeEquation = (encoded) => {
    let latex = encoded;
    try {
        latex = decodeURIComponent(encoded);
    } catch (e) {
        // Not valid percent-encoding; still worth showing as it stands.
    }
    return latex.replace(/&space;/g, ' ').replace(/&plus;/g, '+').replace(/&hash;/g, '#');
};

const escapeHtml = (s) => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Re-asserts the API's own .CCMathView/.fxtex rules, which host resets and revert-layer override.
const apiMathRules = () => {
    let out = '';
    for (const sheet of document.styleSheets) {
        let rules;
        try {
            rules = sheet.cssRules;
        } catch (e) {
            continue;
        }
        for (const r of rules) {
            if (!r.selectorText || !/(^|,)\s*\.(fxtex|CCMathView)\b/.test(r.selectorText)) {
                continue;
            }
            let decls = '';
            for (const p of r.style) {
                decls += `${p}:${r.style.getPropertyValue(p)} !important;`;
            }
            if (decls) {
                out += r.selectorText.split(',')
                    .map((s) => (/^\.CCMathView\b/.test(s.trim()) ? s.trim() : `.CCMathView ${s.trim()}`))
                    .join(',') + `{${decls}}`;
            }
        }
    }
    return out;
};

// The API's own @font-face for "Latin Modern Math" only carries local(), so it falls back to a
// generic serif unless the font happens to be installed; redeclaring it here adds a real url().
// Everything else is layout the shared fxeditor.css can't be relied on for, and undoing
// TinyMCE's `.tox :not(svg)` reset where it reaches the toolbar icons, MathML and bottom bar.
const injectStyleOverridesOnce = (fontUrl) => {
    if (document.getElementById('cc-eqneditor-style-overrides')) {
        return;
    }
    const style = document.createElement('style');
    style.id = 'cc-eqneditor-style-overrides';
    style.textContent = `@font-face { font-family: "Latin Modern Math"; font-display: swap; ` +
        `src: local("Latin Modern Math"), url("${fontUrl.replace(/prototypes\/latinmodern-math\.otf$/, 'fonts/LatinModernMath-Regular.woff2')}") format("woff2"), url("${fontUrl}") format("opentype"); }` +
        // Undo host resets (e.g. .cke_reset_all *) inside the toolbar icons and the maths view's MathML.
        '.CCToolbar svg:has(g[font-family]), .CCToolbar svg:has(g[font-family]) * { font: revert-layer !important; }' +
        // Icons drawn as <text>: the svg gets the API's own .cc_panel font (fxTeX Toolbar, 16px) back over host resets, and each <text> its own font-size attribute (revert-layer lets attributes win).
        '.CCToolbar svg:not(:has(g[font-family])) { font: normal normal 16px "fxTeX Toolbar" !important; }' +
        '.CCToolbar svg:not(:has(g[font-family])) * { font: revert-layer !important; }' +
        '.CCToolbar svg, .CCToolbar svg * { width: revert-layer !important; height: revert-layer !important; max-width: revert-layer !important; }' +
        '.CCToolbar svg g[font-family="fxTeX Toolbar"] { color: #000 !important; }' +
        '.CCMathView math, .CCMathView math * { font: revert-layer !important; ' +
            'width: revert-layer !important; height: revert-layer !important; padding: revert-layer !important; ' +
            'margin: revert-layer !important; text-transform: revert-layer !important; text-align: revert-layer !important; ' +
            'box-sizing: revert-layer !important; white-space: revert-layer !important; }' +
        apiMathRules() +
        '.CCEqnEditor { display: flex !important; flex-direction: column !important; height: 520px !important; }' +
        '.CCEqnEditor .CCEditorBar, .CCEqnEditor .CCToolbarHost { flex: 0 0 auto; }' +
        // Left to stretch across the dialog, the toolbar's "fit" pass unwraps every button group
        // wider than the reference layout; sized to its own content it wraps the same way.
        '.CCEqnEditor .CCToolbarHost { align-self: flex-start; width: auto; }' +
        '.CCEqnEditor .CCMathViewHost { flex: 1 1 auto; min-height: 0; display: flex; align-items: center; ' +
            'justify-content: center; overflow: auto; }' +
        '.CCEqnEditor[data-inline="on"] .CCMathViewHost { justify-content: flex-start; }' +
        '.CCEqnEditor[data-latex="on"] .CCMathViewHost { display: none !important; }' +
        '.CCEqnEditor .CCLatexInput { flex: 1 1 auto; min-height: 0; overflow: auto; }' +
        '.CCEqnEditor[data-latex="off"] .CCLatexInput { display: none !important; }' +
        '.CCEqnEditor .CCEqnOutput-hidden { display: none !important; }' +
    // The bottom bar: toggles left, Insert-as and the dialog's buttons right, one type size. All !important - host dialog resets otherwise restyle it.
    '.cc-eqn-bar { display: flex !important; align-items: center !important; gap: 16px !important; flex: 0 0 auto !important; ' +
        'margin: 8px 0 0 !important; padding: 10px 0 0 !important; border: 0 !important; border-top: 1px solid #e2e8f0 !important; ' +
        'background: none !important; font: 13px/1.3 system-ui, -apple-system, "Segoe UI", Arial, sans-serif !important; color: #1c2530 !important; }' +
    '.cc-eqn-bar-right { display: flex !important; align-items: center !important; gap: 8px !important; margin: 0 0 0 auto !important; padding: 0 !important; font: inherit !important; color: inherit !important; }' +
    '.cc-eqn-bar .cc-switch { display: inline-flex !important; align-items: center !important; gap: 6px !important; margin: 0 !important; ' +
        'padding: 0 !important; font: inherit !important; color: #54647c !important; cursor: pointer !important; user-select: none !important; white-space: nowrap !important; }' +
    '.cc-eqn-bar .cc-switch input { position: absolute !important; width: 1px !important; height: 1px !important; margin: -1px !important; ' +
        'padding: 0 !important; border: 0 !important; overflow: hidden !important; clip: rect(0, 0, 0, 0) !important; opacity: 0 !important; }' +
    '.cc-eqn-bar .cc-switch-track { position: relative !important; display: inline-block !important; flex: 0 0 auto !important; width: 28px !important; ' +
        'height: 16px !important; margin: 0 !important; padding: 0 !important; border: 0 !important; border-radius: 8px !important; ' +
        'background: #ccc !important; transition: background .2s !important; }' +
    '.cc-eqn-bar .cc-switch-knob { position: absolute !important; display: block !important; top: 2px !important; left: 2px !important; ' +
        'width: 12px !important; height: 12px !important; margin: 0 !important; border-radius: 50% !important; background: #fff !important; transition: left .2s !important; }' +
    '.cc-eqn-bar .cc-switch input:checked + .cc-switch-track { background: #4caf50 !important; }' +
    '.cc-eqn-bar .cc-switch input:checked + .cc-switch-track .cc-switch-knob { left: 14px !important; }' +
    '.cc-eqn-bar .cc-switch input:focus-visible + .cc-switch-track { outline: 2px solid #003794 !important; outline-offset: 2px !important; }' +
    '.cc-eqn-bar .cc-switch input:disabled ~ * { opacity: .5 !important; cursor: default !important; }' +
    '.cc-eqn-bar .cc-switch-label { font: inherit !important; color: inherit !important; }' +
    '.cc-eqn-bar .cc-switch input:checked ~ .cc-switch-label { color: #003794 !important; font-weight: 600 !important; }' +
    '.cc-eqn-bar .cc-eqn-select { width: auto !important; height: 30px !important; margin: 0 !important; padding: 0 8px !important; ' +
        'border: 1px solid #cbd5e0 !important; border-radius: 4px !important; background: #fff !important; font: inherit !important; color: #1c2530 !important; cursor: pointer !important; }' +
    '.cc-eqn-bar .cc-eqn-btn { display: inline-flex !important; align-items: center !important; height: 30px !important; margin: 0 !important; ' +
        'padding: 0 16px !important; border: 1px solid #cbd5e0 !important; border-radius: 4px !important; background: #fff !important; ' +
        'font: inherit !important; color: #1c2530 !important; cursor: pointer !important; box-shadow: none !important; }' +
    '.cc-eqn-bar .cc-eqn-btn * { font: inherit !important; color: inherit !important; }' +
    '.cc-eqn-bar .cc-eqn-btn.cc-eqn-primary { background: #2c7a4b !important; border-color: #2c7a4b !important; color: #fff !important; }' +
        '.tox-dialog:has(.CCEqnEditor) { width: 850px !important; max-width: 96vw !important; height: auto !important; }' +
        // TinyMCE caps a dialog's body at 650px and scrolls the rest - a design taller than that has to be let through.
        '.tox-dialog:has(.CCEqnEditor) .tox-dialog__body-content { max-height: calc(100vh - 110px) !important; }';
    document.head.appendChild(style);
};

const switchHtml = (id, label, title) => `
    <label class="cc-switch" title="${title}">
        <input type="checkbox" id="${id}">
        <span class="cc-switch-track"><span class="cc-switch-knob"></span></span>
        <span class="cc-switch-label">${label}</span>
    </label>`;

let instanceCount = 0;

const setupEditor = (editor) => {
    const n = ++instanceCount;
    const ids = {
        root: `cc-eqn-mdl-${n}`,
        history: `cc-eqn-mdl-history-${n}`,
        toolbar: `cc-eqn-mdl-toolbar-${n}`,
        mathview: `cc-eqn-mdl-mathview-${n}`,
        latexInput: `cc-eqn-mdl-latex-${n}`,
        output: `cc-eqn-mdl-output-${n}`,
        toggleInline: `cc-eqn-mdl-toggle-inline-${n}`,
        toggleLatex: `cc-eqn-mdl-toggle-latex-${n}`,
        insertMode: `cc-eqn-mdl-insert-mode-${n}`,
    };

    const host = getServer(editor);
    // A bare host means https; a full origin (e.g. http://localhost:8010 for local development) is used as it is.
    const origin = /^https?:\/\//.test(host) ? host.replace(/\/+$/, '') : `https://${host}`;
    const renderUrl = getRenderUrl(editor);
    const design = getDesign(editor);
    // The site's "Insert as" setting is the dialog's starting choice; 'url' is its image form.
    const defaultMode = {url: 'svg', latex: 'latex', mathml: 'mathml'}[getInsertAs(editor)] || 'svg';
    const scriptUrl = `${origin}/fxeditor.api.min.js`;
    const cssUrl = `${origin}/fxeditor.css`;

    const apiReady = loadEqEditorApi(scriptUrl);
    loadCssOnce(cssUrl);
    loadCssOnce(`${origin}/fxtex.css`);

    let eqOutput = null;
    let eqTextArea = null;
    let eqMathView = null;
    let eqToolbar = null;

    const option = (value, label) => `<option value="${value}"${value === defaultMode ? ' selected' : ''}>${label}</option>`;

    const panelHtml = () => `
        <div id="${ids.root}" class="CCEqnEditor" data-latex="off" data-inline="off">
            <div class="CCEditorBar"><div id="${ids.history}" class="CCHistory"></div></div>
            <div id="${ids.toolbar}" class="CCToolbarHost"></div>
            <div id="${ids.mathview}" class="CCMathViewHost"></div>
            <div id="${ids.latexInput}" class="CCLatexInput" autocorrect="off" placeholder="Write LaTeX here..."></div>
            <img id="${ids.output}" class="CCEqnOutput-hidden" alt="">
            <div class="cc-eqn-bar">
                ${switchHtml(ids.toggleInline, 'Inline', 'Left-align the equation instead of centring it')}
                ${switchHtml(ids.toggleLatex, 'LaTeX markup', 'Show or hide the LaTeX markup')}
                <div class="cc-eqn-bar-right">
                    <select class="cc-eqn-select" id="${ids.insertMode}" title="How to insert the equation">
                        ${option('mathml', 'Insert as MathML')}
                        ${option('svg', 'Insert as image (SVG)')}
                        ${option('latex', 'Insert as LaTeX (MathJax)')}
                    </select>
                    <button type="button" class="cc-eqn-btn cc-cancel">Cancel</button>
                    <button type="button" class="cc-eqn-btn cc-eqn-primary cc-ok">OK</button>
                </div>
            </div>
        </div>`;

    const mount = () => {
        eqOutput = new window.EqEditor.Output(ids.output);
        eqOutput.setRenderURL(renderUrl);

        eqTextArea = window.EqEditor.TextArea.link(ids.latexInput)
            .addOutput(eqOutput)
            .addHistoryMenu(new window.EqEditor.History(ids.history));

        eqToolbar = window.EqEditor.Toolbar.link(ids.toolbar, design.toolbar || 'default', design.toolbarScale || 1).addTextArea(eqTextArea);

        const root = document.getElementById(ids.root);
        const latexToggle = document.getElementById(ids.toggleLatex);

        if (typeof window.EqEditor.MathView !== 'undefined') {
            eqMathView = window.EqEditor.MathView.link(ids.mathview).addTextArea(eqTextArea);
            eqToolbar.addMathView(eqMathView);
        } else {
            // Without a maths view the markup is the only thing to edit in - force it visible
            // and lock the toggle so it cannot be switched to an empty pane.
            root.setAttribute('data-latex', 'on');
            latexToggle.checked = true;
            latexToggle.disabled = true;
        }

        latexToggle.addEventListener('change', (e) => {
            const visible = e.target.checked;
            root.setAttribute('data-latex', visible ? 'on' : 'off');
            // Hiding a pane moves the toolbar's target to the other one, so a button pressed
            // straight afterwards doesn't insert into something the author can't see.
            eqToolbar.setActiveTextArea(visible ? eqTextArea : (eqMathView || eqTextArea));
        });

        document.getElementById(ids.toggleInline).addEventListener('change', (e) => {
            const inline = e.target.checked;
            root.setAttribute('data-inline', inline ? 'on' : 'off');
            if (eqMathView) {
                eqMathView.setInline(inline);
            }
            eqOutput.setInline(inline);
        });

        applyDesign(root, design, latexToggle, document.getElementById(ids.insertMode));
    };

    const buildInsert = (latex) => {
        const mode = document.getElementById(ids.insertMode).value;
        if (mode === 'latex') {
            // Moodle's MathJax filter reads \( \) as inline maths and $$ $$ as display maths.
            const inline = document.getElementById(ids.toggleInline).checked;
            return escapeHtml(inline ? `\\(${latex}\\)` : `$$${latex}$$`);
        }
        if (mode === 'svg') {
            // referrerpolicy explicitly: latex.codecogs.com identifies the calling site by
            // referer, and a stricter page policy would otherwise send none.
            return `<img src="${escapeHtml(eqOutput.exportAs('url'))}" alt="${escapeHtml(latex)}" referrerpolicy="origin">`;
        }
        return eqOutput.exportAs('mathml');
    };

    const showDialog = async(latex = '') => {
        const dialogTitle = await getString('dialogtitle', component);

        // No native footer: Cancel and OK live in the editor's own bottom bar, beside the
        // toggles and "Insert as".
        const dialog = editor.windowManager.open({
            title: dialogTitle,
            size: 'large',
            body: {
                type: 'panel',
                items: [{type: 'htmlpanel', html: panelHtml()}],
            },
            buttons: [],
            onClose: () => {
                // The suggestion list is appended to the document body rather than the dialog,
                // so it outlives the dialog unless it is dismissed explicitly.
                if (eqTextArea) {
                    eqTextArea.close();
                }
            },
        });

        const insertAndClose = () => {
            const current = eqTextArea ? eqTextArea.getTextArea().textContent.trim() : '';
            if (current) {
                editor.execCommand('mceInsertContent', false, buildInsert(current));
                eqTextArea.pushToHistory();
            }
            dialog.close();
        };

        // The editor is rebuilt on every open: TinyMCE destroys a dialog's DOM when it closes,
        // so anything held over from the previous open would point at detached nodes.
        apiReady.then(() => ensureInit(getLicence(editor))).then(() => {
            injectStyleOverridesOnce(cssUrl.slice(0, cssUrl.lastIndexOf('/') + 1) + 'prototypes/latinmodern-math.otf');
            mount();
            eqTextArea.clear();
            if (latex) {
                eqTextArea.insert(latex, latex.length);
            }
            eqTextArea.notifyOutputs();

            const root = document.getElementById(ids.root);
            root.querySelector('.cc-cancel').addEventListener('click', () => dialog.close());
            root.querySelector('.cc-ok').addEventListener('click', insertAndClose);
            return;
        }).catch((err) => {
            // eslint-disable-next-line no-console
            console.error(err);
            dialog.close();
            editor.notificationManager.open({text: 'The CodeCogs Equation Editor could not be loaded.', type: 'error'});
        });
    };

    // TinyMCE's schema has no MathML in it, so an "Insert as MathML" equation would be stripped
    // on insert. PreInit is the hook: the schema exists and hasn't filtered anything yet.
    editor.on('PreInit', () => {
        if (!editor.schema || typeof editor.schema.addValidElements !== 'function') {
            return;
        }
        editor.schema.addValidElements(MATHML_ELEMENTS.map((name) => `${name}[*]`).join(','));
        editor.schema.addValidElements('span[class|role|aria-label|aria-hidden]');

        // addValidElements('img[referrerpolicy]') would *replace* img's existing rule and drop
        // src/alt/width/height, so the one attribute is added to the existing rule directly.
        const imgRule = editor.schema.getElementRule('img');
        if (imgRule && imgRule.attributes && !imgRule.attributes.referrerpolicy) {
            imgRule.attributes.referrerpolicy = {};
            imgRule.attributesOrder.push('referrerpolicy');
        }
    });

    // Double-click an equation to edit it again: an equation carries the LaTeX it was written
    // from, in an image's rendering URL or a <math> element's title.
    editor.on('dblclick', (e) => {
        const target = e.target;
        if (!target) {
            return;
        }

        if (target.nodeName.toLowerCase() === 'img') {
            const match = target.src.match(/(gif|svg|png)\.image\?(.*)/);
            if (match) {
                showDialog(decodeEquation(match[2]));
            }
            return;
        }

        const math = target.closest && target.closest('math[title]');
        if (math) {
            const mathLatex = math.getAttribute('title').trim();
            if (mathLatex) {
                showDialog(mathLatex);
            }
        }
    });

    return showDialog;
};

/**
 * Registers the toolbar button and Insert-menu item. Called once per editor instance from
 * plugin.js, inside tinyMCE.PluginManager.add().
 *
 * @returns {function(editor): void}
 */
export const getSetup = async() => {
    const [buttonText, menuItemText, buttonImage] = await Promise.all([
        getString('button_eqneditor', component),
        getString('menuitem_eqneditor', component),
        getButtonImage('eqneditor', component),
    ]);

    return (editor) => {
        editor.ui.registry.addIcon(icon, buttonImage.html);

        const showDialog = setupEditor(editor);

        editor.ui.registry.addButton(buttonName, {
            icon,
            tooltip: buttonText,
            onAction: () => showDialog(),
        });

        editor.ui.registry.addMenuItem(menuItemName, {
            icon,
            text: menuItemText,
            onAction: () => showDialog(),
        });
    };
};
