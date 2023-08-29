export function extend(a, b) {
     
    return Object.assign(a, b)
}

export function isObject(value) {
    return value !== null && typeof value === 'object' 
}

export function isChange(value, newValue) {
    return value !== newValue
}