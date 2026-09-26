package com.example.meridian.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.meridian.data.model.GoalCheckinEntity
import com.example.meridian.data.model.GoalItemEntity
import kotlin.math.min

@Composable
fun GoalsScreen(
    goals: List<GoalItemEntity>,
    checkins: List<GoalCheckinEntity>,
    onAddGoal: (String, String, Double, String, String?) -> Unit,
    onLogCheckin: (String, Double, String?) -> Unit,
    onDeleteGoal: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    var showAddDialog by remember { mutableStateOf(false) }
    var checkingInGoal by remember { mutableStateOf<GoalItemEntity?>(null) }

    Scaffold(
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = { showAddDialog = true },
                icon = { Icon(Icons.Default.Add, contentDescription = null) },
                text = { Text("New Goal") },
                containerColor = Color(0xFFD3A346),
                contentColor = Color.White,
                modifier = Modifier.testTag("add_goal_fab")
            )
        },
        modifier = modifier.fillMaxSize()
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
                .testTag("goals_screen")
        ) {
            Spacer(modifier = Modifier.height(8.dp))

            // Goals Header Card
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerHigh),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(
                        text = "STRATEGIC MILESTONES",
                        style = MaterialTheme.typography.labelSmall,
                        color = Color(0xFFD3A346),
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "${goals.size} Active Objectives",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Track quantitative benchmarks and long-horizon life milestones.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.outline
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            if (goals.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No goals created yet. Tap 'New Goal' to establish your targets.", color = MaterialTheme.colorScheme.outline)
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    contentPadding = PaddingValues(bottom = 80.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    items(goals, key = { it.id }) { goal ->
                        GoalCardItem(
                            goal = goal,
                            onCheckin = { checkingInGoal = goal },
                            onDelete = { onDeleteGoal(goal.id) }
                        )
                    }
                }
            }
        }
    }

    if (showAddDialog) {
        AddGoalDialog(
            onDismiss = { showAddDialog = false },
            onSave = { title, cat, target, unit, deadline ->
                onAddGoal(title, cat, target, unit, deadline)
                showAddDialog = false
            }
        )
    }

    if (checkingInGoal != null) {
        LogGoalCheckinDialog(
            goal = checkingInGoal!!,
            onDismiss = { checkingInGoal = null },
            onSave = { increment, note ->
                onLogCheckin(checkingInGoal!!.id, increment, note)
                checkingInGoal = null
            }
        )
    }
}

@Composable
fun GoalCardItem(
    goal: GoalItemEntity,
    onCheckin: () -> Unit,
    onDelete: () -> Unit
) {
    val progress = min(1.0f, (goal.currentValue / maxOf(1.0, goal.targetValue)).toFloat())
    val pct = (progress * 100).toInt()

    Card(
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainer),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = Color(0xFFD3A346).copy(alpha = 0.15f)
                ) {
                    Text(
                        text = goal.categoryId.uppercase(),
                        style = MaterialTheme.typography.labelSmall,
                        color = Color(0xFFD3A346),
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
                Row {
                    IconButton(onClick = onDelete, modifier = Modifier.size(28.dp)) {
                        Icon(Icons.Outlined.Delete, contentDescription = "Delete", tint = MaterialTheme.colorScheme.outline, modifier = Modifier.size(16.dp))
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))
            Text(goal.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)

            if (!goal.deadline.isNullOrBlank()) {
                Text("Deadline: ${goal.deadline}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.outline)
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Progress Bar
            LinearProgressIndicator(
                progress = { progress },
                color = Color(0xFFD3A346),
                trackColor = MaterialTheme.colorScheme.surfaceContainerHigh,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
            )

            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "${goal.currentValue.toInt()} / ${goal.targetValue.toInt()} ${goal.unit} ($pct%)",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold
                )
                Button(
                    onClick = onCheckin,
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                ) {
                    Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Check-in")
                }
            }
        }
    }
}

@Composable
fun AddGoalDialog(
    onDismiss: () -> Unit,
    onSave: (String, String, Double, String, String?) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("academic") }
    var targetStr by remember { mutableStateOf("10") }
    var unit by remember { mutableStateOf("units") }
    var deadline by remember { mutableStateOf("") }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerHigh),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text("Create New Goal", style = MaterialTheme.typography.titleLarge)
                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Goal Title") },
                    placeholder = { Text("e.g. Master Upper Limb Anatomy") },
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(10.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = targetStr,
                        onValueChange = { targetStr = it },
                        label = { Text("Target") },
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = unit,
                        onValueChange = { unit = it },
                        label = { Text("Unit") },
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))
                OutlinedTextField(
                    value = deadline,
                    onValueChange = { deadline = it },
                    label = { Text("Target Date / Deadline") },
                    placeholder = { Text("e.g. End of Semester") },
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(16.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                    TextButton(onClick = onDismiss) { Text("Cancel") }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {
                            val target = targetStr.toDoubleOrNull() ?: 10.0
                            if (title.isNotBlank()) {
                                onSave(title, category, target, unit, deadline)
                            }
                        }
                    ) {
                        Text("Create Goal")
                    }
                }
            }
        }
    }
}

@Composable
fun LogGoalCheckinDialog(
    goal: GoalItemEntity,
    onDismiss: () -> Unit,
    onSave: (Double, String?) -> Unit
) {
    var incrementStr by remember { mutableStateOf("1") }
    var note by remember { mutableStateOf("") }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerHigh),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text("Log Progress", style = MaterialTheme.typography.titleLarge)
                Text(goal.title, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.outline)
                Spacer(modifier = Modifier.height(14.dp))

                OutlinedTextField(
                    value = incrementStr,
                    onValueChange = { incrementStr = it },
                    label = { Text("Add to progress (${goal.unit})") },
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(10.dp))

                OutlinedTextField(
                    value = note,
                    onValueChange = { note = it },
                    label = { Text("Check-in Note") },
                    placeholder = { Text("What milestone action did you complete?") },
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(16.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                    TextButton(onClick = onDismiss) { Text("Cancel") }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {
                            val inc = incrementStr.toDoubleOrNull() ?: 1.0
                            onSave(inc, note)
                        }
                    ) {
                        Text("Save Progress")
                    }
                }
            }
        }
    }
}
