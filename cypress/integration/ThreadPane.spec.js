/// <reference types="Cypress" />

describe("Two Pane Layout", () => {
    before(() => {
        cy.loadExtensionDefaults(null, { enabled_scripts: ["thread_pane"] });
    });
    beforeEach(() => {
        cy.fixture("_shack_li_").then((li) => cy.setCookie("_shack_li_", li, { domain: "shacknews.com" }));
    });

    context("thread interactivity", () => {
        it("has valid cards", () => {
            cy.visit("https://www.shacknews.com/chatty");

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
            cy.visit("https://www.shacknews.com/chatty?id=40040022#item_40040022");

            const postid = "40040022";
            cy.get(`div#item_${postid} div.cs_thread_contains_user`).should("be.visible");
        });

        it("collapsed card interactions", () => {
            cy.get("div.root>ul>li .postmeta>a.closepost").click();

            const threadid = "40040022";
            cy.get(`div#item_${threadid}`).as("card").should("have.class", "collapsed");

            cy.get("div.root>ul>li .postmeta>a.showpost").click();
            cy.get("@card").should("not.have.class", "collapsed");
        });
    });
});
