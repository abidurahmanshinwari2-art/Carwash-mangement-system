import { useI18n } from '../i18n';

const options = [
  ['en', 'English'],
  ['ps', 'پښتو'],
  ['fa', 'دری'],
];

export default function LanguageSwitch() {
  const { lang, setLang, t } = useI18n();
  return (
    <div className="lang-switch" role="group" aria-label={t('language')}>
      {options.map(([id, label]) => (
        <button
          key={id}
          type="button"
          className={lang === id ? 'lang-btn active' : 'lang-btn'}
          aria-pressed={lang === id}
          onClick={() => setLang(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
