'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface ManifestoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Manifesto KYKOS — header custom con gradient+loghi+✕, body con 3 principi
 * (Anonimato/Gioia/Sostenibilita') + 3 dettagli + Come Funziona, footer con
 * link "Leggi manifesto completo" e bottone Chiudi.
 *
 * Migrazione 8.4: usa primitive `<Modal>` con slot `header` (custom) e
 * `footer` (custom) per il layout non-standard. zIndex=100, size="xl".
 *
 * Header e footer sono renderizzati in-page (NON estratti in
 * sotto-componenti) per YAGNI: montato solo in `dashboard/Sidebar.tsx:326`.
 */
export default function ManifestoModal({ isOpen, onClose }: ManifestoModalProps) {
  // Header custom: gradient + loghi + ✕ + h2 con span colorato + citazione
  const headerContent: ReactNode = (
    <div className="bg-gradient-to-br from-primary-50 to-secondary-50 p-6 border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/albero.svg" alt="KYKOS" className="h-10" />
          <img src="/LogoKykosTesto.svg" alt="KYKOS" className="h-10" />
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Chiudi"
          data-autofocus
          className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
        >
          ✕
        </button>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mt-4 text-center">
        Il Manifesto di <span className="text-primary-600">KYKOS</span>
      </h2>
      <p className="text-center text-gray-600 italic mt-2">
        &ldquo;Dona con amore, ricevi con dignità&rdquo;
      </p>
    </div>
  );

  // Footer custom: link "Leggi manifesto completo" + bottone Chiudi
  const footerContent: ReactNode = (
    <div className="p-4 bg-gray-50 border-t flex justify-between items-center">
      <Link
        href="/manifesto"
        target="_blank"
        className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
      >
        Leggi il manifesto completo →
      </Link>
      <Button type="button" variant="primary" onClick={onClose}>
        Chiudi
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      header={headerContent}
      footer={footerContent}
      zIndex={100}
      size="xl"
    >
      {/* Body - scrollabile */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* 3 principi - cards gradient */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <PrincipleCard gradient="from-primary-500 to-primary-600" textColor="text-primary-100" emoji="🙏" title="Anonimato" subtitle="Chi dona non sa a chi. Chi riceve non sa da chi." />
          <PrincipleCard gradient="from-secondary-500 to-secondary-600" textColor="text-secondary-100" emoji="💝" title="Gioia" subtitle="Più gioia nel donare che nel ricevere." />
          <PrincipleCard gradient="from-green-500 to-green-600" textColor="text-green-100" emoji="🌱" title="Sostenibilità" subtitle="Le cose trovano nuova vita." />
        </div>

        {/* 3 dettagli */}
        <div className="space-y-4">
          <DetailCard
            iconBg="bg-primary-100"
            icon="🙏"
            title="Anonimato e Rispetto"
            quote="...Non sappia la destra cosa fa la sinistra..."
            quoteColor="border-primary-200"
          >
            Chi dona non sa a chi sta donando. Chi riceve non sa da chi ha ricevuto.
            Questo principio fondamentale preserva la dignità di entrambi.
          </DetailCard>

          <DetailCard
            iconBg="bg-secondary-100"
            icon="💝"
            title="La Gioia del Donare"
            quote="...c'è più gioia nel donare che nel ricevere..."
            quoteColor="border-secondary-200"
          >
            Il donatore sperimenta la gioia autentica di fare del bene senza aspettarsi
            nulla in cambio. Il ricevente riceve con gratitudine genuina, senza debito.
          </DetailCard>

          <DetailCard
            iconBg="bg-green-100"
            icon="🌍"
            title="Casa Comune e Riciclo"
          >
            Le cose inutilizzate da molti trovano nuova vita attraverso chi ne ha
            bisogno. Preserviamo l&apos;ambiente e riduciamo gli sprechi.
          </DetailCard>
        </div>

        {/* Come Funziona */}
        <div className="mt-6 bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 text-center">Come Funziona</h3>
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <StepCard bg="bg-primary-100" emoji="🎁" title="Offri" desc="Dona beni che non usi" />
            <StepCard bg="bg-secondary-100" emoji="📝" title="Richiedi" desc="Se autorizzato, gratuitamente" />
            <StepCard bg="bg-amber-100" emoji="🏢" title="L'Ente Gestisce" desc="Mediano lo scambio" />
          </div>
        </div>
      </div>
    </Modal>
  );
}

/** Card gradiente per i 3 principi (Anonimato/Gioia/Sostenibilita'). */
function PrincipleCard({
  gradient,
  textColor,
  emoji,
  title,
  subtitle,
}: {
  gradient: string;
  textColor: string;
  emoji: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${gradient} text-white p-5 rounded-xl`}>
      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
        <span className="text-2xl">{emoji}</span>
      </div>
      <h3 className="font-bold mb-1">{title}</h3>
      <p className={`${textColor} text-sm`}>{subtitle}</p>
    </div>
  );
}

/** Card dettaglio con icona, titolo, citazione opzionale e corpo. */
function DetailCard({
  iconBg,
  icon,
  title,
  quote,
  quoteColor,
  children,
}: {
  iconBg: string;
  icon: string;
  title: string;
  quote?: string;
  quoteColor?: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <span className="text-xl">{icon}</span>
        </div>
        <div>
          <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
          {quote && (
            <p className={`text-gray-600 text-sm italic mb-2 pl-3 border-l-2 ${quoteColor}`}>
              &ldquo;{quote}&rdquo;
            </p>
          )}
          <p className="text-gray-600 text-sm">{children}</p>
        </div>
      </div>
    </div>
  );
}

/** Card step per "Come Funziona" (Offri/Richiedi/L'Ente Gestisce). */
function StepCard({ bg, emoji, title, desc }: { bg: string; emoji: string; title: string; desc: string }) {
  return (
    <div>
      <div className={`w-10 h-10 ${bg} rounded-full flex items-center justify-center mx-auto mb-2`}>
        <span className="text-xl">{emoji}</span>
      </div>
      <h4 className="font-semibold text-sm">{title}</h4>
      <p className="text-xs text-gray-500">{desc}</p>
    </div>
  );
}
