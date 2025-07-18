# Xash3D-FWGS Emscripten Web Ports Monorepo

This project is a [Lerna](https://lerna.js.org)-managed monorepo for running and compiling WebAssembly builds of [Xash3D-FWGS](https://github.com/FWGS/xash3d-fwgs), an open-source reimplementation of the GoldSource engine, in the browser using [Emscripten](https://emscripten.org/).

```shell
npm install xash3d-fwgs hlsdk-portable cs16-client
```

```typescript
import { Xash3D } from "xash3d-fwgs"

const x = new Xash3D({
    canvas: document.getElementById('canvas'),
    args: ['-game', 'cstrike'],
})
await x.init()
x.main()
x.Cmd_ExecuteString('map de_dust2')
x.Cmd_ExecuteString('sv_cheats 1')
x.Cmd_ExecuteString('noclip')
x.Cmd_ExecuteString('kill')
x.Cmd_ExecuteString('quit')
```

### Included Packages

* [xash3d-fwgs](packages/xash3d): Core engine build for WebAssembly.
* [hlsdk-portable](packages/hlsdk): Portable Half-Life SDK game logic.
* [cs16-client](packages/cs16): Counter-Strike 1.6 client build for the web.

## Getting Started 

### Clone the repository

```shell
git clone --recurse-submodules https://github.com/yohimik/webxash3d-fwgs.git
cd webxash3d-fwgs
```

### Install Dependencies

```shell
npm install
```

### Game Content

You must provide your own game files (e.g., from Steam):
```shell
steamcmd +force_install_dir ./hl +login your_steam_username +app_update 70 validate +quit
```

### Compile and run

To build and run a project, go to the [packages/examples/ folder](packages/examples) and choose the example that matches the game or setup you want.

### hlsdk

<details>
  <summary>Screenshots (black frames - mac book camera, blue frames - browser active outline)</summary>

![hlsdk screenshot 0](./screenshots/hlsdk0.png)
![hlsdk screenshot 1](./screenshots/hlsdk1.png)
![hlsdk screenshot 2](./screenshots/hlsdk2.png)
![hlsdk screenshot 3](./screenshots/hlsdk3.png)
![hlsdk screenshot 4](./screenshots/hlsdk4.png)

</details>

### cs16

<details>
  <summary>Screenshots (black frames - mac book camera, blue frames - browser active outline)</summary>

![cs16-client screenshot 0](./screenshots/cs16-client0.png)
![cs16-client screenshot 1](./screenshots/cs16-client1.png)
![cs16-client screenshot 2](./screenshots/cs16-client2.png)
![cs16-client screenshot 3](./screenshots/cs16-client3.png)

</details>

### tf15-client

Cannot be supported at this moment (wait for `freevgui`).

### WebRTC Online Mod

<details>
  <summary>Screenshots</summary>

![webrtc screenshot 0](./screenshots/webrtc0.png)

</details>

# TODO

## Online

Support connection to servers (only xash3d-fwgs dedicated server).

## Engine Touch Support

Enable touch support at the engine level.
Requires `isNeedTouch` engine function support.

## Fix Text Inputs

Text inputs are not rendered as standard HTML input fields, which makes text input impossible on mobile devices.

## Async/lazy loading (potentially)

Patch the FS module to load only the currently required game files using `fetch`, instead of loading all files into RAM. 
Requires `EAGAIN` support from the engine.

## WebGL improves (potentially)

Support GLES3Compat batching and fix `Vertex buffer is not big enough for the draw call.Understand this warning` warning.

## Scripts (potentially)

Some scripts stop working after saving and loading (eg. the guard doesn't open the train door).
Potentially related to `#define EXPORT __attribute__((visibility("default")))`.
