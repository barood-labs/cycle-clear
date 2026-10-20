package com.baroodlabs.cycleclear;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.widget.RemoteViews;
import org.json.JSONObject;

public class CycleWidgetProvider extends AppWidgetProvider {
    @Override
    public void onUpdate(Context ctx, AppWidgetManager mgr, int[] ids) {
        String raw = ctx.getSharedPreferences("cc_widget", Context.MODE_PRIVATE).getString("json", "{}");
        String big = "—", title = "", line = ""; boolean discreet = true;
        try { JSONObject o = new JSONObject(raw); big = o.optString("big", "—"); if (big.isEmpty()) big = "—"; title = o.optString("title", ""); line = o.optString("line", ""); discreet = o.optBoolean("discreet", false); } catch (Exception ignored) {}
        PendingIntent open = PendingIntent.getActivity(ctx, 0, new Intent(ctx, MainActivity.class), PendingIntent.FLAG_IMMUTABLE);
        for (int id : ids) {
            RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.cycle_widget);
            v.setTextViewText(R.id.w_big, big);
            v.setTextColor(R.id.w_big, discreet ? Color.parseColor("#555555") : Color.parseColor("#D6336C"));
            v.setTextViewText(R.id.w_title, discreet ? "" : title);
            v.setTextViewText(R.id.w_line, line);
            v.setInt(R.id.w_root, "setBackgroundResource", discreet ? R.drawable.widget_bg_discreet : R.drawable.widget_bg);
            v.setOnClickPendingIntent(R.id.w_root, open);
            mgr.updateAppWidget(id, v);
        }
    }
}
