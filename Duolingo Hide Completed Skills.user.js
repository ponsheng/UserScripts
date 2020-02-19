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
var IsDebug = false;

// Selectors
const section_selector = "div.Xpzj7";
const row_selector = "div._2GJb6";
const skill_selector = "div.Af4up";
const completed_skill_selector = "div.Af4up div.ad-OG";//.ewiWc";
const div_prepend_btn_selector = ".i12-l";

const selectors = [
    'section_selector', section_selector,
    'row_selector', row_selector,
    'completed_skill_selector', completed_skill_selector,
    'div_prepend_btn_selector', div_prepend_btn_selector
];

const page_url = "/learn";

// Target to search skills
var target_body;

// Newest skill node
var newest_skill;

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

    // If newest skill in target found
    var newest_found = false;

    // Check sections
    var sections = $(section_selector);
    if (sections == null) {
        consol.log("Error, section not found");
    }
    sections.each(function(index, element) {

        // Check rows
        var rows = $(this).find(row_selector);
        var row_count = 0;
        rows.each(function(index, element) {
            var skill_count = $(this).find(skill_selector).length;
            var complete_count = $(this).find(completed_skill_selector).length;
            if (skill_count == complete_count) {
                action($(this));
                row_count += 1;
            } else if (!newest_found && skill_count > 0 ) {
                newest_found = true;
                newest_skill = $(this);
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

function ToggleBtnClickAction (BtnEvent) {
    if (IsHiding) {
        IsHiding = false;
    } else {
        IsHiding = true;
    }
    Toggle(target_body);
}

function ScrollBtnClickAction(BtnEvent) {
    if (newest_skill) {
        // scroll align to center
        const node_top = newest_skill[0].getBoundingClientRect().top;
        const middle = node_top + window.pageYOffset - (window.innerHeight / 4);
        window.scrollTo(0, middle);
        console.log("Scroll Down");
    }
}

function InsertBtn() {
    if ($('#HCSToggleBtn').length != 0) {
        return;
    }
    var node = document.createElement ('div');
    node.innerHTML = '<button id="HCSToggleBtn" class="HCSBtn" type="button">Toggle completed skills</button>'
        + '<span> </span>'
        + '<button id="HCSScrollBtn" class="HCSBtn" type="button">Scroll Down</button>';
    node.setAttribute ('id', 'HCSContainer');
    $(div_prepend_btn_selector)[0].prepend(node);
    $("#HCSToggleBtn").on( "click", ToggleBtnClickAction);
    $("#HCSScrollBtn").on( "click", ScrollBtnClickAction);
    console.log("Inserted buttons");
    // Scroll to top
    if (IsHiding) {
        //$('html, body')[0].scrollIntoView(true);
        $('html, body').animate({ scrollTop: 0 }, 'fast');
        console.log("Scroll Top");
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
    // Use url to determine toggle or not
    if (window.location.pathname.localeCompare(page_url) != 0) {
        return;
    }
    if (Toggle(target_body) > 0) {
        InsertBtn();
    }
};

// TODO auto scroll after exit from class?

// Options for the observer
const config = {childList: true, subtree: true};

const observer = new MutationObserver(ObsvrAction);

// Button css
var styles = `
    .HCSBtn {
      display: inline-block;
      padding: 6px 8px;
      font-size: 17px;
      font-weight: bold;
      cursor: pointer;
      text-align: center;
      text-decoration: none;
      outline: none;
      color: #fff;
      background-color: #1cb0f6;
      border: none;
      border-radius: 5px;
      box-shadow: 0 5px #1899d6;
    }

    .HCSBtn:hover {background-color: #51c5fc;}

    .HCSBtn:active {
      background-color: #1899d6;
      box-shadow: 0 5px #126e99;
      transform: translateY(4px);
    }
`;


function CheckSelector() {
    if (window.location.pathname.localeCompare(page_url) != 0) {
        return;
    }
    var i;
    for (i = 0; i < selectors.length; i+=2) {
        var name = selectors[i];
        var selector = selectors[i+1];

        if ($(selector).length == 0) {
            console.log(name + " selector not found");
        }
    }
}

$(document).ready(function() {
    console.log("Duolingo HCS enabled");
    target_body = $('body')[0];
    var hide_count = Toggle(target_body);
    if (hide_count > 0) {
        InsertBtn();
    }
    // Start observing the target node for configured mutations
    observer.observe(target_body, config);

    var styleSheet = document.createElement("style")
    styleSheet.type = "text/css"
    styleSheet.innerText = styles
    document.head.appendChild(styleSheet)

    // Check selector changed
    if (debug) {
        var timer = setInterval(CheckSelector, 60000);
    }
});
