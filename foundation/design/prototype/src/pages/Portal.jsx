import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PORTAL_TITLE = '产品原型导航';
const PORTAL_SUBTITLE = '选择终端，进入对应高保真交互原型';

const terminals = [
  {
    key: 'web',
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <rect x="2" y="3" width="22" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.8" fill="none"/>
        <path d="M8 23h10M13 18v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M6 9h14M6 13h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
    name: 'PC Web',
    tag: '桌面浏览器',
    desc: '管理端与复杂工作流的主阵地，支持数据看板、权限管理、配置中心等全功能后台',
    path: '/web/home',
    available: true,
    color: '#2563eb',
    bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
  },
  {
    key: 'mobile-h5',
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <rect x="7" y="2" width="12" height="22" rx="3" stroke="currentColor" strokeWidth="1.8" fill="none"/>
        <circle cx="13" cy="21" r="1.1" fill="currentColor"/>
        <path d="M10 6h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <path d="M9 11h8M9 14.5h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
    name: 'Mobile H5',
    tag: '手机浏览器',
    desc: '无需安装，用户侧轻量入口，适配 iOS / Android 浏览器，覆盖核心用户流程',
    path: '/mobile/home',
    available: false,
    color: '#7c3aed',
    bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
  },
  {
    key: 'ios',
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <path d="M17 2.5c.3 1.7-.5 3.3-1.7 4.4-1.2 1.1-2.8 1.7-4.3 1.5-.3-1.6.5-3.3 1.7-4.3C13.9 3 15.5 2.3 17 2.5z" fill="currentColor"/>
        <path d="M20.5 18c-.8 1.8-1.2 2.7-2.3 4.4-1.5 2.2-3.6 2.5-4.9.1-.8-1.4-1.1-2.1-2.4-2.1s-1.7.7-2.4 2.1C7 24.9 5 24.4 3.7 22c-2.8-4.5-2.2-12.3 2-15 1.6-1 3.6-1 5.1 0 .9.6 1.4.7 2.2 0 1.6-1.1 3.8-1 5.4.1 1.6 1.2 2.6 3 3 5-.8.5-1.6 1.4-1 2.9z" stroke="currentColor" strokeWidth="1.8" fill="none"/>
      </svg>
    ),
    name: 'iOS App',
    tag: '原生 iPhone / iPad',
    desc: '原生 iOS 应用，支持推送通知、设备 API、App Store 分发，高频用户场景首选',
    path: '/ios/home',
    available: false,
    color: '#374151',
    bg: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
  },
  {
    key: 'android',
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <path d="M5 16V11a8 8 0 0 1 16 0v5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="1.8" fill="none"/>
        <path d="M9 21v-3M17 21v-3M2 12h2M22 12h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="10" cy="12" r="1.1" fill="currentColor"/>
        <circle cx="16" cy="12" r="1.1" fill="currentColor"/>
        <path d="M8.5 6L7 4M17.5 6l1.5-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    name: 'Android App',
    tag: '原生安卓',
    desc: '原生 Android 应用，覆盖国内最大移动用户群体，支持多厂商应用商店分发',
    path: '/android/home',
    available: false,
    color: '#16a34a',
    bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
  },
  {
    key: 'miniapp',
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <circle cx="13" cy="13" r="10" stroke="currentColor" strokeWidth="1.8" fill="none"/>
        <path d="M8.5 13a4.5 4.5 0 0 0 9 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="10" cy="10.5" r="1.2" fill="currentColor"/>
        <circle cx="16" cy="10.5" r="1.2" fill="currentColor"/>
      </svg>
    ),
    name: '微信小程序',
    tag: '微信生态',
    desc: '国内 C 端核心流量入口，即点即用无需下载，覆盖微信 12 亿月活用户的高频场景',
    path: '/miniapp/home',
    available: false,
    color: '#07c160',
    bg: 'linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%)',
  },
  {
    key: 'desktop',
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <rect x="2" y="3" width="22" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" fill="none"/>
        <path d="M8 23h10M13 17v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M2 13h22" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M6 8h6M6 11h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
    name: 'Desktop App',
    tag: '桌面客户端',
    desc: '需要离线使用、本地文件处理或系统级能力时的原生桌面端，支持 macOS / Windows',
    path: '/desktop/home',
    available: false,
    color: '#d97706',
    bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
  },
  {
    key: 'ipad',
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <rect x="2" y="1" width="22" height="24" rx="2.5" stroke="currentColor" strokeWidth="1.8" fill="none"/>
        <circle cx="13" cy="22" r="1.1" fill="currentColor"/>
        <path d="M7 5h12M7 8h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
    name: 'iPad App',
    tag: '平板端',
    desc: '大屏平板专属交互，适合内容创作、数据展示或多任务并行的横屏专属体验',
    path: '/ipad/home',
    available: false,
    color: '#4f46e5',
    bg: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
  },
  {
    key: 'wecom',
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <path d="M15 4c4 0 7 2.7 7 6s-3 6-7 6c-.6 0-1.2-.1-1.8-.2L8 18v-3c-1.3-1-2-2.5-2-4 0-3.3 3-6 7-6h2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
        <path d="M8 10c-3.5.5-6 2.8-6 5.5 0 1.3.6 2.5 1.6 3.4L4 21l3.4-1.5c.8.3 1.7.5 2.6.5 2.5 0 4.7-1.3 5.7-3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    ),
    name: '企业微信',
    tag: '企业协同生态',
    desc: 'B 端产品嵌入企业微信工作台，触达企业员工日活，适合 OA、审批、协同场景',
    path: '/wecom/home',
    available: false,
    color: '#1a73e8',
    bg: 'linear-gradient(135deg, #e8f0fe 0%, #d2e3fc 100%)',
  },
  {
    key: 'dingtalk',
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <circle cx="13" cy="13" r="10" stroke="currentColor" strokeWidth="1.8" fill="none"/>
        <path d="M8 17l2-2.5 2 1.5 2.5-4 2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 10h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
    name: '钉钉小程序',
    tag: '钉钉生态',
    desc: '深度融入钉钉工作台与通讯录，覆盖政企及制造业场景，支持消息卡片主动触达',
    path: '/dingtalk/home',
    available: false,
    color: '#0064fa',
    bg: 'linear-gradient(135deg, #e8f0ff 0%, #d0e2ff 100%)',
  },
];

