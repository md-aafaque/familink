import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RelationshipRepository } from './relationships.repository';
import { getSession } from '../../core/database';

vi.mock('../../core/database', () => ({
  getSession: vi.fn()
}));

describe('RelationshipRepository', () => {
  let mockSession: any;

  beforeEach(() => {
    mockSession = {
      run: vi.fn(),
      close: vi.fn()
    };
    (getSession as any).mockReturnValue(mockSession);
  });

  describe('createOfficialRelationship', () => {
    it('should create reciprocal edges for parent relationship', async () => {
      mockSession.run
        .mockResolvedValueOnce({ records: [{ get: () => ({ properties: {} }) }] }) // primary
        .mockResolvedValueOnce({ records: [] }) // reciprocal
        .mockResolvedValue({ records: [] }); // all inference calls

      await RelationshipRepository.createOfficialRelationship(
        'tree1', 'parent1', 'child1', 'parent', 'user1', 'admin1'
      );

      expect(mockSession.run).toHaveBeenCalledTimes(6);
      
      // First call: primary (parent)
      const firstCall = mockSession.run.mock.calls[0];
      expect(firstCall[0]).toContain("MERGE (a)-[r:FAMILY_RELATIONSHIP {type: $type, treeId: $treeId}]->(b)");
      expect(firstCall[1]).toMatchObject({ type: 'parent', fromId: 'parent1', toId: 'child1' });

      // Second call: reciprocal (child)
      const secondCall = mockSession.run.mock.calls[1];
      expect(secondCall[0]).toContain("MERGE (b)-[r:FAMILY_RELATIONSHIP {type: $reciprocalType, treeId: $treeId}]->(a)");
      expect(secondCall[1]).toMatchObject({ reciprocalType: 'child', fromId: 'parent1', toId: 'child1' });

      // Calls 3-6: inference steps 3a, 3b, 3c, 3d
      const inferenceCalls = mockSession.run.mock.calls.slice(2);
      expect(inferenceCalls[0][0]).toContain("collect(DISTINCT sibling) as siblings");
      expect(inferenceCalls[1][0]).toContain("allChildren as c1");
      expect(inferenceCalls[2][0]).toContain("spouse IS NOT NULL AND child IS NOT NULL");
      expect(inferenceCalls[3][0]).toContain("sChild.id <> $parentId");
    });

    it('should infer parents when creating a sibling relationship', async () => {
      mockSession.run
        .mockResolvedValueOnce({ records: [{ get: () => ({ properties: {} }) }] }) // primary
        .mockResolvedValueOnce({ records: [] }) // reciprocal
        .mockResolvedValueOnce({ records: [] }) // 4a parent propagation
        .mockResolvedValueOnce({ records: [] }) // 4b transitive sibling closure
        .mockResolvedValue({ records: [{ get: () => [] }] }); // 4c parent collection + default

      await RelationshipRepository.createOfficialRelationship(
        'tree1', 'sibA', 'sibB', 'sibling', 'user1', 'admin1'
      );

      expect(mockSession.run).toHaveBeenCalledTimes(5);
      
      const inferenceCall = mockSession.run.mock.calls[2];
      expect(inferenceCall[0]).toContain("// Parents of A -> become parents of B");
      expect(inferenceCall[0]).toContain("// Parents of B -> become parents of A");
      expect(inferenceCall[1]).toMatchObject({ fromId: 'sibA', toId: 'sibB', treeId: 'tree1' });

      const transitiveCall = mockSession.run.mock.calls[3];
      expect(transitiveCall[0]).toContain("sA.id <> $toId");

      const parentCollectionCall = mockSession.run.mock.calls[4];
      expect(parentCollectionCall[0]).toContain("RETURN collect(DISTINCT p.id) as parentIds");
    });
  });

  describe('softDeleteRelationship', () => {
    it('should delete both primary and reciprocal edges', async () => {
      await RelationshipRepository.softDeleteRelationship(
        'tree1', 'p1', 'p2', 'parent', 'user1'
      );

      expect(mockSession.run).toHaveBeenCalledTimes(1);
      const call = mockSession.run.mock.calls[0];
      expect(call[0]).toContain("(r.type = $type AND startNode(r).id = $fromId AND endNode(r).id = $toId)");
      expect(call[0]).toContain("OR (r.type = $reciprocalType AND startNode(r).id = $toId AND endNode(r).id = $fromId)");
      expect(call[1]).toMatchObject({ type: 'parent', reciprocalType: 'child', fromId: 'p1', toId: 'p2' });
    });
  });
});
