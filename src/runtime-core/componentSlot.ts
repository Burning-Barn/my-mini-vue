import { ShapeFlags } from "../shared/shapeFlags"

export function initSlots(instance, children) {
    const { vnode } = instance
    // 初始，h函数插槽
    // instance.slots = Array.isArray(children) ? children : [children]

    // 优化前--具名插槽
    // let slots = {}
    // for (const name in children) {
    //     slots[name] = Array.isArray(children[name]) ? children[name] : [children[name]]
    // }
    // instance.slots = slots

    // 优化前--作用域插槽（完成）
    // let slots = {}
    // for (const name in children) {
    //     slots[name] = (props) => Array.isArray(children[name](props)) ? children[name](props) : [children[name](props)]
    // }
    // instance.slots = slots

    // 优化
    if(vnode.shapeFlags & ShapeFlags.SLOT) {
        normalizeObjectSlots(children, instance.slots)
    }
}

function normalizeObjectSlots(children: any, slots: any) {
    for (const name in children) {
        slots[name] = (props) => normalizeSloteValue(children[name](props))
    }
}

function normalizeSloteValue(value) {
    return  Array.isArray(value) ? value : [value]
}