FROM emscripten/emsdk:4.0.10 AS engine

RUN dpkg --add-architecture i386
RUN apt update && apt upgrade -y && apt -y --no-install-recommends install aptitude
RUN aptitude -y --without-recommends install git ca-certificates build-essential gcc-multilib g++-multilib libsdl2-dev:i386 libfreetype-dev:i386 libopus-dev:i386 libbz2-dev:i386 libvorbis-dev:i386 libopusfile-dev:i386 libogg-dev:i386
ENV PKG_CONFIG_PATH=/usr/lib/i386-linux-gnu/pkgconfig

WORKDIR /xash3d-fwgs
COPY xash3d-fwgs .
ENV EMCC_CFLAGS="-s USE_SDL=2"
RUN emconfigure ./waf configure --emscripten && \
	emmake ./waf build

COPY patches patches
RUN sed -e "/var Module = typeof Module != 'undefined' ? Module : {};/{r patches/head-cs.js" -e 'd}' -i build/engine/xash.js
RUN sed -e 's/run();//g' -i build/engine/xash.js
RUN sed -e '/preInit();/{r patches/init.js' -e 'd}' -i build/engine/xash.js
RUN sed -e 's/async type="text\/javascript"/defer type="module"/' -i build/engine/xash.html


FROM emscripten/emsdk:4.0.10 AS cs

RUN dpkg --add-architecture i386
RUN apt update && apt upgrade -y && apt -y --no-install-recommends install aptitude
RUN aptitude -y --without-recommends install git ca-certificates build-essential gcc-multilib g++-multilib libsdl2-dev:i386 libfreetype-dev:i386 libopus-dev:i386 libbz2-dev:i386 libvorbis-dev:i386 libopusfile-dev:i386 libogg-dev:i386
ENV PKG_CONFIG_PATH=/usr/lib/i386-linux-gnu/pkgconfig

WORKDIR /cs
COPY cs16-client .
ENV EMCC_CFLAGS="-s USE_SDL=2"
RUN emcmake cmake -S . -B build && \
	cmake --build build --config Release


FROM nginx:alpine3.21 AS server

COPY --from=cs /cs/build/cl_dll/client_emscripten_javascript.wasm /usr/share/nginx/html/cl_dlls/client_emscripten_wasm32.wasm
COPY --from=cs /cs/build/3rdparty/ReGameDLL_CS/regamedll/cs_emscripten_javascript.wasm /usr/share/nginx/html/dlls/cs_emscripten_wasm32.so
COPY --from=cs /cs/build/3rdparty/mainui_cpp/menu_emscripten_javascript.wasm /usr/share/nginx/html/cl_dlls/menu_emscripten_wasm32.wasm
COPY --from=engine /xash3d-fwgs/build/engine/xash.html /usr/share/nginx/html/index.html
COPY --from=engine /xash3d-fwgs/build/engine/xash.js /usr/share/nginx/html/xash.js
COPY --from=engine /xash3d-fwgs/build/engine/xash.wasm /usr/share/nginx/html/xash.wasm
COPY --from=engine /xash3d-fwgs/build/filesystem/filesystem_stdio.wasm /usr/share/nginx/html/filesystem_stdio.wasm
COPY --from=engine /xash3d-fwgs/build/filesystem/filesystem_stdio.wasm /usr/share/nginx/html/rwdir/filesystem_stdio.so
COPY --from=engine /xash3d-fwgs/build/ref/gl/libref_gles3compat.wasm /usr/share/nginx/html/libref_gles3compat.wasm
COPY --from=engine /xash3d-fwgs/build/ref/soft/libref_soft.wasm /usr/share/nginx/html/libref_soft.wasm

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
