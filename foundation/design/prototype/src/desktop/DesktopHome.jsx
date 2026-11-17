// 桌面端终端原型入口示例页。产品落地时在 src/desktop/ 下实现真实页面。
export default function DesktopHome() {
  return (
    <div style={{ padding: 48, fontFamily: "-apple-system, 'PingFang SC', sans-serif" }}>
      <h1 style={{ fontSize: 24, color: '#1c1f23' }}>桌面端原型</h1>
      <p style={{ color: '#6b7280' }}>
        在 <code>src/desktop/</code> 下实现桌面端终端的高保真原型页面，并在 <code>src/App.jsx</code> 注册路由。
      </p>
    </div>
  );
}
