import {Feature, Scenario, Clause, parse} from './parser';

export interface FeatureTransformer<T> {
  (feature: Feature, scenarios: T[]): T;
}

export interface ScenarioTransformer<T> {
  (feature: Feature, scenario: Scenario, rules: T[]): T;
}

export interface RuleTransformer<T> {
  (feature: Feature, scenario: Scenario, rule: Clause): T;
}

export default class Transformer<T> {
  constructor(
    private featureTransformer: FeatureTransformer<T>,
    private scenarioTransformer: ScenarioTransformer<T>,
    private ruleTransformer: RuleTransformer<T>
  ) {}

  transform(source: string);
  transform(feature: Feature);
  transform(source: string | Feature) {
    const feature = typeof source === 'string'
      ? parse(source)
      : source;

    return this.featureTransformer(
      feature,
      feature.scenarios.map((scenario) =>
        this.scenarioTransformer(
          feature,
          scenario,
          scenario.rules.map((rule) => this.ruleTransformer(feature, scenario, rule))
        )
      )
    );
  }
}
