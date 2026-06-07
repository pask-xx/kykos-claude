# KYKOS — Design System

> Contratto visivo e interattivo del progetto KYKOS. Ogni nuova pagina,
> componente o schermata DEVE rispettare queste regole. Le pagine esistenti
> saranno migrate progressivamente, modulo per modulo, seguendo la roadmap
> in fondo al documento.

**Versione**: 1.0 · **Data**: 2026-06-04 · **Owner**: progetto KYKOS

---

## Indice

1. [Missione e principi](#1-missione-e-principi)
2. [Design tokens](#2-design-tokens)
3. [Tipografia](#3-tipografia)
4. [Spacing & container](#4-spacing--container)
5. [Componenti primitives](#5-componenti-primitives)
6. [Pattern ricorrenti](#6-pattern-ricorrenti)
7. [Iconografia](#7-iconografia)
8. [Loading & error states](#8-loading--error-states)
9. [Accessibilità](#9-accessibilità)
10. [Come adottare](#10-come-adottare)
11. [Anti-pattern vietati](#11-anti-pattern-vietati)
12. [Roadmap di migrazione](#12-roadmap-di-migrazione)

---

## 1. Missione e principi

KYKOS è una piattaforma di donazione anonima con intermediari fidati
(parrocchie, Caritas, associazioni). L'UI deve riflettere tre valori:

- **Chiarezza** — lo stato di una richiesta, di un oggetto, di un'azione
  non deve mai essere ambiguo. Ogni badge ha un colore, ogni bottone ha
  una variante semantica.
- **Coerenza** — un bottone "Approva" in `donor/requests` e uno in
  `operator/requests` devono avere lo stesso aspetto e lo stesso
  comportamento.
- **Accessibilità** — WCAG AA minimo. Contrasto sufficiente, label
  associate, focus visibile, navigazione da tastiera. KYKOS serve
  persone in difficoltà, anche con disabilità.

> **Regola d'oro**: se stai scrivendo un componente UI nuovo, chiediti
> se esiste già un primitive. Se sì, usa quello. Se no, creane uno in
> `src/components/ui/`.

---

## 2. Design tokens

### 2.1 Palette semantica

| Token | Hex 50 | Hex 100 | Hex 500 | Hex 600 | Hex 700 | Uso |
|---|---|---|---|---|---|---|
| `primary` | `#f0f9ff` | `#e0f2fe` | `#0ea5e9` | `#0284c7` | `#0369a1` | Brand, CTA principale, focus |
| `secondary` | `#faf5ff` | `#f3e8ff` | `#a855f7` | `#9333ea` | `#7e22ce` | Brand secondario, gradient |
| `success` | `#f0fdf4` | `#dcfce7` | `#22c55e` | `#16a34a` | `#15803d` | Conferma, approvazione, stato positivo |
| `warning` | `#fffbeb` | `#fef3c7` | `#f59e0b` | `#d97706` | `#b45309` | Attenzione, stato intermedio |
| `error` | `#fef2f2` | `#fee2e2` | `#ef4444` | `#dc2626` | `#b91c1c` | Errore, azione distruttiva, stato negativo |
| `info` | `#eff6ff` | `#dbeafe` | `#3b82f6` | `#2563eb` | `#1d4ed8` | Informazione, link, stato neutrale |
| `gray` (Tailwind) | `#f9fafb` | `#f3f4f6` | — | `#4b5563` | `#374151` | Testo, bordi, sfondo |

### 2.2 Mappa vecchio → nuovo

I colori Tailwind predefiniti (`red-100`, `green-100`, …) restano
funzionanti per compatibilità con le pagine esistenti, ma il codice
nuovo DEVE usare i token semantici:

| Vecchio (deprecato) | Nuovo (preferito) |
|---|---|
| `bg-red-100 text-red-700` | `bg-error-100 text-error-700` |
| `bg-green-100 text-green-700` | `bg-success-100 text-success-700` |
| `bg-amber-100 text-amber-700` | `bg-warning-100 text-warning-700` |
| `bg-blue-100 text-blue-700` | `bg-info-100 text-info-700` |
| `bg-primary-100` (invariato) | `bg-primary-100` |
| `bg-secondary-100` (invariato) | `bg-secondary-100` |

### 2.3 Mappa status → colore

Per uniformare gli status badge tra le 70+ pagine:

| Status KYKOS | Token | Etichetta |
|---|---|---|
| `PENDING` (richieste) | `warning` | "In attesa" |
| `APPROVED` / `ACCEPTED` | `success` | "Approvata" |
| `REJECTED` / `CANCELLED` | `error` | "Rifiutata" / "Annullata" |
| `RESERVED` | `info` | "Prenotata" |
| `DEPOSITED` | `secondary` | "Depositata" |
| `DONATED` / `FULFILLED` | `gray` | "Donata" |
| `AVAILABLE` | `success` | "Disponibile" |
| `BLOCKED` | `error` | "Bloccato" |
| `EXPIRED` | `gray` | "Scaduta" |
| `OPEN` (distribuzioni) | `success` | "Aperta" |
| `CLOSED` | `gray` | "Chiusa" |
| `EXHAUSTED` | `error` | "Esaurita" |

Per le etichette in italiano, **usare sempre** le costanti centralizzate
in `src/types/index.ts` (`STATUS_LABELS`, `CATEGORY_LABELS`,
`DONOR_LEVEL_LABELS`, ecc.). Mai hard-codare la stringa.

---

## 3. Tipografia

**Font**: Sora (caricato in `src/app/layout.tsx` come
`--font-sora`).

**Scala**:

| Livello | Classi Tailwind | Esempio |
|---|---|---|
| h1 (titolo pagina) | `text-2xl font-bold text-gray-900` | Dashboard, lista |
| h2 (sezione) | `text-lg font-semibold text-gray-900` | Card, dettaglio |
| h3 (sottosezione) | `text-base font-semibold text-gray-900` | Sottotitolo |
| Body | `text-sm text-gray-900` | Testo principale |
| Caption | `text-xs text-gray-500` | Metadata, helper |
| Label | `text-sm font-medium text-gray-700` | Label di form |

**Regole**:

- **Un solo `<h1>` per pagina** (di solito il titolo principale).
- Il titolo standard delle pagine dashboard è `text-2xl font-bold`.
  Non usare `text-3xl font-medium` (è il vecchio stile, in fase di
  abbandono).
- Niente di più piccolo di `text-xs` per il testo letto dall'utente.

---

## 4. Spacing & container

### 4.1 Padding main

- Dashboard utenti (`/donor`, `/recipient`, `/intermediary`, `/admin`):
  wrapper `<div className="min-h-screen bg-gray-50">`, main
  `p-4 sm:p-6 space-y-6`.
- Dashboard operator (`/operator`): main `lg:ml-64 pt-14 lg:pt-0 px-6 py-6 space-y-6`.
- Pagine narrow (es. `/donor/to-deliver`, `/donor/statistics`):
  `max-w-2xl mx-auto`.
- Pagine form: `max-w-md` o `max-w-lg mx-auto`.

### 4.2 Gap verticale

- Tra sezioni: `space-y-6` (24px).
- Tra elementi in una sezione: `space-y-4` (16px).
- Tra campi di un form: `space-y-4` o `space-y-5` (16-20px).

### 4.3 Card/container

- Card standard: `bg-white rounded-xl shadow-sm border p-6`.
- Card interactive (cliccate come link): aggiungere
  `hover:shadow-md hover:border-gray-300 transition cursor-pointer`.
- Larghezze: `max-w-sm` (320px), `max-w-md` (448px), `max-w-lg` (512px),
  `max-w-2xl` (672px), `max-w-4xl` (896px).

---

## 5. Componenti primitives

Tutti importabili da un unico barrel:

```tsx
import { Button, Input, Card, Badge, Alert, Modal, ModalFooter, Spinner, LoadingOverlay, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty, Tabs, TabPanel, EmptyState, Pagination, Avatar, AvatarGroup, Skeleton, SkeletonText, SkeletonCard, SkeletonAvatar, ToastProvider, toast, Form, Field, TextAreaField, SelectField, useZodForm } from '@/components/ui';
```

### 5.1 Button

Pulsante standard KYKOS con varianti semantiche, taglie, loading state,
icone left/right.

| Prop | Tipo | Default | Note |
|---|---|---|---|
| `variant` | `primary \| secondary \| danger \| warning \| ghost \| success` | `primary` | `success` per "Approva", `danger` per "Elimina/Rifiuta" |
| `size` | `sm \| md \| lg` | `md` | |
| `loading` | `boolean` | `false` | Mostra `<Spinner size="sm">` e disabilita il pulsante |
| `leftIcon` | `ReactNode` | – | Icona lucide |
| `rightIcon` | `ReactNode` | – | Icona lucide |

Esempi:

```tsx
<Button>Salva</Button>
<Button variant="danger" onClick={onDelete}>Elimina</Button>
<Button variant="success" leftIcon={<Check />}>Approva</Button>
<Button variant="ghost" rightIcon={<ChevronRight />}>Avanti</Button>
<Button loading={isSubmitting}>Salvataggio...</Button>
```

### 5.2 Input / Textarea / Select / Checkbox

Campi di form con label associata, errore inline, focus ring primary.

```tsx
<Input label="Email" type="email" required value={email} onChange={...} error={errors.email} />
<Select label="Categoria" options={[
  { value: 'BOOKS', label: 'Libri' },
  { value: 'CLOTHES', label: 'Vestiti' },
]} value={cat} onChange={...} />
<Checkbox label="Accetto i termini" checked={ok} onChange={...} />
```

### 5.3 Card (+ Header/Title/Content)

```tsx
<Card>
  <CardHeader>
    <CardTitle>Le mie donazioni</CardTitle>
  </CardHeader>
  <CardContent>
    <p>...</p>
  </CardContent>
</Card>
```

### 5.4 Badge

Per status e tag.

| `variant` | Token |
|---|---|
| `default` | gray |
| `primary` | primary |
| `success` | success |
| `warning` | warning |
| `danger` | error |
| `info` | info |

```tsx
<Badge variant="success">Approvata</Badge>
<Badge variant="warning" pill>In attesa</Badge>
```

### 5.5 Alert

Banner per messaggi contestuali (errore di form, info GDPR, ecc.).

```tsx
<Alert type="error">Email già registrata</Alert>
<Alert type="success" title="Salvato">Le modifiche sono state applicate.</Alert>
```

### 5.6 Modal (+ ModalFooter)

Dialog modale con overlay, ESC per chiudere, scroll interno.

```tsx
<Modal isOpen={open} onClose={() => setOpen(false)} title="Conferma" size="md">
  <p>Sei sicuro?</p>
  <ModalFooter>
    <Button variant="ghost" onClick={() => setOpen(false)}>Annulla</Button>
    <Button variant="danger" onClick={onConfirm}>Conferma</Button>
  </ModalFooter>
</Modal>
```

### 5.7 Spinner / LoadingOverlay

- `<Spinner size="sm|md|lg" />` — per azioni inline (caricamento bottone).
- `<LoadingOverlay message="Salvataggio..." />` — per azioni full-screen.

### 5.8 Table

Per liste tabellari semantiche. Default: container `bg-white rounded-xl shadow-sm border overflow-hidden`, header `bg-gray-50`, hover su righe.

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Nome</TableHead>
      <TableHead>Email</TableHead>
      <TableHead className="text-right">Azioni</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {items.map(item => (
      <TableRow key={item.id}>
        <TableCell>{item.name}</TableCell>
        <TableCell>{item.email}</TableCell>
        <TableCell className="text-right">
          <Button size="sm" variant="ghost">Modifica</Button>
        </TableCell>
      </TableRow>
    ))}
    {items.length === 0 && (
      <TableEmpty colSpan={3}>Nessun elemento presente</TableEmpty>
    )}
  </TableBody>
</Table>
```

### 5.9 Tabs

Tabs orizzontali con 3 varianti:

| Variant | Attivo | Quando usarlo |
|---|---|---|
| `default` | `bg-primary-100 text-primary-700 border border-primary-300` | Tabs con conteggio, navigazione primaria (default del progetto) |
| `pills` | `bg-primary-600 text-white` | Tabs in page header, navigazione secondaria |
| `underline` | `border-b-2 border-primary-600` | Tabs minimali, single-page sections |

```tsx
const [tab, setTab] = useState('all');
<Tabs
  value={tab}
  onChange={setTab}
  items={[
    { value: 'all', label: 'Tutte', count: 12 },
    { value: 'active', label: 'Attive', count: 5 },
  ]}
  variant="default"
/>
<TabPanel active={tab === 'all'}>...</TabPanel>
<TabPanel active={tab === 'active'}>...</TabPanel>
```

### 5.10 EmptyState

Per liste vuote. Default icon: `Inbox` di lucide-react.

```tsx
<EmptyState
  icon={Package}
  title="Nessun oggetto"
  description="Pubblica il tuo primo oggetto per iniziare."
  action={<Button>+ Aggiungi oggetto</Button>}
/>
```

### 5.11 Pagination

Per paginazione numerata o semplice. Default `variant="numbered"`.

```tsx
<Pagination page={page} totalPages={10} onPageChange={setPage} />
<Pagination page={page} totalPages={10} onPageChange={setPage} variant="simple" />
```

### 5.12 Avatar

Immagine profilo con fallback a iniziali.

```tsx
<Avatar src={user.photoUrl} name="Mario Rossi" size="md" />
<AvatarGroup>
  <Avatar src={u1.photoUrl} name="Mario" />
  <Avatar src={u2.photoUrl} name="Luigi" />
</AvatarGroup>
```

### 5.13 Skeleton

Placeholder per contenuti in caricamento.

```tsx
<Skeleton className="h-4 w-32" />
<SkeletonText lines={3} />
<SkeletonCard />
<SkeletonAvatar size={40} />
```

### 5.14 Toast

Notifiche transient in alto a destra. Da mountare UNA volta in
`src/app/layout.tsx` (già fatto). Da usare nelle pagine:

```tsx
import { toast } from '@/components/ui/Toast';

toast.success('Operazione completata');
toast.error('Errore di rete');
toast.loading('Salvataggio in corso...');
toast.dismiss();
toast.promise(fetch(...), {
  loading: 'Salvataggio...',
  success: 'Salvato!',
  error: 'Errore',
});
```

**Sostituisce**:
- `const [success, setSuccess] = useState(false); setTimeout(() => setSuccess(false), 3000);` → `toast.success('...')`.
- `window.alert('...')` → `toast.success/error/info(...)`.

### 5.15 Form / Field / TextAreaField / SelectField

Wrapper su react-hook-form + zod per ridurre il pattern verboso a 8-15
`useState` per form.

```tsx
import { z } from 'zod';
import { Form, Field, Button, toast, useZodForm } from '@/components/ui';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

function MyForm() {
  const methods = useZodForm(schema);
  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      await fetch('/api/...', { method: 'POST', body: JSON.stringify(data) });
      toast.success('Salvato');
    } catch (e) {
      toast.error('Errore di rete');
    }
  };

  return (
    <Form methods={methods} onSubmit={methods.handleSubmit(onSubmit)}>
      <Field name="email" label="Email" type="email" required />
      <Field name="password" label="Password" type="password" required />
      <Button type="submit" loading={methods.formState.isSubmitting}>Salva</Button>
    </Form>
  );
}
```

**Vantaggi**:
- Validazione tipata (errori autocompletati).
- Errori per campo gestiti automaticamente da `<Field>`.
- `isSubmitting` per disabilitare il bottone.

---

## 6. Pattern ricorrenti

### 6.1 PageHeader

Intestazione standard di pagina: titolo, sottotitolo, bottone azione a
destra. Niente primitivo dedicato (è solo 4 righe di JSX), ma il
pattern è questo:

```tsx
<header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
  <div>
    <h1 className="text-2xl font-bold text-gray-900">Le mie donazioni</h1>
    <p className="text-sm text-gray-500 mt-1">{count} elementi</p>
  </div>
  <Button leftIcon={<Plus />}>Nuovo oggetto</Button>
</header>
```

### 6.2 ListPage

Pattern standard per pagine lista. Combinare `<Table>` o griglia di
`<Card>` con `<EmptyState>` e (opzionalmente) `<Pagination>`.

```tsx
<>
  <PageHeader ... />
  {items.length === 0 ? (
    <EmptyState title="Nessun elemento" action={<Button>Aggiungi</Button>} />
  ) : (
    <>
      <Table>
        <TableHeader>...</TableHeader>
        <TableBody>...</TableBody>
      </Table>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </>
  )}
</>
```

### 6.3 Form pattern

Vedi 5.15. In breve: `<Form methods={methods} onSubmit={...}>` con
`<Field>` per ogni campo, `<Button type="submit" loading>` per il
submit, `toast.success/error` per il feedback.

### 6.4 Azione distruttiva (conferma)

Per cancellazioni, disattivazioni, ecc., usare `<Modal>` con
`<ModalFooter>`:

```tsx
<Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title="Conferma eliminazione" size="sm">
  <p className="p-6 text-sm text-gray-700">
    Sei sicuro di voler eliminare "{item.name}"? L'azione è irreversibile.
  </p>
  <ModalFooter>
    <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Annulla</Button>
    <Button variant="danger" onClick={onConfirm}>Elimina</Button>
  </ModalFooter>
</Modal>
```

### 6.5 Feedback successo/errore

```tsx
// ✅ Nuovo pattern
toast.success('Oggetto pubblicato');
toast.error('Email già registrata');
toast.loading('Salvataggio in corso...');

// ❌ Vecchio pattern (vietato)
const [success, setSuccess] = useState(false);
setSuccess(true);
setTimeout(() => setSuccess(false), 3000);
window.alert('Email già registrata');
```

---

## 7. Iconografia

**Libreria**: `lucide-react` (tree-shakeable, naming consistente,
accessibilità-friendly).

**Regole**:

1. **Codice nuovo** usa SOLO lucide. Le emoji sono tollerate solo come
   decorazioni semantiche leggere (✅, 🎉) ma **mai come unica label**:
   un pulsante con solo "✅" non è accessibile, deve avere
   `aria-label="Conferma"` o testo visibile.
2. **Emoji esistenti** saranno migrate in commit dedicati per modulo,
   seguendo la roadmap.
3. Import SEMPRE con named import:
   ```tsx
   // ✅ Corretto
   import { Package, AlertCircle } from 'lucide-react';
   // ❌ Vietato
   import * as Icons from 'lucide-react';
   ```
4. Dimensione standard: `h-5 w-5` (20px) per icone inline a bottoni,
   `h-4 w-4` (16px) per tabelle, `h-6 w-6` (24px) per hero icon.
5. Colore: passare `className="text-..."` esplicitamente o usare
   `current` per ereditarlo dal parent.

**Icone più usate** (riferimento rapido):

| Concetto | Icona lucide |
|---|---|
| Oggetto | `Package` |
| Donazione / Regalo | `Gift` |
| Richiesta | `ClipboardList` |
| Statistiche | `BarChart3` |
| Profilo | `User` |
| Logout | `LogOut` |
| Notifiche | `Bell` |
| QR code | `QrCode` |
| Localizzazione | `MapPin` |
| Foto | `Camera` |
| Loading | `Loader2` (con `animate-spin`) |
| Success | `CheckCircle2` |
| Error | `AlertCircle` |
| Warning | `AlertTriangle` |
| Info | `Info` |
| Chiudi | `X` |
| Aggiungi | `Plus` |
| Modifica | `Pencil` |
| Elimina | `Trash2` |
| Cerca | `Search` |
| Filtra | `Filter` |
| Indietro | `ChevronLeft` |
| Avanti | `ChevronRight` |

---

## 8. Loading & error states

### 8.1 Regole

- **Liste in caricamento**: usare `<Skeleton>` ripetuti, MAI uno
  spinner gigante con "Caricamento..." (vecchio pattern).
- **Azioni full-screen** (es. submit di un form lungo): usare
  `<LoadingOverlay>` su una card.
- **Azioni inline** (es. submit di un form con pochi campi): usare
  `loading` su `<Button>`. Lo spinner è già integrato.
- **Errori**: toast + `<Alert type="error">` inline se il contesto lo
  richiede (es. errore di validazione sotto un campo). Mai
  `window.alert()`.

### 8.2 Esempio: lista con skeleton

```tsx
{isLoading ? (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
  </div>
) : items.length === 0 ? (
  <EmptyState title="Nessun elemento" />
) : (
  <Table>...</Table>
)}
```

### 8.3 Boundary globali (TODO)

`src/app/loading.tsx`, `src/app/error.tsx`, `src/app/not-found.tsx`
**non esistono ancora**. Da creare in un commit dedicato. Nel
frattempo, ogni pagina gestisce localmente i suoi stati.

---

## 9. Accessibilità

### 9.1 Regole prescrittive

- **Pulsanti**: usare `<button>` (o `<Button>`), MAI `<div onClick>`.
  Se servono `onClick` e `href`, usare `<Link>`.
- **Label**: ogni input DEVE avere un `<label htmlFor="id">` associato
  a un `<input id="id">`. Mai label "orfane" senza `htmlFor`.
- **Icone decorative**: aggiungere `aria-hidden="true"` o usare il
  default dei componenti lucide.
- **Modali**: `Modal` deve avere `aria-modal="true"` (sarà aggiunto in
  un commit dedicato), chiusura con `Escape`, focus trap.
- **Focus visivo**: tutti gli elementi interattivi devono avere
  `focus:ring-2 focus:ring-primary-500 focus:ring-offset-2` o
  equivalente. Il default di `<Button>` lo include.
- **Contrasto**: WCAG AA minimo. Non usare `text-gray-400` su
  `bg-white` per testo letto dall'utente (rapporto insufficiente).
- **Heading order**: niente `<h3>` prima di un `<h2>`. Un solo `<h1>`
  per pagina.
- **`window.alert`**: VIETATO. Usare `toast.*`.

### 9.2 Anti-pattern a11y già presenti (da correggere gradualmente)

- `ConfirmDialog.tsx:40` — `<div onClick>` per trigger.
- `SendMessageDialog.tsx:63` — idem.
- `admin/dashboard/page.tsx:152` — tab come `<div onClick>`.
- 10 file usano `window.alert()`.

Saranno affrontati nella roadmap (sezione 12).

---

## 10. Come adottare

### 10.1 Per chi crea codice nuovo

1. Se stai creando un componente UI generico, mettilo in
   `src/components/ui/` con lo stesso pattern (forwardRef dove serve,
   `cn()` per le classi, JSDoc con esempi).
2. Se stai creando una pagina, **usa solo i primitives**. Niente
   `<button className="bg-primary-600 ...">` scritto a mano.
3. Se stai creando un form, usa `<Form>` + `<Field>` + zod. Niente
   `useState` per ogni campo.
4. Per i colori, usa i token semantici. Niente `bg-red-100` diretto.
5. Per le icone, usa lucide. Niente emoji come unica label.
6. Per il feedback, usa `toast.*`. Niente `setTimeout` su banner
   inline o `window.alert`.

### 10.2 Per chi tocca codice esistente

1. **NON riscrivere** un file solo per allinearlo al design system.
2. Se stai aggiungendo un componente nuovo in un file esistente, usa
   il primitive.
3. Se devi cambiare un colore, usa il token semantico anche per il
   resto del file.
4. Piccoli miglioramenti "free" (es. aggiungere `aria-label` a un
   bottone) sono benvenuti.

### 10.3 Per chi migra un modulo

La roadmap (sezione 12) elenca i moduli in ordine di priorità. Per
ciascuno:

1. Aprire la PR con scope "design-system: migrate `<modulo>`".
2. Aggiornare tutti i bottoni, input, badge, alert, modali al nuovo
   pattern.
3. Aggiornare i colori ai token semantici.
4. Sostituire `useState` + `setTimeout` con `toast`.
5. Verificare con Lighthouse / axe devtools che l'a11y non sia
   regredita.

---

## 11. Anti-pattern vietati

Questi pattern sono vietati nel codice nuovo. Se li trovi in codice
esistente, sostituiscili se stai toccando il file.

| Anti-pattern | Sostituzione |
|---|---|
| `<div onClick={...}>` per azione (tab trigger, card cliccabile) | `<button onClick={...}>` o `<Button>` + `aria-label` + `focus-visible:ring` |
| `<div className="absolute inset-0 bg-black/50" onClick={close}>` | **NON è anti-pattern**: pattern React standard per click-outside su backdrop modal. Solo fix richiesto: ESC key (P1) |
| `window.alert('...')` | `toast.success/error/info/warning(...)` |
| `<button className="bg-primary-600 ...">` inline | `<Button variant="primary">` |
| `<input className="w-full px-3 py-2 border ...">` inline | `<Input label="..." />` |
| `<span className="px-2 py-1 bg-green-100 text-green-700 ...">` | `<Badge variant="success">` |
| `bg-red-100 text-red-700` | `bg-error-100 text-error-700` (token semantico) |
| `bg-green-100 text-green-700` | `bg-success-100 text-success-700` |
| `const [success, setSuccess] = useState(false); setTimeout(() => setSuccess(false), 3000);` | `toast.success('...')` |
| `const [success, setSuccess] = useState<string\|null>(null); {success && <div bg-green-50>…</div>}` (banner persistente) | `toast.success('...')` (auto-dismiss 5s sonner). Eccezione: `<Alert type="success">` primitive se il messaggio è contestuale a un form (es. `PasswordChangeForm`). |
| `const [x, setX] = useState(''); const [y, setY] = useState(''); ...` × 10 in un form | `<Form methods={useZodForm(schema)}>` + `<Field>` |
| `setError('Email non valida')` + banner globale per validazione | `<Field error={errors.email}>` (inline sotto il campo) |
| Emoji come unica label (`<button>✅</button>`) | `<button aria-label="Conferma">✅</button>` + testo |
| `<select className="...">` inline | `<SelectField>` (con zod) o `<Select>` (semplice) |
| `<table className="w-full">` con classi raw | `<Table>` + sub-componenti |
| `Animate-spin h-10 w-10 border-b-2 border-primary-600` (spinner inline) | `<Spinner size="md" />` |
| `<div className="text-center py-12"><p>Caricamento...</p></div>` | `<SkeletonCard />` × 3, oppure `<LoadingOverlay />` |
| `<div className="text-center py-12 bg-white rounded-xl shadow-sm border"><span className="text-5xl">📦</span><h2>Niente</h2></div>` | `<EmptyState icon={Package} title="Niente" />` |
| `import * as Icons from 'lucide-react'` | `import { Package } from 'lucide-react'` |

---

## 12. Roadmap di migrazione

Lavori di refactor futuri, in ordine di priorità. Ogni step è un commit
(o un piccolo gruppo di commit) separato.

### 12.1 P0 — Fondamenta (✅ fatto in v1.0)

- [x] Creare i primitives mancanti: Table, Tabs, EmptyState, Pagination,
      Avatar, Skeleton, Toast, Form+Field.
- [x] Tokenizzare i colori semantici in `tailwind.config.ts`.
- [x] Montare `ToastProvider` nel layout root.
- [x] Aggiungere `leftIcon`/`rightIcon` a `Button`.
- [x] Migliorare `Alert` con icone lucide di default.
- [x] Scrivere questo documento.

### 12.2 P1 — Modali custom (2-3 commit)

- [ ] Migrare `ConfirmDialog` a usare `Modal` + `ModalFooter` (eliminare
      `<div onClick>`).
- [ ] Migrare `SendMessageDialog` a usare `Modal` + `<Input>`.
- [ ] Migrare `ManifestoModal` a usare `Modal`.
- [ ] Migrare `PdfViewerModal` a usare `Modal`.
- [ ] Migrare il modal detail di `NotificationBell` a usare `Modal`.
- [ ] Aggiungere ESC e focus trap a `Modal`.

### 12.3 P2 — Logout & password (2 commit)

- [x] Unificare le 4 implementazioni di Logout in un unico
      `<LogoutButton role="user|operator">`.
- [x] Unificare i 2 form di cambio password in un unico
      `<PasswordChangeForm role="user|operator">` (la roadmap
      originale diceva "3" ma il 3° flusso, `auth/reset-password`,
      è forgot-password via email, NON cambio da utente loggato).

### 12.4 P3 — Toast ovunque (5-10 commit, modulo per modulo)

Sostituire `useState(success) + setTimeout(3000)` con `toast.success` in:
- [x] `donor/DonorRequestsClient.tsx`
- [x] `recipient/RecipientFeedClient.tsx`
- [x] `components/profile/ProfileForm.tsx`
- [x] `intermediary/profile/page.tsx`
- [x] `operator/profile/page.tsx`
- [x] `operator/cause/[id]/page.tsx`
- [x] `operator/street-beneficiaries/[id]/edit/page.tsx`
- [x] `operator/organization/page.tsx`
- [x] `admin/dashboard/page.tsx`
- [x] `admin/legal/page.tsx`

E i 10 `window.alert()`:
- [x] `recipient/RecipientFeedClient.tsx:249`
- [x] `qr/QRCodeCard.tsx:26`
- [x] `intermediary/requests/page.tsx:54,58`
- [x] `donor/causes/page.tsx:50`
- [x] `operator/availability/[id]/page.tsx:152`
- [x] `operator/recipients/page.tsx:68,72`
- [x] `operator/objects/[id]/deliver/page.tsx:54,58`

> ✅ **Completata in Fase 10 (2026-06-06)**, 11 commit atomici su staging. Vedi [[refactor-state]] § Fase 10 e [[05-known-issues]] § "Anti-pattern eliminati in Fase 10".
>
> Casi speciali preservati: `forgot-password` (state-machine con DEV token), `actionError` inline nei modal di conferma, 5 file extra con banner persistiti rimandati a P11 (`PasswordChangeForm`, `intermediary/operators/[id]`, `operator/operators/[id]`, `volunteer/page`, `volunteer/apply`).

### 12.4bis P11 — Banner persistiti (4 commit)

Estensione di P3: i 5 file rimandati sopra sono stati analizzati e 4
su 5 migrati al primitive `toast.*`. 1 è stato preservato (vedi nota).

- [x] `volunteer/apply/page.tsx` — banner verde "Candidatura inviata"
      + redirect `setTimeout(router.push, 2000)`. Migrare a `toast.success`
      mantiene il redirect (auto-dismiss 5s sonner non blocca la nav).
- [x] `volunteer/page.tsx` — 2 banner verdi ("Disponibilità ritirata" +
      "Candidatura inviata"). Entrambi → `toast.success`.
- [x] `intermediary/operators/[id]/page.tsx` — banner verde "Dati salvati".
      Banner `tempPassword` (password temporanea generata) MANTENUTO inline:
      l'admin deve poter leggere e copiare la password prima che scompaia.
- [x] `operator/operators/[id]/page.tsx` — banner verde "Dati salvati".
      Stesso preservato: `tempPassword` banner resta inline.
- [ ] `PasswordChangeForm.tsx` — preservato. Usa primitive `<Alert type="success">`
      (NON `<div bg-green-50>` raw), è il pattern corretto per i messaggi
      contestuali al form. Da non migrare a toast.

> ✅ **Completata in Fase 11 (2026-06-06)**, 4 commit atomici su staging.
> Vedi [[refactor-state]] § Fase 11 e [[05-known-issues]] § "Anti-pattern
> eliminati in Fase 11".

### 12.5 P4 — Modulo operator/street (modello)

- [ ] Migrare le 5 pagine `operator/street-beneficiaries/**` (già
      parzialmente allineate) a `<Form>` + zod.
- [ ] Validare come "modello di riferimento" per gli altri moduli.

### 12.6 P5 — Modulo operator/* (3-5 commit)

- [x] Migrare `operator/requests` a `<Table>` + `<Tabs>` + `<EmptyState>`
      (Fase 13.2, 2026-06-07). Layout a card mantenuto (azioni per riga), tab
      state sincronizzato in URL via `router.replace`.
- [x] Migrare `operator/objects` a griglia `<Card>` + `<EmptyState>`
      (Fase 13.3, 2026-06-07). Card layout mantenuto (detail in /[id]),
      filtri convertiti a `<Input>` + `<Select>` + `<Checkbox>`.
- [x] Migrare `operator/recipients` a `<Table>`
      (Fase 13.1, 2026-06-07). Tabs con counts, Badge per needScore,
      Avatar primitive, EmptyState.
- [x] Migrare `operator/availability` a `<Card>` + `<EmptyState>`
      (Fase 13.4, 2026-06-07). Modal custom sostituito da primitive
      `<Modal isOpen footer>`, form inputs migrati a `<Input>`/`<Textarea>`.
- [ ] Migrare `operator/operators` a `<Table>`.
- [ ] Migrare `operator/volunteers` a `<Table>` + `<Tabs>`.

> ✅ **P5 parzialmente completato in Fase 13** (4/6 file, 2026-06-07), 4
> commit atomici su staging. Vedi [[refactor-state]] § Fase 13.
> Le 2 pagine restanti (operators, volunteers) sono routable ma
> attualmente usate solo da admin ente → priorità P9 o successiva.

### 12.7 P6 — Modulo donor/* (3-4 commit)

- [ ] Migrare `donor/objects` a `<Card>` grid + `<EmptyState>`.
- [ ] Migrare `donor/requests` a `<Tabs>` + griglia.
- [ ] Migrare `donor/dashboard` (DonorRequestsClient) a skeleton.
- [ ] Migrare `donor/statistics` a skeleton.

### 12.8 P7 — Modulo recipient/* (3-4 commit)

- [ ] Migrare `recipient/objects` a `<Card>` grid + `<EmptyState>`.
- [ ] Migrare `recipient/requests` a `<Tabs>` + `<EmptyState>`.
- [ ] Migrare `recipient/requests-entity/requests` a `<Table>`.
- [ ] Migrare `recipient/my-objects` a `<Card>` grid.

### 12.9 P8 — Modulo intermediary/* e admin/* (2-3 commit)

- [ ] Migrare `intermediary/recipients` a `<Table>`.
- [ ] Migrare `intermediary/requests` a `<Table>` + `<Tabs>`.
- [ ] Migrare `admin/dashboard` a `<Tabs>` + `<Table>`.

### 12.10 P9 — Icone (continuo)

- [ ] Migrazione emoji → lucide per ogni modulo, in coda alle
      migrazioni di pattern.

### 12.11 P10 — A11y globale (continuo)

- [ ] Aggiungere `htmlFor` ai label orfani in tutti i form esistenti.
- [ ] Aggiungere `aria-hidden` alle icone decorative.
- [x] Sostituire tutti i `<div onClick>` rimasti.
      Analisi 2026-06-06: 15 occorrenze totali, 14 sono backdrop modal
      (`<div className="absolute inset-0 bg-black/50" onClick={...} />`,
      pattern React standard per chiusura click-outside, NON anti-pattern).
      1 solo era tab trigger in `admin/dashboard/page.tsx:141` → fixato
      in Fase 12.4 con `<button>` + `aria-label` + `focus-visible:ring`.
- [x] Aggiungere `app/loading.tsx`, `app/error.tsx`, `app/not-found.tsx`.
      Creati in Fase 12.1-12.3 con primitive del design system:
      - `loading.tsx` (server component): `<Spinner size="lg" />` + copy
      - `error.tsx` (client component): `AlertOctagon` lucide + `<Button>`
        reset + Link home
      - `not-found.tsx` (server component): `<EmptyState>` + CTA home

> ✅ **Completata Fase 12 (2026-06-06)**, 4 commit tecnici + 1 docs.
> Vedi [[refactor-state]] § Fase 12 e [[05-known-issues]] § "Anti-pattern
> eliminati in Fase 12". Le sotto-attività `htmlFor` + `aria-hidden`
> restano aperte come Fase 12-bis (continuo, non bloccante per pilota).

---

## Allegato A — Mappa import rapida

```tsx
// Primitives
import {
  Button, Input, Textarea, Select, Checkbox,
  Card, CardHeader, CardTitle, CardContent,
  Badge, Alert, Modal, ModalFooter,
  Spinner, LoadingOverlay,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty,
  Tabs, TabPanel,
  EmptyState, Pagination, Avatar, AvatarGroup,
  Skeleton, SkeletonText, SkeletonCard, SkeletonAvatar,
  ToastProvider, toast,
  Form, Field, TextAreaField, SelectField, useZodForm, useForm, useFormContext,
} from '@/components/ui';

// Icone (sempre named import)
import { Package, AlertCircle, CheckCircle2, X, Plus, ChevronRight } from 'lucide-react';

// Schema validation
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
```

---

**Fine del documento.** Per suggerimenti o correzioni, aprire una PR su
`docs/DESIGN.md` o discutere in chat del team.
