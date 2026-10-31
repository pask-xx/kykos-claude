import { describe, it, expect } from 'vitest';
import {
  ENTITY_EDITABLE_STATUSES,
  ENTITY_REPUBLISHABLE_STATUSES,
  ENTITY_REVOCABLE_STATUSES,
  MAX_ENTITY_IMAGES,
  canEditEntityObject,
  canRepublishEntityObject,
  canRevokeEntityObject,
  entityObjectStatusMeta,
  isEntityCategory,
  isEntityCondition,
  validateEntityObjectInput,
} from '@/lib/entity-object-rules';

/**
 * Regole pure sulle disponibilità dell'ente: sono la fonte di verità
 * condivisa fra UI e API (la UI non può autorizzare un'azione che il
 * server rifiuta).
 */

describe('canRevokeEntityObject', () => {
  it('consente la revoca di un oggetto AVAILABLE senza richieste attive', () => {
    expect(canRevokeEntityObject('AVAILABLE', 0)).toBe(true);
  });

  it('consente la revoca di un oggetto in giacenza (DEPOSITED) senza richieste attive', () => {
    expect(canRevokeEntityObject('DEPOSITED', 0)).toBe(true);
  });

  it('non consente la revoca se c\'è almeno una richiesta attiva', () => {
    expect(canRevokeEntityObject('AVAILABLE', 1)).toBe(false);
    expect(canRevokeEntityObject('DEPOSITED', 3)).toBe(false);
  });

  it('non consente la revoca di un oggetto già consegnato', () => {
    expect(canRevokeEntityObject('DONATED', 0)).toBe(false);
  });

  it('non consente la revoca di un oggetto già revocato', () => {
    expect(canRevokeEntityObject('CANCELLED', 0)).toBe(false);
  });

  it('non consente la revoca in stato RESERVED o BLOCKED', () => {
    expect(canRevokeEntityObject('RESERVED', 0)).toBe(false);
    expect(canRevokeEntityObject('BLOCKED', 0)).toBe(false);
  });

  it('safe-by-default: conta richieste non numeriche come revoca negata', () => {
    expect(canRevokeEntityObject('AVAILABLE', Number.NaN)).toBe(false);
    expect(canRevokeEntityObject('AVAILABLE', Number.POSITIVE_INFINITY)).toBe(false);
  });

  it('espone solo gli stati revocabili previsti', () => {
    expect([...ENTITY_REVOCABLE_STATUSES]).toEqual(['AVAILABLE', 'DEPOSITED']);
  });
});

describe('canEditEntityObject', () => {
  it('consente la modifica finché l\'oggetto è in giacenza', () => {
    expect(canEditEntityObject('AVAILABLE')).toBe(true);
    expect(canEditEntityObject('DEPOSITED')).toBe(true);
  });

  it('non consente la modifica di un oggetto consegnato', () => {
    expect(canEditEntityObject('DONATED')).toBe(false);
  });

  it('non consente la modifica di un oggetto revocato', () => {
    expect(canEditEntityObject('CANCELLED')).toBe(false);
  });

  it('espone solo gli stati modificabili previsti', () => {
    expect([...ENTITY_EDITABLE_STATUSES]).toEqual(['AVAILABLE', 'DEPOSITED']);
  });
});

describe('canRepublishEntityObject', () => {
  it('consente la ripubblicazione di un oggetto revocato', () => {
    expect(canRepublishEntityObject('CANCELLED')).toBe(true);
  });

  it('non consente la ripubblicazione di un oggetto già disponibile', () => {
    expect(canRepublishEntityObject('AVAILABLE')).toBe(false);
    expect(canRepublishEntityObject('DEPOSITED')).toBe(false);
  });

  it('non consente la ripubblicazione di un oggetto consegnato', () => {
    expect(canRepublishEntityObject('DONATED')).toBe(false);
  });

  it('espone solo gli stati ripubblicabili previsti', () => {
    expect([...ENTITY_REPUBLISHABLE_STATUSES]).toEqual(['CANCELLED']);
  });
});

