import { isObject } from "../reactivity/shared/index"
import { ShapeFlags } from "../shared/shapeFlags"
import { createComponentInstance, setupComponent } from "./component"
import { Fragment, Text } from "./vonde"

export function render(vnode, container) {
    // 调用patch
    patch(vnode, container, null)
}

function patch(vonde, container, parent) {
    // 处理组件，
    // 判断vnode是不是element还是component
    console.log('vnode', vonde)
    const {type} = vonde
    switch (type) {
        case Fragment:
            processFragment(vonde, container, parent)
            break;

        case Text:
            processTextNode(vonde, container, parent)
            break;
    
        default:
            if(ShapeFlags.STATEFUL_COMPONENT & vonde.shapeFlags) {
            // if(isObject(type)) {
                // 是对象就是component
                processComponent(vonde, container, parent)
            } else if(ShapeFlags.ELEMENT & vonde.shapeFlags) {
            // } else if(typeof type === 'string') {
                // 是字符串就是element
                processElemnet(vonde, container, parent)
            }
            break;
    }
}

function processFragment(vnode, container, parent) {
    children(vnode, container, parent)
}

function processTextNode(vonde, container, parent) {
    const { children } = vonde
    const _children = (vonde.el = document.createTextNode(children))
    container.append(_children)
}

function processElemnet(vonde, container, parent) {
    mountElement(vonde, container, parent)
}

function mountElement(vonde, container, parent) {
    const { type, children, props } = vonde
    const el = (vonde.el = document.createElement(type))
    const isOn = (key:string) => /^on[A-Z]/.test(key) 
    for (const key in props) {
        const _val = props[key]
        if(isOn(key)) {
            el.addEventListener(key.slice(2).toLocaleLowerCase(), _val)
        } else {
            el.setAttribute(key, _val)
        }
    }

    if(vonde.shapeFlags & ShapeFlags.ARRAY_CHILDREN) {
    // if(Array.isArray(children)) {
        children.forEach(child => {
            patch(child, el, parent)
        })
        // moutChildren(vnode, el)
    } else if(vonde.shapeFlags & ShapeFlags.TEXT_CHILDREN) {
    // } else if(typeof children === 'string') {
        el.textContent = children
    }
    container.append(el)
}

function children(vonde, container, parent) {
    vonde.children.forEach(child => {
        patch(child, container, parent)
    })
}

function processComponent(vnode, container, parent) {
    mountComponent(vnode, container, parent)
}

function mountComponent(initialVnode, container, parent) {
    const instance = createComponentInstance(initialVnode, parent)

    setupComponent(instance)

    setupRenderEffect(instance, initialVnode, container)
}

function setupRenderEffect(instance,initialVnode, container) {
    const { proxy } = instance
    const subTree = instance.render.call(proxy)
    // vnode  ---> patch
    // vnode  ---> element --> mountElemnt

    patch(subTree, container, instance)

    initialVnode.el = subTree.el
}