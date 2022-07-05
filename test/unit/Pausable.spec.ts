import { MockContract, MockContractFactory, smock } from '@defi-wonderland/smock';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { PausableForTest, PausableForTest__factory } from '@typechained';
import { onlyGovernor } from '@utils/behaviours';
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('Pausable', () => {
  let governor: SignerWithAddress;
  let pausableFactory: MockContractFactory<PausableForTest__factory>;
  let pausable: MockContract<PausableForTest>;

  before(async () => {
    [, governor] = await ethers.getSigners();
    pausableFactory = await smock.mock<PausableForTest__factory>('PausableForTest');
  });

  beforeEach(async () => {
    pausable = await pausableFactory.deploy(governor.address);
  });

  describe('pause', () => {
    onlyGovernor(
      () => pausable,
      'setPause',
      () => governor.address,
      [true]
    );

    it('should revert if unpausing an unpaused contract', async () => {
      await expect(pausable.connect(governor).setPause(false)).to.be.revertedWith('NoChangeInPause()');
    });

    it('should revert if pausing a paused contract', async () => {
      await pausable.setVariable('paused', true);
      await expect(pausable.connect(governor).setPause(true)).to.be.revertedWith('NoChangeInPause()');
    });

    it('should save pause status', async () => {
      await pausable.connect(governor).setPause(true);
      expect(await pausable.paused()).to.equal(true);
    });

    it('should emit event', async () => {
      await expect(pausable.connect(governor).setPause(true)).to.emit(pausable, 'PauseSet').withArgs(true);
    });
  });
});
