import de from "./i18n/de.json";
import fr from "./i18n/fr.json";
import it from "./i18n/it.json";
import nl from "./i18n/nl.json";
import cz from "./i18n/cz.json";
import en from "./i18n/en.json";

export const translateText = (key, overrideLanguage) => {
  let language = navigator.language;
  if (overrideLanguage !== "") {
    language = overrideLanguage;
  }

  let languagePack = en;
  if (/^de\b/.test(language)) {
    languagePack = de;
  }
  if (/^it\b/.test(language)) {
    languagePack = it;
  }
  if (/^fr\b/.test(language)) {
    languagePack = fr;
  }
  if (/^it\b/.test(language)) {
    languagePack = it;
  }
  if (/^nl\b/.test(language)) {
    languagePack = nl;
  }
  if (/^cs\b/.test(language)) {
    languagePack = cz;
  }

  if (languagePack[key]) {
    return languagePack[key];
  }

  return key;
};
