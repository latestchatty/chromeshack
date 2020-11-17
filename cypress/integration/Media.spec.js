/// <reference types="Cypress" />

describe("Media Embedder", () => {
    before(() => {
        cy.loadExtensionDefaults();
    });
    beforeEach(() => {
        cy.fixture("_shack_li_").then((li) => cy.setCookie("_shack_li_", li, { domain: "shacknews.com" }));
    });

    context("Imgur", () => {
        it("Imgur single-image", () => {
            cy.visit("https://www.shacknews.com/chatty?id=39952896#item_39952896");
            cy.get("li li.sel div.medialink").as("medialink").click();
            cy.get("div.media img")
                .as("embed")
                .and((img) => expect(img[0].src).to.eq("https://i.imgur.com/DJHWVfU.jpg"));

            cy.log("test that clicking image toggles embed");
            cy.get("@embed").should("be.visible").click();
            cy.get("@medialink").should("not.have.class", "toggled");
            cy.get("@embed").should("not.be.visible");
        });
        it("Imgur single-image gallery", () => {
            cy.visit("https://www.shacknews.com/chatty?id=39944691#item_39944691");
            cy.get("div.medialink").click();
            cy.get("div.media img").and((img) => expect(img[0].src).to.eq("https://i.imgur.com/D48bIGJ.jpg"));
        });
        it("Imgur named image from gallery", () => {
            cy.visit("https://www.shacknews.com/chatty?id=38005588#item_38005588");
            cy.get("div.medialink").click();
            cy.get("div.media img").and((img) => expect(img[0].src).to.eq("https://i.imgur.com/8bIDmWv.jpg"));
        });
        it("Imgur multi-image gallery", () => {
            cy.visit("https://www.shacknews.com/chatty?id=26075279#item_26075279");
            cy.get("li li.sel div.medialink").click();
            cy.get("div.media img").and((img) => expect(img.eq(0)).to.be.visible);
            cy.get(".embla__button--next").click();
            cy.get("div.media .is-selected").and((img) => expect(img.eq(0)).to.be.visible);
        });
        it("Imgur multi-image from named gallery", () => {
            cy.visit("https://www.shacknews.com/chatty?id=40121388#item_40121388");
            cy.get("li li.sel div.medialink").click();
            cy.get("div.media img").and((img) => expect(img.eq(0)).to.be.visible);
            cy.get(".embla__button--next").click();
            cy.get("div.media .is-selected").and((img) => expect(img.eq(0)).to.be.visible);
        });
        it("Imgur video", () => {
            cy.visit("https://www.shacknews.com/chatty?id=38024123#item_38024123");
            cy.get("div.medialink").click();
            cy.get("div.media video").and((video) => expect(video[0].src).to.eq("https://i.imgur.com/xT2jFf0.mp4"));
        });
        it("Imgur single-video album", () => {
            cy.visit("https://www.shacknews.com/chatty?id=40040863#item_40040863");
            cy.get("div.medialink").click();
            cy.get("div.media video").and((video) => expect(video[0].src).to.eq("https://i.imgur.com/KiKjnt6.mp4"));
        });
        it("Imgur named video from gallery", () => {
            cy.visit("https://www.shacknews.com/chatty?id=39924469#item_39924469");
            cy.get("li li.sel div.medialink").click();
            cy.get("div.media video").and((video) => expect(video[0].src).to.eq("https://i.imgur.com/T3Pt5kF.mp4"));
        });
    });
    context("Direct-link media", () => {
        it("Direct-link images", () => {
            cy.visit("https://www.shacknews.com/chatty?id=39953172#item_39953172");
            cy.get(".root>ul>li div.medialink").eq(1).click();
            cy.get(".root>ul>li div.media img").and((img) =>
                expect(img[0].src).to.eq("https://i.imgur.com/jECE21g.jpg"),
            );
            cy.get("li li.sel div.medialink").click();
            cy.get("li li.sel div.media img").and((img) => expect(img[0].src).to.eq("https://i.imgur.com/mrmXoMs.jpg"));
        });
        it("Direct-link video", () => {
            cy.visit("https://www.shacknews.com/chatty?id=39951145#item_39951145");
            cy.get("li li.sel div.medialink").click();
            cy.get("div.media video").and((video) => expect(video[0].src).to.eq("https://i.imgur.com/itKm9JS.mp4"));
        });
    });

    context("Dropbox", () => {
        it("Dropbox images", () => {
            cy.visit("https://www.shacknews.com/chatty?id=39848548#item_39848548");
            cy.get("div.medialink").click();
            cy.get("div.media img").and((img) =>
                expect(img[0].src).to.eq("https://www.dropbox.com/s/r9feiqem9qiclqk/2016%20Bulked%20Up.jpg?raw=1"),
            );
        });
        it("Dropbox video", () => {
            cy.visit("https://www.shacknews.com/chatty?id=39596870#item_39596870");
            cy.get("li li.sel div.medialink").click();
            cy.get("div.media video").and((video) =>
                expect(video[0].src).to.eq("https://www.dropbox.com/s/8qk8lfwwtaubk44/20200512_193538.mp4?raw=1"),
            );
        });
    });

    context("Other hosts", () => {
        it("Chattypics images", () => {
            cy.visit("https://www.shacknews.com/chatty?id=39945481#item_39945481");
            cy.get("li li.sel div.medialink").eq(0).click();
            cy.get("li li.sel div.medialink").eq(1).click();
            cy.get("div.media img").and((img) => {
                expect(img[0].src).to.eq("https://chattypics.com/files/ControlScreenshot2020082911225_yuqtj34301.png");
                expect(img[1].src).to.eq("https://chattypics.com/files/ControlScreenshot2020082911253_70jym5xwgc.png");
            });
        });

        it("Gfycat video", () => {
            cy.visit("https://www.shacknews.com/chatty?id=39815799#item_39815799");
            cy.get("div.medialink").click();
            cy.get("div.media video").and((video) =>
                expect(video[0].src).to.eq("https://thumbs.gfycat.com/JoyousWhoppingCapeghostfrog-mobile.mp4"),
            );
        });

        it("Giphy video", () => {
            cy.visit("https://www.shacknews.com/chatty?id=39945918#item_39945918");
            cy.get("div.medialink").click();
            cy.get("div.media video").and((video) =>
                expect(video[0].src).to.eq("https://media0.giphy.com/media/YlRpYzrkHbtSYDAlaE/giphy.mp4"),
            );
        });

        it("Tenor image", () => {
            cy.visit("https://www.shacknews.com/chatty?id=39952739#item_39952739");
            cy.get("div.medialink").click();
            cy.get("div.media img").and((img) =>
                expect(img[0].src).to.eq(
                    "https://media1.tenor.com/images/383abee6c9e5f68c6b7ca5b3102f91ca/tenor.gif?itemid=5103046",
                ),
            );
        });

        it("Twimg Images", () => {
            cy.visit("https://www.shacknews.com/chatty?id=39949209#item_39949209");
            cy.get("li li.sel div.medialink").as("medialinks");
            cy.get("@medialinks").eq(0).click();
            cy.get("@medialinks").eq(1).click();
            cy.get("@medialinks").eq(2).click();
            cy.get("div.media img").and((img) => {
                expect(img[0].src).to.eq("https://pbs.twimg.com/media/EgotiE5WsAIJpGQ.jpg");
                expect(img[1].src).to.eq("https://pbs.twimg.com/media/EgouUvhXkAAdgQE.jpg");
                expect(img[2].src).to.eq("https://pbs.twimg.com/media/EgouUwDXsAA8S_8.jpg");
            });
        });
    });

    context("Chattypost", () => {
        it("embeds", () => {
            cy.visit("https://www.shacknews.com/chatty?id=39952360#item_39952360");
            cy.get("li li.sel div.medialink").click();
            cy.get("div.media .postbody > a").and((link) =>
                expect(link[0].href).to.equal(
                    "https://lawandcrime.com/high-profile/like-an-experimental-concentration-camp-whistleblower-complaint-alleges-mass-hysterectomies-at-ice-detention-center/",
                ),
            );
        });
    });

    context("NWS Incognito", () => {
        it("enabled with media links", () => {
            cy.visit("https://www.shacknews.com/chatty?id=26073414#item_26073414");
            cy.get("li li.sel .postbody a").and((links) => {
                expect(links[0].innerText).to.eq("http://imgur.com/a/re0yH (Incognito)");
                expect(links[1].innerText).to.eq("http://imgur.com/a/wq9mu (Incognito)");
            });
        });
        it("disabled with navigable Imgur gallery", () => {
            cy.loadExtensionDefaults({ exclude: true }, { enabled_scripts: ["nws_incognito"] });
            cy.reload();

            cy.get("li li.sel div.medialink").eq(0).click();
            cy.get("div.media .embla__slide").and((slide) => {
                expect(slide.eq(0)).to.be.visible;
            });
            cy.get(".embla__button--next").click();
            cy.get("div.media .is-selected").and((slide) => {
                expect(slide.eq(0)).to.be.visible;
            });
        });
    });
});
