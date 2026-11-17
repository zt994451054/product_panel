// PC Web 终端原型入口示例页。产品落地时在 src/web/ 下实现真实页面。
export default function WebHome() {
  return (
    <div style={{ padding: 48, fontFamily: "-apple-system, 'PingFang SC', sans-serif" }}>
      <h1 style={{ fontSize: 24, color: '#1c1f23' }}>PC Web 原型</h1>
      <p style={{ color: '#6b7280' }}>
        在 <code>src/web/</code> 下实现 PC Web 终端的高保真原型页面，并在 <code>src/App.jsx</code> 注册路由。
      </p>
    </div>
  );
}
