/// <reference types="Cypress" />

context("Iframes", () => {
    beforeEach(() => {
        cy.window().then((win) => {
            win.localStorage["transient-opts"] = JSON.stringify({ defaults: true });
            win.localStorage["transient-data"] = JSON.stringify({ enabled_suboptions: ["testing_mode"] });
        });
    });

    it("Youtube opens with short-url video", () => {
        cy.visit("https://www.shacknews.com/chatty?id=39950627#item_39950627");

        cy.get("li li.sel div.medialink").click();
        cy.get("div.media iframe").should((iframe) =>
            expect(iframe.attr("title")).to.eq("https://www.youtube.com/embed/DH6WUr5tfw4?autoplay=1"),
        );
    });
    it("Youtube opens with short-url video at offset", () => {
        cy.visit("https://www.shacknews.com/chatty?id=39950460#item_39950460");

        cy.get("li li.sel div.medialink").click();
        cy.get("div.media iframe").should((iframe) =>
            expect(iframe.attr("title")).to.eq("https://www.youtube.com/embed/Aq_1l316ow8?autoplay=1&start=16"),
        );
    });

    it("Youtube opens with long-url video", () => {
        cy.fixture("_shack_li_").then((li) => cy.setCookie("_shack_li_", li, { domain: "shacknews.com" }));
        cy.visit("https://www.shacknews.com/chatty?id=39823160#item_39823160");

        cy.get("div.medialink").first().click();
        cy.get("div.media iframe").should((iframe) =>
            expect(iframe.attr("title")).to.eq("https://www.youtube.com/embed/WBFDQvIrWYM?autoplay=1"),
        );
    });
    it("Youtube opens with long-url video at offset", () => {
        cy.visit("https://www.shacknews.com/chatty?id=39948799#item_39948799");

        cy.get("li li.sel div.medialink").click();
        cy.get("li li.sel div.media iframe").should((iframe) =>
            expect(iframe.attr("title")).to.eq("https://www.youtube.com/embed/xNiJYFD5_Co?autoplay=1&start=98"),
        );
    });
    it("Youtube opens with long-url video from playlist", () => {
        cy.visit("https://www.shacknews.com/chatty?id=29837558#item_29837558");

        cy.get("li li.sel div.medialink").click();
        cy.get("div.media iframe").should((iframe) =>
            expect(iframe.attr("title")).to.eq(
                "https://www.youtube.com/embed/zXLeJFu57Wg?autoplay=1&list=PL9CBBEA5A85DBCDEF",
            ),
        );
    });
    //it("Youtube opens with long-url video from playlist at offset", () => {});

    it("Twitch opens with channel", () => {
        cy.visit("https://www.shacknews.com/chatty?id=39944994#item_39944994");

        cy.get("div.medialink").click();
        cy.get("div.media iframe").should((iframe) =>
            expect(iframe.attr("title")).to.eq(
                "https://player.twitch.tv/?channel=hexy&parent=www.shacknews.com&autoplay=true&muted=false",
            ),
        );
    });
    it("Twitch opens with long-form clip", () => {
        cy.visit("https://www.shacknews.com/chatty?id=39950638#item_39950638");

        cy.get("li li.sel div.medialink").click();
        cy.get("li li.sel div.media iframe").should((iframe) =>
            expect(iframe.attr("title")).to.eq(
                "https://clips.twitch.tv/embed?clip=EphemeralUnsightlyCarrotLeeroyJenkins&parent=www.shacknews.com&autoplay=true&muted=false",
            ),
        );
    });
    it("Twitch opens with short-form clip", () => {
        cy.visit("https://www.shacknews.com/chatty?id=39596306#item_39596306");

        cy.get("li li.sel div.medialink").click();
        cy.get("li li.sel div.media iframe").should((iframe) =>
            expect(iframe.attr("title")).to.eq(
                "https://clips.twitch.tv/embed?clip=FastBloodyDelicataMau5&parent=www.shacknews.com&autoplay=true&muted=false",
            ),
        );
    });
    //it("Twitch opens with collection", () => {});
    it("Twitch opens with VOD", () => {
        cy.visit("https://www.shacknews.com/chatty?id=39899072#item_39899072");

        cy.get("div.medialink").click();
        cy.get("div.media iframe").should((iframe) =>
            expect(iframe.attr("title")).to.eq(
                "https://player.twitch.tv/?video=v718363588&parent=www.shacknews.com&autoplay=true&muted=false",
            ),
        );
    });
    it("Twitch opens with VOD at offset", () => {
        cy.visit("https://www.shacknews.com/chatty?id=39646700#item_39646700");

        cy.get("div.medialink").click();
        cy.get("div.media iframe").should((iframe) =>
            expect(iframe.attr("title")).to.eq(
                "https://player.twitch.tv/?video=v633051886&parent=www.shacknews.com&autoplay=true&muted=false&time=00h36m17s",
            ),
        );
    });

    it("Streamable opens with Streamable video", () => {
        cy.visit("https://www.shacknews.com/chatty?id=39821926#item_39821926");

        cy.get("li li.sel div.medialink").click();
        cy.get("div.media iframe").should((iframe) =>
            expect(iframe.attr("title")).to.eq("https://streamable.com/o/bn4mjy"),
        );
    });

    it("XboxDVR opens with video", () => {
        cy.visit("https://www.shacknews.com/chatty?id=38421840#item_38421840");

        cy.get("li li.sel div.medialink").click();
        cy.get("div.media iframe").should((iframe) =>
            expect(iframe.attr("title")).to.eq("https://xboxdvr.com/gamer/b1gben1810/video/71229659/embed"),
        );
    });
});