function TerminalCard({ t }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={() => t.available && navigate(t.path)}
      onMouseEnter={() => t.available && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? t.bg : '#ffffff',
        border: `1.5px solid ${hovered ? t.color + '50' : '#e2e8f0'}`,
        borderRadius: 18,
        padding: '22px 24px 18px',
        cursor: t.available ? 'pointer' : 'default',
        opacity: t.available ? 1 : 0.55,
        transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
        transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: hovered
          ? `0 10px 28px ${t.color}15, 0 2px 6px rgba(0,0,0,0.05)`
          : '0 1px 3px rgba(0,0,0,0.04)',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      {hovered && (
        <div style={{
          position: 'absolute', top: -20, right: -20,
          width: 72, height: 72, borderRadius: '50%',
          background: t.color + '0d', pointerEvents: 'none',
        }} />
      )}

      {/* 图标 */}
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: hovered ? t.color + '18' : '#f1f5f9',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: hovered ? t.color : '#64748b',
        marginBottom: 12, transition: 'all 0.2s', flexShrink: 0,
      }}>
        {t.icon}
      </div>

      {/* 标题 + 状态 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
        <span style={{ fontSize: 14, fontWeight: 650, color: '#0f172a', letterSpacing: '-0.01em' }}>
          {t.name}
        </span>
        <span style={{
          fontSize: 10, padding: '2px 7px', borderRadius: 20, flexShrink: 0,
          background: t.available ? (hovered ? t.color + '18' : '#f0fdf4') : '#f8fafc',
          color: t.available ? (hovered ? t.color : '#16a34a') : '#94a3b8',
          border: `1px solid ${t.available ? (hovered ? t.color + '30' : '#bbf7d0') : '#e2e8f0'}`,
          fontWeight: 500, transition: 'all 0.2s',
        }}>
          {t.available ? '可用' : '规划中'}
        </span>
      </div>

      {/* tag */}
      <div style={{
        fontSize: 11, color: hovered ? t.color : '#94a3b8',
        fontWeight: 500, marginBottom: 8, transition: 'color 0.2s',
      }}>{t.tag}</div>

      {/* 描述 */}
      <p style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.65, margin: 0, flex: 1 }}>
        {t.desc}
      </p>

      {t.available && (
        <div style={{
          marginTop: 12, display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 11, fontWeight: 500,
          color: hovered ? t.color : '#94a3b8', transition: 'color 0.2s',
        }}>
          进入原型
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
            style={{ transform: hovered ? 'translateX(3px)' : 'none', transition: 'transform 0.2s' }}>
            <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
    </div>
  );
}

export default function Portal() {
  return (
    <div style={{
      fontFamily: "-apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif",
      background: '#f8fafc',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'fixed', top: -160, left: '50%', transform: 'translateX(-50%)',
        width: 700, height: 400,
        background: 'radial-gradient(ellipse, rgba(37,99,235,0.06) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        padding: '36px 48px 24px',
        position: 'relative', zIndex: 1, boxSizing: 'border-box',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28, flexShrink: 0 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: '#eff6ff', border: '1px solid #bfdbfe',
            borderRadius: 20, padding: '3px 12px',
            fontSize: 11, color: '#2563eb', fontWeight: 500, marginBottom: 12,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#2563eb', display: 'inline-block' }} />
            高保真交互原型
          </div>
          <h1 style={{
            fontSize: 32, fontWeight: 700, color: '#0f172a',
            margin: '0 0 6px', letterSpacing: '-0.02em', lineHeight: 1.2,
          }}>{PORTAL_TITLE}</h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>{PORTAL_SUBTITLE}</p>
        </div>

        {/* 9 终端 3×3 等比网格 */}
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)',
          gap: 16,
          minHeight: 0,
        }}>
          {terminals.map(t => <TerminalCard key={t.key} t={t} />)}
        </div>

        <p style={{
          marginTop: 16, fontSize: 11, color: '#94a3b8',
          textAlign: 'center', flexShrink: 0,
        }}>
          原型仅作 UI 设计参考，使用 Mock 数据，不含真实接口调用
        </p>
      </div>
    </div>
  );
}
