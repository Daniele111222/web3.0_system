import React from 'react';
import { ConfigProvider as AntConfigProvider, theme } from 'antd';
import type { ConfigProviderProps } from 'antd/es/config-provider';

// 暗色主题配置
const customDarkTheme = {
  // 品牌色
  colorPrimary: '#00d4aa',
  colorPrimaryHover: '#5eead4',
  colorPrimaryActive: '#00b894',

  // 成功/警告/错误色
  colorSuccess: '#10b981',
  colorWarning: '#f59e0b',
  colorError: '#f43f5e',
  colorInfo: '#06b6d4',

  // 背景色
  colorBgBase: '#0a0a0f',
  colorBgContainer: 'rgba(26, 26, 36, 0.8)',
  colorBgElevated: 'rgba(26, 26, 36, 0.95)',
  colorBgLayout: '#0a0a0f',
  colorBgSpotlight: 'rgba(0, 212, 170, 0.1)',

  // 文字色
  colorText: '#ffffff',
  colorTextSecondary: 'rgba(255, 255, 255, 0.7)',
  colorTextTertiary: 'rgba(255, 255, 255, 0.5)',
  colorTextQuaternary: 'rgba(255, 255, 255, 0.35)',

  // 边框色
  colorBorder: 'rgba(255, 255, 255, 0.08)',
  colorBorderSecondary: 'rgba(255, 255, 255, 0.04)',
  colorSplit: 'rgba(255, 255, 255, 0.06)',

  // 圆角
  borderRadius: 10,
  borderRadiusSM: 6,
  borderRadiusLG: 14,
  borderRadiusXL: 20,
  borderRadiusXS: 4,

  // 阴影
  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
  boxShadowSecondary: '0 8px 32px rgba(0, 0, 0, 0.5)',
  boxShadowTertiary: '0 0 40px rgba(0, 0, 0, 0.6)',
};

