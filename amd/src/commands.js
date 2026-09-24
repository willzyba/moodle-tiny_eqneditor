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
 * This is the same EqEditor loading/mounting logic as tinymce/v6/eqneditor.js in the
 * top-level eqneditor-v5-plugins repo - Moodle 4.1+'s own editor *is* TinyMCE 6, so the
 * dialog code is identical; only how configuration is read (options.js, via Moodle's
 * per-context plugin configuration, rather than editor.getParam()) and how the plugin
 * registers itself (Moodle's Tiny plugin API, rather than tinymce.PluginManager.add() called
 * directly) differ. Keep the two in step by hand until there is a shared package worth
 * factoring them into.
 *
 * @module      tiny_eqneditor/commands
 * @copyright   2026 CodeCogs <https://www.codecogs.com>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {getButtonImage} from 'editor_tiny/utils';
import {getString} from 'core/str';
import {component, buttonName, menuItemName, icon} from './common';
import {getServer, getRenderUrl, getInsertAs, getShowLatex} from './options';

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
// once eqneditor.api.min.js itself has loaded. Called once per page; an empty licence is the
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

// Remembers which view (maths or LaTeX markup) the author last chose, across dialog opens and
// page loads - a cookie rather than localStorage because it is one line to read without a
// helper, and every editor instance on the page shares the one preference. Every adapter in
// eqneditor-v5-plugins uses this exact cookie name, so the choice carries across editors too.
const LATEX_COOKIE = 'cc_eqneditor_show_latex';

const getShowLatexPreference = (fallback) => {
    const match = document.cookie.match(/(?:^|; )cc_eqneditor_show_latex=([^;]*)/);
    return match ? match[1] === '1' : fallback;
};

const setShowLatexPreference = (visible) => {
    document.cookie = `${LATEX_COOKIE}=${visible ? '1' : '0'}; path=/; max-age=31536000; SameSite=Lax`;
};

// Roughly 50% taller than the shared eqneditor.css's own default for either view, so the
// maths view in particular reads as the main event rather than a strip above the toolbar.
// !important, and injected once here rather than relying on load order against eqneditor.css
// (loaded separately, asynchronously, from the site's configured host): which stylesheet's
// rule wins would otherwise depend on which finishes loading last.
// The API's own injected @font-face for "Latin Modern Math" (the face MathView and every
// rendered equation use) only carries local("Latin Modern Math") - no url() fallback - so it
// silently falls back to a generic serif unless that exact font happens to be installed. A
// later @font-face for the same family replaces the API's src list rather than merging with
// it, so redeclaring it here with a real url() fixes every equation and symbol on the page.
const injectSizeOverrideOnce = (fontUrl) => {
    if (document.getElementById('cc-eqneditor-size-override')) {
        return;
    }
    const style = document.createElement('style');
    style.id = 'cc-eqneditor-size-override';
    style.textContent = `@font-face { font-family: "Latin Modern Math"; font-display: swap; ` +
        `src: local("Latin Modern Math"), url("${fontUrl}") format("opentype"); }` +
        // Undo host resets (e.g. .cke_reset_all *) inside the toolbar icons and the maths view's MathML.
        '.CCToolbar svg, .CCToolbar svg * { font: revert-layer !important; }' +
        '.CCToolbar svg * { width: revert-layer !important; height: revert-layer !important; }' +
        '.CCToolbar svg g[font-family="fxTeX Toolbar"] { color: #000 !important; }' +
        '.CCMathView math, .CCMathView math * { font: revert-layer !important; ' +
            'width: revert-layer !important; height: revert-layer !important; padding: revert-layer !important; ' +
            'margin: revert-layer !important; text-transform: revert-layer !important; text-align: revert-layer !important; ' +
            'box-sizing: revert-layer !important; white-space: revert-layer !important; }' +
        apiMathRules() +
        '.CCMathViewHost, .CCLatexInput { min-height: 220px !important; }';
    document.head.appendChild(style);
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
            if (!r.selectorText || !/(^|,)\s*\.(fxtex|CCMathView)\b/.test(r.selectorText)) {
                continue;
            }
            let decls = '';
            for (const p of r.style) {
                decls += `${p}:${r.style.getPropertyValue(p)} !important;`;
            }
            if (decls) {
                out += r.selectorText.split(',').map((s) => (/^\.CCMathView\b/.test(s.trim()) ? s.trim() : `.CCMathView ${s.trim()}`)).join(',') + `{${decls}}`;
            }
        }
    }
    return out;
};

let instanceCount = 0;

