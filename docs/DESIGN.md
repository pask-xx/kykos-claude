# KYKOS — Design System

> Contratto visivo e interattivo del progetto KYKOS. Ogni nuova pagina,
> componente o schermata DEVE rispettare queste regole. Le pagine esistenti
> saranno migrate progressivamente, modulo per modulo, seguendo la roadmap
> in fondo al documento.

**Versione**: 1.2 · **Data**: 2026-06-08 · **Owner**: progetto KYKOS
(v1.2 — chiusura P12 colori raw → token semantici, Fase 31. v1.1 —
chiusura P9 sweep globale emoji → lucide in tutta l'app, Fasi 24-28)

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
| `bg-purple-100` / `text-purple-700` | `bg-secondary-100` / `text-secondary-700` |

> **Fase 31 (2026-06-08)**: estensione scala 50-900 completa per
> `success`/`warning`/`error`/`info` in `tailwind.config.ts` + sweep
> globale `src/app/**` per migrazione colori raw → token semantici.
> Vedi §12.13 + [[refactor-state]] § Fase 31.

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
import { Button, Input, Card, Badge, Alert, Modal, ModalFooter, Spinner, LoadingOverlay, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty, Tabs, TabPanel, EmptyState, Pagination, Avatar, AvatarGroup, Skeleton, SkeletonText, SkeletonCard, SkeletonAvatar, ToastProvider, toast, Form, Field, TextAreaField, SelectField, useZodForm, EntityListCard } from '@/components/ui';
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

### 5.16 Switch

Toggle on/off con semantica `role="switch"` WCAG, label visibile e
annunciata screen reader, descrizione opzionale collegata via
`aria-describedby`.

```tsx
import { Switch } from '@/components/ui';

// Base (label obbligatoria, sia visibile sia per aria-label)
<Switch
  checked={printLabel}
  onChange={setPrintLabel}
  label="Abilita stampa etichetta"
/>

// Con helper text (consigliato per toggle con effetto complesso)
<Switch
  checked={autoApprove}
  onChange={setAutoApprove}
  label="Approvazione automatica"
  description="Le richieste verranno approvate senza intervento operatore"
/>

// Con loading (chiamata API in corso, disabilitato automaticamente)
<Switch
  checked={enabled}
  onChange={handleToggle}
  label="Funzione X"
  loading={isSaving}
/>
```

**Differenza da `<Checkbox>`**:
- `<Switch>` = effetto immediato al click (PATCH on-change).
- `<Checkbox>` = scelta che diventa effettiva al submit del form.
- KYKOS usa `<Switch>` per toggle operator (auto-approve, canProvide*, canRequest*).

**Scelte implementative**:
- Token semantici: `bg-success-500` (acceso) / `bg-gray-300` (spento) dalla palette DESIGN.md §3.
- Target size 44×24px (h-6 w-11) con knob 20×20px: WCAG 2.5.5 ≥ 24px rispettato.
- Focus ring `focus:ring-2 focus:ring-primary-500 focus:ring-offset-2` (stessa convenzione di `<Button>`).
- Label resa come `<label htmlFor={id}>` esterno al button → click sulla label attiva il toggle (pattern standard checkbox/switch).
- Knob span `aria-hidden="true"` (eredita pattern Fase 22.2).
- `useId()` di React per id univoco (stessa regola di Fase 20).

**Anti-pattern vietato**: scrivere un toggle custom con `<button role="switch">`. Usare sempre `<Switch>`. La primitive esiste dal 2026-06-08 (Fase 23) e sostituisce ~13 occorrenze del pattern custom introdotto temporaneamente in Fase 22.2.

### 5.17 EntityListCard

Card orizzontale cliccabile per liste generiche con icona + titolo + slot
opzionali (`badgesTop`, `meta`, `description`, `footer`). Risolve il bug
mobile "titolo troncato dai badge" (header `flex-col` su mobile, `flex-row
justify-between` su desktop, `flex-wrap` interno ai badge).

```tsx
import { EntityListCard } from '@/components/ui';

<EntityListCard
  icon={<Package className="w-7 h-7 sm:w-8 sm:h-8 text-gray-700" aria-hidden="true" />}
  title={obj.title}
  badgesTop={
    <>
      <Badge variant="info" size="sm">Bene</Badge>
      <Badge variant="success">Approvata</Badge>
    </>
  }
  meta="Richiesta da mario • 1g"
  description={obj.description}
  href={`/operator/requests-entity/${obj.id}`}
  onNavigate={() => sessionStorage.setItem('backUrl', '/operator/requests-entity')}
  footer={<Button variant="primary" size="sm">Stampa etichetta</Button>}
/>
```

**Comportamento wrapper** (gestito dalla primitive):

| Slot passati | Wrapper | Note |
|---|---|---|
| `href` (senza `footer`) | `<Link>` con hover border | Caso standard |
| `href` + `footer` | `<article>` + `<Link>` interno header + footer esterno | Bottone footer FUORI dal link (no `stopPropagation`) |
| Solo `footer` (no `href`) | `<article>` | Card statica con azione inline |
| Nessuno | `<div>` | Card statica |

**Anti-pattern vietato**: scrivere una card lista orizzontale con `<Link
className="flex gap-4">` custom o `<div onClick>` (vietato da §11). Usare
sempre `<EntityListCard>`. La primitive esiste dal 2026-06-23 (Fase XYZ)
e sostituisce il pattern custom presente in 3 pagine operator
(`requests-entity`, `deposit`, `diocese-objects`).

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

- ~~`ConfirmDialog.tsx:40` — `<div onClick>` per trigger.~~ ✅ Migrato in Fase 8.2.
- ~~`SendMessageDialog.tsx:63` — idem.~~ ✅ Migrato in Fase 8.3.
- ~~`admin/dashboard/page.tsx:152` — tab come `<div onClick>`.~~ ✅ Migrato in Fase 16.3.
- ~~10 file usano `window.alert()`.~~ ✅ Tutti migrati a `toast.error` in Fasi 10.

Tutti i sotto-anti-pattern a11y noti sono stati chiusi. Nuovi audit vanno
fatti al bisogno (es. su moduli aggiunti dopo il refactor pre-pilota).

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
| `<div onClick={...}>` per azione (tab trigger, card cliccabile) | `<button onClick={...}>` o `<Button>` + `aria-label` + `focus-visible:ring`. Per card lista orizzontali: `<EntityListCard href=...>` (vedi §5.17). |
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

- [x] Migrare le 5 pagine `operator/street-beneficiaries/**` (già
      parzialmente allineate) a `<Form>` + zod.
      ✅ **P4 completato in Fase 19** (2026-06-08): audit rivela che
      `BeneficiaryForm.tsx` (Fase 7) è già il pattern canonico Form+zod
      riusato da `street-beneficiaries/page.tsx` + `[id]/edit/page.tsx`,
      e `requests/new/page.tsx` ha il suo form Form+zod dedicato.
      Sub-residuo chiuso: token semantici `bg-green-100`/`bg-purple-100` →
      `bg-success-100`/`bg-secondary-100` in `[id]/page.tsx` +
      `street-to-deliver/page.tsx` (4 occorrenze totali).
- [x] Validare come "modello di riferimento" per gli altri moduli.
      Vedi [[refactor-state]] § Fase 19.

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
- [x] Migrare `operator/operators` a `<Table>`
      (Fase 17.1, 2026-06-08). Table primitive 6-col, activeBadge +
      operatorTypeBadge mappers, Badge variant="primary" con
      OPERATOR_ROLE_LABELS, Button variant="primary" size="sm"
      "Gestisci", EmptyState icon={Users}, Alert type="error" per
      banner errore, Spinner size="lg", res.json().catch(()=>({})) + toast.error.
- [x] Migrare `operator/volunteers` a `<Table>` + `<Tabs>`
      (Fase 17.2, 2026-06-08). Layout a sezioni con card (azioni diverse
      per pending/approved, Table inadatta), Modal primitive per
      conferma (sostituisce <div onClick> backdrop), 2 EmptyState
      icon={CheckCircle2/HandHeart}, 3 Button variant (success/danger/
      secondary) con loading, CONFIG table ACTION_TITLE/ACTION_BUTTON_VARIANT/
      ACTION_SUCCESS_MESSAGE per type safety, 2 Badge count
      warning/success, 4 emoji 🤝💬📄 → lucide (Handshake/MessageSquare/
      FileText), ArrowLeft per back, Alert type="error" banner, Spinner
      size="lg", res.json().catch + toast.success/errore aggiunti.

> ✅ **P5 completato in Fase 13+17** (6/6 file, 2026-06-08), 6 commit
> atomici su staging (4 in Fase 13 + 2 in Fase 17). Vedi
> [[refactor-state]] § Fase 13 e § Fase 17.

### 12.7 P6 — Modulo donor/* (3-4 commit)

- [x] Migrare `donor/objects` a `<Card>` grid + `<EmptyState>`
      (Fase 14.1, 2026-06-07). Card grid mantenuto, Tabs filtro
      (disponibili/tutti con counts), Badge 6 status incluso BLOCKED.
- [x] Migrare `donor/requests` a `<Tabs>` + griglia
      (Fase 14.2, 2026-06-07). Tabs (oggetti/beni-servizi con counts),
      Badge 8 status request + 6 status object, console.log debug rimossi.
- [x] Migrare `donor/dashboard` (DonorRequestsClient) a skeleton
      (Fase 14.3, 2026-06-07). 2 `<div onClick>` toggle espansi migrati
      a `<button>`, banner bg-{color}-50 → `<Alert type>`, Textarea/Button
      primitive, emoji → lucide.
- [x] Migrare `donor/statistics` a skeleton
      (Fase 14.4, 2026-06-07). 5 card → `<Card primitive>`, status badge +
      donor level badge → mapper, 5 emoji → lucide.

> ✅ **P6 completato in Fase 14** (4/4 file, 2026-06-07), 4 commit atomici
> su staging. Vedi [[refactor-state]] § Fase 14.

### 12.8 P7 — Modulo recipient/* (3-4 commit)

- [x] Migrare `recipient/objects` a `<Card>` grid + `<EmptyState>`
      (Fase 15.1, 2026-06-08). Select filtro categoria da `<button>` × 8
      a primitive `<Select options>`, `<Input>` search, 4 Badge status
      request (PENDING/APPROVED/REJECTED/CANCELLED), EmptyState con action,
      Spinner, Button variant (warning annulla, success/danger/secondary
      disabled per stato), console.error → toast.error.
- [x] Migrare `recipient/requests` a `<Tabs>` + `<EmptyState>`
      (Fase 15.2, 2026-06-08). Tabs filtro (tutte/attive/completate) con
      counts, 2 mapper Badge (4 request status + 5 object status),
      Alert type="error" + Button Riprova, EmptyState con CTA, Spinner,
      Button success con QrCode per ritiro.
- [x] Migrare `recipient/requests-entity/requests` a `<Table>` (inteso
      card unificata) (Fase 15.3, 2026-06-08). Vista unificata GOODS/
      SERVICES/AVAILABLE: 3 mapper Badge (object 5 + entity request 6 +
      itemType 3), border-l-4 colorato per tipo (preservato come
      semantica), EmptyState icon={ClipboardList}, Spinner, Button
      primary con lucide Plus, Badge con lucide Mail per pending offers.
- [x] Migrare `recipient/my-objects` a `<Card>` grid
      (Fase 15.4, 2026-06-08). objectStatusBadge mapper (6 status),
      Badge variant="default" categoria, EmptyState con action Button
      primary, Spinner, Button primary con lucide Plus, console.error
      → toast.error.

> ✅ **P7 completato in Fase 15** (4/4 file, 2026-06-08), 4 commit atomici
> su staging. Vedi [[refactor-state]] § Fase 15.

### 12.9 P8 — Modulo intermediary/* e admin/* (2-3 commit)

- [x] Migrare `intermediary/recipients` a `<Table>`
      (Fase 16.1, 2026-06-08). Table/TableHeader/TableBody/TableRow/
      TableHead/TableCell primitive, Badge mapper (2 stati authorized),
      Button variant="success"/"danger" size="sm", Input per search,
      2 EmptyState icon={Users}/{SearchX}, Spinner, banner
      `setMessage` (success/error) → toast.*, h1 standard.
- [x] Migrare `intermediary/requests` a `<Table>` + `<Tabs>`
      (Fase 16.2, 2026-06-08). requestStatusBadge mapper (4 stati
      PENDING/APPROVED/REJECTED/EXPIRED), Button variant
      success/danger size="sm", EmptyState icon={Inbox}, Spinner,
      console.error → toast.error, toast.success aggiunto su OK
      (era mancante), 2 emoji 📦 → lucide Package, sezioni
      "In attesa"/"Elaborate" con lucide ClipboardList, layout a card
      8-col mantenuto (azioni inline per riga, Table inadatta).
- [x] Migrare `admin/dashboard` a `<Tabs>` + `<Table>`
      (Fase 16.3, 2026-06-08). Tabs<TabKey> con count, Modal primitive
      per conferma adesione (sostituisce <div onClick> backdrop),
      ModalFooter con Button loading, 2 EmptyState icon={Inbox},
      verifiedBadge + adesioneStatusBadge mappers, Button variant
      success/danger/secondary, 4 stat card emoji → lucide
      (CheckCheck/Clock/ClipboardList/Building2), 3 emoji inline →
      lucide (Package/ClipboardList/AlertTriangle), Spinner × 2,
      banner actionError inline bg-red-50 → Alert type="error",
      banner ⚠️ email non confermata → Alert type="warning" con
      lucide AlertTriangle, token semantici bg-{success|warning|
      info|primary}-100/text-{...}-600.

> ✅ **P8 completato in Fase 16** (3/3 file, 2026-06-08), 3 commit atomici
> su staging. Vedi [[refactor-state]] § Fase 16.

### 12.10 P9 — Icone (continuo)

- [x] Migrazione emoji → lucide per ogni modulo, in coda alle
      migrazioni di pattern.
      ✅ **P9 completato in Fasi 18 + 24-28** (commit cumulativi 18.1-18.3d
      in Fase 18 per i moduli coperti, poi sweep globale Fasi 24-28
      per TUTTE le pagine rimanenti: dashboard Sidebar, OperatorSidebar,
      operator/requests-entity, operator/deposit, operator/donors,
      operator/recipients, operator/objects, operator/pickup, operator
      resto, public pages, donor/*, recipient/*, intermediary/*,
      admin/* + volunteer/* + auth/* + login/* + objects/*).
      Vedi [[refactor-state]] § Fasi 24-28 per migration tables.

### 12.11 P10 — A11y globale (continuo)

- [x] Aggiungere `htmlFor` ai label orfani in tutti i form esistenti.
      Analisi 2026-06-06 → completata in **Fase 20** (5 commit atomici):
      - 20.1: auth/* + shared components (5 file, 9 orfani)
      - 20.2: operator/* (12 file, ~30 orfani)
      - 20.3: admin + intermediary + donor + recipient + volunteer
        (10 file, ~50 orfani)
      Pattern canonico: `useId()` di React per id univoci + singolo input
      con `<label htmlFor={id}>` + `id={id}`, gruppi (ImageUploader,
      radiogroup, checkbox group, file picker custom) con
      `<span id>` + `<div role="radiogroup"|aria-labelledby>`. Vedi
      [[refactor-state]] § Fase 20.
- [x] Aggiungere `aria-hidden` alle icone decorative.
      Analisi 2026-06-08 → **completata in Fasi 15-18 + Fase 21** (misto).
      Le Fasi 15 (recipient), 16 (intermediary + admin), 18.3 (auth +
      volunteer) hanno introdotto `aria-hidden="true"` contestualmente
      alla sostituzione emoji → lucide. La Fase 21 ha chiuso i
      sotto-residui: 21.2 (PasswordChangeForm + NotificationBell),
      21.3 (operator/* + qr/*, 12 file), 21.4 era già completa.
      Scope totale: ~80 icone decorative. Vedi [[refactor-state]]
      § Fase 21 per la migration table completa.
      Regola operativa: TUTTE le icone lucide introdotte da ora in poi
      DEVONO avere `aria-hidden="true"` se affiancate a testo leggibile.
      Le primitive `<EmptyState icon={X}>` e `<Alert>` con icone di
      default wrappano automaticamente.
- [x] Aggiungere `aria-label` a icon-button funzionali.
      Analisi 2026-06-08 → **completata in Fase 22** (3 commit atomici):
      - 22.1: 5 file, 11 aria-label (ImageGallery prev/next/close,
        ImageUploader remove, InstallAppBanner close, dashboard
        Sidebar apri/chiudi + 4 link, OperatorSidebar apri/chiudi)
      - 22.2: 3 file, 7 toggle con `role="switch"` + `aria-checked` +
        `aria-label` (operator/organization × 4, operator/donors/[id]
        × 1, operator/recipients/[id] × 2)
      - 22.3: 10 file, 12 fix (modali one-off ✕ con span aria-hidden,
        image picker remove, button icona isolati in cause/deposit/
        availability)
      Pattern canonico: ogni `<button>` con solo contenuto visivo
      (icona, ✕, emoji) DEVE avere `aria-label` descrittivo
      dell'azione. Per i toggle, aggiungere `role="switch"` +
      `aria-checked={state}`. Il contenuto visivo interno
      (`<span aria-hidden="true">✕</span>`, `<svg aria-hidden="true">`)
      evita doppia lettura screen reader.
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

> ✅ **P10 completata in Fasi 12 + 20 + 21 + 22 (2026-06-06 → 2026-06-08)**.
> Sotto-attività `htmlFor` chiusa in Fase 20 (4 commit), `<div onClick>`
> fixato in Fase 12.4, `app/loading|error|not-found` creati in Fase 12.
> Sotto-attività `aria-hidden` chiusa in Fasi 15-18 (prevalentemente) +
> Fase 21 (residui). Sotto-attività `aria-label` su icon-button
> funzionali + `role="switch"` su toggle chiusa in Fase 22 (3 commit).
> **Fase 23 (2026-06-08)**: estratta primitive `<Switch>` dedicata
> (§5.16) per sostituire il pattern custom introdotto in Fase 22.2.
> Vedi [[refactor-state]] § Fasi 12, 20, 21, 22, 23 e [[05-known-issues]]
> § "Anti-pattern eliminati in Fase 20/21/22".

### 12.12 P9-bis — Sweep globale emoji → lucide su TUTTA l'app (2026-06-08) ✅

Audit finale `src/app/**/*.tsx` per emoji residue in markup JSX. Risultato
post-Fase 18: ~190 emoji rimanenti in pagine non ancora coperte dalla
migrazione iniziale. **13 commit atomici** sulle Fasi 24-28 hanno
chiuso il debito, ~190 emoji sostituiti con icone lucide + `aria-hidden`
dove appropriato.

| Fase | Scope | File | Commit |
|------|-------|------|--------|
| 24 | Dashboard + Operator sidebar (inizio sweep) | 2 file | `7e9d8d5`, `26fb114` |
| 25 | operator/requests-entity | 3 file | `c55dbf8` |
| 26 | operator/deposit | 1 file | `85de7ac` |
| 27.1-27.5 | operator/* residuo (donors, recipients, objects, pickup, resto) | ~25 file | `521d9b1`, `accf171`, `82d2a4f`, `1b13f86`, `b16b385` |
| 28.1 | Pagine pubbliche (landing, aderisci, faq, cookie, legal, ecc.) | 9 file | `32ff9a0` |
| 28.2-28.5 | donor + recipient + intermediary + admin/volunteer/auth/login/objects | ~25 file | `9693058`, `f266a7e`, `574113d`, `e8b4e39` |

**Pattern aggiuntivi introdotti** (oltre a quelli di Fase 18):

1. **`aria-pressed` su radio button con icona** (es.
   `recipient/requests-entity/requests/new/page.tsx` per tipo Bene/Servizio
   + 8 categorie): i `<button>` con `aria-pressed={state}` che wrappano
   un'icona + label testuale sono correttamente annunciati dagli screen
   reader come "toggle premuto/non premuto". Pattern nativo per
   radio group icon-based, alternativo a `<input type="radio">` invisibile.

2. **`Loader2 + animate-spin` per spinner** (es. `intermediary/profile`,
   `auth/register`, `admin/intermediaries/new`): per sostituire emoji
   🔄 usata come spinner inline in button/label. Pattern:
   ```tsx
   <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
   ```
   Alternativa alla primitive `<Spinner size="sm">` quando serve restare
   inline in un button/label senza alterare il layout.

3. **Mappatura contestuale `Record<category, LucideIcon>` con `type LucideIcon`**
   (es. `donor/goods-requests`, `recipient/requests-entity/requests`): per
   refactor di strutture dati `{ icon: '📦' }` → `{ icon: Package }`.
   Tipizzazione:
   ```tsx
   import { ..., type LucideIcon } from 'lucide-react';
   const icons: Record<string, LucideIcon> = {
     FURNITURE: Sofa, ELECTRONICS: Smartphone, ...
   };
   const Icon = icons[category] || Package;
   ```
   Il `type LucideIcon` (NON `React.ComponentType<{className?; 'aria-hidden'?}>`)
   è la firma canonica di lucide-react — type-safe e tree-shakeable.

4. **Icone contestuali di dominio** (sostituzioni semanticamente precise):
   - `🖨️` → `Printer` (operator/deposit stampa etichette)
   - `💰` → `HandCoins` (intermediary/dashboard finanziamenti)
   - `📡` → `SatelliteDish` (intermediary/profile geolocalizzazione)
   - `🏠` → `House` (intermediary/profile ente)
   - `📊` → `BarChart3` (intermediary/recipients statistiche)
   - `⏳` → `Hourglass` (recipient/objects stato in attesa)
   - `🖨️` → `Printer`, `🔍` → `Search` (ricorrenti)

5. **Mappatura `inline-flex items-center gap-1` per icona + label inline**
   (es. `recipient/objects/[id]` con status ✓ Approvata, ✗ Rifiutata):
   per allineare visivamente icona e testo inline senza usare margin o
   padding custom. Pattern Tailwind standard per qualsiasi associazione
   `Icon + text` su stessa riga.

**Audit finale post-Fase 28.5**:
- Grep `src/app/**/*.tsx` per emoji unicode (range U+1F300-U+1FAFF, U+2600-U+27BF)
  → 0 risultati in markup JSX.
- Residui SOLO in commenti (`route.ts`, `error.tsx`, `not-found.tsx`) —
  non in markup, non impattano UX né accessibilità.
- Tutti i file `.tsx` dell'app ora usano SOLO icone lucide-react con
  `aria-hidden="true"` corretto (decorative) o `aria-label` adeguato
  (funzionali in button icon-only, già wrappati in Fase 22).

**Anti-pattern chiuso definitivamente** (vedi [[05-known-issues]]
§ "Anti-pattern eliminati in Fase 18 / Fasi 24-28"):
- Emoji come unica label/icon in produzione → VIETATO ovunque.
- Emoji come decorazione inline (es. `<h1>👋 Ciao</h1>`) → rimosso
  (testo heading è sufficiente) o sostituito con lucide.
- Emoji in `<button className="bg-primary-600">` raw → Button primitive
  + `leftIcon` lucide.

**Regola operativa consolidata**:
- MAI scrivere emoji in nuovi componenti KYKOS. Se serve un'icona,
  importare da `lucide-react` con `aria-hidden="true"` se decorativa.
- Per mappatura rapida emoji → lucide vedi [[05-known-issues]]
  § "Anti-pattern eliminati in Fase 18" (lista esaustiva).
- Vedi [[refactor-state]] § Fasi 24-28 per le migration tables complete
  e le lezioni architetturali apprese.

### 12.13 P12 — Colori raw → token semantici (2026-06-08) ✅

**Audit iniziale** (Fase 31.1): 526 occorrenze di colori Tailwind raw
(`bg|text|border|ring|from|to|via|placeholder|...|divide-(red|green|amber|blue|purple|yellow|teal|indigo|emerald|sky|lime|rose|orange|fuchsia|pink|cyan|violet)-\d+`)
in 73 file `.tsx` dell'app. Scope completo per la chiusura di P12.

**Mappatura canonica** (estesa da §2.2, ora con scala 50-900 completa):

| Raw | Token semantico | Note |
|-----|-----------------|------|
| `bg-red-` / `text-red-` / `border-red-` | `bg-error-` / `text-error-` / `border-error-` | errore, danger, rosso |
| `bg-green-` / `text-green-` / `border-green-` | `bg-success-` / `text-success-` / `border-success-` | successo, conferma, verde |
| `bg-amber-` / `text-amber-` / `border-amber-` | `bg-warning-` / `text-warning-` / `border-warning-` | warning, attesa, giallo |
| `bg-blue-` / `text-blue-` / `border-blue-` | `bg-info-` / `text-info-` / `border-info-` | info, link, blu |
| `bg-purple-` / `text-purple-` / `border-purple-` | `bg-secondary-` / `text-secondary-` / `border-secondary-` | secondario, viola |
| `gray-`, `primary-`, `secondary-` | invariati | gray=neutro, primary/secondary=già token |

**Estensione `tailwind.config.ts`** (Fase 31.1): aggiunte scale 300, 400, 800
a tutti i token semantici (`success`, `warning`, `error`, `info`) per
supportare TUTTE le occorrenze esistenti (es. `text-red-500`, `border-amber-300`,
`bg-green-800`). Valori hex allineati 1:1 con le palette Tailwind default,
quindi la migrazione NON altera la resa visiva.

**Pattern tipici migrati** (dalla pilot migration `intermediary/recipients/[id]`):

```tsx
// ❌ PRIMA (raw)
<div className="bg-green-50 text-green-700">  // messaggio successo
  <CheckCircle2 className="text-green-600" aria-hidden="true" />
</div>
<div className="w-12 h-12 bg-green-100 rounded-lg">  // sfondo status
  <Hourglass className="text-amber-600" aria-hidden="true" />
</div>
<button className="bg-red-600 hover:bg-red-700 text-white">  // bottone danger
  Revoca
</button>
<button className="bg-green-600 hover:bg-green-700 text-white">  // bottone success
  Autorizza
</button>

// ✅ DOPO (token semantici)
<div className="bg-success-50 text-success-700">
  <CheckCircle2 className="text-success-600" aria-hidden="true" />
</div>
<div className="w-12 h-12 bg-success-100 rounded-lg">
  <Hourglass className="text-warning-600" aria-hidden="true" />
</div>
<button className="bg-error-600 hover:bg-error-700 text-white">
  Revoca
</button>
<button className="bg-success-600 hover:bg-success-700 text-white">
  Autorizza
</button>
```

**Fase 31.1 pilot** (commit `db8ed51`): `tailwind.config.ts` esteso +
1 file pilot (`intermediary/recipients/[id]`, 6 occorrenze) per validare
l'approccio. Test verdi.

**Fase 31.2-31.4** (in corso): migrazione massiva in 3 batch paralleli
(operator/* + resto), ~520 occorrenze restanti. Stima: 3-5 commit atomici.

**Audit finale post-Fase 31**: grep `bg|text|border|ring|...-(red|green|amber|blue|purple|yellow|teal|indigo|emerald|sky|lime|rose|orange|fuchsia|pink|cyan|violet)-\d+` in `src/app/**` → 0 risultati.

**Regola operativa consolidata** (per refactor futuri):
- MAI scrivere colori Tailwind raw in nuovi componenti KYKOS. SEMPRE
  usare `success` / `warning` / `error` / `info` / `secondary`.
- Eccezione legittima: `gray-{N}` per testi/neutri, `primary-{N}` per
  brand/CTA (già token semantici).
- Per `border-red-200`, `text-red-600`, `bg-error-50`, ecc.: usare SEMPRE
  i token semantici corrispondenti.
- Le occorrenze in URL/stringhe/commenti NON vanno toccate (sono dati,
  non styling).
- Vedi [[05-known-issues]] § "Anti-pattern eliminati in Fase 31" e
  [[refactor-state]] § Fase 31 per le migration tables complete.

**Why**: il design system KYKOS ha 6 token semantici (`primary`,
`secondary`, `success`, `warning`, `error`, `info`) + `gray` per neutri.
L'uso di colori Tailwind raw (`red`, `green`, `amber`, `blue`, `purple`)
rende impossibile evolvere la palette senza un search-and-replace globale.
Migrare ai token semantici sblocca: (1) cambio palette centralizzato in
`tailwind.config.ts`, (2) lettura semantica immediata del codice
(`bg-error-50` è autoesplicativo vs `bg-red-50`), (3) conformità alla
regola del design system "codice nuovo usa SOLO token semantici".
La scala 50-900 completa è necessaria per supportare tutte le occorrenze
esistenti senza impatto visivo (i valori hex sono identici).

**How to apply**:
- Per refactor di pagine esistenti: usare la mappa canonica sopra.
- Per codice nuovo: usare SOLO `bg-{success|warning|error|info|secondary|primary|gray}-{50..900}`.
- Se serve un nuovo tono: aggiungerlo in `tailwind.config.ts` prima di usarlo.
- Vedi [[refactor-state]] § Fase 31 per dettagli implementativi.

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
  Switch,
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
