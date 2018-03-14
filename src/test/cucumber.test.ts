import Cucumber, { HookType } from '../lib/cucumber';
import DataTable from '../lib/data-table';

describe('Cucumber', () => {
  it('should pick the right rule', async () => {
    const cucumber = new Cucumber();
    const rule1 = jest.fn();
    const rule2 = jest.fn();
    const rule3 = jest.fn();
    const rule4 = jest.fn();

    cucumber.defineRule(/I have (\d+)/, rule1);
    cucumber.defineRule(/I don't have (\d+)/, rule2);
    cucumber.defineRule(/I might have (\d+)/, rule3);

    await cucumber.rule(null, 'I have 3');
    expect(rule1).toHaveBeenCalledTimes(1);
    expect(rule1).toHaveBeenCalledWith(null, '3');
    expect(rule2).not.toHaveBeenCalled();
    expect(rule3).not.toHaveBeenCalled();
  });

  it('should support the string template style', async () => {
    const cucumber = new Cucumber();
    const rule = jest.fn((world, str, int, float, word) => {
      expect(str).toBe('some sort of string');
      expect(int).toBe(-4);
      expect(float).toBe(3.14);
      expect(word).toBe('potatoes');
    });

    cucumber.defineRule(
      'string {string} int {int} float {float} word {word}',
      rule
    );

    await cucumber.rule(
      null,
      'string "some sort of string" int -4 float 3.14 word potatoes'
    );
    expect(rule).toHaveBeenCalled();
  });

  it('should support the named string template style', async () => {
    const cucumber = new Cucumber();
    const rule = jest.fn((world, params) => {
      expect(params.foo).toBe('some sort of string');
      expect(params.bar).toBe(-4);
    });

    cucumber.defineRule('string {foo:string} int {bar:int}', rule);
    await cucumber.rule(null, 'string "some sort of string" int -4');
    expect(rule).toHaveBeenCalled();
  });

  it('should run beforeAll hooks on enterFeature', () => {
    const cucumber = new Cucumber();

    const hook = jest.fn(function() {
      expect(this.annotations).toEqual([{ name: 'foo' }]);
    });

    const dummy = jest.fn();
    cucumber.addHook(HookType.BeforeFeatures, hook);
    cucumber.addHook(HookType.AfterFeatures, dummy);

    cucumber.enterFeature(<any>{
      annotations: [{ name: 'foo' }],
      name: 'test'
    });
    expect(hook).toHaveBeenCalledWith(null, [{ name: 'foo' }]);
    expect(dummy).not.toHaveBeenCalled();
  });

  it('should run beforeEach hooks on enterScenario', () => {
    const cucumber = new Cucumber();

    const hook = jest.fn(function() {
      expect(this.annotations).toEqual([{ name: 'foo' }]);
    });

    const dummy = jest.fn();
    cucumber.addHook(HookType.BeforeScenarios, hook);
    cucumber.addHook(HookType.AfterFeatures, dummy);

    cucumber.enterFeature(<any>{ name: 'test', annotations: [] });

    cucumber.enterScenario(1, <any>{
      annotations: [{ name: 'foo' }],
      name: 'test',
      steps: [],
      feature: { name: 'test', annotations: [] }
    });

    expect(hook).toHaveBeenCalledWith(1, [{ name: 'foo' }]);
    expect(dummy).not.toHaveBeenCalled();
  });

  it('should run afterAll hooks on exitFeature', () => {
    const cucumber = new Cucumber();

    const hook = jest.fn(function() {
      expect(this.annotations).toEqual([{ name: 'foo' }]);
    });

    const dummy = jest.fn();
    cucumber.addHook(HookType.AfterFeatures, hook);
    cucumber.addHook(HookType.BeforeFeatures, dummy);

    cucumber.exitFeature(<any>{ annotations: [{ name: 'foo' }] });
    expect(hook).toHaveBeenCalledWith(null, [{ name: 'foo' }]);
    expect(dummy).not.toHaveBeenCalled();
  });

  it('should run afterEach hooks on exitScenario', () => {
    const cucumber = new Cucumber();

    const hook = jest.fn(function() {
      expect(this.annotations).toEqual([{ name: 'foo' }]);
    });

    const dummy = jest.fn();
    cucumber.addHook(HookType.AfterScenarios, hook);
    cucumber.addHook(HookType.AfterFeatures, dummy);

    cucumber.enterFeature(<any>{ name: 'test', annotations: [] });

    cucumber.exitScenario(1, <any>{
      annotations: [{ name: 'foo' }],
      name: 'test',
      steps: [],
      feature: { name: 'test', annotations: [] }
    });

    expect(hook).toHaveBeenCalledWith(1, [{ name: 'foo' }]);
    expect(dummy).not.toHaveBeenCalled();
  });

  it('should wrap data arg in DataTable', async () => {
    const cucumber = new Cucumber();

    cucumber.defineRule('foo', (world, data) => {
      expect(data).toBeInstanceOf(DataTable);
    });

    await cucumber.rule(null, 'foo', [['1', '2']]);
  });

  it('should be able to create clones', async () => {
    const cucumber = new Cucumber();
    const rule1 = jest.fn();
    cucumber.defineRule('foo', rule1);

    const copy = cucumber.clone();
    const rule2 = jest.fn();
    copy.defineRule('bar', rule2);

    await copy.rule(null, 'foo');
    await copy.rule(null, 'bar');
    expect(rule1).toHaveBeenCalled();
    expect(rule2).toHaveBeenCalled();

    await expect(cucumber.rule(null, 'bar')).rejects.toBeTruthy();
  });

  it('rule should allow replacements to be specified', async () => {
    const cucumber = new Cucumber();

    cucumber.defineRule('foo 1 2 bar', world => {});

    await expect(
      cucumber.rule(null, 'foo <num> 2 <str>', null, {
        num: '1',
        str: 'bar'
      })
    ).resolves.toBeUndefined();
  });
});
