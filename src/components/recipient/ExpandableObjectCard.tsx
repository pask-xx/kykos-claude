'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Send, Package, AlertTriangle } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import { CATEGORY_LABELS, CONDITION_LABELS, RequestStatus } from '@/types';
import { levelIconMap } from '@/lib/level-icons';
import type { DonorLevel } from '@/types';

/**
 * Card orizzontale espandibile per oggetti recipient.
 *
 * Estratta dal pattern di RecipientFeedClient (regola Fase 31.7) per allineare
 * /recipient/dashboard, /recipient/objects e /recipient/my-objects sullo stesso
 * pattern grafico. Stato di espansione controllato dal parent.
 *
 * Pattern collapsed: image 96x96 a sx, info a dx, ChevronDown rotate on expand.
 * Pattern expanded: galleria orizzontale + descrizione + condizione + data +
 * (opzionale) input messaggio + bottoni Richiedi/Segnala/Annulla/Cancella.
 *
 * **Accessibilità** (regola del 05-known-issues):
 * - Toggle usa `<button>` con `aria-expanded` e label sr-only (NO `<div onClick>`).
 * - Icone sono `aria-hidden="true"` (decorazioni, label nel testo adiacente).
 * - Livello donatore: `<span class="sr-only">` per screen reader.
 *
 * **Anonymity** (regola 01-core-principles):
 * - `level` (badge donatore) è mostrato SOLO per oggetti altrui (passato dal parent).
 * - Su /recipient/my-objects NON passare `level`: l'utente non vede il proprio
 *   livello come badge di fiducia verso sé stesso.
 * - NON mostrare MAI link a /donor/* da qui: solo link a /recipient/objects/[id].
 */
export interface ExpandableObjectCardObject {
  id: string;
  title: string;
  description: string | null;
  category: string;
  condition: string;
  imageUrls: string[] | null;
  status?: string;
  createdAt: string;
  depositLocation?: string | null;
  _count?: { requests: number };
}

export interface ExpandableObjectCardRequest {
  id: string;
  status: RequestStatus;
}

export interface ExpandableObjectCardProps {
  object: ExpandableObjectCardObject;
  /** Livello donatore (opzionale). Se passato, mostra icona livello. NON passare in my-objects. */
  level?: DonorLevel | null;
  /** Stato espansione controllato dal parent. */
  isExpanded: boolean;
  onToggle: () => void;
  /** Richiesta già effettuata dall'utente (opzionale). Se presente, mostra stato. */
  userRequest?: ExpandableObjectCardRequest | null;
  /** Mostra bottone "Richiedi" (default true). */
  showRequestButton?: boolean;
  /** Mostra bottone "Segnala" (default true). */
  showReportButton?: boolean;
  /** Mostra input messaggio opzionale sopra il bottone Richiedi (default true). */
  showRequestMessageInput?: boolean;
  /** Mostra contatore "N richieste" ricevute (default true). */
  showRequestCount?: boolean;
  /** Slot informativo addizionale sotto la descrizione (es. "Ente: X" su /recipient/objects). */
  extraInfo?: React.ReactNode;
  /** Stato di invio richiesta. */
  requesting?: boolean;
  /** Handler click Richiedi (con messaggio opzionale). */
  onRequest?: (objectId: string, message: string) => void;
  /** Handler click Annulla richiesta esistente. */
  onCancelRequest?: (requestId: string) => void;
  /** Handler click Segnala. */
  onReport?: (objectId: string) => void;
  /** Handler click thumbnail (apre lightbox). Se null, thumbnail non sono cliccabili. */
  onImageClick?: (objectId: string, index: number) => void;
  /** Handler click "Cancella disponibilità" (solo per oggetti propri, AVAILABLE). */
  onCancel?: (objectId: string) => void;
  /** Se true, mostra il link "Vedi dettaglio" → /recipient/objects/[id]. Default false. */
  showDetailLink?: boolean;
}

const conditionLabel = (cond: string) =>
  CONDITION_LABELS[cond as keyof typeof CONDITION_LABELS] || cond;

