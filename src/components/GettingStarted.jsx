import { useEffect, useState } from 'react';
import { getSettings, saveSettings } from '../services/api';
import { useT } from '../i18n';
const COPY = {
 en: ['Welcome to KrishiNetra', 'Take a clear photo of a crop leaf in daylight.', 'Open New Diagnosis, upload the photo and select Analyse.', 'Read the possible condition and precautions. You can listen to the next steps.', 'Review saved results in History. Choose your language from the language menu.', 'Next', 'Done', 'Skip'],
 hi: ['कृषिनेत्र में आपका स्वागत है', 'दिन की रोशनी में फसल के पत्ते की साफ़ तस्वीर लें।', 'नई जाँच खोलें, तस्वीर अपलोड करें और विश्लेषण चुनें।', 'संभावित रोग और सावधानियाँ पढ़ें। आप अगले कदम सुन भी सकते हैं।', 'इतिहास में पुराने परिणाम देखें। भाषा मेनू से अपनी भाषा चुनें।', 'आगे', 'पूरा करें', 'छोड़ें'],
 te: ['కృషినేత్రకు స్వాగతం', 'పగటి వెలుతురులో పంట ఆకు స్పష్టమైన ఫోటో తీయండి.', 'కొత్త నిర్ధారణ తెరిచి, ఫోటోను అప్‌లోడ్ చేసి విశ్లేషణ ఎంచుకోండి.', 'సంభావ్య వ్యాధి మరియు జాగ్రత్తలను చదవండి. తదుపరి చర్యలను వినవచ్చు.', 'చరిత్రలో ఫలితాలను చూడండి. భాష మెనూ నుండి మీ భాషను ఎంచుకోండి.', 'తదుపరి', 'పూర్తి', 'దాటవేయి'],
 ur: ['کرشی نیترا میں خوش آمدید', 'دن کی روشنی میں فصل کے پتے کی صاف تصویر لیں۔', 'نئی تشخیص کھولیں، تصویر اپ لوڈ کریں اور تجزیہ منتخب کریں۔', 'ممکنہ بیماری اور احتیاطی تدابیر پڑھیں۔ آپ اگلے اقدامات سن بھی سکتے ہیں۔', 'تاریخ میں محفوظ نتائج دیکھیں۔ زبان کے مینو سے اپنی زبان منتخب کریں۔', 'اگلا', 'مکمل', 'چھوڑ دیں'],
};
export default function GettingStarted() {
 const { lang } = useT();
 const [open, setOpen] = useState(false);
 const [step, setStep] = useState(0);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState('');
 useEffect(() => { let active = true; getSettings().then(r => { if (active) setOpen(!r.settings.tutorial_completed); }).catch(() => {}); return () => { active = false; }; }, []);
 const finish = async () => { setBusy(true); try { await saveSettings({ tutorial_completed: true }); setOpen(false); } catch(e) { setError(e.message); } finally { setBusy(false); } };
 if (!open) return null;
 const text = COPY[lang] || COPY.en;
 return <section className="mb-6 rounded-2xl border border-forest/20 bg-mint p-5" aria-label={text[0]}>
   <div className="flex justify-between gap-3"><h2 className="font-bold text-lg">{text[0]}</h2><button className="btn-ghost btn-sm" onClick={finish} disabled={busy}>{text[7]}</button></div>
   <p className="mt-3">{step + 1}/4 · {text[step + 1]}</p>
   <button className="btn-primary btn-sm mt-4" onClick={step === 3 ? finish : () => setStep(s => s + 1)} disabled={busy}>{step === 3 ? text[6] : text[5]}</button>
   {error && <p role="alert">{error}</p>}
 </section>;
}
