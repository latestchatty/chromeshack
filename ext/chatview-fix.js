/*
 * Leverage browser.runtime.executeScript() to fix content isolation
 * ... issues with Webkit browsers. Unfortunately, we need to import
 * ... and inject a patched 'chatview.js' to accomplish this.
*/

// start external code
var sLastClickedItem = -1;
var sLastClickedRoot = -1;
var scroll_y;
chat_start_up();
function chat_start_up() {
    if (typeof (window["$"]) == "undefined") {
        setTimeout("chat_start_up()", 500)
    } else {
        $(document).ready(function(a) {
            $(document).keydown(function(b) {
                chat_onkeypress(b)
            })
        });
        $(document).mousemove(function(a) {
            scroll_y = (a.pageY - $(window).scrollTop())
        })
    }
}
function scroll_and_new_comment() {
    window.location.hash = "newcommentbutton";
    new_comment();
    return false
}
function navigate_page_no_history(a, b) {
    the_window = a;
    a.location.replace("about:blank");
    a.location.replace(b)
}
function check_event_target(a) {
    if (a.target) {
        return a.target.type != "textarea" && a.target.type != "input"
    } else {
        if (a.srcElement) {
            return !a.srcElement.isTextEdit
        } else {
            return false
        }
    }
}
function get_items_for_root(f) {
    var e = document.getElementById("root_" + f);
    var b = e.getElementsByTagName("li");
    var a = new Array();
    var d = 0;
    var c = 0;
    for (d = 0; d < b.length; ++d) {
        if (b[d].id && b[d].id.indexOf("item_") == 0) {
            a[c++] = b[d].id
        }
    }
    return a
}
function get_prior_item_for_root(e, f) {
    var a = get_items_for_root(e);
    var d = false;
    var c = false;
    var b = 0;
    for (b = 0; b < a.length; ++b) {
        if (a[b] == "item_" + f) {
            d = true;
            break
        }
        c = a[b]
    }
    if (d) {
        return c
    } else {
        return false
    }
}
function get_next_item_for_root(e, f) {
    var a = get_items_for_root(e);
    var c = false;
    var d = false;
    var b = 0;
    for (b = 0; b < a.length; ++b) {
        if (a[b] == "item_" + f) {
            c = true
        } else {
            if (c) {
                d = a[b];
                break
            }
        }
    }
    if (d) {
        return d
    } else {
        return false
    }
}
function get_item_number_from_item_string(a) {
    if (a != false && a.indexOf("item_") == 0) {
        return a.substr(5)
    } else {
        return false
    }
}
function chat_onkeypress(b) {
    if (!b) {
        b = window.event
    }
    var a = String.fromCharCode(b.keyCode);
    if (sLastClickedItem != -1 && sLastClickedRoot != -1 && check_event_target(b)) {
        if (a == "Z") {
            id = get_item_number_from_item_string(get_next_item_for_root(sLastClickedRoot, sLastClickedItem));
            if (id != false) {
                clickItem(sLastClickedRoot, id)
            }
        }
        if (a == "A") {
            id = get_item_number_from_item_string(get_prior_item_for_root(sLastClickedRoot, sLastClickedItem));
            if (id != false) {
                clickItem(sLastClickedRoot, id)
            }
        }
    }
    return true
}
function toggle_chat_settings() {
    var a = document.getElementById("commentssettings");
    if (does_element_have_class(a, "hidden")) {
        remove_class_from_element(a, "hidden")
    } else {
        add_class_to_element(a, "hidden")
    }
    return false
}
function remove_old_fullpost(g, c, a) {
    var b = a.getElementById("root_" + g);
    var d = 0;
    var f = find_elements_by_class(b, "DIV", "fullpost");
    for (d = 0; d < f.length; ++d) {
        var e = f[d];
        if ((e.parentNode.id != "item_" + g) || (c == g)) {
            e.parentNode.className = remove_from_className(e.parentNode.className, "sel");
            var h = find_element(e.parentNode, "DIV", "oneline");
            h.className = remove_from_className(h.className, "hidden");
            e.parentNode.removeChild(e)
        }
    }
}
function show_item_fullpost(f, h, b) {
    remove_old_fullpost(f, h, parent.document);
    var k = parent.document.getElementById("root_" + f);
    var e = parent.document.getElementById("item_" + h);
    push_front_element(e, b);
    scrollToItem(b); // patched scroll-to-post
    e.className = add_to_className(e.className, "sel");
    var c = find_element(e, "DIV", "oneline");
    c.className = add_to_className(c.className, "hidden")
}
function on_reply_close() {
    var a = document.getElementById("postbox");
    if (a) {
        fixup_postbox_parent_for_remove(a.parentNode)
    }
}
function close_reply_if_inside(a) {
    var b = document.getElementById("postbox");
    var c = document.getElementById("item_" + a);
    if (b && c) {
        if (is_element_child_of(b, c)) {
            fixup_postbox_parent_for_remove(b.parentNode)
        }
    }
}
function close_post(a) {
    close_reply_if_inside(a);
    var g = document.getElementById("root_" + a);
    if (g) {
        var d = document.getElementById("item_" + a);
        var f = find_element(d, "DIV", "fullpost");
        var h = find_element(f, "DIV", "postmeta");
        var b = find_element(h, "A", "showpost");
        var c = find_element(h, "A", "closepost");
        add_class_to_element(g, "collapsed");
        remove_class_from_element(b, "hidden");
        add_class_to_element(c, "hidden")
    } else {
        var d = document.getElementById("item_" + a);
        var f = find_element(d, "DIV", "fullpost");
        var e = find_element(d, "DIV", "oneline");
        if (d && f && e) {
            remove_class_from_element(d, "sel");
            remove_class_from_element(e, "hidden");
            d.removeChild(f)
        }
    }
}
function toggle_collapse(b) {
    var d = document.getElementById("item_" + b);
    if (d) {
        var e = find_element(d, "DIV", "oneline");
        var f = find_element(e, "DIV", "treecollapse");
        close_reply_if_inside(b);
        if (f) {
            var c = e.parentNode.getElementsByTagName("UL");
            var a = f.getElementsByTagName("A");
            if ((c.length > 0) && (a.length > 0)) {
                if (does_element_have_class(c[0], "hidden")) {
                    remove_class_from_element(c[0], "hidden");
                    remove_class_from_element(a[0], "closed");
                    add_class_to_element(a[0], "open")
                } else {
                    add_class_to_element(c[0], "hidden");
                    remove_class_from_element(a[0], "open");
                    add_class_to_element(a[0], "closed")
                }
            }
        }
    }
}
function show_post(a) {
    var f = document.getElementById("root_" + a);
    if (f) {
        var d = document.getElementById("item_" + a);
        var e = find_element(d, "DIV", "fullpost");
        var g = find_element(e, "DIV", "postmeta");
        var b = find_element(g, "A", "showpost");
        var c = find_element(g, "A", "closepost");
        remove_class_from_element(f, "collapsed");
        remove_class_from_element(c, "hidden");
        add_class_to_element(b, "hidden")
    }
}
function fixup_postbox_parent_for_remove(b) {
    if (does_element_have_class(b, "inlinereply")) {
        var a = find_element(b.parentNode, "DIV", "fullpost");
        if (a) {
            remove_class_from_element(a, "replying")
        }
        b.parentNode.removeChild(b)
    } else {
        if (does_element_have_class(b, "newcommentform")) {
            if (b.hasChildNodes()) {
                var c = b.parentNode;
                add_class_to_element(c, "formclosed");
                remove_class_from_element(c, "formopen");
                b.removeChild(b.firstChild)
            }
        }
    }
}
function init_new_postbox() {
    var b = document.getElementById("postbox");
    var c = document.getElementsByName("body");
    var a;
    for (a = 0; a < c.length; ++a) {
        if (is_element_child_of(c[a], b)) {
            c[a].focus();
            break
        }
    }
}
function new_comment() {
    var f = document.getElementById("newcommentbutton");
    var e = f.parentNode;
    if (does_element_have_class(e, "formopen")) {
        fixup_postbox_parent_for_remove(document.getElementById("postbox").parentNode)
    } else {
        var d = document.getElementById("postbox");
        if (d) {
            fixup_postbox_parent_for_remove(d.parentNode)
        }
        var c = document.getElementById("postbox_template");
        var b = c.cloneNode(true);
        b.id = "postbox";
        add_class_to_element(e, "formopen");
        remove_class_from_element(e, "formclosed");
        var a = find_element(e, "div", "newcommentform");
        a.appendChild(b);
        init_new_postbox()
    }
}
function move_postbox_here(k, b, d) {
    var j = document.getElementById("item_" + k);
    var c = find_element(j, "DIV", "fullpost");
    if (c) {
        var g = find_element(c.parentNode, "DIV", "inlinereply");
        if (!g) {
            g = document.createElement("div");
            g.className = "inlinereply";
            append_element_after_element(g, c)
        }
        if (g.hasChildNodes()) {
            fixup_postbox_parent_for_remove(g)
        } else {
            var a = document.getElementById("postbox");
            if (a) {
                fixup_postbox_parent_for_remove(a.parentNode)
            }
            var m = document.getElementById("postbox_template");
            var h = m.cloneNode(true);
            h.id = "postbox";
            var l = find_element_by_name(h, "input", "parent_id");
            l.value = k;
            var f = find_element_by_name(h, "input", "content_id");
            f.value = b;
            var e = find_element_by_name(h, "input", "content_type_id");
            e.value = d;
            g.appendChild(h);
            add_class_to_element(c, "replying");
            init_new_postbox()
        }
    }
}
function copy_iframe_fullpost_3(b, a) {
    if (iframe_fullpost_element = find_element(document, "DIV", "fullpost")) {
        alert("here item_" + a);
        copy_iframe_fullpost_2(b, a, iframe_fullpost_element)
    }
}
function copy_iframe_fullpost_2(c, b, d) {
    var a = import_node(parent.document, d);
    show_item_fullpost(c, b, a)
}
function copy_iframe_onepost(b, a) {
    copy_iframe_fullpost_2(b, a, find_element(document, "DIV", "fullpost"));
    navigate_page_no_history(window, "/frame_chatty.x?root=" + b)
}
function import_node(c, b) {
    if (c.importNode) {
        return c.importNode(b, true)
    } else {
        var a = c.createElement("div");
        a.innerHTML = b.outerHTML;
        return a.firstChild.cloneNode(true)
    }
}
function clickItem(b, f) {
    var d = window.frames.dom_iframe;
    var e = d.document.getElementById("item_" + f);
    if (uncap_thread(b)) {
        elem_position = $("#item_" + f).position();
        scrollToItem($("li#item_" + f).get(0)); // patched scroll-to-post
    }
    sLastClickedItem = f;
    sLastClickedRoot = b;
    if (d.document.getElementById("items_complete") && e) {
        var c = find_element(e, "DIV", "fullpost");
        var a = import_node(document, c);
        show_item_fullpost(b, f, a);
        return false
    } else {
        path_pieces = document.location.pathname.split("?");
        parent_url = path_pieces[0];
        navigate_page_no_history(d, "/frame_chatty.x?root=" + b + "&id=" + f + "&parent_url=" + parent_url);
        return false
    }
}
function navigate_in_iframe(b) {
    var a = window.frames.dom_iframe;
    navigate_page_no_history(a, "/" + b)
}
function do_iframe_logout() {
    var c = parent.document.getElementsByName("loginform");
    for (i = 0; i < c.length; ++i) {
        var b = c[i];
        var a = find_element(b, "DIV", "loggedin");
        var d = find_element(b, "DIV", "anon");
        var e = find_element(b, "DIV", "login");
        remove_class_from_element(d, "hidden");
        add_class_to_element(a, "hidden");
        add_class_to_element(e, "hidden")
    }
}
function do_iframe_login(g) {
    var c = parent.document.getElementsByName("loginform");
    for (i = 0; i < c.length; ++i) {
        var b = c[i];
        var a = find_element(b, "DIV", "loggedin");
        var d = find_element(b, "DIV", "anon");
        var e = find_element(b, "DIV", "login");
        var f = find_element_by_name(b, "INPUT", "type");
        remove_class_from_element(a, "hidden");
        add_class_to_element(d, "hidden");
        add_class_to_element(e, "hidden");
        f.value = "logout";
        var c = a.getElementsByTagName("SPAN");
        if (c && c.length > 0) {
            while (c[0].firstChild) {
                c[0].removeChild(c[0].firstChild)
            }
            c[0].appendChild(parent.document.createTextNode(g))
        }
    }
}
function do_anon_to_login() {
    var c = document.getElementsByName("loginform");
    for (i = 0; i < c.length; ++i) {
        var b = c[i];
        var a = find_element(b, "DIV", "loggedin");
        var d = find_element(b, "DIV", "anon");
        var e = find_element(b, "DIV", "login");
        var f = find_element_by_name(b, "INPUT", "type");
        remove_class_from_element(e, "hidden");
        add_class_to_element(d, "hidden");
        add_class_to_element(a, "hidden");
        f.value = "login"
    }
}
function remove_spoiler(a) {
    var b = a;
    while (!does_element_have_class(b, "root")) {
        if (does_element_have_class(b, "jt_spoiler")) {
            add_class_to_element(b, "jt_spoiler_clicked");
            remove_class_from_element(b, "jt_spoiler")
        }
        b = b.parentNode
    }
}
function doSpoiler(a) {
    var c = document.all && navigator.appVersion.indexOf("MSIE") != -1;
    if (c) {
        var b = a.srcElement;
        while (!does_element_have_class(b, "postbody") && !does_element_have_class(b, "oneline_body")) {
            if (does_element_have_class(b, "jt_spoiler")) {
                remove_spoiler(a.srcElement);
                a.cancelBubble = true;
                return false
            }
            b = b.parentNode
        }
    } else {
        var b = a.target;
        while (!does_element_have_class(b, "postbody") && !does_element_have_class(b, "oneline_body")) {
            if (does_element_have_class(b, "jt_spoiler")) {
                remove_spoiler(a.target);
                a.stopPropagation();
                return false
            }
            b = b.parentNode
        }
    }
}
function close_nukebox() {
    var a = document.getElementById("nukebox");
    if (a) {
        a.parentNode.removeChild(a)
    }
    return false
}
function do_nuke(a, h, e, k) {
    close_nukebox();
    var m = document.getElementById("item_" + a);
    var f = find_element(m, "DIV", "nukeboxparent");
    var j = document.getElementById("nukebox_parent_node");
    var d = j.cloneNode(true);
    d.id = "nukebox";
    d.className = "";
    var l = find_element_by_name(d, "input", "root_id");
    var g = find_element_by_name(d, "input", "nuke_post");
    var c = find_element_by_name(d, "input", "nuke_who");
    var b = find_element_by_name(d, "input", "nuke_user_id");
    l.value = h;
    g.value = a;
    c.value = e;
    b.value = k;
    f.appendChild(d)
}
function uncap_thread(b) {
    var a = document.getElementById("root_" + b);
    if (a && does_element_have_class(a, "capped")) {
        remove_class_from_element(a, "capped");
        return true
    } else {
        return false
    }
}
function add_to_className(c, b) {
    var a = c.split(" ");
    if (index_in_array(a, b) == -1) {
        a[a.length] = b
    }
    return a.join(" ")
}
function remove_class_from_element(a, b) {
    a.className = remove_from_className(a.className, b)
}
function add_class_to_element(a, b) {
    a.className = add_to_className(a.className, b)
}
function does_element_have_class(a, b) {
    if (index_in_array(a.className.split(" "), b) > (-1)) {
        return true
    } else {
        return false
    }
}
function find_element(b, e, d) {
    var c = b.getElementsByTagName(e);
    for (var a = 0; a < c.length; ++a) {
        if (index_in_array(c[a].className.split(" "), d) > -1) {
            return c[a]
        }
    }
    return false
}
function append_element_after_element(c, b) {
    var a = b.nextSibling;
    if (a) {
        a.parentNode.insertBefore(c, a)
    } else {
        b.parentNode.appendChild(c)
    }
}
function find_elements_by_class(b, f, d) {
    var c = b.getElementsByTagName(f);
    var e = new Array();
    for (var a = 0; a < c.length; ++a) {
        if (index_in_array(c[a].className.split(" "), d) > -1) {
            e.push(c[a])
        }
    }
    return e
}
function find_element_by_name(b, e, d) {
    var c = b.getElementsByTagName(e);
    for (var a = 0; a < c.length; ++a) {
        if (c[a].name == d) {
            return c[a]
        }
    }
    return false
}
function push_front_element(c, a) {
    var b = c.childNodes;
    if (b.length > 0) {
        return c.insertBefore(a, b[0])
    } else {
        return c.appendChild(a)
    }
}
function remove_from_className(c, b) {
    var a = remove_value_from_array(c.split(" "), b);
    return a.join(" ")
}
function replace_whole_element_from_iframe(c) {
    var a = import_node(parent.document, document.getElementById(c));
    var b = parent.document.getElementById(c);
    b.parentNode.replaceChild(a, b)
}
function remove_from_array(a, e) {
    if (e != -1) {
        var d = 0;
        var c = 0;
        var b = new Array();
        for (d = 0; d < a.length; ++d) {
            if (d != e) {
                b[c] = a[d];
                ++c
            }
        }
        return b
    } else {
        return a
    }
}
function index_in_array(a, d) {
    var b = a.length;
    for (var c = 0; c < b; ++c) {
        if (a[c] == d) {
            return c
        }
    }
    return -1
}
function remove_value_from_array(a, c) {
    var b = index_in_array(a, c);
    return remove_from_array(a, b)
}
function is_element_child_of(a, c) {
    var b = a.parentNode;
    while (b) {
        if (b == c) {
            return true
        }
        b = b.parentNode
    }
    return false
}
function jump_to_anchor(a) {
    window.location.hash = a
}
function jump_to_anchor_from_iframe(a) {
    parent.window.location.hash = a
}
function QuickEntry(b, a, c) {
    GetSelection(b, a)
}
function GetSelection(d, e) {
    var b = false;
    var k = false;
    if (navigator.userAgent.toLowerCase().indexOf("firefox") > 0) {
        b = true
    }
    var g = document.getElementById("frm_body");
    var c, j, f;
    if (b == true) {
        if (g.selectionStart != undefined) {
            c = g.value.substr(0, g.selectionStart);
            j = g.value.substr(g.selectionStart, g.selectionEnd - g.selectionStart);
            f = g.value.substr(g.selectionEnd);
            if (j.length > 0) {
                k = true
            }
        }
    } else {
        if (window.getselection) {
            j = window.getselection()
        } else {
            if (document.getselection) {
                j = document.getselection()
            } else {
                if (document.selection) {
                    j = document.selection.createRange().text
                }
            }
        }
        var h = g.value.indexOf(j);
        if (j.length > 0) {
            var a = GetCaretPosition(g) + j.length;
            c = g.value.substr(0, GetCaretPosition(g));
            f = g.value.substr(a, g.value.length);
            k = true
        }
    }
    if (k == true) {
        g.value = c + d + j + e + f
    }
}
function GetCaretPosition(d) {
    var b = 0;
    if (document.selection) {
        d.focus();
        var a = document.selection.createRange();
        var c = a.duplicate();
        c.moveToElementText(d);
        var b = -1;
        while (c.inRange(a)) {
            c.moveStart("character");
            b++
        }
    } else {
        if (d.selectionStart || d.selectionStart == "0") {
            b = d.selectionStart
        }
    }
    return (b)
}
function toggle_shacktags_legend() {
    $("#shacktags_legend_table").toggle()
}
function scrollToItem(b) {
    if (!elementVisible(b)) {
        $(b).animate({ scrollTop: $('body').scrollTop() + $(b).offset().top - $('body').offset().top }, 0);
        $('html, body').animate({ scrollTop: $(b).offset().top - ($(window).height()/4) }, 0);
    }
}
function elementVisible(b) {
    var elementTop = $(b).offset().top;
    var elementBottom = elementTop + $(b).outerHeight();
    var viewportTop = $(window).scrollTop();
    var viewportBottom = viewportTop + $(window).height();
    return elementBottom > viewportTop && elementTop < viewportBottom;
}
// end external code

