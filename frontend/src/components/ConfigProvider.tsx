import React from 'react';
import { ConfigProvider as AntConfigProvider, theme } from 'antd';
import type { ConfigProviderProps } from 'antd/es/config-provider';

const customLightTheme = {
  colorPrimary: '#0d9488',
  colorPrimaryHover: '#14b8a6',
  colorPrimaryActive: '#0f766e',

  colorSuccess: '#16a34a',
  colorWarning: '#d97706',
  colorError: '#dc2626',
  colorInfo: '#2563eb',

  colorBgBase: '#f6f8fb',
  colorBgContainer: '#ffffff',
  colorBgElevated: '#ffffff',
  colorBgLayout: '#eef3f8',
  colorBgSpotlight: '#ecfeff',

  colorText: '#122033',
  colorTextSecondary: 'rgba(18, 32, 51, 0.72)',
  colorTextTertiary: 'rgba(18, 32, 51, 0.52)',
  colorTextQuaternary: 'rgba(18, 32, 51, 0.36)',

  colorBorder: 'rgba(15, 23, 42, 0.12)',
  colorBorderSecondary: 'rgba(15, 23, 42, 0.08)',
  colorSplit: 'rgba(15, 23, 42, 0.08)',

  borderRadius: 8,
  borderRadiusSM: 6,
  borderRadiusLG: 10,
  borderRadiusXL: 14,
  borderRadiusXS: 4,

  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
  boxShadowSecondary: '0 14px 36px rgba(15, 23, 42, 0.12)',
  boxShadowTertiary: '0 20px 48px rgba(15, 23, 42, 0.16)',
};

