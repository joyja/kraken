"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_vite_1 = require("electron-vite");
const vite_plugin_svelte_1 = require("@sveltejs/vite-plugin-svelte");
exports.default = (0, electron_vite_1.defineConfig)({
    main: {
        plugins: [(0, electron_vite_1.externalizeDepsPlugin)()]
    },
    preload: {
        plugins: [(0, electron_vite_1.externalizeDepsPlugin)()]
    },
    renderer: {
        plugins: [(0, vite_plugin_svelte_1.svelte)()]
    }
});
