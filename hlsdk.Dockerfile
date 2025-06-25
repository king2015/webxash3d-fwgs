FROM emscripten/emsdk:4.0.10 AS engine

WORKDIR /xash3d-fwgs
COPY xash3d-fwgs .
ENV EMCC_CFLAGS="-s USE_SDL=2"
RUN emconfigure ./waf configure --emscripten && \
	emmake ./waf build

COPY patches patches
RUN sed -e "/var Module = typeof Module != 'undefined' ? Module : {};/{r patches/head.js" -e 'd}' -i build/engine/xash.js
RUN sed -e 's/run();//g' -i build/engine/xash.js
RUN sed -e '/preInit();/{r patches/init.js' -e 'd}' -i build/engine/xash.js
RUN sed -e 's/async type="text\/javascript"/defer type="module"/' -i build/engine/xash.html


FROM emscripten/emsdk:4.0.10 AS hlsdk

WORKDIR /hlsdk-portable
COPY hlsdk-portable .
RUN emconfigure ./waf configure --emscripten -T release && \
    emmake ./waf


FROM nginx:alpine3.21 AS server

COPY --from=hlsdk /hlsdk-portable/build/cl_dll/client_emscripten_wasm32.wasm /usr/share/nginx/html/cl_dlls/client_emscripten_wasm32.wasm
COPY --from=hlsdk /hlsdk-portable/build/dlls/hl_emscripten_wasm32.wasm /usr/share/nginx/html/dlls/hl_emscripten_wasm32.so
COPY --from=engine /xash3d-fwgs/build/3rdparty/mainui/libmenu.wasm /usr/share/nginx/html/cl_dlls/menu_emscripten_wasm32.wasm
COPY --from=engine /xash3d-fwgs/build/engine/xash.html /usr/share/nginx/html/index.html
COPY --from=engine /xash3d-fwgs/build/engine/xash.js /usr/share/nginx/html/xash.js
COPY --from=engine /xash3d-fwgs/build/engine/xash.wasm /usr/share/nginx/html/xash.wasm
COPY --from=engine /xash3d-fwgs/build/filesystem/filesystem_stdio.wasm /usr/share/nginx/html/filesystem_stdio.wasm
COPY --from=engine /xash3d-fwgs/build/ref/gl/libref_gles3compat.wasm /usr/share/nginx/html/libref_gles3compat.wasm
COPY --from=engine /xash3d-fwgs/build/ref/soft/libref_soft.wasm /usr/share/nginx/html/libref_soft.wasm

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
