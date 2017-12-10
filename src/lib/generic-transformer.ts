import Transformer from './transformer';
import {Feature, Scenario, Clause} from './parser';

// TODO: upgrade when new version is published, source-map types are currently fucked
const SourceNode = require('source-map').SourceNode;

export interface GenericTransformerOptions {
  featureFn: string;
  scenarioFn: string;
  beforeAllFn: string;
  afterAllFn: string;
}

export default class GenericTransformer extends Transformer<any> {
  constructor(protected options: GenericTransformerOptions) {
    super();
  }

  protected transformFeature(filename: string, feature: Feature, scenarios) {
    return new SourceNode(feature.name.location.line, feature.name.location.column, filename, [
      this.applyAttributes(this.options.featureFn, feature.annotations),
      `("Feature: " + `,
      JSON.stringify(feature.name.value),
      `, () => {`,
      `${this.options.beforeAllFn}(() => cucumber.enterFeature(${JSON.stringify(feature.annotations)}));`,
      `${this.options.afterAllFn}(() => cucumber.exitFeature(${JSON.stringify(feature.annotations)}));`,
      new SourceNode(feature.name.location.line, feature.name.location.column, filename, scenarios),
      `});`
    ]);
  }

  protected transformScenario(filename: string, feature: Feature, scenario: Scenario, rules) {
    return new SourceNode(scenario.name.location.line, scenario.name.location.column, filename, [
      this.applyAttributes(this.options.scenarioFn, scenario.annotations),
      `(`,
      JSON.stringify(scenario.name.value),
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

  protected transformRule(filename: string, feature: Feature, scenario: Scenario, rule: Clause) {
    return [
      `.then(() => `,
      new SourceNode(rule.location.line, rule.location.column, filename, [
        `cucumber.rule(world, `,
        JSON.stringify(rule.value),
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