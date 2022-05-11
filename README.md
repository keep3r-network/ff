# Fixed Forex

Fixed Forex leveraged Iron Bank, Yearn, Sushi, and Curve

Fixed Forex is the collective name for USD, EUR, ZAR, JPY, CNY, AUD, AED, CAD, INR, and any other forex pairs launched under the Fixed Forex moniker.

The first available options can be minted via yearn.fi/lend

- ibEUR
- ibKRW
- ibJPY
- ibAUD
- ibCHF
- ibGBP

All forex options can be minted via any of the accepted collateral on yearn.fi

For up to date collateral factors, you can visit the Fixed Forex [documentation](https://docs.fixedforex.fi/)

Each forex pair will target 2 liquidity pools;
ib*/* (curve.fi)
ib\*/stable (uni v3)

For each asset, liquidity providers will have four available yield options;

Provide ib* to yearn.fi/lend and earn interest
Provide ib*/stable
Provide ib*/* to curve.fi
Stake in Iron Bank Fixed Forex and earn the native token KP3R (vested, vKP3R)

# vKP3R

The KP3R mechanism is complex, and should be carefully understood before participating.

The system’s true native token is vKP3R, or vested KP3R, vKP3R earns protocol fees, these fees are dynamic based on supply and demand. Currently, these fees are 10.15% of TVL.

KP3R owners can choose to create a vesting lock, up to 4 years, with linear decay on the vKP3R contract

Once a lock has been created, LPs can stake in the distribution contracts, the distribution contract will distribute tokens every 7 days linearly.

Distribution tokens are rewarded based on your vesting lock. If the vesting lock is 1 years, you receive 1/4 tokens as vKP3R, which will become unlocked in 1 year. The remainder 3/4 tokens is distributed to the fee distribution contract.

vKP3R holders have two weekly claims, claim 1 is protocol accumulated fees (10.15% of TVL currently), and distributed KP3R from the distribution contract.

Simply put, the greater your time investment, the more disproportionate your reward.
