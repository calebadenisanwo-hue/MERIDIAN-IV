package com.example.meridian.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.meridian.data.model.ModuleRoute
import com.example.meridian.data.model.UnifiedTimelineItem

@Composable
fun TimelineScreen(
    timelineItems: List<UnifiedTimelineItem>,
    modifier: Modifier = Modifier
) {
    var selectedModuleFilter by remember { mutableStateOf<ModuleRoute?>(null) }

    val filteredItems = remember(timelineItems, selectedModuleFilter) {
        if (selectedModuleFilter == null) timelineItems
        else timelineItems.filter { it.module == selectedModuleFilter }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp)
            .testTag("timeline_screen")
    ) {
        Spacer(modifier = Modifier.height(8.dp))

        // Timeline Header
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerHigh),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                Text(
                    text = "UNIFIED TELEMETRY AUDIT STREAM",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "${filteredItems.size} Events Logged",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Chronological execution trail across all 6 core systems.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.outline
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Module Filter Chips
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            item {
                FilterChip(
                    selected = selectedModuleFilter == null,
                    onClick = { selectedModuleFilter = null },
                    label = { Text("All Modules") }
                )
            }
            val filterModules = listOf(
                ModuleRoute.JOURNAL,
                ModuleRoute.STUDY,
                ModuleRoute.RECOVERY,
                ModuleRoute.FINANCE,
                ModuleRoute.PULSE,
                ModuleRoute.GOALS
            )
            items(filterModules) { mod ->
                FilterChip(
                    selected = selectedModuleFilter == mod,
                    onClick = { selectedModuleFilter = if (selectedModuleFilter == mod) null else mod },
                    label = { Text(mod.title) }
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        if (filteredItems.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                contentAlignment = Alignment.Center
            ) {
                Text("No timeline events found for this filter.", color = MaterialTheme.colorScheme.outline)
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(10.dp),
                contentPadding = PaddingValues(bottom = 80.dp),
                modifier = Modifier.weight(1f)
            ) {
                items(filteredItems, key = { it.id }) { item ->
                    TimelineItemCard(item = item)
                }
            }
        }
    }
}

@Composable
fun TimelineItemCard(item: UnifiedTimelineItem) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainer),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            val icon = when (item.module) {
                ModuleRoute.JOURNAL -> Icons.Default.Book
                ModuleRoute.STUDY -> Icons.Default.School
                ModuleRoute.RECOVERY -> Icons.Default.Shield
                ModuleRoute.FINANCE -> Icons.Default.AccountBalanceWallet
                ModuleRoute.PULSE -> Icons.Default.Favorite
                ModuleRoute.GOALS -> Icons.Default.EmojiEvents
                else -> Icons.Default.Circle
            }
            val badgeColor = when (item.module) {
                ModuleRoute.JOURNAL -> Color(0xFF805B9A)
                ModuleRoute.STUDY -> Color(0xFF2D6A4F)
                ModuleRoute.RECOVERY -> Color(0xFFC9963A)
                ModuleRoute.FINANCE -> Color(0xFF22A566)
                ModuleRoute.PULSE -> Color(0xFFE0574B)
                ModuleRoute.GOALS -> Color(0xFFD3A346)
                else -> MaterialTheme.colorScheme.primary
            }

            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(badgeColor.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = null, tint = badgeColor, modifier = Modifier.size(20.dp))
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(item.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                    Text(item.date, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.outline)
                }
                Spacer(modifier = Modifier.height(2.dp))
                Text(item.detail, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurface)

                if (!item.badge.isNullOrBlank()) {
                    Spacer(modifier = Modifier.height(6.dp))
                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = badgeColor.copy(alpha = 0.12f)
                    ) {
                        Text(
                            text = item.badge,
                            style = MaterialTheme.typography.labelSmall,
                            color = badgeColor,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }
            }
        }
    }
}
