import { Archivo } from "next/font/google";

/**
 * The face is set once here and imported by both root layouts (the language
 * wheel and the [lang] menu). Calling the loader twice would ship two copies.
 */
export const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-archivo",
  display: "swap",
});
