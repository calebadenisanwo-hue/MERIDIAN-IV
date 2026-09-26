package com.example.meridian.data.repository

import com.example.meridian.data.local.MeridianDatabase
import com.example.meridian.data.model.*
import kotlinx.coroutines.flow.Flow
import java.text.SimpleDateFormat
import java.util.*

class MeridianRepository(private val db: MeridianDatabase) {

    private val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())

    fun todayStr(): String = dateFormat.format(Date())

    // 1. Journal
    val allJournalEntries: Flow<List<JournalEntryEntity>> = db.journalDao().getAll()

    suspend fun insertJournal(entry: JournalEntryEntity) = db.journalDao().insert(entry)

    suspend fun deleteJournal(id: String) = db.journalDao().deleteById(id)

    // 2. Study
    val allStudyLogs: Flow<List<StudyLogEntity>> = db.studyDao().getAllLogs()
    val topicProgress: Flow<List<StudyTopicProgressEntity>> = db.studyDao().getTopicProgress()

    suspend fun insertStudyLog(log: StudyLogEntity) = db.studyDao().insertLog(log)

    suspend fun deleteStudyLog(id: String) = db.studyDao().deleteLogById(id)

    suspend fun toggleTopicProgress(topicId: String, completed: Boolean) {
        if (completed) {
            db.studyDao().setTopicProgress(StudyTopicProgressEntity(topicId, true, todayStr()))
        } else {
            db.studyDao().removeTopicProgress(topicId)
        }
    }

    // 3. Recovery
    val allQuits: Flow<List<RecoveryQuitEntity>> = db.recoveryDao().getAllQuits()
    val allRecoveryLogs: Flow<List<RecoveryLogEntity>> = db.recoveryDao().getAllLogs()

    suspend fun insertQuit(quit: RecoveryQuitEntity) = db.recoveryDao().insertQuit(quit)

    suspend fun insertRecoveryLog(log: RecoveryLogEntity) {
        db.recoveryDao().insertLog(log)
    }

    // 4. Finance
    val allAccounts: Flow<List<FinanceAccountEntity>> = db.financeDao().getAllAccounts()
    val allCategories: Flow<List<FinanceCategoryEntity>> = db.financeDao().getAllCategories()
    val allTransactions: Flow<List<FinanceTransactionEntity>> = db.financeDao().getAllTransactions()

    suspend fun insertAccount(acc: FinanceAccountEntity) = db.financeDao().insertAccount(acc)
    suspend fun insertTransaction(txn: FinanceTransactionEntity) = db.financeDao().insertTransaction(txn)
    suspend fun deleteTransaction(id: String) = db.financeDao().deleteTransaction(id)

    // 5. Pulse
    val allPulseLogs: Flow<List<PulseLogEntity>> = db.pulseDao().getAllLogs()
    val allHabits: Flow<List<PulseHabitEntity>> = db.pulseDao().getHabits()

    suspend fun insertPulseLog(log: PulseLogEntity) = db.pulseDao().insertLog(log)
    suspend fun insertHabit(habit: PulseHabitEntity) = db.pulseDao().insertHabit(habit)

    // 6. Goals
    val allGoals: Flow<List<GoalItemEntity>> = db.goalsDao().getGoals()
    val allGoalCheckins: Flow<List<GoalCheckinEntity>> = db.goalsDao().getCheckins()

    suspend fun insertGoal(goal: GoalItemEntity) = db.goalsDao().insertGoal(goal)
    suspend fun insertGoalCheckin(checkin: GoalCheckinEntity) = db.goalsDao().insertCheckin(checkin)
    suspend fun deleteGoal(id: String) = db.goalsDao().deleteGoal(id)

    // 7. Composite History
    val compositeHistory: Flow<List<CompositeHistoryEntity>> = db.compositeDao().getHistory()
    suspend fun recordComposite(composite: Int) {
        db.compositeDao().recordSnapshot(CompositeHistoryEntity(todayStr(), composite))
    }

    // Seed defaults if empty
    suspend fun seedDefaultsIfNeeded() {
        val today = todayStr()
        // Seed default accounts
        db.financeDao().insertAccount(FinanceAccountEntity("bank-main", "Primary Bank Account", "bank", "#22A566", 0L, today))
        db.financeDao().insertAccount(FinanceAccountEntity("cash-wallet", "Cash Wallet", "cash", "#C9963A", 0L, today))

        // Seed default categories
        db.financeDao().insertCategory(FinanceCategoryEntity("exp-food", "Food & Groceries", "expense", "#4FA9E0"))
        db.financeDao().insertCategory(FinanceCategoryEntity("exp-transport", "Transport & Fuel", "expense", "#E8A33D"))
        db.financeDao().insertCategory(FinanceCategoryEntity("exp-books", "Books & Academic Kit", "expense", "#D3A346"))
        db.financeDao().insertCategory(FinanceCategoryEntity("inc-allowance", "Allowance / Salary", "income", "#7CC576"))

        // Seed default habits
        db.pulseDao().insertHabit(PulseHabitEntity("h1", "Morning Movement & Hydration"))
        db.pulseDao().insertHabit(PulseHabitEntity("h2", "Focused Deep Work Sprint"))
        db.pulseDao().insertHabit(PulseHabitEntity("h3", "Active Study / Reading Practice"))
        db.pulseDao().insertHabit(PulseHabitEntity("h4", "Evening Wind-down & Screen Off"))

        // Seed default sample quit tracker
        val sevenDaysAgo = System.currentTimeMillis() - (7L * 24 * 3600 * 1000)
        db.recoveryDao().insertQuit(
            RecoveryQuitEntity(
                id = "quit-1",
                name = "Nicotine & Vaping",
                categoryId = "substance",
                quitTimestamp = sevenDaysAgo,
                reason = "Preserve cardiovascular endurance and mental clarity for med school.",
                urgesLogged = 3,
                longestCleanDays = 7
            )
        )

        // Seed default sample goals
        db.goalsDao().insertGoal(
            GoalItemEntity(
                id = "g-1",
                title = "Complete 200L Anatomy Review",
                categoryId = "academic",
                currentValue = 4.0,
                targetValue = 12.0,
                unit = "modules",
                deadline = "End of Semester"
            )
        )
        db.goalsDao().insertGoal(
            GoalItemEntity(
                id = "g-2",
                title = "Emergency Fund Reserve",
                categoryId = "financial",
                currentValue = 150000.0,
                targetValue = 300000.0,
                unit = "₦",
                deadline = "Dec 2026"
            )
        )
    }
}
