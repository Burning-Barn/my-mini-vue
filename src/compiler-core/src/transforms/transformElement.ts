import { NodeTypes } from "../ast"
import { CREATE_ELEMENT_VNODE } from "../runtimeHelpers"

export function transformElement(node, context) {
    return () => {
        console.log('??ndoe', node)
        console.log('context', context)
        if(node.type === NodeTypes.ELEMENT) {
            context.help(CREATE_ELEMENT_VNODE)
    
            // 以下这些只是为了，codegen里只拼数据不写逻辑，把element节点chilren[0]提取出来，封装在这里，在codegen里直接用，
            // genElement函数   === 》     // const _child = children[0]
                                          // getNode(_child, context)
            const vNodeTag = node.tag
    
            let vNodeProps
    
            const vNodeChilren = node.children[0]
    
            const vNodeElement = {
                type: NodeTypes.ELEMENT,
                tag: vNodeTag,
                props: vNodeProps,
                children: vNodeChilren
            }
    
            node.codegenNode = vNodeElement
        }
    }
    
}