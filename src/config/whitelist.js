// Whitelist addresses
export const WHITELIST_ADDRESSES = [
  "0x35472107E6a2748f5886e971Aa1A197a245d4e25",
  "0x00000062022C71E3596b2F1A71A8655eCF662A54",
  "0x1DF65580f321F1640d84a1841e28F5Ca0051f9B2",
  "0xDF6563278B279ef095c8e7790A67885B29CBbEA5",
  "0x95260D2b0C54abCDcf8b3800a7B007d0511D7185",
  "0x48E93DcE26145dc327Ef10f2bAF7999847e0bdC4",
  "0xE94611a879E99da008935C8a7f8fcA83E07fb66f",
  "0x87125f88d756D50f88c760c93b3bD0725D72BeF3",
  "0xDD172E16bAFd20D79f28518b8bf31400f5439932",
  "0x182f995b67f860F8f7e3B86C8746D740B98953F5",
  "0x8Ab9579A4b799A329B2c97c3003450232CdBdE29",
  "0xAd448137d170B0153018e470afA6B96357d6107f",
  "0x20891a96F2FB3D3627014ccb83078c7ed476aAa1",
  "0xD50681fB13D4260FFF58b6B68A328e4d4e5B596f",
  "0xFEbFA2c40d57F85fC47c78AD024FB0E75F65b0e1",
  "0x9954E2A22b651cd126F3926F6d9B505F4e7Aa249",
  "0xdC346Aa2dAcc9D1fe3dD6359636Ef46Ba97F1f51",
  "0xdDc77911327973ee8380e250167205AA10B2a554",
  "0x5fe0048e553bca33FF0233fe4b371E582C85C267",
  "0xf9c9ee06589DF3568705AE832a83a2D8a7c775cd",
  "0xfFCEbb4C83622CA153FE0951eBC42359e155E9E0",
  "0x97e9E65edA435CE80c95d554bf8FBb757FCFcbfE",
  "0xd32d25F6317C5eef4ae7A5993faeDc473e4AA2Eb",
  "0xd649946076d587Af74CAd517734935018a54cc2a",
  "0xEA53E0A8247DA8d7cDe15D1553957fc3075f10aA",
  "0xABdD0035A400D2e689E26952cf0b17F5E5A97f7a",
  "0xf4974EbbAe7Ec9DB35d8125b3Ae7F00E42CCa06F",
  "0x986c3515Ab4DB2cBBFBe4219aaC2bfea47473483",
  "0xd0303652AAe7d96Cc4a77ff85EE58B1774589064",
  "0x07A5Ef9DdeBD1F65950C3B33A24c2e9198B28E1D",
  "0xB99DAad251722E4d46b912D42aCc27B81302646d",
  "0x2988431DF19A6242d98722e18de2781DB11379AF",
  "0x726D54495E3F67AB2EF9E1E8EfE85F6FE6D5FbAb",
  "0x9b9db7b2dB73FB4235389bb63e8e47c1f6EC144d",
  "0xa63967e4E87844972162d6b6897f4405f9903Ff2",
  "0xDF6563278B279ef095c8e7790A67885B29CBbEA5"
];

// Simplified whitelist check - case insensitive
export const isWhitelisted = (address) => {
  if (!address) return false;
  // Convert both the input and stored addresses to lowercase for comparison
  const normalizedAddress = address.toLowerCase();
  return WHITELIST_ADDRESSES.map(addr => addr.toLowerCase()).includes(normalizedAddress);
};

export const WHITELIST_MESSAGE = {
  title: "Whitelist Only - First 24 Hours",
  message: "Thanks for your interest in Unifrens! Our early supporters and testnet users have priority access for the first 24 hours. Please check back tomorrow to mint your .fren name! 💖"
};

export const WHITELISTED_MESSAGE = {
  title: "🌟 Welcome Early Fren!",
  message: "You're one of our first supporters and your whitelist access is confirmed! Let's make history together - choose your .fren name and join the revolution. 💫"
}; 