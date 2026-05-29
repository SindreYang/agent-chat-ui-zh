export function LangGraphLogoSVG({
  className,
  width,
  height,
}: {
  width?: number;
  height?: number;
  className?: string;
}) {
  // 占位 span，保留布局
  return (
    <span
      aria-hidden={true}
      className={className ?? "inline-block"}
      style={{
        width: typeof width === "number" ? `${width}px` : (width as any),
        height: typeof height === "number" ? `${height}px` : (height as any),
      }}
    />
  );
}
