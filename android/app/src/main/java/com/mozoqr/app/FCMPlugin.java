package com.mozoqr.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import android.content.SharedPreferences;
import android.content.Context;
import android.util.Log;

@CapacitorPlugin(name = "FCMPlugin")
public class FCMPlugin extends Plugin {
    private static final String TAG = "FCMPlugin";

    @PluginMethod
    public void getStoredToken(PluginCall call) {
        try {
            SharedPreferences prefs = getContext().getSharedPreferences("capacitor_preferences", Context.MODE_PRIVATE);
            String token = prefs.getString("fcm_token", null);
            
            JSObject result = new JSObject();
            if (token != null) {
                result.put("token", token);
                result.put("success", true);
                Log.d(TAG, "Token FCM obtenido desde SharedPreferences: " + token.substring(0, 20) + "...");
            } else {
                result.put("success", false);
                result.put("error", "No FCM token found");
                Log.w(TAG, "No hay token FCM en SharedPreferences");
            }
            
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error obteniendo token FCM", e);
            JSObject result = new JSObject();
            result.put("success", false);
            result.put("error", e.getMessage());
            call.resolve(result);
        }
    }
}