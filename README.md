# GDCI — Registre Transport (Vanilla)

## Démarrage
- Ouvre `index.html`.
- Sur iPhone: **ne pas ouvrir depuis Fichiers** (`file://`). Héberge via HTTPS (Netlify / Vercel / GitHub Pages) puis ouvre le lien.

## Structure
- `index.html` : page principale (HTML)
- `css/app.css` : styles (responsive + iPhone)
- `js/*.js` : logique découpée par modules (vanilla)

Ordre de chargement (voir `index.html`): config → state → utils → calc → UI → supabase → events → init.

## Notes
- Totaux: `total = tarif_transport + (prix_mat_par_tonne × tonnage)`.
- Compat anciens enregistrements: détection si `prixMat` était déjà un total (évite les millions).
- Les anciens `onclick/oninput/onchange` ont été remplacés par une délégation d’événements centralisée dans `js/events.js`.
- Carnet numérique chauffeur: bouton **📒 Fiche** dans `Matricules` avec historique, score, tonnage et montant généré.
- Prix négociés: le voyage distingue **barème** et **prix appliqué** pour le transport et le matériau, avec **tonnage réel** vs **tonnage facturé**.

