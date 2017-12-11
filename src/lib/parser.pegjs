{
  function expandTemplateString(template, example) {
    return template.replace(/<([^>]+)>/g, (_, key) => example[key]);
  }

  function zip(keys, values) {
    const obj = {};

    for (let i = 0; i < keys.length; i++) {
      obj[keys[i]] = values[i];
    }

    return obj;
  }

  function flatten(arr) {
    const result = [];

    for (let element of arr) {
      Array.prototype.push.apply(result, Array.isArray(element) ? element : [element]);
    }

    return result;
  }
}

Feature
  = _ annotations:Annotations TFeature name:String NL Preamble? _ scenarios:Scenarios
	{ return { name, scenarios, annotations } }

Annotation 
  = TAt attribute:Keyword _
  { return attribute }

Annotations
  = Annotation*

Preamble
  = As Want Reason
  / As Want

As
  = _ TAs actor:String NL
  { return actor }

Want
  = _ TIWant want:String NL 
  { return want }

Reason
  = _ TSo reason:String NL
  { return reason }

Scenarios
  = scenarios:Scenario*
  { return flatten(scenarios) }
          
Scenario = _ annotations:Annotations TScenario name:String NL rules:Rules _
  { return { name, rules, annotations } }

  / _ annotations:Annotations TScenarioOutline name:String NL rules:Rules examples:Examples _
  { 
    return examples.map((example) => ({
      name: {value: expandTemplateString(name.value, example), location: name.location},
      rules: rules.map((template) => ({value: expandTemplateString(template.value, example), location: template.location})),
      annotations
    }));
  }

Rules
  = rules:Rule+
  { return rules }

Rule
  = _ Clause rule:String NL table:Table
  { return Object.assign({}, rule, {table}) }

Clause
  = TGiven
  / TWhen
  / TThen
  / TAnd
  / TStar
	
Examples
  = _ TExamples NL table:Table
  {
    const keys = table[0];
    const data = [];
    const rows = table.slice(1);

    for (const row of rows) {
      const rowData = zip(keys, row);
      data.push(rowData);
    }

    return data;
  }

Table
  = rows:TableRow*
  { return rows }

TableRow
  = _ TTableSep cells:TableCell* NL
  { return cells }

TableCell
  = cell:TTableCell TTableSep
  { return cell }

TFeature = "Feature:"
TAs = "As"
TIWant = "I want"

TSo
  = "So"
	/ "In order"

TScenario = "Scenario:"
TScenarioOutline = "Scenario Outline:"
TGiven = "Given"
TWhen = "When"
TThen = "Then"
TAnd = "And"
TExamples = "Examples:"
TTableSep = "|"
TStar = "*"
TAt = "@"

TTableCell
  = data:[^|\n]+
  { return data.join('').trim() }

String
  = str:[^\n]+
  { 
    return {
      value: str.join('').trim(),
      location: location().start
    }
  }

Keyword
  = str:[a-zA-Z0-9_-]+
  { return str.join('').trim() }

NL = "\n"

_ = WS Comment _
  / WS

Comment
  = "//" [^\n]* NL
  / "#" [^\n]* NL

WS "whitespace"
  = [ \t\n\r]*
  