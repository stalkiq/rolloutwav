
export default function RootRedirect() {
  // Static fallback redirect so the UI works even if JS is cached/blocked
  return (
    <html>
      <head>
        <meta httpEquiv="refresh" content="0; url=/login/" />
      </head>
      <body>
        <a href="/login/">Continue to login</a>
      </body>
    </html>
  );
}
