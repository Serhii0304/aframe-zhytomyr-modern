import type { Metadata } from 'next';
import './globals.css';
import './motion.css';
const origin =
  process.env.SITE_URL ||
  'https://aframe-zhytomyr-modern.serhii0304.chatgpt.site';
export const metadata: Metadata = {
  metadataBase: new URL(origin),
  title: 'А-ФРЕЙМ — каркасні будинки у Житомирській та Київській областях',
  description:
    'А-фрейм, каркасні та модульні будинки на вашій ділянці. Від ідеї до оздоблення. Перегляньте портфоліо та обговоріть кошторис свого будинку.',
  alternates: { canonical: origin },
  openGraph: {
    type: 'website',
    locale: 'uk_UA',
    title: 'А-ФРЕЙМ — простір для вашого життя',
    description:
      'Сучасне каркасне будівництво. Житомирська та Київська області.',
    url: origin,
    images: [
      {
        url: `${origin.replace(/\/$/, '')}/images/hero.webp`,
        width: 1494,
        height: 996,
        alt: 'Архітектурний приклад будинку А-фрейм',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'А-ФРЕЙМ — простір для вашого життя',
    images: [`${origin.replace(/\/$/, '')}/images/hero.webp`],
  },
  icons: { icon: `${process.env.BASE_PATH || ''}/favicon.svg` },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'HomeAndConstructionBusiness',
              name: 'А-ФРЕЙМ',
              url: origin,
              telephone: '+380970864989',
              email: 'Avessalom7@gmail.com',
              areaServed: [
                { '@type': 'AdministrativeArea', name: 'Житомирська область' },
                { '@type': 'AdministrativeArea', name: 'Київська область' },
              ],
              description:
                'Будівництво А-фрейм, каркасних і модульних будинків на ділянці замовника.',
            }).replace(/</g, '\\u003c'),
          }}
        />
        {children}
      </body>
    </html>
  );
}
