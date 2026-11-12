/**
 * A basic Romanized Nepali to Unicode transliteration utility.
 * This is a simplified version for common usage.
 */

const transliterationMap: { [key: string]: string } = {
  'a': 'अ', 'aa': 'आ', 'i': 'इ', 'ee': 'ई', 'u': 'उ', 'oo': 'ऊ', 'e': 'ए', 'ai': 'ऐ', 'o': 'ओ', 'au': 'औ', 'am': 'अं', 'ah': 'अः',
  'ka': 'क', 'kha': 'ख', 'ga': 'ग', 'gha': 'घ', 'nga': 'ङ',
  'cha': 'च', 'chha': 'छ', 'ja': 'ज', 'jha': 'झ', 'yna': 'ञ',
  'ta': 'त', 'tha': 'थ', 'da': 'द', 'dha': 'ध', 'na': 'न',
  'Ta': 'ट', 'Tha': 'ठ', 'Da': 'ड', 'Dha': 'ढ', 'Na': 'ण',
  'pa': 'प', 'pha': 'फ', 'ba': 'ब', 'bha': 'भ', 'ma': 'म',
  'ya': 'य', 'ra': 'र', 'la': 'ल', 'va': 'व', 'wa': 'व',
  'sha': 'श', 'Sha': 'ष', 'sa': 'स', 'ha': 'ह',
  'ksha': 'क्ष', 'tra': 'त्र', 'gya': 'ज्ञ',
  'ri': 'रि', 'ree': 'री',
  '0': '०', '1': '१', '2': '२', '3': '३', '4': '४', '5': '५', '6': '६', '7': '७', '8': '८', '9': '९',
  '.': '।',
};

// Halant (vowel-less) consonants
const consonants = [
  'k', 'kh', 'g', 'gh', 'ng',
  'ch', 'chh', 'j', 'jh', 'yn',
  't', 'th', 'd', 'dh', 'n',
  'T', 'Th', 'D', 'Dh', 'N',
  'p', 'ph', 'b', 'bh', 'm',
  'y', 'r', 'l', 'v', 'w',
  'sh', 'Sh', 's', 'h'
];

const consonantMap: { [key: string]: string } = {
  'k': 'क्', 'kh': 'ख्', 'g': 'ग्', 'gh': 'घ्', 'ng': 'ङ्',
  'ch': 'च्', 'chh': 'छ्', 'j': 'ज्', 'jh': 'झ्', 'yn': 'ञ्',
  't': 'त्', 'th': 'थ्', 'd': 'द्', 'dh': 'ध्', 'n': 'न्',
  'T': 'ट्', 'Th': 'ठ्', 'D': 'ड्', 'Dh': 'ढ्', 'N': 'ण्',
  'p': 'प्', 'ph': 'फ्', 'b': 'ब्', 'bh': 'भ्', 'm': 'म्',
  'y': 'य्', 'r': 'र्', 'l': 'ल्', 'v': 'व्', 'w': 'व्',
  'sh': 'श्', 'Sh': 'ष्', 's': 'स्', 'h': 'ह्'
};

const vowelSigns: { [key: string]: string } = {
  'a': '', 'aa': 'ा', 'i': 'ि', 'ee': 'ी', 'u': 'ु', 'oo': 'ू', 'e': 'े', 'ai': 'ै', 'o': 'ो', 'au': 'ौ', 'am': 'ं', 'ah': 'ः'
};

/**
 * Transliterates a Romanized Nepali string to Unicode Nepali.
 * This is a basic implementation and might not cover all edge cases.
 */
export function transliterate(text: string): string {
  if (!text) return "";
  
  let result = "";
  let i = 0;
  let inHtmlTag = false;
  
  while (i < text.length) {
    if (text[i] === '<') {
      inHtmlTag = true;
    }
    
    if (inHtmlTag) {
      result += text[i];
      if (text[i] === '>') {
        inHtmlTag = false;
      }
      i++;
      continue;
    }

    let found = false;
    
    // If the current character is already a Nepali character, just pass it through
    const charCode = text.charCodeAt(i);
    if (charCode >= 0x0900 && charCode <= 0x097F) {
      result += text[i];
      
      // Check if this is a consonant with a halant (U+094D)
      // and the next character is a romanized vowel
      if (text[i+1] === '्' && i + 2 < text.length) {
         const nextChar = text[i+2];
         if (vowelSigns[nextChar] !== undefined) {
            result += vowelSigns[nextChar];
            i += 3;
            found = true;
         }
      }
      
      if (!found) {
        i++;
        found = true;
      }
    }

    if (found) continue;
    
    // Try matching 4-character sequences (e.g., ksha)
    if (i + 3 < text.length) {
      const quad = text.substring(i, i + 4);
      if (transliterationMap[quad]) {
        result += transliterationMap[quad];
        i += 4;
        found = true;
      }
    }
    
    // Try matching 3-character sequences (e.g., kha, gha)
    if (!found && i + 2 < text.length) {
      const trio = text.substring(i, i + 3);
      if (transliterationMap[trio]) {
        result += transliterationMap[trio];
        i += 3;
        found = true;
      } else if (consonantMap[trio.substring(0, 2)] && vowelSigns[trio.substring(2)] !== undefined) {
        result += consonantMap[trio.substring(0, 2)].replace('्', '') + vowelSigns[trio.substring(2)];
        i += 3;
        found = true;
      }
    }
    
    // Try matching 2-character sequences (e.g., ka, aa)
    if (!found && i + 1 < text.length) {
      const duo = text.substring(i, i + 2);
      if (transliterationMap[duo]) {
        result += transliterationMap[duo];
        i += 2;
        found = true;
      } else if (consonantMap[duo[0]] && vowelSigns[duo[1]] !== undefined) {
        result += consonantMap[duo[0]].replace('्', '') + vowelSigns[duo[1]];
        i += 2;
        found = true;
      } else if (consonantMap[duo]) {
         // Check if next is a vowel
         if (i + 2 < text.length && vowelSigns[text[i+2]] !== undefined) {
            // will be handled in next iteration
         } else {
            result += consonantMap[duo];
            i += 2;
            found = true;
         }
      }
    }
    
    // Try matching single character
    if (!found) {
      const char = text[i];
      if (transliterationMap[char]) {
        result += transliterationMap[char];
      } else if (consonantMap[char]) {
        result += consonantMap[char];
      } else {
        result += char;
      }
      i++;
    }
  }
  
  return result;
}

/**
 * Fetches transliteration suggestions from Google Input Tools API.
 */
export async function fetchSuggestions(text: string): Promise<string[]> {
  if (!text || !/^[a-zA-Z]+$/.test(text)) return [];
  
  try {
    const url = `https://inputtools.google.com/request?text=${text}&itc=ne-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data[0] === "SUCCESS") {
      return data[1][0][1];
    }
    return [];
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return [transliterate(text)];
  }
}

/**
 * A more robust transliteration that works word-by-word or character-by-character.
 * For simplicity in this app, we'll use a basic approach.
 */
export function useNepaliTyping(value: string, onChange: (val: string) => void, enabled: boolean = true) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!enabled) return;
    
    // If space is pressed, we could transliterate the last word
    // But for real-time feel, we might want to do it differently
  };

  return { handleKeyDown };
}
