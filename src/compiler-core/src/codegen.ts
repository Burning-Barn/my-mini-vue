// export function generate(ast) {
//     return  {
//         code: `return function render(_ctx, _cache, $props, $setup, $data, $options) {return "hi"}`
//     }
// }

import { NodeTypes } from "./ast"
import { TO_DISPLAY_STRING, helperMapName } from "./runtimeHelpers"

`
"const { toDisplayString:_toDisplayString } = Vue
return function render(_ctx, _cache){return _toDisplayString(_ctx.message)}"
`

export function generate(ast) {
    const _context = createCodegenContext(ast)
    const { push } = _context
    const _functionName = 'render'
    // const _args = ['_ctx', '_cache', '$props', '$setup', '$data', '$options']
    const _args = ['_ctx', '_cache']
    const _signature = _args.join(', ')

    getfunctionPreamble(ast, _context)

    push(`function ${_functionName}(${_signature}) {`)
    push(`return `)
    getNode(ast.codegenNode, _context)
    push(`}`)

    return  {
        code: _context.code
    }
}

function getfunctionPreamble(ast, _context) {
    const { push } = _context
    const _VueBinging = 'Vue'
    // const _fucPreFix = `const { ${toDisplayString}:${_toDisplayString} } = _VueBinging`
    const _aliasHelps = (s) => `${helperMapName[s]}:_${helperMapName[s]}`
    if(ast.helps.length > 0) {
        // ${ast.helps.map(_aliasHelps).join(',')} 转化为 { toDisplayString:_toDisplayString }
        const _fucPreFix = `const { ${ast.helps.map(_aliasHelps).join(',')} } = ${_VueBinging}`
        push(_fucPreFix)
        push('\n')
    }
    push('return ')
}

function getNode(node, _context) {
    const { push } = _context
    switch (node.type) {
        case NodeTypes.TEXT:
            // push(`"${node.content}"`)
            genText(node, _context)
            break;
        case NodeTypes.INTERPOLATION:
            // push(`_toDisplayString(_ctx.message)`)
            genInterpolation(node, _context);
            break;
        case NodeTypes.SIMPLE_EXPRESSION:
            genSimpleExpression(node, _context)
            break
        default:
            break;
    }
}

function genSimpleExpression(node, context) {
    const { push } = context;
    // push(`_ctx.${node.content}`);
    // 转化 _toDisplayString(_ctx.message)}" 中的 _ctx.${node.content}
    // 使用插件nodeTransforms: [transformExpression], 把node.content 转为_ctx.${node.content}
    push(`${node.content}`);
}

function genInterpolation(node, context) {
    const { push } = context;
    
    // 转化 _toDisplayString(_ctx.message)}" 中的  _toDisplayString(
    push(`${context.help(TO_DISPLAY_STRING)}(`)
    // console.log('node', node)
    // { type: 0, content: { type: 1, content: 'message' } }
    getNode(node.content, context) 
    push(`)`);
}

function genText(node, context) {
    const { push } = context;
    push(`'${node.content}'`);
}


function createCodegenContext(ast) {
    const context = {
        code: '',
        push(str) {
            context.code+=str
        },
        help(key) {
            return `_${helperMapName[key]}`
        }
    }
    return context
} 

