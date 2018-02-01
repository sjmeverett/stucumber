# stucumber

A Gherkin parser and Cucumber-like implementation for JavaScript.  Used by [gherkin-jest](https://www.npmjs.com/package/gherkin-jest) and [stucumber-register](https://www.npmjs.com/package/stucumber-register).

## Overview

Gherkin allows you to write tests in sort of plain English:

```gherkin
Feature: calculator
  Scenario: adding
    Given I take the number 5
    And I take the number 3
    When I add them
    Then I will have 8
```

You define rules to support the tests in JavaScript, like so:

```js
import { cucumber } from 'stucumber';

cucumber.defineCreateWorld(() => []);

cucumber.defineRule('I take the number {int}', (world, number) => {
  world.push(number);
});

cucumber.defineRule('I add them', (world) => {
  const a = world.pop();
  const b = world.pop();
  world.push(a + b);
});

cucumber.defineRule('I will have {int}', (world, number) => {
  expect(world[world.length - 1]).to.equal(number);
});
```

`Given`, `When`, `Then`, `And` and `*` are all synonyms, and exist only to make your code more readable.

## Documentation

The package consists of several parts:
  * the `Cucumber` class, which is basically the test framework
  * the `DataTable` class, for representing tabular data
  * the `parse` function, which parses gherkin source and turns it into an AST
  * a `Transformer` abstract class and `GenericTransformer` implementation, for converting
    the AST into JavaScript
  * interfaces or representing the AST, e.g. `Feature`, `Scenario`, `Clause`

Roughly speaking, given the following gherkin:

```gherkin
Feature: calculator
  Scenario: adding
    Given I take the number 5
    And I take the number 3
    When I add them
    Then I will have 8
```

The `GenericTransformer` will output something like this, depending on the options:

```js
const {cucumber} = require('stucumber');

describe('Feature: calculator', () => {
  beforeAll(() => cucumber.enterFeature([]));
  afterAll(() => cucumber.exitFeature([]));

  it('adding', () => {
    const world = cucumber.createWorld();
    return cucumber
      .enterScenario(world, [])
      .then(() => cucumber.rule('I take the number 5'))
      .then(() => cucumber.rule('I take the number 3'))
      .then(() => cucumber.rule('I add them'))
      .then(() => cucumber.rule('I will have 8'))
      .then(() => cucumber.exitScenario(world, []));
  });
})
```

### Template strings

You can write your rules using the template string style notation:

```js
cucumber.defineRule('I have numbers {int} and {int}', (world, a, b) => {
  world.a = a;
  world.b = b;
});
```

There are 4 types that can be used as placeholders:

  * `{int}` - matches an integer (`[-+]?\d+`) and runs `parseInt` on it before passing into your handler
  * `{float}` - matches a floating point number (`[-+]?\d*(\.\d+)?`) and runs `parseFloat` on it before passing on
  * `{word}` - matches a bunch of characters up to a whitespace character (`[^\s]+`)
  * `{string}` - matches a double-quoted string and returns only the contents of the string (`"([^"]+)"`)

If you give the templates names, then they are passed as an object parameter instead:

```js
cucumber.defineRule('I have numbers {a:int} and {b:int}', (world, params) => {
  world.a = params.a;
  world.b = params.b;
});
```

###  Promises

Any rule can return a promise and it will be awaited before processing the next rule.

### Annotations

You can prefix any feature or scenario with any number of annotations, which consist of a keyword prefixed by an `@` symbol.
The annotations can optionally have arguments.

```gherkin
@someAnnotation
Feature: annotations

  @anotherAnnotation(1, "a")
  Scenario: some scenario
    * ...
```


### Hooks

You can register functions to handle various hooks:

  * `HookType.BeforeFeatures` - runs once at the beginning of each feature
  * `HookType.BeforeScenarios` - runs at the beginning of each scenario, just after the call to `createWorld`
  * `HookType.AfterFeatures` - runs once at the end of each feature
  * `HookType.AfterScenarios` - runs at the end of each scenario

To register a handler, call `cucumber.addHook`:

```js
cucumber.addHook(HookType.BeforeFeatures, function (world, annotations) {
  // do some stuff
})
```

The handler functions get two parameters:

  * `world` - the world object returned from `createWorld` - for `BeforeAll` and `AfterAll` this is not relevant and is always `null`
  * `annotations` - an array of any annotations defined on the feature and/or scenario (if relevant)

You can use the annotations parameter to do custom setup behaviour depending on annotations set on the test.

The context of the hook handling function (i.e., `this`) will be the current feature or scenario, depending on the hook type.


### Data tables

You can define data tables in your specs like so:

```gherkin
Feature: Using tables
  Scenario: lots of data
    Given lots of data
      | Header 1 | Header 2 | Header 3 |
      | Value 1a | Value 1b | Value 1c |
      | Value 2a | Value 2b | Value 2c |
    When I use 3 key-value pairs
      | Key 1 | Value 1 |
      | Key 2 | Value 2 |
      | Key 3 | Value 3 |
    And I have a list
      | Value 1 |
      | Value 2 |
      | Value 3 |
    Then I can access all that data
```

And write rules for them like so:

```js
cucumber.defineRule('lots of data', (world, table) => {
  const obj = table.asObjects();

  expect(obj[0]).toEqual({
    'Header 1': 'Value 1a',
    'Header 2': 'Value 1b',
    'Header 3': 'Value 1c'
  });

  const raw = table.raw();

  expect(raw).toEqual([
     [ 'Header 1', 'Header 2', 'Header 3' ],
     [ 'Value 1a', 'Value 1b', 'Value 1c' ],
     [ 'Value 2a', 'Value 2b', 'Value 2c' ],
  ])
});

cucumber.defineRule(/^I use (\d+) key-value pairs$/, (world, number, table) => {
  expect(number).toEqual(3);

  const obj = table.asKeyValuePairs();
  expect(obj['Key 2']).toEqual('Value 2');
});

cucumber.defineRule('I have a list', (world, table) => {
  const list = table.asList();
  expect(list).toEqual(['Value 1', 'Value 2', 'Value 3']);
});
```

Leading and trailing spaces are automatically trimmed, which you can get round by enclosing the value in quotes.
Because values with a quote character at the start and end will be treated as strings, if you need to keep the
quote characters, you must put another pair of escaped quotes inside the string.

```gherkin
| " value with surrounding spaces " |
| "\"value with quotes at start and end\"" |
```

See the [`DataTable` class](#datatable-class) for more information.

### Scenario outlines

A simlar concept not to be confused with data tables is the scenario outline:

```gherkin
Scenario Outline: acceptable numbers should be accepted (<number>)
  Given I enter the value "<number>"
  When I click next
  Then I should not see errors

  Examples:
  | number |
  | 1      |
  | 123456 |
  | 1.2    |
  | .123   |
  | -1234  |
  | -12.34 |
  | -.1234 |
```

This allows you to write a kind of templated scenario, with gaps left for data that will be filled
in from the "Examples" table.  This table is read as a header line defining the variable names,
followed by rows with columnar data.

The parser will output a regular scenario for each (non-header) row in the table, with any variable
in angle brackets replaced by its value in the table for that row.

This way you can test a load of different inputs with relatively little typing.

Pro-tip: the parser replaces angle bracket substitutions anywhere within the scenario including the title -
it's a good idea to put a variable substitution in the title so you can easily see which ones have failed.

### Background steps

You can define steps that will run before each scenario, using the `Background:` keyword:

```gherkin
Background:
  Given I log in as joe@example.com
  And I go to the page

Scenario:
  Given I do a thing
```

The steps under `Background:` will be prepended to each scenario, and will use the same world as that scenario.

### Inline rules

You can define a rule in the feature file itself.  This is useful for making short rules out of repeated steps.  E.g.:

```
  Rule: I enter {title:word} {forename:word} {surname:word} as my name
    * I enter "<title>" in title
    * I enter "<forename>" in forename
    * I enter "<surname>" in surname
  
  Scenario: enter name
    Given I enter Mr Arthur Dent as my name
```

The rule is defined using the `Rule:` keyword, and can match arguments using the named template syntax.  These arguments
are then substituted into the "sub" rules using the angle bracket syntax.

Rules are scoped to the feature file.

## API

### `Cucumber` class

The JavaScript behind the Gherkin, for defining rules etc.

```js
import { Cucumber } from 'stucumber';
```

The methods below are meant to be called by people writing tests.  The other methods on
the class are called by translated gherkin tests.

**`defineCreateWorld(_createWorld: () => any): void`**

Defines a factory function for creating a "world", which is passed to every rule.  
This should be some object which holds the context of your test.

Parameters:
  
  * `_createWorld` - a function which returns an instance of a world, whatever
  that might be

**`defineRule(match: string, handler: RuleHandler): void`**\
**`defineRule(match: RegExp, handler: RuleHandler): void`**

Defines a rule. All rules, whether `Given`, `When`, `Then` or `And` are treated
the same way.  When a rule matches `match`, the `handler` function will be called.

Parameters:

  * `match` - either a string or regex that defines what the rule will match
  * `handler` - a function to execute when the rule is matched (see
  [`RuleHandler`](#rulehandler))

The first argument to the handler is always the `world` instance.

If `match` is a string, it can contain placeholders for matched arguments (see
[template strings](#template-strings)).  The values matched by the placeholders
will be passed to the handler in the order they appear in the string.

If `match` is a `RegExp`, any capturing groups will be passed as separate arguments
to the handler.

**`addHook(type: HookType, handler: HookHandler): void`**

Adds a hook, i.e., a function which will run before or after features or
scenarios.

Parameters:

  * `type` - the type of hook, see [`HookType`](#hooks)
  * `handler` - the function that will run, see [`HookHandler`](#hooks)

### `RuleHandler`

```js
import {RuleHandler} from 'stucumber';
```

Interface representing a handler function for a rule.  The first argument is `world`, the
value returned from the `createWorld` function.  Subsequent arguments are the values
for the capturing groups (or placeholders) defined for the rule.  The final argument is a
the data table if defined.

### `DataTable` class

Represents a data table.

**`raw(): string[][]`**

Returns the raw table data, as an array of rows of data, themselves arrays of cells.

**`asObjects(): Hash<string>[]`**

Treats the first row as a header containing the names of the columns, and returns
an array of objects based on those names.  For example, given the following table:

```
| foo | bar |
| 1   | 2   |
| 3   | 4   |
```

The following value will be returned:

```js
[
  {foo: '1', bar: '2'},
  {foo: '3', bar: '4'}
]
```

**`asKeyValuePairs(): Hash<string>`**
**`asKeyValuePairs<T>(mapValue: (value: string, key?: string) => T): Hash<T>`**

Expects a 2 column table, where the first column represents keys and the second
represents values, and returns an object containing that data.

For example, given the following table:

```
| foo | 1  |
| bar | 2  |
| baz | 3  |
```

The following value will be returned:

```js
{foo: '1', bar: '2', baz: '3'}
```

Optionally, you can provide a function to convert the values:

```js
const obj = data.asKeyValuePairs((value) => parseInt(value));
```

**`asList(): string[]`**
**`asList<T>(mapValue: (value: string, i?: number) => T): T[]`**

Expects a 1 column table and returns the values as an array.  Optionally, you can
provide a function to convert the values, e.g.:

```js
const list = data.asList((value) => parseInt(value));
```

Given the following data table:

```
| 1 |
| 2 |
| 3 |
```

The following value will be returned:

```
[1, 2, 3]
```

### Background steps

You can define steps that will run before each scenario, using the `Background:` keyword:

```gherkin
Background:
  Given I log in as joe@example.com
  And I go to the page

Scenario:
  Given I do a thing
```

The steps under `Background:` will be prepended to each scenario, and will use the same world as that scenario.

## Licence

ISC.  Do what you like, don't sue me.  Please consider sharing improvements you make.
