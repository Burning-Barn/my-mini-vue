import { NodeTypes } from "../ast";

export function transformExpression(node) {
  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      // _ctx.${node.content}
      node.content.content = `_ctx.${node.content.content}`
      // node.content = processExpression(node.content)
      break;
  
    default:
      break;
  }
}

function processExpression(node) {
  node.content = `_ctx.${node.content}`
  return node
}

