/// <reference types="Cypress" />

context("Two Pane Layout", () => {
    it("is interactive with threads", () => {
        cy.window().then((win) => {
            win.localStorage["transient-data"] = JSON.stringify({ enabled_scripts: ["thread_pane"] });
        });
        cy.visit("https://www.shacknews.com/chatty");

        cy.log("has valid cards");
        cy.get(".cs_thread_pane_card").eq(0).isInViewport().as("firstCard");
        cy.get(".cs_thread_pane_card").eq(1).isInViewport().as("secondCard");
        cy.get("@firstCard").and((card) =>
            expect(card.find(".cs_thread_pane_root_body").text().length).to.be.greaterThan(0),
        );

        cy.log("card click jumps to post");
        cy.get(".cs_thread_pane_card").eq(0).as("firstCard");
        cy.get("@secondCard")
            .click()
            .then((card) => cy.get(`div.root#root_${card[0].id.substr(5)}`))
            .isInViewport();

        cy.log("card shortcut jumps to post");
        cy.get(".cs_thread_pane_card").eq(0).as("firstCard");
        cy.get("@firstCard").find(".cs_thread_pane_shortcut").click();
        cy.get("@firstCard")
            .then((card) => cy.get(`div.root#root_${card[0].id.substr(5)} .fullpost`))
            .isInViewport();
    });
});
