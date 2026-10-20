import UIKit
import Capacitor

// Registers the app's own local plugins (Apple Health, widget data). No network code.
class CCBridgeViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(CCHealthPlugin())
        bridge?.registerPluginInstance(CCWidgetPlugin())
    }
}
