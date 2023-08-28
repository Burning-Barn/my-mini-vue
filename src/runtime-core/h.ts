import { createVnode } from "./vonde";

export function h(type, props?, children?) {
    return createVnode(type, props, children)
}