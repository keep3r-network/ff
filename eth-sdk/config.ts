import { defineConfig } from '@dethcrypto/eth-sdk';

export default defineConfig({
  contracts: {
    mainnet: {
      keep3rV1: '0x1ceb5cb57c4d4e2b2433641b95dd330a33185a44',
      keep3rProxy: '0x976b01c02c636Dd5901444B941442FD70b86dcd5',
      rKp3r: '0xEdB67Ee1B171c4eC66E6c10EC43EDBbA20FaE8e9',
      vKp3r: '0x2FC52C61fB0C03489649311989CE2689D93dC1a2',
      gaugeProxy: '0x81a8CAb6bb568fC94bCa70C9AdbFCF05592dEd7b',
      curvePool: '0x19b080FE1ffA0553469D20Ca36219F17Fcf03859',
      curveOwnerProxy: '0x2ef1bc1961d3209e5743c91cd3fbfa0d08656bc3',
      gauge: '0x99fb76F75501039089AAC8f20f487bf84E51d76F',
    },
  },
});
