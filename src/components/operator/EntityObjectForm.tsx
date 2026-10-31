'use client';

import { ReactNode, useId } from 'react';
import { CATEGORY_LABELS, CONDITION_LABELS, type Category, type Condition } from '@/types';
import { Input, Select, Textarea } from '@/components/ui';
import ImageUploader from '@/components/ImageUploader';
import { MAX_ENTITY_IMAGES } from '@/lib/entity-object-rules';

/**
 * Campi di una disponibilità dell'ente.
 *
 * Componente condiviso tra la creazione (modale "Nuova disponibilità" del
 * magazzino) e la modifica (modale di dettaglio): una sola definizione dei
 * campi, così i due form non possono divergere.
 *
 * Lo stato del form è gestito dal parent (un unico oggetto
 * `EntityObjectFormValues`), non da useState interni: il parent può
 * quindi pre-compilare i valori (modifica) o azzerarli (creazione).
 */

export interface EntityObjectFormValues {
  title: string;
  description: string;
  category: Category;
  condition: Condition;
  imageUrls: string[];
  depositLocation: string;
  depositNotes: string;
}

export const EMPTY_ENTITY_OBJECT_FORM: EntityObjectFormValues = {
  title: '',
  description: '',
  category: 'OTHER',
  condition: 'GOOD',
  imageUrls: [],
  depositLocation: '',
  depositNotes: '',
};

const categoryOptions = (Object.entries(CATEGORY_LABELS) as [Category, string][]).map(
  ([value, label]) => ({ value, label })
);

const conditionOptions = (Object.entries(CONDITION_LABELS) as [Condition, string][]).map(
  ([value, label]) => ({ value, label })
);

export interface EntityObjectFormProps {
  values: EntityObjectFormValues;
  /** Riceve il patch dei campi modificati. */
  onChange: (patch: Partial<EntityObjectFormValues>) => void;
  /**
   * Prefisso degli id dei campi: obbligatorio se nella stessa pagina
   * possono esserci più form (creazione + modifica) con gli stessi label.
   */
  idPrefix: string;
  /**
   * Chiave dell'<ImageUploader>: forzandone il cambio l'uploader si
   * reinizializza con le foto dell'oggetto aperto.
   */
  imageKey?: string;
  /** Slot extra sotto il campo "Posizione di deposito" (es. scanner QR). */
  children?: ReactNode;
}

export function EntityObjectForm({
  values,
  onChange,
  idPrefix,
  imageKey,
  children,
}: EntityObjectFormProps) {
  const photoId = `${idPrefix}-photo`;

  return (
    <div className="space-y-4">
      <Input
        id={`${idPrefix}-title`}
        type="text"
        label="Titolo *"
        value={values.title}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder="Es. Sedia in legno"
      />

      <Textarea
        id={`${idPrefix}-description`}
        label="Descrizione"
        value={values.description}
        onChange={(e) => onChange({ description: e.target.value })}
        rows={3}
        placeholder="Dettagli dell'oggetto, misure, colore..."
      />

      <Select
        id={`${idPrefix}-category`}
        label="Categoria *"
        value={values.category}
        onChange={(e) => onChange({ category: e.target.value as Category })}
        options={categoryOptions}
      />

      <Select
        id={`${idPrefix}-condition`}
        label="Condizione *"
        value={values.condition}
        onChange={(e) => onChange({ condition: e.target.value as Condition })}
        options={conditionOptions}
      />

      <div>
        <span id={photoId} className="block text-sm font-medium text-gray-700 mb-1">
          Foto *
        </span>
        <div aria-labelledby={photoId}>
          <ImageUploader
            key={imageKey}
            onImagesChange={(imageUrls) => onChange({ imageUrls })}
            maxFiles={MAX_ENTITY_IMAGES}
            currentImages={values.imageUrls}
          />
        </div>
      </div>

      <div>
        <Input
          id={`${idPrefix}-deposit-location`}
          type="text"
          label="Posizione di deposito"
          value={values.depositLocation}
          onChange={(e) => onChange({ depositLocation: e.target.value })}
          placeholder="Es. (S): MAGAZZINO - (S): A-12 - (P): 1"
        />
        {children}
      </div>

      <Textarea
        id={`${idPrefix}-deposit-notes`}
        label="Note di deposito"
        value={values.depositNotes}
        onChange={(e) => onChange({ depositNotes: e.target.value })}
        rows={2}
        placeholder="Es. aprire il magazzino su richiesta"
      />
    </div>
  );
}
