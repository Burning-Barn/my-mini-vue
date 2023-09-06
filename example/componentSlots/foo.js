import { h } from '../../lib/my-mini-vue.esm.js'
import { renderSlots } from '../../lib/my-mini-vue.esm.js'

export const Foo = {
    render() {
        const foo = h('div', {}, 'foo')

        // 1插槽传入h函数
        // 2插槽传入h函数
        // return h(
        //     'div',
        //     {},
        //     [foo, renderSlots(this.$slots)]
        // )
        
        // 3具名插槽     
        // return h(
        //     'div',
        //     {},
        //     [renderSlots(this.$slots, 'header'),foo, renderSlots(this.$slots, 'footer')]
        // )

        // 4作用域插槽 
        const age = 28
        return h(
            'div',
            {},
            [renderSlots(this.$slots, 'header', {age}), foo, renderSlots(this.$slots, 'footer')]
        )
    },
    setup(props, {emit}) {
        return {  }
    }
}