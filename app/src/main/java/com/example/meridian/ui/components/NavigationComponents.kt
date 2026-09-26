package com.example.meridian.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.meridian.data.model.ModuleRoute

data class NavItem(
    val route: ModuleRoute,
    val label: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector,
    val badge: String? = null
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MeridianTopAppBar(
    currentRoute: ModuleRoute,
    onOpenCommandPalette: () -> Unit,
    onOpenThemeDialog: () -> Unit,
    onOpenQuickAdd: () -> Unit,
    modifier: Modifier = Modifier
) {
    TopAppBar(
        title = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.primaryContainer),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.AllInclusive,
                        contentDescription = "Meridian",
                        tint = MaterialTheme.colorScheme.onPrimaryContainer,
                        modifier = Modifier.size(20.dp)
                    )
                }
                Spacer(modifier = Modifier.width(10.dp))
                Column {
                    Text(
                        text = "MERIDIAN",
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp
                        ),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = currentRoute.title.uppercase(),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }
        },
        actions = {
            IconButton(
                onClick = onOpenCommandPalette,
                modifier = Modifier.testTag("command_palette_button")
            ) {
                Icon(
                    imageVector = Icons.Outlined.Search,
                    contentDescription = "Search & Commands",
                    tint = MaterialTheme.colorScheme.onSurface
                )
            }
            IconButton(
                onClick = onOpenThemeDialog,
                modifier = Modifier.testTag("theme_selector_button")
            ) {
                Icon(
                    imageVector = Icons.Outlined.Palette,
                    contentDescription = "Change Theme",
                    tint = MaterialTheme.colorScheme.onSurface
                )
            }
            FilledIconButton(
                onClick = onOpenQuickAdd,
                modifier = Modifier.testTag("quick_add_header_button"),
                colors = IconButtonDefaults.filledIconButtonColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    contentColor = MaterialTheme.colorScheme.onPrimary
                )
            ) {
                Icon(
                    imageVector = Icons.Default.Add,
                    contentDescription = "Quick Add"
                )
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        modifier = modifier
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MeridianBottomNavigationBar(
    currentRoute: ModuleRoute,
    onNavigate: (ModuleRoute) -> Unit,
    onOpenMore: () -> Unit,
    journalBadge: String? = null,
    recoveryBadge: String? = null,
    modifier: Modifier = Modifier
) {
    val isMoreRouteActive = currentRoute == ModuleRoute.PULSE || currentRoute == ModuleRoute.GOALS || currentRoute == ModuleRoute.TIMELINE

    val primaryItems = listOf(
        NavItem(ModuleRoute.OVERVIEW, "Today", Icons.Filled.Dashboard, Icons.Outlined.Dashboard),
        NavItem(ModuleRoute.STUDY, "Study", Icons.Filled.School, Icons.Outlined.School),
        NavItem(ModuleRoute.PULSE, "Vitality", Icons.Filled.Favorite, Icons.Outlined.FavoriteBorder, recoveryBadge),
        NavItem(ModuleRoute.FINANCE, "Finance", Icons.Filled.AccountBalanceWallet, Icons.Outlined.AccountBalanceWallet),
        NavItem(ModuleRoute.JOURNAL, "Logbook", Icons.Filled.Book, Icons.Outlined.Book, journalBadge)
    )

    NavigationBar(
        containerColor = MaterialTheme.colorScheme.surfaceContainer,
        modifier = modifier
            .testTag("bottom_nav_bar")
            .windowInsetsPadding(WindowInsets.navigationBars)
    ) {
        primaryItems.forEach { item ->
            val isSelected = currentRoute == item.route || (item.route == ModuleRoute.PULSE && currentRoute == ModuleRoute.RECOVERY)
            NavigationBarItem(
                selected = isSelected,
                onClick = { onNavigate(item.route) },
                icon = {
                    BadgedBox(
                        badge = {
                            if (!item.badge.isNullOrBlank()) {
                                Badge(containerColor = MaterialTheme.colorScheme.primary) {
                                    Text(item.badge, color = MaterialTheme.colorScheme.onPrimary)
                                }
                            }
                        }
                    ) {
                        Icon(
                            imageVector = if (isSelected) item.selectedIcon else item.unselectedIcon,
                            contentDescription = item.label
                        )
                    }
                },
                label = {
                    Text(
                        text = item.label,
                        style = MaterialTheme.typography.labelSmall,
                        maxLines = 1
                    )
                },
                colors = NavigationBarItemDefaults.colors(
                    indicatorColor = MaterialTheme.colorScheme.primaryContainer,
                    selectedIconColor = MaterialTheme.colorScheme.onPrimaryContainer,
                    selectedTextColor = MaterialTheme.colorScheme.primary,
                    unselectedIconColor = MaterialTheme.colorScheme.outline,
                    unselectedTextColor = MaterialTheme.colorScheme.outline
                )
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MoreModulesBottomSheet(
    currentRoute: ModuleRoute,
    onNavigate: (ModuleRoute) -> Unit,
    onDismiss: () -> Unit
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = MaterialTheme.colorScheme.surfaceContainerHigh,
        dragHandle = { BottomSheetDefaults.DragHandle() },
        modifier = Modifier.testTag("more_modules_sheet")
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 10.dp)
        ) {
            Text(
                text = "More Systems",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = "Specialized telemetry and continuous tracking modules",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.outline
            )
            Spacer(modifier = Modifier.height(18.dp))

            val moreModules = listOf(
                Triple(
                    ModuleRoute.PULSE,
                    "Pulse Check-in",
                    "Daily sleep duration, quality, mood, energy ratings & habit streaks"
                ),
                Triple(
                    ModuleRoute.GOALS,
                    "Goals & Targets",
                    "Target metrics, active milestones, step-by-step progress logging"
                ),
                Triple(
                    ModuleRoute.TIMELINE,
                    "Timeline Stream",
                    "Cross-module audit trail and chronological event sequence"
                )
            )

            moreModules.forEach { (route, title, desc) ->
                val isSelected = currentRoute == route
                Surface(
                    onClick = {
                        onNavigate(route)
                        onDismiss()
                    },
                    shape = RoundedCornerShape(16.dp),
                    color = if (isSelected) MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.4f) else MaterialTheme.colorScheme.surfaceContainer,
                    border = if (isSelected) androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.primary) else null,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 5.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        val icon = when (route) {
                            ModuleRoute.PULSE -> Icons.Default.Favorite
                            ModuleRoute.GOALS -> Icons.Default.EmojiEvents
                            ModuleRoute.TIMELINE -> Icons.Default.History
                            else -> Icons.Default.Circle
                        }
                        val iconColor = when (route) {
                            ModuleRoute.PULSE -> Color(0xFFE0574B)
                            ModuleRoute.GOALS -> Color(0xFFE8B368)
                            ModuleRoute.TIMELINE -> Color(0xFFC77DFF)
                            else -> MaterialTheme.colorScheme.primary
                        }

                        Box(
                            modifier = Modifier
                                .size(44.dp)
                                .clip(CircleShape)
                                .background(iconColor.copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(icon, contentDescription = title, tint = iconColor)
                        }
                        Spacer(modifier = Modifier.width(14.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = title,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.SemiBold
                            )
                            Text(
                                text = desc,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.outline
                            )
                        }
                        Icon(
                            imageVector = Icons.Default.ChevronRight,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.outline
                        )
                    }
                }
            }
            Spacer(modifier = Modifier.height(28.dp))
        }
    }
}
