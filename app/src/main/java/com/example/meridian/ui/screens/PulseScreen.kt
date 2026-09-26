package com.example.meridian.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import com.example.meridian.data.model.PulseHabitEntity
import com.example.meridian.data.model.PulseLogEntity
import kotlin.math.roundToInt

@Composable
fun PulseScreen(
    pulseLogs: List<PulseLogEntity>,
    habits: List<PulseHabitEntity>,
    onLogPulse: (Float?, Int?, Int?, Int?, Int?, String?) -> Unit,
    onNavigateToRecovery: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    var sleepHours by remember { mutableStateOf(7.5f) }
    var sleepQuality by remember { mutableStateOf(4) }
    var mood by remember { mutableStateOf(4) }
    var energy by remember { mutableStateOf(4) }
    var focus by remember { mutableStateOf(4) }
    var note by remember { mutableStateOf("") }
    var submittedNotice by remember { mutableStateOf(false) }

    val habitCheckState = remember { mutableStateMapOf<String, Boolean>() }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp)
            .testTag("pulse_screen"),
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
                        selected = true,
                        onClick = { },
                        label = { Text("⚡ Habits & Sleep", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold) },
                        modifier = Modifier.weight(1f)
                    )
                    FilterChip(
                        selected = false,
                        onClick = { onNavigateToRecovery?.invoke() },
                        label = { Text("🛡️ Sobriety Fortress", style = MaterialTheme.typography.labelSmall) },
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }

        // Today's Biometric & Habit Check-in Card
        item {
            Card(
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerHigh),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("pulse_checkin_card")
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "TODAY'S BIOMETRIC PULSE",
                            style = MaterialTheme.typography.labelSmall,
                            letterSpacing = 1.sp,
                            color = Color(0xFFE0574B),
                            fontWeight = FontWeight.Bold
                        )
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(CircleShape)
                                .background(Color(0xFFE0574B).copy(alpha = 0.2f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Favorite, contentDescription = null, tint = Color(0xFFE0574B), modifier = Modifier.size(18.dp))
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Sleep Hours Slider
                    Text(
                        text = "Sleep Duration: ${"%.1f".format(sleepHours)} Hours",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                    Slider(
                        value = sleepHours,
                        onValueChange = { sleepHours = (it * 2).roundToInt() / 2f },
                        valueRange = 4f..12f,
                        steps = 15
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    // Rating Matrix: Mood, Energy, Focus
                    RatingSelectorRow("Mood Index", mood, listOf("1 😞", "2 😐", "3 🙂", "4 😊", "5 🚀")) { mood = it }
                    Spacer(modifier = Modifier.height(8.dp))
                    RatingSelectorRow("Energy Level", energy, listOf("1 🪫", "2 ⚡", "3 ⚡⚡", "4 ⚡⚡⚡", "5 🔥")) { energy = it }
                    Spacer(modifier = Modifier.height(8.dp))
                    RatingSelectorRow("Focus State", focus, listOf("1 🌫️", "2 🎯", "3 🎯🎯", "4 🧠", "5 🌊")) { focus = it }

                    Spacer(modifier = Modifier.height(16.dp))
                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                    Spacer(modifier = Modifier.height(14.dp))

                    // Habits Checklist
                    Text(
                        text = "DAILY RECURSIVE HABITS",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    habits.forEach { habit ->
                        val checked = habitCheckState[habit.id] ?: false
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 2.dp)
                        ) {
                            Checkbox(
                                checked = checked,
                                onCheckedChange = { habitCheckState[habit.id] = it },
                                colors = CheckboxDefaults.colors(checkedColor = MaterialTheme.colorScheme.primary)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(habit.name, style = MaterialTheme.typography.bodyMedium)
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        value = note,
                        onValueChange = { note = it },
                        label = { Text("Daily notes / physical sensations") },
                        minLines = 2,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = {
                            onLogPulse(sleepHours, sleepQuality, mood, energy, focus, note)
                            submittedNotice = true
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE0574B)),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("submit_pulse_button")
                    ) {
                        Text(if (submittedNotice) "Pulse Recorded! ✓" else "Record Pulse Telemetry")
                    }
                }
            }
        }

        // Recent Pulse History
        item {
            Text("RECENT PULSE AUDITS", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
        }

        if (pulseLogs.isEmpty()) {
            item {
                Text("No check-ins yet. Submit today's pulse above.", color = MaterialTheme.colorScheme.outline)
            }
        } else {
            items(pulseLogs.take(7), key = { it.id }) { log ->
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainer),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(log.date, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                            Text(
                                text = "Sleep: ${log.sleepHours ?: "-"}h • Mood: ${log.mood ?: "-"}/5 • Energy: ${log.energy ?: "-"}/5",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.outline
                            )
                            if (!log.note.isNullOrBlank()) {
                                Text(log.note, style = MaterialTheme.typography.bodySmall)
                            }
                        }
                        Surface(
                            shape = CircleShape,
                            color = Color(0xFFE0574B).copy(alpha = 0.15f)
                        ) {
                            Text(
                                text = "CHECKED",
                                style = MaterialTheme.typography.labelSmall,
                                color = Color(0xFFE0574B),
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun RatingSelectorRow(label: String, selected: Int, options: List<String>, onSelect: (Int) -> Unit) {
    Column {
        Text(label, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium)
        Spacer(modifier = Modifier.height(4.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            options.forEachIndexed { i, opt ->
                val rating = i + 1
                val isSelected = selected == rating
                Surface(
                    onClick = { onSelect(rating) },
                    shape = RoundedCornerShape(10.dp),
                    color = if (isSelected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceContainer,
                    modifier = Modifier
                        .weight(1f)
                        .height(38.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(
                            text = opt,
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                        )
                    }
                }
            }
        }
    }
}
