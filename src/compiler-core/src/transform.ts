import { NodeTypes } from "./ast"
import { TO_DISPLAY_STRING } from "./runtimeHelpers"

export function transform(root, options={}) {
    const _context = createTransformContext(root, options)
    // 树结构遍历，1、深度优先搜索，---》递归   2、广度优先搜索
    traverseNode(root, _context)

    const child = root.children[0]
    if(child.type === NodeTypes.ELEMENT) {
        root.codegenNode = child.codegenNode
    } else {
        root.codegenNode = root.children[0]
    }
    root.helps = [..._context.helps.keys()]
}

function traverseNode(root, context) {
    console.log('root', root)

    // 插件体系
    let _handleFuc: any = []
    const _nodeTransforms = context.nodeTransforms
    if(_nodeTransforms) {
        for (let i = 0; i < _nodeTransforms.length; i++) {
            const _nodeTransform = _nodeTransforms[i];
            let onExit = _nodeTransform(root, context) 
            _handleFuc.push(onExit)
        }
    }

    switch (root.type) {
        case NodeTypes.INTERPOLATION:
            context.help(TO_DISPLAY_STRING)
            break
        case NodeTypes.ELEMENT:
        case NodeTypes.ROOT:
            // 变动点与稳定点分离，将稳定点分离成单独函数，保证可测试性。
            traverseChildren(root, context)
            break;
        default:
            break;
    }

    let _len = _handleFuc.length
    while(_len--) {
        _handleFuc[_len]?.()
    }

}

function traverseChildren(root, context) {
    const _chilren = root.children
    if(_chilren) {
        for (let i = 0; i < _chilren.length; i++) {
            const element = _chilren[i];
            traverseNode(element, context)
        }
    }

}

function createTransformContext(root, options) {
    const context = {
        root,
        nodeTransforms: options.nodeTransforms || [],
        helps: new Map(),
        help(key) {
            context.helps.set(key, 1)
        }
    }
    return context
}