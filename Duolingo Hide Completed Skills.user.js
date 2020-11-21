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
var IsDP    = false; // debug print

// TODO There is a bug when complete a skill, it just disapear with another incomplete skill.
//          > seems not happened for I times
// TODO Reduce monitor sensitivity, reduce check call

// Selectors
const section_selector          = "div[data-test='tree-section']";
const skill_selector            = "div[data-test='skill']";
const skill_crown_selector      = " div[data-test='level-crown']";
const skill_icon_selector       = " div[data-test='skill-icon']";
const skill_tree_selector       = "div[data-test='skill-tree']";
const global_practice_selector  = "a[data-test='global-practice']";

const circle_selector           = "div > svg > > path";

const complete_circle_color     = "#ffd900";

const selectors = [
    'section_selector', section_selector,
    'skill_selector', skill_selector,
    'skill_crown_selector', skill_selector + skill_crown_selector,
    'skill_icon_selector', skill_selector + skill_icon_selector,
    'skill_tree_selector', skill_tree_selector,
    'global_practice_selector', global_practice_selector
];

const page_url = "/learn";

// Options for the observer
const observer_config = {childList: true, subtree: true};

// Target to search skills
var target_body;

// Newest skill node
// FIXME what's this for
var newest_skill;

function HideNode(node) {
    node.hide();
}
function ShowNode(node) {
    node.show();
}

function mylog(s) {
    console.log("[HCS] " + s);
}

function DP(s) {
    if (IsDP) {
        mylog(s);
    }
}

function Toggle (target) {
    //var t0 = performance.now()
    var ret;
    if (IsHiding) {
        ret = ActOnTarget(target, HideNode);
    } else {
        ret = ActOnTarget(target, ShowNode);
    }
    //var t1 = performance.now()
    //mylog("Call to HCS Toggle took " + (t1 - t0) + " milliseconds.")
    return ret;
}

function IsAllSkillComplete(node) {
    var skills = node.find(skill_selector);
    //var all_skills = node.find(skill_selector).length;
    //var skill_crowns = node.find(skill_crown_selector);
    //var skill_icons = node.find(skill_icon_selector);
    var completed_count = 0;
    var total_count = skills.length;
    /*
    if ((skills.length != skill_crowns.length) ||
        (skills.length != skill_icons)) {
        mylog("Error: count of skills, crowns, icons are not matched");
        return false;
    }*/
    skills.each(function(index, element) {
        // Print name of the skill
        name = $(this).find("div._3PSt5").last().html();

        // Check if there is crown level
        crown = $(element).find(skill_crown_selector);
        if (crown.length == 0) {
            // Invalid skill
            return false;
        }
        level = crown.html();
        if (level == 5) {
            // Max level
            completed_count += 1;
            return;
        }
        // Check the outter circle color: complete -> gold, incomplete -> gray
        circle = $(this).find(circle_selector).first();
        circle_color = circle.attr('fill');
        DP(name + circle_color)
        if (circle_color == complete_circle_color) {
            completed_count += 1;
        }
    });
    if (completed_count != 0) {
        //mylog("skills: " + total_count + ", crowns:" + completed_count);
    }
    /* Get level from crown
    crowns.each(function(index, element) {
        // Get crown level of each skill
        var str = element.innerHTML.replace(/\s/g, '');;
        if (str == "5") {
            completed_count++;
        }
    });
    */
    if (total_count == completed_count) {
        return true;
    }
    return false;
}

// Show / hide completed sections depends on 'IsHiding'
function ActOnTarget(target, action) {
    // TODO Add timing
    var total_count = 0;

    // If newest skill in target found
    var newest_found = false;

    // Check sections
    var sections = $(section_selector);
    if (sections == null) {
        consol.log("Error, section not found");
    }
    DP("Start checking sections");
    sections.each(function(index, element) {
        DP("Section check section: " + index);
        // Remove all hline
        hlines = $(this).find("div > hr");
        hlines.each(function(index, element) {
            action($(this));
        });
        if (IsAllSkillComplete($(this))) {
            action($(this));
            total_count += 1;
            DP("Section " + index + "all done");
            return;
        }
        // Hide parent (row) if parent's child are all completed
        var all_skills = $(this).find(skill_selector)
        all_skills.each(function(index, element) {
            DP("Row check");
            var parent_row = $(this).parent();
            if (IsAllSkillComplete(parent_row)) {
                action(parent_row);
            }
            total_count += 1;
        });
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

function InsertBtn() {
    if ($('#HCSToggleBtn').length != 0) {
        // Inserted
        return;
    }
    gp_btn = $(global_practice_selector);
    floating_div = gp_btn.parent();

    var btn = $('<button>HCS</button>')
        .attr('class', 'HCSBtn')
        .attr('id', 'HCSToggleBtn')
        .attr('type', 'button');
    floating_div.append(btn)

    var height = gp_btn.outerHeight();
    var height2 = btn.outerHeight();
    scale = (height/height2 + 1)/2;
    btn.css('transform', 'scale(' + scale + ')');

    // get size of global-practice btn

    $("#HCSToggleBtn").on( "click", ToggleBtnClickAction);
    mylog("Inserted buttons");
    // Scroll to top
    if (IsHiding) {
        $('html, body').animate({ scrollTop: 0 }, 'fast');
        mylog("Scroll Top");
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
            if (mutation.removedNodes) {
                // TODO detect the node is deleted
                // https://stackoverflow.com/questions/44935865/detect-when-a-node-is-deleted-or-removed-from-the-dom-because-a-parent-was
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

var observer = new MutationObserver(ObsvrAction);

/*
      position: fixed;
      bottom:100px;
      left: 60px;
      z-index: 9999";
      */
// Button css
var styles = `
    .HCSBtn {
      display: inline-block;
      margin-left: 30px;
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

var debug_callback;

function CheckSelector() {
    if (window.location.pathname.localeCompare(page_url) != 0) {
        return;
    }
    var i;
    var err = false;
    for (i = 0; i < selectors.length; i+=2) {
        var name = selectors[i];
        var selector = selectors[i+1];
        var count = $(selector).length;

        if (count == 0) {
            mylog(name + " selector not found");
            err = true;
        }
    }
    if (err == true) {
        clearInterval(debug_callback);
        mylog("End debug_callback");
    } else {
        mylog("Selectors seems fine");
    }
}

//$(document).ready(function() {
$( window ).on( "load", function() {
    mylog("Duolingo HCS enabled");
    target_body = $('body')[0];

    /*
     * FIXME observe skill_tree_selector,
     *      the node changed after a lesson
     *      FIX ObsvrAction first
     */
    /*
    body = $('body');
    var skill_tree = body.find(skill_tree_selector);
    // Fail safe
    if (skill_tree.length == 0) {
        mylog("no skill tree found" + skill_tree_selector);
        mylog("Abort!");
        return;
    }
    target_body = body.find(skill_tree_selector).get(0);

    var hide_count = Toggle(target_body);
    if (hide_count > 0) {
        InsertBtn();
    }
    */
    // Start observing the target node for configured mutations
    observer.observe(target_body, observer_config);

    var styleSheet = document.createElement("style")
    styleSheet.type = "text/css"
    styleSheet.innerText = styles
    document.head.appendChild(styleSheet)

    // Check selector changed
    if (IsDebug) {
        debug_callback = setInterval(CheckSelector, 60000);
        mylog("HCS debuging css selector");
    }
});
