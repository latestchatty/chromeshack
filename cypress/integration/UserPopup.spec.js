/// <reference types="Cypress" />

describe("UserPopup", () => {
    before(() => {
        cy.loadExtensionDefaults();
        cy.visit("https://www.shacknews.com/chatty?id=40148393#item_40148393").wait(500);
    });

    it("popup renders and toggles correctly", () => {
        cy.get("li.sel>.fullpost span.user").as("userLabel").click();
        cy.get("div.userDropdown")
            .as("dropdown")
            .get(".dropdown__container .dropdown__item")
            .as("dropdownItems")
            .should("be.visible");
        cy.get("@dropdownItems").eq(0).find("span").should("have.text", "shirif's Posts");
        cy.get("@userLabel").click();
        cy.get("@dropdown").should("not.be.visible");
    });

    it("popup mutates custom-filters", () => {
        cy.get("li.sel>.fullpost span.user").as("userLabel").click();
        cy.get(".dropdown__container .dropdown__item").as("dropdownItems");
        cy.get("@dropdownItems").eq(7).find("span").as("customFilter").should("have.text", "Add to Custom Filters");
        cy.get("@customFilter").click().should("have.text", "Remove from Custom Filters");
        cy.get("@customFilter").click().should("have.text", "Add to Custom Filters");
        cy.get("@userLabel").click();
    });

    it("popup mutates highlight-groups", () => {
        cy.get("li.sel>.fullpost span.user").as("userLabel").click();
        cy.get(".dropdown__container .dropdown__item").as("dropdownItems");
        cy.get("@dropdownItems")
            .eq(8)
            .find("span")
            .as("highlightGroupFriends")
            .should("have.text", "Add to Highlights Group: Friends");
        cy.get("@highlightGroupFriends").click().should("have.text", "Remove from Highlights Group: Friends");
        cy.get("@highlightGroupFriends").click().should("have.text", "Add to Highlights Group: Friends");
        cy.get("@userLabel").click();
    });
});
