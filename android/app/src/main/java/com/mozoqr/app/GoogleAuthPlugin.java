package com.mozoqr.app;

import android.app.Activity;
import android.content.Intent;
import android.util.Log;
import androidx.activity.result.ActivityResult;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;

@CapacitorPlugin(name = "GoogleAuth")
public class GoogleAuthPlugin extends Plugin {

    private static final String TAG = "GoogleAuthPlugin";
    private GoogleSignInClient googleSignInClient;
    private PluginCall currentCall;
    private ActivityResultLauncher<Intent> signInLauncher;

    @Override
    public void load() {
        super.load();
        Log.d(TAG, "GoogleAuthPlugin loaded");
        
        // Configurar Google Sign-In
        String webClientId = "175482362472-sbae126lpnl34rlsf24p8lmdau1obob3.apps.googleusercontent.com";
        
        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestIdToken(webClientId)
                .requestEmail()
                .requestProfile()
                .requestServerAuthCode(webClientId)
                .build();
        
        googleSignInClient = GoogleSignIn.getClient(getActivity(), gso);
        
        // Configurar Activity Result Launcher
        signInLauncher = getActivity().registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            this::handleSignInResult
        );
        
        Log.d(TAG, "Google Sign-In client configured");
    }

    @PluginMethod
    public void signIn(PluginCall call) {
        Log.d(TAG, "Starting Google Sign-In...");
        
        try {
            currentCall = call;
            Intent signInIntent = googleSignInClient.getSignInIntent();
            signInLauncher.launch(signInIntent);
        } catch (Exception e) {
            Log.e(TAG, "Error starting Google Sign-In", e);
            call.reject("Failed to start Google Sign-In: " + e.getMessage());
        }
    }

    private void handleSignInResult(ActivityResult result) {
        Log.d(TAG, "handleSignInResult called");
        
        if (currentCall == null) {
            Log.e(TAG, "currentCall is null");
            return;
        }
        
        Intent data = result.getData();
        if (data == null) {
            Log.e(TAG, "Intent data is null");
            currentCall.reject("No data received from Google Sign-In");
            currentCall = null;
            return;
        }
        
        Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
        try {
            GoogleSignInAccount account = task.getResult(ApiException.class);
            Log.d(TAG, "Google Sign-In successful");
            
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("token", account.getIdToken());
            ret.put("email", account.getEmail());
            ret.put("name", account.getDisplayName());
            ret.put("imageUrl", account.getPhotoUrl() != null ? account.getPhotoUrl().toString() : "");
            ret.put("uid", account.getId());
            ret.put("serverAuthCode", account.getServerAuthCode());
            
            Log.d(TAG, "Returning user data: " + ret.toString());
            currentCall.resolve(ret);
            
        } catch (ApiException e) {
            Log.e(TAG, "Google Sign-In failed with code: " + e.getStatusCode(), e);
            currentCall.reject("Google Sign-In failed: " + e.getMessage());
        } finally {
            currentCall = null;
        }
    }

    @PluginMethod
    public void signOut(PluginCall call) {
        Log.d(TAG, "Starting Google Sign-Out...");
        
        googleSignInClient.signOut()
            .addOnCompleteListener(getActivity(), task -> {
                Log.d(TAG, "Google Sign-Out completed");
                JSObject ret = new JSObject();
                ret.put("success", true);
                call.resolve(ret);
            });
    }

    @PluginMethod
    public void isSignedIn(PluginCall call) {
        GoogleSignInAccount account = GoogleSignIn.getLastSignedInAccount(getActivity());
        
        JSObject ret = new JSObject();
        ret.put("isSignedIn", account != null);
        
        if (account != null) {
            ret.put("email", account.getEmail());
            ret.put("name", account.getDisplayName());
            ret.put("imageUrl", account.getPhotoUrl() != null ? account.getPhotoUrl().toString() : "");
        }
        
        call.resolve(ret);
    }
}