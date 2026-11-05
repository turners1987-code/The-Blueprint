# Daily loss lock: where a hard daily loss limit lives (NT8, brokers, prop firms)

Condensed from Crawl `daily-loss-lock/findings.md` (J-20261031-13). Sources are first-party vendor help pages, read Oct 26 to 31, 2026. All dollar figures and times are volatile; on site pages, teach the mechanics and link the vendor page.

## Key finding

NinjaTrader 8 itself has no daily dollar loss limit. Its Risk window templates (margin, max order size, max position size per instrument) apply to local simulation accounts only. For a live account traded through NT8, the enforceable kill switch is set at the broker: NinjaTrader Dashboard → User Profile → Settings → Accounts → Risk Settings → Daily Loss Limit. It is enforced at the account level on every platform connected to that account, not by the NT8 desktop app. Turning on "Prevent Changes When Trading is Locked by Risk Settings" stops the trader from raising or removing the limit after it fires; only the broker's Trade Desk can unlock it that day.

## By venue

| Venue | Where it is set | Live accounts | Trader can undo intraday? | At the limit | Reset |
|---|---|---|---|---|---|
| NinjaTrader 8 platform | No daily loss limit exists; Risk templates are sim-only | No | n/a | n/a | n/a |
| NinjaTrader Brokerage | Dashboard (or Web App shield icon) → Risk Settings | Yes, live and demo | Yes, unless "Prevent Changes When Trading is Locked" is on | Positions closed, orders canceled, account liquidation-only; it is a liquidation trigger, not a guaranteed cap (slippage) | Unlocks 5:00 PM CT same day; counts realized P&L only, 5:00 PM to 3:45 PM CT, fees included |
| Tradovate | Application Settings → Accounts → Risk Settings → Daily Loss | Not stated | Yes, unless "Lock Risk Settings if Hit" is on (support cannot unlock) | Orders canceled, position liquidated, no new trades | Session starts 5 PM CT; counts realized and open P&L; locked settings reopen 4:00 to 5:00 PM CT |
| Rithmic (R\|Trader Pro) | Set by the broker, FCM or prop firm on the account, not by the trader | Yes | No; runs server-side above the platform | Server-side auto-liquidation, account usually set to liquidate-only | Not stated |
| Apex | Assigned by account size and tier (EOD evaluations); none on intraday-drawdown evaluations | PAs are simulated | No; fixed for the session | All positions liquidated, trading paused for the session; not an account failure | 6 PM ET |
| Lucid (LucidDaily, LucidFlex) | Chosen at checkout (DLL on or off) | Funded accounts are simulated | No; fixed for the session | No new trades until next session; a soft breach unless the max loss limit is hit | Next session (clock time not stated) |
| Topstep | Optional fixed DLL at checkout, or a manual Personal DLL in Risk Settings (Do Nothing / Liquidate / Liquidate and Block) | Combine and XFA simulated; Live Funded Account has an automatic DLL | Checkout DLL: no. Manual PDLL: yes, unless locked for the day or set to Liquidate and Block | Checkout DLL: flatten, cancel, no trades until 5 PM CT; a forced break, not a violation | 5 PM CT |

## Gaps (do not fill on the site)

- Tradovate's pages do not say whether its limit works on live accounts or what enforces it.
- Rithmic gives no reset time.
- Apex, Lucid and Topstep do not say what system enforces their limits; Lucid gives no reset clock time.
- NinjaTrader Brokerage counts realized P&L only; Tradovate's older article counts realized plus open. Cite each to its own page.

## Sources

- https://ninjatrader.com/support/helpGuides/nt8/understanding_risks.htm
- https://ninjatrader.com/support/helpGuides/nt8/using_the_risk_window.htm
- https://support.ninjatrader.com/s/article/Risk-Settings?language=en_US (updated Oct 20, 2026)
- https://tradovate.zendesk.com/hc/en-us/articles/4408927333395-How-Do-I-Set-a-Daily-Loss-Limit-on-My-Account
- https://tradovate.zendesk.com/hc/en-us/articles/4408927195667-How-Do-I-Lock-My-Account-Risk-Settings
- https://www.rithmic.com/products/risk-management
- https://www.rithmic.com/products/r-trader-pro
- https://apextraderfunding.com/help-center/additional-helpful-items/daily-loss-limit-explained/
- https://support.lucidtrading.com/en/articles/16085900-luciddaily-daily-loss-limit
- https://support.lucidtrading.com/en/articles/12945790-lucidflex-evaluation-account
- https://help.topstep.com/en/articles/10490293-daily-loss-limit-in-the-trading-combine-and-express-funded-account
- https://help.topstep.com/en/articles/10657969-live-funded-account-parameters
