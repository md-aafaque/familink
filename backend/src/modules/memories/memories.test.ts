import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MemoriesRepository } from './memories.repository';
import { getSession } from '../../core/database';
import { v4 as uuidv4 } from 'uuid';

describe('MemoriesRepository Integration', () => {
  const treeId = '00000000-0000-0000-0000-000000000000'; // Mock/Test Tree ID
  const posterId = '00000000-0000-0000-0000-000000000001'; // Mock/Test User ID
  let memoryId: string;

  beforeAll(async () => {
    const session = getSession();
    try {
        await session.run('CREATE (t:FamilyTree {id: $treeId, name: "Test Tree"})', { treeId });
        await session.run('CREATE (u:User {id: $posterId, name: "Test User"})', { posterId });
    } finally {
        await session.close();
    }
  });

  // Ensure test data cleanup after all tests
  afterAll(async () => {
    const session = getSession();
    try {
        await session.run('MATCH (m:Memory {treeId: $treeId}) DETACH DELETE m', { treeId });
        await session.run('MATCH (t:FamilyTree {id: $treeId}) DETACH DELETE t', { treeId });
        await session.run('MATCH (u:User {id: $posterId}) DETACH DELETE u', { posterId });
    } finally {
        await session.close();
    }
  });

  it('should create a memory', async () => {
    const input = {
      treeId,
      type: 'milestone' as const,
      title: 'Test Milestone',
      content: 'This is a test milestone description.',
      date: Date.now(),
      associatedPersonIds: []
    };

    const memory = await MemoriesRepository.create(posterId, input);
    expect(memory).toBeDefined();
    expect(memory.id).toBeDefined();
    memoryId = memory.id;
  });

  it('should find the memory by tree ID', async () => {
    const treeMemories = await MemoriesRepository.findByTreeId(treeId);
    expect(treeMemories.some(m => m.id === memoryId)).toBe(true);
  });

  it('should update the memory', async () => {
    const updated = await MemoriesRepository.update(memoryId, treeId, {
      title: 'Updated Test Milestone'
    });
    expect(updated.title).toBe('Updated Test Milestone');
  });

  it('should soft delete the memory', async () => {
    await MemoriesRepository.softDelete(memoryId, treeId, posterId);
    const deleted = await MemoriesRepository.findById(memoryId, treeId);
    expect(deleted).toBeNull();
  });
});
