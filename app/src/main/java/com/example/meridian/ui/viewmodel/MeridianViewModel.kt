package com.example.meridian.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.meridian.data.curriculum.MedicalCurriculum
import com.example.meridian.data.curriculum.StudyDayTopic
import com.example.meridian.data.model.*
import com.example.meridian.data.repository.MeridianRepository
import com.example.meridian.util.MetricsEngine
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.UUID

data class MeridianUiState(
    val isLoading: Boolean = false,
    val currentRoute: ModuleRoute = ModuleRoute.OVERVIEW,
    val palette: MaterialThemePalette = MaterialThemePalette.BOTANICAL,
    val themeMode: ThemeMode = ThemeMode.DARK,
    val weights: SystemWeights = SystemWeights(),
    // Data
    val journalEntries: List<JournalEntryEntity> = emptyList(),
    val studyLogs: List<StudyLogEntity> = emptyList(),
    val completedTopicIds: Set<String> = emptySet(),
    val recoveryQuits: List<RecoveryQuitEntity> = emptyList(),
    val recoveryLogs: List<RecoveryLogEntity> = emptyList(),
    val financeAccounts: List<FinanceAccountEntity> = emptyList(),
    val financeCategories: List<FinanceCategoryEntity> = emptyList(),
    val financeTransactions: List<FinanceTransactionEntity> = emptyList(),
    val pulseLogs: List<PulseLogEntity> = emptyList(),
    val pulseHabits: List<PulseHabitEntity> = emptyList(),
    val goals: List<GoalItemEntity> = emptyList(),
    val goalCheckins: List<GoalCheckinEntity> = emptyList(),
    // Derived Analytics
    val scores: SystemScores = SystemScores(70, 70, 70, 70, 70, 70),
    val composite: Int = 70,
    val lifeWAR: LifeWARSummary = LifeWARSummary(2.0, 3.6, "15W - 3L - 2D (75%)", 1.8, 2.0, 1.9, 2.3),
    val todaysMove: TodaysMove = TodaysMove("Study Ledger", ModuleRoute.STUDY, "#2D6A4F", 65, "Log a study sprint."),
    val scoreboard: List<ScoreboardRow> = emptyList(),
    val correlations: List<CrossCorrelationInsight> = emptyList(),
    val timeline: List<UnifiedTimelineItem> = emptyList()
)

class MeridianViewModel(private val repository: MeridianRepository) : ViewModel() {

    private val _currentRoute = MutableStateFlow(ModuleRoute.OVERVIEW)
    private val _palette = MutableStateFlow(MaterialThemePalette.BOTANICAL)
    private val _themeMode = MutableStateFlow(ThemeMode.DARK)
    private val _weights = MutableStateFlow(SystemWeights())

