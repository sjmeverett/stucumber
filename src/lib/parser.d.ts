
export interface Feature {
  name: Clause;
  scenarios: Scenario[];
  annotations: Annotation[];
  background?: Rule[];
  ruleDeclarations?: RuleDeclaration[];
  meta: {[key:string]: any};
}

export interface Annotation {
  name: string;
  arguments?: any[];
}

export interface RuleDeclaration {
  template: Clause;
  rules: Rule[];
}

export interface Scenario {
  name: Clause;
  rules: Rule[];
  annotations: Annotation[];
  meta: {[key:string]: any};
}

export interface Rule extends Clause {
  data?: any;
}

export interface Clause {
  value: string;
  location: {
    line: number;
    column: number;
    offset: number;
  }
}

export function parse(source: string): Feature;
