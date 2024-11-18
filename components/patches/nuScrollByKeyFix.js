export default defineUnlistedScript(() => {
  // monkeypatch nuChatty's broken scroll-post-by-A/Z functionality
  function check_event_target(a) {
    // use chrome/firefox methods to check the event target
    return a.target && a.target.nodeName !== "TEXTAREA" && a.target.nodeName !== "INPUT";
  }
  function chat_onkeypress(b) {
    // biome-ignore lint/style/noParameterAssign: reason
    if (!b) b = window.event;
    const first_load = sLastClickedItem === -1 && sLastClickedRoot === -1;
    const _url = window.location.href;
    const _postid = _url?.split("item_")[1];
    const _item = _postid && document.querySelector(`li#item_${_postid}`);
    const _root = _item?.closest("div.root");
    const _rootid = _root && Number.parseInt(_root.id.substring(5), 10);
    if (first_load && _rootid && _postid) clickItem(_rootid, _postid);

    const is_valid_target = sLastClickedItem !== -1 && sLastClickedRoot !== -1 && check_event_target(b);
    const a = String.fromCharCode(b.keyCode);
    const id =
      a === "Z"
        ? get_item_number_from_item_string(get_next_item_for_root(sLastClickedRoot, sLastClickedItem))
        : a === "A"
          ? get_item_number_from_item_string(get_prior_item_for_root(sLastClickedRoot, sLastClickedItem))
          : false;

    if (is_valid_target && id) {
      clickItem(sLastClickedRoot, id);
      const elem = document.querySelector(`li#item_${id} span.oneline_body`);
      elem.click();
    }
    return true;
  }
  // biome-ignore lint/style/useConst: "needed for DOM reloads"
  let scrollByKeyFixEl = document.createElement("script");
  scrollByKeyFixEl.id = "scrollbykeyfix";
  scrollByKeyFixEl.textContent = `${check_event_target.toString()}${chat_onkeypress.toString()}`;
  document.querySelector("body").appendChild(scrollByKeyFixEl);
});
