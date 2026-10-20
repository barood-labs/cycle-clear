import Foundation
import Capacitor
import WidgetKit

// Stores a tiny, already-localized summary in a shared keychain item (ThisDeviceOnly, never synced) so the widget can show it.
@objc(CCWidgetPlugin)
public class CCWidgetPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CCWidgetPlugin"
    public let jsName = "CCWidget"
    public let pluginMethods: [CAPPluginMethod] = [CAPPluginMethod(name: "setData", returnType: CAPPluginReturnPromise)]
    @objc func setData(_ call: CAPPluginCall) {
        CCShared.write(call.getString("json") ?? "{}")
        WidgetCenter.shared.reloadAllTimelines()
        call.resolve()
    }
}
