/**
 * Created by wzutz on 12/9/13.
 */

let Switchers = {
    offenders: [
        { original: "thaperfectdrug", new_name: "Dave-A", original_id: 2650 },
        { original: "MagicWishMonkey", new_name: "MaximDiscord", original_id: 160547, alt_id: 174688 },
        { original: "timaste", new_name: "timmytaste", original_id: 172749, alt_id: 10187646 },
        { original: "The Grolar Bear", new_name: "The Gorilla Bear", original_id: 209153, alt_id: 10187648 },
        { original: "jingletard", new_name: "Jingletardigrade", original_id: 194581, alt_id: 10196015 },
        { original: "ArB", new_name: "jingleArB", original_id: 159879, alt_id: 10195980 },
        { original: "Rigor Morts", new_name: "dewhickey", original_id: 173971, alt_id: 10196460 }
    ],

    loadSwitchers(item) {
        for (let iOffender = 0; iOffender < Switchers.offenders.length; iOffender++) {
            let offender = Switchers.offenders[iOffender];
            let offenderPosts = getDescendentsByTagAndAnyClassName(
                item,
                "div",
                "olauthor_" + offender.original_id
            );
            Switchers.rewritePosts(offenderPosts, offender);
            offenderPosts = getDescendentsByTagAndAnyClassName(item, "div", "fpauthor_" + offender.original_id);
            Switchers.rewritePosts(offenderPosts, offender);
            // include the nuId if we have one
            if (offender.alt_id != null) {
                let offenderPosts = getDescendentsByTagAndAnyClassName(
                    item,
                    "div",
                    "olauthor_" + offender.alt_id
                );
                Switchers.rewritePosts(offenderPosts, offender);
                offenderPosts = getDescendentsByTagAndAnyClassName(item, "div", "fpauthor_" + offender.alt_id);
                Switchers.rewritePosts(offenderPosts, offender);
            }
        }
    },

    rewritePosts(offenderPosts, offender) {
        if (offenderPosts) {
            for (let iPost = 0; iPost < offenderPosts.length; iPost++) {
                let post = offenderPosts[iPost];

                let newName = `${offender.original} - (${offender.new_name})`;
                let span = getDescendentByTagAndClassName(post, "span", "oneline_user");
                if (span) {
                    //For single line comments.
                    span.textContent = newName;
                } //For fully shown comments.
                else {
                    span = getDescendentByTagAndClassName(post, "span", "user");
                    if (span) {
                        span.firstChild.textContent = newName;
                    }
                }

                //Switchers don't deserve lightning
                let lightningbolt = getDescendentByTagAndClassName(post, "a", "lightningbolt");
                if (lightningbolt) {
                    $(lightningbolt).hide();
                }
            }
        }
    }
};

addDeferredHandler(enabledContains("switchers"), res => {
    if (res) processPostEvent.addHandler(Switchers.loadSwitchers);
});
