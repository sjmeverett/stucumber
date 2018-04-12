Feature: declarative rules

  Rule: I enter {title:word} {forename:word} {surname:word} as my name
    * I enter "<title>" in title
    * I enter "<forename>" in forename
    * I enter "<surname>" in surname
  
  Scenario: enter name
    Given I enter Mr Arthur Dent as my name
