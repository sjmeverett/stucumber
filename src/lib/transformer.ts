import {Feature, Scenario, Clause, parse, Rule, RuleDeclaration} from './parser';

export default abstract class Transformer<T> {
  protected abstract transformFeature(filename: string, feature: Feature, ruleDeclarations: T[], scenarios: T[]): T;

  protected abstract transformRuleDeclaration(
    filename: string,
    feature: Feature,
    ruleDeclaration: RuleDeclaration,
    rules: T[]
  ): T;

  protected abstract transformScenario(
    filename: string,
    feature: Feature,
    scenario: Scenario,
    rules: T[]
  ): T;

  protected abstract transformRule(
    filename: string,
    feature: Feature,
    scenario: Scenario,
    rule: Rule,
    template?: boolean
  ): T;
  
  protected abstract transformFile(filename: string, file: T): string;

  transform(filename: string, source: string);
  transform(filename: string, feature: Feature);
  transform(filename: string, source: string | Feature) {
    const feature = typeof source === 'string' ? parse(source) : source;
    const background = feature.background || [];

    return this.transformFile(
      filename,
      this.transformFeature(
        filename,
        feature,
        feature.ruleDeclarations 
          ? feature.ruleDeclarations.map((ruleDeclaration) =>
            this.transformRuleDeclaration(
              filename,
              feature,
              ruleDeclaration,
              ruleDeclaration.rules.map((rule) => this.transformRule(filename, feature, null, rule, true))
            )
          )
          : [],
        feature.scenarios.map((scenario) =>
          this.transformScenario(
            filename,
            feature,
            scenario,
            [...background, ...scenario.rules].map((rule) => this.transformRule(filename, feature, scenario, rule))
          )
        )
      )
    );
  }
}
