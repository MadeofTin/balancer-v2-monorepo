import { BigNumber } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';

export async function getSigners(): Promise<SignerWithAddress[]> {
  const { ethers } = await import('hardhat');
  return ethers.getSigners();
}

export async function getSigner(index: number | string = 0): Promise<SignerWithAddress> {
  if (typeof index === 'string') {
    const { ethers } = await import('hardhat');
    const signer = ethers.provider.getSigner(index);
    return SignerWithAddress.create(signer);
  } else {
    const signers = await getSigners();
    return signers[index];
  }
}

export async function impersonate(address: string, balance?: BigNumber): Promise<SignerWithAddress> {
  const hre = await import('hardhat');
  await hre.network.provider.request({ method: 'hardhat_impersonateAccount', params: [address] });

  if (balance) {
    const rawHexBalance = hre.ethers.utils.hexlify(balance);
    const hexBalance = rawHexBalance.replace('0x0', '0x');
    await hre.network.provider.request({ method: 'hardhat_setBalance', params: [address, hexBalance] });
  }

  return getSigner(address);
}
