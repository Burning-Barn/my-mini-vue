export function emit(instance, event, ...args) {
    // tpp思想
    // 先实现特定  ---》 再扩展为通用

    // 特定，只实现当前onAdd
    // instance.props['onAdd'] && instance.props['onAdd']()

    // 扩展
    // on-add-foo  ==> onAddFoo
    function camelize(str: string) {
        return str.replace(/-(\w)/g, (...args) => {
            console.log('args', args)
            return args[1] ? args[1].toLocaleUpperCase() : ""
        })
    }

    function capitalize(str: string) {
        return str ? str.charAt(0).toLocaleUpperCase() + str.slice(1) : ''
    }

    function toHandlerKey(str: string) {
        return str ? 'on' + capitalize(str) : ''
    }

    const _eventName = toHandlerKey(camelize(event))
    const _handler = instance.props[_eventName]
    
    _handler && _handler(...args)

}