    val uiState: StateFlow<MeridianUiState> = combine(
        _currentRoute,
        _palette,
        _themeMode,
        _weights,
        repository.allJournalEntries,
        repository.allStudyLogs,
        repository.topicProgress,
        repository.allQuits,
        repository.allRecoveryLogs,
        repository.allAccounts,
        repository.allCategories,
        repository.allTransactions,
        repository.allPulseLogs,
        repository.allHabits,
        repository.allGoals,
        repository.allGoalCheckins
    ) { args: Array<Any> ->
        @Suppress("UNCHECKED_CAST")
        val route = args[0] as ModuleRoute
        val pal = args[1] as MaterialThemePalette
        val mode = args[2] as ThemeMode
        val w = args[3] as SystemWeights
        val journal = args[4] as List<JournalEntryEntity>
        val study = args[5] as List<StudyLogEntity>
        val progress = args[6] as List<StudyTopicProgressEntity>
        val quits = args[7] as List<RecoveryQuitEntity>
        val recLogs = args[8] as List<RecoveryLogEntity>
        val accounts = args[9] as List<FinanceAccountEntity>
        val categories = args[10] as List<FinanceCategoryEntity>
        val txns = args[11] as List<FinanceTransactionEntity>
        val pulse = args[12] as List<PulseLogEntity>
        val habits = args[13] as List<PulseHabitEntity>
        val goals = args[14] as List<GoalItemEntity>
        val checkins = args[15] as List<GoalCheckinEntity>

        val completedSet = progress.map { it.topicId }.toSet()
        val scores = MetricsEngine.computeSystemScores(journal, study, quits, txns, pulse, goals, checkins)
        val composite = MetricsEngine.computeWeightedComposite(scores, w)
        val war = MetricsEngine.computeLifeWAR(composite, scores)
        val move = MetricsEngine.buildTodaysMove(scores)
        val sb = MetricsEngine.computeScoreboard(journal, study, recLogs, txns, pulse, checkins)
        val corr = MetricsEngine.computeCrossCorrelations(study, recLogs, pulse, txns)

        // Build Unified Timeline
        val timelineItems = mutableListOf<UnifiedTimelineItem>()
        journal.forEach { j ->
            timelineItems.add(
                UnifiedTimelineItem(
                    id = "j_${j.id}",
                    timestamp = j.timestamp,
                    date = j.dateStr,
                    module = ModuleRoute.JOURNAL,
                    title = if (j.pinned) "★ Journal Reflection" else "Journal Entry",
                    detail = j.text,
                    badge = j.tag,
                    colorHex = "#805B9A"
                )
            )
        }
        study.forEach { s ->
            timelineItems.add(
                UnifiedTimelineItem(
                    id = "s_${s.id}",
                    timestamp = s.timestamp,
                    date = s.date,
                    module = ModuleRoute.STUDY,
                    title = "Study Sprint: ${s.durationMins} mins",
                    detail = s.topic ?: s.note ?: "Focus Score: ${s.focusScore}/5",
                    badge = "${s.durationMins}m",
                    colorHex = "#2D6A4F"
                )
            )
        }
        recLogs.forEach { r ->
            val isUrge = r.type == "urge"
            timelineItems.add(
                UnifiedTimelineItem(
                    id = "r_${r.id}",
                    timestamp = r.timestamp,
                    date = r.date,
                    module = ModuleRoute.RECOVERY,
                    title = if (isUrge) "Urge Successfully Surfed" else "Reset Logged",
                    detail = r.note ?: (if (isUrge) "Resisted temptation, preserved streak." else "Streak reset with mindful reflection."),
                    badge = if (isUrge) "SURFED" else "RESET",
                    colorHex = if (isUrge) "#3FBF80" else "#E0574B"
                )
            )
        }
        txns.forEach { t ->
            val sign = if (t.type == "income") "+" else if (t.type == "expense") "-" else ""
            timelineItems.add(
                UnifiedTimelineItem(
                    id = "t_${t.id}",
                    timestamp = t.timestamp,
                    date = t.date,
                    module = ModuleRoute.FINANCE,
                    title = "${t.merchant ?: t.type.replaceFirstChar { it.uppercase() }}: $sign${MetricsEngine.formatNaira(t.amountKobo)}",
                    detail = t.note ?: "Transaction in ${t.accountId ?: "main account"}",
                    badge = t.type.uppercase(),
                    colorHex = if (t.type == "income") "#7CC576" else "#4FA9E0"
                )
            )
        }
        pulse.forEach { p ->
            timelineItems.add(
                UnifiedTimelineItem(
                    id = "p_${p.id}",
                    timestamp = p.timestamp,
                    date = p.date,
                    module = ModuleRoute.PULSE,
                    title = "Daily Pulse: Mood ${p.mood ?: "-"}/5, Energy ${p.energy ?: "-"}/5",
                    detail = "Sleep: ${p.sleepHours ?: "-"}h | Note: ${p.note ?: "Checked in"}",
                    badge = "PULSE",
                    colorHex = "#E0574B"
                )
            )
        }
        checkins.forEach { c ->
            timelineItems.add(
                UnifiedTimelineItem(
                    id = "g_${c.id}",
                    timestamp = c.timestamp,
                    date = c.date,
                    module = ModuleRoute.GOALS,
                    title = "Goal Progress: +${c.value}",
                    detail = c.note ?: "Milestone increment",
                    badge = "GOAL",
                    colorHex = "#D3A346"
                )
            )
        }
        timelineItems.sortByDescending { it.timestamp }

        MeridianUiState(
            currentRoute = route,
            palette = pal,
            themeMode = mode,
            weights = w,
            journalEntries = journal,
            studyLogs = study,
            completedTopicIds = completedSet,
            recoveryQuits = quits,
            recoveryLogs = recLogs,
            financeAccounts = accounts,
            financeCategories = categories,
            financeTransactions = txns,
            pulseLogs = pulse,
            pulseHabits = habits,
            goals = goals,
            goalCheckins = checkins,
            scores = scores,
            composite = composite,
            lifeWAR = war,
            todaysMove = move,
            scoreboard = sb,
            correlations = corr,
            timeline = timelineItems,
            isLoading = false
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = MeridianUiState(isLoading = true)
    )

    fun navigateTo(route: ModuleRoute) {
        _currentRoute.value = route
    }

    fun setPalette(palette: MaterialThemePalette) {
        _palette.value = palette
    }

    fun setThemeMode(mode: ThemeMode) {
        _themeMode.value = mode
    }

    fun updateWeights(weights: SystemWeights) {
        _weights.value = weights
    }

    // Journal actions
    fun addJournalEntry(text: String, tag: String?, pinned: Boolean = false) {
        viewModelScope.launch {
            val entry = JournalEntryEntity(
                id = UUID.randomUUID().toString(),
                text = text,
                tag = tag?.takeIf { it.isNotBlank() },
                pinned = pinned,
                timestamp = System.currentTimeMillis(),
                dateStr = MetricsEngine.todayStr()
            )
            repository.insertJournal(entry)
        }
    }

    fun toggleJournalPin(entry: JournalEntryEntity) {
        viewModelScope.launch {
            repository.insertJournal(entry.copy(pinned = !entry.pinned))
        }
    }

    fun deleteJournal(id: String) {
        viewModelScope.launch { repository.deleteJournal(id) }
    }

    // Study actions
    fun logStudySession(durationMins: Int, subjectId: String?, topic: String?, note: String?, focusScore: Int = 4) {
        viewModelScope.launch {
            val log = StudyLogEntity(
                id = UUID.randomUUID().toString(),
                date = MetricsEngine.todayStr(),
                subjectId = subjectId,
                durationMins = durationMins,
                focusScore = focusScore,
                topic = topic,
                note = note
            )
            repository.insertStudyLog(log)
        }
    }

    fun toggleTopicDone(topicId: String, currentDone: Boolean) {
        viewModelScope.launch {
            repository.toggleTopicProgress(topicId, !currentDone)
        }
    }

    // Recovery actions
    fun logUrge(quitId: String, note: String?) {
        viewModelScope.launch {
            val log = RecoveryLogEntity(
                id = UUID.randomUUID().toString(),
                quitId = quitId,
                date = MetricsEngine.todayStr(),
                type = "urge",
                note = note ?: "Urge resisted using grounding techniques."
            )
            repository.insertRecoveryLog(log)
            // Increment urge count
            val quit = uiState.value.recoveryQuits.find { it.id == quitId }
            if (quit != null) {
                repository.insertQuit(quit.copy(urgesLogged = quit.urgesLogged + 1))
            }
        }
    }

    fun logReset(quitId: String, reason: String?) {
        viewModelScope.launch {
            val now = System.currentTimeMillis()
            val log = RecoveryLogEntity(
                id = UUID.randomUUID().toString(),
                quitId = quitId,
                date = MetricsEngine.todayStr(),
                type = "reset",
                note = reason ?: "Reset logged."
            )
            repository.insertRecoveryLog(log)
            val quit = uiState.value.recoveryQuits.find { it.id == quitId }
            if (quit != null) {
                val currentStreakDays = ((now - quit.quitTimestamp) / (24 * 3600 * 1000)).toInt()
                val newLongest = maxOf(quit.longestCleanDays, currentStreakDays)
                repository.insertQuit(
                    quit.copy(
                        quitTimestamp = now,
                        longestCleanDays = newLongest,
                        reason = reason ?: quit.reason
                    )
                )
            }
        }
    }

    // Finance actions
    fun addTransaction(type: String, amountKobo: Long, merchant: String?, categoryId: String?, note: String?) {
        viewModelScope.launch {
            val txn = FinanceTransactionEntity(
                id = UUID.randomUUID().toString(),
                type = type,
                date = MetricsEngine.todayStr(),
                amountKobo = amountKobo,
                merchant = merchant,
                categoryId = categoryId,
                note = note
            )
            repository.insertTransaction(txn)
        }
    }

    fun deleteTransaction(id: String) {
        viewModelScope.launch {
            repository.deleteTransaction(id)
        }
    }

    // Pulse actions
    fun logPulse(sleepHours: Float?, sleepQuality: Int?, mood: Int?, energy: Int?, focus: Int?, note: String?) {
        viewModelScope.launch {
            val log = PulseLogEntity(
                id = UUID.randomUUID().toString(),
                date = MetricsEngine.todayStr(),
                sleepHours = sleepHours,
                sleepQuality = sleepQuality,
                mood = mood,
                energy = energy,
                focus = focus,
                note = note
            )
            repository.insertPulseLog(log)
        }
    }

    // Goals actions
    fun logGoalCheckin(goalId: String, increment: Double, note: String?) {
        viewModelScope.launch {
            val checkin = GoalCheckinEntity(
                id = UUID.randomUUID().toString(),
                goalId = goalId,
                date = MetricsEngine.todayStr(),
                value = increment,
                note = note
            )
            repository.insertGoalCheckin(checkin)
            val goal = uiState.value.goals.find { it.id == goalId }
            if (goal != null) {
                repository.insertGoal(goal.copy(currentValue = goal.currentValue + increment))
            }
        }
    }

    fun addGoal(title: String, categoryId: String, targetValue: Double, unit: String, deadline: String?) {
        viewModelScope.launch {
            val goal = GoalItemEntity(
                id = UUID.randomUUID().toString(),
                title = title,
                categoryId = categoryId,
                currentValue = 0.0,
                targetValue = targetValue,
                unit = unit,
                deadline = deadline
            )
            repository.insertGoal(goal)
        }
    }

    fun deleteGoal(id: String) {
        viewModelScope.launch {
            repository.deleteGoal(id)
        }
    }
}

class MeridianViewModelFactory(private val repository: MeridianRepository) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(MeridianViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return MeridianViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
