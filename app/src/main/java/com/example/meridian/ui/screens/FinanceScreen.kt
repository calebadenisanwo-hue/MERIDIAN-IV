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
import androidx.compose.ui.window.Dialog
import com.example.meridian.data.model.FinanceAccountEntity
import com.example.meridian.data.model.FinanceCategoryEntity
import com.example.meridian.data.model.FinanceTransactionEntity
import com.example.meridian.util.MetricsEngine

@Composable
fun FinanceScreen(
    accounts: List<FinanceAccountEntity>,
    categories: List<FinanceCategoryEntity>,
    transactions: List<FinanceTransactionEntity>,
    onAddTransaction: (String, Long, String?, String?, String?) -> Unit,
    onDeleteTransaction: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    var showAddDialog by remember { mutableStateOf(false) }

    val totalIncomeKobo = remember(transactions) {
        transactions.filter { it.type == "income" }.sumOf { it.amountKobo }
    }
    val totalExpenseKobo = remember(transactions) {
        transactions.filter { it.type == "expense" }.sumOf { it.amountKobo }
    }
    val netFlowKobo = totalIncomeKobo - totalExpenseKobo

    Scaffold(
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = { showAddDialog = true },
                icon = { Icon(Icons.Default.Add, contentDescription = null) },
                text = { Text("Add Transaction") },
                containerColor = Color(0xFF22A566),
                contentColor = Color.White,
                modifier = Modifier.testTag("add_transaction_fab")
            )
        },
        modifier = modifier.fillMaxSize()
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
                .testTag("finance_screen")
        ) {
            Spacer(modifier = Modifier.height(8.dp))

            // Cash Flow Summary Card
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerHigh),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(
                        text = "FINANCIAL CASH FLOW LEDGER",
                        style = MaterialTheme.typography.labelSmall,
                        color = Color(0xFF22A566),
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = MetricsEngine.formatNaira(netFlowKobo),
                        style = MaterialTheme.typography.displayLarge.copy(fontSize = 38.sp),
                        fontWeight = FontWeight.Bold,
                        color = if (netFlowKobo >= 0) MaterialTheme.colorScheme.onSurface else Color(0xFFE0574B)
                    )
                    Text(
                        text = "Net Cash Surplus / Deficit",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.outline
                    )

                    Spacer(modifier = Modifier.height(16.dp))
                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                    Spacer(modifier = Modifier.height(14.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text("Total Inflow", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.outline)
                            Text(
                                text = "+${MetricsEngine.formatNaira(totalIncomeKobo)}",
                                style = MaterialTheme.typography.titleMedium,
                                color = Color(0xFF22A566),
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text("Total Outflow", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.outline)
                            Text(
                                text = "-${MetricsEngine.formatNaira(totalExpenseKobo)}",
                                style = MaterialTheme.typography.titleMedium,
                                color = Color(0xFFE0574B),
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Daily Headroom & Safe Spend Pace Card
            val totalMonthlyCapKobo = 12000000L // ₦120,000 monthly cap target
            val now = java.util.Calendar.getInstance()
            val dayOfMonth = now.get(java.util.Calendar.DAY_OF_MONTH)
            val maxDaysInMonth = now.getActualMaximum(java.util.Calendar.DAY_OF_MONTH)
            val daysRemaining = maxOf(1, maxDaysInMonth - dayOfMonth + 1)
            val remainingMonthlyCapKobo = maxOf(0L, totalMonthlyCapKobo - totalExpenseKobo)
            val dailyHeadroomKobo = remainingMonthlyCapKobo / daysRemaining
            val todayStr = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).format(java.util.Date())
            val todaySpentKobo = transactions.filter { it.type == "expense" && it.date == todayStr }.sumOf { it.amountKobo }
            val todayBufferLeftKobo = dailyHeadroomKobo - todaySpentKobo
            val isOverPace = todayBufferLeftKobo < 0

            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerHigh),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(if (isOverPace) Color(0xFFE0574B).copy(alpha = 0.2f) else Color(0xFF22A566).copy(alpha = 0.2f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = if (isOverPace) Icons.Default.Warning else Icons.Default.CheckCircle,
                                    contentDescription = null,
                                    tint = if (isOverPace) Color(0xFFE0574B) else Color(0xFF22A566),
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(
                                    text = "DAILY BUDGET HEADROOM",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.primary,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = if (isOverPace) "Over Daily Target Pace" else "Safe Daily Buffer",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }

                        Surface(
                            shape = CircleShape,
                            color = MaterialTheme.colorScheme.surfaceContainerHighest
                        ) {
                            Text(
                                text = "$daysRemaining days left",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.outline,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Text(
                        text = if (isOverPace) "-${MetricsEngine.formatNaira(kotlin.math.abs(todayBufferLeftKobo))} over target" else "${MetricsEngine.formatNaira(todayBufferLeftKobo)} remaining today",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold,
                        color = if (isOverPace) Color(0xFFE0574B) else Color(0xFF22A566)
                    )

                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Target pace: ${MetricsEngine.formatNaira(dailyHeadroomKobo)}/day · Today spent: ${MetricsEngine.formatNaira(todaySpentKobo)}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.outline
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Accounts Carousel
            Text("ACCOUNTS", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(6.dp))
            LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                items(accounts) { acc ->
                    val accTxns = transactions.filter { it.accountId == acc.id }
                    val inc = accTxns.filter { it.type == "income" }.sumOf { it.amountKobo }
                    val exp = accTxns.filter { it.type == "expense" }.sumOf { it.amountKobo }
                    val bal = acc.openingKobo + inc - exp

                    Surface(
                        shape = RoundedCornerShape(14.dp),
                        color = MaterialTheme.colorScheme.surfaceContainer,
                        modifier = Modifier.width(180.dp)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(10.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFF22A566))
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(acc.name, style = MaterialTheme.typography.titleMedium, maxLines = 1)
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = MetricsEngine.formatNaira(bal),
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = acc.kind.uppercase(),
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.outline
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Recent Transactions List
            Text("RECENT TRANSACTIONS", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(8.dp))

            if (transactions.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No transactions logged yet.", color = MaterialTheme.colorScheme.outline)
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    contentPadding = PaddingValues(bottom = 80.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    items(transactions, key = { it.id }) { txn ->
                        TransactionRowItem(txn = txn, onDelete = { onDeleteTransaction(txn.id) })
                    }
                }
            }
        }
    }

    if (showAddDialog) {
        AddTransactionDialog(
            categories = categories,
            onDismiss = { showAddDialog = false },
            onSave = { type, amountKobo, merchant, catId, note ->
                onAddTransaction(type, amountKobo, merchant, catId, note)
                showAddDialog = false
            }
        )
    }
}

@Composable
fun TransactionRowItem(txn: FinanceTransactionEntity, onDelete: () -> Unit) {
    val isIncome = txn.type == "income"
    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainer),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(if (isIncome) Color(0xFF22A566).copy(alpha = 0.15f) else Color(0xFFE0574B).copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = if (isIncome) Icons.Default.ArrowDownward else Icons.Default.ArrowUpward,
                    contentDescription = null,
                    tint = if (isIncome) Color(0xFF22A566) else Color(0xFFE0574B)
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(txn.merchant ?: txn.type.uppercase(), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                Text("${txn.date} • ${txn.note ?: "Cash transaction"}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.outline)
            }
            Text(
                text = (if (isIncome) "+" else "-") + MetricsEngine.formatNaira(txn.amountKobo),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = if (isIncome) Color(0xFF22A566) else Color(0xFFE0574B)
            )
            IconButton(onClick = onDelete, modifier = Modifier.size(28.dp)) {
                Icon(Icons.Outlined.Delete, contentDescription = "Delete", tint = MaterialTheme.colorScheme.outline, modifier = Modifier.size(16.dp))
            }
        }
    }
}

@Composable
fun AddTransactionDialog(
    categories: List<FinanceCategoryEntity>,
    onDismiss: () -> Unit,
    onSave: (String, Long, String, String?, String?) -> Unit
) {
    var type by remember { mutableStateOf("expense") }
    var amountNaira by remember { mutableStateOf("") }
    var merchant by remember { mutableStateOf("") }
    var note by remember { mutableStateOf("") }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainerHigh),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text("Record Transaction", style = MaterialTheme.typography.titleLarge)
                Spacer(modifier = Modifier.height(12.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(
                        selected = type == "expense",
                        onClick = { type = "expense" },
                        label = { Text("Expense") },
                        modifier = Modifier.weight(1f)
                    )
                    FilterChip(
                        selected = type == "income",
                        onClick = { type = "income" },
                        label = { Text("Income") },
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))
                OutlinedTextField(
                    value = amountNaira,
                    onValueChange = { amountNaira = it },
                    label = { Text("Amount (₦ Naira)") },
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(10.dp))
                OutlinedTextField(
                    value = merchant,
                    onValueChange = { merchant = it },
                    label = { Text("Merchant / Entity") },
                    placeholder = { Text("e.g. Supermarket, Bookshop, Stipend") },
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(10.dp))
                OutlinedTextField(
                    value = note,
                    onValueChange = { note = it },
                    label = { Text("Notes (optional)") },
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(16.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                    TextButton(onClick = onDismiss) { Text("Cancel") }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {
                            val nairaVal = amountNaira.toLongOrNull() ?: 0L
                            val koboVal = nairaVal * 100L
                            if (koboVal > 0) {
                                onSave(type, koboVal, merchant, null, note)
                            }
                        }
                    ) {
                        Text("Save Transaction")
                    }
                }
            }
        }
    }
}
