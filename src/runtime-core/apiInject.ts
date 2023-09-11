import { getCurrentInstance } from "./component";

export function provide(key, value) {
    const _currentInstance: any = getCurrentInstance()
    if(_currentInstance) {
        let { provider } = _currentInstance
        const { provider: parentProvider } = _currentInstance.parent

        // init 当子组件第一次调用provide时初始化provider，当多次调用不触发，防止把已经设置值的provide再次清空为空对象
        if(provider === parentProvider) {
            provider = _currentInstance.provider = Object.create(parentProvider)
        }

        provider[key] = value
    }
}

export function inject(key, defaultVal) {
    const _currentInstance: any = getCurrentInstance()
    if(_currentInstance) {
        const { parent } = _currentInstance
        const { provider: parentProvider } = _currentInstance.parent

        if(key in parentProvider) {
            return parent.provider[key]
        } else if(defaultVal) {
            if(typeof defaultVal === 'function') {
                return defaultVal()
            }
            return defaultVal
        }

        
    }
    
}