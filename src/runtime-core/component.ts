import { PublicInstanceProxyHandlers } from "./componentPublicInstance"

export function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {}
    }

    return component
}

export function setupComponent(instance) {
    // todo
    // initProps()
    // initSlots()

    setupStatefulComponent(instance)
}

function setupStatefulComponent(instance: any) {
      const Component = instance.type

      //代理render中的属性加入setup返回值
      const _target = {
        _: instance
      }
      instance.proxy = new Proxy(_target, PublicInstanceProxyHandlers
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
        const setupResult = setup()

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