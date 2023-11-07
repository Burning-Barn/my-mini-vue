import { NodeTypes } from "../ast";
import { isText } from "../until";


// 处理文本节点 用 + 号连接
export function transformText(node, context) {
    const { children } = node
    
    return () => {
        if(node.type === NodeTypes.ELEMENT) {
            let _currentContainer
    
            for (let i = 0; i < children.length; i++) {
                const _child = children[i];
                if(isText(_child)) {
                    for (let j = i+1; j < children.length; j++) {
                        const nextChild = children[j];
                        if(isText(nextChild)) {
                            if(!_currentContainer) {
                                _currentContainer = children[i] = {
                                    type: NodeTypes.COMPOUND_EXPRESSION,
                                    children: [_child]
                                }
                            } 
                            _currentContainer.children.push('+')
                            _currentContainer.children.push(nextChild)
                            children.splice(j, 1)
                            j-=1
                            
                        } else {
                            _currentContainer = null
                            break
                        }
                    }
                } 
            }
    
            console.log('!!!node.type === NodeTypes.ELEMENT', node)
            console.log('!!!node.type === NodeTypes.ELEMENT', children)
    
    
        }

    }

}