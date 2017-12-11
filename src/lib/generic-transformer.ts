import Transformer from './transformer';
import {Feature, Scenario, Clause, Rule} from './parser';

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
      getScenarioName: (feature: Feature, scenario: Scenario) => scenario.name.value,
      preamble: 'const {cucumber} = require("stucumber");',
      ...options
    };
  }

  protected transformFile(filename: string, file) {
    const {code, map} = new SourceNode(1, 1, filename, [
      this.options.preamble,
      file
    ]).toStringWithSourceMap({file: filename});

    return (
      code +
      '\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,' +
      Buffer.from(map.toString(), 'utf8').toString('base64')
    );
  }

  protected transformFeature(filename: string, feature: Feature, scenarios) {
    let chunks = [
      `${this.options.beforeAllFn}(() => cucumber.enterFeature(${JSON.stringify(
        feature.annotations
      )}));`,
      `${this.options.afterAllFn}(() => cucumber.exitFeature(${JSON.stringify(
        feature.annotations
      )}));`,
      ...scenarios
    ];

    if (this.options.featureFn) {
      chunks = [
        this.applyAttributes(this.options.featureFn, feature.annotations),
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

  protected transformScenario(filename: string, feature: Feature, scenario: Scenario, rules) {
    return new SourceNode(scenario.name.location.line, scenario.name.location.column, filename, [
      this.applyAttributes(this.options.scenarioFn, scenario.annotations),
      `(`,
      JSON.stringify(this.options.getScenarioName(feature, scenario)),
      `, () => {`,
      `const world = cucumber.createWorld();`,
      `return cucumber.enterScenario(world, `,
      JSON.stringify([...feature.annotations, ...scenario.annotations]),
      `)`,
      ...[].concat(...rules),
      `.then(() => cucumber.exitScenario(world, `,
      JSON.stringify([...feature.annotations, ...scenario.annotations]),
      `));`,
      `});`
    ]);
  }

  protected transformRule(filename: string, feature: Feature, scenario: Scenario, rule: Rule) {
    return [
      `.then(() => `,
      new SourceNode(rule.location.line, rule.location.column, filename, [
        `cucumber.rule(world, `,
        JSON.stringify(rule.value),
        ', ',
        rule.data ? JSON.stringify(rule.data) : 'null',
        `)`
      ]),
      `)`
    ];
  }

  protected applyAttributes(name: string, attributes: string[]) {
    let attribute = '';

    if (attributes.indexOf('skip') > -1) {
      attribute = '.skip';
    } else if (attributes.indexOf('only') > -1) {
      attribute = '.only';
    }

    return name + attribute;
  }
}
