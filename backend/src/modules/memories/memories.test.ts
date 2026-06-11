import { MemoriesRepository } from './memories.repository';
import { CreateMemoryInput } from '../../shared/schemas/memories';
import { getSession } from '../../core/database';

/**
 * Basic integration test script for Memories module.
 * Run this manually or via test runner if configured.
 */
async function testMemories() {
  const treeId = '00000000-0000-0000-0000-000000000000'; // Mock/Test Tree ID
  const posterId = '00000000-0000-0000-0000-000000000001'; // Mock/Test User ID
  
  console.log('--- Starting Memories Integration Test ---');

  try {
    // 1. Create a memory
    const input: CreateMemoryInput = {
      treeId,
      type: 'milestone',
      title: 'Test Milestone',
      content: 'This is a test milestone description.',
      date: Date.now(),
      associatedPersonIds: []
    };

    console.log('Testing create memory...');
    const memory = await MemoriesRepository.create(posterId, input);
    console.log('✅ Created:', memory.id);

    // 2. Find by tree
    console.log('Testing findByTreeId...');
    const treeMemories = await MemoriesRepository.findByTreeId(treeId);
    if (treeMemories.some(m => m.id === memory.id)) {
      console.log('✅ Found in tree feed');
    } else {
      console.error('❌ Not found in tree feed');
    }

    // 3. Update memory
    console.log('Testing update memory...');
    const updated = await MemoriesRepository.update(memory.id, treeId, {
      title: 'Updated Test Milestone'
    });
    if (updated.title === 'Updated Test Milestone') {
      console.log('✅ Update successful');
    } else {
      console.error('❌ Update failed');
    }

    // 4. Soft delete
    console.log('Testing soft delete...');
    await MemoriesRepository.softDelete(memory.id, treeId, posterId);
    const deleted = await MemoriesRepository.findById(memory.id, treeId);
    if (!deleted) {
      console.log('✅ Soft delete successful (not found in findById)');
    } else {
      console.error('❌ Soft delete failed');
    }

    console.log('--- Memories Integration Test Completed Successfully ---');
  } catch (error) {
    console.error('--- Memories Integration Test Failed ---');
    console.error(error);
  } finally {
    const session = getSession();
    await session.close();
  }
}

// testMemories(); // Uncomment to run
