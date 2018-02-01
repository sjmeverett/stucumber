import DataTable from '../lib/data-table';

describe('DataTable', () => {
  it('should return the raw data', function () {
    const table = new DataTable([['1', '2'], ['3', '4']]);
    expect(table.raw()).toEqual([['1', '2'], ['3', '4']]);
  });

  it('should return objects', () => {
    const table = new DataTable([['a', 'b'], ['1', '2'], ['3', '4']]);
    expect(table.asObjects()).toEqual([{a: '1', b: '2'}, {a: '3', b: '4'}]);
  });

  it('should return pairs', () => {
    const table = new DataTable([['a', '1'], ['b', '2']]);
    expect(table.asKeyValuePairs()).toEqual({a: '1', b: '2'});
  });

  it('should return pairs with values mapped', () => {
    const table = new DataTable([['a', '1'], ['b', '2']]);
    expect(table.asKeyValuePairs((x) => parseInt(x))).toEqual({a: 1, b: 2});
  });

  it('should return a list', () => {
    const table = new DataTable([['a'], ['b'], ['c']]);
    expect(table.asList()).toEqual(['a', 'b', 'c']);
  });

  it('should return a list with the values mapped', () => {
    const table = new DataTable([['1'], ['2'], ['3']]);
    expect(table.asList((str) => parseInt(str))).toEqual([1, 2, 3]);
  });
});
