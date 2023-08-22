import { trigger, track } from "./effect"
import { createGetter, createSetter, mutableHandlers, readonlyHandlers, shallowReadonlyHandlers } from './baseHandler'

export const enum reactiveFlags {
    IS_REACTIVE = '__v_isReactive',
    IS_READONLY = '__v_isReadonly'
}

function createActiveObject(raw, baseHandler) {
    return new Proxy(raw, baseHandler)
}

export function reactive(raw) {
    // const proxy = new Proxy(raw, mutableHandlers())
    // return proxy
    return createActiveObject(raw, mutableHandlers())

}

export function readonly(raw) {
    // const proxy = new Proxy(raw, readonlyHandlers())
    // return proxy
    return createActiveObject(raw, readonlyHandlers())
}

export function shallowReadonly(raw) {
    return createActiveObject(raw, shallowReadonlyHandlers())
}

export function isReactive(raw) {
    // !!当传入的值为非代理对象时，没有reactiveFlags.IS_REACTIVE属性，导致undefind报错，使用！！转换为Boolean
    return !!raw[reactiveFlags.IS_REACTIVE]
}

export function isReadonly(raw) {
    // !!当传入的值为非代理对象时，没有reactiveFlags.IS_REACTIVE属性，导致undefind报错，使用！！转换为Boolean
    return !!raw[reactiveFlags.IS_READONLY]
}

export function isProxy(value) {
    return isReactive(value) || isReadonly(value)
}


