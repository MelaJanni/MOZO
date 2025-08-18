package com.mozoqr.app;

import android.app.Application;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import android.util.Log;
import com.google.firebase.FirebaseApp;

public class App extends Application {
    private static final String TAG = "App";

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "🚀 Application CREATED - " + getPackageName());
        
        // CRÍTICO: Inicializar Firebase
        try {
            FirebaseApp.initializeApp(this);
            Log.d(TAG, "✅ Firebase initialized successfully");
        } catch (Exception e) {
            Log.e(TAG, "❌ Firebase initialization failed", e);
        }
        
        createNotificationChannels();
        Log.d(TAG, "🚀 Application setup COMPLETED");
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm == null) return;
            createIfMissing(nm, "waiter_normal", "Llamadas Mesa", "Llamadas de mesas (normal)");
            createIfMissing(nm, "waiter_urgent", "Llamadas Urgentes", "Llamadas urgentes / alta prioridad");
            createIfMissing(nm, "mozo_waiter", "Compatibilidad", "Canal legado de notificaciones de mozo");
        }
    }

    private void createIfMissing(NotificationManager nm, String id, String name, String desc) {
        if (nm.getNotificationChannel(id) == null) {
            NotificationChannel ch = new NotificationChannel(id, name, NotificationManager.IMPORTANCE_HIGH);
            ch.setDescription(desc);
            ch.enableVibration(true);
            nm.createNotificationChannel(ch);
            Log.d(TAG, "NotificationChannel creado: " + id);
        }
    }
}