const componentToken = {
  Button: {
    colorPrimary: '#0d9488',
    colorPrimaryHover: '#14b8a6',
    colorPrimaryActive: '#0f766e',
    primaryShadow: '0 8px 18px rgba(13, 148, 136, 0.22)',
    borderRadius: 8,
    controlHeight: 40,
    controlHeightLG: 44,
    controlHeightSM: 36,
  },
  Card: {
    colorBgContainer: '#ffffff',
    colorBorderSecondary: 'rgba(15, 23, 42, 0.08)',
    borderRadiusLG: 10,
    boxShadow: '0 10px 28px rgba(15, 23, 42, 0.08)',
  },
  Table: {
    colorBgContainer: '#ffffff',
    colorFillAlter: '#f8fafc',
    colorBorderSecondary: 'rgba(15, 23, 42, 0.08)',
    headerColor: '#334155',
    headerBg: '#f1f5f9',
    rowHoverBg: '#f8fafc',
  },
  Input: {
    colorBgContainer: '#ffffff',
    colorBorder: 'rgba(15, 23, 42, 0.14)',
    colorPrimaryHover: '#0d9488',
    colorPrimary: '#0d9488',
    activeShadow: '0 0 0 3px rgba(13, 148, 136, 0.14)',
    borderRadius: 8,
    controlHeight: 44,
  },
  Select: {
    colorBgContainer: '#ffffff',
    colorBorder: 'rgba(15, 23, 42, 0.14)',
    colorPrimary: '#0d9488',
    optionSelectedBg: 'rgba(13, 148, 136, 0.1)',
    optionSelectedColor: '#0f766e',
    optionActiveBg: '#f1f5f9',
    borderRadius: 8,
    controlHeight: 44,
  },
  Badge: {
    colorBgContainer: '#ffffff',
    colorSuccess: '#16a34a',
    colorWarning: '#d97706',
    colorError: '#dc2626',
    colorInfo: '#2563eb',
  },
  Tag: {
    colorBgContainer: '#f8fafc',
    colorBorder: 'rgba(15, 23, 42, 0.1)',
    borderRadiusSM: 6,
  },
  Avatar: {
    colorBgContainer: 'rgba(13, 148, 136, 0.12)',
    colorText: '#0f766e',
  },
  Tooltip: {
    colorBgSpotlight: '#122033',
    colorTextLightSolid: '#ffffff',
  },
  Dropdown: {
    colorBgElevated: '#ffffff',
    colorBorder: 'rgba(15, 23, 42, 0.1)',
    borderRadiusLG: 8,
    boxShadowSecondary: '0 14px 36px rgba(15, 23, 42, 0.14)',
    controlItemBgHover: '#f1f5f9',
    controlItemBgActive: 'rgba(13, 148, 136, 0.1)',
    controlItemBgActiveHover: 'rgba(13, 148, 136, 0.14)',
  },
  Modal: {
    colorBgElevated: '#ffffff',
    colorIcon: 'rgba(18, 32, 51, 0.5)',
    colorIconHover: '#122033',
    borderRadiusLG: 10,
    boxShadow: '0 24px 60px rgba(15, 23, 42, 0.18)',
    headerBg: 'transparent',
    contentBg: '#ffffff',
    footerBg: 'transparent',
  },
  Drawer: {
    colorBgElevated: '#ffffff',
    colorIcon: 'rgba(18, 32, 51, 0.5)',
    colorIconHover: '#122033',
    borderRadius: 0,
    boxShadow: '-10px 0 36px rgba(15, 23, 42, 0.12)',
  },
  Menu: {
    colorBgContainer: 'transparent',
    colorItemText: 'rgba(18, 32, 51, 0.72)',
    colorItemTextHover: '#122033',
    colorItemTextSelected: '#0f766e',
    colorItemBgHover: 'rgba(13, 148, 136, 0.08)',
    colorItemBgSelected: 'rgba(13, 148, 136, 0.12)',
    colorItemBgSelectedHover: 'rgba(13, 148, 136, 0.16)',
    colorSubItemBg: 'transparent',
    borderRadius: 8,
    itemBorderRadius: 8,
    itemMarginInline: 4,
    itemMarginBlock: 2,
  },
  Pagination: {
    colorBgContainer: '#ffffff',
    colorBgTextHover: '#f1f5f9',
    colorBgTextActive: 'rgba(13, 148, 136, 0.12)',
    colorText: 'rgba(18, 32, 51, 0.72)',
    colorPrimary: '#0d9488',
    colorPrimaryHover: '#14b8a6',
    borderRadius: 8,
    itemSize: 36,
    itemSizeSM: 28,
    itemSizeLG: 44,
  },
  Steps: {
    colorText: 'rgba(18, 32, 51, 0.58)',
    colorTextDescription: 'rgba(18, 32, 51, 0.48)',
    colorPrimary: '#0d9488',
    colorSplit: 'rgba(15, 23, 42, 0.1)',
    itemSize: 36,
    iconSize: 20,
    iconSizeSM: 16,
  },
  Collapse: {
    colorBgContainer: '#ffffff',
    colorText: '#122033',
    colorTextHeading: '#122033',
    colorBorder: 'rgba(15, 23, 42, 0.1)',
    borderRadiusLG: 8,
    headerBg: '#f8fafc',
    headerPadding: '12px 16px',
    contentBg: '#ffffff',
    contentPadding: '16px',
  },
  Empty: {
    colorText: 'rgba(18, 32, 51, 0.52)',
    colorTextDescription: 'rgba(18, 32, 51, 0.44)',
    controlHeightLG: 120,
    fontSize: 14,
    lineHeight: 1.6,
  },
  Skeleton: {
    color: '#e2e8f0',
    colorGradientEnd: '#f8fafc',
    gradientFromColor: '#e2e8f0',
    gradientToColor: '#f8fafc',
    titleHeight: 16,
    paragraphHeight: 14,
    borderRadius: 6,
  },
  Statistic: {
    colorText: '#122033',
    colorTextDescription: 'rgba(18, 32, 51, 0.52)',
    fontSizeHeading3: 32,
    fontWeight: 600,
  },
  Switch: {
    colorPrimary: '#0d9488',
    colorPrimaryHover: '#14b8a6',
    colorPrimaryActive: '#0f766e',
    colorBgContainer: '#cbd5e1',
    colorBgContainerChecked: '#0d9488',
    handleBg: '#ffffff',
    handleShadow: '0 2px 6px rgba(15, 23, 42, 0.18)',
  },
  Slider: {
    colorPrimary: '#0d9488',
    colorPrimaryHover: '#14b8a6',
    colorPrimaryBorder: '#0d9488',
    colorPrimaryBorderHover: '#14b8a6',
    colorBgElevated: '#ffffff',
    colorBorder: 'rgba(15, 23, 42, 0.16)',
    railBg: '#e2e8f0',
    railHoverBg: '#cbd5e1',
    trackBg: '#0d9488',
    trackHoverBg: '#14b8a6',
    handleColor: '#ffffff',
    handleActiveColor: '#0d9488',
    handleActiveOutlineColor: 'rgba(13, 148, 136, 0.18)',
  },
  Upload: {
    colorPrimary: '#0d9488',
    colorPrimaryHover: '#14b8a6',
    colorText: 'rgba(18, 32, 51, 0.78)',
    colorTextDescription: 'rgba(18, 32, 51, 0.52)',
    colorFillAlter: '#f8fafc',
    colorBorder: 'rgba(15, 23, 42, 0.12)',
    borderRadiusLG: 8,
  },
  Calendar: {
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorText: 'rgba(18, 32, 51, 0.78)',
    colorTextHeading: '#122033',
    colorSplit: 'rgba(15, 23, 42, 0.08)',
    controlItemBgHover: '#f1f5f9',
    controlItemBgActive: 'rgba(13, 148, 136, 0.12)',
  },
  Popover: {
    colorBgElevated: '#ffffff',
    colorText: 'rgba(18, 32, 51, 0.78)',
    colorTextHeading: '#122033',
    colorBorder: 'rgba(15, 23, 42, 0.1)',
    borderRadius: 8,
    boxShadow: '0 14px 36px rgba(15, 23, 42, 0.14)',
  },
  Popconfirm: {
    colorBgElevated: '#ffffff',
    colorText: 'rgba(18, 32, 51, 0.78)',
    colorBorder: 'rgba(15, 23, 42, 0.1)',
    borderRadius: 8,
    boxShadow: '0 14px 36px rgba(15, 23, 42, 0.14)',
  },
  Timeline: {
    colorText: 'rgba(18, 32, 51, 0.78)',
    colorTextSecondary: 'rgba(18, 32, 51, 0.52)',
    colorSplit: 'rgba(15, 23, 42, 0.1)',
    dotBg: '#ffffff',
    dotBorderWidth: 2,
  },
  Anchor: {
    colorPrimary: '#0d9488',
    colorText: 'rgba(18, 32, 51, 0.62)',
    colorSplit: 'rgba(15, 23, 42, 0.1)',
    anchorBg: 'transparent',
    inkBarColor: '#0d9488',
  },
  BackTop: {
    colorBgContainer: '#ffffff',
    colorText: '#122033',
    colorBorder: 'rgba(15, 23, 42, 0.1)',
    borderRadius: 50,
    boxShadow: '0 10px 28px rgba(15, 23, 42, 0.14)',
  },
};

export const ConfigProvider: React.FC<ConfigProviderProps & { children: React.ReactNode }> = ({
  children,
  theme: customTheme,
  ...props
}) => {
  return (
    <AntConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          ...customLightTheme,
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
