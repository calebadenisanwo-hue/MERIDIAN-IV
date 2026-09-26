# Proguard rules for Meridian Personal Systems
# Keep Room entities and DAOs
-keep class com.example.meridian.data.model.** { *; }
-keep class com.example.meridian.data.local.** { *; }
-dontwarn androidx.room.paging.**
