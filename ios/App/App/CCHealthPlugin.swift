import Foundation
import Capacitor
import HealthKit

// Opt-in Apple Health sync for menstrual flow only. Reads/writes on device; nothing is sent anywhere.
@objc(CCHealthPlugin)
public class CCHealthPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CCHealthPlugin"
    public let jsName = "CCHealth"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "requestAuth", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "writeFlow", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "readFlow", returnType: CAPPluginReturnPromise)
    ]
    private let store = HKHealthStore()
    private var flowType: HKCategoryType { HKObjectType.categoryType(forIdentifier: .menstrualFlow)! }
    // HKCategoryValueMenstrualFlow raw values: 1 unspecified, 2 light, 3 medium, 4 heavy, 5 none
    private let toHK: [String: Int] = ["light": 2, "medium": 3, "heavy": 4, "none": 5]
    private let fromHK: [Int: String] = [1: "medium", 2: "light", 3: "medium", 4: "heavy"]
    private lazy var dayFmt: DateFormatter = { let f = DateFormatter(); f.calendar = Calendar(identifier: .gregorian); f.locale = Locale(identifier: "en_US_POSIX"); f.dateFormat = "yyyy-MM-dd"; return f }()

    @objc func requestAuth(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else { call.resolve(["granted": false]); return }
        store.requestAuthorization(toShare: [flowType], read: [flowType]) { ok, _ in
            call.resolve(["granted": ok && self.store.authorizationStatus(for: self.flowType) == .sharingAuthorized])
        }
    }

    @objc func writeFlow(_ call: CAPPluginCall) {
        guard let days = call.getArray("days") as? [[String: Any]] else { call.reject("days missing"); return }
        let cal = Calendar.current
        let version = Int(Date().timeIntervalSince1970)
        let samples: [HKCategorySample] = days.compactMap { d in
            guard let ds = d["date"] as? String, let day = dayFmt.date(from: ds), let v = toHK[(d["flow"] as? String) ?? "medium"] else { return nil }
            let start = cal.startOfDay(for: day), end = cal.date(byAdding: .day, value: 1, to: start)!.addingTimeInterval(-1)
            let meta: [String: Any] = [HKMetadataKeyMenstrualCycleStart: (d["start"] as? Bool) ?? false,
                                       HKMetadataKeySyncIdentifier: "cycleclear-\(ds)", HKMetadataKeySyncVersion: version]
            return HKCategorySample(type: flowType, value: v, start: start, end: end, metadata: meta)
        }
        if samples.isEmpty { call.resolve(); return }
        store.save(samples) { ok, err in ok ? call.resolve() : call.reject(err?.localizedDescription ?? "save failed") }
    }

    @objc func readFlow(_ call: CAPPluginCall) {
        let since = dayFmt.date(from: call.getString("since") ?? "") ?? Date().addingTimeInterval(-400 * 86400)
        let pred = HKQuery.predicateForSamples(withStart: since, end: Date(), options: [])
        let q = HKSampleQuery(sampleType: flowType, predicate: pred, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, res, err in
            if let err = err { call.reject(err.localizedDescription); return }
            var out: [String: String] = [:]
            for s in (res as? [HKCategorySample]) ?? [] { if let f = self.fromHK[s.value] { out[self.dayFmt.string(from: s.startDate)] = f } }
            call.resolve(["days": out.map { ["date": $0.key, "flow": $0.value] }])
        }
        store.execute(q)
    }
}
