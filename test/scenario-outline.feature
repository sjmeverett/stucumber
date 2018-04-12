Feature: foo
  Scenario Outline: this is a scenario outline
    Given that I have <given>
    When I <when>
    Then I <then>

    Examples:
      | given | when  | then |
      | abc   | "1 2" | -£*% |
