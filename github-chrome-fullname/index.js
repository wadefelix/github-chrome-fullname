(function() {
    "use strict";

    /*global ReplaceRestricter, UserIdStringReplacer, UserIdReplacer*/
    var restricter = new ReplaceRestricter();
    var userIdStringReplacer = new UserIdStringReplacer("https://github.wdf.sap.corp");
    var userIdReplacer = new UserIdReplacer(restricter, userIdStringReplacer);

    // Check DOM size every second. After change of DOM elements replace user Ids.
    var lastDomSize;
    // Some pages might be slower than other. Therefor we throttle the replace speed on those.
    var throttledPageCheckCounter = 0;

    var userIdReplacerPoller = function(){
        var isThrottledPage = restricter.isThrottledPage(window.location.href);
        var timeoutForNextCheck = isThrottledPage ? 4000 : 1000;
        var replaceAllowed = true;
        if(isThrottledPage){
            replaceAllowed = throttledPageCheckCounter === 1;
            throttledPageCheckCounter++;
        } else {
            throttledPageCheckCounter = 0;
        }
        var currentDomSize = document.getElementsByTagName("*").length;
        if (replaceAllowed && currentDomSize !== lastDomSize) {
            lastDomSize = currentDomSize;
            userIdReplacer.replaceUserIDs();
        }
        window.setTimeout(userIdReplacerPoller, timeoutForNextCheck);
    };
    userIdReplacerPoller();

})();
