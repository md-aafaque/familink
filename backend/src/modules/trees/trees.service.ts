import { TreesRepository } from './trees.repository';
import { AuditService } from '../audit/audit.service';
import { AppError } from '../../core/errors';

export class TreesService {
  static async createTree(name: string, userId: string, userEmail: string) {
    const tree = await TreesRepository.create(name, userId, userEmail);
    
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

  static async getVisualData(treeId: string, userId: string) {
    return TreesRepository.getVisualData(treeId, userId);
  }

  static async getMembers(treeId: string) {
    return TreesRepository.getMembers(treeId);
  }

  static async renameTree(treeId: string, userId: string, name: string) {
    const isAdmin = await TreesRepository.isAdmin(treeId, userId);
    if (!isAdmin) throw new AppError('Only admins can rename the tree', 403);
    
    await TreesRepository.renameTree(treeId, name);
    
    await AuditService.log(
      treeId,
      userId,
      'tree_renamed',
      'FamilyTree',
      treeId,
      { name }
    );
  }

  static async deleteTree(treeId: string, userId: string) {
    const isAdmin = await TreesRepository.isAdmin(treeId, userId);
    if (!isAdmin) throw new AppError('Only admins can delete the tree', 403);
    
    await TreesRepository.deleteTree(treeId);
    
    await AuditService.log(
      treeId,
      userId,
      'tree_deleted',
      'FamilyTree',
      treeId
    );
  }
}
