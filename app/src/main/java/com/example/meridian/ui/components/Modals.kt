package com.example.meridian.ui.components

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.meridian.data.model.MaterialThemePalette
import com.example.meridian.data.model.ModuleRoute
import com.example.meridian.data.model.PulseHabitEntity
import com.example.meridian.data.model.ThemeMode

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QuickAddBottomSheet(
    onDismiss: () -> Unit,
    onNavigate: (ModuleRoute) -> Unit,
    onQuickJournal: (String) -> Unit,
    onQuickStudy: (Int, String) -> Unit,
    onQuickUrge: () -> Unit,
    onOpenGrounding: () -> Unit
) {
    var activeTab by remember { mutableStateOf("menu") }
    var journalText by remember { mutableStateOf("") }
    var studyMins by remember { mutableStateOf("45") }
    var studyTopic by remember { mutableStateOf("") }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = MaterialTheme.colorScheme.surfaceContainerHigh,
        dragHandle = { BottomSheetDefaults.DragHandle() },
        modifier = Modifier.testTag("quick_add_modal")
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp, vertical = 12.dp)
        ) {
            when (activeTab) {
                "menu" -> {
                    Text(
                        text = "Quick Dispatch",
                        style = MaterialTheme.typography.titleLarge,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "Capture immediate telemetry without leaving your flow.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.outline
                    )
                    Spacer(modifier = Modifier.height(20.dp))

                    QuickActionTile(
                        icon = Icons.Default.Book,
                        title = "Fast Journal Reflection",
                        desc = "Drop thoughts, insights or gratitude",
                        color = MaterialTheme.colorScheme.primary,
                        onClick = { activeTab = "journal" }
                    )
                    Spacer(modifier = Modifier.height(10.dp))

                    QuickActionTile(
                        icon = Icons.Default.School,
                        title = "Log Study Sprint",
                        desc = "Add focus session minutes & subject",
                        color = Color(0xFF2D6A4F),
                        onClick = { activeTab = "study" }
                    )
                    Spacer(modifier = Modifier.height(10.dp))

                    QuickActionTile(
                        icon = Icons.Default.Shield,
                        title = "Urge Surfer / SOS Grounding",
                        desc = "Emergency grounding & breathwork to preserve clean streak",
                        color = Color(0xFFC9963A),
                        onClick = {
                            onDismiss()
                            onOpenGrounding()
                        }
                    )
                    Spacer(modifier = Modifier.height(10.dp))

                    QuickActionTile(
                        icon = Icons.Default.Favorite,
                        title = "Record Daily Pulse",
                        desc = "Rate sleep, mood, and habits",
                        color = Color(0xFFE0574B),
                        onClick = {
                            onDismiss()
                            onNavigate(ModuleRoute.PULSE)
                        }
                    )
                }

                "journal" -> {
                    Text("Fast Logbook Entry", style = MaterialTheme.typography.titleLarge)
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        value = journalText,
                        onValueChange = { journalText = it },
                        label = { Text("What's on your mind?") },
                        minLines = 4,
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("quick_journal_input")
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                        TextButton(onClick = { activeTab = "menu" }) { Text("Back") }
                        Spacer(modifier = Modifier.width(8.dp))
                        Button(
                            onClick = {
                                if (journalText.isNotBlank()) {
                                    onQuickJournal(journalText)
                                    onDismiss()
                                }
                            },
                            modifier = Modifier.testTag("submit_quick_journal")
                        ) {
                            Text("Save Reflection")
                        }
                    }
                }

                "study" -> {
                    Text("Log Study Sprint", style = MaterialTheme.typography.titleLarge)
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        value = studyMins,
                        onValueChange = { studyMins = it },
                        label = { Text("Duration (minutes)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    OutlinedTextField(
                        value = studyTopic,
                        onValueChange = { studyTopic = it },
                        label = { Text("Topic or Concept Studied") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                        TextButton(onClick = { activeTab = "menu" }) { Text("Back") }
                        Spacer(modifier = Modifier.width(8.dp))
                        Button(
                            onClick = {
                                val mins = studyMins.toIntOrNull() ?: 45
                                onQuickStudy(mins, studyTopic)
                                onDismiss()
                            }
                        ) {
                            Text("Log Session")
                        }
                    }
                }
            }
            Spacer(modifier = Modifier.height(28.dp))
        }
    }
}

@Composable
fun QuickActionTile(
    icon: ImageVector,
    title: String,
    desc: String,
    color: Color,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(16.dp),
        color = MaterialTheme.colorScheme.surfaceContainer,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(color.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = title, tint = color)
            }
            Spacer(modifier = Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                Text(desc, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.outline)
            }
            Icon(Icons.Default.ChevronRight, contentDescription = null, tint = MaterialTheme.colorScheme.outline)
        }
    }
}

