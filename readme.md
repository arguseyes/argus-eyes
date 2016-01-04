# argus-eyes
[![npm version](https://badge.fury.io/js/argus-eyes.svg)](https://www.npmjs.org/package/argus-eyes)

A cli tool for taking and comparing screenshots, useful for visual regression testing. It uses
[PhantomJS](http://phantomjs.org/) for taking the screenshots and [ImageMagick](http://www.imagemagick.org/) for
comparing images and generating a visual diff.

It works by taking in a JSON config containing the list of pages with their url's and a list of components, defined by
a css selector. It's possible to ignore area's per component by specifying a css selector.

- [Example](#example)
- [Installation](#installation)
- [Usage](#usage)
- [Config file](#config-file)
- [Options](#cli-options)


## Example
Before argus-eyes can measure possible regression, you'll need to feed it with a list of pages and components. By
default it expects a `argus-eyes.json` file in the current working directory.

**Example config file:**

```json
{
  "pages": [ {
      "name": "homepage",
      "url": "http://localhost:3000/",
      "components": [ "navigation", "news-items" ]
    }, {
      "name": "contact",
      "url": "http://localhost:3000/contact.html",
      "components": [ "navigation" ]
    } ],
  "components": [ {
      "name": "navigation",
      "selector": ".nav"
    }, {
      "name": "news-items",
      "selector": ".news-items",
      "ignore": [ ".last-updated" ]
    } ]
}
```

**Workflow:**

This example workflow assumes the [Gitflow](http://nvie.com/posts/a-successful-git-branching-model/) convention and some
differences between branches. `develop` could be a stable-ish branch, and you've just been working inside a feature
branch. argus-eyes helps you find regression between these 2 states by comparing the baseline branch (develop) with your
feature:

```bash
git checkout develop
argus-eyes add develop

git checkout feature/navigation
argus-eyes add feature/navigation

argus-eyes compare develop feature/navigation
```

If any differences were found, the visual diff images are stored in: **`.argus-eyes/diff_develop_feature-navigation/`**


## Installation
1. Install [Node.js](http://nodejs.org/), at least v4.x
2. Install [ImageMagick](http://www.imagemagick.org/)
3. Install argus-eyes:

  ```
  npm install argus-eyes -g
  ```


## Usage

### `argus-eyes add <name>`
Run argus-eyes and save all the screenshots under **`.argus-eyes/develop/`**

### `argus-eyes compare <name1> <name2>`
Compare left and right sets of screenshots, reporting any difference. Process will exit with code 0 when no significant
differences were found, code 1 when differences were found.


## Config file
argus-eyes will look for a **`argus-eyes.json`** file in the current working directory, it will fail without a valid
config file. You can override this default location with the **`--config`** option.

The config file must be a valid JSON object, containing *exactly* the following 2 arrays: `pages` and `components`. Page
objects require a name, url and list of components. Components require a name and selector. Components can optionally
take a list of selectors of elements to ignore, this selector is appended to the component selector.

```js
{
  pages: [
    {
      name: String,      // Identifier, used in filenames
      url: String,       // Valid URL
      components: [
        String           // Existing component identifier
        // ...
      ]
    }
    // ...
  ],
  components: [
    {
      name: String,      // Identifier, used in page objects and filenames
      selector: String,  // CSS selector, to clip the screenshot
      ignore: [          // Optional array of ignored selectors
        String           // CSS selector, to `display:none` an element
        // ...
      ]
    }
    // ...
  ]
}
```

## CLI Options
Since the `add` and `compare` commands take positional arguments, all named options are expected last.

### `--config=…`
Use a different config file. Defaults to **`'argus-eyes.json'`**
```
argus-eyes add feature/navigation --config=config.json
```

### `--threshold=…`
Set the threshold for comparison differences, expects a number between 0 and 100. If the difference between 2 files is
bigger than this number, it will be treated as different and reported as such.
```
argus-eyes compare develop feature/navigation --threshold=5
```

### `--base=…`
Use a different base directory for storing the screenshots and comparison results. Defaults to **`'.argus-eyes'`**
```
argus-eyes add develop --base==visual-regression
argus-eyes compare develop feature/navigation --base==visual-regression
```

### `--im=…`
Set the path where the ImageMagick `compare`, `convert` and `identify` executables can be found. This path needs to end
with a slash. It is empty by default, expecting the executables in your `PATH`.

### `--verbose`
Turn on verbose output.

### `--no-color`
Turn off colored output. Output is colored by default.

### `--help`
Print usage information.

### `--version`
Print version.
