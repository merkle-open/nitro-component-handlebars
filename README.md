# Nitro Component Handlebars Helper

[![npm version](https://badge.fury.io/js/%40namics%2Fnitro-component-handlebars.svg)](https://badge.fury.io/js/%40namics%2Fnitro-component-handlebars)
[![Build Status](https://travis-ci.org/namics/nitro-component-handlebars.svg?branch=master)](https://travis-ci.org/namics/nitro-component-handlebars)
[![Coverage Status](https://coveralls.io/repos/github/namics/nitro-component-handlebars/badge.svg?branch=master)](https://coveralls.io/github/namics/nitro-component-handlebars?branch=master)
[![Codestyle](https://img.shields.io/badge/codestyle-namics-green.svg)](https://github.com/namics/eslint-config-namics)

This helper allows to render a nitro component using handlebars

## Installation

```bash
npm i --save-dev @namics/nitro-component-handlebars
```

## Usage

```js
const componentHandlebarsHelper = require('@namics/nitro-component-handlebars');
module.exports = componentHandlebarsHelper({
    rootDirectory: '/path/to/nitro/root'
})
```

## Template usage

### Default

The following code will render `components/atoms/button/button.hbs`:

```
{{component "components/atoms/button"}}
```

### Child elements

The following code will set the value of `{{children}}` to `'Click me'`:

```
{{#component "components/atoms/button"}}
    Click me
{{/component}}
```

### Attributes

The following code will set the value of `{{size}}` to `'xl'`:

```
{{component "components/atoms/button" size="xl"}}
```

### Data files

The following code will set the template variables to the content of 
`components/atoms/button/_data/demo.json`:


```
{{component "components/atoms/button" data-file="demo.json"}}
```

### Rendering foreign modules

The following code will render a component from another node_module
e.g. `node_modules/base-pattern/components/atoms/button/button.json`

```
{{component "~base-pattern/components/atoms/button"}}
```


# Contribution

You're free to contribute to this project by submitting [issues](https://github.com/namics/nitro-component-handlebars/issues) and/or [pull requests](https://github.com/namics/nitro-component-handlebars/pulls). This project is test-driven, so keep in mind that every change and new feature should be covered by tests.
This project uses the [![Codestyle](https://img.shields.io/badge/codestyle-namics-green.svg)](https://github.com/namics/eslint-config-namics).

# License

This project is licensed under [MIT](https://github.com/namics/nitro-component-handlebars/blob/master/LICENSE).
