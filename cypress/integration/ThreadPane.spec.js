/// <reference types="Cypress" />

context("Two Pane Layout", () => {
    before(() => {
        cy.window().then((win) => {
            win.localStorage["transient-opts"] = JSON.stringify({ defaults: true });
            win.localStorage["transient-data"] = JSON.stringify({
                enabled_scripts: ["thread_pane"],
                enabled_suboptions: ["testing_mode"],
            });
        });

        cy.visit("https://www.shacknews.com/chatty");
    });

    it("has valid cards", () => {
        cy.get(".cs_thread_pane_card").eq(0).isInViewport().as("firstCard");
        cy.get("@firstCard").and((card) =>
            expect(card.find(".cs_thread_pane_root_body").text().length).to.be.greaterThan(0),
        );
    });

    it("card click jumps to post", () => {
        cy.get(".cs_thread_pane_card").eq(0).as("firstCard");
        cy.get("@firstCard")
            .click()
            .then((card) => cy.get(`div.root#root_${card[0].id.substr(5)}`))
            .isInViewport();
    });

    it("shortcut jumps to post", () => {
        cy.get(".cs_thread_pane_card").eq(0).as("firstCard");
        cy.get("@firstCard").find(".cs_thread_pane_shortcut").click();
        cy.get("@firstCard")
            .then((card) => cy.get(`div.root#root_${card[0].id.substr(5)} .fullpost`))
            .isInViewport();
    });
});
