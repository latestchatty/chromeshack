context("Instagram single video", () => {
    it("opens with single video", () => {
        cy.viewport(768, 1080);
        cy.visit("https://www.shacknews.com/chatty?id=39927836#item_39927836");

        cy.get("div.root>ul>li li.sel div.medialink").click().should("have.class", "toggled");
        cy.get("div.media div.instagram__embed video").and((video) => {
            expect(video[0].paused).eq(false);
            expect(video[0].muted).eq(true);
            expect(video[0].videoWidth).to.be.greaterThan(0);
        });
    });
});
