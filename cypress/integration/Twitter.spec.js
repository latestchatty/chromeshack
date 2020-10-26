/// <reference types="Cypress" />

describe("Twitter", () => {
    before(() => cy.loadExtensionDefaults());

    context("interactive with media in the DOM", () => {
        it("single image tweet", () => {
            cy.visit("https://www.shacknews.com/chatty?id=39410177#item_39410177");
            cy.get("li li.sel div.medialink").click();
            cy.get(".twitter__media__content img").and((img) =>
                expect(img[0].src).to.eq("https://pbs.twimg.com/media/ES7Pdy9XkAcY7vV.jpg"),
            );
        });
        it("single video tweet that autopauses", () => {
            cy.visit("https://www.shacknews.com/chatty?id=33390347#item_33390347");
            cy.get("li li.sel div.medialink").click();
            cy.get(".twitter__media__content video").as("twitterVid");
            cy.get("@twitterVid").and((video) => {
                expect(video).to.be.visible;
                expect(video[0].paused).eq(false);
            });
            cy.get("div.footer-left div.logo.alt").first().scrollIntoView();
            cy.get("@twitterVid").and((video) => expect(video[0].paused).eq(true));
            cy.get("@twitterVid")
                .scrollIntoView()
                .and((video) => expect(video[0].paused).eq(false));
        });
        it("two-image carousel", () => {
            cy.visit("https://www.shacknews.com/chatty?id=33363191#item_33363191");

            cy.get("div.medialink").click();
            cy.get(".twitter__text__content>span").contains(`Coincidence? I don't think so.`);
            cy.get(".twitter__text__content a").and((link) =>
                expect(link[0].href).eq("https://twitter.com/hashtag/StarWars?src=hash"),
            );
            cy.get("div.media .embla")
                .scrollIntoView()
                .should("be.visible")
                .and((carousel) => expect(carousel).to.be.visible);
            cy.get("div.media .embla__button--next").click();
            cy.get(".embla__slide.is-selected").then((slide) => expect(slide).to.be.visible);
        });
        it("quoted tweet", () => {
            cy.visit("https://www.shacknews.com/chatty?id=33360185#item_33360185");
            cy.get("div.medialink").click();
            cy.get(".twitter__text__content").should(
                "contain",
                "Been working real hard on my game everything is alive now & running real fast almost video time am on the last task!",
            );
            cy.get(".twitter__quote__text__content>span").and((span) =>
                expect(span[0].innerText).contains(
                    "I am proud/pumped to say I am on my last task & then I begin cutting the first ",
                ),
            );
            cy.get(".twitter__quote__text__content>span>a").and((link) =>
                expect(link[0].href).contains("https://twitter.com/hashtag/CorpsesNSouls?src=hash"),
            );
        });
        it("quoted tweet with single image", () => {
            cy.window().then((win) => {
                // enable "Show Twitter threads when opening Twitter links" option
                win.localStorage["transient-data"] = JSON.stringify({ enabled_suboptions: ["sl_show_tweet_threads"] });
            });
            cy.visit("https://www.shacknews.com/chatty?id=33437805#item_33437805");
            cy.get("div.medialink").scrollIntoView().click();
            cy.get(".twitter__container").and((elems) => {
                expect(elems.length).eq(3);
            });
            cy.get(".twitter__container")
                .first()
                .get(".twitter__media__content img")
                .and((img) => expect(img[0].src).to.eq("https://pbs.twimg.com/media/CERU_28XIAE763B.jpg"));
        });
    });
});
