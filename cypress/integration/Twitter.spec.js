/// <reference types="Cypress" />

context("Twitter", () => {
    beforeEach(() => {
        cy.window().then((win) => {
            // enable "Show Twitter threads when opening Twitter links" option
            win.localStorage["transient-opts"] = JSON.stringify({ defaults: true });
            win.localStorage["transient-data"] = JSON.stringify({ enabled_suboptions: ["testing_mode"] });
        });
    });

    it("opens with single image tweet", () => {
        cy.visit("https://www.shacknews.com/chatty?id=33418538#item_33418538");

        cy.get("div.medialink").click();
        cy.get("div.media img").and((img) => {
            expect(img[0].naturalHeight).to.be.greaterThan(0);
        });
    });

    it("opens with single video tweet", () => {
        cy.visit("https://www.shacknews.com/chatty?id=33390347#item_33390347");

        cy.get("div.root>ul>li li.sel div.medialink").click();
        cy.get("div.media video").and((video) => {
            expect(video[0].paused).eq(false);
            expect(video[0].videoHeight).to.be.greaterThan(0);
        });
        cy.get("div.footer-left div.logo.alt").first().scrollIntoView();
        cy.get("div.media video")
            .wait(500)
            .and((video) => {
                expect(video[0].paused).eq(true);
            });
        cy.get("div.media video")
            .scrollIntoView()
            .wait(500)
            .and((video) => {
                expect(video[0].paused).eq(false);
            });
    });

    it("opens with a two image carousel", () => {
        cy.visit("https://www.shacknews.com/chatty?id=33363191#item_33363191");

        cy.get("div.medialink").click();
        cy.get(".twitter__text__content>span").contains(`Coincidence? I don't think so.`);
        cy.get(".twitter__text__content a").and((link) => {
            expect(link[0].href).eq("https://twitter.com/hashtag/StarWars?src=hash");
        });
        cy.get("div.media .embla")
            .scrollIntoView()
            .should("be.visible")
            .and((carousel) => {
                expect(carousel[0].offsetHeight).to.be.greaterThan(0);
            });
        cy.get("div.media .embla__button--next").click();
        cy.get(".embla__slide.is-selected").then((slide) => {
            expect(slide[0].offsetHeight).to.be.greaterThan(0);
        });
    });

    it("opens with a quoted tweet", () => {
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

    it("opens a tweet thread with a single image", () => {
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
            .and((img) => expect(img[0].naturalHeight).to.be.eq(1000));
    });
});
