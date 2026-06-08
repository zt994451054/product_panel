import { useNavigate } from 'react-router-dom';

// 产品落地时改为「{产品名} 原型导航」
const PORTAL_TITLE = '产品原型导航';

const terminals = [
  { key: 'web', icon: '🖥️', name: 'PC Web', desc: '桌面端控制台\n管理后台全功能', path: '/web/home', available: true },
  { key: 'mobile', icon: '📱', name: 'Mobile H5', desc: '移动端轻应用\n核心功能访问', path: '/mobile/home', available: false },
  { key: 'desktop', icon: '💻', name: 'Desktop', desc: '桌面客户端\n离线/本地能力', path: '/desktop/home', available: false },
];

export default function Portal() {
  const navigate = useNavigate();

  return (
    <div style={{
      fontFamily: "-apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif",
      background: '#f5f7fa',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ fontSize: 28, fontWeight: 600, color: '#1c1f23', marginBottom: 8 }}>
          {PORTAL_TITLE}
        </div>
        <div style={{ fontSize: 15, color: '#6b7280', marginBottom: 48 }}>
          选择要访问的终端原型
        </div>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
          {terminals.map((t) => (
            <div
              key={t.key}
              onClick={() => t.available && navigate(t.path)}
              style={{
                background: '#fff',
                border: '1px solid #edf0f5',
                borderRadius: 16,
                padding: '36px 40px',
                width: 240,
                cursor: t.available ? 'pointer' : 'default',
                opacity: t.available ? 1 : 0.45,
                transition: 'box-shadow 0.2s, transform 0.2s',
                userSelect: 'none',
              }}
              onMouseEnter={(e) => {
                if (!t.available) return;
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,100,250,0.12)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 16 }}>{t.icon}</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#1c1f23', marginBottom: 8 }}>
                {t.name}
              </div>
              <div style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {t.desc}
              </div>
              <span style={{
                display: 'inline-block',
                marginTop: 12,
                fontSize: 11,
                padding: '2px 8px',
                background: t.available ? '#e8f3ff' : '#f5f5f5',
                color: t.available ? '#0064fa' : '#9ca3af',
                borderRadius: 20,
              }}>
                {t.available ? '可用' : '规划中'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
