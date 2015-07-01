[![Build Status](https://travis-ci.org/FNNDSC/vjs.svg)](https://travis-ci.org/FNNDSC/vjs)

A light-weight JS library for medical imaging with ThreeJS.

We assume you graphic card can load up to 16 textures of 2048x2048.

WebGL support: http://caniuse.com/#search=webgl

## Examples

http://fnndsc.github.io/vjs

## Dev corner

### Setup environment

```
$> git clone https://github.com/FNNDSC/vjs.git
$> cd vjs 
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

### TODO
* testings
* glslify
