export function SvgRenderer({ svgString }: { svgString: string }) {
  return (
    <div
      className="svg-container"
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
}
