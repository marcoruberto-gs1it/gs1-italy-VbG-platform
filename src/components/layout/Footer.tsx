import { ArrowUpRight } from 'lucide-react'
import logo from '../../assets/gs1-italy-logo.png'
import { GS1_IT, legalLinks, serviceLinks, socialLinks } from '../../lib/links'

const YEAR = new Date().getFullYear()

/** Footer, come nell'app di scansione: servizi, note legali, social, indirizzo, link al sito. */
export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-brand">
        <img className="footer-logo" src={logo} alt="GS1 Italy" width={70} height={48} />
        <p className="footer-claim">The Global Language of Business</p>
      </div>

      <div className="footer-cols">
        <div>
          <h3>Servizi</h3>
          <ul>
            {serviceLinks.map((link) => (
              <li key={link.href}><a href={link.href} target="_blank" rel="noreferrer">{link.label}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Note legali</h3>
          <ul>
            <li>
              <details className="footer-privacy">
                <summary>Dati e privacy della piattaforma</summary>
                <p>
                  La piattaforma mostra le scansioni fatte con l’app VbG Scan, senza dati personali: niente indirizzo IP né
                  identificativi, posizione approssimativa (paese, regione, città) dedotta dalla connessione, dei link solo il dominio. L’accesso è riservato agli utenti
                  autorizzati da GS1 Italy.
                </p>
              </details>
            </li>
            {legalLinks.map((link) => (
              <li key={link.href}><a href={link.href} target="_blank" rel="noreferrer">{link.label}</a></li>
            ))}
          </ul>
        </div>
      </div>

      <div className="footer-end">
        <div className="socials">
          {socialLinks.map((link) => (
            <a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label}</a>
          ))}
        </div>
        <address className="footer-address">
          GS1 Italy · Via Paleocapa 7, 20121 Milano
          <br />
          Codice fiscale 80140330152
        </address>
        <p className="footer-copy">© {YEAR} GS1 Italy <span className="footer-version">· versione {__APP_VERSION__}</span></p>
        <a className="footer-site" href={GS1_IT} target="_blank" rel="noreferrer">
          Vai al sito di GS1 Italy <ArrowUpRight size={17} />
        </a>
      </div>
    </footer>
  )
}
