import { Fragment, createVnode } from "../vonde";

export function renderSlots(slot, name, props) {
    const _slot = slot[name]
    if(_slot) {
        if(typeof _slot === 'function') {
            return createVnode(Fragment, {}, _slot(props))
        }
    }
}