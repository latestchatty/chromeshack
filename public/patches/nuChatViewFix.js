// monkeypatch for Chatty's broken scroll-to-post functionality
function scrollToElement(elem, opts) {
    if (!elem) return false;
    const { offset, smooth, toFit } = opts || {};
    const headerHeight = -(document.querySelector("header")?.getBoundingClientRect().height + 6);
    const _offset = offset === undefined ? headerHeight : offset;
    // position visibly by default - use offset if 'toFit'
    const visibleY = toFit ? _offset : -($(window).height() / 4);
    const scrollY = elem.getBoundingClientRect().top + window.scrollY + visibleY;
    window.scrollTo({ top: scrollY, behavior: smooth ? "smooth" : "auto" });
}
function elementIsVisible(elem, partialBool) {
    if (!elem) return false;
    const rect = elem.getBoundingClientRect();
    const visibleHeight = window.innerHeight;
    if (partialBool) return rect.top <= visibleHeight && rect.top + rect.height >= 0;
    return rect.top >= 0 && rect.top + rect.height <= visibleHeight;
}
function elementFitsViewport(elem) {
    if (!elem) return false;
    const headerHeight = document.querySelector("header")?.getBoundingClientRect().height + 6;
    const elemHeight = elem.getBoundingClientRect().height;
    const visibleHeight = window.innerHeight;
    return elemHeight < visibleHeight - headerHeight;
}
function scrollToItem(b) {
    if (!elementIsVisible(b) && elementFitsViewport(b)) scrollToElement(b);
    else if (!elementIsVisible(b) && !elementFitsViewport(b)) scrollToElement(b, { toFit: true });
}
function show_item_fullpost(f, h, b) {
    remove_old_fullpost(f, h, parent.document);
    const k = parent.document.getElementById("root_" + f);
    const e = parent.document.getElementById("item_" + h);
    push_front_element(e, b);
    scrollToItem(e);
    e.className = add_to_className(e.className, "sel");
    const c = find_element(e, "DIV", "oneline");
    c.className = add_to_className(c.className, "hidden");
}
function clickItem(b, f) {
    const d = window.frames.dom_iframe;
    const e = d.document.getElementById("item_" + f);
    if (uncap_thread(b)) {
        elem_position = $("#item_" + f).position();
        scrollToItem($("li#item_" + f).get(0));
    }
    sLastClickedItem = f;
    sLastClickedRoot = b;
    if (d.document.getElementById("items_complete") && e) {
        const c = find_element(e, "DIV", "fullpost");
        const a = import_node(document, c);
        show_item_fullpost(b, f, a);
        return false;
    } else {
        path_pieces = document.location.pathname.split("?");
        parent_url = path_pieces[0];
        navigate_page_no_history(d, "/frame_chatty.x?root=" + b + "&id=" + f + "&parent_url=" + parent_url);
        return false;
    }
}
let chatViewFixEl = document.createElement("script");
chatViewFixEl.id = "chatviewfix";
chatViewFixEl.textContent = `${elementFitsViewport.toString()}${scrollToElement.toString()}${elementIsVisible.toString()}${clickItem.toString()}${show_item_fullpost.toString()}${scrollToItem.toString()}`;
document.querySelector("body").appendChild(chatViewFixEl);
