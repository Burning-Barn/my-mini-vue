import typescript from "@rollup/plugin-typescript"
import pkg from "./package.json" assert { type: "json" };
;

export default {
    input: "./src/index.ts",
    output: [
        // cjs --> commonjs
        // esm
        {
            format: "cjs",
            // file: 'lib/my-mini-vue.cjs.js',
            file: pkg.main,
        },
        {
            format: "es",
            file: pkg.module,
        },
    ],
    plugins: [
        typescript()
    ],
}