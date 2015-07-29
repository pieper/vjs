(function($) {
    // TODO: make the node ID configurable
    var treeNode = $('#jsdoc-toc-nav');

    // initialize the tree
    treeNode.tree({
        autoEscape: false,
        closedIcon: '&#x21e2;',
        data: [{"label":"<a href=\"global.html\">Globals</a>","id":"global","children":[]},{"label":"<a href=\"VJS.html\">VJS</a>","id":"VJS","children":[{"label":"<a href=\"VJS.cameras.html\">cameras</a>","id":"VJS.cameras","children":[]},{"label":"<a href=\"VJS.core.html\">core</a>","id":"VJS.core","children":[{"label":"<a href=\"VJS.core.intersections.html\">intersections</a>","id":"VJS.core.intersections","children":[]}]},{"label":"<a href=\"VJS.extras.html\">extras</a>","id":"VJS.extras","children":[{"label":"<a href=\"VJS.extras.lut.html\">lut</a>","id":"VJS.extras.lut","children":[]}]},{"label":"<a href=\"VJS.geometries.html\">geometries</a>","id":"VJS.geometries","children":[{"label":"<a href=\"VJS.geometries.slice.html\">slice</a>","id":"VJS.geometries.slice","children":[]}]},{"label":"<a href=\"VJS.helpers.html\">helpers</a>","id":"VJS.helpers","children":[]},{"label":"<a href=\"VJS.loaders.html\">loaders</a>","id":"VJS.loaders","children":[{"label":"<a href=\"VJS.loaders.dicom.html\">dicom</a>","id":"VJS.loaders.dicom","children":[]}]},{"label":"<a href=\"VJS.models.html\">models</a>","id":"VJS.models","children":[{"label":"<a href=\"VJS.models.frame.html\">frame</a>","id":"VJS.models.frame","children":[]},{"label":"<a href=\"VJS.models.series.html\">series</a>","id":"VJS.models.series","children":[]},{"label":"<a href=\"VJS.models.stack.html\">stack</a>","id":"VJS.models.stack","children":[]}]},{"label":"<a href=\"VJS.parsers.html\">parsers</a>","id":"VJS.parsers","children":[{"label":"<a href=\"VJS.parsers.dicom.html\">dicom</a>","id":"VJS.parsers.dicom","children":[]}]},{"label":"<a href=\"VJS.widgets.html\">widgets</a>","id":"VJS.widgets","children":[{"label":"<a href=\"VJS.widgets.pixelProbe.html\">pixelProbe</a>","id":"VJS.widgets.pixelProbe","children":[]},{"label":"<a href=\"VJS.widgets.squareProbe.html\">squareProbe</a>","id":"VJS.widgets.squareProbe","children":[]}]}]}],
        openedIcon: ' &#x21e3;',
        saveState: true,
        useContextMenu: false
    });

    // add event handlers
    // TODO
})(jQuery);
