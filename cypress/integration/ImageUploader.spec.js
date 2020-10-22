/// <reference types="Cypress" />

context("Image Uploader", () => {
    it("app interactions", () => {
        win.localStorage["transient-data"] = JSON.stringify({ selected_upload_tab: "" });
        cy.visit("https://www.shacknews.com/chatty?id=40056583#item_40056583");

        cy.log("test tab switching and persistence");
        cy.get("#tab-container div.tab")
            .eq(1)
            .click()
            .then((tab) => expect(tab[0].id).to.eq("gfycatTab"));
        cy.reload();
        cy.get("#tab-container div.tab.active").then((tab) => expect(tab[0].id).to.eq("gfycatTab"));

        cy.log("test input states");
        cy.get("input#urlinput")
            .as("urlInput")
            .type("https://localhost/test.jpeg")
            .then((input) => expect(input[0].validity.patternMismatch).to.be.true);
        const validInput = "https://localhost.com/test.mp4";
        cy.get("@urlInput")
            .type(validInput)
            .then((input) => expect(input[0].validity.valid).to.be.true);
        cy.get("#tab-container div.tab").as("tabs").eq(0).click();
        cy.get("@urlInput")
            .should("have.text", validInput)
            .and((input) => expect(input[0].validity.valid).to.be.true);
        cy.get("@tabs").eq(2).click();
        cy.get("@urlInput").should("not.be.visible");
    });
});
