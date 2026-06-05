import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RelationshipValidation } from './relationships.validation';
import { getSession } from '../../core/database';

vi.mock('../../core/database', () => ({
  getSession: vi.fn()
}));

describe('RelationshipValidation', () => {
  let mockSession: any;

  beforeEach(() => {
    mockSession = {
      run: vi.fn(),
      close: vi.fn()
    };
    (getSession as any).mockReturnValue(mockSession);
  });

  it('should throw error if fromId equals toId', async () => {
    await expect(
      RelationshipValidation.validate('tree1', 'person1', 'person1', 'parent' as any)
    ).rejects.toThrow('A person cannot have a relationship with themselves');
  });

  it('should throw error if people do not exist in the same tree', async () => {
    mockSession.run.mockResolvedValueOnce({
      records: [{ get: () => ({ properties: { id: 'person1' } }) }]
    });

    await expect(
      RelationshipValidation.validate('tree1', 'person1', 'person2', 'parent' as any)
    ).rejects.toThrow('One or both people not found in this tree');
  });

  it('should detect an ancestry cycle', async () => {
    // 1. Mock existence
    mockSession.run.mockResolvedValueOnce({
      records: [
        { get: (key: string) => ({ properties: { id: 'A', treeId: 'tree1', birthDate: '1960-01-01' } }) },
        { get: (key: string) => ({ properties: { id: 'B', treeId: 'tree1', birthDate: '1990-01-01' } }) }
      ]
    });

    // 2. Mock cycle detection (finds a path)
    mockSession.run.mockResolvedValueOnce({
      records: [{ get: () => ({}) }] // cycleResult finds something
    });

    await expect(
      RelationshipValidation.validate('tree1', 'A', 'B', 'parent' as any)
    ).rejects.toThrow('This relationship would create an ancestry cycle');
  });

  it('should allow valid relationship', async () => {
    // 1. Mock existence
    mockSession.run.mockResolvedValueOnce({
      records: [
        { get: (key: string) => ({ properties: { id: 'A', treeId: 'tree1', birthDate: '1960-01-01' } }) },
        { get: (key: string) => ({ properties: { id: 'B', treeId: 'tree1', birthDate: '1990-01-01' } }) }
      ]
    });

    // 2. Mock cycle detection (no path)
    mockSession.run.mockResolvedValueOnce({ records: [] });
    
    // 3. Mock pending proposals (none)
    mockSession.run.mockResolvedValueOnce({ records: [] });
    
    // 4. Mock official relationships (none)
    mockSession.run.mockResolvedValueOnce({ records: [] });

    await expect(
      RelationshipValidation.validate('tree1', 'A', 'B', 'parent' as any)
    ).resolves.not.toThrow();
  });
});
