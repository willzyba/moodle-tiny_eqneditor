<?php
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
 * English language strings for tiny_eqneditor.
 *
 * @package     tiny_eqneditor
 * @copyright   2026 CodeCogs <https://www.codecogs.com>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

$string['button_eqneditor'] = 'Equation';
$string['cancel'] = 'Cancel';
$string['design'] = 'Design';
$string['design_desc'] = 'How the equation editor looks - its toolbar, colour and sizes - as JSON. Build one at https://fxplugins.codecogs.com/docs/moodle.html and paste it here. Leave empty for the standard design.';
$string['dialogtitle'] = 'Equation editor';
$string['inline'] = 'Inline';
$string['inline_title'] = 'Left-align the equation instead of centring it';
$string['insert_latex'] = 'Insert LaTeX (MathJax)';
$string['insert_mathml'] = 'Insert MathML';
$string['insert_svg'] = 'Insert SVG';
$string['insertas'] = 'Insert as';
$string['insertas_desc'] = 'The starting choice in the dialog\'s "Insert as" menu, which authors can change for each equation. See the plugin README for the trade-offs between the three forms.';
$string['insertas_latex'] = 'LaTeX text (tiny and editable by hand, but needs fxTeX, KaTeX or MathJax on the page that displays it)';
$string['insertas_mathml'] = 'MathML (final markup, nothing to fetch, needs one stylesheet on the page that displays it)';
$string['insertas_menu'] = 'How to insert the equation';
$string['insertas_url'] = 'Image (smallest markup, works everywhere, requires the rendering service to be reachable when the content is viewed)';
$string['latex'] = 'LaTeX';
$string['latex_placeholder'] = 'Write LaTeX here...';
$string['latex_title'] = 'Show or hide the LaTeX markup';
$string['latexresize'] = 'Resize the LaTeX markup';
$string['latexresize_title'] = 'Drag to share the space between the LaTeX and the equation';
$string['licence'] = 'Licence key';
$string['licence_desc'] = 'Your fxTeX Pro licence key (fx_pk_...), from your account at editor.codecogs.com. It is public - it is sent to every browser that opens the editor - and only works on the domains it was issued for.';
$string['loaderror'] = 'The CodeCogs Equation Editor could not be loaded.';
$string['menuitem_eqneditor'] = 'Equation...';
$string['ok'] = 'OK';
$string['pluginname'] = 'CodeCogs Equation Editor';
$string['predictor'] = 'Predictor';
$string['predictor_title'] = 'Suggested equations, as you write';
$string['predictorhide'] = 'Hide suggested equations';
$string['predictorpanel'] = 'Suggested equations';
$string['predictorresize'] = 'Resize the suggested equations';
$string['privacy:metadata:fxtex'] = 'The equation editor and its fxTeX Pro typesetting engine are loaded into the author\'s browser from the Equation editor host (by default fxtex.codecogs.com, run by CodeCogs). The plugin sends nothing there itself; the browser fetches the files, and fxTeX Pro checks the site\'s licence key and reports usage against it.';
$string['privacy:metadata:fxtex:licence'] = 'The site\'s fxTeX Pro licence key, which identifies the Moodle site, not the user.';
$string['privacy:metadata:fxtex:pageurl'] = 'The address of the Moodle page the editor is opened on, which the browser sends as the referrer and which is used to check that the licence key is valid for the site.';
$string['privacy:metadata:fxtex:usage'] = 'Counts of the editor being used under the licence key.';
$string['privacy:metadata:render'] = 'Equations inserted as images are drawn by the rendering service (by default latex.codecogs.com, run by CodeCogs): each image\'s address carries its equation, and every browser that displays the image fetches it from there.';
$string['privacy:metadata:render:equation'] = 'The LaTeX of the equation being drawn.';
$string['privacy:metadata:render:siteurl'] = 'The address of the Moodle site displaying the equation (its origin only, without the page), sent as the referrer.';
$string['renderurl'] = 'Rendering service URL';
$string['renderurl_desc'] = 'The service that turns an equation into an image, used when "Insert as" is set to Image.';
$string['server'] = 'Equation editor host';
$string['server_desc'] = 'Where the equation editor\'s own code is loaded from. Change this only if you are running your own copy - see the fxEditor deployment guide.';
$string['size_title'] = 'This equation\'s size, against a normal one';
$string['toolbarsize'] = 'Toolbar size';
$string['toolbarsize_title'] = 'The toolbar\'s size';
