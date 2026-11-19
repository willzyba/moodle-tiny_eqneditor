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
 * @copyright   2026 CodeCogs, Zyba Ltd. <https://www.codecogs.com>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {getButtonImage} from 'editor_tiny/utils';
import {getString, getStrings} from 'core/str';
import Log from 'core/log';
import {component, buttonName, menuItemName, icon} from './common';
import {getServer, getLicence, getRenderUrl, getInsertAs, getDesign} from './options';

// The dialog's text, from lang/en/tiny_eqneditor.php - fetched once in getSetup(), before any
// dialog can open, so the code that builds the dialog can use it as it stands.
const STRING_KEYS = [
    'cancel', 'inline', 'inline_title', 'insertas_menu', 'insert_latex', 'insert_mathml', 'insert_svg',
    'latex', 'latex_placeholder', 'latex_title', 'latexresize', 'latexresize_title', 'loaderror', 'ok',
    'predictor', 'predictor_title', 'predictorhide', 'predictorpanel', 'predictorresize', 'size_title',
    'toolbarsize', 'toolbarsize_title',
];
let str = {};

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
            Log.warn(`fxTeX Pro: ${err && err.message || err}`);
        })
        : Promise.resolve();
    return initPromise;
};

// Presentation MathML, plus the three non-"m" elements the converter can emit.
// The `design` option (see the README): how the editor looks, set by the site rather than the
// author. The toolbar's rows and scale go to Toolbar.link() itself; everything else is applied
// here, once the editor is mounted - CSS scoped to this editor's root, then the starting state of
// the LaTeX toggle and the "Insert as" menu.
// The dialog's size when the design does not set one: about 700 by 450 pixels.
const DEFAULT_WIDTH = 700;
const DEFAULT_HEIGHT = 450;
const designWidth = (design) => (Number(design && design.width) > 0 ? Number(design.width) : DEFAULT_WIDTH);
const designHeight = (design) => (Number(design && design.height) > 0 ? Number(design.height) : DEFAULT_HEIGHT);
// Gives an inserted image its size in em once the API has read it (Output.imageSize()): set on
// the image after it goes in, since waiting before inserting it would lose the editor's selection.
// Marked with data-cc-size until then; an API without imageSize() leaves the image as it was.
let sizingCount = 0;
const sizeImage = (output, apply) => {
    if (!output || typeof output.imageSize !== 'function') {
        return '';
    }
    const mark = `cc-size-${++sizingCount}-${Date.now()}`;
    output.imageSize().then((size) => apply(mark, size));
    return ` data-cc-size="${mark}"`;
};
// An equation's own size, against a normal one (Output.setScale()): normal is whatever the
// site's .fxtex rule makes it, and this scales one equation on top. Chosen in the dialog's Size
// control when the design shows it (design.sizeControl); otherwise an equation being edited keeps
// the size it had.
const SIZES = [50, 75, 100, 125, 150, 200, 300];
const sizeOptions = () => SIZES
    .map((pct) => `<option value="${pct}"${pct === 100 ? ' selected' : ''}>${pct}%</option>`)
    .join('');
const showSize = (select, scale) => {
    if (!select) {
        return;
    }
    const pct = String(Math.round(scale * 100));
    if (!select.querySelector(`option[value="${pct}"]`)) {
        const option = document.createElement('option');
        option.value = pct;
        option.textContent = `${pct}%`;
        select.appendChild(option);
    }
    select.value = pct;
};
// The size an equation on the page was inserted at - read once the API has loaded, which may be
// after the double-click that asked for it. 1 without one.
const sizeOf = (el) => (el && window.EqEditor && window.EqEditor.Output
    && (window.EqEditor.Output.scaleOf || window.EqEditor.Output.equationSizeOf)
    ? (window.EqEditor.Output.scaleOf || window.EqEditor.Output.equationSizeOf).call(window.EqEditor.Output, el)
    : 1);

