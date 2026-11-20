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
 * Version details for tiny_eqneditor.
 *
 * @package     tiny_eqneditor
 * @copyright   2026 CodeCogs, Zyba Ltd. <https://www.codecogs.com>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$plugin->component = 'tiny_eqneditor';
$plugin->version = 2026111900;
// Moodle 4.1 is the release that introduced the Tiny (TinyMCE 6) editor subsystem this
// plugin is written against - see https://moodledev.io/docs/apis/plugintypes/editor_tiny.
$plugin->requires = 2022112800;
$plugin->maturity = MATURITY_STABLE;
$plugin->release = '1.2.9';