export function ExpandableObjectCard({
  object,
  level,
  isExpanded,
  onToggle,
  userRequest,
  showRequestButton = true,
  showReportButton = true,
  showRequestMessageInput = true,
  showRequestCount = true,
  extraInfo,
  requesting = false,
  onRequest,
  onCancelRequest,
  onReport,
  onImageClick,
  onCancel,
  showDetailLink = false,
}: ExpandableObjectCardProps) {
  const messageId = useId();
  const [message, setMessage] = useState('');

  const levelEntry = level ? levelIconMap[level] : null;
  const requestCount = object._count?.requests ?? 0;
  const hasImages = object.imageUrls && object.imageUrls.length > 0;

  const handleRequestClick = () => {
    onRequest?.(object.id, message);
    setMessage('');
  };

  const handleCancelRequestClick = () => {
    if (userRequest) onCancelRequest?.(userRequest.id);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-200">
      {/* Collapsed — toggle button semantico */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={`expanded-${object.id}`}
        className="w-full text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-xl"
      >
        <div className="flex gap-4 p-4">
          {/* Image */}
          <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
            {hasImages ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={object.imageUrls![0]}
                alt={object.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Package className="w-12 h-12" aria-hidden="true" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{object.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                {CATEGORY_LABELS[object.category as keyof typeof CATEGORY_LABELS] || object.category}
              </span>
              {levelEntry && (
                <>
                  <levelEntry.Icon className={levelEntry.className} aria-hidden="true" />
                  <span className="sr-only">{levelEntry.label}</span>
                </>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(object.createdAt).toLocaleDateString('it-IT')}
              {showRequestCount && requestCount > 0 && (
                <span className="ml-2 text-amber-600">
                  • {requestCount} richiesta{requestCount !== 1 ? 'e' : ''}
                </span>
              )}
            </p>
          </div>

          {/* Expand icon */}
          <div className="flex-shrink-0 flex items-center">
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </div>
        </div>
      </button>

      {/* Expanded panel */}
      {isExpanded && (
        <div
          id={`expanded-${object.id}`}
          className="border-t border-gray-100 p-4 bg-gray-50 space-y-4"
        >
          {/* Gallery */}
          {hasImages && object.imageUrls!.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {object.imageUrls!.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onImageClick?.(object.id, i)}
                  className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg overflow-hidden"
                  aria-label={`Immagine ${i + 1} di ${object.title}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`${object.title} - ${i + 1}`}
                    className="w-32 h-32 object-cover hover:opacity-90 transition-opacity"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Description */}
          {object.description && <p className="text-gray-600">{object.description}</p>}

          {/* Details */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-gray-500">Condizione:</span>
              <span className="ml-1 font-medium text-gray-700">{conditionLabel(object.condition)}</span>
            </div>
            <div>
              <span className="text-gray-500">Pubblicato:</span>
              <span className="ml-1 font-medium text-gray-700">
                {new Date(object.createdAt).toLocaleDateString('it-IT')}
              </span>
            </div>
            {object.depositLocation && (
              <div>
                <span className="text-gray-500">Posizione deposito:</span>
                <span className="ml-1 font-medium text-gray-700">{object.depositLocation}</span>
              </div>
            )}
          </div>

          {/* Extra info slot */}
          {extraInfo}

          {/* Request message input (solo se non ho già richiesto e input abilitato) */}
          {showRequestMessageInput && showRequestButton && !userRequest && onRequest && (
            <div>
              <label
                htmlFor={messageId}
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Messaggio opzionale (presentati brevemente)
              </label>
              <textarea
                id={messageId}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none text-sm"
                placeholder="Scrivi un messaggio all'ente..."
              />
            </div>
          )}

          {/* Action buttons */}
          {(showRequestButton || showReportButton || onCancel) && (
            <div className="flex flex-wrap gap-3">
              {/* Richiedi / Annulla richiesta */}
              {showRequestButton && onRequest && (
                <>
                  {userRequest ? (
                    userRequest.status === 'PENDING' ? (
                      <button
                        type="button"
                        onClick={handleCancelRequestClick}
                        className="flex-1 py-3 bg-warning-500 text-white rounded-lg font-medium hover:bg-warning-600 transition-colors"
                      >
                        Annulla richiesta
                      </button>
                    ) : (
                      <div
                        className={`flex-1 py-3 rounded-lg font-medium text-center text-sm ${
                          userRequest.status === 'APPROVED'
                            ? 'bg-success-50 text-success-700 border border-success-200'
                            : userRequest.status === 'REJECTED'
                            ? 'bg-error-50 text-error-700 border border-error-200'
                            : 'bg-gray-50 text-gray-700 border border-gray-200'
                        }`}
                      >
                        {userRequest.status === 'APPROVED'
                          ? 'Richiesta approvata'
                          : userRequest.status === 'REJECTED'
                          ? 'Richiesta rifiutata'
                          : 'Già richiesto'}
                      </div>
                    )
                  ) : (
                    <ConfirmDialog
                      title="Conferma richiesta"
                      message="Sei sicuro di voler richiedere questo oggetto?"
                      confirmLabel="Sì, richiedi"
                      variant="warning"
                      onConfirm={handleRequestClick}
                    >
                      <button
                        type="button"
                        disabled={requesting}
                        className="flex-1 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                      >
                        <Send className="w-4 h-4" aria-hidden="true" />
                        {requesting ? 'Invio...' : 'Richiedi questo oggetto'}
                      </button>
                    </ConfirmDialog>
                  )}
                </>
              )}

              {/* Segnala */}
              {showReportButton && onReport && (
                <button
                  type="button"
                  onClick={() => onReport(object.id)}
                  className="px-4 py-3 border border-gray-300 text-gray-600 font-medium rounded-lg hover:bg-gray-50 hover:text-gray-700 transition inline-flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                  Segnala
                </button>
              )}

              {/* Cancella disponibilità (solo oggetti propri AVAILABLE) */}
              {onCancel && object.status === 'AVAILABLE' && (
                <ConfirmDialog
                  title="Cancella disponibilità"
                  message="Sei sicuro di voler cancellare questa disponibilità? L'operazione è irreversibile."
                  confirmLabel="Sì, cancella"
                  variant="danger"
                  onConfirm={() => onCancel(object.id)}
                >
                  <button
                    type="button"
                    className="px-4 py-3 border border-error-300 text-error-700 font-medium rounded-lg hover:bg-error-50 transition"
                  >
                    Cancella disponibilità
                  </button>
                </ConfirmDialog>
              )}
            </div>
          )}

          {/* Link a pagina di dettaglio (per my-objects) */}
          {showDetailLink && (
            <div className="pt-2 border-t border-gray-200">
              <Link
                href={`/recipient/objects/${object.id}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                Vedi dettaglio completo →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
