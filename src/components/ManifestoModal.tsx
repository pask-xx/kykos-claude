'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ManifestoModalProps {
  onClose: () => void;
}

export default function ManifestoModal({ onClose }: ManifestoModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col m-4">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary-50 to-secondary-50 p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/albero.svg" alt="KYKOS" className="h-10" />
              <img src="/LogoKykosTesto.svg" alt="KYKOS" className="h-10" />
            </div>
            <button
              onClick={onClose}
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

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Three principles */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 text-white p-5 rounded-xl">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl">🙏</span>
              </div>
              <h3 className="font-bold mb-1">Anonimato</h3>
              <p className="text-primary-100 text-sm">Chi dona non sa a chi. Chi riceve non sa da chi.</p>
            </div>
            <div className="bg-gradient-to-br from-secondary-500 to-secondary-600 text-white p-5 rounded-xl">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl">💝</span>
              </div>
              <h3 className="font-bold mb-1">Gioia</h3>
              <p className="text-secondary-100 text-sm">Più gioia nel donare che nel ricevere.</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-5 rounded-xl">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl">🌱</span>
              </div>
              <h3 className="font-bold mb-1">Sostenibilità</h3>
              <p className="text-green-100 text-sm">Le cose trovano nuova vita.</p>
            </div>
          </div>

          {/* Detailed content */}
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🙏</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Anonimato e Rispetto</h3>
                  <p className="text-gray-600 text-sm italic mb-2 pl-3 border-l-2 border-primary-200">
                    &ldquo;...Non sappia la destra cosa fa la sinistra...&rdquo;
                  </p>
                  <p className="text-gray-600 text-sm">
                    Chi dona non sa a chi sta donando. Chi riceve non sa da chi ha ricevuto.
                    Questo principio fondamentale preserva la dignità di entrambi.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">💝</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">La Gioia del Donare</h3>
                  <p className="text-gray-600 text-sm italic mb-2 pl-3 border-l-2 border-secondary-200">
                    &ldquo;...c'è più gioia nel donare che nel ricevere...&rdquo;
                  </p>
                  <p className="text-gray-600 text-sm">
                    Il donatore sperimenta la gioia autentica di fare del bene senza aspettarsi
                    nulla in cambio. Il ricevente riceve con gratitudine genuina, senza debito.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🌍</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Casa Comune e Riciclo</h3>
                  <p className="text-gray-600 text-sm">
                    Le cose inutilizzate da molti trovano nuova vita attraverso chi ne ha
                    bisogno. Preserviamo l&apos;ambiente e riduciamo gli sprechi.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* How it works - condensed */}
          <div className="mt-6 bg-gradient-to-br from-gray-50 to-white p-4 rounded-xl border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 text-center">Come Funziona</h3>
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-xl">🎁</span>
                </div>
                <h4 className="font-semibold text-sm">Offri</h4>
                <p className="text-xs text-gray-500">Dona beni che non usi</p>
              </div>
              <div>
                <div className="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-xl">📝</span>
                </div>
                <h4 className="font-semibold text-sm">Richiedi</h4>
                <p className="text-xs text-gray-500">Se autorizzato, con contributo 1-2€</p>
              </div>
              <div>
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-xl">🏢</span>
                </div>
                <h4 className="font-semibold text-sm">L&apos;Ente Gestisce</h4>
                <p className="text-xs text-gray-500">Mediano lo scambio</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t flex justify-between items-center">
          <Link
            href="/manifesto"
            target="_blank"
            className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
          >
            Leggi il manifesto completo →
          </Link>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}