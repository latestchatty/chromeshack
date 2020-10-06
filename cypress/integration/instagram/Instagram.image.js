context("Instagram single image", () => {
    it("opens with single image", () => {
        cy.visit("https://www.shacknews.com/chatty?id=39693379#item_39693379");

        cy.get("div.medialink").click().should("have.class", "toggled");
        cy.get("div.media div.instagram__embed img")
            .should("be.visible")
            .and((img) => expect(img[0].naturalWidth).to.be.greaterThan(0));
    });
});
