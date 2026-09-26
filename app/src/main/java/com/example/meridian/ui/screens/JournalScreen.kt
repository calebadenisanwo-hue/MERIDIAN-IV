package com.example.meridian.ui.screens

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
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.meridian.data.model.JournalEntryEntity
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun JournalScreen(
    entries: List<JournalEntryEntity>,
    onAddEntry: (String, String?, Boolean) -> Unit,
    onTogglePin: (JournalEntryEntity) -> Unit,
    onDeleteEntry: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    var searchQuery by remember { mutableStateOf("") }
    var selectedTag by remember { mutableStateOf<String?>(null) }
    var showNewEntryDialog by remember { mutableStateOf(false) }

    val allTags = remember(entries) {
        entries.mapNotNull { it.tag }.distinct().sorted()
    }

    val filteredEntries = remember(entries, searchQuery, selectedTag) {
        entries.filter { entry ->
            val matchesSearch = searchQuery.isBlank() || entry.text.contains(searchQuery, ignoreCase = true)
            val matchesTag = selectedTag == null || entry.tag == selectedTag
            matchesSearch && matchesTag
        }.sortedWith(compareByDescending<JournalEntryEntity> { it.pinned }.thenByDescending { it.timestamp })
    }

    Scaffold(
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = { showNewEntryDialog = true },
                icon = { Icon(Icons.Default.Edit, contentDescription = null) },
                text = { Text("New Reflection") },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = MaterialTheme.colorScheme.onPrimary,
                modifier = Modifier.testTag("new_journal_fab")
            )
        },
        modifier = modifier.fillMaxSize()
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
                .testTag("journal_screen")
        ) {
            Spacer(modifier = Modifier.height(8.dp))

            // Search Bar
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Search logs, thoughts, tags...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(onClick = { searchQuery = "" }) {
                            Icon(Icons.Default.Clear, contentDescription = "Clear")
                        }
                    }
                },
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("journal_search_input")
            )

            Spacer(modifier = Modifier.height(10.dp))

            // Tag Filters
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                item {
                    FilterChip(
                        selected = selectedTag == null,
                        onClick = { selectedTag = null },
                        label = { Text("All (${entries.size})") }
                    )
                }
                items(allTags) { tag ->
                    FilterChip(
                        selected = selectedTag == tag,
                        onClick = { selectedTag = if (selectedTag == tag) null else tag },
                        label = { Text("#$tag") }
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Entries List
            if (filteredEntries.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            imageVector = Icons.Outlined.Book,
                            contentDescription = null,
                            modifier = Modifier.size(64.dp),
                            tint = MaterialTheme.colorScheme.outline
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = if (entries.isEmpty()) "Your Logbook is Empty" else "No matching entries",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold
                        )
                        Text(
                            text = "Tap 'New Reflection' to log your insights, mental frameworks, or wins.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.outline
                        )
                    }
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    contentPadding = PaddingValues(bottom = 80.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    items(filteredEntries, key = { it.id }) { entry ->
                        JournalEntryCard(
                            entry = entry,
                            onTogglePin = { onTogglePin(entry) },
                            onDelete = { onDeleteEntry(entry.id) }
                        )
                    }
                }
            }
        }
    }

    if (showNewEntryDialog) {
        NewJournalDialog(
            onDismiss = { showNewEntryDialog = false },
            onSave = { text, tag, pinned ->
                onAddEntry(text, tag, pinned)
                showNewEntryDialog = false
            }
        )
    }
}

@Composable
fun JournalEntryCard(
    entry: JournalEntryEntity,
    onTogglePin: () -> Unit,
    onDelete: () -> Unit
) {
    val dateDisplay = remember(entry.timestamp) {
        val sdf = SimpleDateFormat("MMM d, yyyy • h:mm a", Locale.getDefault())
        sdf.format(Date(entry.timestamp))
    }

    Card(
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (entry.pinned) MaterialTheme.colorScheme.surfaceContainerHigh else MaterialTheme.colorScheme.surfaceContainer
        ),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    if (entry.pinned) {
                        Icon(
                            imageVector = Icons.Default.PushPin,
                            contentDescription = "Pinned",
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                    }
                    Text(
                        text = dateDisplay,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.outline
                    )
                }

                Row {
                    IconButton(onClick = onTogglePin, modifier = Modifier.size(32.dp)) {
                        Icon(
                            imageVector = if (entry.pinned) Icons.Filled.PushPin else Icons.Outlined.PushPin,
                            contentDescription = "Pin Entry",
                            tint = if (entry.pinned) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                    IconButton(onClick = onDelete, modifier = Modifier.size(32.dp)) {
                        Icon(
                            imageVector = Icons.Outlined.Delete,
                            contentDescription = "Delete",
                            tint = MaterialTheme.colorScheme.outline,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = entry.text,
                style = MaterialTheme.typography.bodyLarge,
                lineHeight = 22.sp
            )

            if (!entry.tag.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(12.dp))
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = MaterialTheme.colorScheme.primary.copy(alpha = 0.12f)
                ) {
                    Text(
                        text = "#${entry.tag}",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun NewJournalDialog(
    onDismiss: () -> Unit,
    onSave: (String, String?, Boolean) -> Unit
) {
    var text by remember { mutableStateOf("") }
    var tag by remember { mutableStateOf("") }
    var pinned by remember { mutableStateOf(false) }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerHigh),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(
                    text = "New Reflection",
                    style = MaterialTheme.typography.titleLarge
                )
                Spacer(modifier = Modifier.height(14.dp))
                OutlinedTextField(
                    value = text,
                    onValueChange = { text = it },
                    placeholder = { Text("What did you learn or observe today?") },
                    minLines = 5,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(10.dp))
                OutlinedTextField(
                    value = tag,
                    onValueChange = { tag = it },
                    placeholder = { Text("Tag (e.g. intellect, stoicism, focus)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(10.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = pinned, onCheckedChange = { pinned = it })
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Pin this reflection to the top", style = MaterialTheme.typography.bodyMedium)
                }
                Spacer(modifier = Modifier.height(16.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                    TextButton(onClick = onDismiss) { Text("Cancel") }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {
                            if (text.isNotBlank()) {
                                onSave(text, tag.trim().removePrefix("#"), pinned)
                            }
                        }
                    ) {
                        Text("Save Entry")
                    }
                }
            }
        }
    }
}
