# argus-eyes
[![npm version](https://badge.fury.io/js/argus-eyes.svg)](https://www.npmjs.org/package/argus-eyes)

A cli tool for taking and comparing screenshots, useful for visual regression testing. It uses [PhantomJS](http://phantomjs.org/)
for taking the screenshots and [ImageMagick](http://www.imagemagick.org/) for comparing images and generating a visual diff.

It works by taking in a JSON config containing the list of pages with their url's and a list of components, defined by
a css selector. It's possible to ignore area's per component by specifying a css selector.

- [Example](#example)
- [Installation](#installation)
- [Usage](#usage)
- [Config file](#config-file)
- [Options](#cli-options)

## Example
```bash
git checkout develop                             # Switch branch
argus-eyes add develop                           # Take screenshots, named 'develop'

git checkout feature/navigation                  # Switch branch
argus-eyes add feature/navigation                # Take screenshots, named 'feature/navigation'

argus-eyes compare develop feature/navigation    # Compare the 2 sets
```

## Installation
1. Install [Node.js](http://nodejs.org/), at least v4.x
2. Install [ImageMagick](http://www.imagemagick.org/)
3. Install argus-eyes: `npm install argus-eyes -g`

## Usage

### `argus-eyes add develop`
Run argus-eyes and save all the screenshots under **`.argus-eyes/develop/`**

### `argus-eyes compare develop current`
Compare left and right sets of screenshots, reporting any difference. Process will exit with code 0 when no significant
differences were found, code 1 when differences were found.

## Config file
argus-eyes will look for a **`argus-eyes.json`** file in the current directory, it will fail without a config file.
You can override this default location with the **`--config`** option.

```json
{
  "pages": [
    {
      "name": "homepage",
      "url": "http://example.org/",
      "components": [
        "navigation",
        "news-items"
      ]
    },
    {
      "name": "contact",
      "url": "http://example.org/contact.html",
      "components": [
        "navigation"
      ]
    }
  ],
  "components": [
    {
      "name": "navigation",
      "selector": ".nav"
    },
    {
      "name": "news-items",
      "selector": ".news-items",
      "ignore": [
        ".last-updated"
      ]
    }
  ]
}
```

## CLI Options
Since the `add` and `compare` commands take positional arguments, all other options are expected last.

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
Set the path where the ImageMagick `compare` and `identify` executables can be found.

### `--verbose`
Turn on verbose output.

### `--no-color`
Turn off colored output. Output is colored by default.

### `--help`
Print usage information.

### `--version`
Print version.
