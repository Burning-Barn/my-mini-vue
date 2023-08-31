import { createVnode } from "../vonde";

export function renderSlots(slot, name, val) {
    // return createVnode('div', {}, slot)
    const _slot = slot[name]
    if(_slot) {
        return createVnode('div', {}, _slot)
    }
    // if(_slot && typeof _slot === 'function') {
    //     return createVnode('div', {}, _slot(val))
    // }
}