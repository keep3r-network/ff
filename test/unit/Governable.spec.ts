import { MockContract, MockContractFactory, smock } from '@defi-wonderland/smock';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { GovernableForTest, GovernableForTest__factory } from '@typechained';
import { onlyGovernor, onlyPendingGovernor } from '@utils/behaviours';
import { ZERO_ADDRESS } from '@utils/constants';
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('Governable', () => {
  let governor: SignerWithAddress;
  let pendingGovernor: SignerWithAddress;
  let governableFactory: MockContractFactory<GovernableForTest__factory>;

  before(async () => {
    [, governor, pendingGovernor] = await ethers.getSigners();
    governableFactory = await smock.mock<GovernableForTest__factory>('GovernableForTest');
  });

  describe('constructor', () => {
    it('should revert when given zero address', async () => {
      await expect(governableFactory.deploy(ZERO_ADDRESS)).to.be.revertedWith('ZeroAddress()');
    });
  });

  context('after deployed', () => {
    let governable: MockContract<GovernableForTest>;

    beforeEach(async () => {
      governable = await governableFactory.deploy(governor.address);
    });

    describe('setPendingGovernor', () => {
      onlyGovernor(
        () => governable,
        'setPendingGovernor',
        () => governor,
        () => [pendingGovernor.address]
      );

      it('should revert when given zero address', async () => {
        await expect(governable.connect(governor).setPendingGovernor(ZERO_ADDRESS)).to.be.revertedWith('ZeroAddress()');
      });

      it('should save given governor', async () => {
        await governable.connect(governor).setPendingGovernor(pendingGovernor.address);
        expect(await governable.pendingGovernor()).to.equal(pendingGovernor.address);
      });

      it('should emit event', async () => {
        await expect(governable.connect(governor).setPendingGovernor(pendingGovernor.address))
          .to.emit(governable, 'PendingGovernorSet')
          .withArgs(governor.address, pendingGovernor.address);
      });
    });

    describe('acceptPendingGovernor', () => {
      beforeEach(async () => {
        await governable.setVariable('pendingGovernor', pendingGovernor.address);
      });

      onlyPendingGovernor(
        () => governable,
        'acceptPendingGovernor',
        () => pendingGovernor.address,
        []
      );

      it('should set pending governor as governor', async () => {
        await governable.connect(pendingGovernor).acceptPendingGovernor();
        expect(await governable.governor()).to.equal(pendingGovernor.address);
      });

      it('should reset pending governor', async () => {
        await governable.connect(pendingGovernor).acceptPendingGovernor();
        expect(await governable.pendingGovernor()).to.equal(ZERO_ADDRESS);
      });

      it('should emit event', async () => {
        await expect(governable.connect(pendingGovernor).acceptPendingGovernor())
          .to.emit(governable, 'PendingGovernorAccepted')
          .withArgs(pendingGovernor.address);
      });
    });
  });
});
