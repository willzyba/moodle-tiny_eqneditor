# tiny_eqneditor

The [CodeCogs Equation Editor](https://editor.codecogs.com) as a Moodle **Tiny** editor
plugin - Moodle 4.1 and later ship TinyMCE 6 as their default editor (the "Tiny" editor
subsystem, `editor_tiny`), so this wraps the same dialog code as
[`tinymce/v6/eqneditor.js`](../../tinymce/v6/eqneditor.js) in this repo, adapted to Moodle's
plugin registration and configuration APIs. See that plugin's own comments for the reasoning
behind the dialog's behaviour; this file only covers what is Moodle-specific.

**Tested on Moodle 4.5 LTS** (4.5.15+, PHP 8.3, PostgreSQL, Docker - see "Testing locally"
below), November 2026: installed, the Equation button in the toolbar's overflow and the Insert
menu, the dialog, and an SVG insert with its LaTeX as alt text. That first install found three
bugs that would have broken every school installing it, now fixed: no `amd/build` (Moodle loads
only built modules, so the failed load took down every TinyMCE editor on the site), options read
through a helper `editor_tiny/options` does not have, and no `configuration` module, so the button
was never placed on the toolbar. Not yet tried on other Moodle versions; the Tiny plugin API has
moved between minor releases since 4.1.

### Testing locally

`/Users/will/Data/Vultr/moodle-dev` (outside this repo) holds a Moodle 4.5 checkout and
moodlehq/moodle-docker, with this directory bind-mounted into the site
(`moodle-docker/local.yml`): `source env.sh && moodle-docker/bin/moodle-docker-compose up -d`,
then http://localhost:8000. After changing `amd/src`, rebuild with Moodle's own toolchain (Node
22, in Docker) and commit `amd/build` with it:

```bash
cd /Users/will/Data/Vultr/moodle-dev
rsync -a --delete /Users/will/Data/Vultr/fxPlugins/moodle/tiny_eqneditor/ moodle/lib/editor/tiny/plugins/eqneditor/
docker run --rm -v "$PWD/moodle:/moodle" -w /moodle node:22 npx grunt amd --root=lib/editor/tiny/plugins/eqneditor
rsync -a moodle/lib/editor/tiny/plugins/eqneditor/amd/build/ /Users/will/Data/Vultr/fxPlugins/moodle/tiny_eqneditor/amd/build/
```

## Installing

1. Copy this directory to `<moodle>/lib/editor/tiny/plugins/eqneditor`.
2. Nothing to build: Moodle loads `amd/build/*.min.js`, which ships alongside `amd/src`. After
   changing anything in `amd/src`, rebuild it (Moodle's Node toolchain, from the Moodle root) and
   commit the result with the change - without `amd/build`, Moodle reports "No define call for
   tiny_eqneditor/plugin" and every TinyMCE editor on the site fails to load:
   ```
   cd <moodle>
   npx grunt amd --root=lib/editor/tiny/plugins/eqneditor
   ```
   `grunt amd` lints first (Moodle's eslint rules) and refuses to build on any error.
3. Visit *Site administration &rarr; Notifications* to complete the install.
4. *Site administration &rarr; Plugins &rarr; Text editors &rarr; TinyMCE editor &rarr; General*
   - add **Equation** to the toolbar configuration.
5. *Site administration &rarr; Plugins &rarr; Text editors &rarr; TinyMCE editor &rarr; CodeCogs
   Equation Editor* - the settings this plugin's `settings.php` adds - to change the render
   host or the dialog's default insert form.

## Structure

```
version.php                    Plugin version/requires - standard for every Moodle plugin.
settings.php                   Site admin settings (server, renderurl, insertas).
classes/plugininfo.php         Registers the button/menu item, passes settings.php's values
                                through to the AMD module for the current context.
classes/privacy/provider.php   Privacy API: a null provider - the plugin stores no personal data.
lang/en/tiny_eqneditor.php     English strings - button/menu text, dialog title, settings.
pix/eqneditor.svg              The toolbar button icon (the same fx wordmark as the other
                                fxPlugins adapters).
amd/src/common.js              Shared constants.
amd/src/options.js             Reads plugininfo.php's configuration back out of the editor.
amd/src/commands.js            The toolbar button, menu item, and the dialog itself.
amd/src/plugin.js              Entry point - registers with TinyMCE's PluginManager.
amd/build/*.min.js(.map)       What Moodle actually loads - built from amd/src by `grunt amd`.
```

## Configuration

Site-wide, under *Site administration &rarr; Plugins &rarr; Text editors &rarr; TinyMCE editor
&rarr; CodeCogs Equation Editor* (`settings.php`) - there is currently no per-course or
per-instance override:

| Setting | Default | Meaning |
|---|---|---|
| Equation Editor host | `fxtex.codecogs.com` | Where the Equation Editor's own code is loaded from. Change this only if you run your own copy. |
| Licence key | *(empty)* | Your fxTeX Pro licence key (`fx_pk_...`). Without one the maths view shows a licence error instead of rendering. |
| Rendering service URL | `https://latex.codecogs.com` | The service that turns an equation into an image, used when *Insert as* is *Image*. |
| Insert as | Image | The dialog's starting *Insert as* choice (authors can change it per equation): *Image* (an SVG `<img>`), *LaTeX* (`\( \)` when *Inline* is on, `$$ $$` otherwise, for Moodle's MathJax filter - so it only renders where that filter is enabled), or *MathML* (final markup, needs the stylesheet below). |

## The dialog

The same layout as every other adapter in this repo: the toolbar and maths view on top, then
one bottom bar with the *Inline* and *LaTeX markup* toggles on the left and *Insert as*,
*Cancel* and *OK* on the right. The maths view is always shown first; *LaTeX markup* swaps it
for the LaTeX source for this dialog only.

### MathML needs a stylesheet on the page that displays it

If *Insert as* is set to *MathML*, whatever theme or activity finally displays the content
needs this line - the same file fxTeX ships - since browsers' own MathML does not cover
everything the converter produces:

```html
<link rel="stylesheet" href="https://fxtex.codecogs.com/fxtex.css">
```

The plugin loads it into the *editing* view for you; it cannot add it to every place Moodle
might later display the content (a forum post, a page resource, a quiz question...), because
that is a theme-level change, not something a Tiny plugin can reach.

## Known gaps

- **No automated tests.** A real Tiny plugin submission to the Moodle plugins directory would
  need a PHPUnit test for `plugininfo.php` and a Behat/Playwright test exercising the dialog;
  neither exists yet.
- **No per-course override.** Every editor on the site shares one configuration. If different
  courses need different `insertas` settings, `get_plugin_configuration_for_context()` in
  `classes/plugininfo.php` is where a per-context override would go.
- **thirdpartylibs.xml is deliberately absent.** EqEditor's own code is loaded from
  `fxtex.codecogs.com` at runtime, the same as every other adapter in this repo - nothing
  third-party is bundled into this plugin's own codebase for that file to declare.