describe('validateEntityObjectInput', () => {
  const valid = {
    title: 'Sedia in legno',
    category: 'FURNITURE',
    condition: 'GOOD',
    imageUrls: ['https://example.com/1.jpg'],
  };

  it('accetta un oggetto valido', () => {
    expect(validateEntityObjectInput(valid)).toBeNull();
  });

  it('rifiuta il titolo mancante o vuoto', () => {
    expect(validateEntityObjectInput({ ...valid, title: '' })).toBe('Il titolo è obbligatorio');
    expect(validateEntityObjectInput({ ...valid, title: '   ' })).toBe('Il titolo è obbligatorio');
    expect(validateEntityObjectInput({ ...valid, title: undefined })).toBe('Il titolo è obbligatorio');
  });

  it('rifiuta una categoria non valida', () => {
    expect(validateEntityObjectInput({ ...valid, category: 'ROCKET' })).toBe('Categoria non valida');
  });

  it('rifiuta una condizione non valida', () => {
    expect(validateEntityObjectInput({ ...valid, condition: 'BROKEN' })).toBe('Condizione non valida');
  });

  it('richiede almeno una foto', () => {
    expect(validateEntityObjectInput({ ...valid, imageUrls: [] })).toBe(
      'Almeno una foto è obbligatoria'
    );
    expect(validateEntityObjectInput({ ...valid, imageUrls: 'foto' })).toBe(
      'Almeno una foto è obbligatoria'
    );
  });

  it('rifiuta più di 5 foto', () => {
    const imageUrls = Array.from({ length: MAX_ENTITY_IMAGES + 1 }, (_, i) => `foto-${i}.jpg`);
    expect(validateEntityObjectInput({ ...valid, imageUrls })).toBe(
      `Massimo ${MAX_ENTITY_IMAGES} foto`
    );
  });

  it('rifiuta foto che non sono stringhe', () => {
    expect(validateEntityObjectInput({ ...valid, imageUrls: [42] })).toBe(
      'Le foto devono essere immagini valide'
    );
    expect(validateEntityObjectInput({ ...valid, imageUrls: ['  '] })).toBe(
      'Le foto devono essere immagini valide'
    );
  });
});

describe('isEntityCategory / isEntityCondition', () => {
  it('riconosce le categorie e le condizioni valide', () => {
    expect(isEntityCategory('FURNITURE')).toBe(true);
    expect(isEntityCategory('ROCKET')).toBe(false);
    expect(isEntityCondition('GOOD')).toBe(true);
    expect(isEntityCondition('BROKEN')).toBe(false);
  });

  it('rifiuta valori non stringa', () => {
    expect(isEntityCategory(42)).toBe(false);
    expect(isEntityCondition(null)).toBe(false);
  });
});

describe('entityObjectStatusMeta', () => {
  it('traduce gli stati con label contestuali al magazzino', () => {
    expect(entityObjectStatusMeta('AVAILABLE')).toEqual({ variant: 'success', label: 'Disponibile' });
    expect(entityObjectStatusMeta('DEPOSITED')).toEqual({ variant: 'warning', label: 'In giacenza' });
    expect(entityObjectStatusMeta('DONATED')).toEqual({ variant: 'default', label: 'Ritirato' });
    expect(entityObjectStatusMeta('CANCELLED')).toEqual({ variant: 'danger', label: 'Revocata' });
  });

  it('non espone mai il valore grezzo dell\'enum', () => {
    expect(entityObjectStatusMeta('AVAILABLE').label).not.toBe('AVAILABLE');
    expect(entityObjectStatusMeta('CANCELLED').label).not.toBe('CANCELLED');
    // Stato fuori enum: fallback tradotto, mai la stringa grezza.
    expect(entityObjectStatusMeta('MYSTERY').label).toBe('Sconosciuto');
  });
});