// 组件 token 配置
const componentToken = {
  // Button
  Button: {
    colorPrimary: '#00d4aa',
    colorPrimaryHover: '#5eead4',
    colorPrimaryActive: '#00b894',
    primaryShadow: '0 4px 15px rgba(0, 212, 170, 0.3)',
    borderRadius: 10,
    controlHeight: 40,
    controlHeightLG: 44,
    controlHeightSM: 36,
  },

  // Card
  Card: {
    colorBgContainer: 'rgba(26, 26, 36, 0.8)',
    colorBorderSecondary: 'rgba(255, 255, 255, 0.08)',
    borderRadiusLG: 14,
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
  },

  // Table
  Table: {
    colorBgContainer: 'transparent',
    colorFillAlter: 'rgba(255, 255, 255, 0.02)',
    colorBorderSecondary: 'rgba(255, 255, 255, 0.06)',
    headerColor: '#ffffff',
    headerBg: 'rgba(255, 255, 255, 0.04)',
    rowHoverBg: 'rgba(255, 255, 255, 0.03)',
  },

  // Input
  Input: {
    colorBgContainer: 'rgba(17, 17, 24, 0.8)',
    colorBorder: 'rgba(255, 255, 255, 0.08)',
    colorPrimaryHover: '#00d4aa',
    colorPrimary: '#00d4aa',
    activeShadow: '0 0 0 3px rgba(0, 212, 170, 0.1)',
    borderRadius: 10,
    controlHeight: 44,
  },

  // Select
  Select: {
    colorBgContainer: 'rgba(17, 17, 24, 0.8)',
    colorBorder: 'rgba(255, 255, 255, 0.08)',
    colorPrimary: '#00d4aa',
    optionSelectedBg: 'rgba(0, 212, 170, 0.15)',
    optionSelectedColor: '#00d4aa',
    optionActiveBg: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    controlHeight: 44,
  },

  // Badge
  Badge: {
    colorBgContainer: '#0a0a0f',
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError: '#f43f5e',
    colorInfo: '#06b6d4',
  },

  // Tag
  Tag: {
    colorBgContainer: 'rgba(255, 255, 255, 0.06)',
    colorBorder: 'rgba(255, 255, 255, 0.08)',
    borderRadiusSM: 6,
  },

  // Avatar
  Avatar: {
    colorBgContainer: 'rgba(0, 212, 170, 0.15)',
    colorText: '#00d4aa',
  },

  // Tooltip
  Tooltip: {
    colorBgSpotlight: 'rgba(26, 26, 36, 0.95)',
    colorTextLightSolid: '#ffffff',
  },

  // Dropdown
  Dropdown: {
    colorBgElevated: 'rgba(26, 26, 36, 0.95)',
    colorBorder: 'rgba(255, 255, 255, 0.1)',
    borderRadiusLG: 10,
    boxShadowSecondary: '0 10px 40px rgba(0, 0, 0, 0.4)',
    controlItemBgHover: 'rgba(255, 255, 255, 0.06)',
    controlItemBgActive: 'rgba(0, 212, 170, 0.15)',
    controlItemBgActiveHover: 'rgba(0, 212, 170, 0.2)',
  },

  // Modal
  Modal: {
    colorBgElevated: 'rgba(26, 26, 36, 0.95)',
    colorIcon: 'rgba(255, 255, 255, 0.5)',
    colorIconHover: '#ffffff',
    borderRadiusLG: 14,
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
    headerBg: 'transparent',
    contentBg: 'rgba(26, 26, 36, 0.95)',
    footerBg: 'transparent',
  },

  // Drawer
  Drawer: {
    colorBgElevated: 'rgba(26, 26, 36, 0.95)',
    colorIcon: 'rgba(255, 255, 255, 0.5)',
    colorIconHover: '#ffffff',
    borderRadius: 0,
    boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.4)',
  },

  // Menu
  Menu: {
    colorBgContainer: 'transparent',
    colorItemText: 'rgba(255, 255, 255, 0.7)',
    colorItemTextHover: '#ffffff',
    colorItemTextSelected: '#00d4aa',
    colorItemBgHover: 'rgba(255, 255, 255, 0.06)',
    colorItemBgSelected: 'rgba(0, 212, 170, 0.15)',
    colorItemBgSelectedHover: 'rgba(0, 212, 170, 0.2)',
    colorSubItemBg: 'transparent',
    borderRadius: 8,
    itemBorderRadius: 8,
    itemMarginInline: 4,
    itemMarginBlock: 2,
  },

  // Pagination
  Pagination: {
    colorBgContainer: 'transparent',
    colorBgTextHover: 'rgba(255, 255, 255, 0.06)',
    colorBgTextActive: 'rgba(0, 212, 170, 0.15)',
    colorText: 'rgba(255, 255, 255, 0.7)',
    colorPrimary: '#00d4aa',
    colorPrimaryHover: '#5eead4',
    borderRadius: 8,
    itemSize: 36,
    itemSizeSM: 28,
    itemSizeLG: 44,
  },

  // Steps
  Steps: {
    colorText: 'rgba(255, 255, 255, 0.5)',
    colorTextDescription: 'rgba(255, 255, 255, 0.4)',
    colorPrimary: '#00d4aa',
    colorSplit: 'rgba(255, 255, 255, 0.08)',
    itemSize: 36,
    iconSize: 20,
    iconSizeSM: 16,
  },

  // Collapse
  Collapse: {
    colorBgContainer: 'rgba(26, 26, 36, 0.6)',
    colorText: '#ffffff',
    colorTextHeading: '#ffffff',
    colorBorder: 'rgba(255, 255, 255, 0.08)',
    borderRadiusLG: 10,
    headerBg: 'rgba(255, 255, 255, 0.02)',
    headerPadding: '12px 16px',
    contentBg: 'transparent',
    contentPadding: '16px',
  },

  // Descriptions
  Descriptions: {
    colorText: 'rgba(255, 255, 255, 0.7)',
    colorTextSecondary: 'rgba(255, 255, 255, 0.5)',
    colorSplit: 'rgba(255, 255, 255, 0.08)',
    colorBgContainer: 'transparent',
    itemPaddingBottom: 16,
    colonMarginRight: 8,
    labelColor: 'rgba(255, 255, 255, 0.5)',
    contentColor: '#ffffff',
    fontSize: 14,
    lineHeight: 1.6,
    borderRadius: 6,
    itemBorderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    titleColor: '#ffffff',
    titleFontSize: 16,
    titleFontWeight: 600,
    titleMarginBottom: 20,
    extraColor: 'rgba(255, 255, 255, 0.5)',
    borderedBorderColor: 'rgba(255, 255, 255, 0.08)',
    borderedItemBg: 'rgba(255, 255, 255, 0.02)',
  },

  // Empty
  Empty: {
    colorText: 'rgba(255, 255, 255, 0.5)',
    colorTextDescription: 'rgba(255, 255, 255, 0.4)',
    controlHeightLG: 120,
    fontSize: 14,
    lineHeight: 1.6,
  },

  // Result
  Result: {
    colorText: '#ffffff',
    colorTextDescription: 'rgba(255, 255, 255, 0.7)',
    colorTextSubTitle: 'rgba(255, 255, 255, 0.5)',
    iconFontSize: 72,
    titleFontSize: 24,
    subTitleFontSize: 14,
    extraMargin: '24px 0 0 0',
  },

  // Skeleton
  Skeleton: {
    color: 'rgba(255, 255, 255, 0.06)',
    colorGradientEnd: 'rgba(255, 255, 255, 0.1)',
    gradientFromColor: 'rgba(255, 255, 255, 0.06)',
    gradientToColor: 'rgba(255, 255, 255, 0.1)',
    titleHeight: 16,
    paragraphHeight: 14,
    paragraphMarginTop: 16,
    titleMarginTop: 16,
    titleMarginBottom: 16,
    paragraphMarginBottom: 0,
    borderRadius: 6,
    circleSize: 40,
    lineHeight: 1.6,
  },

  // Statistic
  Statistic: {
    colorText: '#ffffff',
    colorTextDescription: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    fontSizeHeading3: 32,
    fontWeight: 600,
    lineHeight: 1.4,
    marginBottom: 4,
  },

  // Switch
  Switch: {
    colorPrimary: '#00d4aa',
    colorPrimaryHover: '#5eead4',
    colorPrimaryActive: '#00b894',
    colorBgContainer: 'rgba(255, 255, 255, 0.2)',
    colorBgContainerChecked: '#00d4aa',
    handleBg: '#ffffff',
    handleShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    innerMaxMargin: 2,
    innerMinMargin: 2,
    trackHeight: 24,
    trackMinWidth: 44,
    handleSize: 20,
    trackPadding: 2,
  },

  // Slider
  Slider: {
    colorPrimary: '#00d4aa',
    colorPrimaryHover: '#5eead4',
    colorPrimaryBorder: '#00d4aa',
    colorPrimaryBorderHover: '#5eead4',
    colorBgElevated: '#ffffff',
    colorBorder: 'rgba(255, 255, 255, 0.2)',
    controlSize: 16,
    dotSize: 8,
    handleLineWidth: 2,
    handleLineWidthHover: 3,
    railBg: 'rgba(255, 255, 255, 0.1)',
    railHoverBg: 'rgba(255, 255, 255, 0.15)',
    trackBg: '#00d4aa',
    trackHoverBg: '#5eead4',
    handleColor: '#ffffff',
    handleActiveColor: '#00d4aa',
    handleActiveOutlineColor: 'rgba(0, 212, 170, 0.2)',
    dotBorderColor: 'rgba(255, 255, 255, 0.2)',
    dotActiveBorderColor: '#00d4aa',
  },

  // Rate
  Rate: {
    colorPrimary: '#f59e0b',
    colorPrimaryHover: '#fbbf24',
    colorFillContent: 'rgba(255, 255, 255, 0.15)',
    controlHeightLG: 40,
    controlHeight: 32,
    controlHeightSM: 24,
    starColor: 'rgba(255, 255, 255, 0.2)',
    starHoverColor: '#fbbf24',
    starSize: 20,
  },

  // Segmented
  Segmented: {
    colorBgElevated: 'rgba(0, 0, 0, 0.3)',
    colorText: 'rgba(255, 255, 255, 0.6)',
    colorTextLabel: 'rgba(255, 255, 255, 0.8)',
    itemSelectedBg: 'rgba(0, 212, 170, 0.2)',
    itemSelectedColor: '#00d4aa',
    itemHoverBg: 'rgba(255, 255, 255, 0.05)',
    itemHoverColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    controlHeight: 40,
  },

  // Upload
  Upload: {
    colorPrimary: '#00d4aa',
    colorPrimaryHover: '#5eead4',
    colorText: 'rgba(255, 255, 255, 0.8)',
    colorTextDescription: 'rgba(255, 255, 255, 0.5)',
    colorFillAlter: 'rgba(255, 255, 255, 0.04)',
    colorBorder: 'rgba(255, 255, 255, 0.1)',
    controlHeightLG: 48,
    fontSize: 14,
    lineWidth: 1,
    borderRadiusLG: 10,
  },

  // Calendar
  Calendar: {
    colorBgContainer: 'transparent',
    colorBgElevated: 'rgba(26, 26, 36, 0.8)',
    colorText: 'rgba(255, 255, 255, 0.8)',
    colorTextHeading: '#ffffff',
    colorSplit: 'rgba(255, 255, 255, 0.08)',
    controlItemBgHover: 'rgba(255, 255, 255, 0.06)',
    controlItemBgActive: 'rgba(0, 212, 170, 0.15)',
    controlHeight: 32,
    fontSize: 14,
    lineHeight: 1.5,
    borderRadius: 8,
  },

  // Popover
  Popover: {
    colorBgElevated: 'rgba(26, 26, 36, 0.95)',
    colorText: 'rgba(255, 255, 255, 0.8)',
    colorTextHeading: '#ffffff',
    colorBorder: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
  },

  // Popconfirm
  Popconfirm: {
    colorBgElevated: 'rgba(26, 26, 36, 0.95)',
    colorText: 'rgba(255, 255, 255, 0.8)',
    colorBorder: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
  },

  // Timeline
  Timeline: {
    colorText: 'rgba(255, 255, 255, 0.8)',
    colorTextSecondary: 'rgba(255, 255, 255, 0.5)',
    colorSplit: 'rgba(255, 255, 255, 0.08)',
    dotBg: '#0a0a0f',
    dotBorderWidth: 2,
    itemPaddingBottom: 20,
  },

  // Anchor
  Anchor: {
    colorPrimary: '#00d4aa',
    colorText: 'rgba(255, 255, 255, 0.6)',
    colorSplit: 'rgba(255, 255, 255, 0.08)',
    anchorBg: 'transparent',
    borderWidth: 2,
    ballSize: 8,
    linkPadding: '8px 0 8px 16px',
    linkPaddingInlineStart: 16,
    inkBarColor: '#00d4aa',
  },

  // BackTop
  BackTop: {
    colorBgContainer: 'rgba(26, 26, 36, 0.9)',
    colorText: '#ffffff',
    colorBorder: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 50,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
    controlHeight: 44,
    fontSize: 20,
  },
};

// ConfigProvider 组件
export const ConfigProvider: React.FC<ConfigProviderProps & { children: React.ReactNode }> = ({
  children,
  theme: customTheme,
  ...props
}) => {
  return (
    <AntConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          ...customDarkTheme,
          ...customTheme?.token,
        },
        components: {
          ...componentToken,
          ...customTheme?.components,
        },
      }}
      {...props}
    >
      {children}
    </AntConfigProvider>
  );
};

export default ConfigProvider;
