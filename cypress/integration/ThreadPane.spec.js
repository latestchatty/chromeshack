/// <reference types="Cypress" />

describe("Two Pane Layout", () => {
    context("thread interactivity", () => {
        before(() => {
            cy.window().then((win) => {
                win.localStorage["transient-data"] = JSON.stringify({ enabled_scripts: ["thread_pane"] });
            });
            cy.visit("https://www.shacknews.com/chatty");
        });

        it("has valid cards", () => {
            cy.get(".cs_thread_pane_card").as("cards");
            cy.get("@cards")
                .eq(0)
                .isInViewport()
                .and((card) => expect(card.find(".cs_thread_pane_root_body").text().length).to.be.greaterThan(0));
        });
        it("card click/shortcut jumps to post", () => {
            cy.log("second card clicked jumps to post");
            cy.get(".cs_thread_pane_card").as("cards");
            cy.get("@cards")
                .eq(1)
                .click()
                .then((card) => cy.get(`div.root#root_${card[0].id.substr(5)}`))
                .isInViewport();

            cy.log("first card shortcut jumps to post");
            cy.get("@cards").eq(0).find(".cs_thread_pane_shortcut").click();
            cy.get("@cards")
                .eq(0)
                .then((card) => cy.get(`div.root#root_${card[0].id.substr(5)} .fullpost`))
                .isInViewport();
        });

        it("reply icon is shown for logged user", () => {
            cy.fixture("_shack_li_").then((li) => cy.setCookie("_shack_li_", li, { domain: "shacknews.com" }));

            const postid = "40040022";
            cy.visit("https://www.shacknews.com/chatty?id=40040022#item_40040022");

            cy.get(`div#item_${postid} div.cs_thread_contains_user`).should("be.visible");
        });
    });
});
