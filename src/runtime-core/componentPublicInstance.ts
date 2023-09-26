import { hasOwn } from "../shared/index"

const publicPropertiesMap = {
  '$el': (i) => i.vnode.el,
  "$slots": (i) => i.slots,
  "$props": (i) => i.props,
}

export const PublicInstanceProxyHandlers = {
  // get(target, key) {
  get({ _:instance }, key) {
      const { setupState, props } = instance

      if(hasOwn(setupState, key)) {
        return setupState[key]
      } else if(hasOwn(props, key)) {
        return props[key]
      }
      // if(key in setupState) {
      //     return setupState[key]
      // }

      // if(key === '$el') {
      //     return instance.vnode.el
      // }
      const publicGetter = publicPropertiesMap[key]
      if(publicGetter) {
        return publicGetter(instance)
      }
  },
}
