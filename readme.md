# argus-eyes
A cli tool for taking and comparing screenshots, useful for visual regression testing. It uses [PhantomJS](http://phantomjs.org/)
for taking the screenshots and [ImageMagick](http://www.imagemagick.org/) for comparing images and generating a visual diff.

It works by taking in a JSON config containing the list of pages with their url's and a list of components, defined by
a CSS selector. It's possible to ignore area's per component.

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
2. Install [ImageMagick](http://www.imagemagick.org/), expects the `compare` executable in your `PATH`
3. Install argus-eyes: `npm install argus-eyes -g`

## Usage

### `argus-eyes add develop`
Run argus-eyes and save all the screenshots under **`.argus-eyes/develop/`**

### `argus-eyes compare develop current`
Compare left and right sets of screenshots, reporting any difference. Process will exit with code 0 when no significant
differences were found, code -1 when differences were found.

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
      "ignorearea": [
        ".last-updated"
      ]
    }
  ]
}
```

## CLI Options

### `--config`
Use a different config file. Defaults to **`'argus-eyes.json'`**
```
argus-eyes add feature/navigation --config=config.json
```

### `--base`
Use a different base directory for storing the screenshots and comparison results. Defaults to **`'.argus-eyes'`**
```
argus-eyes add develop --base==visual-regression
argus-eyes compare develop feature/navigation --base==visual-regression
```

### `--no-color`
Turn off colored output. All output is colored by default.
