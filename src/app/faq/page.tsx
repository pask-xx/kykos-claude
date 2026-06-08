import { Metadata } from 'next';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { CircleHelp, Gift, HandHeart, Building2, Handshake, Lock, Cookie, ScrollText, Rocket, HelpCircle } from 'lucide-react';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Domande Frequenti - KYKOS',
  description:
    'Tutte le risposte alle domande su KYKOS: come funziona la donazione anonima, chi può donare o ricevere, come aderire come ente, costi, sicurezza e privacy.',
  keywords: [
    'FAQ KYKOS',
    'domande frequenti donazione',
    'come donare anonimamente',
    'come ricevere oggetti',
    'Caritas donazione',
    'volontariato enti',
  ],
  alternates: {
    canonical: 'https://kykos.it/faq',
  },
  openGraph: {
    title: 'Domande Frequenti - KYKOS',
    description: 'Tutte le risposte su KYKOS: donazione anonima, ricevere oggetti, enti e volontariato.',
    type: 'website',
    url: 'https://kykos.it/faq',
    siteName: 'KYKOS',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FAQ KYKOS - Donazione anonima',
      },
    ],
  },
};

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqCategory {
  title: string;
  icon: LucideIcon;
  items: FaqItem[];
}

const FAQ_CATEGORIES: FaqCategory[] = [
  {
    title: 'Cos\'è KYKOS e come funziona',
    icon: CircleHelp,
    items: [
      {
        question: 'Cos\'è KYKOS?',
        answer:
          'KYKOS è una piattaforma italiana di donazione anonima di oggetti, pensata per chi ha beni inutilizzati e per persone in difficoltà economica. Il donatore pubblica un oggetto, un ente fidato (Caritas, parrocchia, associazione) verifica le richieste e gestisce la consegna, garantendo che donatore e ricevente non si conoscano mai.',
      },
      {
        question: 'Come funziona la donazione anonima su KYKOS?',
        answer:
          'Il principio è semplice: chi dona non sa chi riceve, e chi riceve non sa chi ha donato. La piattaforma KYKOS gestisce la pubblicazione, le richieste e l\'abbinamento; gli enti intermediari gestiscono fisicamente la logistica. Solo l\'intermediario conosce entrambe le parti.',
      },
      {
        question: 'KYKOS è gratuito?',
        answer:
          'Sì, KYKOS è completamente gratuito per donatori e riceventi. Per preservare la dignità del beneficiario, è previsto un contributo simbolico di 1-2€ che va all\'ente intermediario per coprire i costi operativi, non a KYKOS.',
      },
      {
        question: 'In quali città è attivo KYKOS?',
        answer:
          'KYKOS è attivo nelle aree dove sono presenti enti intermediari convenzionati. La copertura è in continua espansione grazie al network di Caritas, parrocchie e associazioni che aderiscono al progetto. Verifica la tua zona sulla pagina di registrazione.',
      },
    ],
  },
  {
    title: 'Per chi vuole donare',
    icon: Gift,
    items: [
      {
        question: 'Quali oggetti posso donare?',
        answer:
          'Puoi donare oggetti usati in buone condizioni: vestiti, libri, elettrodomestici, mobili, giocattoli, articoli per bambini, piccoli elettrodomestici, attrezzature, e molto altro. Gli oggetti devono essere puliti, funzionanti e non deperibili. KYKOS non gestisce donazioni in denaro, cibo o farmaci.',
      },
      {
        question: 'Come faccio a donare un oggetto?',
        answer:
          'Registrati gratuitamente come donatore su KYKOS, completa il profilo, e pubblica l\'oggetto con foto, descrizione e categoria. L\'ente più vicino provvederà al ritiro o alla consegna. Per assistenza, visita la pagina di registrazione.',
      },
      {
        question: 'Posso donare vestiti usati?',
        answer:
          'Sì, i vestiti usati in buone condizioni sono tra gli oggetti più richiesti. Verranno igienizzati e distribuiti dagli enti ai beneficiari. Ti consigliamo di lavare e piegare i capi prima della donazione.',
      },
      {
        question: 'Posso donare mobili o elettrodomestici?',
        answer:
          'Sì, purché funzionanti e in buone condizioni. Per oggetti voluminosi, l\'ente organizzerà il ritiro direttamente a casa tua. Specifica nelle note il peso e le dimensioni per facilitare la logistica.',
      },
      {
        question: 'Riceverò una ricevuta per la donazione?',
        answer:
          'KYKOS non rilascia ricevute fiscali, poiché non è un\'organizzazione no-profit. Gli enti intermediari (Caritas, parrocchie, associazioni riconosciute) possono rilasciare ricevute per le donazioni che transitano attraverso di loro. Consulta il tuo ente di riferimento.',
      },
      {
        question: 'Cosa succede se l\'oggetto donato non viene ritirato?',
        answer:
          'Se dopo un periodo di tempo l\'oggetto non riceve richieste, l\'ente può proporre un\'altra destinazione (altro beneficiario, altra associazione, smaltimento etico). Tu riceverai una notifica e potrai scegliere di riprendere l\'oggetto.',
      },
    ],
  },
  {
    title: 'Per chi ha bisogno di aiuto',
    icon: HandHeart,
    items: [
      {
        question: 'Chi può ricevere un oggetto tramite KYKOS?',
        answer:
          'Possono ricevere oggetti le persone in difficoltà economica che sono state preventivamente autorizzate da un ente intermediario (Caritas, parrocchia, associazione del territorio). L\'autorizzazione garantisce equità e dignità nel processo.',
      },
      {
        question: 'Come posso essere autorizzato come beneficiario?',
        answer:
          'Rivolgiti all\'ente (Caritas, parrocchia, associazione) più vicino a te. L\'ente valuterà la tua situazione e, se rientri nei criteri, ti abiliterà come beneficiario KYKOS. Da quel momento potrai consultare e richiedere gli oggetti disponibili.',
      },
      {
        question: 'Quanto costa ricevere un oggetto?',
        answer:
          'Niente per l\'oggetto stesso. È previsto un contributo simbolico di 1-2€ che va all\'ente intermediario per coprire i costi operativi di gestione della donazione. Questo contributo preserva la dignità del ricevente: non è una barriera, ma un segno di rispetto reciproco.',
      },
      {
        question: 'L\'ente saprà chi sono io?',
        answer:
          'Sì, l\'ente deve necessariamente conoscere i beneficiari per poterli autorizzare, assisterli e gestire la consegna. Questo è l\'unico soggetto che conosce la tua identità. Il donatore, invece, non saprà mai chi ha ricevuto il suo oggetto.',
      },
      {
        question: 'Posso scegliere qualsiasi oggetto o ci sono limiti?',
        answer:
          'Puoi richiedere qualsiasi oggetto disponibile nella tua zona. Le richieste vengono valutate dall\'ente in base a criteri di equità e urgenza, soprattutto per oggetti molto richiesti. In caso di più richieste, l\'ente assegnerà l\'oggetto al beneficiario con maggiore necessità.',
      },
    ],
  },
  {
    title: 'Per enti e associazioni',
    icon: Building2,
    items: [
      {
        question: 'Quali enti possono aderire a KYKOS?',
        answer:
          'Possono aderire enti no-profit riconosciuti: parrocchie e diocesi, Caritas territoriali, associazioni di volontariato, fondazioni, enti del terzo settore. L\'ente deve avere una sede operativa e referenti identificabili.',
      },
      {
        question: 'Come contattare KYKOS per aderire come ente?',
        answer:
          'Visita la pagina /adesione e compila il form di richiesta. Il team KYKOS valuterà la tua richiesta e ti contatterà per completare l\'iter di convenzione. La procedura è gratuita.',
      },
      {
        question: 'Quali vantaggi ha un ente che aderisce?',
        answer:
          'Gli enti convenzionati hanno accesso a una piattaforma professionale per gestire donazioni e richieste, una rete di donatori motivati, strumenti di coordinamento logistico, e la possibilità di espandere il proprio servizio sul territorio.',
      },
      {
        question: 'Gli enti possono pubblicare richieste di oggetti?',
        answer:
          'Sì, gli enti possono pubblicare richieste per conto dei propri beneficiari (es. "passeggino per neonato", "vestiti uomo taglia L"). I donatori possono rispondere direttamente a queste richieste.',
      },
    ],
  },
  {
    title: 'Volontariato',
    icon: Handshake,
    items: [
      {
        question: 'Posso fare volontariato con KYKOS?',
        answer:
          'Sì! KYKOS offre due modalità di volontariato: 1) come volontario di un ente convenzionato, per la gestione logistica delle donazioni; 2) come volontario digitale, per supporto tecnico, comunicazione, traduzione. Visita /volunteer per candidarti.',
      },
      {
        question: 'Le ore di volontariato sono certificate?',
        answer:
          'Le ore svolte presso un ente convenzionato KYKOS sono certificabili dall\'ente stesso, che rilascia un\'attestazione valida per crediti scolastici, tirocini universitari o curriculum.',
      },
    ],
  },
  {
    title: 'Privacy, sicurezza e anonimato',
    icon: Lock,
    items: [
      {
        question: 'Come viene garantito l\'anonimato?',
        answer:
          'L\'architettura KYKOS impedisce strutturalmente che donatore e ricevente vedano le rispettive identità. Solo l\'ente intermediario, per ragioni di gestione fisica, conosce entrambi. I dati personali sono protetti secondo GDPR e la cookie policy è disponibile sul sito.',
      },
      {
        question: 'KYKOS è conforme al GDPR?',
        answer:
          'Sì, KYKOS è pienamente conforme al Regolamento UE 2016/679 (GDPR). I consensi Privacy e Condizioni d\'uso vengono registrati con versione del documento, hash crittografico, IP e User-Agent per la prova legale. La cookie policy è pubblica.',
      },
      {
        question: 'Come posso eliminare il mio account?',
        answer:
          'Puoi richiedere la disattivazione del profilo in qualsiasi momento dalla sezione "Disattiva account" del tuo profilo. I tuoi dati personali verranno cancellati, ma le donazioni già completate resteranno nello storico aggregato per garantire la tracciabilità del servizio.',
      },
    ],
  },
];

