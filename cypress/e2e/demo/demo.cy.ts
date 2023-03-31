describe("Search for products", () => {
  beforeEach(() => {
    cy.visit("https://demo.saleor.io/channel-pln/pl-PL/");
  });

  it("should search for products SRS_0405", () => {
    cy.get('[data-testid="categoriesListAll records"]').should("be.visible");
    cy.get('[data-testid="category"]').should("be.visible");
    cy.get('[data-testid="footerExternalLinksGraphQL API"]').should("be.visible");
  });
});
