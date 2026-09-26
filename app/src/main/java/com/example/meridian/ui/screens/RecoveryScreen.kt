package com.example.meridian.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.window.Dialog
import com.example.meridian.data.model.RecoveryLogEntity
import com.example.meridian.data.model.RecoveryQuitEntity
import kotlin.math.max

data class RecoveryMilestone(val days: Int, val label: String, val badge: String)

val RECOVERY_MILESTONES = listOf(
    RecoveryMilestone(1, "24 Hours", "🌱"),
    RecoveryMilestone(3, "3 Days", "🥉"),
    RecoveryMilestone(7, "1 Week", "🥈"),
    RecoveryMilestone(14, "2 Weeks", "🥇"),
    RecoveryMilestone(30, "1 Month", "⭐"),
    RecoveryMilestone(60, "2 Months", "✨"),
    RecoveryMilestone(90, "90 Days", "🏆"),
    RecoveryMilestone(180, "6 Months", "💎"),
    RecoveryMilestone(365, "1 Year", "👑")
)

@Composable
fun RecoveryScreen(
    quits: List<RecoveryQuitEntity>,
    logs: List<RecoveryLogEntity>,
    onLogUrge: (String, String?) -> Unit,
    onLogReset: (String, String?) -> Unit,
    onOpenGrounding: () -> Unit,
    onNavigateToHabits: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    var selectedQuitId by remember { mutableStateOf(quits.firstOrNull()?.id ?: "") }
    var showResetDialog by remember { mutableStateOf(false) }

    val activeQuit = remember(quits, selectedQuitId) {
        quits.find { it.id == selectedQuitId } ?: quits.firstOrNull()
    }

    val now = System.currentTimeMillis()
    val cleanMs = remember(activeQuit, now) {
        if (activeQuit != null) max(0L, now - activeQuit.quitTimestamp) else 0L
    }
    val cleanDays = (cleanMs / (1000 * 60 * 60 * 24)).toInt()
    val cleanHours = ((cleanMs / (1000 * 60 * 60)) % 24).toInt()
    val cleanMins = ((cleanMs / (1000 * 60)) % 60).toInt()

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp)
            .testTag("recovery_screen"),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        contentPadding = PaddingValues(vertical = 16.dp)
    ) {
        // Vitality Hub Segmented Switcher
        item {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerHigh),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(6.dp),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    FilterChip(
                        selected = false,
                        onClick = { onNavigateToHabits?.invoke() },
                        label = { Text("⚡ Habits & Sleep", style = MaterialTheme.typography.labelSmall) },
                        modifier = Modifier.weight(1f)
                    )
                    FilterChip(
                        selected = true,
                        onClick = { },
                        label = { Text("🛡️ Sobriety Fortress", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold) },
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }
        // 1. Unbound Clean Time Hero Counter
        item {
            Card(
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerHigh),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("clean_counter_card")
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "UNBOUND INTEGRITY ENGINE",
                            style = MaterialTheme.typography.labelSmall,
                            letterSpacing = 1.2.sp,
                            color = Color(0xFFC9963A),
                            fontWeight = FontWeight.Bold
                        )
                        Surface(
                            shape = CircleShape,
                            color = Color(0xFFC9963A).copy(alpha = 0.15f)
                        ) {
                            Text(
                                text = "${activeQuit?.urgesLogged ?: 0} URGES SURFED",
                                style = MaterialTheme.typography.labelSmall,
                                color = Color(0xFFC9963A),
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(18.dp))

                    Text(
                        text = activeQuit?.name ?: "Habit Mastery",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    // Days Counter Ring
                    Box(
                        modifier = Modifier
                            .size(150.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.surfaceContainerHighest)
                            .border(3.dp, Color(0xFFC9963A), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = "$cleanDays",
                                style = MaterialTheme.typography.displayLarge.copy(fontSize = 52.sp),
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "DAYS CLEAN",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.outline
                            )
                            Text(
                                text = "${cleanHours}h ${cleanMins}m",
                                style = MaterialTheme.typography.labelSmall,
                                color = Color(0xFFC9963A),
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))
                    Text(
                        text = activeQuit?.reason ?: "Protect cognitive clarity and emotional sovereignty.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.outline
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    // Primary Action Buttons: Log Urge vs Reset
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Button(
                            onClick = {
                                activeQuit?.let { onLogUrge(it.id, "Urge resisted using grounding techniques.") }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF22A566)),
                            modifier = Modifier
                                .weight(1f)
                                .testTag("log_urge_button")
                        ) {
                            Icon(Icons.Default.Shield, contentDescription = null)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Surfed Urge")
                        }

                        OutlinedButton(
                            onClick = { showResetDialog = true },
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFE0574B)),
                            modifier = Modifier
                                .weight(1f)
                                .testTag("log_reset_button")
                        ) {
                            Icon(Icons.Default.RestartAlt, contentDescription = null)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Log Reset")
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    // Urge Surfer / SOS Grounding Banner
                    Surface(
                        onClick = onOpenGrounding,
                        shape = RoundedCornerShape(14.dp),
                        color = Color(0xFFC9963A).copy(alpha = 0.15f),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("sos_grounding_trigger")
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.Waves, contentDescription = null, tint = Color(0xFFC9963A))
                            Spacer(modifier = Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "SOS Urge Surfer & Breathwork",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.SemiBold,
                                    color = Color(0xFFC9963A)
                                )
                                Text(
                                    text = "5-4-3-2-1 Sensory grounding to ride out temptation",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }
                            Icon(Icons.Default.ChevronRight, contentDescription = null, tint = Color(0xFFC9963A))
                        }
                    }
                }
            }
        }

        // 2. Milestone Badges Showcase
        item {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainer),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Text(
                        text = "SOVEREIGNTY MILESTONES",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        items(RECOVERY_MILESTONES) { milestone ->
                            val unlocked = cleanDays >= milestone.days
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = if (unlocked) Color(0xFFC9963A).copy(alpha = 0.2f) else MaterialTheme.colorScheme.surfaceContainerHigh,
                                modifier = Modifier.width(80.dp)
                            ) {
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    modifier = Modifier.padding(8.dp)
                                ) {
                                    Text(text = milestone.badge, fontSize = 28.sp)
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = milestone.label,
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = if (unlocked) FontWeight.Bold else FontWeight.Normal,
                                        color = if (unlocked) Color(0xFFC9963A) else MaterialTheme.colorScheme.outline
                                    )
                                    Text(
                                        text = if (unlocked) "UNLOCKED" else "${milestone.days}d",
                                        style = MaterialTheme.typography.labelSmall.copy(fontSize = 9.sp),
                                        color = if (unlocked) Color(0xFF22A566) else MaterialTheme.colorScheme.outline
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (showResetDialog && activeQuit != null) {
        ResetStreakDialog(
            quitName = activeQuit.name,
            onDismiss = { showResetDialog = false },
            onConfirm = { reason ->
                onLogReset(activeQuit.id, reason)
                showResetDialog = false
            }
        )
    }
}

@Composable
fun ResetStreakDialog(
    quitName: String,
    onDismiss: () -> Unit,
    onConfirm: (String) -> Unit
) {
    var reason by remember { mutableStateOf("") }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerHigh),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(
                    text = "Log Slip / Reset Streak",
                    style = MaterialTheme.typography.titleLarge,
                    color = Color(0xFFE0574B)
                )
                Text(
                    text = "A reset is telemetry, not moral failure. Document the trigger to fortify your strategy for $quitName.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.outline
                )
                Spacer(modifier = Modifier.height(14.dp))
                OutlinedTextField(
                    value = reason,
                    onValueChange = { reason = it },
                    placeholder = { Text("What was the emotional state or trigger environment?") },
                    minLines = 3,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(16.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                    TextButton(onClick = onDismiss) { Text("Cancel") }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = { onConfirm(reason) },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE0574B))
                    ) {
                        Text("Reset & Begin Anew")
                    }
                }
            }
        }
    }
}
