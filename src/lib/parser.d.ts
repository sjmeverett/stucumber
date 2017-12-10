
export interface Feature {
  name: Clause;
  scenarios: Scenario[];
  annotations: string[];
}

export interface Scenario {
  name: Clause;
  rules: Clause[];
  annotations: string[];
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
