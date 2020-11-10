/// <reference types="Cypress" />

describe("Postbox interactions", () => {
    before(() => {
        cy.loadExtensionDefaults();
    });
    beforeEach(() => {
        cy.fixture("_shack_li_").then((li) => cy.setCookie("_shack_li_", li, { domain: "shacknews.com" }));
    });
    const url = "https://www.shacknews.com/chatty?id=38731437#item_38731437";

    context("Reply input/submission", () => {
        it("CommentTabs interactions", () => {
            cy.visit(url);

            cy.get("li li.sel div.reply>a").as("replyBtn").click();
            cy.get("#shacktags_legend_table").as("table").should("have.class", "hidden");
            cy.get("#shacktags_legend_toggle").as("toggleBtn").click();
            cy.get("@table").should("not.have.class", "hidden");

            cy.get("@replyBtn").click().click();
            cy.get("@table").should("not.have.class", "hidden");
        });

        it("Drafts input and persistence", () => {
            cy.loadExtensionDefaults(null, { enabled_scripts: ["drafts"], saved_drafts: [] });
            cy.visit(url);

            cy.get("li li.sel div.reply>a").as("replyBtn").click();
            cy.get("div.drafts__dot").as("draftsDot").should("have.class", "invalid");

            const message =
                "Aliquam purus sit amet luctus venenatis lectus magna fringilla urna. Fames ac turpis egestas maecenas pharetra convallis posuere morbi leo. Nunc mi ipsum faucibus vitae aliquet nec ullamcorper sit amet. 👍🏼";
            cy.get("#frm_body").as("replyInput").type(message, { delay: 0 }).wait(333);
            cy.get("@draftsDot").should("have.class", "valid");

            cy.get("@replyBtn").click().click();
            cy.get("@replyInput").should("have.value", message);
            cy.get("@draftsDot").should("have.class", "valid");
        });

        it("Templates interaction and persistence", () => {
            cy.loadExtensionDefaults(null, { enabled_scripts: ["templates"], saved_templates: [] });
            cy.visit(url);

            const message =
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Sit amet luctus venenatis lectus magna fringilla urna porttitor. Lectus vestibulum mattis ullamcorper velit sed ullamcorper morbi tincidunt. Purus semper eget duis at tellus at urna condimentum mattis. Ipsum a arcu cursus vitae congue. At ultrices mi tempus imperdiet nulla malesuada pellentesque elit. Nam libero justo laoreet sit amet cursus sit. Consequat nisl vel pretium lectus quam id. Justo laoreet sit amet cursus sit amet. Sed sed risus pretium quam vulputate dignissim suspendisse in.";
            cy.get("li li.sel div.reply>a").as("replyBtn").click();
            cy.get("#frm_body").as("replyInput").type(message, { delay: 0 }).wait(333);
            cy.get("button#templates__btn").as("templatesBtn").click();
            cy.get("button#save__btn").click();
            cy.get("@replyBtn").click().click();
            cy.get("@replyInput").then((input) => expect(input[0].value).to.eq(""));
            cy.get("@templatesBtn").click();
            cy.get("div.template__item>span").eq(0).click();
            cy.get("@replyInput").then((input) => expect(input[0].value).to.eq(message));

            cy.get("button#add__btn").click().click();
            cy.get("div.template__item").then((items) => expect(items.length).to.eq(3));
            cy.get("@replyBtn").click().click();

            cy.get("@templatesBtn").click();
            cy.get("button#del__btn").as("delTempBtns").eq(1).click();
            cy.get("@delTempBtns").eq(1).click();
            cy.get("@delTempBtns").eq(0).click();
            cy.get("div.template__item>span").eq(0).should("have.text", "Template #1");
        });

        it("PostPreview tag interactions", () => {
            cy.loadExtensionDefaults(null, { enabled_scripts: ["post_preview"], tags_legend_toggled: true });
            cy.visit(url);

            cy.log("test post-preview enablement persistence");
            cy.get("li li.sel div.reply > a").as("replyBtn").click();
            cy.get("#previewButton").click();
            cy.get("#frm_body").as("replyInput");
            cy.get("#previewArea").as("previewArea");
            cy.get("@previewArea").should("be.visible");
            cy.get("@replyBtn").click().click();
            cy.get("@previewArea").should("be.visible");

            cy.log("test post-length counter");
            cy.get("@replyInput").type("This is a test of the post preview feature.");
            cy.get("@previewArea").should("be.visible").and("have.text", "This is a test of the post preview feature.");
            cy.get(".post_length_counter_text").should("have.text", "Characters remaining in post preview: 62");

            cy.log("test codeblock formatted output");
            cy.get("@replyInput").clear();
            cy.get("@replyInput")
                .type(
                    `&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&
&&&&&&&&&&&&&&&&&&&&&&%####%%&&&&&&&&&&&&&&&&&&&
&&&&&&&&&&&&&&&%(////(((((((((////(%&&&&&&&&&&&&
&&&&&&&&&&&%(//(%&&&&&&&&&&&&&&&&%#(//(%&&&&&&&&
&&&&&&&&&#//#&&&&%/.    .*%&&&&&&&&&&%///%&&&&&&
&&&&&&&%//#&&(,              ,(&&&&&&&&%(/(&&&&&
&&&&&&%%%/                        *%&&&&&#//#&&&
&&&%(,                                ,(%&#//%&&
&&&&#((%&&&.     (&&&&&&&&#.     &&&&&&&&&&//(&&
&&&&(/(%&&&,     /&&&&&&&&(     .&&&&&&&&&&%//%&
&&&&(/(%&&&*     /&&&&&&&&/     *&&&&&&&&&&#//%&
&&&&(//#&&&(     *&,.#&&&&/     (&&&&&&&&&&//(&&
&&&&%//(%&&#     *&&&&&&&&*     (&&&&&&&&&#//%&&
&&&&&%///%&%.    ,&&&&&&&&*     #&&&&&&&&(//#&&&
&&&&&&%(//(%*,,,,*&&&&&&&&/,,,,*%&&&&&&#//(&&&&&
&&&&&&&&%(//(%&&&&&&&&&&&&&&&&&&&&&&&#//(%&&&&&&
&&&&&&&&&&&#///(#%&&&&&&&&&&&&&&%#(///#%&&&&&&&&
&&&&&&&&&&&&&&%(//////((((((//////(%&&&&&&&&&&&&
&&&&&&&&&&&&&&&&&&&&%%######%%&&&&&&&&&&&&&&&&&&`,
                    { delay: 0 },
                )
                .type("{selectall}");

            const tagHTML =
                "&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;<br>&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;%####%%&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;<br>&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;%(////(((((((((////(%&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;<br>&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;%(//(%&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;%#(//(%&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;<br>&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;#//#&amp;&amp;&amp;&amp;%/.    .*%&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;%///%&amp;&amp;&amp;&amp;&amp;&amp;<br>&amp;&amp;&amp;&amp;&amp;&amp;&amp;%//#&amp;&amp;(,              ,(&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;%(/(&amp;&amp;&amp;&amp;&amp;<br>&amp;&amp;&amp;&amp;&amp;&amp;%%%/                        *%&amp;&amp;&amp;&amp;&amp;#//#&amp;&amp;&amp;<br>&amp;&amp;&amp;%(,                                ,(%&amp;#//%&amp;&amp;<br>&amp;&amp;&amp;&amp;#((%&amp;&amp;&amp;.     (&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;#.     &amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;//(&amp;&amp;<br>&amp;&amp;&amp;&amp;(/(%&amp;&amp;&amp;,     /&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;(     .&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;%//%&amp;<br>&amp;&amp;&amp;&amp;(/(%&amp;&amp;&amp;*     /&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;/     *&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;#//%&amp;<br>&amp;&amp;&amp;&amp;(//#&amp;&amp;&amp;(     *&amp;,.#&amp;&amp;&amp;&amp;/     (&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;//(&amp;&amp;<br>&amp;&amp;&amp;&amp;%//(%&amp;&amp;#     *&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;*     (&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;#//%&amp;&amp;<br>&amp;&amp;&amp;&amp;&amp;%///%&amp;%.    ,&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;*     #&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;(//#&amp;&amp;&amp;<br>&amp;&amp;&amp;&amp;&amp;&amp;%(//(%*,,,,*&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;/,,,,*%&amp;&amp;&amp;&amp;&amp;&amp;#//(&amp;&amp;&amp;&amp;&amp;<br>&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;%(//(%&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;#//(%&amp;&amp;&amp;&amp;&amp;&amp;<br>&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;#///(#%&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;%#(///#%&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;<br>&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;%(//////((((((//////(%&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;<br>&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;%%######%%&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;&amp;";
            cy.get("#shacktags_legend_table tr:nth-child(8) > td:nth-child(4) > a").click();
            cy.get("@previewArea")
                .find(".jt_code")
                .then((codeblock) => expect(codeblock[0].innerHTML).to.eq(tagHTML));
        });
    });
});
