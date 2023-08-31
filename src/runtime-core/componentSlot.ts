export function initSlots(instance, children) {
    // instance.slots = Array.isArray(children) ? children : [children]

    let slots = {}
    for (const name in children) {
        slots[name] = Array.isArray(children[name]) ? children[name] : [children[name]]
    }
    instance.slots = slots

    // 优化
    // normalizeObjectSlots(children, instance.slots)
}

function normalizeObjectSlots(children: any, slots: any) {
    for (const name in children) {
        slots[name] = normalizeSloteValue(children[name])
    }
}

function normalizeSloteValue(value) {
    return  Array.isArray(value) ? value : [value]
}