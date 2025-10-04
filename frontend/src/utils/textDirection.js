// Detect text direction by scanning for the first strong RTL or LTR character.
// Returns "rtl" by default so Persian/Arabic stays right-aligned unless an LTR token is leading.
export function detectTextDirection(text = "") {
  const rtlRegex = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  const ltrRegex = /[A-Za-z]/;

  for (const char of text) {
    if (rtlRegex.test(char)) return "rtl";
    if (ltrRegex.test(char)) return "ltr";
  }

  return "rtl";
}
