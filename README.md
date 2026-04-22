# Rainbow Petopia Static Build

This directory now contains a clean standalone rebuild of the Rainbow Petopia homepage, designed to be deployed on your own server without Wix runtime dependencies.

## Files

- `index.html`: main page
- `styles.css`: all layout and visual styles
- `script.js`: mobile navigation, section highlighting, and contact form behavior
- `config.js`: basic runtime configuration for the contact form
- `assets/images/*`: local copies of the current site imagery

## Contact Form

By default, the contact form uses a mail client fallback so the page works immediately without backend code.

If you want direct form submission from the website:

1. Open `config.js`
2. Set `formEndpoint` to your backend URL
3. Keep `formFormat` as `"json"` if your endpoint accepts JSON, or change it to `"form-data"` if your endpoint expects multipart form data

## Deployment

This is a plain static site. You can host it with:

- Nginx
- Apache
- Caddy
- GitHub Pages
- Netlify
- Vercel static hosting
- any basic file server on your own VPS

## Notes

- The Wix template footer text, broken email typo, and placeholder social links were intentionally cleaned up.
- The gallery interaction was rebuilt in pure CSS and works on both desktop and mobile.
- The original Wix background video was simplified into a local still background for easier independent hosting and better performance control.
