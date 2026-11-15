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
 * Site-wide settings for tiny_eqneditor, read by classes/plugininfo.php and passed to the
 * AMD module - one configuration for every editor instance on the site, there being no
 * per-course or per-instance override yet.
 *
 * @package     tiny_eqneditor
 * @copyright   2026 CodeCogs, Zyba Ltd. <https://www.codecogs.com>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

if ($ADMIN->fulltree) {
    $settings->add(new admin_setting_configtext(
        'tiny_eqneditor/server',
        get_string('server', 'tiny_eqneditor'),
        get_string('server_desc', 'tiny_eqneditor'),
        'https://fxtex.codecogs.com',
        PARAM_URL
    ));

    $settings->add(new admin_setting_configtext(
        'tiny_eqneditor/licence',
        get_string('licence', 'tiny_eqneditor'),
        get_string('licence_desc', 'tiny_eqneditor'),
        '',
        PARAM_ALPHANUMEXT
    ));

    $settings->add(new admin_setting_configtext(
        'tiny_eqneditor/renderurl',
        get_string('renderurl', 'tiny_eqneditor'),
        get_string('renderurl_desc', 'tiny_eqneditor'),
        'https://fxtex.codecogs.com',
        PARAM_URL
    ));

    $settings->add(new admin_setting_configselect(
        'tiny_eqneditor/insertas',
        get_string('insertas', 'tiny_eqneditor'),
        get_string('insertas_desc', 'tiny_eqneditor'),
        'url',
        [
            'url' => get_string('insertas_url', 'tiny_eqneditor'),
            'latex' => get_string('insertas_latex', 'tiny_eqneditor'),
            'mathml' => get_string('insertas_mathml', 'tiny_eqneditor'),
        ]
    ));

    $settings->add(new admin_setting_configtextarea(
        'tiny_eqneditor/design',
        get_string('design', 'tiny_eqneditor'),
        get_string('design_desc', 'tiny_eqneditor'),
        '',
        PARAM_RAW
    ));
}
