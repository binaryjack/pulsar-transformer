/**
 * IR Visitor Utility
 *
 * Provides tree walking capabilities for IR transformation.
 */

import type { IIRNode } from '../analyzer/ir/ir-node-types.js';
import { IRNodeType } from '../analyzer/ir/ir-node-types.js';

/**
 * Visitor function type
 */
export type VisitorFunction = (node: IIRNode, parent: IIRNode | null) => IIRNode | null;

/**
 * Visitor map for different node types
 */
export interface IVisitorMap {
  [IRNodeType.CALL_EXPRESSION_IR]?: VisitorFunction;
  [IRNodeType.VARIABLE_DECLARATION_IR]?: VisitorFunction;
  [IRNodeType.COMPONENT_IR]?: VisitorFunction;
  [IRNodeType.ELEMENT_IR]?: VisitorFunction;
  [IRNodeType.ARROW_FUNCTION_IR]?: VisitorFunction;
  [IRNodeType.BINARY_EXPRESSION_IR]?: VisitorFunction;
  [IRNodeType.UNARY_EXPRESSION_IR]?: VisitorFunction;
  [IRNodeType.MEMBER_EXPRESSION_IR]?: VisitorFunction;
  [IRNodeType.CONDITIONAL_EXPRESSION_IR]?: VisitorFunction;
  [IRNodeType.IF_STATEMENT_IR]?: VisitorFunction;
  [IRNodeType.RETURN_STATEMENT_IR]?: VisitorFunction;
  [IRNodeType.IDENTIFIER_IR]?: VisitorFunction;
  [IRNodeType.LITERAL_IR]?: VisitorFunction;
}

/**
 * Visit IR tree with visitors
 */
export function visitIRNode(
  node: IIRNode | null,
  visitors: IVisitorMap,
  parent: IIRNode | null = null
): IIRNode | null {
  if (!node) return null;

  // Visit current node
  const visitor = visitors[node.type as keyof IVisitorMap];
  let transformedNode = node;

  if (visitor) {
    const result = visitor(node, parent);
    if (result === null) return null;
    transformedNode = result;
  }

  // Visit children based on node type
  transformedNode = visitChildren(transformedNode, visitors);

  return transformedNode;
}

/**
 * Visit children of a node
 */