// start local code
let monkeyPatch = /*javascript*/`
    function clickItem(b, f) {
        var d = window.frames.dom_iframe;
        var e = d.document.getElementById("item_" + f);
        if (uncap_thread(b)) {
            elem_position = $("#item_" + f).position();
            scrollToItem($("li#item_" + f).get(0)); // patched
        }
        sLastClickedItem = f;
        sLastClickedRoot = b;
        if (d.document.getElementById("items_complete") && e) {
            var c = find_element(e, "DIV", "fullpost");
            var a = import_node(document, c);
            show_item_fullpost(b, f, a);
            return false
        } else {
            path_pieces = document.location.pathname.split("?");
            parent_url = path_pieces[0];
            navigate_page_no_history(d, "/frame_chatty.x?root=" + b + "&id=" + f + "&parent_url=" + parent_url);
            return false
        }

        function scrollToItem(b) {
            if (!elementVisible(b)) {
                $(b).animate({ scrollTop: $('body').scrollTop() + $(b).offset().top - $('body').offset().top }, 0);
                $('html, body').animate({ scrollTop: $(b).offset().top - ($(window).height()/4) }, 0);
            }
        }
        function elementVisible(b) {
            var elementTop = $(b).offset().top;
            var elementBottom = elementTop + $(b).outerHeight();
            var viewportTop = $(window).scrollTop();
            var viewportBottom = viewportTop + $(window).height();
            return elementBottom > viewportTop && elementTop < viewportBottom;
        }
    }
`;
// end local code


// injection logic for chatview-fix
var chatViewFixElem = document.createElement("script");
chatViewFixElem.id = "chatviewfix-wjs";
chatViewFixElem.innerHTML = `${monkeyPatch}`;
var bodyRef = document.getElementsByTagName("body")[0];
var cvfRef = document.getElementById("chatviewfix-wjs");
if (cvfRef) { bodyRef.removeChild(cvfRef); }
bodyRef.appendChild(chatViewFixElem);
