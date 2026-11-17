// 移动端终端原型入口示例页。产品落地时在 src/mobile/ 下实现真实页面。
export default function MobileHome() {
  return (
    <div style={{ padding: 48, fontFamily: "-apple-system, 'PingFang SC', sans-serif" }}>
      <h1 style={{ fontSize: 24, color: '#1c1f23' }}>移动端原型</h1>
      <p style={{ color: '#6b7280' }}>
        在 <code>src/mobile/</code> 下实现移动端终端的高保真原型页面（建议在设备外壳内渲染），并在 <code>src/App.jsx</code> 注册路由。
      </p>
    </div>
  );
}
