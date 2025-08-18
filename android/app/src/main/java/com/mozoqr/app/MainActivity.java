package com.mozoqr.app;

import android.annotation.SuppressLint;
import android.Manifest;
import android.content.pm.PackageManager;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.provider.Settings;
import android.util.Log;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        Log.d(TAG, "🚀 MainActivity CREATED");
        
        // (Opcional) Solicitar ignorar optimizaciones de batería para mejorar recepción en background
        requestBatteryOptimizationDisable();
        // Solicitar permiso de notificaciones (Android 13+)
        requestPostNotificationsPermission();
        
        // LOG: Mostrar token FCM actual (con delay para que Firebase se inicialice)
        new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
            FCMTokenHelper.logCurrentToken(this);
        }, 2000);
        
        // Nota: Ya NO se inicia manualmente MyFirebaseMessagingService. Firebase se encarga.
    }

    @SuppressLint("BatteryLife")
    private void requestBatteryOptimizationDisable() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
            String packageName = getPackageName();
            
            if (!powerManager.isIgnoringBatteryOptimizations(packageName)) {
                Log.d(TAG, "Solicitando ignorar optimizaciones de batería");
                try {
                    Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                    intent.setData(Uri.parse("package:" + packageName));
                    startActivity(intent);
                } catch (Exception e) {
                    Log.w(TAG, "No se pudo abrir configuración de batería", e);
                }
            } else {
                Log.d(TAG, "Optimizaciones de batería ya deshabilitadas");
            }
        }
    }
    
    // Eliminado método startFirebaseForegroundService (no necesario y podía causar fallo si no se llamaba a startForeground())

    private void requestPostNotificationsPermission() {
        if (Build.VERSION.SDK_INT >= 33) {
            if (checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 2101);
            }
        }
    }
}
