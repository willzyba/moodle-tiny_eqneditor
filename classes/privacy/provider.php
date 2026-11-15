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

namespace tiny_eqneditor\privacy;

use core_privacy\local\metadata\collection;
use core_privacy\local\request\approved_contextlist;
use core_privacy\local\request\approved_userlist;
use core_privacy\local\request\contextlist;
use core_privacy\local\request\userlist;

/**
 * Privacy provider for tiny_eqneditor.
 *
 * The plugin keeps no personal data in Moodle: its settings are site-wide (settings.php), equations
 * go into the content being edited, and the dialog's layout choices are remembered only in the
 * author's own browser (amd/src/commands.js). It does send data to two external locations - the
 * equation editor's host and the image rendering service - which get_metadata() declares, so the
 * request methods below have nothing to find, export or delete.
 *
 * @package     tiny_eqneditor
 * @copyright   2026 CodeCogs <https://www.codecogs.com>
 * @license     http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class provider implements
    \core_privacy\local\metadata\provider,
    \core_privacy\local\request\core_userlist_provider,
    \core_privacy\local\request\plugin\provider {
    /**
     * The data the plugin sends to external locations.
     *
     * @param collection $collection The collection to add to.
     * @return collection
     */
    public static function get_metadata(collection $collection): collection {
        $collection->add_external_location_link('fxtex', [
            'licence' => 'privacy:metadata:fxtex:licence',
            'pageurl' => 'privacy:metadata:fxtex:pageurl',
            'usage' => 'privacy:metadata:fxtex:usage',
        ], 'privacy:metadata:fxtex');

        $collection->add_external_location_link('render', [
            'equation' => 'privacy:metadata:render:equation',
            'siteurl' => 'privacy:metadata:render:siteurl',
            'usage' => 'privacy:metadata:render:usage',
        ], 'privacy:metadata:render');

        return $collection;
    }

    /**
     * No contexts: the plugin stores no user data in Moodle.
     *
     * @param int $userid The user to search.
     * @return contextlist
     */
    public static function get_contexts_for_userid(int $userid): contextlist {
        return new contextlist();
    }

    /**
     * No users: the plugin stores no user data in Moodle.
     *
     * @param userlist $userlist The userlist to add to.
     */
    public static function get_users_in_context(userlist $userlist) {
    }

    /**
     * Nothing to export: the plugin stores no user data in Moodle.
     *
     * @param approved_contextlist $contextlist The approved contexts to export information for.
     */
    public static function export_user_data(approved_contextlist $contextlist) {
    }

    /**
     * Nothing to delete: the plugin stores no user data in Moodle.
     *
     * @param \context $context The context to delete in.
     */
    public static function delete_data_for_all_users_in_context(\context $context) {
    }

    /**
     * Nothing to delete: the plugin stores no user data in Moodle.
     *
     * @param approved_contextlist $contextlist The approved contexts and user information to delete.
     */
    public static function delete_data_for_user(approved_contextlist $contextlist) {
    }

    /**
     * Nothing to delete: the plugin stores no user data in Moodle.
     *
     * @param approved_userlist $userlist The approved context and users to delete.
     */
    public static function delete_data_for_users(approved_userlist $userlist) {
    }
}
