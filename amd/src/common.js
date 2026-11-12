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
 * Constants shared across this plugin's AMD modules.
 *
 * @module      tiny_eqneditor/common
 * @copyright   2026 CodeCogs <https://www.codecogs.com>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

export const component = 'tiny_eqneditor';
// The name editor_tiny knows the plugin by - its module, tiny_eqneditor/plugin - and the prefix of
// every option it passes in from classes/plugininfo.php (tiny_eqneditor/plugin:server, ...).
export const pluginName = 'tiny_eqneditor/plugin';
// Shown in TinyMCE's Help > Plugins list.
export const displayName = 'Equation Editor';
// The toolbar button and Insert menu item; configuration.js places them.
export const buttonName = component;
export const menuItemName = component;
export const icon = 'eqneditor';
