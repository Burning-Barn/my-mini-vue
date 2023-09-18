import { createRenderer } from "../runtime-core/renderer"

export function createElement(type) {
    return document.createElement(type)
}

export function patchProps(el, key, preVal, val) {
    const isOn = (key:string) => /^on[A-Z]/.test(key) 
    if(isOn(key)) {
        el.addEventListener(key.slice(2).toLocaleLowerCase(), val)
    } else {
        if(val === null || val === undefined) {
            el.removeAttribute(key)
        } else {
            el.setAttribute(key, val)
        }
    }
}

export function insert(el, parent, anchor) {
    // parent.append(el)
    parent.insertBefore(el, anchor || null)
}

export function unmountChilren(children) {
    if(children.parentNode) {
        children.parentNode.removeChild(children)
    }
}

export function setElementText(text, container) {
    container.textContent = text
}

export const renderer: any = createRenderer({createElement, patchProps, insert, unmountChilren, setElementText})

export function createApp(...args) {
    return renderer.createApp(...args)
}

export * from '../runtime-core/index'
