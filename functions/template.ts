export function getTemplate({
  redirectPath,
  withError
}: {
  redirectPath: string;
  withError: boolean;
}): string {
  return `
  <!doctype html>
  <html lang="en" data-theme="dark">

    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Password Protected Site</title>
      <meta name="description" content="This site is password protected.">
      <link rel="shortcut icon" href="https://picocss.com/favicon.ico">

      <link rel="stylesheet" href="https://unpkg.com/@picocss/pico@latest/css/pico.min.css">

      <style>
        body > main {
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-height: calc(100vh - 7rem);
          padding: 1rem 0;
          max-width: 600px;
        }

        .error {
          background: white;
          border-radius: 10px;
          color: var(--del-color);
          padding: 0.5em 1em;
        }

        h2 { color: var(--color-h2); }
      </style>
    </head>

    <body>
      <main>
        <article>
          <hgroup>
            <h1>Confidentiel, mot de passe requis!</h1>
            <h2>En vous connectant au système, vous acceptez automatiquement de garder les informations reçues confidentielles pour une durée indéterminée. Ces informations ne peuvent être transmises à des tiers qu'avec l'accord du propriétaire. Le mot de passe est modifié régulièrement, et vous pouvez utiliser le chat dans le coin inférieur droit de la page pour en obtenir un nouveau.</h2>
          </hgroup>
          ${withError ? `<p class="error">Le mot de passe est incorrect. Veuillez le saisir à nouveau ou utiliser le chat au bas de la page.</p>` : ''}
          <form method="post" action="/cfp_login">
            <input type="hidden" name="redirect" value="${redirectPath}" />
            <input type="password" name="password" placeholder="Password" aria-label="Password" autocomplete="current-password" required autofocus>
            <button type="submit" class="contrast">Connexion</button>
          </form>
        </article>
      </main>
         <script> 
    window.intergramId = "6412868393";
    window.intergramCustomizations = {
        mainColor: "#474747",
        titleClosed: 'Я Вас зацікавив?',
        titleOpen: 'Надішліть мені повідомлення звідси',
        introMessage: 'Це спосіб блискавично швидко зв’язатися зі мною. Напишіть повідомлення внизу і натисніть Enter. Відповім якомога швидше.',
        autoResponse: 'Я вже отримав повідомлення. Де б я не був. Читаю його...',
        autoNoResponse: 'Секунду, заждіть ... ' + 'Ще трооошечки ...',
        alwaysUseFloatingButton: false // Use the mobile floating button also on large screens
    };
    window.intergramServer = "https://intergram.rmrf.pp.ua"
</script>
<script id="intergram" type="text/javascript" src="https://intergram.rmrf.pp.ua/js/widget.js"></script>
    </body>

  </html>
  `;
}