/* Grounding / Urge Surfer Modal */
@Composable
fun GroundingUrgeSurferModal(
    onDismiss: () -> Unit,
    onUrgeOvercome: () -> Unit
) {
    var step by remember { mutableStateOf(1) }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerHigh),
            modifier = Modifier
                .fillMaxWidth()
                .padding(8.dp)
                .testTag("grounding_modal")
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier
                        .size(56.dp)
                        .clip(CircleShape)
                        .background(Color(0xFFC9963A).copy(alpha = 0.2f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Waves,
                        contentDescription = "Urge Surfer",
                        tint = Color(0xFFC9963A),
                        modifier = Modifier.size(32.dp)
                    )
                }
                Spacer(modifier = Modifier.height(14.dp))
                Text(
                    text = "URGE SURFER PROTOCOL",
                    style = MaterialTheme.typography.labelLarge,
                    color = Color(0xFFC9963A),
                    letterSpacing = 1.sp
                )
                Text(
                    text = "A craving is a neurochemical wave that peaks in 3-5 minutes and passes.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.outline,
                    modifier = Modifier.padding(top = 4.dp, bottom = 18.dp)
                )

                // 5-4-3-2-1 Sensory Grounding Steps
                when (step) {
                    1 -> GroundingStepCard(
                        num = "5",
                        prompt = "Look around you. Name 5 things you can see right now.",
                        sub = "Notice specific colors, shapes, and shadow boundaries."
                    )
                    2 -> GroundingStepCard(
                        num = "4",
                        prompt = "Name 4 physical sensations you can touch.",
                        sub = "The fabric of your clothes, feet on the floor, phone texture."
                    )
                    3 -> GroundingStepCard(
                        num = "3",
                        prompt = "Listen closely. Name 3 distinct sounds you can hear.",
                        sub = "Distant traffic, hum of electronics, your own breathing."
                    )
                    4 -> GroundingStepCard(
                        num = "2",
                        prompt = "Identify 2 things you can smell or taste.",
                        sub = "Fresh air, coffee aroma, cool water."
                    )
                    5 -> GroundingStepCard(
                        num = "1",
                        prompt = "Take a slow 4-second box breath and affirm your integrity.",
                        sub = "Inhale 4s, hold 4s, exhale 4s, hold 4s. You are in control."
                    )
                }

                Spacer(modifier = Modifier.height(24.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    if (step > 1) {
                        OutlinedButton(onClick = { step-- }) { Text("Back") }
                    } else {
                        Spacer(modifier = Modifier.width(1.dp))
                    }

                    if (step < 5) {
                        Button(
                            onClick = { step++ },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFC9963A))
                        ) {
                            Text("Next Anchor (${step}/5)")
                        }
                    } else {
                        Button(
                            onClick = {
                                onUrgeOvercome()
                                onDismiss()
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                            modifier = Modifier.testTag("confirm_urge_surfed")
                        ) {
                            Text("Wave Surfed! (+1 Urge Logged)")
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun GroundingStepCard(num: String, prompt: String, sub: String) {
    Surface(
        shape = RoundedCornerShape(16.dp),
        color = MaterialTheme.colorScheme.surfaceContainer,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Text(
                text = "STEP $num",
                style = MaterialTheme.typography.labelSmall,
                color = Color(0xFFC9963A),
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = prompt,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = sub,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.outline
            )
        }
    }
}

/* Theme Selector Dialog */
@Composable
fun ThemeSelectorDialog(
    currentPalette: MaterialThemePalette,
    currentMode: ThemeMode,
    onSelectPalette: (MaterialThemePalette) -> Unit,
    onSelectMode: (ThemeMode) -> Unit,
    onDismiss: () -> Unit
) {
    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerHigh),
            modifier = Modifier
                .fillMaxWidth()
                .testTag("theme_selector_modal")
        ) {
            Column(modifier = Modifier.padding(24.dp)) {
                Text(
                    text = "Material You Theme",
                    style = MaterialTheme.typography.titleLarge
                )
                Text(
                    text = "Select dynamic tonal palette & surface mode.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.outline
                )
                Spacer(modifier = Modifier.height(18.dp))

                Text("Theme Palette", style = MaterialTheme.typography.labelLarge)
                Spacer(modifier = Modifier.height(8.dp))
                val palettes = listOf(
                    MaterialThemePalette.BOTANICAL to Color(0xFF78DC77),
                    MaterialThemePalette.OCEAN to Color(0xFF56A9FF),
                    MaterialThemePalette.TERRACOTTA to Color(0xFFFFB77C),
                    MaterialThemePalette.LAVENDER to Color(0xFFD2BCFF),
                    MaterialThemePalette.ROSE to Color(0xFFFFB1C8),
                    MaterialThemePalette.MONOCHROME to Color(0xFFE2E2E2)
                )

                palettes.chunked(3).forEach { row ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        row.forEach { (pal, col) ->
                            val isSelected = currentPalette == pal
                            Surface(
                                onClick = { onSelectPalette(pal) },
                                shape = RoundedCornerShape(12.dp),
                                color = if (isSelected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceContainer,
                                border = if (isSelected) ButtonDefaults.outlinedButtonBorder else null,
                                modifier = Modifier
                                    .weight(1f)
                                    .height(48.dp)
                            ) {
                                Row(
                                    modifier = Modifier.padding(8.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(16.dp)
                                            .clip(CircleShape)
                                            .background(col)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = pal.label,
                                        style = MaterialTheme.typography.labelSmall,
                                        maxLines = 1
                                    )
                                }
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                }

                Spacer(modifier = Modifier.height(14.dp))
                Text("Color Mode", style = MaterialTheme.typography.labelLarge)
                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    ThemeMode.values().forEach { mode ->
                        val isSelected = currentMode == mode
                        FilterChip(
                            selected = isSelected,
                            onClick = { onSelectMode(mode) },
                            label = { Text(mode.name.lowercase().replaceFirstChar { it.uppercase() }) },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))
                Button(
                    onClick = onDismiss,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Apply & Close")
                }
            }
        }
    }
}

/* Command Palette Dialog */
@Composable
fun CommandPaletteDialog(
    onNavigate: (ModuleRoute) -> Unit,
    onDismiss: () -> Unit
) {
    var query by remember { mutableStateOf("") }
    val commands = listOf(
        Triple(ModuleRoute.OVERVIEW, "Overview & Life WAR Scoreboard", "View composite index, today's move and sabermetrics"),
        Triple(ModuleRoute.JOURNAL, "Logbook / Journal", "Add reflections, browse tags and pinned notes"),
        Triple(ModuleRoute.STUDY, "Study Ledger & Curriculum", "Anatomy, Physiology, Biochemistry 200L syllabus"),
        Triple(ModuleRoute.RECOVERY, "Unbound Recovery Counter", "Clean time tracker, urges logged, milestones"),
        Triple(ModuleRoute.FINANCE, "Finance & Cash Flow Ledger", "Accounts, budgets, income and expense records"),
        Triple(ModuleRoute.PULSE, "Daily Pulse Check-in", "Sleep, mood, energy ratings and daily habit checklist"),
        Triple(ModuleRoute.GOALS, "Goals & Strategic Milestones", "Long-term and milestone progression"),
        Triple(ModuleRoute.TIMELINE, "Unified Telemetry Timeline", "Chronological audit stream across all modules")
    ).filter { it.second.contains(query, ignoreCase = true) || it.third.contains(query, ignoreCase = true) }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerHigh),
            modifier = Modifier
                .fillMaxWidth()
                .padding(8.dp)
                .testTag("command_palette_modal")
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                OutlinedTextField(
                    value = query,
                    onValueChange = { query = it },
                    placeholder = { Text("Search modules or commands...") },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("command_palette_input")
                )
                Spacer(modifier = Modifier.height(14.dp))
                LazyColumn(modifier = Modifier.heightIn(max = 350.dp)) {
                    items(commands) { cmd ->
                        Surface(
                            onClick = {
                                onNavigate(cmd.first)
                                onDismiss()
                            },
                            shape = RoundedCornerShape(12.dp),
                            color = MaterialTheme.colorScheme.surfaceContainer,
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Default.ArrowForward, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Text(cmd.second, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                                    Text(cmd.third, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.outline)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

/* 60-Second Daily Ritual Modal (Morning Kick-off & Evening Debrief) */
@Composable
fun DailyRitualDialog(
    initialIsMorning: Boolean = true,
    habits: List<PulseHabitEntity>,
    onDismiss: () -> Unit,
    onSaveMorning: (sleepHours: Float, sleepQuality: Int, energy: Int, target: String, mindset: String) -> Unit,
    onSaveEvening: (mood: Int, habits: Map<String, Boolean>, expenseAmount: Long?, expenseCategory: String?, reflection: String) -> Unit
) {
    var isMorning by remember { mutableStateOf(initialIsMorning) }

    // Morning state
    var sleepHours by remember { mutableStateOf(7.5f) }
    var sleepQuality by remember { mutableStateOf(4) }
    var morningEnergy by remember { mutableStateOf(4) }
    var coreTarget by remember { mutableStateOf("") }
    var mindsetRule by remember { mutableStateOf("") }

    // Evening state
    var eveningMood by remember { mutableStateOf(4) }
    val habitMap = remember { mutableStateMapOf<String, Boolean>() }
    var hasExpense by remember { mutableStateOf(false) }
    var expenseAmountStr by remember { mutableStateOf("") }
    var expenseCategory by remember { mutableStateOf("Food & Dining") }
    var eveningReflection by remember { mutableStateOf("") }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerHigh),
            modifier = Modifier
                .fillMaxWidth()
                .padding(4.dp)
                .testTag("daily_ritual_modal")
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(
                                    if (isMorning) Color(0xFFF59E0B).copy(alpha = 0.2f)
                                    else Color(0xFF6366F1).copy(alpha = 0.2f)
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = if (isMorning) Icons.Default.WbSunny else Icons.Default.NightlightRound,
                                contentDescription = null,
                                tint = if (isMorning) Color(0xFFF59E0B) else Color(0xFF6366F1),
                                modifier = Modifier.size(22.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = if (isMorning) "Morning Kick-off (60s)" else "Evening Debrief (60s)",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Cross-system daily synchronization",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.outline
                            )
                        }
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close")
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Phase Switcher Chips
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FilterChip(
                        selected = isMorning,
                        onClick = { isMorning = true },
                        label = { Text("🌅 Morning") },
                        modifier = Modifier.weight(1f)
                    )
                    FilterChip(
                        selected = !isMorning,
                        onClick = { isMorning = false },
                        label = { Text("🌙 Evening") },
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(14.dp))

                if (isMorning) {
                    // Morning Form
                    Text("Sleep Duration", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        listOf(6f to "6h", 7f to "7h", 7.5f to "7.5h", 8f to "8h", 8.5f to "8.5h").forEach { (h, lbl) ->
                            FilterChip(
                                selected = sleepHours == h,
                                onClick = { sleepHours = h },
                                label = { Text(lbl, style = MaterialTheme.typography.labelSmall) }
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Quality: ${sleepQuality}/5", style = MaterialTheme.typography.bodySmall)
                        Row {
                            (1..5).forEach { star ->
                                IconButton(
                                    onClick = { sleepQuality = star },
                                    modifier = Modifier.size(32.dp)
                                ) {
                                    Icon(
                                        imageVector = if (star <= sleepQuality) Icons.Default.Star else Icons.Outlined.StarBorder,
                                        contentDescription = null,
                                        tint = if (star <= sleepQuality) Color(0xFFF59E0B) else MaterialTheme.colorScheme.outline,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                            }
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Energy: ${morningEnergy}/5", style = MaterialTheme.typography.bodySmall)
                        Row {
                            (1..5).forEach { star ->
                                IconButton(
                                    onClick = { morningEnergy = star },
                                    modifier = Modifier.size(32.dp)
                                ) {
                                    Icon(
                                        imageVector = if (star <= morningEnergy) Icons.Default.Bolt else Icons.Outlined.Bolt,
                                        contentDescription = null,
                                        tint = if (star <= morningEnergy) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = coreTarget,
                        onValueChange = { coreTarget = it },
                        label = { Text("Core Non-Negotiable Target") },
                        placeholder = { Text("e.g. 2 Anatomy sprints, no dining expense") },
                        modifier = Modifier.fillMaxWidth()
                    )
                } else {
                    // Evening Form
                    Text("Daily Habits Checked", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(4.dp))

                    val activeHabits = habits.filter { !it.archived }.take(4)
                    activeHabits.forEach { habit ->
                        val checked = habitMap[habit.id] ?: false
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { habitMap[habit.id] = !checked }
                                .padding(vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Checkbox(
                                checked = checked,
                                onCheckedChange = { habitMap[habit.id] = it }
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(habit.name, style = MaterialTheme.typography.bodyMedium)
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = eveningReflection,
                        onValueChange = { eveningReflection = it },
                        label = { Text("1-Sentence Golden Reflection") },
                        placeholder = { Text("e.g. Mastered nerve branches; kept calm focus") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                Spacer(modifier = Modifier.height(18.dp))

                Button(
                    onClick = {
                        if (isMorning) {
                            onSaveMorning(sleepHours, sleepQuality, morningEnergy, coreTarget, mindsetRule)
                        } else {
                            val amt = expenseAmountStr.toLongOrNull()?.let { it * 100 }
                            onSaveEvening(eveningMood, habitMap.toMap(), amt, if (hasExpense) expenseCategory else null, eveningReflection)
                        }
                        onDismiss()
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(if (isMorning) "Lock In Morning Plan" else "Close Today's Ledger")
                }
            }
        }
    }
}
