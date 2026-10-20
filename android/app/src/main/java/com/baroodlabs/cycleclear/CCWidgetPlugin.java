package com.baroodlabs.cycleclear;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// Saves an already-localized summary for the home-screen widget. Local only.
@CapacitorPlugin(name = "CCWidget")
public class CCWidgetPlugin extends Plugin {
    @PluginMethod
    public void setData(PluginCall call) {
        Context ctx = getContext();
        ctx.getSharedPreferences("cc_widget", Context.MODE_PRIVATE).edit().putString("json", call.getString("json", "{}")).apply();
        AppWidgetManager m = AppWidgetManager.getInstance(ctx);
        int[] ids = m.getAppWidgetIds(new ComponentName(ctx, CycleWidgetProvider.class));
        Intent i = new Intent(ctx, CycleWidgetProvider.class).setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE).putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
        ctx.sendBroadcast(i);
        call.resolve();
    }
}
