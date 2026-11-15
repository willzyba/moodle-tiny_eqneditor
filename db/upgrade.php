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
 * Upgrade steps for tiny_eqneditor.
 *
 * @package     tiny_eqneditor
 * @copyright   2026 CodeCogs, Zyba Ltd. <https://www.codecogs.com>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Upgrade the plugin from an earlier version.
 *
 * @param int $oldversion The version being upgraded from
 * @return bool
 */
function xmldb_tiny_eqneditor_upgrade($oldversion) {
    if ($oldversion < 2026111502) {
        // The rendering service is fxtex.codecogs.com. A site still on the old default
        // (latex.codecogs.com, stored when the plugin was installed) moves to it; an address the
        // administrator chose themselves is left alone.
        if (get_config('tiny_eqneditor', 'renderurl') === 'https://latex.codecogs.com') {
            set_config('renderurl', 'https://fxtex.codecogs.com', 'tiny_eqneditor');
        }
        upgrade_plugin_savepoint(true, 2026111502, 'tiny', 'eqneditor');
    }

    if ($oldversion < 2026111504) {
        // The Equation editor URL is a full URL, like the Rendering service URL: the old default
        // was the bare host fxtex.codecogs.com. Both work; this keeps the two settings alike.
        if (get_config('tiny_eqneditor', 'server') === 'fxtex.codecogs.com') {
            set_config('server', 'https://fxtex.codecogs.com', 'tiny_eqneditor');
        }
        upgrade_plugin_savepoint(true, 2026111504, 'tiny', 'eqneditor');
    }
    return true;
}
