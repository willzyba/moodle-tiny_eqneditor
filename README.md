# CodeCogs Equation Editor for TinyMCE (tiny_eqneditor)

Adds an **Equation** button to Moodle's TinyMCE editor, so teachers and students can write
mathematics anywhere Moodle has a text editor - a quiz question, a forum post, a page, an
assignment - using the CodeCogs Equation Editor: a toolbar of symbols and structures, a
what-you-see-is-what-you-get maths view, and the LaTeX source beside it. Equations go into the
content as an image, as LaTeX for Moodle's MathJax filter, or as MathML, and a double-click on
an equation opens it again for editing.

Documentation and a live example: https://fxplugins.codecogs.com/docs/moodle.html

## Requirements

- Moodle 4.5 (LTS). The plugin is a subplugin of the TinyMCE editor (`editor_tiny`), which
  Moodle has used since 4.1; it has been tested on Moodle 4.5 only.
- **A free fxTeX Pro licence key from CodeCogs**, and browsers that can reach CodeCogs' servers -
  see *External services* below. Without a key the editor opens and image inserts still work,
  but the maths view shows an fxTeX Pro error instead of the equation, and LaTeX is the only way
  to write one.
- No other plugins, and no Composer or build step: the package includes its compiled
  JavaScript.

## External services

This plugin is a front end to services run by CodeCogs (https://www.codecogs.com). It does not
work without them.

| Service | Default | What it does | What it receives |
|---|---|---|---|
| Equation editor host | `fxtex.codecogs.com` | Serves the equation editor itself (`fxeditor.api.min.js`, `fxeditor.css`, fonts) and fxTeX Pro, the typesetting engine that draws the maths view and converts equations to MathML. The author's browser loads them each time the editor opens. | The site's licence key, the address of the Moodle page (as the browser's referrer), and usage counts against the key. |
| Rendering service | `https://latex.codecogs.com` | Draws equations inserted as **images**: each image's address carries its LaTeX, and every browser that displays the image fetches it from there. Not used for LaTeX or MathML inserts. | The equation's LaTeX and the site's origin (referrer). |

**fxTeX Pro needs a licence key, which is free.** Register at https://editor.codecogs.com,
then create a key for your Moodle site's domain in the licence manager. There is nothing to pay,
for the key or for anything the plugin does. A key only works on the domains it was issued for.
It is not a secret - it is sent to every browser that opens the editor.

The plugin stores no personal data in Moodle; its privacy provider declares the two external
services above.

## Installing

From the ZIP package, as for any plugin:

1. *Site administration > Plugins > Install plugins*, upload the ZIP, and follow the prompts.
   (Or unzip it so that this folder is `<moodle>/lib/editor/tiny/plugins/eqneditor`, then visit
   *Site administration > Notifications*.)
2. *Site administration > Plugins > Text editors > TinyMCE editor > CodeCogs Equation Editor*:
   enter your **licence key**. This is the one step the plugin needs after installation.

The **Equation** button then appears on the editor's toolbar and under *Insert > Equation...*.

## Settings

Site-wide, under *Site administration > Plugins > Text editors > TinyMCE editor > CodeCogs
Equation Editor*:

| Setting | Default | Meaning |
|---|---|---|
| Licence key | *(empty)* | Your free fxTeX Pro licence key (`fx_pk_...`). Required. |
| Design | *(empty)* | How the editor looks - toolbar, colour, sizes - as JSON. Build one at https://fxplugins.codecogs.com/docs/moodle.html. Empty for the standard design. |
| Equation editor host | `fxtex.codecogs.com` | Where the equation editor is loaded from. Change it only if you run your own copy. |
| Rendering service URL | `https://latex.codecogs.com` | The service that turns an equation into an image, used when *Insert as* is *Image*. |
| Insert as | Image | The dialog's starting *Insert as* choice, which authors can change for each equation (below). |

## Choosing how equations are stored

- **Image** (an SVG `<img>`) - displays anywhere, but the rendering service has to be reachable
  whenever the content is viewed.
- **LaTeX** - `\( \)` when *Inline* is on, `$$ $$` otherwise. Compact and editable by hand;
  displayed by Moodle's MathJax filter, which must be enabled where the content is shown.
- **MathML** - final markup with nothing to fetch. Pages that display it need fxTeX's
  stylesheet, since browsers' own MathML does not cover everything the converter produces: add
  `<link rel="stylesheet" href="https://fxtex.codecogs.com/fxtex.css">` under *Site
  administration > Appearance > Additional HTML > Within HEAD*. The plugin loads it into the
  editing view itself, but cannot reach every page that later shows the content.

## The dialog

The toolbar and maths view on top; one bottom bar with the *Inline* and *LaTeX* switches on the
left and *Insert as*, *Cancel* and *OK* on the right. *LaTeX* shows the LaTeX source above the
maths view. The dialog remembers its layout choices (toolbar size, the switches, the panes'
sizes) in the author's own browser only.

## Licence

This plugin is free software under the GNU GPL v3 or later - see `LICENSE`. It contains no
third-party code: the equation editor and fxTeX Pro are not part of this package, and are
loaded from the equation editor host at run time under CodeCogs' own terms.

Copyright 2026 CodeCogs (https://www.codecogs.com).

## For developers

```
version.php                    Plugin version and requirements.
settings.php                   Site admin settings.
classes/plugininfo.php         Registers the button and menu item, and passes the settings to
                                the AMD module.
classes/privacy/provider.php   Privacy API: no data kept in Moodle; the external services.
lang/en/tiny_eqneditor.php     English strings.
pix/eqneditor.svg              The toolbar button's icon.
amd/src/plugin.js              Entry point - registers with TinyMCE's PluginManager.
amd/src/configuration.js       Puts the button on the toolbar and in the Insert menu.
amd/src/commands.js            The button, the menu item and the dialog itself.
amd/src/options.js             Reads plugininfo.php's configuration back out of the editor.
amd/src/common.js              Shared constants.
amd/build/                     The compiled modules Moodle loads - rebuild after changing amd/src.
```

The dialog is the same code as `tinymce/v6/eqneditor.js` in the fxPlugins repository, adapted
to Moodle's plugin API; keep the two in step by hand.

Rebuilding `amd/build` needs Moodle's own Grunt set-up and Node 22, from a Moodle checkout with
the plugin in place:

```
cd <moodle>
npx grunt amd --root=lib/editor/tiny/plugins/eqneditor
```

(With a different Node on the machine: `docker run --rm -v "$PWD:/moodle" -w /moodle node:22 npx
grunt amd --root=lib/editor/tiny/plugins/eqneditor`.)