function visitChildren(node: IIRNode, visitors: IVisitorMap): IIRNode {
  const newNode = { ...node };

  switch (node.type) {
    case IRNodeType.PROGRAM_IR: {
      const program = newNode as any;
      // ProgramIR uses 'children' property, not 'body'
      if (program.children && Array.isArray(program.children)) {
        program.children = program.children
          .map((child: IIRNode) => visitIRNode(child, visitors, node))
          .filter((child: IIRNode | null) => child !== null);
      }
      // Also handle 'body' for backwards compatibility
      if (program.body && Array.isArray(program.body)) {
        program.body = program.body
          .map((child: IIRNode) => visitIRNode(child, visitors, node))
          .filter((child: IIRNode | null) => child !== null);
      }
      break;
    }

    case IRNodeType.COMPONENT_IR: {
      const component = newNode as any;
      if (component.body && Array.isArray(component.body)) {
        component.body = component.body
          .map((child: IIRNode) => visitIRNode(child, visitors, node))
          .filter((child: IIRNode | null) => child !== null);
      }
      if (component.returnExpression) {
        component.returnExpression = visitIRNode(component.returnExpression, visitors, node);
      }
      break;
    }

    case IRNodeType.ELEMENT_IR: {
      const element = newNode as any;
      if (element.children && Array.isArray(element.children)) {
        element.children = element.children
          .map((child: IIRNode) => visitIRNode(child, visitors, node))
          .filter((child: IIRNode | null) => child !== null);
      }
      if (element.attributes && Array.isArray(element.attributes)) {
        element.attributes = element.attributes.map((attr: any) => {
          if (attr.value) {
            return { ...attr, value: visitIRNode(attr.value, visitors, node) };
          }
          return attr;
        });
      }
      break;
    }

    case IRNodeType.CALL_EXPRESSION_IR: {
      const call = newNode as any;
      if (call.callee) {
        call.callee = visitIRNode(call.callee, visitors, node);
      }
      if (call.arguments && Array.isArray(call.arguments)) {
        call.arguments = call.arguments
          .map((arg: IIRNode) => visitIRNode(arg, visitors, node))
          .filter((arg: IIRNode | null) => arg !== null);
      }
      break;
    }

    case IRNodeType.VARIABLE_DECLARATION_IR: {
      const varDecl = newNode as any;
      if (varDecl.initializer) {
        varDecl.initializer = visitIRNode(varDecl.initializer, visitors, node);
      }
      break;
    }

    case IRNodeType.ARROW_FUNCTION_IR: {
      const arrowFn = newNode as any;
      if (Array.isArray(arrowFn.body)) {
        arrowFn.body = arrowFn.body
          .map((stmt: IIRNode) => visitIRNode(stmt, visitors, node))
          .filter((stmt: IIRNode | null) => stmt !== null);
      } else if (arrowFn.body) {
        arrowFn.body = visitIRNode(arrowFn.body, visitors, node);
      }
      break;
    }

    case IRNodeType.BINARY_EXPRESSION_IR: {
      const binary = newNode as any;
      if (binary.left) {
        binary.left = visitIRNode(binary.left, visitors, node);
      }
      if (binary.right) {
        binary.right = visitIRNode(binary.right, visitors, node);
      }
      break;
    }

    case IRNodeType.UNARY_EXPRESSION_IR: {
      const unary = newNode as any;
      if (unary.argument) {
        unary.argument = visitIRNode(unary.argument, visitors, node);
      }
      break;
    }

    case IRNodeType.MEMBER_EXPRESSION_IR: {
      const member = newNode as any;
      if (member.object) {
        member.object = visitIRNode(member.object, visitors, node);
      }
      if (member.property) {
        member.property = visitIRNode(member.property, visitors, node);
      }
      break;
    }

    case IRNodeType.CONDITIONAL_EXPRESSION_IR: {
      const conditional = newNode as any;
      if (conditional.test) {
        conditional.test = visitIRNode(conditional.test, visitors, node);
      }
      if (conditional.consequent) {
        conditional.consequent = visitIRNode(conditional.consequent, visitors, node);
      }
      if (conditional.alternate) {
        conditional.alternate = visitIRNode(conditional.alternate, visitors, node);
      }
      break;
    }

    case IRNodeType.IF_STATEMENT_IR: {
      const ifStmt = newNode as any;
      if (ifStmt.test) {
        ifStmt.test = visitIRNode(ifStmt.test, visitors, node);
      }
      if (Array.isArray(ifStmt.consequent)) {
        ifStmt.consequent = ifStmt.consequent
          .map((stmt: IIRNode) => visitIRNode(stmt, visitors, node))
          .filter((stmt: IIRNode | null) => stmt !== null);
      } else if (ifStmt.consequent) {
        ifStmt.consequent = visitIRNode(ifStmt.consequent, visitors, node);
      }
      if (Array.isArray(ifStmt.alternate)) {
        ifStmt.alternate = ifStmt.alternate
          .map((stmt: IIRNode) => visitIRNode(stmt, visitors, node))
          .filter((stmt: IIRNode | null) => stmt !== null);
      } else if (ifStmt.alternate) {
        ifStmt.alternate = visitIRNode(ifStmt.alternate, visitors, node);
      }
      break;
    }

    case IRNodeType.RETURN_STATEMENT_IR: {
      const returnStmt = newNode as any;
      if (returnStmt.argument) {
        returnStmt.argument = visitIRNode(returnStmt.argument, visitors, node);
      }
      break;
    }

    case IRNodeType.COMPONENT_CALL_IR: {
      const compCall = newNode as any;
      if (compCall.children && Array.isArray(compCall.children)) {
        compCall.children = compCall.children
          .map((child: IIRNode) => visitIRNode(child, visitors, node))
          .filter((child: IIRNode | null) => child !== null);
      }
      if (compCall.attributes && Array.isArray(compCall.attributes)) {
        compCall.attributes = compCall.attributes.map((attr: any) => {
          if (attr.value) {
            return { ...attr, value: visitIRNode(attr.value, visitors, node) };
          }
          return attr;
        });
      }
      break;
    }

    // Leaf nodes (no children to visit)
    case IRNodeType.IDENTIFIER_IR:
    case IRNodeType.LITERAL_IR:
      break;
  }

  return newNode;
}
