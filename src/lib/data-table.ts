export interface Hash<T> {
  [key: string]: T
}

export default class DataTable {
  constructor(private data: string[][]) {}

  raw() {
    return this.data;
  }

  asObjects(): Hash<string>[] {
    if (this.data.length < 1) {
      throw new Error('need at least 1 row');
    }

    const keys = this.data[0];

    return this.data.slice(1).map(row => {
      const obj: Hash<string> = {};

      if (row.length !== keys.length) {
        throw new Error('rows must be the same length');
      }
      
      row.forEach((cell, i) => {
        obj[keys[i]] = cell;
      });

      return obj;
    });
  }

  asKeyValuePairs(): Hash<string>;
  asKeyValuePairs<T>(mapValue: (value: string, key?: string) => T): Hash<T>;
  asKeyValuePairs<T>(mapValue?: (value: string, key?: string) => T) {
    const obj = {};

    this.data.forEach((row) => {
      const [key, value] = row;

      if (row.length !== 2) {
        throw new Error('expected every row to have length 2');
      }
      obj[key] = mapValue ? mapValue(value, key) : value;
    });

    return obj;
  }

  asList(): string[]
  asList<T>(mapValue: (value: string, i?: number) => T): T[]
  asList<T>(mapValue?: (value: string, i?: number) => T) {
    return this.data.map((row) => {
      if (row.length !== 1) {
        throw new Error('expected a table with exactly one column');
      }
      const cell = row[0];
      return mapValue ? mapValue(cell) : cell;
    });
  }
}
