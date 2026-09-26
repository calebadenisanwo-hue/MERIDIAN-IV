package com.example.meridian.util

import com.example.meridian.data.model.*
import java.text.SimpleDateFormat
import java.util.*
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

object MetricsEngine {

    private val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())

    fun todayStr(): String = dateFormat.format(Date())

    fun daysAgoStr(days: Int): String {
        val cal = Calendar.getInstance()
        cal.add(Calendar.DAY_OF_YEAR, -days)
        return dateFormat.format(cal.time)
    }

    fun formatNaira(kobo: Long): String {
        val naira = (kobo.toDouble() / 100.0).roundToInt()
        val sign = if (naira < 0) "-" else ""
        return "${sign}₦%,d".format(Locale.US, kotlin.math.abs(naira))
    }

    fun clamp(value: Int, min: Int = 0, max: Int = 100): Int = max(min, min(max, value))

    fun computeSystemScores(
        journal: List<JournalEntryEntity>,
        study: List<StudyLogEntity>,
        quits: List<RecoveryQuitEntity>,
        transactions: List<FinanceTransactionEntity>,
        pulseLogs: List<PulseLogEntity>,
        goals: List<GoalItemEntity>,
        goalCheckins: List<GoalCheckinEntity>
    ): SystemScores {
        val now = System.currentTimeMillis()
        val sevenDaysMs = 7L * 24 * 3600 * 1000

        // 1. Journal Score (5-7 entries per week is 100%)
        val last7JournalCount = journal.count { now - it.timestamp <= sevenDaysMs }
        val journalScore = clamp(((last7JournalCount.toDouble() / 5.0) * 100).roundToInt())

        // 2. Study Score (Weekly study minutes vs 1200 target mins)
        val d6 = daysAgoStr(6)
        val studyMins = study.filter { it.date >= d6 }.sumOf { it.durationMins }
        val studyScore = clamp(((studyMins.toDouble() / 1200.0) * 100).roundToInt())

        // 3. Recovery Score (Streak days vs 60d standard)
        val longestClean = quits.maxOfOrNull { quit ->
            max(0L, (now - quit.quitTimestamp) / (24 * 3600 * 1000)).toInt()
        } ?: 0
        val recoveryScore = clamp(((longestClean.toDouble() / 60.0) * 100).roundToInt())

        // 4. Finance Score (Monthly savings rate)
        val thisMonthPrefix = todayStr().take(7)
        val monthTxns = transactions.filter { it.date.startsWith(thisMonthPrefix) }
        val incomeKobo = monthTxns.filter { it.type == "income" }.sumOf { it.amountKobo }
        val expenseKobo = monthTxns.filter { it.type == "expense" }.sumOf { it.amountKobo }
        val savingsRate = if (incomeKobo > 0) {
            (((incomeKobo - expenseKobo).toDouble() / incomeKobo.toDouble()) * 100).roundToInt()
        } else {
            50
        }
        val financeScore = clamp(50 + (savingsRate * 0.5).roundToInt())

        // 5. Pulse Check-in Score (Days logged in last 7)
        val pulseDaysCount = pulseLogs.filter { it.date >= d6 }.distinctBy { it.date }.size
        val pulseScore = clamp(((pulseDaysCount.toDouble() / 7.0) * 100).roundToInt())

        // 6. Goals Score (Average completion of active goals)
        val activeGoals = goals.filter { !it.archived }
        val goalsScore = if (activeGoals.isNotEmpty()) {
            val avgPct = activeGoals.map { goal ->
                if (goal.targetType == "numeric") {
                    val progress = goalCheckins.filter { it.goalId == goal.id }.sumOf { it.value }
                    min(100.0, (progress / max(1.0, goal.targetValue)) * 100)
                } else {
                    val checkedRecent = goalCheckins.any { it.goalId == goal.id && it.date >= daysAgoStr(1) }
                    if (checkedRecent) 100.0 else 50.0
                }
            }.average()
            clamp(avgPct.roundToInt())
        } else {
            75
        }

        return SystemScores(
            journalScore = journalScore,
            studyScore = studyScore,
            recoveryScore = recoveryScore,
            financeScore = financeScore,
            checkinScore = pulseScore,
            goalsScore = goalsScore
        )
    }

    fun computeWeightedComposite(scores: SystemScores, weights: SystemWeights): Int {
        val total = weights.journal + weights.study + weights.recovery + weights.finance + weights.checkin + weights.goals
        if (total <= 0f) return 75
        val weightedSum = (scores.journalScore * weights.journal) +
                (scores.studyScore * weights.study) +
                (scores.recoveryScore * weights.recovery) +
                (scores.financeScore * weights.finance) +
                (scores.checkinScore * weights.checkin) +
                (scores.goalsScore * weights.goals)
        return (weightedSum / total).roundToInt()
    }

    fun buildTodaysMove(scores: SystemScores): TodaysMove {
        val list = listOf(
            Triple(scores.journalScore, ModuleRoute.JOURNAL, "Logbook"),
            Triple(scores.studyScore, ModuleRoute.STUDY, "Study Ledger"),
            Triple(scores.recoveryScore, ModuleRoute.RECOVERY, "Unbound Recovery"),
            Triple(scores.financeScore, ModuleRoute.FINANCE, "Finance"),
            Triple(scores.checkinScore, ModuleRoute.PULSE, "Pulse Check-in"),
            Triple(scores.goalsScore, ModuleRoute.GOALS, "Goals")
        ).sortedBy { it.first }

        val weakest = list.first()
        val recommendation = when {
            weakest.first < 40 -> "${weakest.third} is operating below baseline (${weakest.first}/100). A focused 15-minute action here produces your highest compound yield today."
            weakest.first < 70 -> "${weakest.third} has room for momentum (${weakest.first}/100). Log one key action to elevate your weekly trajectory."
            else -> "All systems are executing with high velocity! Complete a quick active recall session or journal reflection to preserve compound momentum."
        }

        val color = when (weakest.second) {
            ModuleRoute.JOURNAL -> "#805B9A"
            ModuleRoute.STUDY -> "#2D6A4F"
            ModuleRoute.RECOVERY -> "#C9963A"
            ModuleRoute.FINANCE -> "#3FBF80"
            ModuleRoute.PULSE -> "#E0574B"
            ModuleRoute.GOALS -> "#4FA9E0"
            else -> "#78DC77"
        }

        return TodaysMove(
            label = weakest.third,
            route = weakest.second,
            colorHex = color,
            score = weakest.first,
            recommendation = recommendation
        )
    }

    fun computeLifeWAR(composite: Int, scores: SystemScores): LifeWARSummary {
        // Sabermetric Life WAR calculation
        val baseline = 50.0
        val totalWAR = ((composite - baseline) / 10.0).coerceAtLeast(0.0)
        val seasonWAR = (totalWAR * 1.8)

        val cognitiveWAR = max(0.0, (scores.studyScore - baseline) / 12.0)
        val disciplineWAR = max(0.0, (scores.recoveryScore - baseline) / 12.0)
        val capitalWAR = max(0.0, (scores.financeScore - baseline) / 12.0)
        val vitalityWAR = max(0.0, (scores.checkinScore - baseline) / 12.0)

        val wins = max(1, (composite * 0.22).roundToInt())
        val losses = max(0, ((100 - composite) * 0.08).roundToInt())
        val draws = 2
        val totalGames = wins + losses + draws
        val winPct = if (totalGames > 0) ((wins.toDouble() / totalGames) * 100).roundToInt() else 50

        return LifeWARSummary(
            totalWAR = ((totalWAR * 10).roundToInt() / 10.0),
            seasonWAR = ((seasonWAR * 10).roundToInt() / 10.0),
            winLossRecord = "${wins}W - ${losses}L - ${draws}D (${winPct}%)",
            cognitiveWAR = ((cognitiveWAR * 10).roundToInt() / 10.0),
            disciplineWAR = ((disciplineWAR * 10).roundToInt() / 10.0),
            capitalWAR = ((capitalWAR * 10).roundToInt() / 10.0),
            vitalityWAR = ((vitalityWAR * 10).roundToInt() / 10.0)
        )
    }

    fun computeScoreboard(
        journal: List<JournalEntryEntity>,
        study: List<StudyLogEntity>,
        recoveryLogs: List<RecoveryLogEntity>,
        transactions: List<FinanceTransactionEntity>,
        pulse: List<PulseLogEntity>,
        goals: List<GoalCheckinEntity>
    ): List<ScoreboardRow> {
        val now = System.currentTimeMillis()
        val d7 = 7L * 24 * 3600 * 1000
        val d14 = 14L * 24 * 3600 * 1000

        // Journal
        val jThis = journal.count { now - it.timestamp <= d7 }
        val jLast = journal.count { (now - it.timestamp) in (d7 + 1)..d14 }

        // Study
        val sThis = study.filter { it.date >= daysAgoStr(6) }.sumOf { it.durationMins } / 60.0
        val sLast = study.filter { it.date in daysAgoStr(13)..daysAgoStr(7) }.sumOf { it.durationMins } / 60.0

        // Recovery slips (fewer is better)
        val rThis = recoveryLogs.count { it.type == "reset" && it.date >= daysAgoStr(6) }
        val rLast = recoveryLogs.count { it.type == "reset" && it.date in daysAgoStr(13)..daysAgoStr(7) }

        // Finance net
        var fThis = 0L
        var fLast = 0L
        transactions.forEach { t ->
            if (t.date >= daysAgoStr(6)) {
                if (t.type == "income") fThis += t.amountKobo else if (t.type == "expense") fThis -= t.amountKobo
            } else if (t.date in daysAgoStr(13)..daysAgoStr(7)) {
                if (t.type == "income") fLast += t.amountKobo else if (t.type == "expense") fLast -= t.amountKobo
            }
        }

        // Pulse check-ins
        val pThis = pulse.filter { it.date >= daysAgoStr(6) }.distinctBy { it.date }.size
        val pLast = pulse.filter { it.date in daysAgoStr(13)..daysAgoStr(7) }.distinctBy { it.date }.size

        // Goals actions
        val gThis = goals.count { it.date >= daysAgoStr(6) }
        val gLast = goals.count { it.date in daysAgoStr(13)..daysAgoStr(7) }

        return listOf(
            makeScoreboardRow("journal", "Journal Reflections", "entries", jThis.toDouble(), jLast.toDouble(), "$jThis"),
            makeScoreboardRow("study", "Study Output", "hrs", sThis, sLast, "%.1fh".format(sThis)),
            makeScoreboardRow("recovery", "Clean Integrity", "slips", rThis.toDouble(), rLast.toDouble(), "$rThis slips", invert = true),
            makeScoreboardRow("finance", "Cash Net Flow", "₦", (fThis / 100).toDouble(), (fLast / 100).toDouble(), formatNaira(fThis)),
            makeScoreboardRow("checkin", "Pulse Frequency", "days", pThis.toDouble(), pLast.toDouble(), "${pThis}d"),
            makeScoreboardRow("goals", "Goal Check-ins", "actions", gThis.toDouble(), gLast.toDouble(), "$gThis")
        )
    }

    private fun makeScoreboardRow(
        key: String,
        label: String,
        unit: String,
        thisVal: Double,
        lastVal: Double,
        fmtThis: String,
        invert: Boolean = false
    ): ScoreboardRow {
        val diff = thisVal - lastVal
        val direction = when {
            diff > 0 -> if (invert) "neg" else "pos"
            diff < 0 -> if (invert) "pos" else "neg"
            else -> "flat"
        }
        val pct = if (lastVal != 0.0) ((diff / kotlin.math.abs(lastVal)) * 100).roundToInt() else if (thisVal > 0) 100 else 0
        return ScoreboardRow(key, label, unit, thisVal, lastVal, diff, direction, pct, fmtThis)
    }

    fun computeCrossCorrelations(
        study: List<StudyLogEntity>,
        recoveryLogs: List<RecoveryLogEntity>,
        pulse: List<PulseLogEntity>,
        transactions: List<FinanceTransactionEntity>
    ): List<CrossCorrelationInsight> {
        val insights = mutableListOf<CrossCorrelationInsight>()

        // 1. Sleep vs Study Output
        val sleepStudyPairs = pulse.filter { it.sleepHours != null }.map { p ->
            val totalMins = study.filter { it.date == p.date }.sumOf { it.durationMins }
            p.sleepHours!! to totalMins
        }
        if (sleepStudyPairs.size >= 2) {
            val highSleep = sleepStudyPairs.filter { it.first >= 7.5 }
            val lowSleep = sleepStudyPairs.filter { it.first < 7.0 }
            val avgHigh = if (highSleep.isNotEmpty()) highSleep.map { it.second }.average() else 0.0
            val avgLow = if (lowSleep.isNotEmpty()) lowSleep.map { it.second }.average() else 0.0
            if (avgHigh > avgLow + 15) {
                insights.add(
                    CrossCorrelationInsight(
                        tag = "SLEEP ↔ STUDY OUTPUT",
                        text = "You log ~${(avgHigh - avgLow).roundToInt()} more study minutes on days following 7.5+ hours of sleep. Prioritizing rest acts as a focus multiplier.",
                        colorHex = "#2D6A4F"
                    )
                )
            }
        }

        // 2. Mood vs Urges in Recovery
        val moodUrgePairs = pulse.filter { it.mood != null }.map { p ->
            val urges = recoveryLogs.count { it.date == p.date }
            p.mood!! to urges
        }
        if (moodUrgePairs.size >= 2) {
            val lowMoodUrges = moodUrgePairs.filter { it.first <= 2.5 && it.second > 0 }
            if (lowMoodUrges.isNotEmpty()) {
                insights.add(
                    CrossCorrelationInsight(
                        tag = "MOOD ↔ CRAVINGS",
                        text = "Urges concentrate heavily when self-reported mood falls below 3/5. Consider scheduling restorative breathing exercises on lower energy days.",
                        colorHex = "#C9963A"
                    )
                )
            }
        }

        // 3. Financial Runway
        val d30 = daysAgoStr(30)
        val last30Expenses = transactions.filter { it.type == "expense" && it.date >= d30 }.sumOf { it.amountKobo }
        if (last30Expenses > 0) {
            val dailyBurn = last30Expenses / 30L
            insights.add(
                CrossCorrelationInsight(
                    tag = "FINANCIAL RUNWAY",
                    text = "Current 30-day average daily burn rate is ${formatNaira(dailyBurn)}/day. Liquidity buffers maintain your operational peace of mind.",
                    colorHex = "#3FBF80"
                )
            )
        }

        if (insights.isEmpty()) {
            insights.add(
                CrossCorrelationInsight(
                    tag = "CROSS-MODULE SYNERGY",
                    text = "Log check-ins across Study, Sleep, and Recovery to unveil latent cross-variable behavioral advantages.",
                    colorHex = "#78DC77"
                )
            )
        }

        return insights
    }
}
