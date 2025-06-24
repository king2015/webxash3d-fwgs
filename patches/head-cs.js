import JSZip from 'https://cdn.skypack.dev/jszip@3.10.1';
var Module = typeof Module != 'undefined' ? Module : {};
Module.dynamicLibraries = [
	"filesystem_stdio.wasm",
	"libref_gles3compat.wasm",
	"libref_soft.wasm",
	"cl_dlls/menu_emscripten_wasm32.wasm",
	"dlls/cs_emscripten_wasm32.so",
	"cl_dlls/client_emscripten_wasm32.wasm",
]
Module.arguments = ['-game', 'cstrike', '+_vgui_menus', '0']
Module['canvas'] = document.getElementById('canvas')
Module.ctx = document.getElementById('canvas').getContext('webgl2', {alpha:false, depth: true, stencil: true, antialias: true})
