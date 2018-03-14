import Transformer from './transformer';
import {
  Feature,
  Scenario,
  Clause,
  Annotation,
  Rule,
  RuleDeclaration
} from './parser';
import { FeatureContext } from '.';

// TODO: upgrade when new version is published, source-map types are currently fucked
const SourceNode = require('source-map').SourceNode;

export interface GenericTransformerOptions {
  featureFn?: string;
  scenarioFn: string;
  beforeAllFn: string;
  afterAllFn: string;
  preamble?: string;
  getFeatureName?: (feature: Feature) => string;
  getScenarioName?: (feature: Feature, scenario: Scenario) => string;
}

export default class GenericTransformer extends Transformer<any> {
  protected options: GenericTransformerOptions;

  constructor(options: GenericTransformerOptions) {
    super();

    this.options = {
      getFeatureName: (feature: Feature) => 'Feature: ' + feature.name.value,
      getScenarioName: (feature: Feature, scenario: Scenario) =>
        scenario.name.value,
      preamble:
        'const {cucumber} = require("stucumber"); const _cucumber = cucumber.clone();',
      ...options
    };
  }

  protected transformFile(filename: string, file) {
    const { code, map } = new SourceNode(1, 1, filename, [
      this.options.preamble,
      file
    ]).toStringWithSourceMap({ file: filename });

    return (
      code +
      '\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,' +
      Buffer.from(map.toString(), 'utf8').toString('base64')
    );
  }

  private getContext(name: string, annotations: Annotation[], rules?: Rule[]) {
    const context: any = { name, annotations, meta: {} };
    let json = JSON.stringify(context);

    if (rules) {
      const stepsJson = JSON.stringify(
        rules.map(rule => ({
          name: rule.value,
          line: rule.location.line
        }))
      );

      json = `${json.slice(0, -1)}, "feature": feature, "steps": ${stepsJson}}`;
    } else {
      json = `${json.slice(0, -1)}, "filename": __filename}`;
    }

    return json;
  }

  protected transformFeature(
    filename: string,
    feature: Feature,
    ruleDeclarations,
    scenarios
  ) {
    let chunks = [
      `const feature = `,
      this.getContext(feature.name.value, feature.annotations),
      ';',
      `${this.options.beforeAllFn}(() => {`,
      ...ruleDeclarations,
      `_cucumber.enterFeature(feature);
      });`,
      `${this.options.afterAllFn}(() => _cucumber.exitFeature(feature));`,
      ...scenarios
    ];

    if (this.options.featureFn) {
      chunks = [
        this.options.featureFn,
        `(`,
        JSON.stringify(this.options.getFeatureName(feature)),
        `, () => {`,
        ...chunks,
        `});`
      ];
    }

    return new SourceNode(
      feature.name.location.line,
      feature.name.location.column,
      filename,
      chunks
    );
  }

  protected transformRuleDeclaration(
    filename: string,
    feature: Feature,
    ruleDeclaration: RuleDeclaration,
    rules
  ) {
    return new SourceNode(
      ruleDeclaration.template.location.line,
      ruleDeclaration.template.location.column,
      filename,
      [
        '_cucumber.defineRule(',
        JSON.stringify(ruleDeclaration.template.value),
        ', (world, params) => Promise.resolve()',
        ...rules,
        ');'
      ]
    );
  }

  protected transformScenario(
    filename: string,
    feature: Feature,
    scenario: Scenario,
    rules
  ) {
    return new SourceNode(
      scenario.name.location.line,
      scenario.name.location.column,
      filename,
      [
        this.options.scenarioFn,
        `(`,
        JSON.stringify(this.options.getScenarioName(feature, scenario)),
        `, () => {`,
        `const world = _cucumber.createWorld();`,
        `const scenario = `,
        this.getContext(
          scenario.name.value,
          scenario.annotations,
          scenario.rules
        ),
        `;`,
        `return _cucumber.enterScenario(world, scenario)`,
        ...[].concat(...rules),
        `.then(() => _cucumber.exitScenario(world, scenario));`,
        `});`
      ]
    );
  }

  protected transformRule(
    filename: string,
    feature: Feature,
    scenario: Scenario,
    rule: Rule,
    template?: boolean
  ) {
    return [
      `.then(() => `,
      new SourceNode(rule.location.line, rule.location.column, filename, [
        `_cucumber.rule(world, `,
        JSON.stringify(rule.value),
        ', ',
        rule.data && rule.data.length ? JSON.stringify(rule.data) : 'null',
        template ? ', params' : '',
        `)`
      ]),
      `)`
    ];
  }
}
