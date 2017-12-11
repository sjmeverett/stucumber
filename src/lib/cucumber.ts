import DataTable from "./data-table";
import { Annotation } from "./parser";

export interface RuleHandler {
  (world: any, ...args: any[]): any;
}

export interface HookHandler {
  (world?: any, annotations?: string[]): any;
}

export enum HookType {
  BeforeFeatures,
  BeforeScenarios,
  AfterFeatures,
  AfterScenarios
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

  addHook(type: HookType, handler: HookHandler) {
    this.hooks.push({ type, handler });
  }

  private runHook(type: HookType, world?: any, annotations?: Annotation[]) {
    return Promise.all(
      this.hooks
        .filter(hook => hook.type === type)
        .map(hook => hook.handler.call(this, world, annotations))
    );
  }

  enterFeature(annotations: Annotation[]) {
    return this.runHook(HookType.BeforeFeatures, null, annotations);
  }

  enterScenario(world: any, annotations: Annotation[]) {
    return this.runHook(HookType.BeforeScenarios, world, annotations);
  }

  exitFeature(annotations: Annotation[]) {
    return this.runHook(HookType.AfterFeatures, null, annotations);
  }

  exitScenario(world: any, annotations: Annotation[]) {
    return this.runHook(HookType.AfterScenarios, world, annotations);
  }

  private compileTemplate(match: string, handler: RuleHandler) {
    const converters: ((x: string) => any)[] = [];

    const regex = match.replace(
      /\{([a-zA-Z-_]+)\}/g,
      (placeholder, typeName) => {
        const type = types[typeName];

        if (!type) {
          throw new Error(`Invalid placeholder '${placeholder}'`);
        }

        converters.push(type.converter);
        return type.regex;
      }
    );

    const convertHandler = (world, ...params: string[]) =>
      handler(
        world,
        ...params.map(
          (value, i) =>
            typeof converters[i] === "function" ? converters[i](value) : value
        )
      );

    return { regex: new RegExp(`^${regex}$`), handler: convertHandler };
  }

  defineCreateWorld(_createWorld: () => any): void {
    this._createWorld = _createWorld;
  }

  rule(world: any, str: string, data?: string[][]): any {
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
}

export const cucumber = new Cucumber();
