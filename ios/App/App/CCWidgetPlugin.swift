import Foundation
import Capacitor
import WidgetKit

// Stores a tiny, already-localized summary in the shared App Group so the widget can show it.
@objc(CCWidgetPlugin)
public class CCWidgetPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CCWidgetPlugin"
    public let jsName = "CCWidget"
    public let pluginMethods: [CAPPluginMethod] = [CAPPluginMethod(name: "setData", returnType: CAPPluginReturnPromise)]
    @objc func setData(_ call: CAPPluginCall) {
        UserDefaults(suiteName: "group.com.baroodlabs.cycleclear")?.set(call.getString("json") ?? "{}", forKey: "widget")
        WidgetCenter.shared.reloadAllTimelines()
        call.resolve()
    }
}