// Genera il JSON-LD FAQPage aggregando tutte le domande
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_CATEGORIES.flatMap((category) =>
    category.items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    }))
  ),
};

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <JsonLd data={faqJsonLd} />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <img src="/albero.svg" alt="KYKOS" className="h-10" />
              <img src="/LogoKykosTesto.svg" alt="KYKOS" className="h-10" />
            </Link>
            <nav className="flex items-center gap-4">
              <Link href="/manifesto" className="hidden sm:block text-gray-600 hover:text-primary-600 font-medium">
                Manifesto
              </Link>
              <Link href="/auth/login" className="text-gray-600 hover:text-primary-600 font-medium">
                Accedi
              </Link>
              <Link href="/auth/register" className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm">
                Registrati
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <Breadcrumbs
          items={[
            { name: 'Home', href: '/' },
            { name: 'Domande frequenti', href: '/faq' },
          ]}
          className="mb-6"
        />

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <HelpCircle className="w-10 h-10 text-primary-700" aria-hidden="true" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Domande frequenti su KYKOS
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Tutte le risposte che cerchi su KYKOS: donazione anonima, come ricevere oggetti,
            come aderire come ente, volontariato, privacy e sicurezza.
          </p>
        </div>

        {/* Indice rapido */}
        <nav aria-label="Indice delle categorie" className="bg-white rounded-2xl shadow-sm border p-6 mb-12">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Vai alla sezione
          </h2>
          <ul className="grid sm:grid-cols-2 gap-2">
            {FAQ_CATEGORIES.map((category) => {
              const CategoryIcon = category.icon;
              return (
                <li key={category.title}>
                  <a
                    href={`#${category.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`}
                    className="flex items-center gap-2 text-primary-600 hover:text-primary-700 hover:underline transition"
                  >
                    <CategoryIcon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    <span>{category.title}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Categorie FAQ */}
        <div className="space-y-12">
          {FAQ_CATEGORIES.map((category) => {
            const anchorId = category.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
            return (
              <section
                key={category.title}
                id={anchorId}
                className="bg-white rounded-2xl shadow-sm border p-6 md:p-8 scroll-mt-24"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  {(() => {
                    const CategoryIcon = category.icon;
                    return <CategoryIcon className="w-7 h-7 text-primary-600 flex-shrink-0" aria-hidden="true" />;
                  })()}
                  {category.title}
                </h2>
                <div className="space-y-4">
                  {category.items.map((item, index) => (
                    <details
                      key={index}
                      className="group border border-gray-200 rounded-xl overflow-hidden"
                    >
                      <summary className="cursor-pointer p-4 font-medium text-gray-900 hover:bg-gray-50 flex items-center justify-between gap-3 list-none">
                        <span className="flex-1">{item.question}</span>
                        <span
                          className="text-primary-600 text-xl transition-transform group-open:rotate-45 flex-shrink-0"
                          aria-hidden="true"
                        >
                          +
                        </span>
                      </summary>
                      <div className="p-4 pt-0 text-gray-700 leading-relaxed border-t border-gray-100">
                        {item.answer}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* CTA */}
        <section className="mt-12 text-center bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-3xl p-12 shadow-xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Non hai trovato la risposta?
          </h2>
          <p className="text-primary-100 mb-8 max-w-lg mx-auto text-lg">
            Scopri come funziona KYKOS nel dettaglio o contattaci per qualsiasi domanda.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link
              href="/manifesto"
              className="px-6 py-3 bg-white text-primary-600 font-semibold rounded-xl hover:bg-primary-50 shadow-md transition"
            >
              Leggi il manifesto
            </Link>
            <Link
              href="/adesione"
              className="px-6 py-3 border-2 border-white/50 text-white font-semibold rounded-xl hover:bg-white/10 transition"
            >
              Aderisci come ente
            </Link>
          </div>
        </section>

        {/* Link utili */}
        <section className="mt-12 grid sm:grid-cols-3 gap-4">
          <Link
            href="/cookie-policy"
            className="block bg-white rounded-xl shadow-sm border p-5 hover:border-primary-300 hover:shadow-md transition"
          >
            <Cookie className="w-7 h-7 mb-2 text-amber-600" aria-hidden="true" />
            <h3 className="font-semibold text-gray-900 mb-1">Cookie Policy</h3>
            <p className="text-sm text-gray-600">Come gestiamo i cookie tecnici.</p>
          </Link>
          <Link
            href="/manifesto"
            className="block bg-white rounded-xl shadow-sm border p-5 hover:border-primary-300 hover:shadow-md transition"
          >
            <ScrollText className="w-7 h-7 mb-2 text-primary-600" aria-hidden="true" />
            <h3 className="font-semibold text-gray-900 mb-1">Il Manifesto</h3>
            <p className="text-sm text-gray-600">I principi fondanti di KYKOS.</p>
          </Link>
          <Link
            href="/aderisci"
            className="block bg-white rounded-xl shadow-sm border p-5 hover:border-primary-300 hover:shadow-md transition"
          >
            <Rocket className="w-7 h-7 mb-2 text-primary-600" aria-hidden="true" />
            <h3 className="font-semibold text-gray-900 mb-1">Aderisci ora</h3>
            <p className="text-sm text-gray-600">Inizia a donare o richiedere oggetti.</p>
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 mt-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img
              src="/albero.svg"
              alt="KYKOS"
              className="h-8"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
            <img
              src="/LogoKykosTesto.svg"
              alt="KYKOS"
              className="h-8"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
          <p className="text-sm italic mb-2">Dona con amore, ricevi con dignità</p>
          <p className="text-xs mt-4 text-gray-500">© 2024-2026 KYKOS. Tutti i diritti riservati.</p>
        </div>
      </footer>
    </div>
  );
}
