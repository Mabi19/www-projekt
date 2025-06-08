/** @param {HTMLDetailsElement} details  */
export function setUpFolderAnimations(details) {
    /** @type HTMLElement */
    const summary = details.querySelector("summary");
    /** @type HTMLElement */
    const content = details.querySelector("ul.directory-list");
    /** @type Animation | null  */
    let anim = null;

    function animateStateChange() {
        if (!details.open) {
            details.open = true;
            anim = content.animate({
                height: [0, `${content.offsetHeight}px`]
            }, {
                duration: 250,
                easing: "ease-out"
            });
            anim.addEventListener("finish", () => {
                finishAnim();
            })
        } else {
            anim = content.animate({
                height: [`${content.offsetHeight}px`, 0]
            }, {
                duration: 250,
                easing: "ease-out"
            });
            anim.addEventListener("finish", () => {
                finishAnim();
                details.open = false;
            });
        }
    }

    function finishAnim() {
        anim = null;
        details.style.overflow = "auto";
    }

    summary.addEventListener("click", (ev) => {
        ev.preventDefault();

        if (anim) {
            anim.addEventListener("finish", () => animateStateChange());
        } else {
            animateStateChange();
        }
    })
}
