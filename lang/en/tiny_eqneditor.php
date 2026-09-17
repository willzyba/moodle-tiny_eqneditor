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
$string['renderurl'] = 'Rendering service URL';
$string['renderurl_desc'] = 'The service that turns an equation into an image, used when "Insert as" is set to Image.';
$string['insertas'] = 'Insert as';
$string['insertas_desc'] = 'How a saved equation is written into the page content. See the plugin README for the trade-offs between the three forms.';
$string['insertas_url'] = 'Image (smallest markup, works everywhere, requires the rendering service to be reachable when the content is viewed)';
$string['insertas_latex'] = 'LaTeX text (tiny and editable by hand, but needs fxTeX, KaTeX or MathJax on the page that displays it)';
$string['insertas_mathml'] = 'MathML (final markup, nothing to fetch, needs one stylesheet on the page that displays it)';
$string['showlatex'] = 'Show LaTeX markup view by default';
$string['showlatex_desc'] = 'Whether the dialog opens on the LaTeX markup view instead of the maths view. Authors can always toggle between them from inside the dialog, and their last choice (remembered in a cookie) overrides this setting on their next visit.';
