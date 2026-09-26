package com.example.meridian.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

enum class ModuleRoute(val routeName: String, val title: String) {
    OVERVIEW("overview", "Overview"),
    TIMELINE("timeline", "Timeline"),
    JOURNAL("journal", "Logbook"),
    STUDY("study", "Study Ledger"),
    RECOVERY("recovery", "Unbound"),
    FINANCE("finance", "Finance"),
    PULSE("checkin", "Pulse"),
    GOALS("goals", "Goals")
}

enum class MaterialThemePalette(val id: String, val label: String) {
    BOTANICAL("botanical", "Botanical"),
    OCEAN("ocean", "Ocean"),
    TERRACOTTA("terracotta", "Terracotta"),
    LAVENDER("lavender", "Lavender"),
    ROSE("rose", "Rose"),
    MONOCHROME("monochrome", "Monochrome")
}

enum class ThemeMode {
    LIGHT, DARK, SYSTEM
}

/* 1. Journal Entity */
@Entity(tableName = "journal_entries")
data class JournalEntryEntity(
    @PrimaryKey val id: String,
    val text: String,
    val tag: String? = null,
    val pinned: Boolean = false,
    val timestamp: Long = System.currentTimeMillis(),
    val dateStr: String // YYYY-MM-DD
)

/* 2. Study Entities */
@Entity(tableName = "study_logs")
data class StudyLogEntity(
    @PrimaryKey val id: String,
    val date: String, // YYYY-MM-DD
    val subjectId: String?,
    val durationMins: Int,
    val focusScore: Int = 4, // 1-5
    val topic: String? = null,
    val topicId: String? = null,
    val note: String? = null,
    val timestamp: Long = System.currentTimeMillis()
)

@Entity(tableName = "study_topic_progress")
data class StudyTopicProgressEntity(
    @PrimaryKey val topicId: String,
    val completed: Boolean = true,
    val completedDate: String
)

/* 3. Recovery Entities */
@Entity(tableName = "recovery_quits")
data class RecoveryQuitEntity(
    @PrimaryKey val id: String,
    val name: String,
    val categoryId: String,
    val quitTimestamp: Long,
    val reason: String? = null,
    val urgesLogged: Int = 0,
    val longestCleanDays: Int = 0
)

@Entity(tableName = "recovery_logs")
data class RecoveryLogEntity(
    @PrimaryKey val id: String,
    val quitId: String,
    val date: String, // YYYY-MM-DD
    val type: String, // "urge" or "reset"
    val note: String? = null,
    val timestamp: Long = System.currentTimeMillis()
)

/* 4. Finance Entities */
@Entity(tableName = "finance_accounts")
data class FinanceAccountEntity(
    @PrimaryKey val id: String,
    val name: String,
    val kind: String, // "bank" or "cash"
    val accentHex: String,
    val openingKobo: Long = 0L,
    val openingDate: String
)

@Entity(tableName = "finance_categories")
data class FinanceCategoryEntity(
    @PrimaryKey val id: String,
    val name: String,
    val kind: String, // "expense" or "income"
    val colorHex: String
)

@Entity(tableName = "finance_transactions")
data class FinanceTransactionEntity(
    @PrimaryKey val id: String,
    val type: String, // "income", "expense", "transfer"
    val date: String, // YYYY-MM-DD
    val accountId: String? = null,
    val categoryId: String? = null,
    val merchant: String? = null,
    val note: String? = null,
    val amountKobo: Long = 0L, // 1 Naira = 100 kobo
    val timestamp: Long = System.currentTimeMillis()
)

/* 5. Pulse (Check-in) Entity */
@Entity(tableName = "pulse_logs")
data class PulseLogEntity(
    @PrimaryKey val id: String,
    val date: String, // YYYY-MM-DD
    val sleepHours: Float? = null,
    val sleepQuality: Int? = null, // 1-5
    val mood: Int? = null, // 1-5
    val energy: Int? = null, // 1-5
    val focus: Int? = null, // 1-5
    val habitsJson: String? = null, // JSON map of habitId -> boolean
    val note: String? = null,
    val timestamp: Long = System.currentTimeMillis()
)

@Entity(tableName = "pulse_habits")
data class PulseHabitEntity(
    @PrimaryKey val id: String,
    val name: String,
    val createdAt: Long = System.currentTimeMillis(),
    val archived: Boolean = false
)

/* 6. Goals Entities */
@Entity(tableName = "goals")
data class GoalItemEntity(
    @PrimaryKey val id: String,
    val title: String,
    val categoryId: String,
    val currentValue: Double,
    val targetValue: Double,
    val unit: String = "",
    val deadline: String? = null,
    val note: String? = null,
    val targetType: String = "numeric", // "numeric" or "boolean"
    val createdAt: Long = System.currentTimeMillis(),
    val archived: Boolean = false
)

@Entity(tableName = "goal_checkins")
data class GoalCheckinEntity(
    @PrimaryKey val id: String,
    val goalId: String,
    val date: String, // YYYY-MM-DD
    val value: Double,
    val note: String? = null,
    val timestamp: Long = System.currentTimeMillis()
)

/* 7. Timeline / Composite Data */
@Entity(tableName = "composite_history")
data class CompositeHistoryEntity(
    @PrimaryKey val date: String, // YYYY-MM-DD
    val composite: Int
)

/* Sabermetric & Dashboard Models */
data class SystemScores(
    val journalScore: Int,
    val studyScore: Int,
    val recoveryScore: Int,
    val financeScore: Int,
    val checkinScore: Int,
    val goalsScore: Int
)

data class SystemWeights(
    val journal: Float = 1f,
    val study: Float = 1f,
    val recovery: Float = 1f,
    val finance: Float = 1f,
    val checkin: Float = 1f,
    val goals: Float = 1f
)

data class ScoreboardRow(
    val key: String,
    val label: String,
    val unit: String,
    val thisVal: Double,
    val lastVal: Double,
    val diff: Double,
    val direction: String, // "pos", "neg", "flat"
    val pct: Int,
    val formattedThis: String
)

data class TodaysMove(
    val label: String,
    val route: ModuleRoute,
    val colorHex: String,
    val score: Int,
    val recommendation: String
)

data class PersonalRecord(
    val label: String,
    val value: String,
    val route: ModuleRoute,
    val colorHex: String,
    val badge: String
)

data class CrossCorrelationInsight(
    val tag: String,
    val text: String,
    val colorHex: String
)

data class LifeWARSummary(
    val totalWAR: Double,
    val seasonWAR: Double,
    val winLossRecord: String, // e.g. "18W - 4L - 2D (78.3%)"
    val cognitiveWAR: Double,
    val disciplineWAR: Double,
    val capitalWAR: Double,
    val vitalityWAR: Double
)

data class UnifiedTimelineItem(
    val id: String,
    val timestamp: Long,
    val date: String,
    val module: ModuleRoute,
    val title: String,
    val detail: String,
    val badge: String? = null,
    val colorHex: String
)
