import { TreesRepository } from './trees.repository';
import { AuditService } from '../audit/audit.service';
import { AppError } from '../../core/errors';

export class TreesService {
  static async createTree(name: string, userId: string, userEmail: string, userName: string) {
    const tree = await TreesRepository.create(name, userId, userEmail, userName);
    
    await AuditService.log(
      tree.id,
      userId,
      'tree_created',
      'FamilyTree',
      tree.id,
      { name }
    );

    return tree;
  }

  static async getUserTrees(userId: string) {
    return TreesRepository.findByUserId(userId);
  }

  static async getTreeDetails(treeId: string) {
    const tree = await TreesRepository.findById(treeId);
    if (!tree) throw new AppError('Tree not found', 404);
    return tree;
  }

  static async getVisualData(treeId: string) {
    return TreesRepository.getVisualData(treeId);
  }

  static async getMembers(treeId: string) {
    return TreesRepository.getMembers(treeId);
  }
}
