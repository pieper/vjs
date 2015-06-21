# vjs

A light-weight JS library for medical imaging with ThreeJS.

2048 * 2048 * 4 pixels big object supported in the shader. Needs a good fall back solution for bigger volumes.

WebGL support: http://caniuse.com/#search=webgl

## Examples

http://fnndsc.github.io/vjs

## Dev corner

### Setup environment

```
$> git clone
$> cd VJS 
$> npm install
$> bower install
```

### Gulp task

```
// build VJS to /dist directory.
// no minifaction happening yet
$> gulp

// run a browserSync local server for development
gulp serve

// run a browserSync local server over built VJS
gulp serve:dist
```

### NEED SOME TESTINGS!
