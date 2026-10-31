import UIKit
import StoreKit
import Capacitor

// v1.1: Apple's in-app rating sheet (Apple decides whether to show it, max 3x/year) and the optional plain alternate icon.
// No network code; StoreKit's review sheet is system UI.
@objc(CCAppPlugin)
public class CCAppPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CCAppPlugin"
    public let jsName = "CCApp"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "requestReview", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setIcon", returnType: CAPPluginReturnPromise)
    ]
    @objc func requestReview(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if let scene = UIApplication.shared.connectedScenes.first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene {
                if #available(iOS 16.0, *) { AppStore.requestReview(in: scene) } else { SKStoreReviewController.requestReview(in: scene) }
            }
            call.resolve()
        }
    }
    // plain=true -> "AppIcon-Plain" (neutral calendar look), false -> default icon.
    @objc func setIcon(_ call: CAPPluginCall) {
        let name: String? = call.getBool("plain") == true ? "AppIcon-Plain" : nil
        DispatchQueue.main.async {
            guard UIApplication.shared.supportsAlternateIcons, UIApplication.shared.alternateIconName != name else { return call.resolve(["changed": false]) }
            UIApplication.shared.setAlternateIconName(name) { err in
                if let err = err { call.reject(err.localizedDescription) } else { call.resolve(["changed": true]) }
            }
        }
    }
}
