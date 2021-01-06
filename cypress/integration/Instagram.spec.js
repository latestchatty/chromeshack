/// <reference types="Cypress" />

describe("Instagram", () => {
    context("interactive with media in DOM", () => {
        it("opens with single image", () => {
            cy.visit("https://www.shacknews.com/chatty?id=39693379#item_39693379");
            cy.get("div.medialink").click();
            cy.get("div.media div.instagram__embed img")
                .should("be.visible")
                .and((img) => expect(img[0].naturalWidth).to.be.greaterThan(0));
        });
        it("opens with single video", () => {
            cy.visit("https://www.shacknews.com/chatty?id=40233347#item_40233347");
            cy.get("li li.sel div.medialink").click();
            cy.get("div.media div.instagram__embed video").and((video) => {
                expect(video[0].paused).eq(false);
                expect(video[0].muted).eq(true);
                expect(video[0].videoWidth).to.be.greaterThan(0);
            });
        });
        it("opens with navigable image carousel", () => {
            cy.visit("https://www.shacknews.com/chatty?id=39558333#item_39558333");
            cy.get("li li.sel div.medialink")
                .eq(0)
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
});
