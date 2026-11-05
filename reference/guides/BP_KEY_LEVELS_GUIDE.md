# BP Key Levels — User Guide

Version 1.0.1 · Updated October 31, 2026

## What it draws

BP Key Levels draws up to 19 reference levels on any chart, each as a line with a label and a price box on the right edge. Levels refresh automatically each session; nothing is drawn by hand. All times are US Eastern, whatever time zone your PC uses.

| Level | What it is | Tier |
| --- | --- | --- |
| PM High / PM Low | High and low of the prior calendar month | Monthly |
| PW High / PW Low | High and low of the prior trading week (Sunday 18:00 ET to Friday close) | Weekly |
| PD High / PD Low | High and low of the prior regular session (09:30–16:00 ET) | Daily |
| PD HB | Halfback: midpoint of PD High and PD Low | Daily |
| PD POC | Price with the most volume in the prior regular session | Daily |
| VA High / VA Low | Edges of the prior session's value area (70% of volume by default) | Daily |
| Prior RTH Close | Close of the last bar of the prior regular session. Off by default; not the exchange settlement price | Daily |
| ON High / ON Low | High and low of the overnight session (18:00–09:30 ET) | Session |
| ON HB | Midpoint of ON High and ON Low | Session |
| ON POC | Price with the most volume in the overnight session | Session |
| Asia High / Asia Low | High and low from 20:00 to 02:00 ET | Session |
| London High / London Low | High and low from 02:00 to 08:00 ET | Session |

Overnight, Asia and London levels draw live while their session is running, then hold at their final values.

## Requirements

- **NinjaTrader 8**, version 8.1.7 or later.
- **Order Flow+** subscription for PD POC, VA High, VA Low and ON POC. Without it, those four levels don't draw and the chart shows a notice; the other 15 levels work normally.
- **A data feed with overnight data** for the ON, Asia and London levels.
- **90 days of history loaded** on the chart for PM High and PM Low. PW levels need at least 2 full weeks.
- **Windows 11 Smart App Control:** must be Off. With it on, Windows blocks NinjaTrader from loading any custom add-on, BP Key Levels included. Turn it off in Windows Security → App & browser control → Smart App Control settings → Off. Note that BP Key Levels stops loading if you switch it back on later.

## Install

1. Download the BP Key Levels `.zip` file from your order receipt email, or from My Orders at app.lemonsqueezy.com/my-orders. Don't unzip it.
2. In NinjaTrader's Control Center: **Tools → Import → NinjaScript Add-On…** → select the `.zip` → **Open**. Confirm when NinjaTrader reports the import succeeded.
3. Open a chart → right-click → **Indicators** → double-click **BP Key Levels** in the list → **OK**.

Updating to a new version works the same way: import the new `.zip`, then remove BP Key Levels from your charts and add it again, because NinjaTrader keeps the old settings on any chart where it's already running.

## License

Enter your license key once per Blueprint product on each computer. Every chart running that product then picks it up automatically. All your Blueprint products on one computer share a single activation, and one key works on 2 computers at a time.

1. Right-click the chart → **Indicators** → select **BP Key Levels**.
2. Under **00. License**, paste your key into **License key** → **OK**.
3. The levels appear within a few seconds. Until then, a box in the middle of the chart shows the license status.

**Moving to a new computer:** on the old one, open the settings of any Blueprint product and tick **Deactivate this computer**. That frees the computer for all your Blueprint products at once, the moment you tick it, before you press OK. Then enter your key on the new computer. If the old computer is gone, use Reset my activations on your Blueprint account page.

**Offline:** after one successful check, BP Key Levels keeps working for 72 hours without an internet connection, then needs to reconnect.

Don't delete files in the `bptrade` folder inside your NinjaTrader 8 folder, especially the keys folder. Deleting them makes the computer look new and uses up an activation.

## Recommended chart setup

Use one BP Key Levels per chart, on the **CME US Index Futures ETH** trading hours template, with **90 days** loaded. That gives you all 19 levels.

| Setting | Recommended | Why |
| --- | --- | --- |
| Trading hours | CME US Index Futures ETH | Includes overnight data, so ON, Asia and London levels draw |
| Days to load | 90 | PM levels need a full prior month on the chart |
| Timeframe | Any minute or tick chart | Levels are identical on 1-, 5- and 30-minute charts |
| Compute scope | All (default) | One instance calculates every level |
| PC time zone | Any | Session windows are converted to US Eastern internally |

On an RTH-only template (CME US Index Futures RTH) there is no overnight data, so ON, Asia and London levels can't be calculated and the chart says so. PM and PW levels follow the chart's template: on an ETH chart they include overnight highs and lows, on an RTH chart they don't.

## Copy levels to your AI

Every level price can go straight into ChatGPT, Claude or any notes app as a ready-made table, with the price, whether the level is final or still developing, and its distance from the last price.

