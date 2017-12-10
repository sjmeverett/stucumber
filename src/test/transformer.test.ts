import Transformer from '../lib/transformer';

describe('transformer', () => {
  it('should transform an AST using given functions', () => {
    const transformer = new Transformer(
      (feature, scenarios) => `describe(${JSON.stringify(feature.name.value)}, () => {${scenarios.join('\n')}});`,
      (feature, scenario, rules) => `it(${JSON.stringify(scenario.name.value)}, () => {${rules.join('\n')}});`,
      (feature, scenario, rule) => `cucumber.rule(${JSON.stringify(rule.value)});` 
    );

    const result = transformer.transform({
      name: {value: 'test feature', location: null},
      scenarios: [
        {
          name: {value: 'test scenario', location: null},
          rules: [
            {value: 'test rule', location: null},
            {value: 'test rule 2', location: null}
          ],
          annotations: []
        }
      ],
      annotations: []
    });

    expect(result).toMatchSnapshot();
  });
});