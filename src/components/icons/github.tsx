export const GitHubSVG = ({ width = "100%", height = "100%" }) => {
  // 占位 span，保留布局
  return (
    <span
      aria-hidden={true}
      className="inline-block"
      style={{ width: width as any, height: height as any }}
    />
  );
};
