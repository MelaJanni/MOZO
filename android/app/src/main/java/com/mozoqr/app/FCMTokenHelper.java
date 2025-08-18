package com.mozoqr.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;
import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.FirebaseMessaging;

/**
 * Helper class para obtener y mostrar el token FCM de Android
 */
public class FCMTokenHelper {
    private static final String TAG = "FCMTokenHelper";

    public static void logCurrentToken(Context context) {
        Log.d(TAG, "🔑 Attempting to get FCM token...");
        
        // Verificar que Firebase esté inicializado
        try {
            FirebaseApp app = FirebaseApp.getInstance();
            Log.d(TAG, "🔑 Firebase app found: " + app.getName());
        } catch (Exception e) {
            Log.e(TAG, "❌ Firebase app not initialized", e);
            return;
        }
        
        FirebaseMessaging.getInstance().getToken()
                .addOnCompleteListener(task -> {
                    if (!task.isSuccessful()) {
                        Log.w(TAG, "❌ Fetching FCM registration token failed", task.getException());
                        return;
                    }

                    // Get new FCM registration token
                    String token = task.getResult();
                    Log.d(TAG, "🔑 CURRENT FCM TOKEN: " + token);
                    Log.d(TAG, "🔑 Token length: " + token.length());
                    Log.d(TAG, "🔑 Token prefix: " + token.substring(0, Math.min(50, token.length())));
                    Log.d(TAG, "📱 IMPORTANTE: Este token debe estar registrado en tu backend para recibir notificaciones");
                    
                    // TODO: Enviar token al backend aquí
                    // Para ahora, almacenar en SharedPreferences para que el JS lo pueda leer
                    try {
                        SharedPreferences prefs = context.getSharedPreferences("capacitor_preferences", Context.MODE_PRIVATE);
                        prefs.edit().putString("fcm_token", token).apply();
                        Log.d(TAG, "✅ Token FCM guardado en SharedPreferences para acceso desde JS");
                    } catch (Exception e) {
                        Log.e(TAG, "❌ Error guardando token en SharedPreferences", e);
                    }
                });
    }
}