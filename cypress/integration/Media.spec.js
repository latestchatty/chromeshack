/// <reference types="Cypress" />

context("Common media", () => {
    beforeEach(() => {
        cy.window().then((win) => {
            win.localStorage["transient-opts"] = JSON.stringify({ defaults: true });
            win.localStorage["transient-data"] = JSON.stringify({
                enabled_suboptions: ["testing_mode"],
            });
        });
        cy.fixture("_shack_li_").then((li) => cy.setCookie("_shack_li_", li, { domain: "shacknews.com" }));
    });

    it("opens with Imgur image", () => {
        cy.visit("https://www.shacknews.com/chatty?id=39952896#item_39952896");

        cy.get("li li.sel div.medialink").click();
        cy.get("div.media img").and((img) => expect(img[0].offsetHeight).to.be.greaterThan(0));
    });
    it("opens with Imgur single-image gallery", () => {
        cy.visit("https://www.shacknews.com/chatty?id=39944691#item_39944691");

        cy.get("div.medialink").click();
        cy.get("div.media img").and((img) => expect(img[0].offsetHeight).to.be.greaterThan(0));
    });
    it("opens with Imgur image from named gallery", () => {
        cy.visit("https://www.shacknews.com/chatty?id=38005588#item_38005588");

        cy.get("div.medialink").click();
        cy.get("div.media img").and((img) => expect(img[0].offsetHeight).to.be.greaterThan(0));
    });
    it("opens with Imgur image gallery", () => {
        cy.visit("https://www.shacknews.com/chatty?id=26075279#item_26075279");

        cy.get("li li.sel div.medialink").click();
        cy.get("div.media img").and((img) => expect(img[0].offsetHeight).to.be.greaterThan(0));
        cy.get(".embla__button--next").click();
        cy.get(".is-selected").and((img) => expect(img[0].offsetHeight).to.be.greaterThan(0));
    });

    it("opens with Imgur video", () => {
        cy.visit("https://www.shacknews.com/chatty?id=38024123#item_38024123");

        cy.get("div.medialink").click();
        cy.get("div.media video").and((video) => expect(video[0].offsetHeight).to.be.greaterThan(0));
    });
    it("opens with Imgur single-video album", () => {
        cy.visit("https://www.shacknews.com/chatty?id=39951288#item_39951288");

        cy.get("div.medialink").click();
        cy.get("div.media video").and((video) => expect(video[0].offsetHeight).to.be.greaterThan(0));
    });
    it("opens with Imgur video from named gallery", () => {
        cy.visit("https://www.shacknews.com/chatty?id=39951288#item_39951288");

        cy.get("div.medialink").click();
        cy.get("div.media video").and((video) => expect(video[0].offsetHeight).to.be.greaterThan(0));
    });

    it("opens with direct-linked images", () => {
        cy.visit("https://www.shacknews.com/chatty?id=39953172#item_39953172");

        cy.get("li li.sel div.medialink").click();
        cy.get("div.media img").and((img) => expect(img[0].offsetHeight).to.be.greaterThan(0));
    });
    it("opens with direct-linked video", () => {
        cy.visit("https://www.shacknews.com/chatty?id=39951145#item_39951145");

        cy.get("li li.sel div.medialink").click();
        cy.get("div.media video").and((video) => expect(video[0].offsetHeight).to.be.greaterThan(0));
    });

    it("opens with Dropbox images", () => {
        cy.visit("https://www.shacknews.com/chatty?id=39848548#item_39848548");

        cy.get("div.medialink").click();
        cy.get("div.media img").and((img) => expect(img[0].offsetHeight).to.be.greaterThan(0));
    });
    it("opens with Dropbox video", () => {
        cy.visit("https://www.shacknews.com/chatty?id=39596870#item_39596870");

        cy.get("li li.sel div.medialink").click();
        cy.get("div.media video").and((video) => expect(video[0].offsetHeight).to.be.greaterThan(0));
    });

    it("opens with Chattypics images", () => {
        cy.visit("https://www.shacknews.com/chatty?id=39945481#item_39945481");

        cy.get("li li.sel div.medialink").first().click();
        cy.get("div.media img").and((img) => expect(img[0].offsetHeight).to.be.greaterThan(0));
    });
    it("opens with Gfycat video", () => {
        cy.visit("https://www.shacknews.com/chatty?id=39815799#item_39815799");

        cy.get("div.medialink").click();
        cy.get("div.media video").and((video) => expect(video[0].offsetHeight).to.be.greaterThan(0));
    });
    it("opens with Giphy video", () => {
        cy.visit("https://www.shacknews.com/chatty?id=39945918#item_39945918");

        cy.get("div.medialink").click();
        cy.get("div.media video").and((video) => expect(video[0].offsetHeight).to.be.greaterThan(0));
    });
    it("opens with Tenor image", () => {
        cy.visit("https://www.shacknews.com/chatty?id=39952739#item_39952739");

        cy.get("div.medialink").click();
        cy.get("div.media img").and((img) => expect(img[0].offsetHeight).to.be.greaterThan(0));
    });
    it("opens with Twimg images", () => {
        cy.visit("https://www.shacknews.com/chatty?id=39949209#item_39949209");

        cy.get("li li.sel div.medialink").first().click();
        cy.get("div.media img").and((img) => expect(img[0].offsetHeight).to.be.greaterThan(0));
    });

    it("opens with embedded chattypost", () => {
        cy.visit("https://www.shacknews.com/chatty?id=39952360#item_39952360");

        cy.get("li li.sel div.medialink").click();
        cy.get("div.media .postbody > a").and((link) =>
            expect(link[0].href).to.equal(
                "https://lawandcrime.com/high-profile/like-an-experimental-concentration-camp-whistleblower-complaint-alleges-mass-hysterectomies-at-ice-detention-center/",
            ),
        );
    });

    it("NWS Incognito enabled with media links", () => {
        cy.visit("https://www.shacknews.com/chatty?id=26073414#item_26073414");

        cy.get("li li.sel .postbody a").and((links) => {
            expect(links[0].innerText).to.equal("http://imgur.com/a/re0yH (Incognito)");
            expect(links[1].innerText).to.equal("http://imgur.com/a/wq9mu (Incognito)");
        });
    });
    it("NWS Incognito disabled with Imgur galleries", () => {
        cy.window().then((win) => {
            win.localStorage["transient-opts"] = JSON.stringify({ exclude: true });
            win.localStorage["transient-data"] = JSON.stringify({ enabled_scripts: ["nws_incognito"] });
        });
        cy.visit("https://www.shacknews.com/chatty?id=26073414#item_26073414");

        cy.get("li li.sel div.medialink").first().click();
        cy.get("div.media .embla__slide").and((slide) => {
            expect(slide[0].offsetHeight).to.be.greaterThan(0);
        });
        cy.get(".embla__button--next").click();
        cy.get("div.media .is-selected").and((slide) => {
            expect(slide[0].offsetHeight).to.be.greaterThan(0);
        });
    });
});
