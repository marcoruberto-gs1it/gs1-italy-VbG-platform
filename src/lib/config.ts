/* Configurazione della dashboard: periodi selezionabili e sezioni della pagina (menu e ancore).
   Le etichette sono getter: si traducono nella lingua corrente al momento della lettura. */
import { t } from '../i18n'
import { Award, BadgeCheck, LayoutDashboard, Map as MapIcon, QrCode, ShieldAlert, Table2, Tags } from 'lucide-react'

export const PERIODS = [
  { days: 7, get label() { return t('7 giorni') }, get long() { return t('negli ultimi 7 giorni') } },
  { days: 30, get label() { return t('30 giorni') }, get long() { return t('negli ultimi 30 giorni') } },
  { days: 90, get label() { return t('90 giorni') }, get long() { return t('negli ultimi 90 giorni') } },
  { days: 365, get label() { return t('12 mesi') }, get long() { return t('negli ultimi 12 mesi') } },
] as const

export type Period = (typeof PERIODS)[number]

export const periodFor = (days: number): Period => PERIODS.find((p) => p.days === days) ?? PERIODS[1]

export const SECTIONS = [
  { id: 'panoramica', get label() { return t('Panoramica') }, icon: LayoutDashboard },
  { id: 'adozione', get label() { return t('Adozione 2D') }, icon: QrCode },
  { id: 'territorio', get label() { return t('Territorio') }, icon: MapIcon },
  { id: 'qualita', get label() { return t('Qualità dei codici') }, icon: BadgeCheck },
  { id: 'categorie', get label() { return t('Categorie') }, icon: Tags },
  { id: 'brand', get label() { return t('Brand') }, icon: Award },
  { id: 'protezione', get label() { return t('Brand protection') }, icon: ShieldAlert },
  { id: 'dati', get label() { return t('Dati grezzi') }, icon: Table2 },
] as const

export type SectionId = (typeof SECTIONS)[number]['id']
export type Section = (typeof SECTIONS)[number]

export const sectionById = (id: SectionId): Section => SECTIONS.find((s) => s.id === id)!
