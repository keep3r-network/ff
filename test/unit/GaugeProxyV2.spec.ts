import chai, { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Keep3rProxy, RKp3r, Gauge } from '@eth-sdk-types';
import { MockContract, MockContractFactory, FakeContract, smock } from '@defi-wonderland/smock';
import { GaugeProxyV2, GaugeProxyV2__factory } from '@typechained';
import { evm, bn, wallet } from '@utils';

chai.use(smock.matchers);

describe('GaugeProxyV2', () => {
  let governance: SignerWithAddress;
  let gaugeProxy: MockContract<GaugeProxyV2>;
  let gaugeProxyFactory: MockContractFactory<GaugeProxyV2__factory>;
  let keep3rProxy: FakeContract<Keep3rProxy>;
  let rKP3R: FakeContract<RKp3r>;
  let gauge_1: FakeContract<Gauge>;
  let gauge_2: FakeContract<Gauge>;
  let gauge_3: FakeContract<Gauge>;
  let gauge_4: FakeContract<Gauge>;
  let snapshotId: string;

  const KP3R_PROXY = '0x976b01c02c636Dd5901444B941442FD70b86dcd5';
  const R_KP3R = '0xEdB67Ee1B171c4eC66E6c10EC43EDBbA20FaE8e9';
  const TOTAL_REWARDS = bn.toUnit(100);

  before(async () => {
    [, governance] = await ethers.getSigners();

    gaugeProxyFactory = await smock.mock<GaugeProxyV2__factory>('GaugeProxyV2');
    gaugeProxy = await gaugeProxyFactory.deploy(governance.address);

    keep3rProxy = await smock.fake('IKeep3rV1Proxy', { address: KP3R_PROXY });
    rKP3R = await smock.fake('IrKP3R', { address: R_KP3R });

    snapshotId = await evm.snapshot.take();
  });

  beforeEach(async () => {
    await evm.snapshot.revert(snapshotId);
  });

  describe('constructor', () => {
    it('should set deployer as governance', async () => {
      expect(await gaugeProxy.gov()).to.be.eq(governance.address);
    });
  });

  describe('distribute', () => {
    const TOKEN_1 = wallet.generateRandomAddress();
    const TOKEN_2 = wallet.generateRandomAddress();
    const TOKEN_3 = wallet.generateRandomAddress();
    const TOKEN_4 = wallet.generateRandomAddress();

    const GAUGE_1 = wallet.generateRandomAddress();
    const GAUGE_2 = wallet.generateRandomAddress();
    const GAUGE_3 = wallet.generateRandomAddress();
    const GAUGE_4 = wallet.generateRandomAddress();

    beforeEach(async () => {
      keep3rProxy.draw.reset();
      keep3rProxy.draw.returns(TOTAL_REWARDS);
      rKP3R.deposit.reset();
      rKP3R.deposit.returns();

      await gaugeProxy.connect(governance).addGauge(TOKEN_1, GAUGE_1);
      await gaugeProxy.connect(governance).addGauge(TOKEN_2, GAUGE_2);
      await gaugeProxy.connect(governance).addGauge(TOKEN_3, GAUGE_3);
      await gaugeProxy.connect(governance).addGauge(TOKEN_4, GAUGE_4);

      await gaugeProxy.setVariable('totalWeight', 10);
      await gaugeProxy.setVariable('weights', {
        [TOKEN_1]: 1,
        [TOKEN_2]: 2,
        [TOKEN_3]: 3,
        [TOKEN_4]: 4,
      });

      gauge_1 = await smock.fake('IGauge', { address: GAUGE_1 });
      gauge_2 = await smock.fake('IGauge', { address: GAUGE_2 });
      gauge_3 = await smock.fake('IGauge', { address: GAUGE_3 });
      gauge_4 = await smock.fake('IGauge', { address: GAUGE_4 });

      await gaugeProxy.connect(governance).forceDistribute();
    });

    it('should draw KP3Rs from Keep3rV1Proxy', async () => {
      expect(keep3rProxy.draw).to.have.been.calledOnce;
    });

    it('should deposit KP3Rs for rKP3Rs', async () => {
      expect(rKP3R.deposit).to.have.been.calledOnceWith(TOTAL_REWARDS);
    });

    it('should deposit reward tokens proportionally to votes', async () => {
      expect(gauge_1.deposit_reward_token).to.have.been.calledOnceWith(R_KP3R, TOTAL_REWARDS.mul(1).div(10));
      expect(gauge_2.deposit_reward_token).to.have.been.calledOnceWith(R_KP3R, TOTAL_REWARDS.mul(2).div(10));
      expect(gauge_3.deposit_reward_token).to.have.been.calledOnceWith(R_KP3R, TOTAL_REWARDS.mul(3).div(10));
      expect(gauge_4.deposit_reward_token).to.have.been.calledOnceWith(R_KP3R, TOTAL_REWARDS.mul(4).div(10));
    });
  });
});
