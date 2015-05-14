(function($) {
    // TODO: make the node ID configurable
    var treeNode = $('#jsdoc-toc-nav');

    // initialize the tree
    treeNode.tree({
        autoEscape: false,
        closedIcon: '&#x21e2;',
        data: [{"label":"<a href=\"VJS.html\">VJS</a>","id":"VJS","children":[{"label":"<a href=\"VJS.frame.html\">frame</a>","id":"VJS.frame","children":[{"label":"<a href=\"VJS.frame.model.html\">model</a>","id":"VJS.frame.model","children":[]},{"label":"<a href=\"VJS.frame.view.html\">view</a>","id":"VJS.frame.view","children":[]}]},{"label":"<a href=\"VJS.image.html\">image</a>","id":"VJS.image","children":[{"label":"<a href=\"VJS.image.model.html\">model</a>","id":"VJS.image.model","children":[]}]},{"label":"<a href=\"VJS.intersections.html\">intersections</a>","id":"VJS.intersections","children":[]},{"label":"<a href=\"VJS.parsers.html\">parsers</a>","id":"VJS.parsers","children":[{"label":"<a href=\"VJS.parsers.dicom.html\">dicom</a>","id":"VJS.parsers.dicom","children":[]}]},{"label":"<a href=\"VJS.stack.html\">stack</a>","id":"VJS.stack","children":[{"label":"<a href=\"VJS.stack.model.html\">model</a>","id":"VJS.stack.model","children":[]},{"label":"<a href=\"VJS.stack.view.html\">view</a>","id":"VJS.stack.view","children":[]}]}]}],
        openedIcon: ' &#x21e3;',
        saveState: true,
        useContextMenu: false
    });

    // add event handlers
    // TODO
})(jQuery);
