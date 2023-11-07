import { baseParse } from "./parse";
import { generate } from "./codegen";
import { transformExpression } from "./transforms/transformExpression";
import { transformElement } from "./transforms/transformElement";
import { transformText } from "./transforms/transformText";
import { transform } from "./transform";

export function baseCompile(template: string) {
    const ast: any = baseParse(template)
    transform(ast, {
        nodeTransforms: [transformExpression, transformElement, transformText],
    })

    const { code } = generate(ast)
    return code
}
    
    