/* Configurazione della dashboard: periodi selezionabili e sezioni della pagina (menu e ancore). */
import { Award, BadgeCheck, LayoutDashboard, Map as MapIcon, QrCode, ShieldAlert, Table2, Tags } from 'lucide-react'

export const PERIODS = [
  { days: 7, label: '7 giorni', long: 'negli ultimi 7 giorni' },
  { days: 30, label: '30 giorni', long: 'negli ultimi 30 giorni' },
  { days: 90, label: '90 giorni', long: 'negli ultimi 90 giorni' },
  { days: 365, label: '12 mesi', long: 'negli ultimi 12 mesi' },
] as const

export type Period = (typeof PERIODS)[number]

export const periodFor = (days: number): Period => PERIODS.find((p) => p.days === days) ?? PERIODS[1]

export const SECTIONS = [
  { id: 'panoramica', label: 'Panoramica', icon: LayoutDashboard },
  { id: 'adozione', label: 'Adozione 2D', icon: QrCode },
  { id: 'territorio', label: 'Territorio', icon: MapIcon },
  { id: 'qualita', label: 'Qualità dei codici', icon: BadgeCheck },
  { id: 'categorie', label: 'Categorie', icon: Tags },
  { id: 'brand', label: 'Brand', icon: Award },
  { id: 'protezione', label: 'Brand protection', icon: ShieldAlert },
  { id: 'dati', label: 'Dati grezzi', icon: Table2 },
] as const

export type SectionId = (typeof SECTIONS)[number]['id']
export type Section = (typeof SECTIONS)[number]

export const sectionById = (id: SectionId): Section => SECTIONS.find((s) => s.id === id)!
