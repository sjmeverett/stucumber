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
  = _ annotations:Annotations TFeature name:String NL Preamble? ruleDeclarations:RuleDeclarations background:Background? _ scenarios:Scenarios
	{ return { name, ruleDeclarations, background, scenarios, annotations } }

Annotation 
  = TAt attribute:Keyword "(" args:[^)]* ")" _
  { return { name: attribute, arguments: JSON.parse('[' + args.join('') + ']') } }
  / TAt attribute:Keyword _
  { return { name: attribute, arguments: [] } }

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

Background
  = _ TBackground NL rules:Rules
  { return rules }

RuleDeclarations
  = ruleDeclarations:RuleDeclaration*
  { return ruleDeclarations }

RuleDeclaration
  =  _ TRule template:String NL rules:Rules
  { return {template, rules} }

Scenarios
  = scenarios:Scenario*
  { return flatten(scenarios) }
          
Scenario 
  = _ annotations:Annotations TScenario name:String NL rules:Rules _
  { return { name, rules, annotations } }

  / _ annotations:Annotations TScenarioOutline name:String NL rules:Rules examples:Examples _
  { 
    return examples.map((example) => ({
      name: {value: expandTemplateString(name.value, example), location: name.location},
      rules: rules.map((template) => ({value: expandTemplateString(template.value, example), location: template.location, keyword: template.keyword})),
      annotations
    }));
  }

Rules
  = rules:Rule+
  { return rules }

Rule
  = _ keyword:Clause rule:String EOS data:Table
  { return Object.assign({}, rule, {data, keyword}) }

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
  = _ TTableSep cells:TableCell* EOS
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
TBackground = "Background:"
TRule = "Rule:"
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
  { 
    const cell = data.join('').trim();

    return /^"[^"]*"$/.test(cell)
      ? JSON.parse(cell)
      : cell;
  }

String
  = str:[^\n]+
  { 
    return {
      value: str.join('').trim(),
      location: location().start
    }
  }

EOS
  = NL
  / EOF

EOF
  = !. 

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
  