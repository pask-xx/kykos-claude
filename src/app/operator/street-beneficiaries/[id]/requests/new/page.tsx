'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import {
  Armchair, Smartphone, Shirt, BookOpen, ChefHat,
  Dumbbell, Smile, Box, Package, Wrench,
} from 'lucide-react';
import {
  Button, Textarea, Card, CardHeader, CardTitle, CardContent,
  Alert, Form, Field, useZodForm, toast, Skeleton,
} from '@/components/ui';
import { CATEGORY_LABELS, type Category } from '@/types';

// Map locale: categoria → icona lucide. 8 voci (allineata a CATEGORY_LABELS).
const CATEGORY_ICONS: Record<Category, React.ComponentType<{ className?: string }>> = {
  FURNITURE: Armchair,
  ELECTRONICS: Smartphone,
  CLOTHING: Shirt,
  BOOKS: BookOpen,
  KITCHEN: ChefHat,
  SPORTS: Dumbbell,
  TOYS: Smile,
  OTHER: Box,
};

interface StreetBeneficiary {
  id: string;
  nickname: string | null;
  firstName: string;
  lastName: string;
  referenceEntity?: {
    id: string;
    name: string;
  };
}

// Schema sovrapposto al client esistente: required su title/category con
// messaggio italiano custom, max 200/1000 char (allineati ai maxLength HTML).
// Niente regole business nuove (decisione utente 2026-06-04).
const newRequestSchema = z.object({
  type: z.enum(['GOODS', 'SERVICES']),
  category: z.enum(
    ['FURNITURE', 'ELECTRONICS', 'CLOTHING', 'BOOKS', 'KITCHEN', 'SPORTS', 'TOYS', 'OTHER'] as const,
    { message: 'Seleziona una categoria' }
  ),
  title: z.string().min(1, 'Il titolo è obbligatorio').max(200),
  description: z.string().max(1000).optional().or(z.literal('')),
});

type NewRequestValues = z.infer<typeof newRequestSchema>;

export default function NewStreetBeneficiaryRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: beneficiaryId } = use(params);

  // useState locale per il solo dato che non è gestito dal form (beneficiario recuperato via fetch)
  const [beneficiary, setBeneficiary] = useState<StreetBeneficiary | null>(null);
  const [loadingBeneficiary, setLoadingBeneficiary] = useState(true);

  const methods = useZodForm(newRequestSchema, {
    defaultValues: { type: 'GOODS', category: undefined as unknown as Category, title: '', description: '' },
  });
  const { register, handleSubmit, watch, setValue, formState } = methods;
  const type = watch('type');
  const category = watch('category');
  const description = watch('description') ?? '';

  useEffect(() => {
    async function fetchBeneficiary() {
      try {
        const res = await fetch(`/api/operator/street-beneficiaries/${beneficiaryId}`);
        if (!res.ok) throw new Error('Beneficiario non trovato');
        const data = await res.json();
        setBeneficiary(data.beneficiary);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Errore nel caricamento del beneficiario');
      } finally {
        setLoadingBeneficiary(false);
      }
    }

    if (beneficiaryId) {
      fetchBeneficiary();
    }
  }, [beneficiaryId]);

  const onSubmit = async (data: NewRequestValues) => {
    try {
      const res = await fetch('/api/operator/street-beneficiary-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beneficiaryId,
          title: data.title,
          category: data.category,
          type: data.type,
          description: data.description || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || 'Errore durante la creazione');
        return;
      }

      toast.success('Richiesta creata');
      router.push('/operator/street-beneficiaries');
    } catch {
      toast.error('Errore di connessione');
    }
  };

  if (loadingBeneficiary) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!beneficiary) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert type="error" title="Errore">
          Beneficiario non trovato
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/operator/street-beneficiaries/${beneficiaryId}`}
          className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
        >
          ← Dettaglio beneficiario
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Nuova richiesta</h1>
        <p className="text-sm text-gray-500 mt-1">
          Per <strong>{beneficiary.firstName} {beneficiary.lastName}</strong>
          {beneficiary.referenceEntity && (
            <span> — {beneficiary.referenceEntity.name}</span>
          )}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dettagli richiesta</CardTitle>
        </CardHeader>
        <CardContent>
          <Form methods={methods} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Tipo di richiesta (GOODS / SERVICES) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo di richiesta *
              </label>
              <div className="grid grid-cols-2 gap-4">
                {(['GOODS', 'SERVICES'] as const).map((value) => {
                  const Icon = value === 'GOODS' ? Package : Wrench;
                  const title = value === 'GOODS' ? 'Bene' : 'Servizio';
                  const subtitle = value === 'GOODS' ? 'Oggetto materiale' : 'Lavoro o attività';
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setValue('type', value, { shouldValidate: true })}
                      className={`p-4 rounded-lg border-2 transition flex flex-col items-center gap-2 ${
                        type === value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="h-8 w-8 text-primary-600" />
                      <span className="font-medium text-sm">{title}</span>
                      <span className="text-xs text-gray-500">{subtitle}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Categoria (8 icone lucide, label da CATEGORY_LABELS) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.keys(CATEGORY_LABELS) as Category[]).map((value) => {
                  const Icon = CATEGORY_ICONS[value];
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setValue('category', value, { shouldValidate: true })}
                      className={`p-3 rounded-lg border-2 transition flex flex-col items-center gap-1.5 ${
                        category === value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="h-6 w-6 text-primary-600" />
                      <span className="text-xs font-medium text-center leading-tight">
                        {CATEGORY_LABELS[value]}
                      </span>
                    </button>
                  );
                })}
              </div>
              {formState.errors.category && (
                <p className="text-xs text-error-600 mt-1">
                  {formState.errors.category.message as string}
                </p>
              )}
            </div>

            {/* Titolo — Field con zod (errore inline) */}
            <Field
              name="title"
              label="Titolo"
              type="text"
              required
              maxLength={200}
              placeholder={
                type === 'GOODS'
                  ? 'Es: Tavolo da cucina, PC portatile, Vestiti invernali'
                  : 'Es: Riparazione idraulica, Trasloco, Lezioni private'
              }
            />

            {/* Descrizione — Textarea primitive (max 1000) */}
            <div>
              <Textarea
                label="Descrizione (opzionale)"
                rows={4}
                maxLength={1000}
                placeholder={
                  type === 'GOODS'
                    ? 'Aggiungi dettagli sul bene: dimensioni, condizione, colore, ecc.'
                    : 'Descrivi il servizio di cui hai bisogno: quando, dove, durata stimata, ecc.'
                }
                {...register('description')}
              />
              <p className="text-xs text-gray-500 mt-1 text-right">{description.length}/1000</p>
            </div>

            {/* Azioni */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button type="submit" variant="primary" loading={formState.isSubmitting}>
                Crea richiesta
              </Button>
              <Link href="/operator/street-beneficiaries">
                <Button type="button" variant="secondary">
                  Annulla
                </Button>
              </Link>
            </div>
          </Form>
        </CardContent>
      </Card>

      <Alert type="info" title="Visibilità">
        La richiesta sarà visibile a tutti i donatori della diocesi e potrà essere
        soddisfatta da chiunque offra il bene o servizio richiesto.
      </Alert>
    </div>
  );
}
