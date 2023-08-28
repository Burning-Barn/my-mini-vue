export function createVnode(type, props?, children?) {
    const _vnode = {
        type,
        props,
        children,
    }

    return _vnode
}