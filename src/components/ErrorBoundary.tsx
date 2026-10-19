import { Component, type ErrorInfo, type ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'
import { t } from '../i18n'

type Props = { children: ReactNode; title?: string }
type State = { error: Error | null }

/**
 * Se una parte della pagina va in errore, mostra un avviso al suo posto invece di lasciare
 * la pagina bianca; il resto della dashboard continua a funzionare.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Errore nella dashboard', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="notice is-error" role="alert">
        <TriangleAlert size={18} />
        <span>
          {this.props.title ?? t('Questa parte della pagina non si è caricata.')}{' '}
          <button className="link-btn" type="button" onClick={() => this.setState({ error: null })}>{t('Riprova')}</button>
        </span>
      </div>
    )
  }
}
