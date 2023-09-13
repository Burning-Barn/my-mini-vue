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
        patch(null, vnode, container, null)
    }
    
    // n1 上一次的vonde，旧的
    // n2 这次的vonde，新的
    function patch(n1, n2, container, parent) {
        // 处理组件，
        // 判断vnode是不是element还是component
        console.log('vnode', n2)
        const {type} = n2
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parent)
                break;
    
            case Text:
                processTextNode(n1, n2, container, parent)
                break;
        
            default:
                if(ShapeFlags.STATEFUL_COMPONENT & n2.shapeFlags) {
                // if(isObject(type)) {
                    // 是对象就是component
                    processComponent(n1, n2, container, parent)
                } else if(ShapeFlags.ELEMENT & n2.shapeFlags) {
                // } else if(typeof type === 'string') {
                    // 是字符串就是element
                    processElemnet(n1, n2, container, parent)
                }
                break;
        }
    }
    
    function processFragment(n1, n2, container, parent) {
        children(n2, container, parent)
    }
    
    function processTextNode(n1, n2, container, parent) {
        const { children } = n2
        const _children = (n2.el = document.createTextNode(children))
        container.append(_children)
    }
    
    function processElemnet(n1, n2, container, parent) {
        if(!n1) {
            mountElement(n2, container, parent)
        } else {
            patchElement(n1, n2, parent)
        }
    }

    function patchElement(n1, n2, parent) {
        console.log('n1', n1)
        console.log('n2', n2)

        const { props: prevProps } = n1 || {}
        const { props: nextProps } = n2 || {}

        const _el = (n2.el = n1.el)

        // patchChilren
        patchChilren(n1, n2, _el, parent)

        // patchProps
        patchProps(_el, prevProps, nextProps)
    }

    function patchChilren(n1, n2, el, parent) {
        debugger
        const { shapeFlags: preShapeFlags, children: preChilren } = n1
        const { shapeFlags, children } = n2
        if (shapeFlags & ShapeFlags.TEXT_CHILDREN) {
            // 新的是文本节点
            if (preShapeFlags & ShapeFlags.ARRAY_CHILDREN) {
                // Array --> text
                unmountChilren(preChilren)
                hostSetElementText(children, el)
            } else {
                // text --> text
                hostSetElementText(children, el)
            }
        } else {
            // 新的是数组节点
            if(preShapeFlags & ShapeFlags.TEXT_CHILDREN) {
                // text --> Array
                hostSetElementText('', el)
                children.forEach(child => {
                    patch(null, child, el, parent)
                })
            } else {
                // Array --> Array
            }

        }
    }

    function unmountChilren(childrens) {
        for (const child of childrens) {
            hostUnmountChilren(child.el)
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
    
    function mountElement(vonde, container, parent) {
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
                patch(null, child, el, parent)
            })
            // moutChildren(vnode, el)
        } else if(vonde.shapeFlags & ShapeFlags.TEXT_CHILDREN) {
        // } else if(typeof children === 'string') {
            el.textContent = children
        }

        // 4、insert
        // container.append(el)
        hostInsert(el, container)
    }
    
    function children(vonde, container, parent) {
        vonde.children.forEach(child => {
            patch(null, child, container, parent)
        })
    }
    
    function processComponent(n1, n2, container, parent) {
        mountComponent(n2, container, parent)
    }
    
    function mountComponent(initialVnode, container, parent) {
        const instance = createComponentInstance(initialVnode, parent)
    
        setupComponent(instance)
    
        setupRenderEffect(instance, initialVnode, container)
    }
    
    function setupRenderEffect(instance,initialVnode, container) {

        effect(() => {   
            if(!instance.isMounted) {
                console.log('init')
                const { proxy } = instance
                const subTree = (instance.subTree = instance.render.call(proxy))

                patch(null, subTree, container, instance)

                instance.isMounted = true
                initialVnode.el = subTree.el
            } else {
                console.log('update')
                const { proxy, subTree: prevSubTree } = instance
                const subTree = instance.render.call(proxy)

                console.log('prevSubTree', prevSubTree)
                console.log('subTree', subTree)
                instance.subTree = subTree
                patch(prevSubTree, subTree, container, instance)
            } 
        })
    }

    return {
        createApp: createAppApi(render)
    }
}
