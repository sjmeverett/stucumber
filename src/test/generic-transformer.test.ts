import GenericTransformer from '../lib/generic-transformer';

describe('transformer', () => {
  it('should transform the AST', () => {
    const transformer = new GenericTransformer({
      featureFn: 'describe',
      scenarioFn: 'it',
      beforeAllFn: 'beforeAll',
      afterAllFn: 'afterAll'
    });

    const result = transformer.transform('test.feature', {
      name: {value: 'test feature', location: {line: 1, column: 1, offset: 0}},
      scenarios: [
        {
          name: {value: 'test scenario', location: {line: 2, column: 1, offset: 0}},
          rules: [
            {value: 'test rule', location: {line: 3, column: 1, offset: 0}},
            {value: 'test rule 2', location: {line: 4, column: 1, offset: 0}}
          ],
          annotations: []
        }
      ],
      annotations: []
    });

    expect(result).toMatchSnapshot();
  });
});