"use strict";

(function e(t, n, r) {
    function s(o, u) {
        if (!n[o]) {
            if (!t[o]) {
                var a = typeof require == "function" && require;if (!u && a) return a(o, !0);if (i) return i(o, !0);var f = new Error("Cannot find module '" + o + "'");throw (f.code = "MODULE_NOT_FOUND", f);
            }var l = n[o] = { exports: {} };t[o][0].call(l.exports, function (e) {
                var n = t[o][1][e];return s(n ? n : e);
            }, l, l.exports, e, t, n, r);
        }return n[o].exports;
    }var i = typeof require == "function" && require;for (var o = 0; o < r.length; o++) s(r[o]);return s;
})({ 1: [function (require, module, exports) {
        /* globals Stats, dat*/
        "use strict";

        var VJS = VJS || {};
        VJS.geometries = VJS.geometries || {};
        VJS.geometries.slice = require("../../src/geometries/geometries.slice");

        VJS.controls = VJS.controls || {};
        VJS.controls.orbitControls2D = require("../../src/controls/OrbitControls2D");

        // standard global variables
        var controls, renderer, scene, camera, statsyay, particleLight, sliceMesh, arrowMesh;

        var arrow = {
            "direction": new THREE.Vector3(0, 0, 0),
            "position": new THREE.Vector3(0, 0, 0),
            "length": 20,
            "color": 0xFFF336
        };

        var box = {
            "dimensions": new THREE.Vector3(123, 45, 67),
            "halfDimensions": new THREE.Vector3(123, 45, 67).divideScalar(2),
            "center": new THREE.Vector3(0, 0, 0),
            "orientation": new THREE.Vector3(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1))
        };

        function disposeSliceMesh() {
            scene.remove(sliceMesh);
            sliceMesh.geometry.dispose();
            sliceMesh.material.dispose();
            sliceMesh = null;
        }

        function createSliceMesh() {
            // create the geometry
            var sliceGeometry = new VJS.geometries.slice(box.halfDimensions, box.center, box.orientation, arrow.position, arrow.direction);
            // create the material
            var sliceMaterial = new THREE.MeshLambertMaterial({
                color: 0x03A9F4,
                emissive: 0x000000,
                shininess: 30,
                shading: THREE.SmoothShading,
                "side": THREE.DoubleSide
            });
            return new THREE.Mesh(sliceGeometry, sliceMaterial);
        }

        function updateGeometries() {
            if (arrowMesh && sliceMesh) {
                // update arrow
                arrowMesh.position.set(arrow.position.x, arrow.position.y, arrow.position.z);
                arrowMesh.setDirection(arrow.direction);

                // create new slice
                // not super efficient...
                disposeSliceMesh();
                sliceMesh = createSliceMesh();
                scene.add(sliceMesh);
            }
        }

        // FUNCTIONS
        function init() {

            // this function is executed on each animation frame
            function animate() {

                // update light position
                var timer = Date.now() * 0.00025;

                particleLight.position.x = Math.sin(timer * 7) * 70;
                particleLight.position.y = Math.cos(timer * 5) * 80;
                particleLight.position.z = Math.cos(timer * 3) * 90;

                //update normal to look at particle
                var dir = new THREE.Vector3(particleLight.position.x - arrow.position.x, particleLight.position.y - arrow.position.y, particleLight.position.z - arrow.position.z).normalize();
                arrow.direction.x = dir.x;
                arrow.direction.y = dir.y;
                arrow.direction.z = dir.z;

                updateGeometries();

                // render
                controls.update();
                renderer.render(scene, camera);
                statsyay.update();

                // request new frame
                requestAnimationFrame(function () {
                    animate();
                });
            }

            // renderer
            var threeD = document.getElementById("r3d");
            renderer = new THREE.WebGLRenderer({
                antialias: true
            });
            renderer.setSize(threeD.offsetWidth, threeD.offsetHeight);
            renderer.setClearColor(0x353535, 1);

            var maxTextureSize = renderer.context.getParameter(renderer.context.MAX_TEXTURE_SIZE);
            window.console.log(maxTextureSize);

            threeD.appendChild(renderer.domElement);

            // stats
            statsyay = new Stats();
            threeD.appendChild(statsyay.domElement);

            // scene
            scene = new THREE.Scene();
            // camera
            camera = new THREE.PerspectiveCamera(45, threeD.offsetWidth / threeD.offsetHeight, 1, 10000000);
            camera.position.x = 100;
            camera.position.y = 100;
            camera.position.z = 100;
            camera.lookAt(scene.position);
            // controls
            controls = new VJS.controls.orbitControls2D(camera, renderer.domElement);

            scene.add(new THREE.AmbientLight(0x444444));

            var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
            directionalLight.position.set(1, 1, 1).normalize();
            scene.add(directionalLight);

            particleLight = new THREE.Mesh(new THREE.SphereGeometry(2, 8, 8), new THREE.MeshBasicMaterial({ color: 0xFFF336 }));
            scene.add(particleLight);

            var pointLight = new THREE.PointLight(0xffffff, 2, 200);
            particleLight.add(pointLight);

            animate();
        }

        window.onload = function () {
            // init threeJS...
            init();

            // make a box!
            var boxGeometry = new THREE.BoxGeometry(box.dimensions.x, box.dimensions.y, box.dimensions.z);
            var boxMaterial = new THREE.MeshBasicMaterial({
                wireframe: true,
                color: 0x61F2F3
            });
            var boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
            scene.add(boxMesh);

            // make a slice!
            sliceMesh = createSliceMesh();
            scene.add(sliceMesh);

            // make an arrow
            arrowMesh = new THREE.ArrowHelper(arrow.direction, arrow.position, arrow.length, arrow.color);
            scene.add(arrowMesh);

            var gui = new dat.GUI({
                autoPlace: false
            });

            var customContainer = document.getElementById("my-gui-container");
            customContainer.appendChild(gui.domElement);

            var directionFolder = gui.addFolder("Plane direction");
            var frameIndexControllerDirectionI = directionFolder.add(arrow.direction, "x", -1, 1).listen();
            var frameIndexControllerDirectionJ = directionFolder.add(arrow.direction, "y", -1, 1).listen();
            var frameIndexControllerDirectionK = directionFolder.add(arrow.direction, "z", -1, 1).listen();
            directionFolder.open();

            var positionFolder = gui.addFolder("Plane position");
            var frameIndexControllerOriginI = positionFolder.add(arrow.position, "x", -61.5, 61.5).listen();
            var frameIndexControllerOriginJ = positionFolder.add(arrow.position, "y", -22.5, 22.5).listen();
            var frameIndexControllerOriginK = positionFolder.add(arrow.position, "z", -33.5, 33.5).listen();
            positionFolder.open();

            frameIndexControllerDirectionI.onChange(updateGeometries);
            frameIndexControllerDirectionJ.onChange(updateGeometries);
            frameIndexControllerDirectionK.onChange(updateGeometries);
            frameIndexControllerOriginI.onChange(updateGeometries);
            frameIndexControllerOriginJ.onChange(updateGeometries);
            frameIndexControllerOriginK.onChange(updateGeometries);
        };
    }, { "../../src/controls/OrbitControls2D": 2, "../../src/geometries/geometries.slice": 4 }], 2: [function (require, module, exports) {
        "use strict";

        /**
         * traversc: modified mouse wheel zoom to work with orthographic camera
         * @author qiao / https://github.com/qiao
         * @author mrdoob / http://mrdoob.com
         * @author alteredq / http://alteredqualia.com/
         * @author WestLangley / http://github.com/WestLangley
         * @author erich666 / http://erichaines.com
         */
        /*global THREE, console */

        // This set of controls performs orbiting, dollying (zooming), and panning. It maintains
        // the "up" direction as +Y, unlike the TrackballControls. Touch on tablet and phones is
        // supported.
        //
        //    Orbit - left mouse / touch: one finger move
        //    Zoom - middle mouse, or mousewheel / touch: two finger spread or squish
        //    Pan - right mouse, or arrow keys / touch: three finter swipe

        THREE.OrbitControls2D = function (object, domElement) {

            this.object = object;
            this.domElement = domElement !== undefined ? domElement : document;

            // API

            // Set to false to disable this control
            this.enabled = true;

            // "target" sets the location of focus, where the control orbits around
            // and where it pans with respect to.
            this.target = new THREE.Vector3();

            // center is old, deprecated; use "target" instead
            this.center = this.target;

            // This option actually enables dollying in and out; left as "zoom" for
            // backwards compatibility
            this.noZoom = false;
            this.zoomSpeed = 1.0;

            // Limits to how far you can dolly in and out
            this.minDistance = 0;
            this.maxDistance = Infinity;

            // Set to true to disable this control
            this.noRotate = false;
            this.rotateSpeed = 1.0;

            // Set to true to disable this control
            this.noPan = false;
            this.keyPanSpeed = 7.0; // pixels moved per arrow key push

            // Set to true to automatically rotate around the target
            this.autoRotate = false;
            this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

            // How far you can orbit vertically, upper and lower limits.
            // Range is 0 to Math.PI radians.
            this.minPolarAngle = 0; // radians
            this.maxPolarAngle = Math.PI; // radians

            // How far you can orbit horizontally, upper and lower limits.
            // If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
            this.minAzimuthAngle = -Infinity; // radians
            this.maxAzimuthAngle = Infinity; // radians

            // Set to true to disable use of the keys
            this.noKeys = false;

            // The four arrow keys
            this.keys = {
                LEFT: 37,
                UP: 38,
                RIGHT: 39,
                BOTTOM: 40
            };

            // Mouse buttons
            this.mouseButtons = {
                ORBIT: THREE.MOUSE.LEFT,
                ZOOM: THREE.MOUSE.MIDDLE,
                PAN: THREE.MOUSE.RIGHT
            };

            ////////////
            // internals

            var scope = this;

            var EPS = 0.000001;

            var rotateStart = new THREE.Vector2();
            var rotateEnd = new THREE.Vector2();
            var rotateDelta = new THREE.Vector2();

            var panStart = new THREE.Vector2();
            var panEnd = new THREE.Vector2();
            var panDelta = new THREE.Vector2();
            var panOffset = new THREE.Vector3();

            var offset = new THREE.Vector3();

            var dollyStart = new THREE.Vector2();
            var dollyEnd = new THREE.Vector2();
            var dollyDelta = new THREE.Vector2();

            var theta;
            var phi;
            var phiDelta = 0;
            var thetaDelta = 0;
            var scale = 1;
            var pan = new THREE.Vector3();

            var lastPosition = new THREE.Vector3();
            var lastQuaternion = new THREE.Quaternion();

            var STATE = {
                NONE: -1,
                ROTATE: 0,
                DOLLY: 1,
                PAN: 2,
                TOUCH_ROTATE: 3,
                TOUCH_DOLLY: 4,
                TOUCH_PAN: 5
            };

            var state = STATE.NONE;

            // for reset

            this.target0 = this.target.clone();
            this.position0 = this.object.position.clone();

            // so camera.up is the orbit axis

            var quat = new THREE.Quaternion().setFromUnitVectors(object.up, new THREE.Vector3(0, 1, 0));
            var quatInverse = quat.clone().inverse();

            // events

            var changeEvent = {
                type: "change"
            };
            var startEvent = {
                type: "start"
            };
            var endEvent = {
                type: "end"
            };

            this.rotateLeft = function (angle) {

                if (angle === undefined) {

                    angle = getAutoRotationAngle();
                }

                thetaDelta -= angle;
            };

            this.rotateUp = function (angle) {

                if (angle === undefined) {

                    angle = getAutoRotationAngle();
                }

                phiDelta -= angle;
            };

            // pass in distance in world space to move left
            this.panLeft = function (distance) {

                var te = this.object.matrix.elements;

                // get X column of matrix
                panOffset.set(te[0], te[1], te[2]);
                panOffset.multiplyScalar(-distance);

                pan.add(panOffset);
            };

            // pass in distance in world space to move up
            this.panUp = function (distance) {

                var te = this.object.matrix.elements;

                // get Y column of matrix
                panOffset.set(te[4], te[5], te[6]);
                panOffset.multiplyScalar(distance);

                pan.add(panOffset);
            };

            // pass in x,y of change desired in pixel space,
            // right and down are positive
            this.pan = function (deltaX, deltaY) {

                var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

                if (scope.object.fov !== undefined) {

                    // perspective
                    var position = scope.object.position;
                    var offset = position.clone().sub(scope.target);
                    var targetDistance = offset.length();

                    // half of the fov is center to top of screen
                    targetDistance *= Math.tan(scope.object.fov / 2 * Math.PI / 180.0);

                    // we actually don't use screenWidth, since perspective camera is fixed to screen height
                    scope.panLeft(2 * deltaX * targetDistance / element.clientHeight);
                    scope.panUp(2 * deltaY * targetDistance / element.clientHeight);
                } else if (scope.object.top !== undefined) {

                    // orthographic
                    scope.panLeft(deltaX * (scope.object.right - scope.object.left) / (element.clientWidth * this.object.zoom));
                    scope.panUp(deltaY * (scope.object.top - scope.object.bottom) / (element.clientHeight * this.object.zoom));
                } else {

                    // camera neither orthographic or perspective
                    console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.");
                }
            };

            //traversc: fix with orthographic camera zoom
            this.dollyIn = function (dollyScale) {
                if (dollyScale === undefined) {
                    dollyScale = getZoomScale();
                }
                if (scope.object.top !== undefined) {
                    this.object.zoom *= dollyScale;
                    this.object.updateProjectionMatrix();
                } else {
                    scale /= dollyScale;
                }
            };

            this.dollyOut = function (dollyScale) {
                if (dollyScale === undefined) {
                    dollyScale = getZoomScale();
                }
                if (scope.object.top !== undefined) {
                    this.object.zoom /= dollyScale;
                    this.object.updateProjectionMatrix();
                } else {
                    scale *= dollyScale;
                }
            };

            this.update = function () {

                var position = this.object.position;

                offset.copy(position).sub(this.target);

                // rotate offset to "y-axis-is-up" space
                offset.applyQuaternion(quat);

                // angle from z-axis around y-axis

                theta = Math.atan2(offset.x, offset.z);

                // angle from y-axis

                phi = Math.atan2(Math.sqrt(offset.x * offset.x + offset.z * offset.z), offset.y);

                if (this.autoRotate && state === STATE.NONE) {

                    this.rotateLeft(getAutoRotationAngle());
                }

                theta += thetaDelta;
                phi += phiDelta;

                // restrict theta to be between desired limits
                theta = Math.max(this.minAzimuthAngle, Math.min(this.maxAzimuthAngle, theta));

                // restrict phi to be between desired limits
                phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, phi));

                // restrict phi to be betwee EPS and PI-EPS
                phi = Math.max(EPS, Math.min(Math.PI - EPS, phi));

                var radius = offset.length() * scale;

                // restrict radius to be between desired limits
                radius = Math.max(this.minDistance, Math.min(this.maxDistance, radius));

                // move target to panned location
                this.target.add(pan);

                offset.x = radius * Math.sin(phi) * Math.sin(theta);
                offset.y = radius * Math.cos(phi);
                offset.z = radius * Math.sin(phi) * Math.cos(theta);

                // rotate offset back to "camera-up-vector-is-up" space
                offset.applyQuaternion(quatInverse);

                position.copy(this.target).add(offset);

                this.object.lookAt(this.target);

                thetaDelta = 0;
                phiDelta = 0;
                scale = 1;
                pan.set(0, 0, 0);

                // update condition is:
                // min(camera displacement, camera rotation in radians)^2 > EPS
                // using small-angle approximation cos(x/2) = 1 - x^2 / 8

                if (lastPosition.distanceToSquared(this.object.position) > EPS || 8 * (1 - lastQuaternion.dot(this.object.quaternion)) > EPS) {

                    this.dispatchEvent(changeEvent);

                    lastPosition.copy(this.object.position);
                    lastQuaternion.copy(this.object.quaternion);
                }
            };

            this.reset = function () {

                state = STATE.NONE;

                this.target.copy(this.target0);
                this.object.position.copy(this.position0);

                this.update();
            };

            this.getPolarAngle = function () {

                return phi;
            };

            this.getAzimuthalAngle = function () {

                return theta;
            };

            function getAutoRotationAngle() {

                return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;
            }

            function getZoomScale() {

                return Math.pow(0.95, scope.zoomSpeed);
            }

            function onMouseDown(event) {

                if (scope.enabled === false) {
                    return;
                }
                event.preventDefault();

                if (event.button === scope.mouseButtons.ORBIT) {
                    if (scope.noRotate === true) {
                        return;
                    }

                    state = STATE.ROTATE;

                    rotateStart.set(event.clientX, event.clientY);
                } else if (event.button === scope.mouseButtons.ZOOM) {
                    if (scope.noZoom === true) {
                        return;
                    }

                    state = STATE.DOLLY;

                    dollyStart.set(event.clientX, event.clientY);
                } else if (event.button === scope.mouseButtons.PAN) {
                    if (scope.noPan === true) {
                        return;
                    }

                    state = STATE.PAN;

                    panStart.set(event.clientX, event.clientY);
                }

                if (state !== STATE.NONE) {
                    document.addEventListener("mousemove", onMouseMove, false);
                    document.addEventListener("mouseup", onMouseUp, false);
                    scope.dispatchEvent(startEvent);
                }
            }

            function onMouseMove(event) {

                if (scope.enabled === false) {
                    return;
                }

                event.preventDefault();

                var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

                if (state === STATE.ROTATE) {

                    if (scope.noRotate === true) {
                        return;
                    }

                    rotateEnd.set(event.clientX, event.clientY);
                    rotateDelta.subVectors(rotateEnd, rotateStart);

                    // rotating across whole screen goes 360 degrees around
                    scope.rotateLeft(2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed);

                    // rotating up and down along whole screen attempts to go 360, but limited to 180
                    scope.rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed);

                    rotateStart.copy(rotateEnd);
                } else if (state === STATE.DOLLY) {

                    if (scope.noZoom === true) {
                        return;
                    }

                    dollyEnd.set(event.clientX, event.clientY);
                    dollyDelta.subVectors(dollyEnd, dollyStart);

                    if (dollyDelta.y > 0) {

                        scope.dollyIn();
                    } else {

                        scope.dollyOut();
                    }

                    dollyStart.copy(dollyEnd);
                } else if (state === STATE.PAN) {

                    if (scope.noPan === true) {
                        return;
                    }

                    panEnd.set(event.clientX, event.clientY);
                    panDelta.subVectors(panEnd, panStart);

                    scope.pan(panDelta.x, panDelta.y);

                    panStart.copy(panEnd);
                }

                if (state !== STATE.NONE) {
                    scope.update();
                }
            }

            function onMouseUp() {

                if (scope.enabled === false) {
                    return;
                }

                document.removeEventListener("mousemove", onMouseMove, false);
                document.removeEventListener("mouseup", onMouseUp, false);
                scope.dispatchEvent(endEvent);
                state = STATE.NONE;
            }

            function onMouseWheel(event) {

                if (scope.enabled === false || scope.noZoom === true || state !== STATE.NONE) {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();

                var delta = 0;

                if (event.wheelDelta !== undefined) {
                    // WebKit / Opera / Explorer 9

                    delta = event.wheelDelta;
                } else if (event.detail !== undefined) {
                    // Firefox

                    delta = -event.detail;
                }

                if (delta > 0) {

                    scope.dollyOut();
                } else {

                    scope.dollyIn();
                }

                scope.update();
                scope.dispatchEvent(startEvent);
                scope.dispatchEvent(endEvent);
            }

            function onKeyDown(event) {

                if (scope.enabled === false || scope.noKeys === true || scope.noPan === true) {
                    return;
                }

                switch (event.keyCode) {

                    case scope.keys.UP:
                        scope.pan(0, scope.keyPanSpeed);
                        scope.update();
                        break;

                    case scope.keys.BOTTOM:
                        scope.pan(0, -scope.keyPanSpeed);
                        scope.update();
                        break;

                    case scope.keys.LEFT:
                        scope.pan(scope.keyPanSpeed, 0);
                        scope.update();
                        break;

                    case scope.keys.RIGHT:
                        scope.pan(-scope.keyPanSpeed, 0);
                        scope.update();
                        break;

                }
            }

            function touchstart(event) {

                if (scope.enabled === false) {
                    return;
                }

                switch (event.touches.length) {

                    case 1:
                        // one-fingered touch: rotate

                        if (scope.noRotate === true) {
                            return;
                        }

                        state = STATE.TOUCH_ROTATE;

                        rotateStart.set(event.touches[0].pageX, event.touches[0].pageY);
                        break;

                    case 2:
                        // two-fingered touch: dolly

                        if (scope.noZoom === true) {
                            return;
                        }

                        state = STATE.TOUCH_DOLLY;

                        var dx = event.touches[0].pageX - event.touches[1].pageX;
                        var dy = event.touches[0].pageY - event.touches[1].pageY;
                        var distance = Math.sqrt(dx * dx + dy * dy);
                        dollyStart.set(0, distance);
                        break;

                    case 3:
                        // three-fingered touch: pan

                        if (scope.noPan === true) {
                            return;
                        }

                        state = STATE.TOUCH_PAN;

                        panStart.set(event.touches[0].pageX, event.touches[0].pageY);
                        break;

                    default:

                        state = STATE.NONE;

                }

                if (state !== STATE.NONE) {
                    scope.dispatchEvent(startEvent);
                }
            }

            function touchmove(event) {

                if (scope.enabled === false) {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();

                var element = scope.domElement === document ? scope.domElement.body : scope.domElement;

                switch (event.touches.length) {

                    case 1:
                        // one-fingered touch: rotate

                        if (scope.noRotate === true) {
                            return;
                        }
                        if (state !== STATE.TOUCH_ROTATE) {
                            return;
                        }

                        rotateEnd.set(event.touches[0].pageX, event.touches[0].pageY);
                        rotateDelta.subVectors(rotateEnd, rotateStart);

                        // rotating across whole screen goes 360 degrees around
                        scope.rotateLeft(2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed);
                        // rotating up and down along whole screen attempts to go 360, but limited to 180
                        scope.rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed);

                        rotateStart.copy(rotateEnd);

                        scope.update();
                        break;

                    case 2:
                        // two-fingered touch: dolly

                        if (scope.noZoom === true) {
                            return;
                        }
                        if (state !== STATE.TOUCH_DOLLY) {
                            return;
                        }

                        var dx = event.touches[0].pageX - event.touches[1].pageX;
                        var dy = event.touches[0].pageY - event.touches[1].pageY;
                        var distance = Math.sqrt(dx * dx + dy * dy);

                        dollyEnd.set(0, distance);
                        dollyDelta.subVectors(dollyEnd, dollyStart);

                        if (dollyDelta.y > 0) {

                            scope.dollyOut();
                        } else {

                            scope.dollyIn();
                        }

                        dollyStart.copy(dollyEnd);

                        scope.update();
                        break;

                    case 3:
                        // three-fingered touch: pan

                        if (scope.noPan === true) {
                            return;
                        }
                        if (state !== STATE.TOUCH_PAN) {
                            return;
                        }

                        panEnd.set(event.touches[0].pageX, event.touches[0].pageY);
                        panDelta.subVectors(panEnd, panStart);

                        scope.pan(panDelta.x, panDelta.y);

                        panStart.copy(panEnd);

                        scope.update();
                        break;

                    default:

                        state = STATE.NONE;

                }
            }

            function touchend() {

                if (scope.enabled === false) {
                    return;
                }

                scope.dispatchEvent(endEvent);
                state = STATE.NONE;
            }

            this.domElement.addEventListener("contextmenu", function (event) {
                event.preventDefault();
            }, false);
            this.domElement.addEventListener("mousedown", onMouseDown, false);
            this.domElement.addEventListener("mousewheel", onMouseWheel, false);
            this.domElement.addEventListener("DOMMouseScroll", onMouseWheel, false); // firefox

            this.domElement.addEventListener("touchstart", touchstart, false);
            this.domElement.addEventListener("touchend", touchend, false);
            this.domElement.addEventListener("touchmove", touchmove, false);

            window.addEventListener("keydown", onKeyDown, false);

            // force an update at start
            this.update();
        };

        THREE.OrbitControls2D.prototype = Object.create(THREE.EventDispatcher.prototype);
        THREE.OrbitControls2D.prototype.constructor = THREE.OrbitControls2D;

        // export the frame module
        module.exports = THREE.OrbitControls2D;
    }, {}], 3: [function (require, module, exports) {
        "use strict";

        var VJS = VJS || {};
        VJS.core = VJS.core || {};

        /**
         * @constructor
         * @class
         * @memberOf VJS.core
         * @public
        */
        VJS.core.intersections = VJS.core.intersections || {};

        /**
         * Compute intersection between oriented bounding box and a plane.
         * Returns intersection in plane's space (toOBBSpaceInvert applied).
         * Should return at least 3 intersections. If not, the plane and the box do not
         * intersect.
         *
         * @memberOf VJS.core.intersections
         * @public
         *
         * @param {Object} obb - Oriented Bounding Box representation.
         * @param {THREE.Vector3} obb.halfDimensions - Half dimensions of the box.
         * @param {THREE.Vector3<THREE.Vector3>} obb.orientation - Orientation of the edges of the box.
         * @param {THREE.Vector3} obb.center - Center of the box.
         * @param {THREE.Matrix4} obb.toOBBSpace - Transform to go from plane space to box space.
         * @param {THREE.Matrix4} obb.toOBBSpaceInvert - Transform to go from box space to plane space.
         * @param {Object} plane - Plane representation
         * @param {THREE.Vector3} plane.position - position of normal which describes the plane.
         * @param {THREE.Vector3} plane.direction - Direction of normal which describes the plane.
         *
         * @returns {Array<THREE.Vector3>} List of all intersections, in plane's space.
         *
         * @todo toOBBSpace and toOBBSpaceInvert might be redundent.
         * @todo find best way to deal with different spaces.
         */

        VJS.core.intersections.obbPlane = function (obb, plane) {

            //
            // obb = { halfDimensions, orientation, center, toOBBSpace }
            // plane = { position, direction }
            //
            //
            // LOGIC:
            //
            // Test intersection of each edge of the Oriented Bounding Box with the Plane
            //
            // ALL EDGES
            //
            //      .+-------+ 
            //    .' |     .'| 
            //   +---+---+'  | 
            //   |   |   |   | 
            //   |  ,+---+---+ 
            //   |.'     | .'  
            //   +-------+'    
            //
            // SPACE ORIENTATION
            //
            //       +
            //     j |
            //       |
            //       |   i
            //   k  ,+-------+ 
            //    .'
            //   +
            //
            //
            // 1- Move Plane position and orientation in IJK space
            // 2- Test Edges/ IJK Plane intersections
            // 3- Return intersection Edge/ IJK Plane if it touches the Oriented BBox

            var intersections = [];

            var t1 = plane.direction.clone().applyMatrix4(obb.toOBBSpace);
            var t0 = new THREE.Vector3(0, 0, 0).applyMatrix4(obb.toOBBSpace);

            var planeOBB = {
                position: plane.position.clone().applyMatrix4(obb.toOBBSpace),
                direction: new THREE.Vector3(t1.x - t0.x, t1.y - t0.y, t1.z - t0.z).normalize()
            };

            var bboxMin = new THREE.Vector3(obb.center.x - obb.halfDimensions.x, obb.center.y - obb.halfDimensions.y, obb.center.z - obb.halfDimensions.z);
            var bboxMax = new THREE.Vector3(obb.center.x + obb.halfDimensions.x, obb.center.y + obb.halfDimensions.y, obb.center.z + obb.halfDimensions.z);

            // 12 edges (i.e. ray)/plane intersection tests

            // RAYS STARTING FROM THE FIRST CORNER (0, 0, 0)
            //
            //       +
            //       |
            //       |
            //       |
            //      ,+---+---+
            //    .'  
            //   +  

            var ray = {
                "position": new THREE.Vector3(obb.center.x - obb.halfDimensions.x, obb.center.y - obb.halfDimensions.y, obb.center.z - obb.halfDimensions.z),
                "direction": obb.orientation.x
            };

            var intersection = this.rayPlane(ray, planeOBB);
            if (this.inBBox(intersection, bboxMin, bboxMax)) {
                intersections.push(intersection.applyMatrix4(obb.toOBBSpaceInvert));
            }

            ray.direction = obb.orientation.y;
            intersection = this.rayPlane(ray, planeOBB);
            if (this.inBBox(intersection, bboxMin, bboxMax)) {
                intersections.push(intersection.applyMatrix4(obb.toOBBSpaceInvert));
            }

            ray.direction = obb.orientation.z;
            intersection = this.rayPlane(ray, planeOBB);
            if (this.inBBox(intersection, bboxMin, bboxMax)) {
                intersections.push(intersection.applyMatrix4(obb.toOBBSpaceInvert));
            }

            // RAYS STARTING FROM THE LAST CORNER
            //
            //               +
            //             .'
            //   +-------+'
            //           |
            //           |
            //           |
            //           +
            //

            ray = {
                "position": new THREE.Vector3(obb.center.x + obb.halfDimensions.x, obb.center.y + obb.halfDimensions.y, obb.center.z + obb.halfDimensions.z),
                "direction": obb.orientation.x
            };

            intersection = this.rayPlane(ray, planeOBB);
            if (this.inBBox(intersection, bboxMin, bboxMax)) {
                intersections.push(intersection.applyMatrix4(obb.toOBBSpaceInvert));
            }

            ray.direction = obb.orientation.y;
            intersection = this.rayPlane(ray, planeOBB);
            if (this.inBBox(intersection, bboxMin, bboxMax)) {
                intersections.push(intersection.applyMatrix4(obb.toOBBSpaceInvert));
            }

            ray.direction = obb.orientation.z;
            intersection = this.rayPlane(ray, planeOBB);
            if (this.inBBox(intersection, bboxMin, bboxMax)) {
                intersections.push(intersection.applyMatrix4(obb.toOBBSpaceInvert));
            }

            // RAYS STARTING FROM THE SECOND CORNER
            //
            //               +
            //               |
            //               |
            //               |
            //               +
            //             .'
            //           +'

            ray = {
                "position": new THREE.Vector3(obb.center.x + obb.halfDimensions.x, obb.center.y - obb.halfDimensions.y, obb.center.z - obb.halfDimensions.z),
                "direction": obb.orientation.y
            };

            intersection = this.rayPlane(ray, planeOBB);
            if (this.inBBox(intersection, bboxMin, bboxMax)) {
                intersections.push(intersection.applyMatrix4(obb.toOBBSpaceInvert));
            }

            ray.direction = obb.orientation.z;
            intersection = this.rayPlane(ray, planeOBB);
            if (this.inBBox(intersection, bboxMin, bboxMax)) {
                intersections.push(intersection.applyMatrix4(obb.toOBBSpaceInvert));
            }

            // RAYS STARTING FROM THE THIRD CORNER
            //
            //      .+-------+ 
            //    .'
            //   +
            //  
            //  
            //  
            //  

            ray = {
                "position": new THREE.Vector3(obb.center.x - obb.halfDimensions.x, obb.center.y + obb.halfDimensions.y, obb.center.z - obb.halfDimensions.z),
                "direction": obb.orientation.x
            };

            intersection = this.rayPlane(ray, planeOBB);
            if (this.inBBox(intersection, bboxMin, bboxMax)) {
                intersections.push(intersection.applyMatrix4(obb.toOBBSpaceInvert));
            }

            ray.direction = obb.orientation.z;
            intersection = this.rayPlane(ray, planeOBB);
            if (this.inBBox(intersection, bboxMin, bboxMax)) {
                intersections.push(intersection.applyMatrix4(obb.toOBBSpaceInvert));
            }

            // RAYS STARTING FROM THE FOURTH CORNER
            //
            //  
            //  
            //   +
            //   |
            //   | 
            //   |
            //   +-------+

            ray = {
                "position": new THREE.Vector3(obb.center.x - obb.halfDimensions.x, obb.center.y - obb.halfDimensions.y, obb.center.z + obb.halfDimensions.z),
                "direction": obb.orientation.x
            };

            intersection = this.rayPlane(ray, planeOBB);
            if (this.inBBox(intersection, bboxMin, bboxMax)) {
                intersections.push(intersection.applyMatrix4(obb.toOBBSpaceInvert));
            }

            ray.direction = obb.orientation.y;
            intersection = this.rayPlane(ray, planeOBB);
            if (this.inBBox(intersection, bboxMin, bboxMax)) {
                intersections.push(intersection.applyMatrix4(obb.toOBBSpaceInvert));
            }

            return intersections;
        };

        /**
         * Compute intersection between a ray and a plane.
         *
         * @memberOf VJS.core.intersections
         * @public
         *
         * @param {Object} ray - Ray representation.
         * @param {THREE.Vector3} ray.position - position of normal which describes the ray.
         * @param {THREE.Vector3} ray.direction - Direction of normal which describes the ray.
         * @param {Object} plane - Plane representation
         * @param {THREE.Vector3} plane.position - position of normal which describes the plane.
         * @param {THREE.Vector3} plane.direction - Direction of normal which describes the plane.
         *
         * @returns {THREE.Vector3|null} Intersection between ray and plane or null.
         */
        VJS.core.intersections.rayPlane = function (ray, plane) {
            // ray: {position, direction}
            // plane: {position, direction}

            if (ray.direction.dot(plane.direction) !== 0) {
                //
                // not parallel, move forward
                //
                // LOGIC:
                //
                // Ray equation: P = P0 + tV
                // P = <Px, Py, Pz>
                // P0 = <ray.position.x, ray.position.y, ray.position.z>
                // V = <ray.direction.x, ray.direction.y, ray.direction.z>
                //
                // Therefore:
                // Px = ray.position.x + t*ray.direction.x
                // Py = ray.position.y + t*ray.direction.y
                // Pz = ray.position.z + t*ray.direction.z
                //
                //
                //
                // Plane equation: ax + by + cz + d = 0
                // a = plane.direction.x
                // b = plane.direction.y
                // c = plane.direction.z
                // d = -( plane.direction.x*plane.position.x +
                //        plane.direction.y*plane.position.y +
                //        plane.direction.z*plane.position.z )
                //
                //
                // 1- in the plane equation, we replace x, y and z by Px, Py and Pz
                // 2- find t
                // 3- replace t in Px, Py and Pz to get the coordinate of the intersection
                //
                var t = (plane.direction.x * (plane.position.x - ray.position.x) + plane.direction.y * (plane.position.y - ray.position.y) + plane.direction.z * (plane.position.z - ray.position.z)) / (plane.direction.x * ray.direction.x + plane.direction.y * ray.direction.y + plane.direction.z * ray.direction.z);

                var intersection = new THREE.Vector3(ray.position.x + t * ray.direction.x, ray.position.y + t * ray.direction.y, ray.position.z + t * ray.direction.z);

                return intersection;
            }

            return null;
        };

        VJS.core.intersections.rayBox = function (ray, box) {
            // ray: {position, direction}
            // box: {halfDimensions, center}

            var intersections = [];
            var plane = {
                position: null,
                direction: null
            };

            var bboxMin = new THREE.Vector3(box.center.x - box.halfDimensions.x, box.center.y - box.halfDimensions.y, box.center.z - box.halfDimensions.z);
            var bboxMax = new THREE.Vector3(box.center.x + box.halfDimensions.x, box.center.y + box.halfDimensions.y, box.center.z + box.halfDimensions.z);

            // X min
            plane.direction = new THREE.Vector3(-1, 0, 0);
            plane.position = new THREE.Vector3(bboxMin.x, box.center.y, box.center.z);
            var intersection = this.rayPlane(ray, plane);
            if (this.inBBox(intersection, bboxMin, bboxMax)) {
                intersections.push(intersection);
            }

            // X max
            plane.direction = new THREE.Vector3(1, 0, 0);
            plane.position = new THREE.Vector3(bboxMax.x, box.center.y, box.center.z);
            intersection = this.rayPlane(ray, plane);
            if (this.inBBox(intersection, bboxMin, bboxMax)) {
                intersections.push(intersection);
            }

            // Y min
            plane.direction = new THREE.Vector3(0, -1, 0);
            plane.position = new THREE.Vector3(box.center.x, bboxMin.y, box.center.z);
            intersection = this.rayPlane(ray, plane);
            if (this.inBBox(intersection, bboxMin, bboxMax)) {
                intersections.push(intersection);
            }

            // Y max
            plane.direction = new THREE.Vector3(0, 1, 0);
            plane.position = new THREE.Vector3(box.center.x, bboxMax.y, box.center.z);
            intersection = this.rayPlane(ray, plane);
            if (this.inBBox(intersection, bboxMin, bboxMax)) {
                intersections.push(intersection);
            }

            // Z min
            plane.direction = new THREE.Vector3(0, 0, -1);
            plane.position = new THREE.Vector3(box.center.x, box.center.y, bboxMin.z);
            intersection = this.rayPlane(ray, plane);
            if (this.inBBox(intersection, bboxMin, bboxMax)) {
                intersections.push(intersection);
            }

            // Z max
            plane.direction = new THREE.Vector3(0, 0, 1);
            plane.position = new THREE.Vector3(box.center.x, box.center.y, bboxMax.z);
            intersection = this.rayPlane(ray, plane);
            if (this.inBBox(intersection, bboxMin, bboxMax)) {
                intersections.push(intersection);
            }

            return intersections;
        };

        VJS.core.intersections.inBBox = function (point, bboxMin, bboxMax) {
            if (point && point.x >= bboxMin.x && point.y >= bboxMin.y && point.z >= bboxMin.z && point.x <= bboxMax.x && point.y <= bboxMax.y && point.z <= bboxMax.z) {
                return true;
            }
            return false;
        };

        /*** Exports ***/

        var moduleType = typeof module;
        if (moduleType !== "undefined" && module.exports) {
            module.exports = VJS.core.intersections;
        }
    }, {}], 4: [function (require, module, exports) {
        "use strict";

        var VJS = VJS || {};
        VJS.geometries = VJS.geometries || {};

        /*** Imports ***/

        VJS.core = VJS.core || {};
        VJS.core.intersections = VJS.core.intersections || require("../core/core.intersections");

        /**
         *
         * It is typically used for creating an irregular 3D planar shape given a box and the cut-plane.
         *
         * Demo: {@link https://fnndsc.github.io/vjs#geometry_slice}
         *
         * @constructor
         * @class
         * @memberOf VJS.geometries
         * @public
         *
         * @param {THREE.Vector3} halfDimensions - Half-dimensions of the box to be sliced.
         * @param {THREE.Vector3} center - Center of the box to be sliced.
         * @param {THREE.Vector3<THREE.Vector3>} orientation - Orientation of the box to be sliced. (might not be necessary..?)
         * @param {THREE.Vector3} position - Position of the cutting plane.
         * @param {THREE.Vector3} direction - Cross direction of the cutting plane.
         *
         * @example
         * // Define box to be sliced
         * var halfDimensions = new THREE.Vector(123, 45, 67);
         * var center = new THREE.Vector3(0, 0, 0);
         * var orientation = new THREE.Vector3(
         *   new THREE.Vector3(1, 0, 0),
         *   new THREE.Vector3(0, 1, 0),
         *   new THREE.Vector3(0, 0, 1)
         * );
         *
         * // Define slice plane
         * var position = center.clone();
         * var direction = new THREE.Vector3(-0.2, 0.5, 0.3);
         *
         * // Create the slice geometry & materials
         * var sliceGeometry = new VJS.geometries.slice(halfDimensions, center, orientation, position, direction);
         * var sliceMaterial = new THREE.MeshBasicMaterial({
         *   'side': THREE.DoubleSide,
         *   'color': 0xFF5722
         * });
         *
         *  // Create mesh and add it to the scene
         *  var slice = new THREE.Mesh(sliceGeometry, sliceMaterial);
         *  scene.add(slice);
         */
        VJS.geometries.slice = function (halfDimensions, center, orientation, position, direction) {

            //
            // prepare data for the shape!
            //
            var obb = {
                "halfDimensions": halfDimensions,
                "center": center,
                "orientation": orientation,
                "toOBBSpace": new THREE.Matrix4(), // not necessary
                "toOBBSpaceInvert": new THREE.Matrix4() // not necessary
            };

            var plane = {
                "position": position,
                "direction": direction
            };

            // BOOM!
            var intersections = VJS.core.intersections.obbPlane(obb, plane);

            if (intersections.length < 3) {
                window.console.log("WARNING: Less than 3 intersections between OBB and Plane.");
                window.console.log("OBB");
                window.console.log(obb);
                window.console.log("Plane");
                window.console.log(plane);
                window.console.log("exiting...");
            }

            var centerOfMass = this.centerOfMass(intersections);
            var orderedIntersections = this.orderIntersections(intersections, centerOfMass, direction);

            // split for convenience
            var formatIntersections = [];
            var formatIntersectionsXY = [];
            for (var k = 0; k < orderedIntersections.length; k++) {
                formatIntersections.push(orderedIntersections[k].point);
                formatIntersectionsXY.push(orderedIntersections[k].xy);
            }

            //
            // Create Shape
            //
            var sliceShape = new THREE.Shape();
            // move to first point!
            sliceShape.moveTo(formatIntersectionsXY[0].x, formatIntersectionsXY[0].y);

            // loop through all points!
            for (var l = 1; l < formatIntersectionsXY.length; l++) {
                // project each on plane!
                sliceShape.lineTo(formatIntersectionsXY[l].x, formatIntersectionsXY[l].y);
            }

            // close the shape!
            sliceShape.lineTo(formatIntersectionsXY[0].x, formatIntersectionsXY[0].y);

            //
            // Generate Geometry from shape
            // It does triangulation for us!
            //
            THREE.ShapeGeometry.call(this, sliceShape);
            this.type = "SliceGeometry";

            // update real position of each vertex! (not in 2d)
            this.vertices = formatIntersections;
            this.verticesNeedUpdate = true;
        };

        VJS.geometries.slice.prototype = Object.create(THREE.ShapeGeometry.prototype);
        VJS.geometries.slice.prototype.constructor = VJS.geometries.slice;

        /**
         *
         * Convenience function to extract center of mass from list of points.
         *
         * @private
         *
         * @param {Array<THREE.Vector3>} points - Set of points from which we want to extract the center of mass.
         *
         * @returns {THREE.Vector3} Center of mass from given points.
         */
        VJS.geometries.slice.prototype.centerOfMass = function (points) {
            var centerOfMass = new THREE.Vector3(0, 0, 0);
            for (var i = 0; i < points.length; i++) {
                centerOfMass.x += points[i].x;
                centerOfMass.y += points[i].y;
                centerOfMass.z += points[i].z;
            }
            centerOfMass.divideScalar(points.length);

            return centerOfMass;
        };

        /**
         *
         * Order 3D planar points around a refence point.
         *
         * @private
         *
         * @param {Array<THREE.Vector3>} points - Set of planar 3D points to be ordered.
         * @param {THREE.Vector3} reference - Reference point for ordering.
         * @param {THREE.Vector3} direction - Direction of the plane in which points and reference are sitting.
         *
         * @returns {Array<Object>} Set of object representing the ordered points.
         */
        VJS.geometries.slice.prototype.orderIntersections = function (points, reference, direction) {

            var a0 = points[0].x;
            var b0 = points[0].y;
            var c0 = points[0].z;
            var x0 = points[0].x - reference.x;
            var y0 = points[0].y - reference.y;
            var z0 = points[0].z - reference.z;
            var l0 = {
                origin: new THREE.Vector3(a0, b0, c0),
                direction: new THREE.Vector3(x0, y0, z0).normalize()
            };

            var base = new THREE.Vector3(0, 0, 0).crossVectors(l0.direction, direction).normalize();

            var orderedpoints = [];

            // other lines // if inter, return location + angle
            for (var j = 0; j < points.length; j++) {

                var a1 = points[j].x;
                var b1 = points[j].y;
                var c1 = points[j].z;
                var x1 = points[j].x - reference.x;
                var y1 = points[j].y - reference.y;
                var z1 = points[j].z - reference.z;

                var l1 = {
                    origin: new THREE.Vector3(a1, b1, c1),
                    direction: new THREE.Vector3(x1, y1, z1).normalize()
                };

                var x = l0.direction.dot(l1.direction);
                var y = base.dot(l1.direction);

                var thetaAngle = Math.atan2(y, x);
                var theta = thetaAngle * (180 / Math.PI);
                orderedpoints.push({
                    "angle": theta,
                    "point": l1.origin,
                    "xy": {
                        "x": x,
                        "y": y
                    }
                });
            }

            orderedpoints.sort(function (a, b) {
                return a.angle - b.angle;
            });

            return orderedpoints;
        };

        /*** Exports ***/

        var moduleType = typeof module;
        if (moduleType !== "undefined" && module.exports) {
            module.exports = VJS.geometries.slice;
        }
    }, { "../core/core.intersections": 3 }] }, {}, [1]);
/* event */ /* event */
//# sourceMappingURL=../geometries_slice/geometries_slice.js.map