// The box each host draws its dialog in.
const DIALOG_BOXES = '.tox-dialog, .mce-window, .cke_dialog, .ck-balloon-panel, .cc-eqneditor-modal, .tc-drop-down';
let designCount = 0;
const applyDesign = (root, design, latexToggle, insertSelect) => {
    if (!root || !design) {
        return;
    }
    if (!root.id) {
        root.id = 'cc-eqn-design-' + (++designCount);
    }
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
    if (Number(design.mathSize) > 0) {
        css += sel + ' .CCMathView { font-size: ' + Number(design.mathSize) + 'px !important; }';
    }
    if (Number(design.latexSize) > 0) {
        css += sel + ' .CCLatexInput { font-size: ' + Number(design.latexSize) + 'px !important; }';
    }
    if (design.toolbar === false) {
        css += sel + ' .CCToolbar { display: none !important; }';
    }
    if (design.history === false) {
        css += sel + ' .CCEditorBar { display: none !important; }';
    }
    if (css) {
        const style = document.createElement('style');
        style.textContent = css;
        root.appendChild(style);
    }
    // The dialog's width and height (`width`, `height`), before any scaling: the box takes the width,
    // and the editing area whatever height makes the whole dialog the height asked for - measured,
    // since everything else in it (toolbar rows, the bottom bar) varies with the design. Hosts that
    // size their dialogs themselves (TinyMCE 4, CKEditor 4) are given both when they open it instead.
    const sizedBox = root.closest(DIALOG_BOXES) || root;
    if (!sizedBox.matches('.mce-window, .cke_dialog')) {
        sizedBox.style.setProperty('width', designWidth(design) + 'px', 'important');
        const area = root.querySelector('.CCMathViewHost');
        if (area) {
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
                const applied = parseFloat(sizedBox.style.zoom)
                    || parseFloat((sizedBox.style.transform.match(/scale\(([\d.]+)\)/) || [])[1]) || 1;
                const now = h || shown.getBoundingClientRect().height / applied;
                h = Math.max(120, Math.round(now + designHeight(design) - sizedBox.getBoundingClientRect().height / applied));
                // Never taller than the whole dialog asked for: a host that caps its dialog (and scrolls the
                // rest) would otherwise be chased upwards on every pass.
                h = Math.min(h, designHeight(design));
                sizing.textContent = '#' + root.id + ' { height: auto !important; } ' +
                    '#' + root.id + ' .CCMathViewHost, #' + root.id + ' .CCLatexInput { ' +
                    'height: ' + h + 'px !important; min-height: ' + h + 'px !important; }';
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
        const box = root.closest(DIALOG_BOXES) || root;
        const position = getComputedStyle(box).position;
        if (position === 'absolute' || position === 'fixed') {
            box.style.transform = 'scale(' + size + ')';
            if (box.matches('.ck-balloon-panel')) {
                box.style.transformOrigin = 'top center';
            } else if (box.matches('.tc-drop-down')) {
                box.style.transformOrigin = 'top left';
            } else {
                box.style.transformOrigin = 'center center';
            }
            // A cap on the box's width (CKEditor 5's balloon: 96vw) holds before the scale - divided by it,
            // as for zoom below, or a scaled-down box is squeezed narrower than its own contents.
            // A host that reuses the box (CKEditor 5) would otherwise divide it again.
            box.style.removeProperty('max-width');
            var cap = getComputedStyle(box).maxWidth;
            if (cap !== 'none') {
                box.style.setProperty('max-width', 'calc(' + cap + ' / ' + size + ')', 'important');
            }
        } else {
            box.style.zoom = String(size);
            // Still no wider than the window.
            box.style.setProperty('max-width', 'calc(96vw / ' + size + ')', 'important');
        }
    }
    // The design's choice, unless the author has made their own (addEditorControls()).
    if (insertSelect && design.insertAs && !insertSelect.hasAttribute('data-cc-remembered') &&
            insertSelect.querySelector('option[value="' + design.insertAs + '"]')) {
        insertSelect.value = design.insertAs;
    }
    if (latexToggle && design.latex && !latexToggle.checked && !latexToggle.disabled) {
        latexToggle.checked = true;
        latexToggle.dispatchEvent(new Event('change', {bubbles: true}));
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

/**
 * The equation as an image URL ('url') or as MathML ('mathml'). fxeditor-api replaced
 * Output.exportAs() with getEquationURL() and setFormat()/setWrapper()/getCode() (its 9630657);
 * exportAs() still serves an API from before that. The format is set each time: the same Output
 * gives both.
 *
 * @param {object} output The editor's EqEditor.Output.
 * @param {string} kind 'url' or 'mathml'.
 * @returns {string} The image URL, or the MathML markup.
 */
function outputCode(output, kind) {
    if (typeof output.exportAs === 'function') {
        return output.exportAs(kind);
    }
    if (kind === 'mathml') {
        return output.setFormat('mathml').setWrapper('html').getCode();
    }
    return output.setFormat('svg').getEquationURL();
}

let EDITOR_PREFS_KEY = 'cc-eqn-editor';

/**
 * The editor's own controls, as the Google Docs sidebar has them: the toolbar's size (50-120%) at
 * the right of the undo/redo bar; Inline, LaTeX and Predictor switches together - Inline added
 * where a host has none, Predictor beside LaTeX; and LaTeX shown above the maths view rather than
 * in its place (see stackPanes()). The size, Inline, LaTeX, Predictor and the markup's height are
 * remembered here; the predictor starts as design.predictor says until the author has chosen.
 *
 * @param {HTMLElement} root The editor's root element.
 * @param {object} design The site's `design` option.
 * @param {object} parts The editor's textArea, mathView and output, and the latexToggle and
 *     inlineToggle checkboxes.
 */
function addEditorControls(root, design, parts) {
    if (!root || !parts) {
        return;
    }
    design = design || {};
    injectPredictorStylesOnce();
    let prefs = {};
    try {
        prefs = JSON.parse(localStorage.getItem(EDITOR_PREFS_KEY)) || {};
    } catch (e) {
        // Nothing remembered, or no storage in this browser: the defaults stand.
    }
    let save = function() {
        try {
            localStorage.setItem(EDITOR_PREFS_KEY, JSON.stringify(prefs));
        } catch (e) {
            // No storage in this browser: remembered for this dialog only.
        }
    };
    let latexLabel = parts.latexToggle && parts.latexToggle.closest('label');
    // Another switch drawn exactly as the LaTeX one is - whatever markup and styling this host gives it.
    let makeSwitch = function(text, title) {
        let label = latexLabel.cloneNode(true);
        let input = label.querySelector('input');
        input.removeAttribute('id');
        input.className = '';
        for (let i = input.attributes.length - 1; i >= 0; i--) {
            if (/^data-/.test(input.attributes[i].name)) {
                input.removeAttribute(input.attributes[i].name);
            }
        }
        input.checked = false;
        input.disabled = false;
        label.removeAttribute('for');
        label.title = title;
        let name = label.querySelector('.cc-switch-label');
        if (name) {
            name.textContent = text;
        }
        return label;
    };

    // The toolbar's size. zoom scales it as it stands, so nothing is rebuilt: it keeps which pane it
    // types into, and any panel that is open.
    let toolbar = root.querySelector('.CCToolbar');
    let bar = root.querySelector('.CCEditorBar');
    if (toolbar && bar && design.toolbar !== false && !bar.querySelector('.cc-toolbar-size')) {
        let size = document.createElement('label');
        size.className = 'cc-toolbar-size';
        size.title = str.toolbarsize_title;
        size.innerHTML = '<input type="range" min="50" max="120" step="5"><output></output>';
        bar.appendChild(size);
        let range = size.querySelector('input');
        range.setAttribute('aria-label', str.toolbarsize);
        let shown = size.querySelector('output');
        let setSize = function(pct) {
            pct = Math.min(120, Math.max(50, Math.round(Number(pct) / 5) * 5 || 100));
            prefs.toolbarSize = pct;
            toolbar.style.zoom = String(pct / 100);
            range.value = pct;
            shown.textContent = pct + '%';
        };
        setSize(prefs.toolbarSize || 100);
        range.addEventListener('input', function() {
            setSize(range.value);
        });
        range.addEventListener('change', save);
    }

    // Inline: the host's own switch, or one added before LaTeX where it has none.
    let inline = parts.inlineToggle;
    if (!inline && latexLabel) {
        let inlineLabel = makeSwitch(str.inline, str.inline_title);
        latexLabel.parentNode.insertBefore(inlineLabel, latexLabel);
        inline = inlineLabel.querySelector('input');
        inline.addEventListener('change', function() {
            root.setAttribute('data-inline', inline.checked ? 'on' : 'off');
            if (parts.mathView && parts.mathView.setInline) {
                parts.mathView.setInline(inline.checked);
            }
            if (parts.output && parts.output.setInline) {
                parts.output.setInline(inline.checked);
            }
        });
    }
    if (inline) {
        if (typeof prefs.inline === 'boolean' && inline.checked !== prefs.inline && !inline.disabled) {
            inline.checked = prefs.inline;
            inline.dispatchEvent(new Event('change', {bubbles: true}));
        }
        inline.addEventListener('change', function() {
            prefs.inline = inline.checked;
            save();
        });
    }

    // LaTeX: remembered with the rest (a host that keeps its own record is overruled by this one).
    let latex = parts.latexToggle;
    if (latex) {
        if (typeof prefs.latex === 'boolean' && latex.checked !== prefs.latex && !latex.disabled) {
            latex.checked = prefs.latex;
            latex.dispatchEvent(new Event('change', {bubbles: true}));
        }
        latex.addEventListener('change', function() {
            prefs.latex = latex.checked;
            save();
        });
    }

    // Insert as: the author's last choice, over the site's setting and the design's.
    const insertAs = parts.insertSelect;
    if (insertAs) {
        if (prefs.insertAs && insertAs.querySelector('option[value="' + prefs.insertAs + '"]')) {
            insertAs.value = prefs.insertAs;
            insertAs.setAttribute('data-cc-remembered', '');
        }
        insertAs.addEventListener('change', function() {
            prefs.insertAs = insertAs.value;
            save();
        });
    }

    stackPanes(root, prefs, save);

    // The predictor, switched on and off beside LaTeX.
    if (latexLabel) {
        let predictorBox = null;
        let predictor = addPredictor(root, design, parts.textArea, parts.mathView, function() {
            predictorBox.checked = false;
            prefs.predictor = false;
            save();
        });
        if (predictor) {
            let predictorLabel = makeSwitch(str.predictor, str.predictor_title);
            latexLabel.parentNode.insertBefore(predictorLabel, latexLabel.nextSibling);
            predictorBox = predictorLabel.querySelector('input');
            predictorBox.checked = typeof prefs.predictor === 'boolean' ? prefs.predictor : !!design.predictor;
            predictor.setOn(predictorBox.checked);
            predictorBox.addEventListener('change', function() {
                predictor.setOn(predictorBox.checked);
                prefs.predictor = predictorBox.checked;
                save();
            });
        }
    }
}

let LATEX_HEIGHT = 90;
let LATEX_MIN = 40;

/**
 * The LaTeX markup above the maths view while LaTeX is on, rather than in its place, with a bar
 * between them that drags (or arrow-keys) the markup taller or shorter - its height remembered as
 * prefs.latexHeight. Follows the editor root's data-latex, which every host's LaTeX switch sets,
 * and overrides the host's own rule hiding the maths view meanwhile (inline and !important, as
 * that is).
 *
 * @param {HTMLElement} root The editor's root element.
 * @param {object} prefs The preferences remembered in this browser.
 * @param {function} save Saves prefs.
 */
function stackPanes(root, prefs, save) {
    let host = root.querySelector('.CCMathViewHost');
    let markup = root.querySelector('.CCLatexInput');
    if (!host || !markup || root.querySelector('.cc-eqn-panes')) {
        return;
    }
    let panes = document.createElement('div');
    panes.className = 'cc-eqn-panes';
    // Whichever of the two comes first: querySelector() returns the earlier in document order.
    let first = root.querySelector('.CCMathViewHost, .CCLatexInput');
    first.parentNode.insertBefore(panes, first);
    let grip = document.createElement('div');
    grip.className = 'cc-eqn-panes-split';
    grip.tabIndex = 0;
    grip.setAttribute('role', 'separator');
    grip.setAttribute('aria-orientation', 'horizontal');
    grip.setAttribute('aria-label', str.latexresize);
    grip.title = str.latexresize_title;
    panes.appendChild(markup);
    panes.appendChild(grip);
    panes.appendChild(host);

    let height = Number(prefs.latexHeight) >= LATEX_MIN ? Number(prefs.latexHeight) : LATEX_HEIGHT;
    let set = function(el, prop, value) {
        el.style.setProperty(prop, value, 'important');
    };
    // A host that shows one pane at a time gives the editing area's height to whichever is showing:
    // with both showing, that area is shared - the markup's height, then the bar, then the equation
    // whatever is left. A host that shows both anyway sizes them itself; the markup's height is set.
    let apply = function() {
        let both = root.getAttribute('data-latex') === 'on';
        panes.classList.toggle('cc-eqn-both', both);
        ['height', 'min-height', 'flex', 'display'].forEach(function(p) {
            markup.style.removeProperty(p);
            host.style.removeProperty(p);
        });
        if (!both) {
            return;
        }
        set(markup, 'min-height', '0');
        set(markup, 'flex', '0 0 auto');
        if (getComputedStyle(host).display !== 'none') {
            set(markup, 'height', height + 'px');
            return;
        }
        // What the host gives the markup alone: the whole area.
        let area = markup.offsetHeight;
        if (!area) {
            // Not laid out yet - the ResizeObserver below comes back.
            return;
        }
        let bar = grip.offsetHeight + 2;
        let h = Math.min(height, Math.max(LATEX_MIN, area - bar - 60));
        set(markup, 'height', h + 'px');
        set(host, 'display', 'flex');
        set(host, 'height', Math.max(0, area - bar - h) + 'px');
        set(host, 'min-height', '0');
        set(host, 'flex', '0 0 auto');
    };
    let setHeight = function(h) {
        height = Math.round(Math.max(LATEX_MIN, h));
        apply();
    };
    apply();
    new MutationObserver(apply).observe(root, {attributes: true, attributeFilter: ['data-latex']});
    // The dialog lays out, or is resized, after this has run (TinyMCE 4's and WordPress's settle their
    // sizes a moment later): share the area it then has. The editor's root, not the panes, is watched -
    // the panes take the heights set here, so would not change to say so - and measured again as the
    // dialog settles, as applyDesign() measures its height.
    let again = function() {
        if (panes.classList.contains('cc-eqn-both')) {
            apply();
        }
    };
    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(again).observe(root);
    }
    [150, 500, 1200].forEach(function(t) {
        setTimeout(again, t);
    });

    grip.addEventListener('keydown', function(e) {
        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') {
            return;
        }
        e.preventDefault();
        setHeight(height + (e.key === 'ArrowDown' ? 20 : -20));
        prefs.latexHeight = height;
        save();
    });
    grip.addEventListener('pointerdown', function(e) {
        if (e.button !== 0) {
            return;
        }
        e.preventDefault();
        let scale = panes.getBoundingClientRect().height / (panes.offsetHeight || 1) || 1;
        let startY = e.clientY;
        let startH = height;
        grip.setPointerCapture(e.pointerId);
        grip.classList.add('is-dragging');
        let move = function(ev) {
            setHeight(startH + (ev.clientY - startY) / scale);
        };
        let up = function() {
            grip.removeEventListener('pointermove', move);
            grip.removeEventListener('pointerup', up);
            grip.removeEventListener('pointercancel', up);
            grip.classList.remove('is-dragging');
            prefs.latexHeight = height;
            save();
        };
        grip.addEventListener('pointermove', move);
        grip.addEventListener('pointerup', up);
        grip.addEventListener('pointercancel', up);
    });
}

let PREDICTOR_WIDTH = 220;
let PREDICTOR_MIN = 140;
let PREDICTOR_HEIGHT = 170;
let PREDICTOR_MIN_HEIGHT = 90;
let PREDICTOR_STACK_BELOW = 480;
let PREDICTOR_KEY = 'cc-eqn-predictor';

/**
 * The predictor: whole equations that start the way this one does - the API's PredictorView - in
 * a panel beside the editing area. The maths view and the markup pane share one row with it, so
 * it sits beside whichever is showing - or, when that row is too narrow to share (a narrow
 * dialog), below it. The bar between them drags to resize the panel (arrow keys too); its button,
 * or Enter, switches the predictor off, as the Predictor switch does (`onOff`). Its width beside
 * and its height below are remembered in this browser.
 *
 * @param {HTMLElement} root The editor's root element.
 * @param {object} design The site's `design` option.
 * @param {object} textArea The editor's EqEditor.TextArea.
 * @param {object|null} mathView The editor's EqEditor.MathView, where it has one.
 * @param {function} onOff Called when the panel's own button switches the predictor off.
 * @returns {{setOn: function(boolean)}|null} Null for an API without a PredictorView.
 */
function addPredictor(root, design, textArea, mathView, onOff) {
    if (!root || typeof window.EqEditor === 'undefined' || !window.EqEditor.PredictorView) {
        return null;
    }
    let host = root.querySelector('.CCMathViewHost');
    let markup = root.querySelector('.CCLatexInput');
    // The panes stackPanes() made, where it has run.
    let panes = root.querySelector('.cc-eqn-panes');
    let first = panes || host || markup;
    if (!first || root.querySelector('.cc-eqn-work')) {
        return null;
    }
    injectPredictorStylesOnce();

    let saved = {};
    try {
        saved = JSON.parse(localStorage.getItem(PREDICTOR_KEY)) || {};
    } catch (e) {
        // Nothing remembered, or no storage in this browser: the defaults stand.
    }
    let width = Number(saved.width) >= PREDICTOR_MIN ? Number(saved.width) : PREDICTOR_WIDTH;
    let height = Number(saved.height) >= PREDICTOR_MIN_HEIGHT ? Number(saved.height) : PREDICTOR_HEIGHT;

    let work = document.createElement('div');
    work.className = 'cc-eqn-work cc-eqn-predictor-off';
    first.parentNode.insertBefore(work, first);
    if (!panes) {
        panes = document.createElement('div');
        panes.className = 'cc-eqn-panes';
        if (markup) {
            panes.appendChild(markup);
        }
        if (host) {
            panes.appendChild(host);
        }
    }

    let bar = document.createElement('div');
    bar.className = 'cc-eqn-split';
    bar.tabIndex = 0;
    bar.setAttribute('role', 'separator');
    bar.setAttribute('aria-label', str.predictorresize);
    let fold = document.createElement('button');
    fold.type = 'button';
    fold.className = 'cc-eqn-split-fold';
    fold.title = str.predictorhide;
    bar.appendChild(fold);

    let side = document.createElement('aside');
    side.className = 'cc-eqn-predictor';
    side.id = root.id + '-predictor';
    side.setAttribute('aria-label', str.predictorpanel);

    work.appendChild(panes);
    work.appendChild(bar);
    work.appendChild(side);

    /**
     * Whether the panel is below the editing area rather than beside it.
     *
     * @returns {boolean}
     */
    function stacked() {
        return work.classList.contains('cc-eqn-stacked');
    }
    /**
     * Remembers the panel's width and height in this browser.
     */
    function remember() {
        try {
            localStorage.setItem(PREDICTOR_KEY, JSON.stringify({width: width, height: height}));
        } catch (e) {
            // No storage in this browser: remembered for this dialog only.
        }
    }
    /**
     * Sets the panel's width beside the editing area.
     *
     * @param {number} w The width asked for, in pixels.
     */
    function setWidth(w) {
        // Never so wide that the editing area beside it has nothing left.
        let room = work.clientWidth - bar.offsetWidth - 160;
        width = Math.round(Math.max(PREDICTOR_MIN, room > PREDICTOR_MIN ? Math.min(w, room) : w));
        side.style.width = width + 'px';
    }
    /**
     * Sets the panel's height below the editing area.
     *
     * @param {number} h The height asked for, in pixels.
     */
    function setHeight(h) {
        height = Math.round(Math.min(600, Math.max(PREDICTOR_MIN_HEIGHT, h)));
        side.style.height = height + 'px';
    }
    /**
     * Beside the editing area, or below it once the row is too narrow for both: measured rather
     * than decided per host, so a dialog made narrow gets the right one. The button points the way
     * the panel goes to hide.
     */
    function layout() {
        let below = work.clientWidth > 0 && work.clientWidth < PREDICTOR_STACK_BELOW;
        work.classList.toggle('cc-eqn-stacked', below);
        side.style.width = below ? '' : width + 'px';
        side.style.height = below ? height + 'px' : '';
        fold.textContent = below ? '▾' : '›';
        bar.setAttribute('aria-orientation', below ? 'horizontal' : 'vertical');
    }
    layout();
    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(function() {
            if (stacked() !== (work.clientWidth > 0 && work.clientWidth < PREDICTOR_STACK_BELOW)) {
                layout();
            }
        }).observe(work);
    }

    /**
     * Switches the predictor off from the panel's own button or bar.
     */
    function off() {
        setOn(false);
        if (onOff) {
            onOff();
        }
    }
    fold.addEventListener('click', off);
    bar.addEventListener('keydown', function(e) {
        if (e.target !== bar) {
            return;
        }
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            off();
        } else if (!stacked() && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
            e.preventDefault();
            setWidth(width + (e.key === 'ArrowLeft' ? 20 : -20));
            remember();
        } else if (stacked() && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
            e.preventDefault();
            setHeight(height + (e.key === 'ArrowUp' ? 20 : -20));
            remember();
        }
    });
    // Dragged from anywhere on the bar but its button: left and right beside the editing area, up
    // and down below it. Pointer movement is in screen pixels, which a scaled dialog
    // (design.dialogSize) does not share with the panel's own size - hence the ratio.
    bar.addEventListener('pointerdown', function(e) {
        if (e.target === fold || e.button !== 0) {
            return;
        }
        e.preventDefault();
        let below = stacked();
        let scale = work.getBoundingClientRect().width / (work.offsetWidth || 1) || 1;
        let start = below ? e.clientY : e.clientX;
        let size = below ? height : width;
        bar.setPointerCapture(e.pointerId);
        work.classList.add('cc-eqn-dragging');
        /**
         * Resizes the panel as the pointer moves.
         *
         * @param {PointerEvent} ev
         */
        function move(ev) {
            if (below) {
                setHeight(size + (start - ev.clientY) / scale);
            } else {
                setWidth(size + (start - ev.clientX) / scale);
            }
        }
        /**
         * Ends the drag, and remembers the size it left.
         */
        function up() {
            bar.removeEventListener('pointermove', move);
            bar.removeEventListener('pointerup', up);
            bar.removeEventListener('pointercancel', up);
            work.classList.remove('cc-eqn-dragging');
            remember();
        }
        bar.addEventListener('pointermove', move);
        bar.addEventListener('pointerup', up);
        bar.addEventListener('pointercancel', up);
    });

    // Built the first time it is switched on, so nothing is asked of the suggestion service while
    // the predictor is off.
    let view = null;
    /**
     * Shows or hides the panel.
     *
     * @param {boolean} on
     */
    function setOn(on) {
        work.classList.toggle('cc-eqn-predictor-off', !on);
        if (!on) {
            return;
        }
        layout();
        if (!view) {
            let show = design && (design.predictorShow === 'latex' || design.predictorShow === 'both')
                ? design.predictorShow : 'mathml';
            view = window.EqEditor.PredictorView.link(side.id, {limit: 6, show: show}).addTextArea(textArea);
            if (mathView) {
                view.addMathView(mathView);
            }
        }
    }
    return {setOn: setOn};
}

