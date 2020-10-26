/// <reference types="Cypress" />

import "cypress-file-upload";
const addExtensionCommands = require("cypress-browser-extension-plugin/commands");
addExtensionCommands(Cypress);

Cypress.Commands.add("isInViewport", { prevSubject: true }, (subject) => {
    const bottom = Cypress.$(cy.state("window")).height();
    const rect = subject[0].getBoundingClientRect();

    expect(rect.top).not.to.be.greaterThan(bottom);
    expect(rect.bottom).not.to.be.greaterThan(bottom);

    return subject;
});

Cypress.Commands.add("loadExtensionDefaults", (opts, data) =>
    cy.window().then((win) => {
        const _opts = Object.assign({}, { defaults: true }, opts);
        const _data = Object.assign({}, { enabled_suboptions: ["testing_mode"] }, data);
        console.log("loadExtensionDefaults:", _opts, _data);
        win.localStorage["transient-opts"] = JSON.stringify(_opts);
        win.localStorage["transient-data"] = JSON.stringify(_data);
    }),
);
