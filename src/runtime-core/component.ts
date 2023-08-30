import { shallowReadonly } from "../reactivity/reactive"
import { emit } from "./componentEmit"
import { initProps } from "./componentProps"
import { PublicInstanceProxyHandlers } from "./componentPublicInstance"

export function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        render: null,
        setupState: {},
        emit: () => {}
    }

    component.emit = emit.bind(null, component) as any

    return component
}

export function setupComponent(instance) {
    // todo
    initProps(instance, instance.vnode.props)
    // initSlots()

    setupStatefulComponent(instance)
}

function setupStatefulComponent(instance: any) {
      const Component = instance.type

      //代理render中的属性加入setup返回值
      instance.proxy = new Proxy({_: instance}, PublicInstanceProxyHandlers
        // {
        //     get(target, key) {
        //         const { setupState } = instance
        //         if(key in setupState) {
        //             return setupState[key]
        //         }
        //         if(key === '$el') {
        //             return instance.vnode.el
        //         }
        //     },
        // }
      )   

      const {setup} = Component

      if(setup) {
        const setupResult = setup(shallowReadonly(instance.props), { emit:instance.emit })

        handleSetupResult(instance, setupResult)
      }
}

function handleSetupResult(instance, setupResult) {
    // function Object
    // todo function
    if(typeof setupResult === 'object') {
        instance.setupState = setupResult
    }

    finishComponentSetup(instance)
}

function finishComponentSetup(instance) {
    const Component = instance.type
    instance.render = Component.render
}