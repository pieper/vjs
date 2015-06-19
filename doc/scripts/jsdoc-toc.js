(function($) {
    // TODO: make the node ID configurable
    var treeNode = $('#jsdoc-toc-nav');

    // initialize the tree
    treeNode.tree({
        autoEscape: false,
        closedIcon: '&#x21e2;',
        data: [{"label":"<a href=\"VJS.html\">VJS</a>","id":"VJS","children":[{"label":"<a href=\"VJS.geometries.html\">geometries</a>","id":"VJS.geometries","children":[{"label":"<a href=\"VJS.geometries.slice.html\">slice</a>","id":"VJS.geometries.slice","children":[]}]},{"label":"<a href=\"VJS.helpers.html\">helpers</a>","id":"VJS.helpers","children":[]},{"label":"<a href=\"VJS.intersections.html\">intersections</a>","id":"VJS.intersections","children":[]},{"label":"<a href=\"VJS.loader.html\">loader</a>","id":"VJS.loader","children":[{"label":"<a href=\"VJS.loader.dicom.html\">dicom</a>","id":"VJS.loader.dicom","children":[]}]},{"label":"<a href=\"VJS.models.html\">models</a>","id":"VJS.models","children":[{"label":"<a href=\"VJS.models.frame.html\">frame</a>","id":"VJS.models.frame","children":[]},{"label":"<a href=\"VJS.models.image.html\">image</a>","id":"VJS.models.image","children":[]},{"label":"<a href=\"VJS.models.stack.html\">stack</a>","id":"VJS.models.stack","children":[]}]},{"label":"<a href=\"VJS.parsers.html\">parsers</a>","id":"VJS.parsers","children":[{"label":"<a href=\"VJS.parsers.dicom.html\">dicom</a>","id":"VJS.parsers.dicom","children":[]}]},{"label":"<a href=\"VJS.widgets.html\">widgets</a>","id":"VJS.widgets","children":[{"label":"<a href=\"VJS.widgets.pixelProbe.html\">pixelProbe</a>","id":"VJS.widgets.pixelProbe","children":[]},{"label":"<a href=\"VJS.widgets.squareProbe.html\">squareProbe</a>","id":"VJS.widgets.squareProbe","children":[]}]}]}],
        openedIcon: ' &#x21e3;',
        saveState: true,
        useContextMenu: false
    });

    // add event handlers
    // TODO
})(jQuery);
