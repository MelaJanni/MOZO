package com.mozoqr.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.graphics.Color;
import android.os.Build;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

/**
 * Servicio FCM básico para recepción de notificaciones cuando la app está cerrada.
 */
public class MyFirebaseMessagingService extends FirebaseMessagingService {
    private static final String TAG = "FCMService";
    private static final String PRIMARY_CHANNEL_ID = "mozo_waiter";

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "🚀 Firebase Messaging Service CREATED");
        Log.d(TAG, "🚀 Package name: " + getPackageName());
        Log.d(TAG, "🚀 Application ID: " + getApplicationInfo().packageName);
        
        // Crear canal de notificaciones
        ensureChannel(PRIMARY_CHANNEL_ID, "Mozo - Llamadas", "Llamadas de mesas (alta prioridad)");
    }
    

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        if (remoteMessage == null) {
            Log.w(TAG, "remoteMessage null");
            return;
        }

        Log.d(TAG, "🚀 MENSAJE RECIBIDO (posible background)");
        Log.d(TAG, "From=" + remoteMessage.getFrom());
        Log.d(TAG, "MessageId=" + remoteMessage.getMessageId());
        Log.d(TAG, "CollapseKey=" + remoteMessage.getCollapseKey());
        Log.d(TAG, "SentTime=" + remoteMessage.getSentTime());
        Log.d(TAG, "TTL=" + remoteMessage.getTtl());
        Log.d(TAG, "DataMapKeys=" + remoteMessage.getData().keySet());

    String type = get(remoteMessage, "type", "");
    String table = get(remoteMessage, "table_number", "");
    String callId = get(remoteMessage, "call_id", get(remoteMessage, "callId", get(remoteMessage, "callID", "")));
    // Canal dinámico si llega; fallback al normal definido por App.java
    String channelFromPayload = get(remoteMessage, "channel_id", get(remoteMessage, "android_channel_id", "waiter_normal"));

        // Strategy: mostrar notificación para cualquier mensaje que traiga pistas de llamada.
        boolean looksLikeCall = !table.isEmpty() || !callId.isEmpty() || "waiter_call".equalsIgnoreCase(type) || "new_call".equalsIgnoreCase(type) || "unified".equalsIgnoreCase(type);
        if (!looksLikeCall) {
            Log.d(TAG, "Mensaje ignorado (no parece llamada): type=" + type + " table=" + table + " callId=" + callId);
            return;
        }

        String title = (remoteMessage.getNotification() != null && remoteMessage.getNotification().getTitle() != null)
                ? remoteMessage.getNotification().getTitle() : get(remoteMessage, "title", "Mesa " + (table.isEmpty() ? "?" : table) + " solicita mozo");
        String body = (remoteMessage.getNotification() != null && remoteMessage.getNotification().getBody() != null)
                ? remoteMessage.getNotification().getBody() : get(remoteMessage, "message", "Nueva llamada de mesa");

        Log.d(TAG, "🔔 Preparando notificación (title=" + title + ", body=" + body + ", table=" + table + ", callId=" + callId + ")");
        ensureChannel(channelFromPayload, "Llamadas", "Canal dinámico auto-creado");
        
        Log.d(TAG, "🔔 LLAMANDO showNotification con:");
        Log.d(TAG, "   - title: " + title);
        Log.d(TAG, "   - body: " + body);
        Log.d(TAG, "   - channelId: " + channelFromPayload);
        
        showNotification(title, body, true, callId, table, type, channelFromPayload);
    }

    @Override
    public void onNewToken(String token) {
        Log.d(TAG, "🔑 Token FCM RENOVADO/GENERADO: " + token);
        Log.d(TAG, "🔑 Token length: " + token.length());
        Log.d(TAG, "🔑 Token prefix: " + token.substring(0, Math.min(50, token.length())));
        
        // Guardar token en SharedPreferences para acceso desde JS
        try {
            android.content.SharedPreferences prefs = getSharedPreferences("capacitor_preferences", MODE_PRIVATE);
            prefs.edit().putString("fcm_token", token).apply();
            Log.d(TAG, "✅ Nuevo token FCM guardado en SharedPreferences");
        } catch (Exception e) {
            Log.e(TAG, "❌ Error guardando nuevo token", e);
        }
    }

    private void showNotification(String title, String messageBody, boolean isCall, String callId, String tableNumber, String type, String channelId) {
        Log.d(TAG, "🔔 ===== INICIO showNotification =====");
        Log.d(TAG, "🔔 Parámetros recibidos:");
        Log.d(TAG, "   - title: '" + title + "'");
        Log.d(TAG, "   - messageBody: '" + messageBody + "'");
        Log.d(TAG, "   - channelId: '" + channelId + "'");
        Log.d(TAG, "   - callId: '" + callId + "'");
        
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (nm == null) {
            Log.e(TAG, "❌ NotificationManager es null!");
            return;
        }
        Log.d(TAG, "✅ NotificationManager obtenido correctamente");

        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        // Pasar metadata para futura navegación/diagnóstico
        if (callId != null) intent.putExtra("callId", callId);
        if (tableNumber != null) intent.putExtra("table_number", tableNumber);
        if (type != null) intent.putExtra("type", type);
        PendingIntent pi = PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        NotificationCompat.Builder b = new NotificationCompat.Builder(this, channelId != null ? channelId : PRIMARY_CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title != null ? title : "MozoApp")
                .setContentText(messageBody != null ? messageBody : "Nueva notificación")
                .setAutoCancel(true)
                .setContentIntent(pi)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setDefaults(NotificationCompat.DEFAULT_ALL);

        // ID estable por llamada para evitar duplicados: si hay callId usar hash; si no, fallback timestamp
        int id;
        if (callId != null && !callId.isEmpty()) {
            id = callId.hashCode();
        } else {
            id = (int) (System.currentTimeMillis() & 0xFFFFFFF);
        }
        try {
            nm.notify(id, b.build());
            Log.d(TAG, "✅ NOTIFICACIÓN MOSTRADA EXITOSAMENTE!");
            Log.d(TAG, "   - ID: " + id);
            Log.d(TAG, "   - Title: " + title);
            Log.d(TAG, "   - CallId: " + callId);
            Log.d(TAG, "   - Channel: " + channelId);
        } catch (Exception e) {
            Log.e(TAG, "❌ ERROR mostrando notificación", e);
        }
        Log.d(TAG, "🔔 ===== FIN showNotification =====");
    }

    private void ensureChannel(String channelId, String name, String description) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm.getNotificationChannel(channelId) == null) {
                NotificationChannel ch = new NotificationChannel(channelId, name, NotificationManager.IMPORTANCE_HIGH);
                ch.setDescription(description);
                ch.enableLights(true);
                ch.setLightColor(Color.RED);
                ch.enableVibration(true);
                nm.createNotificationChannel(ch);
                Log.d(TAG, "Channel created: " + channelId);
            }
        }
    }

    private String get(RemoteMessage msg, String key, String def) {
        if (msg.getData() != null && msg.getData().containsKey(key)) return msg.getData().get(key);
        return def;
    }
}