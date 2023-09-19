import { effect } from "../reactivity"
import { isObject } from "../reactivity/shared/index"
import { ShapeFlags } from "../shared/shapeFlags"
import { createComponentInstance, setupComponent } from "./component"
import { createAppApi } from "./createApp"
import { Fragment, Text } from "./vonde"

export function createRenderer(option) {
    const {
        createElement: hostCreateElement,
        patchProps: hostPatchProps,
        insert: hostInsert,
        unmountChilren: hostUnmountChilren,
        setElementText: hostSetElementText,
    } = option

    function render(vnode, container) {
        // 调用patch
        patch(null, vnode, container, null, null)
    }
    
    // n1 上一次的vonde，旧的
    // n2 这次的vonde，新的
    function patch(n1, n2, container, parent, anchor) {
        // 处理组件，
        // 判断vnode是不是element还是component
        console.log('vnode', n2)
        const {type} = n2
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parent, anchor)
                break;
    
            case Text:
                processTextNode(n1, n2, container, parent)
                break;
        
            default:
                if(ShapeFlags.STATEFUL_COMPONENT & n2.shapeFlags) {
                // if(isObject(type)) {
                    // 是对象就是component
                    processComponent(n1, n2, container, parent, anchor)
                } else if(ShapeFlags.ELEMENT & n2.shapeFlags) {
                // } else if(typeof type === 'string') {
                    // 是字符串就是element
                    processElemnet(n1, n2, container, parent, anchor)
                }
                break;
        }
    }
    
    function processFragment(n1, n2, container, parent, anchor) {
        children(n2, container, parent, anchor)
    }
    
    function processTextNode(n1, n2, container, parent) {
        const { children } = n2
        const _children = (n2.el = document.createTextNode(children))
        container.append(_children)
    }
    
    function processElemnet(n1, n2, container, parent, anchor) {
        if(!n1) {
            mountElement(n2, container, parent, anchor)
        } else {
            patchElement(n1, n2, container, parent, anchor)
        }
    }

    function patchElement(n1, n2, container, parent, anchor) {
        console.log('n1', n1)
        console.log('n2', n2)

        const { props: prevProps } = n1 || {}
        const { props: nextProps } = n2 || {}

        const _el = (n2.el = n1.el)

        // patchChilren
        patchChilren(n1, n2, _el, parent, anchor)

        // patchProps
        patchProps(_el, prevProps, nextProps)
    }

    function unmountChilren(childrens) {
        for (const child of childrens) {
            hostUnmountChilren(child.el)
        }
    }

    function patchChilren(n1, n2, container, parent, anchor) {
        // debugger
        const { shapeFlags: preShapeFlags, children: preChildren } = n1
        const { shapeFlags, children } = n2
        if (shapeFlags & ShapeFlags.TEXT_CHILDREN) {
            // 新的是文本节点
            if (preShapeFlags & ShapeFlags.ARRAY_CHILDREN) {
                // Array --> text
                unmountChilren(preChildren)
                hostSetElementText(children, container)
            } else {
                // text --> text
                hostSetElementText(children, container)
            }
        } else {
            // 新的是数组节点
            if(preShapeFlags & ShapeFlags.TEXT_CHILDREN) {
                // text --> Array
                hostSetElementText('', container)
                children.forEach(child => {
                    patch(null, child, container, parent, anchor)
                })
            } else {
                // Array --> Array
                patchKeyedChild(preChildren, children, container, parent, anchor)
            }

        }
    }

    function patchKeyedChild(preChildren, children, container, parent, parentAnchor) {
        let i = 0
        let e1 = preChildren.length - 1
        let e2 = children.length - 1

        function compareVnode(v1, v2):boolean {
            return v1.type === v2.type && v1.key === v2.key
        }
        debugger
        // 1、左侧对比
        // (a b) c
        // (a b) d e
        while(i <= e1 && i <= e2) {
            if(compareVnode(preChildren[i], children[i])) {
                
                patch(preChildren[i], children[i], container, parent, parentAnchor)
            } else {
                break
            }
            i+=1
        }

        // 2、右侧对比
        // a (b c)
        // d e (b c)
        while(i <= e1 && i <= e2) {
            if(compareVnode(preChildren[e1], children[e2])) {
                patch(preChildren[e1], children[e2], container, parent, parentAnchor)
            } else {
                break
            }
            e1-=1
            e2-=1
        }


        if(i > e1) {
            // 3、新增  i > e1
            if(i <= e2) {
                // 1）左侧对比，右侧新增
                    // (a b)         e1
                    // (a b) c       e2
                    //  -----------------------------------   i=2 e1=1 e2=2
                    // (a b)
                    // (a b) c d
                    //  -----------------------------------   i=2 e1=1 e2=3
                // 2）右侧对比，左侧新增
                    //   (a b)
                    // c (a b)
                    // -----------------------------------   i=0 e1=-1 e2=0
                    //     (a b)
                    // d c (a b)
                    // -----------------------------------   i=0 e1=-1 e2=1
                const nextPos = e2 + 1
                const anchor = nextPos < children.length ? children[nextPos].el : null
                while(i <= e2) {
                    patch(null, children[i], container, parent, anchor)
                    i+=1
                }
            }
        } else if (i > e2) {
            // 4、删除 i > e2
                // 1）左侧对比，右侧删除
                    // (a b) c
                    // (a b)
                    // -----------------------------------   i=2 e1=2 e2=1
                    // (a b) c d
                    // (a b)
                    // -----------------------------------   i=2 e1=3 e2=1  
                // 2）右侧对比，左侧删除
                    // a (b c)
                    //   (b c)
                    // -----------------------------------   i=0 e1=0 e2=-1
                    // d a (b c)
                    //     (b c)
                    // -----------------------------------   i=0 e1=1 e2=-1
            while(i <= e1) {
                const _children = preChildren[i]
                hostUnmountChilren(_children.el)
                i+=1
            }
        } else {
            // 中间部分
            // vue key的使用：
            // 在diff对比时，需要遍历老节点，看每个老节点在nextVNode中是否存在，如果有key，可以直接遍历新节点做映射，在老节点中查找直接映射，为O(n)
            // 但是，如果没有key值，每个老节点都要遍历一遍nextVnode为 O(n),
            // 使用key,可以降低复杂度

            // a,b,(c,d),f,g
            // a,b,(e,c),f,g

            // a,b,(c,e,d),f,g
            // a,b,(e,c),f,g
            const _preMiddleStart = e1 - i 
            const _nextMiddleStart = e2 - i 

            const _keyToNewIndexMap = new Map()

            // 优化 引入变量，解决
            // a,b,(c,e,d),f,g
            // a,b,(e,c),f,g
            // 当c,e,对比patch完成后，patch数量大于等于新节点middle中间值时，剩下的都是要删除的节点，直接删除，优化性能
            let _patched = 0
            let _middleCount = _nextMiddleStart + 1
            
            for (let n = i; n <= e2; n++) {
                _keyToNewIndexMap.set(children[n].key, n)
            }
            
            for (let p = i; p <= e1; p++) {
                if(_patched >= _middleCount) {
                    hostUnmountChilren(preChildren[p].el)
                    continue
                }

                const _preC = preChildren[p];
                let _newIndex
                if(_preC.key !== null) {
                    _newIndex = _keyToNewIndexMap.get(_preC.key)
                } else {
                    for (let j = i; j < e2; j++) {
                        if(compareVnode(children[j], _preC)) {
                            _newIndex = j
                            break
                        }
                    }
                }

                if(_newIndex === undefined) {
                    hostUnmountChilren(_preC.el)
                } else {
                    patch(_preC, children[_newIndex], container, parent, null)
                    _patched+=1
                }
            }

        }
    }

    function patchProps(el, prevProps, nextProps) {
        if(prevProps === nextProps) return

        // 1、props 值变了（就包括了增加新值的情况，因为新值为undefind）
        // 2、props 值变为undefind null，在hostPatchProps处理删除
        for (const key in nextProps) {
            const _nextVal = nextProps[key]
            const _prevVal = prevProps[key]
            if(_nextVal !== _prevVal) {
                hostPatchProps(el, key, _prevVal, _nextVal)
            }
        }

        // 3、props 值没有了
        for (const key in prevProps) {
            if(!(key in nextProps)) {
                hostPatchProps(el, key, prevProps[key], null)
            }
        }

    }
    
    function mountElement(vonde, container, parent, anchor) {
        const { type, children, props } = vonde
        // 1、createElement
        // const el = (vonde.el = document.createElement(type))
        const el = (vonde.el = hostCreateElement(type))

        // 2、patchProps
        // const isOn = (key:string) => /^on[A-Z]/.test(key) 
        // for (const key in props) {
        //     const _val = props[key]
        //     if(isOn(key)) {
        //         el.addEventListener(key.slice(2).toLocaleLowerCase(), _val)
        //     } else {
        //         el.setAttribute(key, _val)
        //     }
        // }
        for (const key in props) {
            const _val = props[key]
            hostPatchProps(el, key, null, _val)
        }
    
        // 3、handle children
        if(vonde.shapeFlags & ShapeFlags.ARRAY_CHILDREN) {
        // if(Array.isArray(children)) {
            children.forEach(child => {
                patch(null, child, el, parent, anchor)
            })
            // moutChildren(vnode, el)
        } else if(vonde.shapeFlags & ShapeFlags.TEXT_CHILDREN) {
        // } else if(typeof children === 'string') {
            el.textContent = children
        }

        // 4、insert
        // container.append(el)
        hostInsert(el, container, anchor)
    }
    
    function children(vonde, container, parent, anchor) {
        vonde.children.forEach(child => {
            patch(null, child, container, parent, anchor)
        })
    }
    
    function processComponent(n1, n2, container, parent, anchor) {
        mountComponent(n2, container, parent, anchor)
    }
    
    function mountComponent(initialVnode, container, parent, anchor) {
        const instance = createComponentInstance(initialVnode, parent)
    
        setupComponent(instance)
    
        setupRenderEffect(instance, initialVnode, container, anchor)
    }
    
    function setupRenderEffect(instance,initialVnode, container, anchor) {

        effect(() => {   
            if(!instance.isMounted) {
                console.log('init')
                const { proxy } = instance
                const subTree = (instance.subTree = instance.render.call(proxy))

                patch(null, subTree, container, instance, anchor)

                instance.isMounted = true
                initialVnode.el = subTree.el
            } else {
                console.log('update')
                const { proxy, subTree: prevSubTree } = instance
                const subTree = instance.render.call(proxy)

                console.log('prevSubTree', prevSubTree)
                console.log('subTree', subTree)
                instance.subTree = subTree
                patch(prevSubTree, subTree, container, instance, anchor)
            } 
        })
    }

    return {
        createApp: createAppApi(render)
    }
}
