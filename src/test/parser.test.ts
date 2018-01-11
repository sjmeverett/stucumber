import { parse } from "../lib/parser";
import { readFileSync } from "fs";

describe("Parser", () => {
  it("should parse a standard scenario", () => {
    const result = parse(readFileSync(__dirname + '/scenario.feature', 'utf8'));
    expect(result).toMatchSnapshot();
  });

  it("should parse a scenario outline", () => {
    const result = parse(readFileSync(__dirname + '/scenario-outline.feature', 'utf8'));
    expect(result).toMatchSnapshot();
  });

  it("should parse a scenario with annotations", () => {
    const result = parse(readFileSync(__dirname + '/annotations.feature', 'utf8'));
    expect(result).toMatchSnapshot();
  });

  it("should parse a scenario with data tables", () => {
    const result = parse(readFileSync(__dirname + '/data-table.feature', 'utf8'));
    expect(result).toMatchSnapshot();
  });
  it("should parse a feature with docstring", () => {
    const result = parse(readFileSync(__dirname + '/doc-string.feature', 'utf8'));
    expect(result).toMatchSnapshot();
  });

  it("should parse a feature with a background", () => {
    const result = parse(readFileSync(__dirname + '/background.feature', 'utf8'));
    expect(result).toMatchSnapshot();
  });

  it("should parse a feature with no newline at the end of the file", () => {
    const result = parse(readFileSync(__dirname + '/no-newline.feature', 'utf8'));
    expect(result).toMatchSnapshot();
  });
});
