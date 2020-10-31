/// <reference types="Cypress" />

describe("Postbox interactions", () => {
    beforeEach(() => {
        cy.fixture("_shack_li_").then((li) => cy.setCookie("_shack_li_", li, { domain: "shacknews.com" }));
    });

    context("Reply input/submission", () => {
        it("Drafts input and persistence", () => {
            cy.loadExtensionDefaults(null, { enabled_scripts: ["drafts"], saved_drafts: [] });

            cy.visit("https://www.shacknews.com/chatty?id=38731437#item_38731437");
            cy.get("li li.sel div.reply>a").as("replyBtn").click();
            cy.get("div.drafts__dot").as("draftsDot").should("have.class", "invalid");

            const message =
                "Aliquam purus sit amet luctus venenatis lectus magna fringilla urna. Fames ac turpis egestas maecenas pharetra convallis posuere morbi leo. Nunc mi ipsum faucibus vitae aliquet nec ullamcorper sit amet. 👍🏼";
            cy.get("#frm_body").as("replyInput").type(message, { delay: 0 }).wait(333);
            cy.get("@draftsDot").should("have.class", "valid");

            cy.reload();
            cy.get("@replyBtn").click();
            cy.get("@replyInput").should("have.value", message);
            cy.get("@draftsDot").should("have.class", "valid");
        });

        it("PostPreview tag interactions", () => {
            cy.loadExtensionDefaults(null, { enabled_scripts: ["post_preview"] });
            cy.reload();

            cy.log("test post-preview enablement persistence");
            cy.get("li li.sel div.reply > a").as("replyBtn").click();
            cy.get("#previewButton").click();
            cy.get("#frm_body").as("replyInput");
            cy.get("#previewArea").as("previewArea");
            cy.get("@previewArea").should("be.visible");
            cy.reload();
            cy.get("@replyBtn").click();
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
