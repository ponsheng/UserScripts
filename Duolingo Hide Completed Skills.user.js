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
const div_prepend_btn_selector = ".i12-l";

var target_body;

function HideNode(node) {
    node.hide();
}

function ShowNode(node) {
    node.show();
}

function Toggle (target) {
    var ret;
    if (IsHiding) {
        ret = ActOnTarget(target, HideNode);
    } else {
        ret = ActOnTarget(target, ShowNode);
    }
    return ret;
}

// Show / hide completed sections depends on 'IsHiding'
function ActOnTarget(target, action) {
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
                action($(this));
                row_count += 1;
            }
        });
        if (rows.length == row_count && rows.length > 0) {
            action($(this));
            total_count += 1;
        }
        total_count += row_count;
    });
    return total_count;
}

function ButtonClickAction (BtnEvent) {
    if (IsHiding) {
        IsHiding = false;
    } else {
        IsHiding = true;
    }
    Toggle(target_body);
}

function InsertBtn() {
    if ($('#HCSButton').length != 0) {
        //console.log("Button had been inserted");
        return;
    }
    // TODO Add style to button
    var node = document.createElement ('div');
    node.innerHTML = '<button id="HCSButton" type="button">Toggle hide/show completed skills!</button>';
    node.setAttribute ('id', 'HCSContainer');
    $(div_prepend_btn_selector)[0].prepend(node);
    $("#HCSButton").on( "click", ButtonClickAction);
    console.log("Inserted toggle button");
    // Scroll to top
    // TODO Add button to scroll to incompleted skills
    if (IsHiding) {
        $('html, body').animate({ scrollTop: 0 }, 'fast');
        console.log("ScrollTop");
    }
}

// Callback function to execute when mutations are observed
const ObsvrAction = function(mutationsList, observer) {
    var AddNew = false;
    // Use traditional 'for loops' for IE 11
    for (let mutation of mutationsList) {
        if (mutation.type === 'childList') {
            // A child node has been added or removed
            if (mutation.addedNodes.length > 0) {
                AddNew = true;
            }
        }
    }
    if (!AddNew) {
        return ;
    }
    if (Toggle(target_body) > 0) {
        InsertBtn();
    }
};

// Options for the observer
const config = {childList: true, subtree: true};

const observer = new MutationObserver(ObsvrAction);

$(document).ready(function() {
    target_body = $('body')[0];
    var hide_count = Toggle(target_body);
    if (hide_count > 0) {
        InsertBtn();
    }
    // Start observing the target node for configured mutations
    observer.observe(target_body, config);
});