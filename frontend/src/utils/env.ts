export const getIpnftContractAddress = () =>
  (
    import.meta.env.VITE_IPNFT_CONTRACT_ADDRESS ||
    import.meta.env.VITE_CONTRACT_ADDRESS ||
    ''
  ).trim();

