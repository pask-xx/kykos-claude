import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrisma, resetAllMocks } from '../../setup/mocks';
import {
  getRecipientScope,
  buildObjectWhereForRecipient,
} from '@/lib/object-filters';

describe('getRecipientScope', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  it('ritorna no-entity quando l\'utente non esiste', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const scope = await getRecipientScope('recipient-1');

    expect(scope).toEqual({ kind: 'no-entity' });
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'recipient-1' },
      select: { referenceEntityId: true, authorized: true },
    });
  });

  it('ritorna no-entity quando referenceEntityId è null', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      referenceEntityId: null,
      authorized: true,
    });

    const scope = await getRecipientScope('recipient-1');

    expect(scope).toEqual({ kind: 'no-entity' });
  });

  it('ritorna unauthorized quando authorized === false (anche con referenceEntityId valorizzato)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      referenceEntityId: 'org-X',
      authorized: false,
    });

    const scope = await getRecipientScope('recipient-1');

    expect(scope).toEqual({ kind: 'unauthorized' });
  });

  it('ritorna ok con referenceEntityId quando tutto è valido', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      referenceEntityId: 'org-X',
      authorized: true,
    });

    const scope = await getRecipientScope('recipient-1');

    expect(scope).toEqual({ kind: 'ok', referenceEntityId: 'org-X' });
  });
});

describe('buildObjectWhereForRecipient', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe('scope no-entity / unauthorized', () => {
    it('ritorna where: null senza chiamare request.findMany quando l\'utente non esiste', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const { where, scope } = await buildObjectWhereForRecipient('recipient-1');

      expect(where).toBeNull();
      expect(scope).toEqual({ kind: 'no-entity' });
      expect(mockPrisma.request.findMany).not.toHaveBeenCalled();
    });

    it('ritorna where: null senza chiamare request.findMany quando authorized === false', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        referenceEntityId: 'org-X',
        authorized: false,
      });

      const { where, scope } = await buildObjectWhereForRecipient('recipient-1');

      expect(where).toBeNull();
      expect(scope).toEqual({ kind: 'unauthorized' });
      expect(mockPrisma.request.findMany).not.toHaveBeenCalled();
    });
  });

  describe('scope ok', () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue({
        referenceEntityId: 'org-X',
        authorized: true,
      });
    });

    it('costruisce il where base senza richieste pregresse né filtri categoria', async () => {
      mockPrisma.request.findMany.mockResolvedValue([]);

      const { where, scope } = await buildObjectWhereForRecipient('recipient-1');

      expect(scope).toEqual({ kind: 'ok', referenceEntityId: 'org-X' });
      expect(where).toEqual({
        status: 'AVAILABLE',
        intermediaryId: 'org-X',
        NOT: {
          OR: [
            { id: { in: [] } },
            { donorId: 'recipient-1' },
          ],
        },
      });
    });

    it('esclude gli oggetti già richiesti dal recipient', async () => {
      mockPrisma.request.findMany.mockResolvedValue([
        { objectId: 'obj-A' },
        { objectId: 'obj-B' },
      ]);

      const { where } = await buildObjectWhereForRecipient('recipient-1');

      expect(where?.NOT).toEqual({
        OR: [
          { id: { in: ['obj-A', 'obj-B'] } },
          { donorId: 'recipient-1' },
        ],
      });
    });

    it('applica il filtro categoria quando passato e diverso da "ALL"', async () => {
      mockPrisma.request.findMany.mockResolvedValue([]);

      const { where } = await buildObjectWhereForRecipient('recipient-1', {
        category: 'FURNITURE',
      });

      expect(where).toMatchObject({
        status: 'AVAILABLE',
        intermediaryId: 'org-X',
        category: 'FURNITURE',
      });
    });

    it('NON applica il filtro categoria quando è "ALL"', async () => {
      mockPrisma.request.findMany.mockResolvedValue([]);

      const { where } = await buildObjectWhereForRecipient('recipient-1', {
        category: 'ALL',
      });

      expect(where).not.toHaveProperty('category');
    });

    it('NON applica il filtro categoria quando extra.category è undefined', async () => {
      mockPrisma.request.findMany.mockResolvedValue([]);

      const { where } = await buildObjectWhereForRecipient('recipient-1');

      expect(where).not.toHaveProperty('category');
    });

    it('chiama request.findMany con il recipientId corretto', async () => {
      mockPrisma.request.findMany.mockResolvedValue([]);

      await buildObjectWhereForRecipient('recipient-99');

      expect(mockPrisma.request.findMany).toHaveBeenCalledWith({
        where: { recipientId: 'recipient-99' },
        select: { objectId: true },
      });
    });
  });
});