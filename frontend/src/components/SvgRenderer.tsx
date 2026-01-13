export function SvgRenderer({ svgString, className }: { svgString: string, className?: string }) {
  return (
    <div
      className={`svg-container ${className}`}
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
}
