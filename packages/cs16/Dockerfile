FROM emscripten/emsdk:4.0.10

WORKDIR /cs
COPY cs16-client .
RUN emcmake cmake -S . -B build && \
	cmake --build build --config Release

RUN mkdir out
RUN mkdir out/cl_dll
RUN mkdir out/dlls
RUN mv /cs/build/3rdparty/mainui_cpp/menu_emscripten_javascript.wasm out/cl_dll/menu_emscripten_wasm32.wasm
RUN mv /cs/build/3rdparty/ReGameDLL_CS/regamedll/cs_emscripten_javascript.wasm out/dlls/cs_emscripten_wasm32.so
RUN mv /cs/build/cl_dll/client_emscripten_javascript.wasm out/cl_dll/client_emscripten_wasm32.wasm
ENTRYPOINT ["cp", "-r", "/cs/out/.", "/out/"]