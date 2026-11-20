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
 * @copyright   2026 CodeCogs, Zyba Ltd. <https://www.codecogs.com>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

$string['button_eqneditor'] = 'Equation';
$string['cancel'] = 'Cancel';
$string['design'] = 'Design';
$string['design_desc'] = 'How the equation editor looks - its toolbar, colour and sizes - as JSON. Build one at https://fxplugins.codecogs.com/docs/moodle.html and paste it here. Leave empty for the standard design.';
$string['dialogtitle'] = 'Equation editor';
$string['inline'] = 'Inline';
$string['inline_title'] = 'Left-align the equation instead of centring it';
$string['insert_latex'] = 'Insert LaTeX';
$string['insert_mathml'] = 'Insert MathML';
$string['insert_svg'] = 'Insert SVG';
$string['insertas'] = 'Insert as';
$string['insertas_desc'] = 'The starting choice in the dialog\'s "Insert as" menu, which authors can change for each equation. See the plugin README for the trade-offs between the three forms.';
$string['insertas_latex'] = 'LaTeX text (tiny and editable by hand, but needs a maths filter to display it: the fxTeX maths filter, which also draws chemical structures and pictures, or MathJax)';
$string['insertas_mathml'] = 'MathML (final markup, nothing to fetch, needs one stylesheet on the page that displays it)';
$string['insertas_menu'] = 'How to insert the equation';
$string['insertas_url'] = 'Image (smallest markup, works everywhere, requires the rendering service to be reachable when the content is viewed)';
$string['latex'] = 'LaTeX';
$string['latex_placeholder'] = 'Write LaTeX here...';
$string['latex_title'] = 'Show or hide the LaTeX markup';
$string['latexresize'] = 'Resize the LaTeX markup';
$string['latexresize_title'] = 'Drag to share the space between the LaTeX and the equation';
$string['licence'] = 'Licence key';
$string['licence_desc'] = 'Your fxTeX Pro licence key (fx_pk_...). Get a 30-day trial key, or buy one, for this site\'s domain from https://fxeditor.codecogs.com/purchase. The key is not secret - it is sent to every browser that opens the editor - and only works on the domains it was issued for.';
$string['loaderror'] = 'The CodeCogs Equation Editor could not be loaded.';
$string['menuitem_eqneditor'] = 'Equation...';
$string['ok'] = 'OK';
$string['pluginname'] = 'CodeCogs Equation Editor';
$string['predictor'] = 'Predictor';
$string['predictor_title'] = 'Suggested equations, as you write';
$string['predictorhide'] = 'Hide suggested equations';
$string['predictorpanel'] = 'Suggested equations';
$string['predictorresize'] = 'Resize the suggested equations';
$string['privacy:metadata:fxtex'] = 'Everything the plugin uses is served by fxtex.codecogs.com, run by CodeCogs: the equation editor and its fxTeX Pro typesetting engine, loaded into the author\'s browser each time the editor opens, and the equations inserted as images, which every browser that displays them fetches from there. The plugin sends nothing there itself; the browser does. Each time the editor opens, fxTeX Pro validates the site\'s licence key, and each image drawn is recorded as use against the site\'s licence.';
$string['privacy:metadata:fxtex:licence'] = 'The site\'s fxTeX Pro licence key, which identifies the Moodle site, not the user.';
$string['privacy:metadata:fxtex:pageurl'] = 'The address of the Moodle page the editor is opened on, which the browser sends as the referrer and which is used to check that the licence key is valid for the site.';
$string['privacy:metadata:fxtex:equation'] = 'The LaTeX of each equation inserted as an image, which the image\'s address carries.';
$string['privacy:metadata:fxtex:usage'] = 'Each opening of the editor and each image drawn, recorded against the site\'s licence.';
$string['renderurl'] = 'Rendering service URL';
$string['renderurl_desc'] = 'The service that turns an equation into an image, used when "Insert as" is set to Image.';
$string['server'] = 'Equation editor URL';
$string['server_desc'] = 'Where the equation editor\'s own code is loaded from. Change this only if you are running your own copy - see the fxEditor deployment guide.';
$string['size_title'] = 'This equation\'s size, against a normal one';
$string['toolbarsize'] = 'Toolbar size';
$string['toolbarsize_title'] = 'The toolbar\'s size';
