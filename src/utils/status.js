import { CheckCircle2, AlertTriangle, HelpCircle, Ban, Info } from 'lucide-react';

/** Visual + wording metadata for each normalised status. */
export const STATUS_META = {
  healthy: {
    label: 'Looks healthy',
    short: 'Healthy',
    icon: CheckCircle2,
    badge: 'bg-green-100 text-green-900 border-green-300',
    panel: 'bg-green-50 border-green-200',
    dot: 'bg-fresh',
    text: 'text-green-800',
    explain: 'The model did not find signs of a supported disease or pest in this image.',
  },
  disease: {
    label: 'Possible disease or pest',
    short: 'Possible disease',
    icon: AlertTriangle,
    badge: 'bg-amber-100 text-amber-900 border-amber-300',
    panel: 'bg-amber-50 border-amber-200',
    dot: 'bg-amber-500',
    text: 'text-amber-800',
    explain: 'The model found signs that may match a disease or pest. Please confirm with a local expert.',
  },
  uncertain: {
    label: 'Uncertain result',
    short: 'Uncertain',
    icon: HelpCircle,
    badge: 'bg-yellow-100 text-yellow-900 border-yellow-300',
    panel: 'bg-yellow-50 border-yellow-200',
    dot: 'bg-gold',
    text: 'text-yellow-800',
    explain: 'The AI cannot confidently identify the issue in this image. Expert assessment is recommended.',
  },
  unsupported: {
    label: 'Not supported',
    short: 'Unsupported',
    icon: Ban,
    badge: 'bg-slate-100 text-slate-800 border-slate-300',
    panel: 'bg-slate-50 border-slate-200',
    dot: 'bg-slate-400',
    text: 'text-slate-700',
    explain: 'This crop or image type is outside what the model currently supports.',
  },
  unknown: {
    label: 'Status not provided',
    short: 'Not provided',
    icon: Info,
    badge: 'bg-slate-100 text-slate-800 border-slate-300',
    panel: 'bg-slate-50 border-slate-200',
    dot: 'bg-slate-400',
    text: 'text-slate-700',
    explain: 'The server did not include a health status with this result.',
  },
};

export const getStatusMeta = (status) => STATUS_META[status] || STATUS_META.unknown;

export const SEVERITY_META = {
  low: { label: 'Low', bar: 'bg-fresh', width: '33%' },
  moderate: { label: 'Moderate', bar: 'bg-gold', width: '66%' },
  high: { label: 'High', bar: 'bg-red-500', width: '100%' },
};
