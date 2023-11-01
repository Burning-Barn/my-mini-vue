export function transform(root, options={}) {
    const _context = createTransformContext(root, options)
    // 树结构遍历，1、深度优先搜索，---》递归   2、广度优先搜索
    traverseNode(root, _context)

    root.codegenNode = root.children[0]
}

function traverseNode(root, context) {
    console.log('root', root)

    // 插件体系
    const _nodeTransforms = context.nodeTransforms
    if(_nodeTransforms) {
        for (let i = 0; i < _nodeTransforms.length; i++) {
            const _nodeTransform = _nodeTransforms[i];
            _nodeTransform(root) 
        }
    }

    // 变动点与稳定点分离，将稳定点分离成单独函数，保证可测试性。
    traverseChildren(root, context)
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
    return {
        root,
        nodeTransforms: options.nodeTransforms || []
    }
}