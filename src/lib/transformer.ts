import {Feature, Scenario, Clause, parse} from './parser';

export default abstract class Transformer<T> {
  protected abstract transformFeature(filename: string, feature: Feature, scenarios: T[]): T;
  protected abstract transformScenario(filename: string, feature: Feature, scenario: Scenario, rules: T[]): T;
  protected abstract transformRule(filename: string, feature: Feature, scenario: Scenario, rule: Clause): T;

  transform(filename: string, source: string);
  transform(filename: string, feature: Feature);
  transform(filename: string, source: string | Feature) {
    const feature = typeof source === 'string' ? parse(source) : source;

    return this.transformFeature(
      filename,
      feature,
      feature.scenarios.map((scenario) =>
        this.transformScenario(
          filename,
          feature,
          scenario,
          scenario.rules.map((rule) => this.transformRule(filename, feature, scenario, rule))
        )
      )
    );
  }
}
