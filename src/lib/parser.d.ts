
export interface Feature {
  name: Clause;
  scenarios: Scenario[];
  annotations: Annotation[];
  background?: Rule[];
}

export interface Annotation {
  name: string;
  arguments?: any[];
}

export interface Scenario {
  name: Clause;
  rules: Rule[];
  annotations: Annotation[];
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
