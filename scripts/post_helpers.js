/*
 *  Shared Chatty Post Helper Functions
 */

function ordinalContains(haystack, needle, relaxed) {
    // similar to ES6 includes() but fuzzy
    if (relaxed)
        return haystack.toLowerCase().indexOf(needle.toLowerCase()) > -1;
    else
        return haystack.indexOf(needle) == 0;
}

function has(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
}

function closestParent(elem, { cssSelector, indexSelector }) {
    // search backwards in the DOM for the closest parent whose attributes match a selector
    for(; elem && elem !== document; elem = elem.parentNode) {
        for (var attrChild of Array.from(elem.attributes)) {
            if (indexSelector && !!elem && attrChild.textContent.indexOf(indexSelector) > -1)
                return elem;
            else if (cssSelector && !!elem) {
                // slower css regex selector method (can match the elem as well)
                var match = elem.querySelector(`:scope ${cssSelector}`);
                if (!!match) return match;
            }
        }
    }
    return null;
}

function hasAttrInElem(elem, needle) {
    // quick fuzzy search for text in attributes of an element
    var _attrs = elem.attributes;
    for (var i=0; i < _attrs.length; i++) {
        if (_attrs[i].nodeValue.indexOf(needle) > -1)
            return true;
    }
    return false;
}

function matchAttrInElem(elem, regex) {
    // return regex matches from attributes of an element
    var _attrs = elem.attributes;
    for (var i=0; i < _attrs.length; i++) {
        if (regex.test(_attrs[i].nodeValue))
            return regex.exec(_attrs[i].nodeValue);
    }
    return null;
}

function getUserIdFromElem(relElem) {
    try {
        // use fuzzy relative element search to find uID from closest parent author tag
        var parentFPAuthorElem = closestParent(relElem, { indexSelector: "fpauthor_" });
        var parentOLAuthorElem = closestParent(relElem, { indexSelector: "olauthor_" });
        if (parentFPAuthorElem != null) {
            for (var attr of parentFPAuthorElem.attributes) {
                var match = /fpauthor_(\d+)/i.exec(attr.nodeValue);
                if (!!match)
                    return parseInt(match[1]);
            }
        }
        else if (parentOLAuthorElem != null) {
            for (var attr of parentOLAuthorElem.attributes) {
                var match = /olauthor_(\d+)/i.exec(attr.nodeValue);
                if (!!match)
                    return parseInt(match[1]);
            }
        }
        return -1;
    } catch (e) { console.log(e); }
}

function getUserIdFromContainer(elemContainer) {
    try {
        // use fuzzy css matching to find uID and refs of a username from a post container
        var childFPAuthorElem = elemContainer.querySelectorAll(".postmeta span.user");
        var childOLAuthorElem = elemContainer.querySelectorAll(".oneline span.oneline_user");
        var concatPosts = [].concat.apply(Array.from(childFPAuthorElem), Array.from(childOLAuthorElem));
        if (concatPosts.length > 0)
            return getUserIdFromElem(concatPosts[1]);

        return -1;
    } catch (e) { console.log(e); }
}
