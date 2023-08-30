export function extend(a, b) {
     
    return Object.assign(a, b)
}

export function isObject(value) {
    return value !== null && typeof value === 'object' 
}

export function isChange(value, newValue) {
    return value !== newValue
}


export function hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key)
}

export function camelize(str: string) {
    return str.replace(/-(\w)/g, (...args) => {
        console.log('args', args)
        return args[1] ? args[1].toLocaleUpperCase() : ""
    })
}

export function capitalize(str: string) {
    return str ? str.charAt(0).toLocaleUpperCase() + str.slice(1) : ''
}

export function toHandlerKey(str: string) {
    return str ? 'on' + capitalize(str) : ''
}