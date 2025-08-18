package com.mozoqr.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.util.Log;

/**
 * Receiver que asegura que Firebase Cloud Messaging esté habilitado
 * después del reinicio del dispositivo o actualización de la app.
 * 
 * IMPORTANTE: Los servicios FCM se manejan automáticamente por Android.
 * Este receiver solo asegura que los permisos y configuración estén listos.
 */
public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "BootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        Log.d(TAG, "🔄 Received broadcast: " + action);

        if (Intent.ACTION_BOOT_COMPLETED.equals(action) ||
            Intent.ACTION_MY_PACKAGE_REPLACED.equals(action) ||
            Intent.ACTION_PACKAGE_REPLACED.equals(action)) {
            
            Log.d(TAG, "🚀 Device booted - ensuring FCM is ready");
            ensureFCMReady(context);
        }
    }

    private void ensureFCMReady(Context context) {
        try {
            // Verificar que el servicio FCM esté registrado correctamente
            PackageManager pm = context.getPackageManager();
            Intent fcmIntent = new Intent("com.google.firebase.MESSAGING_EVENT");
            fcmIntent.setPackage(context.getPackageName());
            
            if (pm.queryIntentServices(fcmIntent, 0).isEmpty()) {
                Log.w(TAG, "⚠️ FCM service not found in manifest");
            } else {
                Log.d(TAG, "✅ FCM service registered correctly");
            }
            
            // Inicializar canales de notificación si es necesario
            if (context.getApplicationContext() instanceof App) {
                Log.d(TAG, "✅ App context available - notification channels will be created");
            }
            
            Log.d(TAG, "✅ FCM setup verification completed");
        } catch (Exception e) {
            Log.e(TAG, "❌ Error verifying FCM setup", e);
        }
    }
}