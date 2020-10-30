/// <reference types="Cypress" />

describe("Image Uploader", () => {
    context("UI interactions", () => {
        beforeEach(() => {
            // start with a blank default tab selection
            cy.loadExtensionDefaults(null, { selected_upload_tab: "" });
            cy.fixture("_shack_li_").then((li) => cy.setCookie("_shack_li_", li, { domain: "shacknews.com" }));
        });

        it("test tab switching and inputs", () => {
            cy.visit("https://www.shacknews.com/chatty?id=40056583#item_40056583");

            cy.get("div.reply>a").as("replyButton").click();
            cy.get("#tab-container .tab").as("tabs");
            cy.get("input#urlinput").as("urlInput");

            cy.log("test tab switching and persistence");
            cy.get("@tabs")
                .eq(1)
                .click()
                .then((tab) => expect(tab[0].id).to.eq("gfycatTab"));
            cy.get("#toggleLabel").as("uploaderToggle").click();
            cy.reload();
            cy.get("@replyButton").click();
            cy.get("div#uploader-container").should("have.class", "hidden");
            cy.get("@uploaderToggle").click();
            cy.get("div.tab.active").then((tab) => expect(tab[0].id).to.eq("gfycatTab"));

            cy.log("test tab inputs");
            cy.get("@urlInput").type("https://localhost/test.jpeg");
            cy.get("@urlInput")
                .then((input) => {
                    expect(input[0].validity.patternMismatch).to.be.true;
                    return input;
                })
                .clear();

            const validInput = "https://localhost.com/test.mp4";
            cy.get("@urlInput").type(validInput);
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
            cy.reload();

            cy.get("div.reply>a").as("replyButton").click();
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
