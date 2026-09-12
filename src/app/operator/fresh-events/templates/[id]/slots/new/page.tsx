'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { Apple, ArrowLeft, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Alert, Form, Field, Spinner, TextAreaField, useZodForm } from '@/components/ui';
import { toast } from '@/components/ui/Toast';

interface Template {
  id: string;
  title: string;
  weekday: number;
  startTime: string;
  endTime: string;
  capacity: number;
  defaultPickupInstructions: string | null;
  defaultLocation: { id: string; address: string; city: string } | null;
}

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
}

const WEEKDAY_LABELS = ['Domenica', 'Lunedi', 'Martedi', 'Mercoledi', 'Giovedi', 'Venerdi', 'Sabato'];

function getNextDateForWeekday(weekday: number, fromDate = new Date()): string {
  const d = new Date(fromDate);
  d.setHours(0, 0, 0, 0);
  const diff = (weekday - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

const newSlotSchema = z.object({
  date: z.string().min(1, 'Data obbligatoria'),
  startTime: z.string().min(1, 'Ora inizio obbligatoria'),
  endTime: z.string().min(1, 'Ora fine obbligatoria'),
  capacity: z.coerce.number().int().min(1, 'Almeno 1 posto').max(500),
  pickupLocationId: z.string().optional().or(z.literal('')),
  pickupInstructions: z.string().max(2000).optional().or(z.literal('')),
});

type NewSlotForm = z.infer<typeof newSlotSchema>;

export default function NewFreshSlotPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [template, setTemplate] = useState<Template | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([fetchTemplate(), fetchLocations()]).finally(() => setLoading(false));
  }, [params.id]);

  const fetchTemplate = async () => {
    try {
      const res = await fetch(`/api/operator/fresh-events/templates/${params.id}`);
      if (!res.ok) throw new Error('Errore');
      const data = await res.json();
      setTemplate(data.template);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/operator/locations');
      if (!res.ok) return;
      const data = await res.json();
      setLocations(data.locations || []);
    } catch {}
  };

  if (loading || !template) {
    return (
      <div className="container mx-auto p-4 max-w-2xl flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const initialDate = getNextDateForWeekday(template.weekday);

  return (
    <NewFreshSlotForm
      template={template}
      locations={locations}
      initialDate={initialDate}
      submitting={submitting}
      onSubmit={async (data) => {
        setSubmitting(true);
        try {
          const scheduledStart = new Date(`${data.date}T${data.startTime}:00`);
          const scheduledEnd = new Date(`${data.date}T${data.endTime}:00`);
          if (scheduledStart <= new Date()) {
            throw new Error('La data/ora di inizio deve essere futura');
          }
          if (scheduledEnd <= scheduledStart) {
            throw new Error("L'ora di fine deve essere dopo l'ora di inizio");
          }
          const res = await fetch(`/api/operator/fresh-events/templates/${params.id}/slots`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              scheduledStart: scheduledStart.toISOString(),
              scheduledEnd: scheduledEnd.toISOString(),
              capacity: data.capacity,
              pickupLocationId: data.pickupLocationId || null,
              pickupInstructions: data.pickupInstructions || null,
            }),
          });
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'Errore');
          }
          const json = await res.json();
          toast.success(`Slot pubblicato. ${json.notifiedCount} iscritti notificati.`);
          router.push(`/operator/fresh-events/slots/${json.event.id}`);
        } catch (err: any) {
          toast.error(err.message);
        } finally {
          setSubmitting(false);
        }
      }}
    />
  );
}

function NewFreshSlotForm({
  template,
  locations,
  initialDate,
  submitting,
  onSubmit,
}: {
  template: Template;
  locations: Location[];
  initialDate: string;
  submitting: boolean;
  onSubmit: (data: NewSlotForm) => Promise<void>;
}) {
  const methods = useZodForm(newSlotSchema, {
    defaultValues: {
      date: initialDate,
      startTime: template.startTime,
      endTime: template.endTime,
      capacity: template.capacity,
      pickupLocationId: template.defaultLocation?.id ?? '',
      pickupInstructions: template.defaultPickupInstructions ?? '',
    },
  });
  const { handleSubmit, formState, register } = methods;
  const onValid = handleSubmit(onSubmit);

  return (
    <div className="container mx-auto p-4 max-w-2xl space-y-4">
      <Link href={`/operator/fresh-events/templates/${template.id}`} className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Torna al template
      </Link>

      <div className="flex items-center gap-2">
        <Apple className="h-6 w-6 text-green-600" aria-hidden="true" />
        <h1 className="text-2xl font-bold">Pubblica slot</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{template.title}</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            {WEEKDAY_LABELS[template.weekday]} {template.startTime}-{template.endTime}
          </p>
        </CardHeader>
        <CardContent>
          <Form methods={methods} onSubmit={onValid} className="space-y-4">
            {formState.errors.root && <Alert type="error">{formState.errors.root.message}</Alert>}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field name="date" label="Data" type="date" required />
              <Field name="startTime" label="Ora inizio" type="time" required />
              <Field name="endTime" label="Ora fine" type="time" required />
            </div>

            <Field
              name="capacity"
              label={`Capacita (default template: ${template.capacity})`}
              type="number"
              required
              min={1}
              max={500}
            />

            <div>
              <label className="block text-sm font-medium mb-1">Sede di ritiro (opzionale)</label>
              <select
                {...register('pickupLocationId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Usa sede predefinita</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name ? `${l.name} — ` : ''}{l.address}, {l.city}
                  </option>
                ))}
              </select>
            </div>

            <TextAreaField
              name="pickupInstructions"
              label="Istruzioni di ritiro (opzionali)"
              placeholder="es. Ingresso dal cortile, citofonare al 2..."
              rows={2}
              maxLength={2000}
            />

            <div className="flex gap-2 pt-4 border-t">
              <Button type="submit" variant="primary" loading={submitting || formState.isSubmitting}>
                <Save className="h-4 w-4 mr-1" aria-hidden="true" />
                Pubblica e notifica iscritti
              </Button>
              <Link href={`/operator/fresh-events/templates/${template.id}`}>
                <Button type="button" variant="secondary">Annulla</Button>
              </Link>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
