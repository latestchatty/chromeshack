context("Instagram", () => {
    it("opens with navigable image carousel", () => {
        cy.visit("https://www.shacknews.com/chatty?id=39558333#item_39558333");

        cy.get("div.root>ul>li li.sel div.medialink")
            .first()
            .should("be.visible")
            .click()
            .get("div.embla")
            .should("be.visible")
            .and((carousel) => expect(carousel[0].offsetHeight).to.be.greaterThan(0));
        cy.get("div.media div.instagram__embed img")
            .should("be.visible")
            .and((img) => expect(img[0].naturalWidth).to.be.greaterThan(0));
        cy.get("div.media div.embla .embla__button--next")
            .click()
            .get("div.media div.embla__slide")
            .and((slides) => {
                expect(slides[1]).to.be.visible.and.to.have.class("is-selected");
            });
        cy.get(".is-selected img")
            .should("be.visible")
            .and((img) => expect(img[0].naturalWidth).to.be.greaterThan(0));
    });
});
