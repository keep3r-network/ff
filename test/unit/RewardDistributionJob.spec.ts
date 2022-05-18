import chai, { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { MockContract, FakeContract, MockContractFactory, smock } from '@defi-wonderland/smock';
import { RewardDistributionJob, GaugeProxyV2, IKeep3rV2, RewardDistributionJob__factory } from '@typechained';
import { evm, wallet } from '@utils';

chai.use(smock.matchers);

describe('RewardDistributionJob', () => {
  let job: MockContract<RewardDistributionJob>;
  let governor: SignerWithAddress;
  let gaugeProxy: FakeContract<GaugeProxyV2>;
  let keep3r: FakeContract<IKeep3rV2>;
  let jobFactory: MockContractFactory<RewardDistributionJob__factory>;
  let snapshotId: string;

  before(async () => {
    [, governor] = await ethers.getSigners();

    gaugeProxy = await smock.fake('GaugeProxyV2');
    keep3r = await smock.fake('IKeep3rV2', { address: '0xeb02addCfD8B773A5FFA6B9d1FE99c566f8c44CC' });

    jobFactory = await smock.mock<RewardDistributionJob__factory>('RewardDistributionJob');
    job = await jobFactory.deploy(gaugeProxy.address, governor.address);
    snapshotId = await evm.snapshot.take();
  });

  beforeEach(async () => {
    await evm.snapshot.revert(snapshotId);
  });

  it('should be deployed', async () => {
    expect(await job.deployed());
  });

  describe('work', () => {
    beforeEach(async () => {
      keep3r.worked.reset();
      keep3r.isKeeper.reset();
      gaugeProxy.distribute.reset();

      keep3r.isKeeper.returns(true);
    });

    it('should revert when paused', async () => {
      await job.setVariable('paused', true);
      await expect(job.callStatic.work()).to.be.revertedWith('Paused');
    });

    it('should validate keeper', async () => {
      await job.work();
      expect(keep3r.isKeeper).to.have.been.calledOnce;
    });

    it('should call gaugeProxy distribute', async () => {
      await job.work();
      expect(gaugeProxy.distribute).to.have.been.calledOnce;
    });

    it('should reward keeper', async () => {
      await job.connect(governor).work();
      expect(keep3r.worked).to.have.been.calledOnceWith(governor.address);
    });
  });

  describe('setGaugeProxy', () => {
    const random = wallet.generateRandomAddress();

    it('should set the gaugeProxy', async () => {
      await job.connect(governor).setGaugeProxy(random);
      expect(await job.gaugeProxy()).to.equal(random);
    });

    it('should emit event', async () => {
      await expect(job.connect(governor).setGaugeProxy(random)).to.emit(job, 'GaugeProxyAddressSet').withArgs(random);
    });
  });
});
