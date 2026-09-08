package com.onebalancepay.sunmiprinter;

import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "MainActivity";

    @Override
    public void onCreate(Bundle savedInstanceState) {


        Log.d(TAG, "PrinterPlugin registered");

        super.onCreate(savedInstanceState);
    }
}