---
name: ui-components-library
description: UI Components Library centralizzata - Button, Input, Card, Badge, Alert, Modal, Spinner
metadata:
  type: reference
---

# UI Components Library

## Principio

Tutti i nuovi componenti UI devono usare la library centralizzata in `src/components/ui/`.
Quando si interviene su una pagina esistente, approfittare del refactoring per sostituire gli elementi inline con i componenti UI.

## Struttura

```
src/components/ui/
├── Button.tsx    — 5 varianti: primary, secondary, danger, warning, ghost
├── Input.tsx     — Input, Textarea, Select, Checkbox con label ed error integrati
├── Card.tsx      — Card, CardHeader, CardTitle, CardContent
├── Badge.tsx     — 6 varianti: default, primary, success, warning, danger, info
├── Alert.tsx     — 4 tipi: success, error, warning, info
├── Modal.tsx     — Modal, ModalFooter con overlay standardizzato
├── Spinner.tsx   — 3 taglie: sm, md, lg + LoadingOverlay
└── index.ts      — esportazioni centralizzate
```

## Componenti

### Button
```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="md" loading={false} disabled={false}>
  Testo
</Button>
```

Varianti: `primary` (default), `secondary`, `danger`, `warning`, `ghost`
Taglie: `sm`, `md` (default), `lg`

### Input
```tsx
import { Input, Textarea, Select, Checkbox } from '@/components/ui';

<Input label="Nome" placeholder="Inserisci nome" error="Campo obbligatorio" />
<Textarea label="Messaggio" rows={4} />
<Select label="Ruolo" options={[{value: 'A', label: 'Opzione A'}]} />
<Checkbox label="Accetto i termini" />
```

### Card
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

<Card variant="bordered" padding="md">
  <CardHeader>
    <CardTitle>Titolo</CardTitle>
  </CardHeader>
  <CardContent>
    Contenuto
  </CardContent>
</Card>
```

### Badge
```tsx
import { Badge } from '@/components/ui';

<Badge variant="success" size="sm">Attivo</Badge>
<Badge variant="warning" pill>Pending</Badge>
```

Varianti: `default`, `primary`, `success`, `warning`, `danger`, `info`
Taglie: `sm`, `md` (default)
Forma: `pill` per rounded-full

### Alert
```tsx
import { Alert } from '@/components/ui';

<Alert type="success" title="Operazione riuscita">
  Messaggio di successo
</Alert>
```

Tipi: `success`, `error`, `warning`, `info`

### Modal
```tsx
import { Modal, ModalFooter } from '@/components/ui';

<Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Titolo">
  Contenuto
  <ModalFooter>
    <Button variant="secondary" onClick={onClose}>Annulla</Button>
    <Button variant="primary" onClick={handleSave}>Salva</Button>
  </ModalFooter>
</Modal>
```

Taglie: `sm`, `md` (default), `lg`, `xl`

### Spinner
```tsx
import { Spinner, LoadingOverlay } from '@/components/ui';

<Spinner size="lg" />
<LoadingOverlay message="Caricamento..." />
```

Taglie: `sm`, `md` (default), `lg`

## Pattern standard stili

### Colori focus
- Usare SEMPRE `focus:ring-primary-500` per elementi interattivi
- Mai `focus:ring-secondary-500`

### Bordi Card
- Usare `border` (default grigio) non `border-gray-100` o `border-gray-200`

### Shadow
- Cards: `shadow-sm` (default)
- Modal: `shadow-xl`

### Z-index
- Modal overlay: `z-50`
- Mobile overlay sidebar: `z-40`

## Refactoring pagine esistenti

Quando si modifica una pagina esistente:
1. Sostituire button inline con `<Button>`
2. Sostituire input con `<Input>`/`<Textarea>`/`<Select>`
3. Sostituire card con `<Card>`
4. Sostituire badge inline con `<Badge>`
5. Sostituire alert inline con `<Alert>`
6. Per modali, valutare se usare `<Modal>`
