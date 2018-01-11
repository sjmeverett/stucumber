import Cucumber, { HookType } from '../lib/cucumber';
import DataTable from '../lib/data-table';

describe('Cucumber', () => {
  it('should pick the right rule', () => {
    const cucumber = new Cucumber();
    const rule1 = jest.fn();
    const rule2 = jest.fn();
    const rule3 = jest.fn();
    const rule4 = jest.fn();

    cucumber.defineRule(/I have (\d+)/, rule1);
    cucumber.defineRule(/I don't have (\d+)/, rule2);
    cucumber.defineRule(/I might have (\d+)/, rule3);

    cucumber.rule(null, 'I have 3');
    expect(rule1).toHaveBeenCalledTimes(1);
    expect(rule1).toHaveBeenCalledWith(null, '3');
    expect(rule2).not.toHaveBeenCalled();
    expect(rule3).not.toHaveBeenCalled();
  });

  it('should support the string template style', () => {
    const cucumber = new Cucumber();
    const rule = jest.fn((world, str, int, float, word) => {
      expect(str).toBe('some sort of string');
      expect(int).toBe(-4);
      expect(float).toBe(3.14);
      expect(word).toBe('potatoes');
    });

    cucumber.defineRule('string {string} int {int} float {float} word {word}', rule);
    cucumber.rule(null, 'string "some sort of string" int -4 float 3.14 word potatoes');
    expect(rule).toHaveBeenCalled();
  });

  it('should support the named string template style', () => {
    const cucumber = new Cucumber();
    const rule = jest.fn((world, params) => {
      expect(params.foo).toBe('some sort of string');
      expect(params.bar).toBe(-4);
    });

    cucumber.defineRule('string {foo:string} int {bar:int}', rule);
    cucumber.rule(null, 'string "some sort of string" int -4');
    expect(rule).toHaveBeenCalled();
  });

  it('should run beforeAll hooks on enterFeature', () => {
    const cucumber = new Cucumber();
    const hook = jest.fn();
    const dummy = jest.fn();
    cucumber.addHook(HookType.BeforeFeatures, hook);
    cucumber.addHook(HookType.AfterFeatures, dummy);

    cucumber.enterFeature([{name: 'foo'}]);
    expect(hook).toHaveBeenCalledWith(null, [{name: 'foo'}]);
    expect(dummy).not.toHaveBeenCalled();
  });
  
  it('should run beforeEach hooks on enterScenario', () => {
    const cucumber = new Cucumber();
    const hook = jest.fn();
    const dummy = jest.fn();
    cucumber.addHook(HookType.BeforeScenarios, hook);
    cucumber.addHook(HookType.AfterFeatures, dummy);

    cucumber.enterScenario(1, [{name: 'foo'}]);
    expect(hook).toHaveBeenCalledWith(1, [{name: 'foo'}]);
    expect(dummy).not.toHaveBeenCalled();
  });
  
  it('should run afterAll hooks on exitFeature', () => {
    const cucumber = new Cucumber();
    const hook = jest.fn();
    const dummy = jest.fn();
    cucumber.addHook(HookType.AfterFeatures, hook);
    cucumber.addHook(HookType.BeforeFeatures, dummy);

    cucumber.exitFeature([{name: 'foo'}]);
    expect(hook).toHaveBeenCalledWith(null, [{name: 'foo'}]);
    expect(dummy).not.toHaveBeenCalled();
  });
  
  it('should run afterEach hooks on exitScenario', () => {
    const cucumber = new Cucumber();
    const hook = jest.fn();
    const dummy = jest.fn();
    cucumber.addHook(HookType.AfterScenarios, hook);
    cucumber.addHook(HookType.BeforeFeatures, dummy);

    cucumber.exitScenario(1, [{name: 'foo'}]);
    expect(hook).toHaveBeenCalledWith(1, [{name: 'foo'}]);
    expect(dummy).not.toHaveBeenCalled();
  });

  it('should wrap data arg in DataTable', () => {
    const cucumber = new Cucumber();

    cucumber.defineRule('foo', (world, data) => {
      expect(data).toBeInstanceOf(DataTable);
    });

    cucumber.rule(null, 'foo', [['1', '2']]);
  });

  it('should be able to create clones', () => {
    const cucumber = new Cucumber();
    const rule1 = jest.fn();
    cucumber.defineRule('foo', rule1);
    
    const copy = cucumber.clone();
    const rule2 = jest.fn();
    copy.defineRule('bar', rule2);

    copy.rule(null, 'foo');
    copy.rule(null, 'bar');
    expect(rule1).toHaveBeenCalled();
    expect(rule2).toHaveBeenCalled();

    expect(() => cucumber.rule(null, 'bar')).toThrow();
  });

  it('rule should allow relacements to be specified', () => {
    const cucumber = new Cucumber();

    cucumber.defineRule('foo 1 2 bar', (world) => {});

    expect(() => cucumber.rule(null, 'foo <num> 2 <str>', null, {
      num: '1',
      str: 'bar'
    })).not.toThrow();
  });
});
