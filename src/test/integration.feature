Feature: integration test
  Rule: I add the numbers {a:int} and {b:int}
    * I take the number <a>
    * I take the number <b>
    * I add them
  
  Scenario: adding
    Given I take the number 5
    And I take the number 3
    When I add them
    Then I will have 8
  
  @skip
  Scenario: skip
    * fail
  
  Scenario: lots of data
    Given lots of data
      | Header 1 | Header 2 | Header 3 |
      | Value 1a | Value 1b | Value 1c |
      | Value 2a | Value 2b | Value 2c |
    When I use 3 key-value pairs
      | Key 1 | Value 1 |
      | Key 2 | Value 2 |
      | Key 3 | Value 3 |
    And I have a list
      | Value 1 |
      | Value 2 |
      | " Value 3 " |

  Scenario: inline rules
    Given I add the numbers 2 and 7
    Then I will have 9

