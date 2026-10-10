import { motion } from 'framer-motion';

export default function FeatureCard({ icon: Icon, title, text, index = 0 }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="card card-hover group h-full"
    >
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-mint text-forest transition group-hover:bg-forest group-hover:text-white">
        <Icon size={24} aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-1.5 text-base text-ink/75">{text}</p>
    </motion.article>
  );
}
