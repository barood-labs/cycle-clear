// Thin wrappers over Capacitor native plugins. On the web every call is a safe no-op.
const C = window.Capacitor; export const isNative = !!(C && C.isNativePlatform && C.isNativePlatform());
export const platform = isNative ? C.getPlatform() : 'web';
const P = n => (isNative ? C.registerPlugin(n) : null);
const LN = P('LocalNotifications'), BIO = P('NativeBiometric'), IAP = P('NativePurchases'), FS = P('Filesystem'), SH = P('Share');
export const PRODUCT_ID = 'com.baroodlabs.cycleclear.supporter';
export async function scheduleReminders(list) { if (!LN) return false; // list: [{id,title,body,at?:Date,daily?:{hour,minute}}]
  try { const perm = await LN.requestPermissions(); if (perm.display !== 'granted') return false;
    const pend = await LN.getPending(); if (pend.notifications.length) await LN.cancel({ notifications: pend.notifications.map(n => ({ id: n.id })) });
    const notifications = list.filter(n => n.daily || n.at > new Date()).map(n => ({ id: n.id, title: n.title, body: n.body, schedule: n.daily ? { on: n.daily, allowWhileIdle: true } : { at: n.at, allowWhileIdle: true } }));
    if (notifications.length) await LN.schedule({ notifications }); return true; } catch (e) { console.warn(e); return false; } }
export async function bioAvailable() { if (!BIO) return false; try { return (await BIO.isAvailable()).isAvailable; } catch { return false; } }
export async function bioVerify(reason) { try { await BIO.verifyIdentity({ reason, title: reason }); return true; } catch { return false; } }
export async function iapPrice() { if (!IAP) return null; try { const r = await IAP.getProducts({ productIdentifiers: [PRODUCT_ID], productType: 'inapp' }); return r.products?.[0]?.priceString || null; } catch { return null; } }
export async function iapBuy() { try { const r = await IAP.purchaseProduct({ productIdentifier: PRODUCT_ID, productType: 'inapp', quantity: 1 }); return !!(r && (r.transactionId || r.productIdentifier)); } catch (e) { console.warn(e); return false; } }
export async function iapRestore() { try { await IAP.restorePurchases(); const r = await IAP.getPurchases?.({ productType: 'inapp' }); return !!r?.purchases?.some(p => p.productIdentifier === PRODUCT_ID); } catch { return false; } }
export async function shareHtml(name, html) { const w = await FS.writeFile({ path: name, data: html, directory: 'CACHE', encoding: 'utf8' }); await SH.share({ title: name, url: w.uri }); }
const HK = platform === 'ios' ? P('CCHealth') : null, WG = P('CCWidget');
export async function healthAuth() { try { return (await HK.requestAuth()).granted; } catch { return false; } }
export async function healthWrite(days) { try { await HK.writeFlow({ days }); return true; } catch (e) { console.warn(e); return false; } }
export async function healthRead(sinceDayNumber) { try { return (await HK.readFlow({ since: new Date(sinceDayNumber * 864e5).toISOString().slice(0, 10) })).days || []; } catch { return []; } }
export async function widgetSet(data) { try { await WG?.setData({ json: JSON.stringify(data) }); } catch { } }
