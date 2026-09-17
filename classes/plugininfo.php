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

namespace tiny_eqneditor;

use context;
use editor_tiny\editor;
use editor_tiny\plugin;
use editor_tiny\plugin_with_buttons;
use editor_tiny\plugin_with_configuration;
use editor_tiny\plugin_with_menuitems;

/**
 * tiny_eqneditor plugin registration, following the editor_tiny plugin API - see
 * https://moodledev.io/docs/apis/plugintypes/editor_tiny.
 *
 * @package     tiny_eqneditor
 * @copyright   2026 CodeCogs <https://www.codecogs.com>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class plugininfo extends plugin implements plugin_with_buttons, plugin_with_menuitems, plugin_with_configuration {

    /**
     * The single toolbar button this plugin adds.
     *
     * @return string[]
     */
    public static function get_available_buttons(): array {
        return [
            'tiny_eqneditor/eqneditor',
        ];
    }

    /**
     * The single Insert-menu item this plugin adds, alongside the toolbar button.
     *
     * @return string[]
     */
    public static function get_available_menuitems(): array {
        return [
            'tiny_eqneditor/eqneditor',
        ];
    }

    /**
     * Whether the plugin should be active for the given editor instance. Equations are
     * ordinary content in any editable HTML area, so this plugin is available everywhere
     * the Tiny editor itself is - it does not need capability checks of its own beyond that.
     *
     * @param context $context
     * @param array $options
     * @param array $fpoptions
     * @param editor|null $editor
     * @return bool
     */
    public static function is_enabled(
        context $context,
        array $options,
        array $fpoptions,
        ?editor $editor = null
    ): bool {
        return true;
    }

    /**
     * Site-configured defaults, passed through to the AMD module - see settings.php and
     * amd/src/options.js. Per-instance overrides are not currently exposed; every editor on
     * the site shares one Equation Editor configuration.
     *
     * @param context $context
     * @param array $options
     * @param array $fpoptions
     * @param editor|null $editor
     * @return array
     */
    public static function get_plugin_configuration_for_context(
        context $context,
        array $options,
        array $fpoptions,
        ?editor $editor = null
    ): array {
        return [
            'server' => get_config('tiny_eqneditor', 'server') ?: 'editor.codecogs.com',
            'renderurl' => get_config('tiny_eqneditor', 'renderurl') ?: 'https://latex.codecogs.com',
            'insertas' => get_config('tiny_eqneditor', 'insertas') ?: 'url',
            'showlatex' => (bool) get_config('tiny_eqneditor', 'showlatex'),
        ];
    }
}
