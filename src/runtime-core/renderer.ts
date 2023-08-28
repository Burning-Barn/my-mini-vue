import { isObject } from "../reactivity/shared/index"
import { createComponentInstance, setupComponent } from "./component"

export function render(vnode, container) {
    // 调用patch
    patch(vnode, container)
}

function patch(vonde, container) {
    // 处理组件，
    // 判断vnode是不是element还是component
    console.log('vnode', vonde)
    const {type} = vonde
    if(isObject(type)) {
        // 是对象就是component
        processComponent(vonde, container)
    } else if(typeof type === 'string') {
        // 是字符串就是element
        processElemnet(vonde, container)
    }

}

function processElemnet(vonde, container) {
    mountElement(vonde, container)
}

function mountElement(vonde, container) {
    const { type, children, props } = vonde
    const el = (vonde.el = document.createElement(type))

    for (const key in props) {
        el.setAttribute(key, props[key])
    }

    if(Array.isArray(children)) {
        children.forEach(child => {
            patch(child, el)
        })
        // moutChildren(vnode, el)
    } else if(typeof children === 'string') {
        el.textContent = children
    }
    container.append(el)
}

function moutChildren(vonde, container) {
    vonde.children.forEach(child => {
        patch(child, container)
    })
}

function processComponent(vnode, container) {
    mountComponent(vnode, container)
}

function mountComponent(initialVnode, container) {
    const instance = createComponentInstance(initialVnode)

    setupComponent(instance)

    setupRenderEffect(instance, initialVnode, container)
}

function setupRenderEffect(instance,initialVnode, container) {
    const { proxy } = instance
    const subTree = instance.render.call(proxy)
    // vnode  ---> patch
    // vnode  ---> element --> mountElemnt

    patch(subTree, container)

    initialVnode.el = subTree.el
}