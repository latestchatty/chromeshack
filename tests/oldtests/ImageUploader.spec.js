/// <reference types="Cypress" />

describe("Image Uploader", () => {
    context("UI interactions", () => {
        before(() => {
            // start with a blank default tab selection
            cy.loadExtensionDefaults(null, { selected_upload_tab: "" });
        });
        beforeEach(() => {
            cy.fixture("_shack_li_").then((li) => cy.setCookie("_shack_li_", li, { domain: "shacknews.com" }));
        });
        const url = "https://www.shacknews.com/chatty?id=40056583#item_40056583";

        it("test toggle persistence", () => {
            cy.visit(url).wait(500);

            cy.get("div.reply>a").as("replyButton").click();
            cy.get("#uploader-toggle").as("toggle").click();
            cy.get("#uploader-container").as("uploader").should("not.have.class", "hidden");
            cy.get("@replyButton").click().click();
            cy.get("@uploader").should("not.have.class", "hidden");
        });

        it("test tab switching and inputs", () => {
            cy.loadExtensionDefaults(null, { image_uploader_toggled: true });
            cy.visit(url).wait(500);

            cy.get("div.reply>a").as("replyBtn").click();
            cy.get("#tab-container .tab").as("tabs");
            cy.get("input#urlinput").as("urlInput");

            cy.get("@tabs")
                .eq(1)
                .click()
                .then((tab) => expect(tab[0].id).to.eq("gfycatTab"));
            cy.get("#toggleLabel").as("uploaderToggle").click();
            cy.get("@replyBtn").click().click();
            cy.get("div#uploader-container").should("have.class", "hidden");
            cy.get("@uploaderToggle").click();
            cy.get("div.tab.active").then((tab) => expect(tab[0].id).to.eq("gfycatTab"));

            cy.get("@urlInput").type("https://localhost/test.jpeg", { delay: 0 });
            cy.get("@urlInput")
                .then((input) => {
                    expect(input[0].validity.patternMismatch).to.be.true;
                    return input;
                })
                .clear();

            const validInput = "https://localhost.com/test.mp4";
            cy.get("@urlInput").type(validInput, { delay: 0 }).wait(500);
            cy.get("@urlInput").then((input) => expect(input[0].validity.valid).to.be.true);

            cy.get("@tabs").eq(0).click();
            cy.get("@urlInput").and((input) => {
                expect(input[0].value).to.eq(validInput);
                expect(input[0].validity.valid).to.be.true;
            });
            cy.get("@tabs").eq(2).click();
            cy.get("@urlInput").should("not.be.visible");

            cy.get("@tabs").eq(0).click();
            cy.get("button#upload-btn").as("uploadBtn").should("be.enabled");
            cy.get("div#dropArea").as("dropArea").should("have.class", "disabled");

            cy.get("button#cancel-btn").click();
            cy.get("@dropArea").should("not.have.class", "disabled");
            cy.get("@uploadBtn").should("be.disabled");
        });

        it("test file drop input", () => {
            cy.get("div.reply>a").click().click();
            // first tab (Imgur) supports anonymous multi-media album upload
            cy.get("input#fileChooser").as("fileInput");
            cy.get("@fileInput").attachFile("arcade1.jpg").attachFile("arcade2.jpg");
            cy.get("@fileInput").then((fileInput) => {
                expect(fileInput[0].files.length).to.eq(2);
            });
            cy.get("div#dropArea").as("dropArea").should("have.class", "disabled");
            cy.get("button#upload-btn").as("uploadBtn").should("be.enabled");

            cy.log("testing multifile drop on single-file host");
            cy.get(".drop__area--icon").should("not.be.visible");
            cy.get("#tab-container .tab").eq(1).click();
            cy.get(".drop__area--icon").should("be.visible");
        });
    });
});
