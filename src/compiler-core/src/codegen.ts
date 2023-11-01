// export function generate(ast) {
//     return  {
//         code: `return function render(_ctx, _cache, $props, $setup, $data, $options) {return "hi"}`
//     }
// }

export function generate(ast) {
    const _context = createCodegenContext(ast)
    const { push } = _context
    const _functionName = 'render'
    const _regs = ['_ctx', '_cache', '$props', '$setup', '$data', '$options']
    const _signature = _regs.join(', ')

    push('return ')
    push(`function ${_functionName}(${_signature}) {`)
    push(`return `)
    // push(`"${ast.codegenNode.content}"`)
    getNode(ast.codegenNode, _context)
    push(`}`)

    return  {
        code: _context.code
    }
}

function getNode(node, _context) {
    _context.push(`"${node.content}"`)
}


function createCodegenContext(ast) {
    const context = {
        code: '',
        push(str) {
            context.code+=str
        }
    }
    return context
} 

