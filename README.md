# argus-eyes
[![npm version](https://badge.fury.io/js/argus-eyes.svg)](https://www.npmjs.org/package/argus-eyes)

A lightweight CLI tool for visual regression testing of UI components.

Argus-eyes does 3 things for you:  

1. Take screenshots of UI components in different views and branches, specified by you.  
2. Test the screenshots for visual differences.  
3. Create images of the visual differences.  

Taking screenshots of your components is handled by [PhantomJS](http://phantomjs.org/), a headless WebKit.  
[ImageMagick](http://www.imagemagick.org/) - a CLI image processor - compares the screenshots and creates an image showing where they differ.

| View 1      | View 2 | Diff image  |
| --- |---| ---|
| ![alt tag](img/nav-menu-1.png)    | ![alt tag](img/nav-menu-2.png)| ![alt tag](img/nav-menu-3.png) |

## Contents

- [Install](#install)
- [Usage](#usage)
- [Documentation](#documentation)
  - [Dependencies](#dependencies)
  - [Setup the config file](#setup-the-config-file)
  - [Take screenshots](#take-screenshots)
  - [Test for visual regression](#test-for-visual-regression)
  - [Test on seperate branches](#test-on-seperate-branches)
  - [CLI options](#cli-options)
- [Contributing](#contributing)
- [License](#license)

## Install

Argus-eyes is a npm package so you'll need Node.js and npm installed on your machine. You can check if you have Node.js and npm installed by typing **`$ node --version && npm --version`** in a terminal. This command should return 2 version numbers: one for Node.js and one for npm.  

If you haven't got Node.js and npm installed you can download those on [Nodejs.org](https://nodejs.org/).  

If you do have Node.js and npm installed you can install argus-eyes by typing this command:

  ```
  $ npm install argus-eyes -g
  ```
_Note:_ Argus-eyes is a CLI tool so it needs to be installed globally.

## Usage

After installing, you want to tell argus-eyes which pages and which components to check for visual regression. Argus-eyes works by going over a straightforward JSON file containing the pages with their url's and the components with their CSS-selectors.

Once argus-eyes knows where to find the components, it's time for some command line action. The first command you want to use is `$ argus-eyes add <new-folder-name>`. This makes argus-eyes go over the JSON file and take screenshots of **all** specified components in there. The screenshots are saved in **`.argus-eyes/<new-folder-name>`** and this screenshot folder can be compared with another screenshot folder.

Say you want to compare the components in your 'dev branch' pages with those in your 'master branch'. Now is the time to switch branches and do a new `$ argus-eyes add <new-folder-name-2>`.

To compare the 2 folders you do `$ argus-eyes compare <new-folder-name> <new-folder-name-2>`, that's it! Argus-eyes now checks all supposedly identical screenshots for visual differences. If differences are found a new folder called **`diff_<new-folder-name>_<new-folder-name-2>`** is created. This folder contains images of the non-identical components, hightlighting their differences.

## Documentation

### Dependencies

You'll need the following software:

- Node.js ( At least v4.*). Download on [Nodejs.org](https://nodejs.org/).

- ImageMagick. Download on [ImageMagick.org](http://www.imagemagick.org/).  

_Note:_ For OS X we recommend installing ImageMagick via Homebrew. `$ brew install imagemagick`.  
_Note:_ You can check if ImageMagick's works, by trying the command `$ compare -version`.  
_Note:_ [GraphicsMagick](http://www.graphicsmagick.org/), a known fork of ImageMagick, can be used instead of ImageMagick since they use the same API.

### Setup the config file

Before argus-eyes can measure visual regression, it needs a list of pages and components. By
default argus-eyes expects an **`argus-eyes.json`** file in the current working directory.

_Note:_ You can use another config file using the **`--config`** argument, as described in [CLI options](#cli-options).

The config file must be a valid JSON object, containing *exactly* the following 2 arrays: **`pages`** and **`components`**. Page
objects require a name, url and list of components. Components require a name and a CSS-selector. Components can optionally
take a list of selectors of elements to ignore, this selector is appended to the component selector.

#### Argus-eyes.json format

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

#### Example config file

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

### Take screenshots

After setting up the JSON, argus-eyes can be put to work. First lets create screenshots of the components we specified. To do that, you use the **`argus-eyes add`** command.  

`$ argus-eyes add <new-folder-name>`  

It's probably best to name the folder semantically. E.g. `$ argus-eyes add develop`.

Argus-eyes now creates a folder called **`.argus-eyes/develop/`**. and puts screenshots of all components - specified in the **`argus-eyes.json`** file you created - in there.

Now, you can switch branches and create a new folder with screenshots. Argus-eyes can compare these 2 folders for visual differences.

### Test for visual regression

When 2 folders with screenshots are created, argus-eyes can compare them for visual regression. That's done by the **`argus-eyes compare`** command.

`$ argus-eyes compare <folder-name> <folder-name-2>`  

If visual differences between supposedly identical components are found, a new folder is created. This folder contains images of the non-identical components, highlighting their differences.

### Test on seperate branches

_Note:_ Please make sure to add **`'.argus-eyes'`** to your **`.gitignore`**!

Argus-eyes is especially useful for checking visual regression between different branches. Say you're working on a feature branch (assuming you're using the [Gitflow](http://nvie.com/posts/a-successful-git-branching-model/) convention) and you want to make sure the new CSS classes don't mess anything up. Easy!

**_feature/navigation branch_**
```bash
$ argus-eyes add feature/navigation
```

**_develop branch_**
```bash
$ argus-eyes add develop

$ argus-eyes compare feature/navigation develop
```

If any differences are found, the visual diffs are stored in: **`.argus-eyes/diff_feature-navigation_develop/`**

### CLI Options

Argus-eyes can take several optional arguments on the CLI. Because `add` and `compare` take positional arguments, CLI options must be placed as the last argument of a command (i.e. **`$ argus-eyes <operator> <positional argument 1> <~positional argument 2> <option>`**).

#### `--config=...`

_Default:_ **`argus-eyes.json`**

To use a different config file you can add the **`--config=<my-new-config-file-name>.json`** argument to the **`add`** command.

```
$ argus-eyes add feature/navigation --config=visual-regression.json
```

#### **`--threshold=...`**

_Default:_ 2

When comparing screenshots, argus-eyes checks if all pixels in screenshots are identical. The threshold is the percentage of different pixels in two supposedly identical images. Say you're only looking for big differences you can set a custom value for threshold using the **`--threshold=<value_between_0_and_100>`** argument.

```
$ argus-eyes compare develop_screenshots feature/navigation_screenshots --threshold=30
```

#### **`--base=..`**

_Default:_ **`.argus-eyes`**

Argus-eyes by default stores all screenshots in the **`.argus-eyes`** folder. To store screenshots in another directory you can use the **`--base=<my_new_folder>`** argument.

```
$ argus-eyes add develop_screenshots --base==visual-regression
```

#### **`--im=...`**

_Default:_ empty

ImageMagicks executables are expected in the **`PATH`** you're working in. You can check if the ImageMagick executables can be found by typing **`$ compare --version`**. If you want to change the path where argus-eyes looks for ImageMagicks executables you can use the **`--im=<the_new_path>`** argument.

_Note: the path needs to end with a slash._

```
$ argus-eyes add develop_screenshots --im=C:\PATH\
```

#### **`--verbose`**

_Default:_ off

Say you want to see exactly what argus-eyes does while adding and comparing screenshots you can use the **`--verbose`** argument.

```
$ argus-eyes compare develop feature/navigation --verbose
```

#### **`--no-color`**

_Default:_ on

You can turn off colored output using the **`--no-color`** argument.

```
$ argus-eyes add develop --no-color
```

#### **`--help`**

You can print all available commands and options using the **`--help`** argument.

```
$ argus-eyes --help
```

#### **`--version`**

You can check your argus-eyes version using the **`--version`** argument.

```
$ argus-eyes --version
```
or
```
$ argus-eyes -v
```

## Contributing

Want to contribute to argus-eyes? Cool! You can contribute in multiple ways.  
Found a bug? Thought of a new feature? Check the [contributing guidelines](CONTRIBUTING.md) and find out how to contribute.

## License

Released under the [Creative Commons 4.0 license](https://creativecommons.org/licenses/by/4.0/).
