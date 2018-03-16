import Cucumber from '../lib/cucumber';
import GenericTransformer from '../lib/generic-transformer';
import * as fs from 'fs';
import * as path from 'path';

const cucumber = new Cucumber();

cucumber.defineCreateWorld(() => []);

cucumber.defineRule('I take the number {int}', (world, number) => {
  world.push(number);
});

cucumber.defineRule('I add them', world => {
  const a = world.pop();
  const b = world.pop();
  world.push(a + b);
});

cucumber.defineRule('I will have {int}', (world, number) => {
  expect(world[world.length - 1]).toEqual(number);
});

cucumber.defineRule('lots of data', (world, table) => {
  const obj = table.asObjects();

  expect(obj[0]).toEqual({
    'Header 1': 'Value 1a',
    'Header 2': 'Value 1b',
    'Header 3': 'Value 1c'
  });

  const raw = table.raw();

  expect(raw).toEqual([
    ['Header 1', 'Header 2', 'Header 3'],
    ['Value 1a', 'Value 1b', 'Value 1c'],
    ['Value 2a', 'Value 2b', 'Value 2c']
  ]);
});

cucumber.defineRule(/^I use (\d+) key-value pairs$/, (world, number, table) => {
  expect(number).toEqual('3');

  const obj = table.asKeyValuePairs();
  expect(obj['Key 2']).toEqual('Value 2');
});

cucumber.defineRule('I have a list', (world, table) => {
  const list = table.asList();
  expect(list).toEqual(['Value 1', 'Value 2', ' Value 3 ']);
});

describe('integration test', () => {
  const transformer = new GenericTransformer({
    scenarioFn: 'it',
    beforeAllFn: 'beforeAll',
    afterAllFn: 'afterAll',
    preamble: 'const _cucumber = cucumber.clone();'
  });

  const result = transformer.transform(
    'integration.feature',
    fs.readFileSync(path.join(__dirname, 'integration.feature'), 'utf8')
  );

  eval(result.toString());

  expect(cucumber.getResults()).toMatchSnapshot();
});
