import { isObject } from "../shared/index"
import { ShapeFlags } from "../shared/shapeFlags"

export function createVnode(type, props?, children?) {
    const _vnode = {
        type,
        props,
        children,
        shapeFlags: getShapeFlags(type),
        el: null
    }

    if(typeof children === 'string') {
        // 用位运算 | 设置值，& 读取值
        // | 对比 都是0才为0
        // & 对比 都是1才为1
        _vnode.shapeFlags = ShapeFlags.TEXT_CHILDREN | _vnode.shapeFlags
    } else if(Array.isArray(children)) {
        _vnode.shapeFlags = ShapeFlags.ARRAY_CHILDREN | _vnode.shapeFlags
    }
 
    return _vnode
}

function getShapeFlags(type): any {
    if(typeof type === 'string') {
        return ShapeFlags.ELEMENT
    } else if(isObject(type)) {
        return ShapeFlags.STATEFUL_COMPONENT
    }
}