import { createRenderer } from "../runtime-core/renderer"

export function createElement(type) {
    return document.createElement(type)
}

export function patchProps(el, key, val) {
    const isOn = (key:string) => /^on[A-Z]/.test(key) 
    if(isOn(key)) {
        el.addEventListener(key.slice(2).toLocaleLowerCase(), val)
    } else {
        el.setAttribute(key, val)
    }
}

export function insert(el, parent) {
    parent.append(el)
}

export const _render = createRenderer({createElement, patchProps, insert})