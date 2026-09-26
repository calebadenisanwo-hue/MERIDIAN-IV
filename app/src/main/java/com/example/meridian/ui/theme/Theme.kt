package com.example.meridian.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat
import com.example.meridian.data.model.MaterialThemePalette
import com.example.meridian.data.model.ThemeMode

@Composable
fun MeridianTheme(
    palette: MaterialThemePalette = MaterialThemePalette.BOTANICAL,
    themeMode: ThemeMode = ThemeMode.SYSTEM,
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    val darkTheme = when (themeMode) {
        ThemeMode.LIGHT -> false
        ThemeMode.DARK -> true
        ThemeMode.SYSTEM -> isSystemInDarkTheme()
    }

    val context = LocalContext.current
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> getDarkColorScheme(palette)
        else -> getLightColorScheme(palette)
    }

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as? Activity)?.window
            if (window != null) {
                window.statusBarColor = Color.Transparent.toArgb()
                window.navigationBarColor = Color.Transparent.toArgb()
                WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
                WindowCompat.getInsetsController(window, view).isAppearanceLightNavigationBars = !darkTheme
            }
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}

fun getDarkColorScheme(palette: MaterialThemePalette): ColorScheme {
    val (primary, primaryContainer) = when (palette) {
        MaterialThemePalette.BOTANICAL -> BotanicalPrimary to BotanicalPrimaryContainer
        MaterialThemePalette.OCEAN -> OceanPrimary to OceanPrimaryContainer
        MaterialThemePalette.TERRACOTTA -> TerracottaPrimary to TerracottaPrimaryContainer
        MaterialThemePalette.LAVENDER -> LavenderPrimary to LavenderPrimaryContainer
        MaterialThemePalette.ROSE -> RosePrimary to RosePrimaryContainer
        MaterialThemePalette.MONOCHROME -> MonochromePrimary to MonochromePrimaryContainer
    }

    return darkColorScheme(
        primary = primary,
        onPrimary = Color(0xFF00390E),
        primaryContainer = primaryContainer,
        onPrimaryContainer = Color(0xFFA9F5A4),
        secondary = Color(0xFFB9CCB5),
        onSecondary = Color(0xFF243425),
        surface = BotanicalDarkSurface,
        onSurface = BotanicalDarkOnSurface,
        surfaceContainer = BotanicalDarkSurfaceContainer,
        surfaceContainerHigh = BotanicalDarkSurfaceContainerHigh,
        outline = BotanicalDarkOutline,
        outlineVariant = BotanicalDarkOutlineVariant,
        background = BotanicalDarkSurface,
        onBackground = BotanicalDarkOnSurface
    )
}

fun getLightColorScheme(palette: MaterialThemePalette): ColorScheme {
    val primary = when (palette) {
        MaterialThemePalette.BOTANICAL -> Color(0xFF1B6D2A)
        MaterialThemePalette.OCEAN -> Color(0xFF00639A)
        MaterialThemePalette.TERRACOTTA -> Color(0xFF904D00)
        MaterialThemePalette.LAVENDER -> Color(0xFF6B43A4)
        MaterialThemePalette.ROSE -> Color(0xFF984061)
        MaterialThemePalette.MONOCHROME -> Color(0xFF454747)
    }

    return lightColorScheme(
        primary = primary,
        onPrimary = Color.White,
        primaryContainer = Color(0xFFA6F5A3),
        onPrimaryContainer = Color(0xFF002206),
        secondary = Color(0xFF526350),
        onSecondary = Color.White,
        surface = BotanicalLightSurface,
        onSurface = BotanicalLightOnSurface,
        surfaceContainer = BotanicalLightSurfaceContainer,
        surfaceContainerHigh = BotanicalLightSurfaceContainerHigh,
        outline = Color(0xFF727971),
        outlineVariant = Color(0xFFC1C9BF),
        background = BotanicalLightSurface,
        onBackground = BotanicalLightOnSurface
    )
}
