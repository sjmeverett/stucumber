export interface Feature {
  name: Clause;
  scenarios: Scenario[];
  annotations: Annotation[];
  background?: Rule[];
  ruleDeclarations?: RuleDeclaration[];
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
}

export interface Rule extends Clause {
  keyword: string;
  data?: any;
}

export interface Clause {
  value: string;
  location: {
    line: number;
    column: number;
    offset: number;
  };
}

export function parse(source: string): Feature;
