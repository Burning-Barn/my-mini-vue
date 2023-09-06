import {h, createTextNode} from '../../lib/my-mini-vue.esm.js'
import { Foo } from './foo.js'
export const App = {
    render() {
        const app = h('div', {}, 'App')
        // 插槽传入h函数
        // const foo = h(Foo, {}, h('div', {}, '我是插槽'))
        // 插槽传入数组
        // const foo = h(Foo, {}, [h('div', {}, '我是插槽1'), h('div', {}, '我是插槽2')])
        // 具名插槽
        // const foo = h(
        //     Foo, 
        //     {}, 
        //     {header:h('div', {}, '我是插槽1-header'), 
        //     footer: h('div', {}, '我是插槽2-footer'),}
        // )

        // 作用域插槽
        // const foo = h( 
        //     Foo, 
        //     {}, 
        //     {
        //         header:({age}) => h('div', {}, '我是插槽1-header' + age), 
        //         footer: () => h('div', {}, '我是插槽2-footer'),
        //     }
        // )

        // 作用域插槽 fragment textnode
        const foo = h( 
            Foo, 
            {}, 
            {
                header:({age}) => [
                    h('div', {}, '我是插槽1-header' + age), 
                    createTextNode('hello world')
                ], 
                footer: () => h('div', {}, '我是插槽2-footer'),
            }
        )

        return h(
            'div',
            {},
            [app, foo]
            )
    },
    setup() {
        return {}
    }
}