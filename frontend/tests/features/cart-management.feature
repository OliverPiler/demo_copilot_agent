Feature: Shopping cart management
  As a customer
  I want to manage products in my shopping cart
  So that I can review quantities and order totals before checkout

  Scenario: View an empty cart
    Given my shopping cart is empty
    When I open the shopping cart
    Then I see the empty-cart message
    And I can browse products

  Scenario: Add a product and open the cart from navigation
    Given I am viewing the product catalog
    When I add a product to my cart
    Then the navigation cart count reflects its quantity
    When I open the cart from the navigation
    Then I see the product, its quantity, and the order summary

  Scenario: Add the same product again
    Given my cart already contains a product
    When I add that product again from the catalog
    Then the cart combines both additions into one line item

  Scenario: Update a quantity and recalculate the order summary
    Given my cart contains a product
    When I update its quantity
    Then the line total, discount, shipping, and grand total are recalculated

  Scenario Outline: Reject an invalid cart quantity
    Given my cart contains a product
    When I change its quantity to "<quantity>" and update the cart
    Then I see a quantity validation message
    And the saved cart quantity remains unchanged

    Examples:
      | quantity |
      | 0        |
      | 1.5      |
      |          |

  Scenario: Remove a product from the cart
    Given my cart contains a product
    When I remove that product
    Then the product is removed from the cart
    And the navigation cart count returns to zero

  Scenario: Keep the cart after reloading the page
    Given my cart contains a product
    When I reload the page
    Then the product and its quantity remain in the cart

  Scenario Outline: Apply the shipping threshold
    Given my cart subtotal is <subtotal>
    When I open the shopping cart
    Then the shipping charge is <shipping>

    Examples:
      | subtotal | shipping |
      | $100.00  | $25.00   |
      | $100.01  | $0.00    |

  Scenario: Open the cart using the keyboard
    Given I am on the home page
    When I focus the shopping cart link and press Enter
    Then I land on the shopping cart page
