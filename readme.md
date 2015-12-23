# argus-eyes

- [Installation](#installation)
- [Usage](#usage)
- [Config file](#config-file)
- [Options](#cli-options)

## Example
```
git checkout develop                          # Switch branch to develop
argus-eyes add develop                        # Take screenshots, save them in '.argus-eyes/develop/'
git checkout feature/navigation               # Switch branch to feature/navigation
argus-eyes add feature/navigation             # Take screenshots, save them in '.argus-eyes/feature-navigation/'
argus-eyes compare develop feature/navigation # Compare 2 sets, save diff in '.argus-eyes/diff_develop_feature-navigation/'
```

## Installation
1. Install [Node.js](http://nodejs.org/), at least v4.x
2. Install [ImageMagick](http://www.imagemagick.org/)
3. Install argus-eyes: `npm install argus-eyes -g`

## Usage

### `argus-eyes add develop`
Take screenshots for the
Run argus-eyes and save all the screenshots under `.argus-eyes/develop/`

### `argus-eyes compare develop current`
Compare 2 existing

## Config file
argus-eyes will look for a `argus-eyes.json` file in the current directory, it will fail without a config file. You can override this default location with the `--config` option.
```
{
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
  ],
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
  ]
}
```

## CLI Options

### `--config`
Use a different config file. Defaults to `'argus-eyes.json'`
```
argus-eyes add feature/navigation --config=config.json
```

### `--base`
Use a different base directory for storing the screenshots and comparison results. Defaults to `'.argus-eyes'`
```
argus-eyes add develop --base==visual-regression
argus-eyes compare develop feature/navigation --base==visual-regression
```
