/**
 * The 14 allergens of Reg. (EU) 1169/2011, Annex II — a legal declaration for
 * any food or drink served on the premises. Stored as ids; the wording lives in
 * the app (src/lib/allergens.ts), which translates them into all four menu
 * languages, so a typo here cannot reach the guest.
 */
export const ALLERGENS = [
  {title: 'Gluten (grâu, orz, secară, ovăz)', value: 'gluten'},
  {title: 'Crustacee', value: 'crustaceans'},
  {title: 'Ouă', value: 'eggs'},
  {title: 'Pește', value: 'fish'},
  {title: 'Arahide', value: 'peanuts'},
  {title: 'Soia', value: 'soy'},
  {title: 'Lapte (inclusiv lactoză)', value: 'milk'},
  {title: 'Fructe cu coajă lemnoasă', value: 'nuts'},
  {title: 'Țelină', value: 'celery'},
  {title: 'Muștar', value: 'mustard'},
  {title: 'Susan', value: 'sesame'},
  {title: 'Dioxid de sulf și sulfiți', value: 'sulphites'},
  {title: 'Lupin', value: 'lupin'},
  {title: 'Moluște', value: 'molluscs'},
] as const
