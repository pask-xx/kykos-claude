// UI Components Library
// Centralizzato per coerenza stili in tutto il progetto.
// Vedi docs/DESIGN.md per il contratto completo del design system.

export { Button } from './Button';
export type { ButtonProps } from './Button';

export { Input, Textarea, Select, Checkbox } from './Input';
export type { InputProps, TextareaProps, SelectProps, CheckboxProps } from './Input';

export { Card, CardHeader, CardTitle, CardContent } from './Card';
export type { CardProps } from './Card';

export { Badge } from './Badge';
export type { BadgeProps } from './Badge';

export { Alert } from './Alert';
export type { AlertProps } from './Alert';

export { Modal, ModalFooter } from './Modal';
export type { ModalProps, ModalFooterProps } from './Modal';

export { Spinner, LoadingOverlay } from './Spinner';

// Aggiunti con il design system (vedi docs/DESIGN.md)
export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from './Table';
export { Tabs, TabPanel } from './Tabs';
export type { TabItem, TabsProps } from './Tabs';
export { EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';
export { Pagination } from './Pagination';
export type { PaginationProps } from './Pagination';
export { Avatar, AvatarGroup } from './Avatar';
export type { AvatarProps, AvatarSize } from './Avatar';
export { Skeleton, SkeletonText, SkeletonCard, SkeletonAvatar } from './Skeleton';
export { ToastProvider, toast } from './Toast';
export { Switch } from './Switch';
export type { SwitchProps } from './Switch';
export {
  Form,
  Field,
  TextAreaField,
  SelectField,
  useZodForm,
  useForm,
  useFormContext,
} from './Form';

export { SectionDivider } from './SectionDivider';
export type { SectionDividerProps } from './SectionDivider';
export { Accordion } from './Accordion';
export type { AccordionProps } from './Accordion';
export { EntityListCard } from './EntityListCard';
export type { EntityListCardProps } from './EntityListCard';
