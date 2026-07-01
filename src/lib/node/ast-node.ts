import {
  NodeSet,
} from './node-set.ts';
import type {
  INodeSet,
} from './types.ts';

export type ASTNodeConfig = Omit<INodeSet,
  | `nodes`
  | `type`
>;

export class ASTNode extends NodeSet {
  static new(config: ASTNodeConfig = {}) {
    return new ASTNode({
      ...config,
      type: `ast` as INodeSet[`type`],
    });
  }
}
