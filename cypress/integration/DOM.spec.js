/// <reference types="Cypress" />

context("DOM modifications", () => {
    beforeEach(() => {
        cy.window().then((win) => {
            win.localStorage["transient-opts"] = JSON.stringify({ defaults: true });
            win.localStorage["transient-data"] = JSON.stringify({ enabled_suboptions: ["testing_mode"] });
        });
    });

    it("user flair options enabled", () => {
        cy.visit("https://www.shacknews.com/chatty?id=40040034#item_40040034");
        cy.get("li.sel img.chatty-user-icons").first().should("have.css", "width", "10px");
        cy.get("li.sel img.chatty-user-icons").first().should("have.css", "filter", "grayscale(0.75)");
    });
    it("user flair options disabled", () => {
        cy.window().then((win) => {
            win.localStorage["transient-opts"] = JSON.stringify({ exclude: true });
            win.localStorage["transient-data"] = JSON.stringify({
                enabled_scripts: ["shrink_user_icons", "reduced_color_user_icons"],
            });
        });

        cy.visit("https://www.shacknews.com/chatty?id=40040034#item_40040034");
        cy.get("li.sel img.chatty-user-icons").first().should("not.have.css", "width", "10px");
        cy.get("li.sel img.chatty-user-icons").first().should("not.have.css", "filter", "grayscale(0.75)");
    });

    it("lol taglines enabled", () => {
        cy.visit("https://www.shacknews.com/chatty?id=40046772#item_40046772");
        cy.get(".fullpost .lol-tags").first().should("have.css", "display", "flex");
    });
    it("lol taglines disabled", () => {
        cy.window().then((win) => {
            win.localStorage["transient-data"] = JSON.stringify({ enabled_scripts: ["hide_tagging_buttons"] });
        });

        cy.visit("https://www.shacknews.com/chatty?id=40046772#item_40046772");
        cy.get(".fullpost .lol-tags").first().should("have.css", "display", "none");
    });

    it("lol reply oneliner tags enabled", () => {
        cy.visit("https://www.shacknews.com/chatty?id=40046772#item_40046772");
        cy.get(".oneline .lol-tags").eq(1).should("have.css", "display", "inline-block");
    });
    it("lol reply oneliner tags disabled", () => {
        cy.window().then((win) => {
            win.localStorage["transient-data"] = JSON.stringify({ enabled_scripts: ["hide_tag_counts"] });
        });

        cy.visit("https://www.shacknews.com/chatty?id=40046772#item_40046772");
        cy.get(".oneline .lol-tags").eq(1).should("have.css", "display", "none");
    });

    it("test shame-switchers", () => {
        cy.window().then((win) => {
            win.localStorage["transient-data"] = JSON.stringify({ enabled_scripts: ["switchers"] });
        });

        cy.visit("https://www.shacknews.com/chatty?id=40049133#item_40049133");
        cy.get("li li.sel span.user").should((user) => expect(user.text()).to.match(/\w+ - \(\w+\)/));
    });

    it("test chatty-news", () => {
        cy.window().then((win) => {
            win.localStorage["transient-data"] = JSON.stringify({ enabled_scripts: ["chatty_news"] });
        });

        cy.visit("https://www.shacknews.com/chatty?id=40049133#item_40049133");
        cy.get("ul#recent-articles li").and((items) => {
            expect(items.length).to.be.greaterThan(0);
            expect(items.find("a").attr("title")).length.to.be.greaterThan(0);
        });
    });

    it("test post-preview and counter", () => {
        cy.window().then((win) => {
            win.localStorage["transient-data"] = JSON.stringify({ enabled_scripts: ["post_preview"] });
        });
        cy.fixture("_shack_li_").then((li) => cy.setCookie("_shack_li_", li, { domain: "shacknews.com" }));

        cy.visit("https://www.shacknews.com/chatty?id=40049133#item_40049133");
        cy.get("li li.sel div.reply > a").click();
        cy.get("#previewButton").click();
        cy.get("#frm_body").type("This is a test of the post preview feature.");
        cy.get("#previewArea").should("be.visible").and("have.text", "This is a test of the post preview feature.");
        cy.get(".post_length_counter_text").should("have.text", "Characters remaining in post preview: 62");
    });

    it("test CUF on replies in single-thread mode", () => {
        cy.window().then((win) => {
            win.localStorage["transient-data"] = JSON.stringify({ user_filters: ["Milleh"] });
        });

        cy.visit("https://www.shacknews.com/chatty?id=40049762#item_40049762");
        cy.get(".oneline_user").each((ol) => expect(ol.text()).to.not.eq("Milleh"));
    });
    it("test CUF on thread in single-thread mode", () => {
        cy.window().then((win) => {
            win.localStorage["transient-data"] = JSON.stringify({ user_filters: ["mechanicalgrape"] });
        });

        cy.visit("https://www.shacknews.com/chatty?id=40041325#item_40041325");
        cy.get("li li.sel .oneline_user").should("not.exist");
    });
    it("test CUF on thread in multi-thread mode", () => {
        cy.window().then((win) => {
            win.localStorage["transient-data"] = JSON.stringify({ user_filters: ["WombatFromHell"] });
        });

        cy.visit("https://www.shacknews.com/chatty?id=40041325#item_40041325");
        cy.get("li li.sel .oneline_user").each((ol) => expect(ol.text()).to.not.eq("WombatFromHell"));
    });

    it("test highlight-user highlighting", () => {
        cy.window().then((win) => {
            win.localStorage["transient-data"] = JSON.stringify({ append: true });
            win.localStorage["transient-data"] = JSON.stringify({
                highlight_groups: [
                    {
                        name: "Another Group",
                        enabled: true,
                        built_in: false,
                        css: "color: cyan !important;",
                        users: ["Yo5hiki"],
                    },
                ],
            });
        });
        cy.visit("https://www.shacknews.com/chatty?id=40049283#item_40049283");

        // check for 'color' 'yellow'
        cy.get(".oneline.op .oneline_user").should("have.css", "color", "rgb(255, 255, 0)");
        // check for 'color' 'cyan'
        cy.get(".oneline .oneline_user").eq(6).should("have.css", "color", "rgb(0, 255, 255)");
    });
});
