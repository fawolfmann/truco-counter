# truco-counter

Anotador de truco para el celular: dos columnas (Nosotros / Ellos), los puntos se dibujan con fósforos en
cuadrados de 5 (cuatro lados y la diagonal) y, jugando a 30, una línea separa las 15 malas de las 15 buenas.

- Funciona sin conexión (PWA con service worker) y se puede instalar en la pantalla de inicio.
- La partida se guarda en el teléfono (`localStorage`): sobrevive a recargas y a cerrar la app. No hay servidor ni cuentas.
- Se juega a 30 o a 15, con nombres editables, deshacer y "nueva partida".
- Mantiene la pantalla encendida mientras está abierta (si el navegador lo permite).

## Desarrollo

Sin dependencias: HTML, CSS y ES modules en `app/`.

```bash
npm test                     # tests (node --test)
npm run build                # regenera app/precache.js después de tocar algo en app/
npx --yes serve app          # o cualquier servidor estático; también: npm run dev (wrangler pages dev)
```

Para probar en el celular desde la compu: servir `app/` y abrir `http://<ip-de-la-compu>:<puerto>` en la misma red
(el service worker solo se activa en `localhost` o HTTPS; el deploy de Cloudflare es HTTPS).

Los íconos se generan con `python scripts/make-icons.py` (necesita Pillow) y se commitean.

## Deploy (Cloudflare Pages)

GitHub Actions corre los tests y, en cada push a `main`, publica `app/` con `wrangler pages deploy`
(`.github/workflows/check.yml`). La primera corrida crea el proyecto `truco-counter` si no existe.

Configurar una sola vez en el repo de GitHub (Settings → Secrets and variables → Actions):

- `CLOUDFLARE_API_TOKEN`: token con permiso **Account → Cloudflare Pages → Edit**.
- `CLOUDFLARE_ACCOUNT_ID`: el ID de la cuenta (aparece en el dashboard de Cloudflare).

La app queda en `https://truco-counter.pages.dev/`. En el celular: abrirla y "Agregar a pantalla de inicio".
