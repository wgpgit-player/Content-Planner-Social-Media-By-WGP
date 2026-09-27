export default function CampaignArt({ tile = 0, theme = 'agency', className = '', label = '', children }) {
  const index = ((tile % 9) + 9) % 9
  const [width, height] = theme === 'fashion' ? [1122, 1402] : [1860, 846]
  const cellWidth = width / 3
  const cellHeight = height / 3
  return <div className={'campaign-art ' + className}>
    <svg viewBox={`${index % 3 * cellWidth + 3} ${Math.floor(index / 3) * cellHeight + 3} ${cellWidth - 6} ${cellHeight - 6}`} preserveAspectRatio="xMidYMid slice" role={label ? 'img' : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : true}>
      <image href={`/images/campaign-${theme}-v4.png`} width={width} height={height}/>
    </svg>
    {children}
  </div>
}
