# Incident disclosure - 2023-12-19

## Summary
Following a query on levels of outstanding borrows vs treasury-held debt it was discovered that a borrower contract authorized by the Iron Bank Multisig had established an uncollateralized borrow position of Fixed Forex assets with a market value (to date) worth $4,534,742

The contract `0x6B419752c453D0B83bc1B465077043347cb3C576` was published 34 days ago and is permissioned to borrow Fixed Forex assets from Iron Bank for the purposes of farming liquidity positions on Curve and Convex protocols. The core assets can only be removed by Iron Bank `0x9d960dAe0639C95a0C822C9d7769d19d30A430Aa` and the operator multisig `0x98d785185198EF02Db237471f034AC6020E3f55E` can only claim profits

A large liquidity provider of the ibEUR/USDC liquidity pool on Curve Finance discovered the uncollateralized loan and made a substantial single-sided withdrawal of 889,413.18 USDC (txn; `0x46854f7965d10f1f8c75a16bfcd6031347a2c07c032592c026a485ebbc6529dc`) destabilizing the peg on the liquidity pool resulting in a devaluation of value of ibEUR in the pool to $0.38

## Background
Fixed Forex assets (ibEUR, ibCHF, ibGBP, ibAUD, ibJPY & ibKRW) are designed to be over-collateralized stablecoins, exclusively issued via Iron Bank.
- Fixed Forex assets are owned by the Keep3r Network 
- Fixed Forex's ib_controller `0x0D5Dc686d0a2ABBfDaFDFb4D0533E886517d4E83` mints Fixed Forex assets into Iron Bank, controlled by the Keep3r Multisig `0x0D5Dc686d0a2ABBfDaFDFb4D0533E886517d4E83`
- Iron Bank multisig `0xA5fC0BbfcD05827ed582869b7254b6f141BA84Eb` sets IRM rates
- Borrowing and Supply rates are affected by Supply set by Keep3r Multisig, Borrow & the IRM rates set by Iron Bank
- Iron Bank Multisig has the ability to permission contracts for uncollateralized borrowing, where Iron Bank considers the borrowing party credit worthy. Iron Bank has previously whitelisted Yearn Finance, Keep3r Network, Multichain, Alpha Homora and PleaserDAO. Conditions can be viewed at https://docs.ib.xyz/protocol-lending
- Keep3r Network Treasury previously agreed two contracts permissioned to borrow Fixed Forex assets from Iron Bank 
- ib_amm `0x0a0B06322825cb979678C722BA9932E0e4B5fd90` allows borrowing of any Fixed Forex asset upto pre-agreed borrowing limits with Iron Bank, allowing DAI to be swapped to Fixed Forex assets. Each asset valued at chainlink price quote at time of swap. DAI was retained by the Keep3r treasury for the purposes of farming USD based liquidity pools for yield thereby providing collateral value against any outstanding borrows
- ibAMM `0x8338Aa899fB3168598D871Edc1FE2B4F0Ca6BBEF` allows borrowing of any Fixed Forex asset upto pre-agreed borrowing limits with Iron Bank, allowing MIM to be swapped to Fixed Forex assets. Each asset is valued at chainlink price quote at time of swap. MIM was retained by the Keep3r treasury for the purposes of farming USD based liquidity pools for yield thereby providing collateral value against any outstanding borrows
- As a fallback, all other assets held by Keep3r treasury can be utilized to collateralize outstanding borrows held by Keep3r treasury. 
- Details of current assets held can be viewed here; https://keep3r.network/treasury. 
- Details of current outstanding borrows held by the ib_amm and ibAMM contracts can be viewed here; https://keep3r.network/debt
- Any new borrowing against ib_amm and ibAMM was previously ceased by Keep3r Multisig in 23.01.04 at txn `0x21f762bf2218a9195a61df95be30e5c98d3f9839f5272c5cf6fddef105ee39cd`

## Details of the Issue
- A third party (non-Keep3r or Iron Bank) was permissioned by Iron Bank multisig to borrow Fixed Forex assets on`0x9a97664f3aba3d6de05099b513a854d838c99db` created at txn `0xf9ec48cb178e525ecd60e8f0f407d4572db8581e350d1b765cf3fcaf86b5644a` on 23.04.09
- The third party published a V2 implementation `0x6B419752c453D0B83bc1B465077043347cb3C576` on 23.11.15 at txn `0xda3f3acfc571077842d7ad6350742370c110b2af3d40a3c06de49f19b87c3a73`
- Both contracts have been farming liquidity pools for Fixed Forex assets through provision of single-sided liquidity. Amassing a total borrowing position of $4,534,742 at date of disclosure
- Borrowing contract `0x6B419752c453D0B83bc1B465077043347cb3C576`is approx. 98% of liquidity in the entire ibEUR-USDC liquidity pool `0x1570af3df649fc74872c5b8f280a162a3bdd4eb6`
- Borrowing contract also holds 93% of total liquidity in ibJPY-sJPY `0x8818a9bb44fbf33502be7c15c500d0c783b73067` & 70% of total liquidity in ibAUD-sAUD `0x3f1b0278a9ee595635b61817630cc19de792f506`
- Given the depth of liquidity vs size of borrows the borrowing contract will not be able to successfully withdraw liquidity and repay total debts owed, until depth of liquidity is greater than current levels

Major oversights that led to this issue are;

In ordinary circumstances, Keep3r can discourage additional borrowing of Fixed Forex assets to protect the peg, through withdrawal of supply in Iron Bank. This has the effect of increasing borrowing rates and encouraging repayment of outstanding borrows. 
1. As of 23.12.18 majority of outstanding Fixed Forex assets borrowed are held by two permissioned contracts `0x6B419752c453D0B83bc1B465077043347cb3C576` & `0x8338Aa899fB3168598D871Edc1FE2B4F0Ca6BBEF` accounting for 98% of all ibEUR borrowing. Due to this, a change in the level of ibEUR supply in Iron Bank would have no material impact on peg defense or maintenance of peg balance for ibEUR or any other Fixed Forex assets borrowed (ibAUD, ibJPY).
2. The Iron Bank team did not inform Keep3r that a third party had been permissioned to borrow Fixed Forex assets uncollateralized
3. The third party contract had no safeguards in place to ensure stabilization of peg of assets, destabilizing the market value of Fixed Forex assets
4. The Iron Bank team also confirmed the following details;
   - The borrowing contract has no check for peg before borrow and LP entry
   - The borrowing contract has no permissions or credit limit to borrow other assets from Iron Bank (i.e. non-Fixed Forex assets)
   - The borrowing contract is backed by the underlying Curve LP tokens. Borrowed principle cannot be removed. Only the farmed/earned CRV/CVX can be removed

### Next Steps
To prevent similar mistakes in the future, we propose the following actions and additional safeguards are put into place:
- Iron Bank remove permission of `0x6B419752c453D0B83bc1B465077043347cb3C576` to borrow any further Fixed Forex assets uncollateralized
- Iron Bank team ensure no future credit agreements are put in place that allow for borrowing of Fixed Forex assets, without Keep3r multisig joint approval. Propose future approval is controlled by Multisig that requires both teams sign-off, Keep3r & Iron Bank
- Lines of communication between Keep3r and Iron Bank teams are strengthened, with reasonable response times for cross-team communication
- Iron Bank & Borrowing contract owner `0x98d785185198EF02Db237471f034AC6020E3f55E`will manage repayment of debt plan, in line with the uncollateralized borrowing agreement between both parties. Propose immediate repayment.
