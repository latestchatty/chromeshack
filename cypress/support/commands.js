/// <reference types="Cypress" />

const addExtensionCommands = require("cypress-browser-extension-plugin/commands");
addExtensionCommands(Cypress);

Cypress.Commands.add("isInViewport", { prevSubject: true }, (subject) => {
    const bottom = Cypress.$(cy.state("window")).height();
    const rect = subject[0].getBoundingClientRect();

    expect(rect.top).not.to.be.greaterThan(bottom);
    expect(rect.bottom).not.to.be.greaterThan(bottom);

    return subject;
});
