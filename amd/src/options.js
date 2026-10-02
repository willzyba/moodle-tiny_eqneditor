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
 * Reads this plugin's per-instance configuration back out of the editor - the values
 * classes/plugininfo.php::get_plugin_configuration_for_context() put there, read via Moodle's
 * standard editor_tiny/options helper rather than editor.getParam() (the TinyMCE-native way
 * the standalone tinymce/v6/eqneditor.js plugin reads its own options), since Tiny plugin
 * configuration is threaded through per-context, not passed straight into tinymce.init().
 *
 * @module      tiny_eqneditor/options
 * @copyright   2026 CodeCogs <https://www.codecogs.com>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {getPluginOptions} from 'editor_tiny/options';
import {component} from './common';

export const getServer = (editor) => getPluginOptions(editor, component).server || 'fxtex.codecogs.com';
export const getLicence = (editor) => getPluginOptions(editor, component).licence || '';
export const getRenderUrl = (editor) => getPluginOptions(editor, component).renderurl || 'https://latex.codecogs.com';
export const getDesign = (editor) => {
    try {
        return JSON.parse(getPluginOptions(editor, component).design || '{}') || {};
    } catch (e) {
        return {};
    }
};
export const getInsertAs = (editor) => {
    const value = getPluginOptions(editor, component).insertas || 'url';
    return ['url', 'latex', 'mathml'].includes(value) ? value : 'url';
};