const setupEditor = (editor) => {
    const n = ++instanceCount;
    const ids = {
        root: `cc-eqn-mdl-${n}`,
        history: `cc-eqn-mdl-history-${n}`,
        toolbar: `cc-eqn-mdl-toolbar-${n}`,
        mathview: `cc-eqn-mdl-mathview-${n}`,
        latexInput: `cc-eqn-mdl-latex-${n}`,
        preview: `cc-eqn-mdl-preview-${n}`,
        output: `cc-eqn-mdl-output-${n}`,
        toggle: `cc-eqn-mdl-toggle-${n}`,
    };

    const host = getServer(editor);
    const renderUrl = getRenderUrl(editor);
    const insertAs = getInsertAs(editor);
    // The maths view is the default and, by far, the more common thing to want on screen -
    // the LaTeX markup view is the opt-in. A returning author's last choice (the cookie) wins
    // over the site's own configured default, which in turn wins over false.
    let showLatex = getShowLatexPreference(getShowLatex(editor));
    const scriptUrl = `https://${host}/eqneditor.api.min.js`;
    const cssUrl = `https://${host}/eqneditor.css`;
    const mathmlCssUrl = `https://${host}/fxtex.css`;

    const apiReady = loadEqEditorApi(scriptUrl);
    loadCssOnce(cssUrl);
    if (insertAs === 'mathml') {
        loadCssOnce(mathmlCssUrl);
    }

    let eqOutput = null;
    let eqTextArea = null;
    let eqMathView = null;
    let eqToolbar = null;

    const panelHtml = () => `
        <div id="${ids.root}" class="CCEqnEditor" data-latex="${showLatex ? 'on' : 'off'}">
            <div class="CCEditorBar"><div id="${ids.history}" class="CCHistory"></div></div>
            <div id="${ids.toolbar}"></div>
            <div id="${ids.latexInput}" class="CCLatexInput" autocorrect="off" placeholder="Write LaTeX here..."></div>
            <div id="${ids.mathview}" class="CCMathViewHost"></div>
            <div id="${ids.toggle}" class="CCViewToggle">
                <label class="cc-switch" title="Show or hide the LaTeX markup above the equation">
                    <input type="checkbox" data-latex-toggle${showLatex ? ' checked' : ''}>
                    <span class="cc-switch-track"><span class="cc-switch-knob"></span></span>
                    <span class="cc-switch-label">LaTeX markup</span>
                </label>
            </div>
            <div id="${ids.preview}" class="CCEqnOutput"><img id="${ids.output}" alt=""></div>
        </div>`;

    const applyLatexVisible = (visible) => {
        showLatex = visible;
        setShowLatexPreference(visible);

        const root = document.getElementById(ids.root);
        if (root) {
            root.setAttribute('data-latex', visible ? 'on' : 'off');
        }

        const box = document.querySelector(`#${ids.toggle} input[data-latex-toggle]`);
        if (box) {
            box.checked = visible;
        }

        // Hiding the markup has to move the toolbar's target back to the maths view,
        // otherwise a button pressed straight afterwards inserts into a hidden pane.
        if (eqToolbar && !visible) {
            eqToolbar.setActiveTextArea(eqMathView || eqTextArea);
        }
    };

    const mount = () => {
        eqOutput = new window.EqEditor.Output(ids.output);
        eqOutput.setRenderURL(renderUrl);

        eqTextArea = window.EqEditor.TextArea.link(ids.latexInput)
            .addOutput(eqOutput)
            .addHistoryMenu(new window.EqEditor.History(ids.history));

        eqToolbar = window.EqEditor.Toolbar.link(ids.toolbar).addTextArea(eqTextArea);

        if (typeof window.EqEditor.MathView !== 'undefined') {
            eqMathView = window.EqEditor.MathView.link(ids.mathview).addTextArea(eqTextArea);
            eqToolbar.addMathView(eqMathView);
        } else {
            // Without a maths view the markup is the only thing to edit in, so it cannot be
            // hidden however the site configured it.
            showLatex = true;
        }

        applyLatexVisible(showLatex);

        const toggle = document.getElementById(ids.toggle);
        if (toggle) {
            toggle.addEventListener('change', (e) => {
                if (e.target.matches('input[data-latex-toggle]')) {
                    applyLatexVisible(e.target.checked);
                }
            });
        }
    };

    const buildInsert = (latex) => {
        if (insertAs === 'latex') {
            const fence = '$$';
            return escapeHtml(fence + latex + fence);
        }
        if (insertAs === 'mathml') {
            const markup = eqOutput.exportAs('mathmlspeech');
            if (markup) {
                return markup;
            }
        }
        return `<img src="${escapeHtml(eqOutput.exportAs('url'))}" alt="${escapeHtml(latex)}">`;
    };

    const showDialog = async(latex = '') => {
        const dialogTitle = await getString('dialogtitle', component);

        const dialog = editor.windowManager.open({
            title: dialogTitle,
            size: 'large',
            body: {
                type: 'panel',
                items: [{type: 'htmlpanel', html: panelHtml()}],
            },
            buttons: [
                {type: 'cancel', name: 'closeButton', text: 'Cancel'},
                {type: 'submit', name: 'submitButton', text: 'Ok', buttonType: 'primary'},
            ],
            onSubmit: (api) => {
                const current = eqTextArea ? eqTextArea.getTextArea().textContent.trim() : '';
                if (current) {
                    editor.execCommand('mceInsertContent', false, buildInsert(current));
                    eqTextArea.pushToHistory();
                }
                api.close();
            },
            onCancel: (api) => api.close(),
            onClose: () => {
                if (eqTextArea) {
                    eqTextArea.close();
                }
            },
        });

        apiReady.then(() => ensureInit('')).then(() => {
            injectSizeOverrideOnce(cssUrl.slice(0, cssUrl.lastIndexOf('/') + 1) + 'prototypes/latinmodern-math.otf');
            mount();
            eqTextArea.clear();
            if (latex) {
                eqTextArea.insert(latex, latex.length);
            }
            eqTextArea.notifyOutputs();
        }).catch((err) => {
            // eslint-disable-next-line no-console
            console.error(err);
            dialog.close();
            editor.notificationManager.open({text: 'The CodeCogs Equation Editor could not be loaded.', type: 'error'});
        });
    };

    // Double-click an equation to edit it again - same recognition rules as the other
    // eqneditor-v5-plugins adapters: an equation carries the LaTeX it was written from, in
    // an image's rendering URL or a <math> element's title.
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
