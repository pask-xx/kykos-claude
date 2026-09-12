'use client';

import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Apple, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Button, Alert, Form, Field, useZodForm, TextAreaField, SelectField } from '@/components/ui';
import { toast } from '@/components/ui/Toast';

const WEEKDAY_OPTIONS = [
  { value: '1', label: 'Lunedi' },
  { value: '2', label: 'Martedi' },
  { value: '3', label: 'Mercoledi' },
  { value: '4', label: 'Giovedi' },
  { value: '5', label: 'Venerdi' },
  { value: '6', label: 'Sabato' },
  { value: '0', label: 'Domenica' },
];

const newTemplateSchema = z.object({
  title: z.string().min(1, 'Titolo obbligatorio').max(200),
  description: z.string().max(2000).optional().or(z.literal('')),
  weekday: z.coerce.number().int().min(0).max(6),
  startTime: z.string().min(1, 'Ora inizio obbligatoria'),
  endTime: z.string().min(1, 'Ora fine obbligatoria'),
  capacity: z.coerce.number().int().min(1, 'Almeno 1 posto').max(500),
  defaultPickupInstructions: z.string().max(2000).optional().or(z.literal('')),
});

type NewTemplateForm = z.infer<typeof newTemplateSchema>;

export default function NewFreshTemplatePage() {
  const router = useRouter();
  const methods = useZodForm(newTemplateSchema, {
    defaultValues: {
      title: '',
      description: '',
      weekday: 2,
      startTime: '16:00',
      endTime: '18:00',
      capacity: 30,
      defaultPickupInstructions: '',
    },
  });
  const { register, handleSubmit, formState } = methods;

  const onSubmit = handleSubmit(async (data: NewTemplateForm) => {
    try {
      const res = await fetch('/api/operator/fresh-events/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description || null,
          weekday: data.weekday,
          startTime: data.startTime,
          endTime: data.endTime,
          capacity: data.capacity,
          defaultPickupInstructions: data.defaultPickupInstructions || null,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Errore nel salvataggio');
      }
      const json = await res.json();
      toast.success('Template creato');
      router.push(`/operator/fresh-events/templates/${json.template.id}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  });

  return (
    <div className="container mx-auto p-4 max-w-2xl space-y-4">
      <Link href="/operator/fresh-events" className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Torna alla lista
      </Link>

      <div className="flex items-center gap-2">
        <Apple className="h-6 w-6 text-green-600" aria-hidden="true" />
        <h1 className="text-2xl font-bold">Nuovo template prodotti freschi</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configurazione template ricorrente</CardTitle>
        </CardHeader>
        <CardContent>
          <Form methods={methods} onSubmit={onSubmit} className="space-y-4">
            {formState.errors.root && <Alert type="error">{formState.errors.root.message}</Alert>}

            <Field
              name="title"
              label="Titolo"
              required
              placeholder="es. Distribuzione martedi pomeriggio"
              maxLength={200}
            />

            <TextAreaField
              name="description"
              label="Descrizione"
              placeholder="es. Frutta, verdura e pane freschi da supermercati locali"
              rows={2}
              maxLength={2000}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <SelectField
                name="weekday"
                label="Giorno settimana"
                required
                options={WEEKDAY_OPTIONS}
              />
              <Field name="startTime" label="Ora inizio" type="time" required />
              <Field name="endTime" label="Ora fine" type="time" required />
            </div>

            <Field
              name="capacity"
              label="Capacita (posti per slot)"
              type="number"
              required
              min={1}
              max={500}
            />

            <TextAreaField
              name="defaultPickupInstructions"
              label="Istruzioni di ritiro (pre-popolate in ogni slot)"
              placeholder="es. Suonare il campanello, ingresso dal cortile..."
              rows={2}
              maxLength={2000}
            />

            <div className="flex gap-2 pt-4 border-t">
              <Button type="submit" variant="primary" loading={formState.isSubmitting}>
                <Save className="h-4 w-4 mr-1" aria-hidden="true" />
                Crea template
              </Button>
              <Link href="/operator/fresh-events">
                <Button type="button" variant="secondary">Annulla</Button>
              </Link>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
