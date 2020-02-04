// ==UserScript==
// @name         Duolingo Hide Completed Skills
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  A Duolingo userscripts that toggle hide/show completed skills
// @author       Ponsheng
// @match        https://www.duolingo.com/*
// @grant        none
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// ==/UserScript==

var IsHiding = true;
const section_selector = "div.Xpzj7";
const row_selector = "div._2GJb6";
const skill_selector = "div.Af4up";
const completed_skill_selector = "div.Af4up div.ewiWc";

// Show / hide completed sections depends on 'IsHiding'
function Toggle(target) {
    var total_count = 0;
    // Hide sections
    var sections = $(section_selector);
    if (sections == null) {
        consol.log("Error, section not found");
    }
    sections.each(function(index, element) {

        // Hide rows
        var rows = $(this).find(row_selector);
        var row_count = 0;
        rows.each(function(index, element) {
            var skill_count = $(this).find(skill_selector).length;
            var complete_count = $(this).find(completed_skill_selector).length;
            if (skill_count == complete_count) {
                if (IsHiding) {
                    $(this).hide();
                } else {
                    $(this).show();
                }
                row_count += 1;
            }
        });
        if (rows.length == row_count && rows.length > 0) {
            if (IsHiding) {
                $(this).hide();
            } else {
                $(this).show();
            }
            total_count += 1;
        }
        total_count += row_count;
    });
    /*
    if (total_count > 0) {
        if (IsHiding) {
            console.log("Hide " + total_count + " elements");
        } else {
            console.log("Show " + total_count + " elements");
        }
    }*/
    return total_count;
}

function InsertBtn() {
    if ($('#myButton').length != 0) {
        //console.log("Button had been inserted");
        return;
    }
    var node = document.createElement ('div');
    node.innerHTML = '<button id="myButton" type="button">Toggle hide/show completed skills!</button>';
    node.setAttribute ('id', 'myContainer');
    $(".i12-l")[0].prepend(node);
    $("#myButton").on( "click", ButtonClickAction);
}

function ButtonClickAction (BtnEvent) {
    if (IsHiding) {
        IsHiding = false;
    } else {
        IsHiding = true;
    }
    Toggle($('body')[0]);
}

// Callback function to execute when mutations are observed
const ObsvrAction = function(mutationsList, observer) {
    var hide_count = 0;
    // Use traditional 'for loops' for IE 11
    for(let mutation of mutationsList) {
        if (mutation.type === 'childList') {
            // A child node has been added or removed
            for (var node of mutation.addedNodes) {
                if (IsHiding) {
                    hide_count += Toggle(node);
                }
            }
            if (hide_count > 0) {
                InsertBtn();
                // scroll to top
                $('html,body').scrollTop(0);
            }
        }
    }
};

// Options for the observer
const config = {childList: true};

const observer = new MutationObserver(ObsvrAction);

$(document).ready(function() {
    var body = $('body')[0];
    if (window.location.pathname != "/learn") {
        console.log("Not learn page");
        return;
    }
    var hide_count = Toggle(body);
    if (hide_count > 0) {
        InsertBtn();
    }
    // Start observing the target node for configured mutations
    observer.observe(body, config);
});
