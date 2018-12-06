import GenericTransformer from '../src/generic-transformer';
import { readFileSync } from 'fs';

describe('transformer', () => {
  it('should transform the AST jest-style', () => {
    const transformer = new GenericTransformer({
      featureFn: 'describe',
      scenarioFn: 'it',
      beforeEachFn: 'beforeEach',
      afterEachFn: 'afterEach',
      beforeAllFn: 'beforeAll',
      afterAllFn: 'afterAll'
    });

    const result = transformer.transform('test.feature', {
      name: {
        value: 'test feature',
        location: { line: 1, column: 1, offset: 0 }
      },
      background: [
        {
          value: 'background',
          location: { line: 2, column: 1, offset: 0 },
          keyword: ''
        }
      ],
      ruleDeclarations: [
        {
          template: {
            value: 'foo bar',
            location: { line: 3, column: 1, offset: 0 }
          },
          rules: [
            {
              value: 'test rule',
              location: { line: 4, column: 1, offset: 0 },
              keyword: ''
            }
          ]
        }
      ],
      scenarios: [
        {
          name: {
            value: 'test scenario',
            location: { line: 3, column: 1, offset: 0 }
          },
          rules: [
            {
              value: 'test rule',
              location: { line: 4, column: 1, offset: 0 },
              keyword: ''
            },
            {
              value: 'test rule 2',
              location: { line: 5, column: 1, offset: 0 },
              keyword: ''
            }
          ],
          annotations: []
        }
      ],
      annotations: []
    });

    expect(result).toMatchSnapshot();
  });

  it('should transform the AST ava style', () => {
    const transformer = new GenericTransformer({
      scenarioFn: 'test',
      beforeEachFn: 'test.beforeEach',
      afterEachFn: 'test.afterEach',
      beforeAllFn: 'test.before',
      afterAllFn: 'test.after',
      getScenarioName: (feature, scenario) =>
        `${feature.name.value} > ${scenario.name.value}`
    });

    const result = transformer.transform(
      'test.feature',
      readFileSync(__dirname + '/background.feature', 'utf8')
    );

    expect(result).toMatchSnapshot();
  });
});
