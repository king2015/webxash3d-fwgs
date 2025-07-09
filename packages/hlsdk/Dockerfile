FROM emscripten/emsdk:4.0.10

WORKDIR /hlsdk-portable
COPY hlsdk-portable .
RUN emconfigure ./waf configure --emscripten -T release && \
    emmake ./waf


RUN mkdir out
RUN mkdir out/cl_dll
RUN mkdir out/dlls
RUN mv /hlsdk-portable/build/cl_dll/client_emscripten_wasm32.wasm out/cl_dll/client_emscripten_wasm32.wasm
RUN mv /hlsdk-portable/build/dlls/hl_emscripten_wasm32.wasm out/dlls/hl_emscripten_wasm32.so
ENTRYPOINT ["cp", "-r", "/hlsdk-portable/out/.", "/out/"]