/**
 * The styles for the editor's own controls and the predictor, added to the page once.
 * !important throughout: hosts reset their dialogs' contents (TinyMCE's .tox, CKEditor's
 * .ck-reset_all) more specifically than a plain class rule reaches.
 */
function injectPredictorStylesOnce() {
    if (document.getElementById('cc-eqn-predictor-css')) {
        return;
    }
    let style = document.createElement('style');
    style.id = 'cc-eqn-predictor-css';
    style.textContent =
        // The toolbar's size, at the right of the undo/redo bar - on one line with it however narrow.
        '.CCEditorBar:has(.cc-toolbar-size), .CCEditorBar:has(.cc-toolbar-size) .CCHistory { flex-wrap: nowrap !important; }' +
        '.cc-toolbar-size { display: inline-flex !important; align-items: center !important; gap: 4px !important; ' +
            'margin: 0 0 0 auto !important; ' +
            'min-width: 0 !important; flex: 0 1 auto !important; font: 11px/1 sans-serif !important; ' +
            'color: #54647c !important; cursor: pointer !important; }' +
        '.cc-toolbar-size input { width: 72px !important; min-width: 36px !important; flex: 0 1 72px !important; ' +
            'margin: 0 !important; padding: 0 !important; ' +
            'accent-color: var(--cc-accent, #003794) !important; }' +
        '.cc-toolbar-size output { min-width: 3em !important; text-align: right !important; }' +
        // The bar between the LaTeX markup and the maths view, while both show (stackPanes()).
        '.cc-eqn-panes-split { display: none !important; }' +
        '.cc-eqn-both > .cc-eqn-panes-split { display: block !important; flex: 0 0 auto !important; height: 9px !important; ' +
            'margin: 1px 0 !important; ' +
            'position: relative !important; cursor: row-resize !important; touch-action: none !important; ' +
            'outline: none !important; background: transparent !important; }' +
        '.cc-eqn-both > .cc-eqn-panes-split::before { content: "" !important; position: absolute !important; ' +
            'top: 3px !important; left: 42% !important; right: 42% !important; ' +
            'height: 3px !important; border-radius: 2px !important; background: #cbd5e0 !important; }' +
        '.cc-eqn-both > .cc-eqn-panes-split:hover::before, .cc-eqn-both > .cc-eqn-panes-split:focus-visible::before, ' +
            '.cc-eqn-panes-split.is-dragging::before { ' +
            'left: 0 !important; right: 0 !important; background: var(--cc-accent, #003794) !important; }' +
        '.cc-eqn-work { display: flex !important; flex: 1 1 auto !important; min-height: 0 !important; ' +
            'min-width: 0 !important; align-items: stretch !important; }' +
        '.cc-eqn-panes { display: flex !important; flex-direction: column !important; flex: 1 1 auto !important; ' +
            'min-width: 0 !important; min-height: 0 !important; }' +
        '.cc-eqn-predictor-off .cc-eqn-split, .cc-eqn-predictor-off .cc-eqn-predictor { display: none !important; }' +
        '.cc-eqn-split { flex: 0 0 auto !important; width: 9px !important; margin: 0 2px !important; ' +
            'cursor: col-resize !important; ' +
            'display: flex !important; align-items: center !important; justify-content: center !important; ' +
            'position: relative !important; ' +
            'background: transparent !important; touch-action: none !important; user-select: none !important; ' +
            'outline: none !important; }' +
        '.cc-eqn-split::before { content: "" !important; position: absolute !important; top: 0 !important; ' +
            'bottom: 0 !important; left: 4px !important; ' +
            'width: 1px !important; background: #d5dbe3 !important; }' +
        '.cc-eqn-split:hover::before, .cc-eqn-split:focus-visible::before, .cc-eqn-dragging .cc-eqn-split::before { ' +
            'left: 3px !important; width: 3px !important; background: var(--cc-accent, #003794) !important; }' +
        '.cc-eqn-split-fold { flex: 0 0 auto !important; position: relative !important; z-index: 1 !important; ' +
            'width: 16px !important; height: 34px !important; margin: 0 !important; padding: 0 !important; ' +
            'border: 1px solid #cbd5e0 !important; border-radius: 8px !important; background: #fff !important; ' +
            'color: #52606d !important; ' +
            'font: 14px/1 sans-serif !important; cursor: pointer !important; box-shadow: none !important; ' +
            'display: flex !important; align-items: center !important; justify-content: center !important; }' +
        '.cc-eqn-split-fold:hover { color: var(--cc-accent, #003794) !important; ' +
            'border-color: var(--cc-accent, #003794) !important; }' +
        // With contain: size, the list's length is no reason for the dialog to grow; the panel takes the
        // editing area's height (stretched, as a flex item) and scrolls within it. layout, as the API
        // has it, keeps its search box anchored to the panel.
        '.cc-eqn-predictor { flex: 0 0 auto !important; min-width: 0 !important; min-height: 0 !important; ' +
            'overflow: auto !important; box-sizing: border-box !important; contain: size layout !important; }' +
        '.cc-eqn-dragging, .cc-eqn-dragging * { cursor: col-resize !important; user-select: none !important; }' +
        // Below the editing area (cc-eqn-stacked): the same parts turned through a right angle.
        '.cc-eqn-stacked { flex-direction: column !important; }' +
        '.cc-eqn-stacked .cc-eqn-split { width: auto !important; height: 9px !important; margin: 2px 0 !important; ' +
            'cursor: row-resize !important; }' +
        '.cc-eqn-stacked .cc-eqn-split::before { top: 4px !important; bottom: auto !important; left: 0 !important; ' +
            'right: 0 !important; width: auto !important; height: 1px !important; }' +
        '.cc-eqn-stacked .cc-eqn-split:hover::before, .cc-eqn-stacked .cc-eqn-split:focus-visible::before, ' +
            '.cc-eqn-stacked.cc-eqn-dragging .cc-eqn-split::before { ' +
            'top: 3px !important; left: 0 !important; width: auto !important; height: 3px !important; }' +
        '.cc-eqn-stacked .cc-eqn-split-fold { width: 34px !important; height: 16px !important; }' +
        '.cc-eqn-stacked .cc-eqn-predictor { width: auto !important; }' +
        '.cc-eqn-stacked.cc-eqn-dragging, .cc-eqn-stacked.cc-eqn-dragging * { cursor: row-resize !important; }' +
        // The suggestions' maths set as the maths view's is: a host's reset (TinyMCE's .tox
        // :not(svg) { font-family: inherit; font-style: inherit }) outranks the API's .fxtex rules,
        // which left it in the dialog's sans-serif with its letters upright (the browser italicises
        // them through text-transform, which the reset takes too). Reverted to the browser's own
        // maths styling, as the maths view is, then the API's .fxtex rules re-asserted for the panel.
        '.cc-eqn-predictor math, .cc-eqn-predictor math * { font: revert-layer !important; ' +
            'text-transform: revert-layer !important; ' +
            'width: revert-layer !important; height: revert-layer !important; padding: revert-layer !important; ' +
            'margin: revert-layer !important; ' +
            'text-align: revert-layer !important; box-sizing: revert-layer !important; white-space: revert-layer !important; }';
    for (let i = 0; i < document.styleSheets.length; i++) {
        let rules;
        try {
            rules = document.styleSheets[i].cssRules;
        } catch (e) {
            continue;
        }
        for (let j = 0; j < rules.length; j++) {
            let r = rules[j];
            let decls = '';
            let sel = r.selectorText && r.selectorText.replace(/:where\(\.fxEditor\)\s*/g, '').trim();
            if (!sel || !/^\.fxtex\b/.test(sel) || sel.indexOf(',') > -1) {
                continue;
            }
            for (let k = 0; k < r.style.length; k++) {
                decls += r.style[k] + ':' + r.style.getPropertyValue(r.style[k]) + ' !important;';
            }
            if (decls) {
                style.textContent += '.cc-eqn-predictor ' + sel + '{' + decls + '}';
            }
        }
    }
    document.head.appendChild(style);
}

