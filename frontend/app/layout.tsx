import '../styles/globals.css';

export const metadata = {
  title: 'SwarmEx',
  description: 'Autonomous multi-agent DeFi execution engine',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
