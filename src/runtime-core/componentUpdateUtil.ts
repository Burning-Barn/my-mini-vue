export function shouldComponentUpdate(n1, n2) {
    for (const key in n1) {
        if(n2[key] !== n1[key]) {
            return true
        }
    }
    return false
}