// Ready to type into, with its cursor showing: the MathView (or the LaTeX pane, when that is the
// one showing) takes focus as the dialog opens - otherwise focus stays on whatever opened it.
// The API draws the MathView's caret where the cursor is at that moment and only redraws it on an
// edit or on focus, but a dialog goes on settling after it opens (fonts arrive, the toolbar fits
// itself to its row) and moves the equation out from under it. Its focus handler only redraws
// (the cursor stays where it is), so it is fired again whenever the editing area changes size.
const focusEditor = (root) => {
    if (!root) {
        return;
    }
    const pane = root.querySelector(root.getAttribute('data-latex') === 'on' ? '.CCLatexInput' : '.CCMathView');
    if (pane) {
        pane.focus({preventScroll: true});
    }
    const view = root.querySelector('.CCMathView');
    const host = view && view.parentElement;
    if (host && !host.ccCaretWatch && typeof ResizeObserver !== 'undefined') {
        host.ccCaretWatch = new ResizeObserver(() => {
            const mv = host.querySelector('.CCMathView');
            if (mv && document.activeElement === mv) {
                mv.dispatchEvent(new FocusEvent('focus'));
            }
        });
        host.ccCaretWatch.observe(host);
    }
};

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
            if (!r.selectorText || !/(^|,)\s*(:where\(\.fxEditor\)\s*)?\.(fxtex|CCMathView)\b/.test(r.selectorText)) {
                continue;
            }
            let decls = '';
            for (const p of r.style) {
                decls += `${p}:${r.style.getPropertyValue(p)} !important;`;
            }
            if (decls) {
                out += r.selectorText.replace(/:where\(\.fxEditor\)\s*/g, '').split(',')
                    .map((s) => (/^\.CCMathView\b/.test(s.trim()) ? s.trim() : `.CCMathView ${s.trim()}`))
                    .join(',') + `{${decls}}`;
            }
        }
    }
    return out;
};

