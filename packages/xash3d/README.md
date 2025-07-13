# Xash3D-FWGS Emscripten TypeScript

A powerful TypeScript wrapper and extension layer for the [Xash3D FWGS](https://github.com/FWGS/xash3d-fwgs) engine compiled with Emscripten. 
This project enables seamless integration of the engine into modern web and cross-platform environments with **zero dependencies**, **network protocol abstraction**, and **WebRTC-ready transport support**.

---

## 🚀 Features

- ✅ **TypeScript-first**: Strong typings and developer-friendly tooling.
- 🔌 **Zero Dependencies**: Lightweight and modular. No external runtime libraries required.
- 🌐 **Pluggable Network Layer**: Abstracted networking stack compatible with any protocol (WebSocket, WebRTC, custom).
- 🧱 **Emscripten Integration**: Wrapper for compiled Xash3D WASM build using Emscripten's `MODULARIZE` & `EXPORT_NAME`.
- 🔄 **Extended Engine APIs**: Optional patches and hooks to extend or override engine behavior from TypeScript.
- 🛠️ **Custom I/O Bindings**: Integrate with custom file systems or asset streams.
- 🧪 **Testing-Friendly**: Clean architecture with clear separation between engine, I/O, and network logic.

---

## 🧩 Usage

To get started quickly, check out the [examples/](https://github.com/yohimik/webxash3d-fwgs/tree/main/packages/examples) folder for real-world usage with:

* WebRTC transport
* WebSocket transport
* File system overrides
* Minimal startup with in-memory assets
* Multiplayer setup demo
* Each example includes a small setup script, build instructions, and README for clarity.
