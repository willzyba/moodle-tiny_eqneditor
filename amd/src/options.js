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
 * This plugin's settings, as the editor holds them. classes/plugininfo.php's
 * get_plugin_configuration_for_context() supplies the values; editor_tiny passes each one in as an
 * editor option named <pluginName>:<key>, and TinyMCE only keeps an option that has been registered
 * first - so register() runs when the plugin is added to an editor (plugin.js), and the getters
 * read the values back.
 *
 * @module      tiny_eqneditor/options
 * @copyright   2026 CodeCogs, Zyba Ltd. <https://www.codecogs.com>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {getPluginOptionName} from 'editor_tiny/options';
import {pluginName} from './common';

const serverName = getPluginOptionName(pluginName, 'server');
const licenceName = getPluginOptionName(pluginName, 'licence');
const renderUrlName = getPluginOptionName(pluginName, 'renderurl');
const insertAsName = getPluginOptionName(pluginName, 'insertas');
const designName = getPluginOptionName(pluginName, 'design');

/**
 * Registers the plugin's options with an editor, so the values editor_tiny passes in are kept.
 *
 * @param {object} editor The TinyMCE editor
 */
export const register = (editor) => {
    const registerOption = editor.options.register;
    registerOption(serverName, {processor: 'string', "default": 'https://fxtex.codecogs.com'});
    registerOption(licenceName, {processor: 'string', "default": ''});
    registerOption(renderUrlName, {processor: 'string', "default": 'https://fxtex.codecogs.com'});
    registerOption(insertAsName, {processor: 'string', "default": 'url'});
    registerOption(designName, {processor: 'string', "default": ''});
};

/**
 * The host the editor itself is loaded from.
 *
 * @param {object} editor The TinyMCE editor
 * @returns {string}
 */
export const getServer = (editor) => editor.options.get(serverName) || 'https://fxtex.codecogs.com';

/**
 * The fxTeX Pro licence key.
 *
 * @param {object} editor The TinyMCE editor
 * @returns {string}
 */
export const getLicence = (editor) => editor.options.get(licenceName) || '';

/**
 * Where equation images are rendered.
 *
 * @param {object} editor The TinyMCE editor
 * @returns {string}
 */
export const getRenderUrl = (editor) => editor.options.get(renderUrlName) || 'https://fxtex.codecogs.com';

/**
 * The editor's design, from the JSON setting - none at all when it does not parse.
 *
 * @param {object} editor The TinyMCE editor
 * @returns {object}
 */
export const getDesign = (editor) => {
    try {
        return JSON.parse(editor.options.get(designName) || '{}') || {};
    } catch (e) {
        return {};
    }
};

/**
 * What an equation is inserted as: 'url' (an image), 'latex' or 'mathml'.
 *
 * @param {object} editor The TinyMCE editor
 * @returns {string}
 */
export const getInsertAs = (editor) => {
    const value = editor.options.get(insertAsName) || 'url';
    return ['url', 'latex', 'mathml'].includes(value) ? value : 'url';
};