// The same for the MathView's drawn caret and the area it is positioned in: TinyMCE's skin
// (.tox :not(svg):not(rect) - position: static; width: auto; background) outranks the API's
// own rules, and left alone the caret had no size, colour or place - no cursor at all. Every
// declaration but display, which the API sets on the element itself to show and hide it.
const apiCaretRules = () => {
    let out = '';
    for (const sheet of document.styleSheets) {
        let rules;
        try {
            rules = sheet.cssRules;
        } catch (e) {
            continue;
        }
        for (const r of rules) {
            if (!r.selectorText || !/\.CCMathView(Caret|Wrap)\b/.test(r.selectorText)) {
                continue;
            }
            let decls = '';
            for (const p of r.style) {
                if (p !== 'display') {
                    decls += `${p}:${r.style.getPropertyValue(p)} !important;`;
                }
            }
            if (decls) {
                out += r.selectorText.replace(/:where\(\.fxEditor\)\s*/g, '') + `{${decls}}`;
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
    const woffUrl = fontUrl.replace(/prototypes\/latinmodern-math\.otf$/, 'fonts/LatinModernMath-Regular.woff2');
    style.textContent = `@font-face { font-family: "Latin Modern Math"; font-display: swap; ` +
        `src: local("Latin Modern Math"), url("${woffUrl}") format("woff2"), url("${fontUrl}") format("opentype"); }` +
        // Undo host resets (e.g. .cke_reset_all *) inside the toolbar icons and the maths view's MathML.
        '.CCToolbar svg:has(g[font-family]), .CCToolbar svg:has(g[font-family]) * { font: revert-layer !important; }' +
        // Icons drawn as <text>: the svg gets the API's own .cc_panel font (fxTeX Toolbar, 16px) back over host resets, and each
        // <text> its own font-size attribute (revert-layer lets attributes win).
        '.CCToolbar svg:not(:has(g[font-family])) { font: normal normal 16px "fxTeX Toolbar" !important; }' +
        '.CCToolbar svg:not(:has(g[font-family])) * { font: revert-layer !important; }' +
        '.CCToolbar svg, .CCToolbar svg * { width: revert-layer !important; height: revert-layer !important; ' +
            'max-width: revert-layer !important; }' +
        '.CCToolbar svg g[font-family="fxTeX Toolbar"] { color: #000 !important; }' +
        '.CCMathView math, .CCMathView math * { font: revert-layer !important; ' +
            'width: revert-layer !important; height: revert-layer !important; padding: revert-layer !important; ' +
            'margin: revert-layer !important; text-transform: revert-layer !important; text-align: revert-layer !important; ' +
            'box-sizing: revert-layer !important; white-space: revert-layer !important; }' +
        apiMathRules() + apiCaretRules() +
        '.CCEqnEditor { display: flex !important; flex-direction: column !important; height: 520px !important; }' +
        '.CCEqnEditor .CCEditorBar, .CCEqnEditor .CCToolbarHost { flex: 0 0 auto; }' +
        // The toolbar host as wide as the dialog, no wider: sized to its own content instead
        // (width: auto) it kept the toolbar's whole row and ran past a narrow dialog
        // (`design.width`); at 100% the toolbar scrolls.
        '.CCEqnEditor .CCToolbarHost { align-self: flex-start; width: 100%; }' +
        '.CCEqnEditor .CCMathViewHost { flex: 1 1 auto; min-height: 0; display: flex; align-items: center; ' +
            'justify-content: center; overflow: auto; }' +
        '.CCEqnEditor[data-inline="on"] .CCMathViewHost { justify-content: flex-start; }' +
        '.CCEqnEditor[data-latex="on"] .CCMathViewHost { display: none !important; }' +
        '.CCEqnEditor .CCLatexInput { flex: 1 1 auto; min-height: 0; overflow: auto; }' +
        '.CCEqnEditor[data-latex="off"] .CCLatexInput { display: none !important; }' +
        '.CCEqnEditor .CCEqnOutput-hidden { display: none !important; }' +
        // The bottom bar: toggles left, Insert-as and the dialog's buttons right, one type size. All !important - host dialog
        // resets otherwise restyle it.
        '.cc-eqn-bar { display: flex !important; flex-wrap: wrap !important; align-items: center !important; ' +
            'gap: 16px !important; flex: 0 0 auto !important; ' +
            'margin: 8px 0 0 !important; padding: 10px 0 0 !important; border: 0 !important; ' +
            'border-top: 1px solid #e2e8f0 !important; ' +
            'background: none !important; font: 13px/1.3 system-ui, -apple-system, "Segoe UI", Arial, sans-serif !important; ' +
            'color: #1c2530 !important; }' +
        '.cc-eqn-bar-right { display: flex !important; align-items: center !important; gap: 8px !important; ' +
            'margin: 0 0 0 auto !important; padding: 0 !important; font: inherit !important; color: inherit !important; }' +
        '.cc-eqn-bar .cc-switch { display: inline-flex !important; align-items: center !important; gap: 6px !important; ' +
            'margin: 0 !important; ' +
            'padding: 0 !important; font: inherit !important; color: #54647c !important; cursor: pointer !important; ' +
            'user-select: none !important; white-space: nowrap !important; }' +
        '.cc-eqn-bar .cc-switch input { position: absolute !important; width: 1px !important; height: 1px !important; ' +
            'margin: -1px !important; ' +
            'padding: 0 !important; border: 0 !important; overflow: hidden !important; clip: rect(0, 0, 0, 0) !important; ' +
            'opacity: 0 !important; }' +
        '.cc-eqn-bar .cc-switch-track { position: relative !important; display: inline-block !important; ' +
            'flex: 0 0 auto !important; width: 28px !important; ' +
            'height: 16px !important; margin: 0 !important; padding: 0 !important; border: 0 !important; ' +
            'border-radius: 8px !important; ' +
            'background: #ccc !important; transition: background .2s !important; }' +
        '.cc-eqn-bar .cc-switch-knob { position: absolute !important; display: block !important; top: 2px !important; ' +
            'left: 2px !important; ' +
            'width: 12px !important; height: 12px !important; margin: 0 !important; border-radius: 50% !important; ' +
            'background: #fff !important; transition: left .2s !important; }' +
        '.cc-eqn-bar .cc-switch input:checked + .cc-switch-track { background: #4caf50 !important; }' +
        '.cc-eqn-bar .cc-switch input:checked + .cc-switch-track .cc-switch-knob { left: 14px !important; }' +
        '.cc-eqn-bar .cc-switch input:focus-visible + .cc-switch-track { outline: 2px solid #003794 !important; ' +
            'outline-offset: 2px !important; }' +
        '.cc-eqn-bar .cc-switch input:disabled ~ * { opacity: .5 !important; cursor: default !important; }' +
        '.cc-eqn-bar .cc-switch-label { font: inherit !important; color: inherit !important; }' +
        '.cc-eqn-bar .cc-switch input:checked ~ .cc-switch-label { color: #003794 !important; font-weight: 600 !important; }' +
        '.cc-eqn-bar .cc-eqn-select { width: auto !important; height: 30px !important; margin: 0 !important; ' +
            'padding: 0 8px !important; ' +
            'border: 1px solid #cbd5e0 !important; border-radius: 4px !important; background: #fff !important; ' +
            'font: inherit !important; color: #1c2530 !important; cursor: pointer !important; }' +
        '.cc-eqn-bar .cc-eqn-btn { display: inline-flex !important; align-items: center !important; height: 30px !important; ' +
            'margin: 0 !important; ' +
            'padding: 0 16px !important; border: 1px solid #cbd5e0 !important; border-radius: 4px !important; ' +
            'background: #fff !important; ' +
            'font: inherit !important; color: #1c2530 !important; cursor: pointer !important; box-shadow: none !important; }' +
        '.cc-eqn-bar .cc-eqn-btn * { font: inherit !important; color: inherit !important; }' +
        '.cc-eqn-bar .cc-eqn-btn.cc-eqn-primary { background: #2c7a4b !important; border-color: #2c7a4b !important; ' +
            'color: #fff !important; }' +
        '.tox-dialog:has(.CCEqnEditor) { width: 850px !important; max-width: 96vw !important; height: auto !important; }' +
        // TinyMCE caps a dialog's body at 650px and scrolls the rest - a design taller than that has to be let through.
        '.tox-dialog:has(.CCEqnEditor) .tox-dialog__body-content { max-height: calc(100vh - 110px) !important; }';
    document.head.appendChild(style);
};

const switchHtml = (id, label, title) => `
    <label class="cc-switch" title="${escapeHtml(title)}">
        <input type="checkbox" id="${id}">
        <span class="cc-switch-track"><span class="cc-switch-knob"></span></span>
        <span class="cc-switch-label">${escapeHtml(label)}</span>
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
        size: `cc-eqn-mdl-size-${n}`,
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
    // fxtex.css styles inserted MathML. The dialog lives on the outer page, where fxTeX Pro
    // (loaded by EqEditor.init() when the dialog first opens) adds the same rules itself as
    // <style id="fxtex-style">, so that page is not given a second copy. The MathML is shown in
    // the content iframe, a separate document that stylesheet never reaches: this goes there.
    // contentCSS is read when the iframe is built, after plugins have run.
    editor.contentCSS.push(`${origin}/fxtex.css`);

    let eqOutput = null;
    let eqTextArea = null;
    let eqMathView = null;
    let eqToolbar = null;

    const option = (value, label) =>
        `<option value="${value}"${value === defaultMode ? ' selected' : ''}>${escapeHtml(label)}</option>`;

    const sizeHtml = () => (design.sizeControl
        ? `<select class="cc-eqn-select" id="${ids.size}" title="${escapeHtml(str.size_title)}">` +
            `${sizeOptions()}</select>`
        : '');

    const panelHtml = () => `
        <div id="${ids.root}" class="CCEqnEditor" data-latex="off" data-inline="off">
            <div class="CCEditorBar"><div id="${ids.history}" class="CCHistory"></div></div>
            <div id="${ids.toolbar}" class="CCToolbarHost"></div>
            <div id="${ids.mathview}" class="CCMathViewHost"></div>
            <div id="${ids.latexInput}" class="CCLatexInput" autocorrect="off"
                placeholder="${escapeHtml(str.latex_placeholder)}"></div>
            <img id="${ids.output}" class="CCEqnOutput-hidden" alt="">
            <div class="cc-eqn-bar">
                ${switchHtml(ids.toggleInline, str.inline, str.inline_title)}
                ${switchHtml(ids.toggleLatex, str.latex, str.latex_title)}
                <div class="cc-eqn-bar-right">
                    ${sizeHtml()}
                    <select class="cc-eqn-select" id="${ids.insertMode}" title="${escapeHtml(str.insertas_menu)}">
                        ${option('mathml', str.insert_mathml)}
                        ${option('svg', str.insert_svg)}
                        ${option('latex', str.insert_latex)}
                    </select>
                    <button type="button" class="cc-eqn-btn cc-cancel">${escapeHtml(str.cancel)}</button>
                    <button type="button" class="cc-eqn-btn cc-eqn-primary cc-ok">${escapeHtml(str.ok)}</button>
                </div>
            </div>
        </div>`;

    const mount = () => {
        eqOutput = new window.EqEditor.Output(ids.output);
        eqOutput.setRenderURL(renderUrl);

        eqTextArea = window.EqEditor.TextArea.link(ids.latexInput)
            .addOutput(eqOutput)
            .addHistoryMenu(new window.EqEditor.History(ids.history));

        eqToolbar = window.EqEditor.Toolbar.link(ids.toolbar, design.toolbar || 'default', design.toolbarScale || 1)
            .addTextArea(eqTextArea);

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

        addEditorControls(root, design, {
            textArea: eqTextArea,
            mathView: eqMathView,
            output: eqOutput,
            latexToggle: document.getElementById(ids.toggleLatex),
            inlineToggle: document.getElementById(ids.toggleInline),
            insertSelect: document.getElementById(ids.insertMode),
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
            // The referrerpolicy is explicit: the rendering service identifies the calling site by
            // referer, and a stricter page policy would otherwise send none.
            const size = sizeImage(eqOutput, (mark, got) => {
                const img = editor.dom.select(`img[data-cc-size="${mark}"]`)[0];
                if (!img) {
                    return;
                }
                if (got) {
                    editor.dom.setStyles(img, {width: got.width, height: got.height});
                }
                editor.dom.setAttrib(img, 'data-cc-size', null);
            });
            const src = escapeHtml(outputCode(eqOutput, 'url'));
            return `<img class="fxtex" src="${src}" alt="${escapeHtml(latex)}" referrerpolicy="origin"${size}>`;
        }
        return bareMath(outputCode(eqOutput, 'mathml'));
    };

    // The whole equation an element on the page belongs to: for MathML, Moodle's own non-editable
    // tiny-math-block or tiny-math-span round the <math> (see bareMath()), and the span with the spoken
    // text that earlier versions of this plugin put round that.
    const equationOf = (el) => {
        let node = el;
        if (!node || node.nodeName.toLowerCase() !== 'math') {
            return node;
        }
        if (node.parentNode && /^tiny-math-(span|block)$/i.test(node.parentNode.nodeName)) {
            node = node.parentNode;
        }
        const wrapper = node.parentNode;
        if (wrapper && wrapper.nodeName.toLowerCase() === 'span' && editor.dom.hasClass(wrapper, 'cc-math')) {
            node = wrapper;
        }
        return node;
    };

    // Puts the equation in at the caret, or in place of `el`, the equation being edited - all of it,
    // as one undo step. Left to the caret, an edited MathML equation went inside the old <math>,
    // where the double-click had put it, and TinyMCE dropped it, so the edit was lost; selecting the
    // old equation instead is no help, as the insert narrows a selection to the text inside it. So
    // the old one is taken out first, and the new one goes where it was.
    const insertEquation = (html, el) => {
        const target = equationOf(el);
        if (!target || !editor.getBody().contains(target)) {
            editor.execCommand('mceInsertContent', false, html);
            return;
        }
        // Focused first: taking focus back from the dialog restores the caret TinyMCE saved.
        editor.focus();
        editor.undoManager.transact(() => {
            const parent = target.parentNode;
            const index = editor.dom.nodeIndex(target);
            editor.dom.remove(target);
            const rng = editor.dom.createRng();
            rng.setStart(parent, index);
            rng.collapse(true);
            editor.selection.setRng(rng);
            editor.execCommand('mceInsertContent', false, html);
        });
    };

    // `el`, when editing: the equation on the page, whose size the dialog starts from and which OK
    // replaces. `format` ('svg' or 'mathml'): what it was inserted as, which the dialog starts with,
    // so an edited equation goes back in the form it came out of.
    const showDialog = async(latex = '', el = null, format = '') => {
        const dialogTitle = await getString('dialogtitle', component);
        let startSize = 1;

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
                if (eqOutput.setScale || eqOutput.setEquationSize) {
                    const sizeSelect = document.getElementById(ids.size);
                    const scale = sizeSelect ? Number(sizeSelect.value) / 100 : startSize;
                    (eqOutput.setScale || eqOutput.setEquationSize).call(eqOutput, scale);
                }
                insertEquation(buildInsert(current), el);
                eqTextArea.pushToHistory();
            }
            dialog.close();
        };

        // The editor is rebuilt on every open: TinyMCE destroys a dialog's DOM when it closes,
        // so anything held over from the previous open would point at detached nodes.
        apiReady.then(() => ensureInit(getLicence(editor))).then(() => {
            injectStyleOverridesOnce(cssUrl.slice(0, cssUrl.lastIndexOf('/') + 1) + 'prototypes/latinmodern-math.otf');
            mount();
            const insertMode = document.getElementById(ids.insertMode);
            if (format && insertMode.querySelector('option[value="' + format + '"]')) {
                insertMode.value = format;
            }
            startSize = sizeOf(el);
            showSize(document.getElementById(ids.size), startSize);
            eqTextArea.clear();
            if (latex) {
                eqTextArea.insert(latex, latex.length);
            }
            eqTextArea.notifyOutputs();
            focusEditor(document.getElementById(ids.root));

            const root = document.getElementById(ids.root);
            root.querySelector('.cc-cancel').addEventListener('click', () => dialog.close());
            root.querySelector('.cc-ok').addEventListener('click', insertAndClose);
            return;
        }).catch((err) => {
            Log.error(err);
            dialog.close();
            editor.notificationManager.open({text: str.loaderror, type: 'error'});
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

        // TinyMCE does not count <math> as content, so a paragraph holding nothing but an
        // equation - which is how a display equation is inserted - was judged empty and cleared
        // when the content was serialised: the editor still showed the equation, but the saved
        // text had an empty paragraph in its place.
        const nonEmpty = editor.schema.getNonEmptyElements();
        nonEmpty.math = nonEmpty.MATH = {};

        // Calling addValidElements('img[referrerpolicy]') would *replace* img's existing rule and drop
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
                showDialog(decodeEquation(match[2]), target, 'svg');
            }
            return;
        }

        const math = target.closest && target.closest('math[title]');
        if (math) {
            const mathLatex = math.getAttribute('title').trim();
            if (mathLatex) {
                showDialog(mathLatex, math, 'mathml');
            }
        }
    });

    return showDialog;
};

/**
 * MathML as Moodle's editor keeps it. The converter puts the <math> in a span that carries the
 * spoken text, but Moodle's own MathML support (editor_tiny/content.js, in Moodle 4.5 and later)
 * makes <math> a block of its own - kept in a non-editable tiny-math-block, or a tiny-math-span when
 * its style says display: inline - and strips one found inside a span, so the equation was lost. So
 * the <math> goes in alone, with the spoken text on it, and an inline equation styled inline.
 *
 * @param {string} html The MathML, as the converter writes it
 * @returns {string}
 */
const bareMath = (html) => {
    const box = document.createElement('div');
    box.innerHTML = html;
    const math = box.querySelector('math');
    if (!math) {
        return html;
    }
    const wrapper = math.parentElement !== box ? math.parentElement : null;
    const label = wrapper && wrapper.getAttribute('aria-label');
    if (label) {
        math.setAttribute('aria-label', label);
    }
    math.removeAttribute('aria-hidden');
    if (math.getAttribute('display') !== 'block') {
        const style = (math.getAttribute('style') || '').replace(/;?\s*$/, '');
        math.setAttribute('style', (style ? style + '; ' : '') + 'display: inline');
    }
    return math.outerHTML;
};

/**
 * Fetches the button's and menu item's strings and icon, then returns the function that
 * registers them - called once per editor instance from plugin.js, inside
 * tinyMCE.PluginManager.add().
 *
 * @returns {Promise<function(object): void>}
 */
export const getSetup = async() => {
    const [buttonText, menuItemText, buttonImage, dialogStrings] = await Promise.all([
        getString('button_eqneditor', component),
        getString('menuitem_eqneditor', component),
        getButtonImage('eqneditor', component),
        getStrings(STRING_KEYS.map((key) => ({key, component}))),
    ]);
    str = Object.fromEntries(STRING_KEYS.map((key, i) => [key, dialogStrings[i]]));

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
