# Keep SUNMI SDK classes
-keep class com.sunmi.** { *; }
-keep class woyou.aidlservice.jiuiv5.** { *; }

# Keep Capacitor plugin
-keep class com.onebalancepay.printer.sunmi.** { *; }

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}