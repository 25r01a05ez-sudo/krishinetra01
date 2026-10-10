import {
  Microscope,
  Bug,
  Activity,
  BookOpenCheck,
  Camera,
  Cpu,
  ClipboardCheck,
  Smartphone,
  History,
  CloudSun,
  LineChart,
  Languages,
} from 'lucide-react';

/**
 * English marketing copy. Kept separate from components so it can be translated later
 * (e.g. content.hi.js) without touching JSX. No performance statistics are claimed.
 */

export const FEATURES = [
  {
    icon: Microscope,
    title: 'AI Crop Disease Detection',
    text: 'Upload a leaf photo and the connected AI model checks it for supported crop diseases.',
  },
  {
    icon: Bug,
    title: 'Pest Identification',
    text: 'The model looks for visible signs of pest infestation among the pests it has been trained on.',
  },
  {
    icon: Activity,
    title: 'Crop Health Monitoring',
    text: 'Scan the same crop again and again, and review how its results change over time.',
  },
  {
    icon: BookOpenCheck,
    title: 'Prevention & Management Guidance',
    text: 'Read simple, reviewed guidance on prevention and next steps whenever it is available.',
  },
];

export const STEPS = [
  {
    icon: Camera,
    title: 'Capture',
    text: 'Take a clear photograph of a crop leaf in good daylight.',
    detail:
      'Hold the camera steady, fill the frame with one leaf, and avoid shadows or blur. Photos from a phone camera work well.',
  },
  {
    icon: Cpu,
    title: 'Analyze',
    text: 'The connected AI model examines the image for supported disease or pest symptoms.',
    detail:
      'Your photo is sent to the KrishiNetra analysis server. The model returns what it believes the leaf shows, together with a confidence value.',
  },
  {
    icon: ClipboardCheck,
    title: 'Act',
    text: 'Review results and available crop management guidance.',
    detail:
      'Read the result in plain language, see any guidance provided, and talk to a local agriculture expert before making treatment decisions.',
  },
];

export const WHY_EARLY = [
  {
    title: 'Problems often start small',
    text: 'Many crop diseases and pests first appear as small marks or colour changes on leaves.',
  },
  {
    title: 'Time to respond',
    text: 'Noticing a problem sooner gives farmers more time to investigate the cause and ask for advice.',
  },
  {
    title: 'Fewer surprises',
    text: 'Regular checks help you see changes in a field before they become hard to ignore.',
  },
];

export const HELPS = [
  { icon: Smartphone, title: 'Works from a phone', text: 'Take or upload a photo straight from a smartphone browser.' },
  { icon: Languages, title: 'Simple language', text: 'Results are explained in plain terms. Hindi and Telugu are planned.' },
  { icon: History, title: 'Keeps your scans', text: 'Past results are kept so you can look back at what changed.' },
];

export const CAPABILITIES = [
  { icon: Microscope, title: 'Image-based analysis', text: 'Leaf photo in, model prediction out.' },
  { icon: LineChart, title: 'Scan analytics', text: 'Charts built from your real scan history.' },
  { icon: History, title: 'Scan history', text: 'Search and filter earlier results.' },
  { icon: BookOpenCheck, title: 'Guidance library', text: 'Symptoms, prevention and monitoring advice from the backend.' },
  { icon: CloudSun, title: 'Environmental monitoring', text: 'Planned: weather and sensor data integration.' },
  { icon: Languages, title: 'Multilingual ready', text: 'Built so Hindi and Telugu can be added.' },
];

export const LIMITATIONS = [
  'KrishiNetra gives AI-assisted predictions, not confirmed diagnoses.',
  'The model can only recognise the crops and conditions it was trained for.',
  'Model confidence is not a guarantee of accuracy.',
  'Photo quality, lighting and angle can change the result.',
  'Field performance still needs to be validated with agricultural experts.',
  'Always consult a local agriculture officer before applying any treatment.',
];

export const ABOUT = {
  problem:
    'Crop diseases and pest infestations can reduce yield and quality, and they are often noticed only after they have spread. Many farmers do not have quick access to experts who can examine a plant in time.',
  solution:
    'KrishiNetra lets a farmer photograph a crop leaf and receive an AI-assisted indication of a possible disease or pest, with understandable guidance and a record of past scans.',
  how: [
    'The farmer uploads or captures a leaf photo in the web app.',
    'The React frontend sends the image to the Flask backend (POST /api/predict).',
    'The backend runs the AI/ML model and returns the prediction.',
    'The app shows the result, guidance when available, and stores it in the scan history.',
  ],
  tech: [
    'React + Vite',
    'Tailwind CSS',
    'React Router',
    'Framer Motion',
    'Recharts',
    'Lucide Icons',
    'Flask (Python) backend – built separately',
    'AI/ML disease detection model – built separately',
  ],
  benefits: [
    'Faster first check of a suspicious leaf',
    'Easy use from a smartphone',
    'Simple explanations in farmer-friendly language',
    'A record of crop health over time',
  ],
  future: [
    'Hindi and Telugu interface',
    'Weather and soil-sensor (IoT) integration',
    'Environmental risk notifications',
    'Wider crop and disease coverage after validation',
    'Offline-friendly scanning',
  ],
};
