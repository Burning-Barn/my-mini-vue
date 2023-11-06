// export function generate(ast) {
//     return  {
//         code: `return function render(_ctx, _cache, $props, $setup, $data, $options) {return "hi"}`
//     }
// }

import { NodeTypes } from "./ast"
import { CREATE_ELEMENT_VNODE, TO_DISPLAY_STRING, helperMapName } from "./runtimeHelpers"

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
    // console.log('ast.codegenNode ===>', ast.codegenNode)
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
        case NodeTypes.ELEMENT:
            genElement(node, _context)
            break
        case NodeTypes.COMPOUND_EXPRESSION:
            COMPOUND_EXPRESSION(node, _context)
            break
        default:
            break;
    }
}

function COMPOUND_EXPRESSION(node, context) {
    const { push } = context;
    const { tag, children } = node;
    for (let i = 0; i < children.length; i++) {
        const _child = children[i];
        if(typeof _child === 'string') {
            push(_child)
        } else {
            getNode(_child, context)
        }
    }
}

function genElement(node, context) {
    const { push } = context;
    const { tag, children } = node;
    // push(`${context.help(CREATE_ELEMENT_VNODE)}("${tag}"), null, "hi, " + _toDisplayString(_ctx.message)`)
    push(`${context.help(CREATE_ELEMENT_VNODE)}('${tag}', null, `)
    // console.log('!!node ===>', node)
    // console.log('!!children ===>', children)

    // 适配当前"<div>hi,{{message}}</div>" 简写
    // for (let i = 0; i < children.length; i++) {
    //     const _child = children[i];
    //     getNode(_child, context)
    // }

    // const _child = children[0]
    // getNode(_child, context)

    getNode(children, context)

    push(')')
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

