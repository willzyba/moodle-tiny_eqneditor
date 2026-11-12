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
 * Tiny Equation Editor plugin entrypoint, registered with TinyMCE's own PluginManager - the
 * standard shape for a Moodle editor_tiny subplugin, per
 * https://moodledev.io/docs/apis/plugintypes/editor_tiny.
 *
 * @module      tiny_eqneditor/plugin
 * @copyright   2026 CodeCogs <https://www.codecogs.com>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import {getTinyMCE} from 'editor_tiny/loader';
import {getPluginMetadata} from 'editor_tiny/utils';
import {component, pluginName, displayName} from './common';
import {getSetup as getCommandSetup} from './commands';
import * as Configuration from './configuration';
import * as Options from './options';

// Resolves to [pluginName, Configuration] once the plugin is registered, as editor_tiny expects of
// every plugin module's default export: the name it is added to TinyMCE under, which is also the
// prefix of its options (options.js), and the module that places its button (configuration.js).
export default Promise.all([
    getTinyMCE(),
    getPluginMetadata(component, displayName),
    getCommandSetup(),
]).then(([tinyMCE, pluginMetadata, setupCommands]) => {
    tinyMCE.PluginManager.add(pluginName, (editor) => {
        Options.register(editor);
        setupCommands(editor);
        return pluginMetadata;
    });

    return [pluginName, Configuration];
});
