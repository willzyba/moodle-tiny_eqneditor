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

defined('MOODLE_INTERNAL') || die();

$string['pluginname'] = 'CodeCogs Equation Editor';
$string['privacy:metadata'] = 'The CodeCogs Equation Editor plugin does not store any personal data. Equations are embedded directly into the content the user is already editing.';

$string['button_eqneditor'] = 'Equation';
$string['menuitem_eqneditor'] = 'Equation...';
$string['dialogtitle'] = 'Equation Editor';

$string['server'] = 'Equation Editor host';
$string['server_desc'] = 'Where the Equation Editor\'s own code is loaded from. Change this only if you are running your own copy - see the fxEditor deployment guide.';
$string['licence'] = 'Licence key';
$string['licence_desc'] = 'Your fxTeX Pro licence key (fx_pk_...), from your account at editor.codecogs.com. It is public - it is sent to every browser that opens the editor - and only works on the domains it was issued for.';
$string['renderurl'] = 'Rendering service URL';
$string['renderurl_desc'] = 'The service that turns an equation into an image, used when "Insert as" is set to Image.';
$string['insertas'] = 'Insert as';
$string['insertas_desc'] = 'The starting choice in the dialog\'s "Insert as" menu, which authors can change for each equation. See the plugin README for the trade-offs between the three forms.';
$string['insertas_url'] = 'Image (smallest markup, works everywhere, requires the rendering service to be reachable when the content is viewed)';
$string['insertas_latex'] = 'LaTeX text (tiny and editable by hand, but needs fxTeX, KaTeX or MathJax on the page that displays it)';
$string['design'] = 'Design';
$string['design_desc'] = 'How the equation editor looks - its toolbar, colour and sizes - as JSON. Build one at https://fxplugins.codecogs.com/docs/moodle.html and paste it here. Leave empty for the standard design.';
$string['insertas_mathml'] = 'MathML (final markup, nothing to fetch, needs one stylesheet on the page that displays it)';
