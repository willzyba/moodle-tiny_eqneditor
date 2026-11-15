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
 * Puts the equation button on the toolbar and in the Insert menu. Registering a button
 * (commands.js) only makes it available; editor_tiny lays out the toolbar from each plugin's
 * configure(), as Moodle's own equation plugin does.
 *
 * @module      tiny_eqneditor/configuration
 * @copyright   2026 CodeCogs <https://www.codecogs.com>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {buttonName, component, menuItemName} from './common';
import {addMenubarItem, addToolbarButton, addToolbarSection} from 'editor_tiny/utils';

/**
 * Adds the button to a toolbar section of its own, after the lists. Not Moodle's 'advanced'
 * section: its own equation plugin creates that one without checking for it, and
 * addToolbarButton() adds to every section of a name - so sharing it put Moodle's button in twice.
 *
 * @param {Array} toolbar The toolbar configuration
 * @returns {Array}
 */
const configureToolbar = (toolbar) => {
    addToolbarSection(toolbar, component, 'lists', true);
    return addToolbarButton(toolbar, component, buttonName);
};

/**
 * The editor configuration with the button and menu item added.
 *
 * @param {object} instanceConfig The editor instance configuration
 * @returns {object}
 */
export const configure = (instanceConfig) => ({
    menu: addMenubarItem(instanceConfig.menu, 'insert', menuItemName),
    toolbar: configureToolbar(instanceConfig.toolbar),
});
