import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { shouldVerifyContract } from '../utils/deploy';

const deployFunction: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();

  const KP3R_GOVERNANCE = '0x0D5Dc686d0a2ABBfDaFDFb4D0533E886517d4E83';

  const deploy = await hre.deployments.deploy('GaugeProxyV2', {
    contract: 'contracts/GaugeProxyV2.sol:GaugeProxyV2',
    from: deployer,
    args: [KP3R_GOVERNANCE],
    log: true,
  });

  if (await shouldVerifyContract(deploy)) {
    await hre.run('verify:verify', {
      address: deploy.address,
      constructorArguments: [KP3R_GOVERNANCE],
    });
  }
};
deployFunction.dependencies = [];
deployFunction.tags = ['GaugeProxyV2'];
export default deployFunction;