- **BP button:** click **BP** in the chart's top menu bar → **Copy levels** (or **Copy levels + settings** to include your session windows and settings) → paste into your AI chat.
- **From the settings:** Indicators → BP Key Levels → **10. Export** → tick **Copy levels to clipboard now** → **OK** → paste. Use this if the BP button isn't showing.
- **Automatic file:** BP Key Levels keeps `levels-BPKeyLevels-<instrument>.md` (and a `.json` copy for scripts) up to date, at most once a minute, in the `bptrade` folder. **BP → Open levels folder** opens it. Set **Levels folder** under 10. Export to a Google Drive, OneDrive or Dropbox folder and the file syncs to the cloud, where an AI assistant or a morning routine can read it.

The copied table starts with the instrument, time (ET) and last price, and ends with a one-line key to the level names, so an AI reads it correctly without extra explanation.

## Settings reference

The defaults work as they are; every setting is optional.

| Group | What it controls |
| --- | --- |
| 00. License | License key, and Deactivate this computer |
| 01a–04h (one per level) | Show or hide the level, its color and label text, its tier, and where its label sits. Prior RTH Close also has an override field for typing in the official settlement price |
| 05. Scope & Visibility | Compute scope: which tiers this instance calculates (All by default). Level visibility: Auto hides low-tier levels on high timeframes such as daily and weekly charts |
| 06. Appearance | Text labels, price boxes, label background, default label placement, font size (11), line width (1), and auto-separating labels that sit at the same price |
| 07. Session Windows | Session start and end times in US Eastern, written hhmmss (93000 = 09:30, 180000 = 18:00). Change only if you trade a different definition |
| 08. Value Area | Share of session volume inside VA High and VA Low (70%) |
| 09. Status | Show or hide the small grey notices at the bottom-left of the chart (license messages always show), and Write support report |
| 10. Export | Write levels file automatically (on), Levels folder (blank = the bptrade folder), Copy levels to clipboard now, and Show BP button in chart menu bar (on) |

## On-chart messages

| Message | What to do |
| --- | --- |
| License required — No license key set | Paste your key under 00. License |
| License required — License inactive | Your subscription has ended or the key was disabled. Check your Blueprint account |
| License required — Activation limit reached | The key is already active on 2 computers. Deactivate it on one of them, or use Reset my activations on your Blueprint account page if that computer is gone |
| License required — Deactivated on this computer for all BP products | You deactivated this computer. To use it again, fully restart NinjaTrader (File → Exit, then reopen); your saved key activates again and takes one of the 2 activations. Closing a workspace isn't enough |
| License required — This key doesn't include BP Key Levels | The key is for a different Blueprint product. Use your All Access or BP Key Levels key |
| Using cached license (expires in XXh) | No internet. Levels keep working until the hours run out; reconnect before then |
| Order Flow+ required for POC / VAH / VAL levels | Those four levels need an Order Flow+ subscription |
| Load more history for Prior Week / Prior Month levels | Data Series → Days to load → 90 |
| Trading Hours template has no overnight session | Switch the chart to CME US Index Futures ETH for ON, Asia and London levels |
| Eastern time zone not found | Windows is missing its time zone data; session windows fall back to your PC's time. Run Windows Update |

## Troubleshooting

**A level is enabled but I can't see it.** It's probably above or below the visible price range; NinjaTrader's auto scale only fits the bars. Drag the price axis to zoom out.

**I updated and the new defaults didn't apply.** NinjaTrader keeps the settings of indicators already on a chart, and any saved default template. Remove BP Key Levels and add it again. If you saved a default template for it, open Indicators → BP Key Levels → template → and remove it.

**My levels don't match another tool.** Check the session definitions: regular session 09:30–16:00 ET, overnight 18:00–09:30 ET, Asia 20:00–02:00 ET, London 02:00–08:00 ET. PM and PW also differ between ETH and RTH charts (see Recommended chart setup).

**The "no overnight session" notice shows on an ETH chart.** Too little history is loaded for the indicator to see an overnight session. Increase Days to load, then reload the chart (F5 on the chart).

**Which instruments does it work on?** Any futures contract NinjaTrader can chart. Session windows are fixed to US Eastern times, built around CME equity index futures.

**I changed my Windows time zone.** Restart NinjaTrader so the charts reload with the new time.

**"An Application Control policy has blocked this file."** Smart App Control is on. Turn it off (see Requirements), restart NinjaTrader, then import again.

## Getting help

Use the support form at [bptrade.co/support](https://bptrade.co/support); it's the only support channel, and replies come within 2 business days. For any indicator or license problem, attach a support report:

1. Click **BP** in the chart menu bar → **Write support report**, or open the indicator settings → **09. Status** → tick **Write support report** → **OK**.
2. A notice at the bottom-left of the chart shows where the file was saved: `support-BPKeyLevels.txt` in the `bptrade` folder inside your NinjaTrader 8 folder.
3. Attach that file to the form.

The report lists your NinjaTrader and Windows versions, time zone, chart setup, license status and BP Key Levels settings. It never contains your full license key, name, email or account details.
