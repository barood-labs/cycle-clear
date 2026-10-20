import WidgetKit
import SwiftUI

struct CCData: Decodable { var big: String?; var title: String?; var line: String?; var discreet: Bool?; var onPeriod: Bool? }
struct Entry: TimelineEntry { let date: Date; let d: CCData }

struct Provider: TimelineProvider {
    func load() -> CCData {
        guard let s = CCShared.read(), let data = s.data(using: .utf8),
              let d = try? JSONDecoder().decode(CCData.self, from: data) else { return CCData(big: "—", title: "", line: "", discreet: true, onPeriod: false) }
        return d
    }
    func placeholder(in context: Context) -> Entry { Entry(date: Date(), d: CCData(big: "13", title: "Day 13", line: "Next: Nov 5", discreet: false, onPeriod: false)) }
    func getSnapshot(in context: Context, completion: @escaping (Entry) -> Void) { completion(Entry(date: Date(), d: load())) }
    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
        // Refresh after midnight; the app also reloads the widget whenever data changes.
        let next = Calendar.current.date(byAdding: .hour, value: 1, to: Calendar.current.startOfDay(for: Date().addingTimeInterval(86400)))!
        completion(Timeline(entries: [Entry(date: Date(), d: load())], policy: .after(next)))
    }
}

struct CycleWidgetView: View {
    var entry: Entry
    @Environment(\.widgetFamily) var family
    var discreet: Bool { entry.d.discreet ?? false }
    var accent: Color { discreet ? Color(white: 0.35) : (entry.d.onPeriod ?? false ? Color(red: 0.93, green: 0.30, blue: 0.52) : Color(red: 0.84, green: 0.20, blue: 0.42)) }
    var body: some View {
        let content = VStack(spacing: 4) {
            ZStack {
                Circle().fill(LinearGradient(colors: discreet ? [Color(white: 0.96), Color(white: 0.86)] : [Color(red: 1, green: 0.9, blue: 0.94), Color(red: 0.97, green: 0.78, blue: 0.87)], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .shadow(color: accent.opacity(0.25), radius: 6, x: 3, y: 4)
                Text(entry.d.big ?? "—").font(.system(size: 34, weight: .heavy, design: .rounded)).foregroundColor(accent)
            }.frame(width: 72, height: 72)
            if !(entry.d.title ?? "").isEmpty && !discreet { Text(entry.d.title!).font(.system(size: 13, weight: .bold, design: .rounded)).lineLimit(1) }
            if !(entry.d.line ?? "").isEmpty { Text(entry.d.line!).font(.system(size: 12, weight: .semibold, design: .rounded)).foregroundColor(.secondary).lineLimit(1) }
        }.padding(8)
        if #available(iOSApplicationExtension 17.0, *) {
            content.containerBackground(for: .widget) { discreet ? Color(white: 0.98) : Color(red: 1, green: 0.96, blue: 0.98) }
        } else {
            ZStack { (discreet ? Color(white: 0.98) : Color(red: 1, green: 0.96, blue: 0.98)); content }
        }
    }
}

@main
struct CycleWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "CycleWidget", provider: Provider()) { CycleWidgetView(entry: $0) }
            .configurationDisplayName("Virabloom")
            .description("Cycle day at a glance. Private: data never leaves your phone.")
            .supportedFamilies([.systemSmall])
    }
}
