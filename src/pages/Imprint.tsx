import { Card } from '@/components/Card';

export function Imprint() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 'var(--space-3xl) var(--space-xl)' }}>
      <h1 style={{ marginBottom: 'var(--space-2xl)' }}>Impressum (Legal Notice)</h1>

      <Card style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>Information pursuant to &sect;&nbsp;5 ECG (E-Commerce-Gesetz)</h2>
        <p style={{ color: 'var(--text-secondary)' }}><strong>Operator:</strong> Roi Shternin-Martini (sole trader / Einzelunternehmer)</p>
        <p style={{ color: 'var(--text-secondary)' }}><strong>Trading as:</strong> Bedcoders</p>
        <p style={{ color: 'var(--text-secondary)' }}><strong>Business Activity:</strong> Unternehmensberatung einschlie&szlig;lich der Unternehmensorganisation — online education and consulting in software development, AI, and related technology fields</p>
        <p style={{ color: 'var(--text-secondary)' }}><strong>GISA Number:</strong> 38626050</p>
        <p style={{ color: 'var(--text-secondary)' }}><strong>Licensing Authority:</strong> Magistrat der Stadt Wien, Gewerbebeh&ouml;rde</p>
        <p style={{ color: 'var(--text-secondary)' }}><strong>Supervisory Authority:</strong> Wirtschaftskammer Wien (WKW), Fachverband Unternehmensberatung, Buchhaltung und Informationstechnologie (UBIT)</p>
        <p style={{ color: 'var(--text-secondary)' }}><strong>Address:</strong> 1180 Vienna, Austria <em>(full street address available on request)</em></p>
        <p style={{ color: 'var(--text-secondary)' }}><strong>Contact:</strong> <a href="mailto:legal@bedcoders.com" style={{ color: 'var(--signal)' }}>legal@bedcoders.com</a></p>
      </Card>

      <Card style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>VAT &amp; Tax</h2>
        <p style={{ color: 'var(--text-secondary)' }}><strong>VAT ID (UID-Nummer):</strong> ATU79713516</p>
        <p style={{ color: 'var(--text-secondary)' }}><strong>Tax Authority:</strong> Finanzamt Wien</p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: 'var(--space-sm)' }}>
          As a sole trader, VAT applicability is determined per transaction. Where VAT applies it will be displayed at checkout.
        </p>
      </Card>

      <Card style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>Responsible for Content (&sect;&nbsp;18 MedienG)</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>Roi Shternin-Martini, 1180 Vienna, Austria</p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Bedcoders is operated by a sole trader (Einzelunternehmer). There is no separate legal entity.
          The same legal entity also operates Bedcoders (bedcoders.com), a separate software development and AI education platform.
          Applicable professional conduct rules are available at{' '}
          <a href="https://www.wko.at/ubit" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--signal)' }}>wko.at/ubit</a>.
        </p>
      </Card>

      <Card style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>Dispute Resolution</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
          Pursuant to &sect;&nbsp;19 VRUG, we are not obligated and not willing to participate in dispute resolution proceedings before a consumer arbitration board (Verbraucherschlichtungsstelle).
        </p>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>We comply with all applicable Austrian and EU law, including:</p>
        <ul style={{ color: 'var(--text-secondary)', paddingLeft: 'var(--space-xl)', listStyle: 'disc', display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
          <li>EU General Data Protection Regulation (GDPR / DSGVO)</li>
          <li>Austrian E-Commerce Act (ECG, BGBl I 152/2001)</li>
          <li>Austrian Consumer Protection Act (KSchG)</li>
          <li>Austrian Trade Regulation Act (GewO 1994)</li>
          <li>EU Consumer Rights Directive (2011/83/EU)</li>
          <li>EU Digital Services Act (DSA, Regulation 2022/2065)</li>
        </ul>
        <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-md)' }}>
          EU Online Dispute Resolution:{' '}
          <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--signal)' }}>
            ec.europa.eu/consumers/odr/
          </a>
        </p>
      </Card>

      <Card style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>Educational Content Disclaimer</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
          Bedcoders provides online education in software development, AI literacy, and related technology subjects for personal and professional development only. Content does not constitute legal advice, financial advice, or any form of regulated professional service.
        </p>
        <p style={{ color: 'var(--text-secondary)' }}>
          Certificates of completion confirm educational engagement only. They are not regulated professional qualifications or credentials recognised by any healthcare regulatory body. Liability for professional decisions made on the basis of course content is excluded to the extent permitted by &sect;6, &sect;9a KSchG.
        </p>
      </Card>

      <Card>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>External Links Disclaimer</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          We are not responsible for the content of external websites linked from bedcoders.com. At the time of linking, no illegal content was identified. Upon notification of violations, such links will be removed immediately.
        </p>
      </Card>
    </div>
  );
}
