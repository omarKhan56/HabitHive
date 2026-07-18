export default function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          width: "600px",
          height: "340px",
          background: "#0f172a",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        {children}
      </body>
    </html>
  );
}