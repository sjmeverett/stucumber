import DataTable from "./data-table";
import { Annotation } from "./parser";

export interface TestContext {
  name: string;
  annotations: string[];
  meta: {[key: string]: any};
}

export interface FeatureContext extends TestContext {
}

export interface ScenarioContext extends TestContext {
  feature: FeatureContext;
}

export interface RuleHandler {
  (world: any, ...args: any[]): any;
}

export interface FeatureHookHandler {
  (this: FeatureContext, world?: any): any;
}

export interface ScenarioHookHandler {
  (this: ScenarioContext, world?: any, annotations?: Annotation[]): any;
}

export type HookHandler  = FeatureHookHandler | ScenarioHookHandler;

export enum HookType {
  BeforeFeatures,
  BeforeScenarios,
  AfterFeatures,
  AfterScenarios
}

interface FeatureHook {
  type: HookType.BeforeFeatures | HookType.AfterFeatures;
  handler: FeatureHookHandler;
}

interface ScenarioHook {
  type: HookType.BeforeScenarios | HookType.AfterScenarios;
  handler: ScenarioHookHandler;
}

interface Hook {
  type: HookType;
  handler: HookHandler;
}

interface Rule {
  regex: RegExp;
  handler: RuleHandler;
}

const types = {
  string: { regex: '"([^"]*)"' },
  int: { regex: "([-+]?\\d+)", converter: parseInt },
  float: { regex: "([-+]?\\d*(?:\\.\\d+)?)", converter: parseFloat },
  word: { regex: "([^\\s]+)" }
};

export default class Cucumber {
  private rules: Rule[] = [];
  private hooks: Hook[] = [];
  private _createWorld: () => any;

  defineRule(match: string, handler: RuleHandler);
  defineRule(match: RegExp, handler: RuleHandler);
  defineRule(match: string | RegExp, handler: RuleHandler) {
    if (match instanceof RegExp) {
      this.rules.push({ regex: match, handler });
    } else {
      this.rules.push(this.compileTemplate(match, handler));
    }
  }

  addHook(type: HookType.BeforeFeatures | HookType.AfterFeatures, handler: FeatureHookHandler);
  addHook(type: HookType.BeforeScenarios | HookType.AfterScenarios, handler: ScenarioHookHandler);
  addHook(type: HookType, handler: HookHandler) {
    this.hooks.push({ type, handler });
  }

  private runHook(type: HookType, world?: any, context?: ScenarioContext | FeatureContext) {
    const annotations = [];
    
    if (context) {
      annotations.push(...context.annotations);

      if ((context as ScenarioContext).feature) {
        annotations.push(...(context as ScenarioContext).feature.annotations)
      }
    }
    
    return Promise.all(
      this.hooks
        .filter(hook => hook.type === type)
        .map(hook => hook.handler.call(context, world, annotations))
    );
  }

  enterFeature(feature: FeatureContext) {
    return this.runHook(HookType.BeforeFeatures, null, feature);
  }

  enterScenario(world: any, scenario: ScenarioContext) {
    return this.runHook(HookType.BeforeScenarios, world, scenario);
  }

  exitFeature(feature: FeatureContext) {
    return this.runHook(HookType.AfterFeatures, null, feature);
  }

  exitScenario(world: any, scenario: ScenarioContext) {
    return this.runHook(HookType.AfterScenarios, world, scenario);
  }

  private compileTemplate(match: string, handler: RuleHandler) {
    const converters: ((x: string) => any)[] = [];
    const names: string[] = [];
    let usesNamedCaptures = false;

    const regex = match.replace(
      /\{(([a-zA-Z0-9-_]+):)?([a-zA-Z-_]+)\}/g,
      (placeholder, _, name, typeName) => {
        const type = types[typeName];

        if (!type) {
          throw new Error(`Invalid placeholder '${placeholder}'`);
        }

        converters.push(type.converter);
        names.push(name);
        usesNamedCaptures = usesNamedCaptures || !!name;
        return type.regex;
      }
    );

    const convertHandler = (world, ...params: string[]) => {
      params = params.map(
        (value, i) =>
          typeof converters[i] === "function" ? converters[i](value) : value
      );

      const namedParams = {};

      if (usesNamedCaptures) {
        params.forEach((value, i) => {
          if (names[i])
          namedParams[names[i]] = value;
        });
      }

      return usesNamedCaptures 
        ? handler(world, namedParams)
        : handler(world, ...params);
    };

    return { regex: new RegExp(`^${regex}$`), handler: convertHandler };
  }

  defineCreateWorld(_createWorld: () => any): void {
    this._createWorld = _createWorld;
  }

  rule(world: any, str: string, data?: string[][], params?: {[key: string]: any}): any {
    if (params) {
      str = str.replace(/<([^>]+)>/g, (_, key) => params[key]);
    }

    for (const rule of this.rules) {
      const match = str.match(rule.regex);

      if (match) {
        const args = [world, ...match.slice(1)];

        if (data) {
          args.push(new DataTable(data));
        }

        return Promise.resolve(rule.handler.apply(this, args));
      }
    }

    throw new Error(`Could not find matching rule: ${str}`);
  }

  createWorld(): any {
    return this._createWorld ? this._createWorld() : null;
  }

  clone(): Cucumber {
    const copy = new Cucumber();
    copy._createWorld = this._createWorld;
    copy.rules = this.rules.slice();
    copy.hooks = this.hooks.slice();
    return copy;
  }
}

export const cucumber = new Cucumber();
