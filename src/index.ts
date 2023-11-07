// mini-vue出口

import { baseCompile } from './compiler-core/src/compile.ts'
import { registerCompiler } from './runtime-core/component.js'

import * as runtime_core from './runtime-dom/index'

export * from './runtime-dom/index'
// export * from './reactivity/index'


function compileToFunction(template) {
    const _code = baseCompile(template)
    return new Function('Vue', _code)(runtime_core)
}

// 使用registerCompiler解耦
// 因为Vue 模块性，不建议runtime-dom里面直接引入compiler-dom,所以，使用registerCompiler注入，进行解耦。
registerCompiler(compileToFunction)

