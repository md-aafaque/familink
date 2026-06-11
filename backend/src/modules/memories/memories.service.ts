import { MemoriesRepository } from './memories.repository';
import { CreateMemoryInput, UpdateMemoryInput, Memory } from '../../shared/schemas/memories';
import { AuditService } from '../audit/audit.service';
import { AppError } from '../../core/errors';
import { getSignedUploadUrl, getSignedDownloadUrl } from '../../core/supabase';

export class MemoriesService {
  static async getUploadUrl(treeId: string, fileName: string) {
    return getSignedUploadUrl(treeId, fileName);
  }

  static async getDownloadUrl(path: string) {
    return getSignedDownloadUrl(path);
  }

  static async createMemory(posterId: string, input: CreateMemoryInput): Promise<Memory> {
    const memory = await MemoriesRepository.create(posterId, input);
    
    await AuditService.log(
      input.treeId,
      posterId,
      'memory_created',
      'Memory',
      memory.id,
      { type: input.type, title: input.title }
    );

    return memory;
  }

  static async getTreeMemories(treeId: string, limit: number = 50): Promise<Memory[]> {
    return MemoriesRepository.findByTreeId(treeId, limit);
  }

  static async getPersonMemories(treeId: string, personId: string): Promise<Memory[]> {
    return MemoriesRepository.findByPersonId(treeId, personId);
  }

  static async updateMemory(id: string, treeId: string, userId: string, input: UpdateMemoryInput): Promise<Memory> {
    const memory = await MemoriesRepository.findById(id, treeId);
    if (!memory) throw new AppError('Memory not found', 404);
    
    // Authorization: Only poster or tree admin can update
    // For now, let's keep it simple: poster can update.
    if (memory.posterId !== userId) {
        // We could check if user is admin here, but we need to fetch tree roles.
        // For V1, only creator can edit their memories.
        throw new AppError('Unauthorized to update this memory', 403);
    }

    const updatedMemory = await MemoriesRepository.update(id, treeId, input);

    await AuditService.log(
      treeId,
      userId,
      'memory_updated',
      'Memory',
      id,
      { title: updatedMemory.title }
    );

    return updatedMemory;
  }

  static async deleteMemory(id: string, treeId: string, userId: string): Promise<void> {
    const memory = await MemoriesRepository.findById(id, treeId);
    if (!memory) throw new AppError('Memory not found', 404);

    if (memory.posterId !== userId) {
        throw new AppError('Unauthorized to delete this memory', 403);
    }

    await MemoriesRepository.softDelete(id, treeId, userId);

    await AuditService.log(
      treeId,
      userId,
      'memory_deleted',
      'Memory',
      id,
      { title: memory.title }
    );
  }
}
